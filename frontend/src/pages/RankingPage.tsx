import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy, LayoutDashboard, LogOut, User as UserIcon, Flame, TrendingUp, Star, Target } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';

interface RankedUser {
  id: string;
  username: string;
  arena_coins: number;
  total_earned: number;
  total_predictions: number;
  correct_predictions: number;
  win_rate: number;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return (
    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/50 text-sm font-bold">
      {rank}
    </span>
  );
}

export default function RankingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [leaders, setLeaders] = useState<RankedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadRanking();
  }, [user, navigate]);

  const loadRanking = async () => {
    setIsLoading(true);
    try {
      // Obtener todos los perfiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, arena_coins')
        .limit(100);

      if (error) throw error;

      // Para cada perfil, calcular monedas TOTALES GANADAS (suma histórica de ingresos positivos)
      const ranked: RankedUser[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Suma de todas las ganancias históricas (transacciones con amount > 0)
          const { data: txns } = await supabase
            .from('coin_transactions')
            .select('amount')
            .eq('user_id', profile.id)
            .gt('amount', 0);

          const totalEarned = txns?.reduce((sum, t) => sum + (t.amount || 0), 0) ?? 0;

          const { data: preds } = await supabase
            .from('predictions')
            .select('status')
            .eq('user_id', profile.id);

          const total = preds?.length ?? 0;
          const correct = preds?.filter(p => p.status === 'WON').length ?? 0;
          return {
            ...profile,
            total_earned: totalEarned,
            total_predictions: total,
            correct_predictions: correct,
            win_rate: total > 0 ? Math.round((correct / total) * 100) : 0,
          };
        })
      );

      // Ordenar por total ganado (histórico) DESC
      ranked.sort((a, b) => b.total_earned - a.total_earned);

      setLeaders(ranked);

      const myIndex = ranked.findIndex(r => r.id === user?.id);
      if (myIndex !== -1) setMyRank(myIndex + 1);
    } catch (err) {
      console.error('Error cargando ranking:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-arena-gradient">
      <div className="fixed inset-0 bg-hero-glow pointer-events-none" />

      {/* Navbar */}
      <nav className="relative border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-arena-500 rounded-lg flex items-center justify-center shadow-arena">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-white text-lg">PredictArena</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/dashboard' ? 'bg-arena-500/20 text-arena-300' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/ranking')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/ranking' ? 'bg-arena-500/20 text-arena-300' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Ranking</span>
            </button>
            <button
              onClick={() => navigate('/games')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/games' || location.pathname === '/crash' ? 'bg-arena-500/20 text-arena-300' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
            >
              <Flame className="w-4 h-4" />
              <span className="hidden sm:inline">Mini-Juegos</span>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/profile' ? 'bg-arena-500/20 text-arena-300' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
            >
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="coin-badge">
              <span>🪙</span>
              {user.arenaCoins.toLocaleString()}
            </div>
            <div className="w-8 h-8 bg-arena-500/30 rounded-full flex items-center justify-center border border-arena-500/40">
              <span className="text-arena-300 text-sm font-bold">{user.username[0].toUpperCase()}</span>
            </div>
            <button
              id="logout-btn-ranking"
              onClick={handleLogout}
              className="text-white/40 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="relative max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-gold-400" />
            Ranking Mundial
          </h1>
          <p className="text-white/50">Ordenado por monedas ganadas históricamente</p>
        </div>

        {/* Info banner */}
        <div className="card-glass p-4 mb-6 border border-arena-500/20 bg-arena-500/5 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-arena-300 shrink-0" />
          <p className="text-white/60 text-sm">
            El ranking se basa en el <span className="text-arena-300 font-semibold">total de monedas ganadas</span> históricamente. Perder monedas no baja tu puesto — ¡solo ganar más te sube!
          </p>
        </div>

        {/* Mi posición */}
        {myRank && (
          <div className="card-glass p-4 mb-6 border border-arena-500/30 bg-arena-500/10 animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-arena-300" />
                <span className="text-white font-medium">Tu posición</span>
              </div>
              <span className="text-arena-300 font-bold text-xl font-display">#{myRank}</span>
            </div>
          </div>
        )}

        {/* Tabla de Ranking */}
        <div className="card-glass overflow-hidden animate-fade-in">
          {/* Cabecera */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-white/10 text-white/40 text-xs font-semibold uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Jugador</div>
            <div className="col-span-3 text-right">
              <span className="flex items-center justify-end gap-1">🏆 Total Ganado</span>
            </div>
            <div className="col-span-2 text-right flex items-center justify-end gap-1">
              <Target className="w-3 h-3" /> Pred.
            </div>
            <div className="col-span-2 text-right flex items-center justify-end gap-1">
              <TrendingUp className="w-3 h-3" /> Precisión
            </div>
          </div>

          {isLoading ? (
            <div className="py-8 flex flex-col items-center gap-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-full px-5 h-14 bg-white/5 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : leaders.length === 0 ? (
            <div className="py-16 text-center">
              <Trophy className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">Aún no hay jugadores en el ranking</p>
            </div>
          ) : (
            <div>
              {leaders.map((leader, idx) => {
                const isMe = leader.id === user.id;
                const rank = idx + 1;
                return (
                  <div
                    key={leader.id}
                    className={`grid grid-cols-12 gap-2 px-5 py-4 items-center border-b border-white/5 last:border-0 transition-colors ${
                      isMe
                        ? 'bg-arena-500/10 border-l-2 border-l-arena-400'
                        : rank <= 3
                        ? 'bg-white/5 hover:bg-white/8'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Rank */}
                    <div className="col-span-1 flex items-center">
                      <RankBadge rank={rank} />
                    </div>

                    {/* Username */}
                    <div className="col-span-4 flex items-center gap-2 overflow-hidden">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        rank === 1 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
                        rank === 2 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/40' :
                        rank === 3 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40' :
                        'bg-arena-500/20 text-arena-300 border border-arena-500/30'
                      }`}>
                        {leader.username[0].toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className={`text-sm font-semibold truncate ${isMe ? 'text-arena-300' : 'text-white'}`}>
                          {leader.username}
                          {isMe && <span className="ml-2 text-xs text-arena-400">(tú)</span>}
                        </p>
                        {rank <= 3 && (
                          <p className="text-xs text-white/30">
                            {rank === 1 ? '👑 Líder de la Arena' : rank === 2 ? '⭐ Elite Predictor' : '🔥 Top Predictor'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Total Ganado */}
                    <div className="col-span-3 text-right">
                      <span className="text-gold-400 font-bold text-sm font-display">
                        🪙 {leader.total_earned.toLocaleString()}
                      </span>
                      <p className="text-white/20 text-xs">saldo: {leader.arena_coins.toLocaleString()}</p>
                    </div>

                    {/* Predicciones */}
                    <div className="col-span-2 text-right">
                      <span className="text-white/70 text-sm">{leader.total_predictions}</span>
                    </div>

                    {/* Precisión */}
                    <div className="col-span-2 text-right">
                      <span className={`text-sm font-semibold ${
                        leader.win_rate >= 70 ? 'text-green-400' :
                        leader.win_rate >= 50 ? 'text-yellow-400' :
                        leader.win_rate > 0 ? 'text-red-400' : 'text-white/30'
                      }`}>
                        {leader.total_predictions > 0 ? `${leader.win_rate}%` : '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Leyenda */}
        <div className="mt-4 flex items-center gap-4 text-xs text-white/30 justify-center">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> ≥70% Experto</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> ≥50% Bueno</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> &lt;50% Novato</span>
        </div>
      </main>
    </div>
  );
}
