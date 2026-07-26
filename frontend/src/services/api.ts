import { supabase } from './supabase';

// ============================================================
// Auth API — conectado a Supabase Auth + tabla profiles
// ============================================================
export const authAPI = {
  register: async ({ email, password, username }: { email: string; password: string; username: string }) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No se pudo crear el usuario');

    // Crear perfil manualmente por si el trigger falla (race condition)
    await supabase.from('profiles').upsert({
      id: authData.user.id,
      username,
      arena_coins: 1000,
    }, { onConflict: 'id' });

    // Registrar bono de bienvenida
    await supabase.from('coin_transactions').insert({
      user_id: authData.user.id,
      amount: 1000,
      description: '🎁 Bono de bienvenida a PredictArena',
    });

    return {
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email || email,
          username,
          arenaCoins: 1000,
          role: 'USER' as const,
        },
        token: authData.session?.access_token || '',
      },
    };
  },

  login: async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Leer perfil real desde tabla profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, arena_coins')
      .eq('id', data.user.id)
      .single();

    const username = profile?.username || data.user.user_metadata?.username || email.split('@')[0];
    const arenaCoins = profile?.arena_coins ?? 1000;

    return {
      data: {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          username,
          arenaCoins,
          role: 'USER' as const,
        },
        token: data.session.access_token,
      },
    };
  },

  // Lee el perfil actualizado desde Supabase (ArenaCoins reales)
  getMe: async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('No autenticado');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, arena_coins')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Si no existe el perfil, lo creamos
      const username = user.user_metadata?.username || user.email?.split('@')[0] || 'Jugador';
      await supabase.from('profiles').upsert({ id: user.id, username, arena_coins: 1000 }, { onConflict: 'id' });
      return {
        data: {
          user: { id: user.id, email: user.email || '', username, arenaCoins: 1000, role: 'USER' as const },
        },
      };
    }

    return {
      data: {
        user: {
          id: user.id,
          email: user.email || '',
          username: profile.username,
          arenaCoins: profile.arena_coins,
          role: 'USER' as const,
        },
      },
    };
  },
};

// ============================================================
// Predictions API — lógica de economía virtual
// ============================================================
export const predictionsAPI = {
  create: async ({ eventId, option, amountBet }: { eventId: string; option: string; amountBet: number }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    // 1. Verificar saldo actual
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('arena_coins')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) throw new Error('No se encontró el perfil del usuario');
    if (profile.arena_coins < amountBet) throw new Error('No tienes suficientes ArenaCoins');

    // 2. Registrar predicción (falla si ya predijo en este evento)
    const { error: predError } = await supabase
      .from('predictions')
      .insert({ user_id: user.id, event_id: eventId, option, amount_bet: amountBet });

    if (predError) {
      if (predError.code === '23505') throw new Error('Ya realizaste una predicción en este evento');
      throw new Error(predError.message);
    }

    // 3. Descontar ArenaCoins
    const newBalance = profile.arena_coins - amountBet;
    await supabase.from('profiles').update({ arena_coins: newBalance }).eq('id', user.id);

    // 4. Registrar transacción
    await supabase.from('coin_transactions').insert({
      user_id: user.id,
      amount: -amountBet,
      description: `🎯 Predicción: "${option}"`,
    });

    return { newBalance };
  },

  // Obtiene el conteo real de predicciones del usuario
  getMyStats: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { total: 0, correct: 0 };

    const { data, error } = await supabase
      .from('predictions')
      .select('status')
      .eq('user_id', user.id);

    if (error || !data) return { total: 0, correct: 0 };

    const total = data.length;
    const correct = data.filter(p => p.status === 'WON').length;
    return { total, correct };
  },
};

// ============================================================
// Events API - conectado a tabla events en Supabase
// ============================================================
export const eventsAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*, predictions(count)')
      .eq('status', 'OPEN')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedEvents = (data || []).map(event => ({
      ...event,
      closesAt: event.closes_at,
      _count: { predictions: event.predictions?.[0]?.count ?? 0 },
    }));

    return { data: { events: formattedEvents } };
  },
};

// ============================================================
// Games API — Minijuegos como Crash
// ============================================================
export const gamesAPI = {
  placeCrashBet: async (amountBet: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    // Descontar inmediatamente la apuesta
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('arena_coins')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) throw new Error('Error al cargar perfil');
    if (profile.arena_coins < amountBet) throw new Error('Fondos insuficientes');

    const newBalance = profile.arena_coins - amountBet;
    await supabase.from('profiles').update({ arena_coins: newBalance }).eq('id', user.id);

    // Registrar apuesta en transacciones
    await supabase.from('coin_transactions').insert({
      user_id: user.id,
      amount: -amountBet,
      description: '🚀 Apostó en Arena Crash',
    });

    return { newBalance };
  },

  winCrashGame: async (amountWon: number, multiplier: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('arena_coins')
      .eq('id', user.id)
      .single();

    const currentBalance = profile?.arena_coins || 0;
    const newBalance = currentBalance + amountWon;
    await supabase.from('profiles').update({ arena_coins: newBalance }).eq('id', user.id);

    await supabase.from('coin_transactions').insert({
      user_id: user.id,
      amount: amountWon,
      description: `🚀 Retiró en Arena Crash (x${multiplier.toFixed(2)})`,
    });

    return { newBalance };
  },

  claimDailyReward: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const amount = 500;
    const { data: profile } = await supabase
      .from('profiles')
      .select('arena_coins')
      .eq('id', user.id)
      .single();

    const currentBalance = profile?.arena_coins || 0;
    const newBalance = currentBalance + amount;

    await supabase.from('profiles').update({ arena_coins: newBalance }).eq('id', user.id);

    await supabase.from('coin_transactions').insert({
      user_id: user.id,
      amount,
      description: '🎁 Recompensa Diaria (+500 ArenaCoins)',
    });

    return { newBalance, amount };
  }
};
