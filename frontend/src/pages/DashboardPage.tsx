import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ElementType } from 'react';
import { Trophy, Coins, Target, TrendingUp, LogOut, Star, Clock, Zap, X, CheckCircle, LayoutDashboard, Lock, User as UserIcon, Flame, Rocket, Gift } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { eventsAPI, predictionsAPI, authAPI, gamesAPI } from '../services/api';
import type { User } from '../store/authStore';

// ============================================================
// Achievement Definitions
// ============================================================
interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number; // 0-100
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

function computeAchievements(coins: number, total: number, correct: number): Achievement[] {
  const winRate = total > 0 ? (correct / total) * 100 : 0;
  return [
    {
      id: 'first_steps',
      icon: '🎯',
      title: 'Primeros Pasos',
      description: 'Realiza tu primera predicción',
      unlocked: total >= 1,
      progress: Math.min(100, total * 100),
      rarity: 'common',
    },
    {
      id: 'predictor_5',
      icon: '🔮',
      title: 'Iniciado',
      description: 'Realiza 5 predicciones',
      unlocked: total >= 5,
      progress: Math.min(100, (total / 5) * 100),
      rarity: 'common',
    },
    {
      id: 'predictor_25',
      icon: '⚡',
      title: 'Predictor Activo',
      description: 'Realiza 25 predicciones',
      unlocked: total >= 25,
      progress: Math.min(100, (total / 25) * 100),
      rarity: 'rare',
    },
    {
      id: 'rich',
      icon: '💰',
      title: 'Acumulador',
      description: 'Acumula 2.000 ArenaCoins',
      unlocked: coins >= 2000,
      progress: Math.min(100, (coins / 2000) * 100),
      rarity: 'rare',
    },
    {
      id: 'whale',
      icon: '🐋',
      title: 'La Ballena',
      description: 'Acumula 10.000 ArenaCoins',
      unlocked: coins >= 10000,
      progress: Math.min(100, (coins / 10000) * 100),
      rarity: 'epic',
    },
    {
      id: 'sharp',
      icon: '🎯',
      title: 'Ojo de Halcón',
      description: 'Consigue un 70% de precisión (mín. 5 pred.)',
      unlocked: total >= 5 && winRate >= 70,
      progress: total >= 5 ? Math.min(100, (winRate / 70) * 100) : (total / 5) * 100,
      rarity: 'epic',
    },
    {
      id: 'legend',
      icon: '👑',
      title: 'Leyenda de la Arena',
      description: 'Realiza 100 predicciones con 80%+ precisión',
      unlocked: total >= 100 && winRate >= 80,
      progress: Math.min(100, Math.min(total / 100, winRate >= 80 ? 1 : (winRate / 80)) * 100),
      rarity: 'legendary',
    },
  ];
}

const rarityStyle: Record<string, string> = {
  common:    'border-white/20 bg-white/5',
  rare:      'border-blue-500/40 bg-blue-500/10',
  epic:      'border-purple-500/40 bg-purple-500/10',
  legendary: 'border-yellow-500/40 bg-yellow-500/10',
};
const rarityLabel: Record<string, string> = {
  common:    'text-white/40',
  rare:      'text-blue-400',
  epic:      'text-purple-400',
  legendary: 'text-yellow-400',
};

