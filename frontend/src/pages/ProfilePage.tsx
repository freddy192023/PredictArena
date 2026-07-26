import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy, LogOut, LayoutDashboard, Save, CheckCircle, User, Palette, Flame } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';
import { computeAchievements } from '../utils/gameLogic';

// ============================================================
// Avatar color options
// ============================================================
const AVATAR_COLORS = [
  { id: 'violet',  bg: 'bg-violet-500',  border: 'border-violet-400',  text: 'text-violet-300',  hex: '#7c3aed' },
  { id: 'arena',   bg: 'bg-purple-500',  border: 'border-purple-400',  text: 'text-purple-300',  hex: '#a855f7' },
  { id: 'blue',    bg: 'bg-blue-500',    border: 'border-blue-400',    text: 'text-blue-300',    hex: '#3b82f6' },
  { id: 'cyan',    bg: 'bg-cyan-500',    border: 'border-cyan-400',    text: 'text-cyan-300',    hex: '#06b6d4' },
  { id: 'green',   bg: 'bg-green-500',   border: 'border-green-400',   text: 'text-green-300',   hex: '#22c55e' },
  { id: 'yellow',  bg: 'bg-yellow-500',  border: 'border-yellow-400',  text: 'text-yellow-300',  hex: '#eab308' },
  { id: 'orange',  bg: 'bg-orange-500',  border: 'border-orange-400',  text: 'text-orange-300',  hex: '#f97316' },
  { id: 'rose',    bg: 'bg-rose-500',    border: 'border-rose-400',    text: 'text-rose-300',    hex: '#f43f5e' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, setUser } = useAuthStore();

  const [username, setUsername] = useState(user?.username || '');
  const [selectedColor, setSelectedColor] = useState(user?.avatarUrl || 'violet');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, correct: 0, coins: user?.arenaCoins || 1000 });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    // Cargar stats reales
    loadStats();
  }, [user, navigate]);

  const loadStats = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('arena_coins, avatar_color')
      .eq('id', authUser.id)
      .single();

    if (profile?.avatar_color) setSelectedColor(profile.avatar_color);
    if (profile?.arena_coins) setStats(prev => ({ ...prev, coins: profile.arena_coins }));

    const { data: preds } = await supabase
      .from('predictions')
      .select('status')
      .eq('user_id', authUser.id);

    setStats(prev => ({
      ...prev,
      total: preds?.length || 0,
      correct: preds?.filter(p => p.status === 'WON').length || 0,
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    if (username.trim().length < 3) return setError('El nombre debe tener al menos 3 caracteres');
    if (username.trim().length > 20) return setError('El nombre no puede superar 20 caracteres');
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) return setError('Solo letras, números y guiones bajos (_)');

    setIsSaving(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: username.trim(), avatar_color: selectedColor })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Actualizar Supabase Auth metadata también
      await supabase.auth.updateUser({ data: { username: username.trim() } });

      // Actualizar store local
      setUser({ ...user, username: username.trim(), avatarUrl: selectedColor }, useAuthStore.getState().token!);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError('Error al guardar. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (!user) return null;

  const colorConfig = AVATAR_COLORS.find(c => c.id === selectedColor) || AVATAR_COLORS[0];
  const achievements = computeAchievements(stats.coins, stats.total, stats.correct);
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const winRate = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

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
            <button onClick={() => navigate('/dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/dashboard' ? 'bg-arena-500/20 text-arena-300' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button onClick={() => navigate('/ranking')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/ranking' ? 'bg-arena-500/20 text-arena-300' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Ranking</span>
            </button>
            <button onClick={() => navigate('/games')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/games' || location.pathname === '/crash' ? 'bg-arena-500/20 text-arena-300' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
              <Flame className="w-4 h-4" />
              <span className="hidden sm:inline">Mini-Juegos</span>
            </button>
            <button onClick={() => navigate('/profile')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/profile' ? 'bg-arena-500/20 text-arena-300' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="coin-badge"><span>🪙</span>{user.arenaCoins.toLocaleString()}</div>
            <button onClick={handleLogout} id="logout-profile"
              className="text-white/40 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
              title="Cerrar sesión">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="relative max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <User className="w-7 h-7 text-arena-300" />
            Mi Perfil
          </h1>
          <p className="text-white/50">Personaliza tu identidad en la Arena</p>
        </div>

        {/* Avatar Preview + Editor */}
        <div className="card-glass p-6 animate-slide-up">
          <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
            <Palette className="w-5 h-5 text-arena-300" /> Apariencia
          </h2>

          {/* Big Avatar Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
            <div className={`w-24 h-24 rounded-2xl ${colorConfig.bg} flex items-center justify-center border-2 ${colorConfig.border} shadow-lg flex-shrink-0 transition-all duration-300`}>
              <span className="text-white text-4xl font-bold font-display">
                {username[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="text-center sm:text-left">
              <p className={`font-display font-bold text-2xl ${colorConfig.text} transition-colors duration-300`}>
                {username || 'Tu nombre'}
              </p>
              <p className="text-white/40 text-sm mt-1">🪙 {stats.coins.toLocaleString()} ArenaCoins</p>
              <p className="text-white/30 text-xs mt-1">
                {unlockedAchievements.length}/{achievements.length} logros • {stats.total} predicciones • {winRate}% precisión
              </p>
            </div>
          </div>

          {/* Color Picker */}
          <div className="mb-6">
            <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 block">
              Color de avatar
            </label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map(color => (
                <button
                  key={color.id}
                  onClick={() => setSelectedColor(color.id)}
                  className={`w-9 h-9 rounded-xl ${color.bg} border-2 transition-all duration-150 ${
                    selectedColor === color.id
                      ? `${color.border} scale-110 shadow-lg`
                      : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                  }`}
                  title={color.id}
                />
              ))}
            </div>
          </div>

          {/* Username editor */}
          <div className="mb-6">
            <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 block">
              Nombre de usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Tu nombre en la Arena"
              maxLength={20}
              className="input-field w-full"
            />
            <p className="text-white/30 text-xs mt-1">
              Solo letras, números y _ · Mínimo 3, máximo 20 caracteres
            </p>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}

          {saveSuccess && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 mb-4">
              <CheckCircle className="w-4 h-4" />
              ¡Perfil actualizado correctamente!
            </div>
          )}

          <button
            id="save-profile-btn"
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        {/* Logros en el perfil */}
        <div className="card-glass p-6 animate-slide-up">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            ⭐ Mis Logros
            <span className="ml-auto text-white/40 text-sm font-normal">
              {unlockedAchievements.length}/{achievements.length}
            </span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {achievements.map(ach => (
              <div
                key={ach.id}
                title={ach.description}
                className={`relative p-3 rounded-xl border flex flex-col items-center gap-2 text-center ${
                  ach.unlocked
                    ? ach.rarity === 'legendary' ? 'border-yellow-500/40 bg-yellow-500/10'
                    : ach.rarity === 'epic' ? 'border-purple-500/40 bg-purple-500/10'
                    : ach.rarity === 'rare' ? 'border-blue-500/40 bg-blue-500/10'
                    : 'border-white/20 bg-white/5'
                    : 'border-white/5 bg-white/[0.02] opacity-40'
                }`}
              >
                <span className={`text-2xl ${!ach.unlocked && 'grayscale'}`}>
                  {ach.unlocked ? ach.icon : '🔒'}
                </span>
                <p className={`text-xs font-semibold ${ach.unlocked ? 'text-white' : 'text-white/30'}`}>
                  {ach.title}
                </p>
                {!ach.unlocked && (
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-arena-400/50 rounded-full" style={{ width: `${ach.progress}%` }} />
                  </div>
                )}
                {ach.unlocked && (
                  <span className={`text-[10px] font-bold uppercase ${
                    ach.rarity === 'legendary' ? 'text-yellow-400'
                    : ach.rarity === 'epic' ? 'text-purple-400'
                    : ach.rarity === 'rare' ? 'text-blue-400'
                    : 'text-white/40'
                  }`}>{ach.rarity}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