function AchievementsSection({ coins, total, correct }: { coins: number; total: number; correct: number }) {
  const achievements = computeAchievements(coins, total, correct);
  const unlocked = achievements.filter(a => a.unlocked).length;

  return (
    <section className="mb-8 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-semibold text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-gold-400" />
          Logros
        </h2>
        <span className="text-white/40 text-sm">{unlocked}/{achievements.length} desbloqueados</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {achievements.map((ach) => (
          <div
            key={ach.id}
            title={ach.description}
            className={`relative card-glass p-3 flex flex-col items-center text-center gap-1.5 border transition-all duration-200 ${
              ach.unlocked
                ? `${rarityStyle[ach.rarity]} hover:-translate-y-1 hover:shadow-lg cursor-default`
                : 'border-white/5 bg-white/[0.02] opacity-50 grayscale'
            }`}
          >
            {/* Rarity dot */}
            {ach.unlocked && (
              <div className={`absolute top-2 right-2 text-xs font-bold uppercase tracking-wider text-[10px] ${rarityLabel[ach.rarity]}`}>
                {ach.rarity === 'legendary' ? '★' : ach.rarity === 'epic' ? '◆' : ach.rarity === 'rare' ? '●' : ''}
              </div>
            )}

            {/* Icon */}
            <div className={`text-3xl ${ach.unlocked ? '' : 'text-white/20'}`}>
              {ach.unlocked ? ach.icon : <Lock className="w-6 h-6 text-white/20" />}
            </div>

            {/* Title */}
            <p className={`text-xs font-semibold leading-tight ${ach.unlocked ? 'text-white' : 'text-white/30'}`}>
              {ach.title}
            </p>

            {/* Progress bar */}
            {!ach.unlocked && ach.progress !== undefined && (
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-arena-400/60 rounded-full transition-all"
                  style={{ width: `${ach.progress}%` }}
                />
              </div>
            )}

            {/* Unlocked checkmark */}
            {ach.unlocked && (
              <CheckCircle className="w-3.5 h-3.5 text-green-400 absolute top-2 left-2" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// Interfaces
// ============================================================
interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  options: string[];
  closesAt: string;
  status: string;
  _count: { predictions: number };
}

// ============================================================
// StatCard Component
// ============================================================
function StatCard({ icon: Icon, label, value, color = 'arena' }: {
  icon: ElementType;
  label: string;
  value: string | number;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    arena: 'text-arena-300 bg-arena-500/20 border-arena-500/30',
    gold: 'text-gold-400 bg-gold-500/20 border-gold-500/30',
    green: 'text-green-400 bg-green-500/20 border-green-500/30',
    blue: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  };
  return (
    <div className="card-glass p-5 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-200">
      <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-white/50 text-xs font-medium">{label}</p>
        <p className="text-white text-xl font-bold font-display">{value}</p>
      </div>
    </div>
  );
}

// ============================================================
// EventCard Component
// ============================================================
function EventCard({ event, onPredict }: { event: Event; onPredict: (e: Event) => void }) {
  const timeLeft = new Date(event.closesAt).getTime() - Date.now();
  const hoursLeft = Math.max(0, Math.floor(timeLeft / 3600000));
  const daysLeft = Math.floor(hoursLeft / 24);

  const categoryColors: Record<string, string> = {
    'Fútbol': 'text-green-400 bg-green-500/10 border-green-500/30',
    'eSports': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    'Baloncesto': 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    'Gaming': 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  };
  const catColor = categoryColors[event.category] || 'text-arena-300 bg-arena-500/10 border-arena-500/30';

  return (
    <div className="card-glass p-5 hover:-translate-y-1 transition-all duration-200 group flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${catColor}`}>
          {event.category}
        </span>
        <span className="text-white/40 text-xs flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3" />
          {daysLeft > 0 ? `${daysLeft}d restantes` : `${hoursLeft}h restantes`}
        </span>
      </div>

      <div className="flex items-center justify-center gap-3 my-3 text-center">
        <span className="badge-open flex items-center gap-1.5 text-xs">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          ABIERTO
        </span>
      </div>

      <h3 className="text-white font-semibold text-base mb-1 group-hover:text-arena-300 transition-colors text-center">
        {event.title}
      </h3>
      <p className="text-white/50 text-sm mb-4 line-clamp-2 text-center flex-1">{event.description}</p>

      {/* Opciones preview */}
      <div className="flex flex-wrap gap-1.5 mb-4 justify-center">
        {event.options.slice(0, 3).map((opt, i) => (
          <span key={i} className="text-xs text-white/60 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
            {opt}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2 text-white/40 text-xs">
          <Target className="w-3.5 h-3.5" />
          {event._count.predictions} predicciones
        </div>
        <button
          id={`predict-event-${event.id}`}
          onClick={() => onPredict(event)}
          className="btn-primary py-2 px-4 text-sm"
        >
          Predecir
        </button>
      </div>
    </div>
  );
}

// ============================================================
// PredictModal Component
// ============================================================
function PredictModal({
  event,
  userCoins,
  onClose,
  onSuccess,
}: {
  event: Event;
  userCoins: number;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}) {
  const [selectedOption, setSelectedOption] = useState('');
  const [betAmount, setBetAmount] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const multiplier = 2.0; // Por ahora fijo; Sprint 3 lo dinamizará
  const potentialGain = Math.floor(betAmount * multiplier);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) return setError('Selecciona una opción para predecir');
    if (betAmount < 10) return setError('La apuesta mínima es 10 ArenaCoins');
    if (betAmount > userCoins) return setError('No tienes suficientes ArenaCoins');

    setIsLoading(true);
    setError('');

    try {
      const res = await predictionsAPI.create({
        eventId: event.id,
        option: selectedOption,
        amountBet: betAmount,
      });
      onSuccess(res.newBalance);
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar predicción';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md card-glass p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-arena-300 text-xs font-semibold mb-1 uppercase tracking-wider">Realizar Predicción</p>
            <h2 className="text-white font-bold text-lg font-display leading-tight">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors p-1 rounded-lg hover:bg-white/10 ml-4 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-3 animate-bounce-in" />
            <p className="text-white font-bold text-lg">¡Predicción registrada!</p>
            <p className="text-white/50 text-sm mt-1">Que gane el mejor predictor 🎯</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Opciones */}
            <div>
              <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 block">
                ¿Quién ganará?
              </label>
              <div className="grid gap-2">
                {event.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 text-sm font-medium ${
                      selectedOption === opt
                        ? 'border-arena-400 bg-arena-500/20 text-arena-300'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${
                        selectedOption === opt ? 'bg-arena-400 border-arena-400' : 'border-white/30'
                      }`} />
                      {opt}
                      <span className="ml-auto text-xs text-white/40">x{multiplier.toFixed(1)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cantidad a apostar */}
            <div>
              <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 block">
                ArenaCoins a apostar
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-400 text-lg">🪙</span>
                <input
                  type="number"
                  min={10}
                  max={userCoins}
                  value={betAmount || ''}
                  onChange={(e) => {
                    let val = Number(e.target.value);
                    if (val > userCoins) val = userCoins;
                    if (val < 0) val = 0;
                    setBetAmount(val);
                  }}
                  className="input-field w-full pl-10 pr-4"
                />
              </div>
              {/* Atajos de cantidad */}
              <div className="flex gap-2 mt-2">
                {[50, 100, 250, 500].map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setBetAmount(Math.min(amount, userCoins))}
                    className="flex-1 text-xs py-1 rounded-lg border border-white/10 text-white/50 hover:border-arena-400/50 hover:text-arena-300 transition-colors bg-white/5"
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Apuesta</span>
                <span className="text-white font-medium">🪙 {betAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Multiplicador</span>
                <span className="text-arena-300 font-medium">x{multiplier.toFixed(1)}</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-semibold">
                <span className="text-white/70">Ganancia potencial</span>
                <span className="text-green-400">🪙 {potentialGain.toLocaleString()}</span>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !selectedOption}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Registrando predicción...' : `Apostar ${betAmount.toLocaleString()} ArenaCoins`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Main DashboardPage
// ============================================================
export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, setUser, updateCoins } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [userStats, setUserStats] = useState({ total: 0, correct: 0 });
  const [claimedToday, setClaimedToday] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaimReward = async () => {
    if (claimedToday || isClaiming) return;
    setIsClaiming(true);
    try {
      const { newBalance } = await gamesAPI.claimDailyReward();
      updateCoins(newBalance);
      setClaimedToday(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsClaiming(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Refrescar perfil con ArenaCoins reales desde Supabase
    authAPI.getMe().then((res: any) => {
      setUser(res.data.user, useAuthStore.getState().token!);
    }).catch((err: any) => {
      console.error('Error fetching profile:', err);
      if (err.message === 'No autenticado') {
        logout();
        navigate('/login');
      }
    });

    // Cargar predicciones reales del usuario
    predictionsAPI.getMyStats().then(setUserStats).catch(() => {});

    // Cargar eventos reales desde Supabase
    eventsAPI.getAll().then((res: any) => {
      const data = res.data as { events: Event[] };
      setEvents(data.events);
    }).catch(console.error).finally(() => setIsLoadingEvents(false));
  }, [user, navigate, setUser]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePredict = (event: Event) => {
    setSelectedEvent(event);
  };

  const handlePredictSuccess = (newBalance: number) => {
    updateCoins(newBalance);
    setUserStats(prev => ({ ...prev, total: prev.total + 1 }));
    // Recargar conteo de predicciones en eventos
    eventsAPI.getAll().then((res: any) => {
      const data = res.data as { events: Event[] };
      setEvents(data.events);
    }).catch(() => {});
  };

  if (!user) return null;

  const winRate = userStats.total > 0
    ? Math.round((userStats.correct / userStats.total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-arena-gradient">
      {/* Background glow */}
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

          {/* Nav links */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/dashboard'
                  ? 'bg-arena-500/20 text-arena-300'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/ranking')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/ranking'
                  ? 'bg-arena-500/20 text-arena-300'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Ranking</span>
            </button>
            <button
              onClick={() => navigate('/games')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/games' || location.pathname === '/crash'
                  ? 'bg-arena-500/20 text-arena-300'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span className="hidden sm:inline">Mini-Juegos</span>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/profile'
                  ? 'bg-arena-500/20 text-arena-300'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="coin-badge">
              <span>🪙</span>
              {user.arenaCoins.toLocaleString()}
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-arena-500/30 rounded-full flex items-center justify-center border border-arena-500/40">
                <span className="text-arena-300 text-sm font-bold">
                  {user.username[0].toUpperCase()}
                </span>
              </div>
              <span className="text-white/70 text-sm font-medium hidden sm:block">
                {user.username}
              </span>
            </div>

            <button
              id="logout-btn"
              onClick={handleLogout}
              className="text-white/40 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="relative max-w-6xl mx-auto px-4 py-8">
        {/* Welcome header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="font-display text-3xl font-bold text-white mb-1">
              ¡Hola, <span className="text-gradient">{user.username}</span>! 👋
            </h1>
            <p className="text-white/50">Bienvenido a tu arena de predicciones</p>
          </div>

          {/* Daily Reward Banner */}
          <div className="card-glass p-4 border border-gold-500/30 bg-gradient-to-r from-gold-500/10 via-amber-500/5 to-transparent flex items-center gap-4 shrink-0 shadow-lg shadow-gold-500/5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center text-2xl shrink-0 shadow-md">
              🎁
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Bono Diario de Monedas</h3>
              <p className="text-white/50 text-xs mt-0.5">+500 ArenaCoins gratis cada día</p>
            </div>
            <button
              onClick={handleClaimReward}
              disabled={claimedToday || isClaiming}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                claimedToday
                  ? 'bg-white/10 text-white/40 cursor-default'
                  : 'bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-slate-950 shadow-md shadow-gold-500/20 active:scale-95'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              {claimedToday ? 'Reclamado ✅' : isClaiming ? 'Reclamando...' : 'Reclamar 🪙500'}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up">
          <StatCard icon={Coins} label="ArenaCoins" value={user.arenaCoins.toLocaleString()} color="gold" />
          <StatCard icon={Target} label="Predicciones" value={userStats.total} color="arena" />
          <StatCard icon={TrendingUp} label="Aciertos" value={userStats.correct} color="green" />
          <StatCard icon={Star} label="Precisión" value={userStats.total > 0 ? `${winRate}%` : '—'} color="blue" />
        </div>

        {/* Achievements Section */}
        <AchievementsSection
          coins={user.arenaCoins}
          total={userStats.total}
          correct={userStats.correct}
        />

        {/* Mini-Juego Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              Mini-Juego
            </h2>
            <span className="text-white/40 text-sm">¡Disponible ahora!</span>
          </div>
          <div
            onClick={() => navigate('/crash')}
            className="relative overflow-hidden card-glass p-6 cursor-pointer hover:border-orange-500/40 transition-all duration-300 group hover:scale-[1.01]"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-rose-500/5 to-purple-500/10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-500/10 transition-all" />

            <div className="relative flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-xl">Arena Crash</h3>
                  <p className="text-white/50 text-sm mt-0.5">El multiplicador sube... ¿cuándo te atreves a retirar?</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/20 font-semibold">EN VIVO</span>
                    <span className="text-xs text-white/30">Multiplica hasta x100 tus monedas</span>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/crash'); }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 text-white font-bold text-sm hover:from-orange-400 hover:to-rose-500 transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2 shrink-0"
              >
                <Flame className="w-4 h-4" />
                Jugar Ahora
              </button>
            </div>
          </div>
        </section>

        {/* Events Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-arena-400" />
              Eventos activos
            </h2>
            <span className="text-white/40 text-sm">{events.length} disponibles</span>
          </div>

          {isLoadingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-glass p-5 animate-pulse">
                  <div className="h-4 bg-white/10 rounded mb-3 w-20" />
                  <div className="h-5 bg-white/10 rounded mb-2 w-3/4" />
                  <div className="h-4 bg-white/10 rounded w-full" />
                  <div className="h-4 bg-white/10 rounded w-2/3 mt-1" />
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="card-glass p-12 text-center">
              <Trophy className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 font-medium">No hay eventos activos</p>
              <p className="text-white/20 text-sm mt-1">Vuelve pronto para nuevos desafíos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
              {events.map((event) => (
                <EventCard key={event.id} event={event} onPredict={handlePredict} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Predict Modal */}
      {selectedEvent && (
        <PredictModal
          event={selectedEvent}
          userCoins={user.arenaCoins}
          onClose={() => setSelectedEvent(null)}
          onSuccess={handlePredictSuccess}
        />
      )}
    </div>
  );
}
