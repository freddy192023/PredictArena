import { useNavigate, useLocation } from 'react-router-dom';
import { Gamepad2, LayoutDashboard, Trophy, User as UserIcon, LogOut, Flame, Rocket, Dices, Club, Keyboard } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const GAMES = [
  {
    id: 'crash',
    title: 'Arena Crash',
    description: 'El multiplicador sube sin parar. Retira antes de que explote o perderás todo. ¿Hasta dónde te atreves?',
    icon: Rocket,
    gradient: 'from-orange-500 to-rose-600',
    shadow: 'shadow-orange-500/30',
    badge: 'POPULAR',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
    tag: 'Reacción rápida',
    route: '/crash',
    available: true,
  },
  {
    id: 'roulette',
    title: 'Arena Roulette',
    description: 'Apuesta al Rojo, Negro, Par, Impar o al Verde (0). La rueda giratoria decidirá tu suerte.',
    icon: Dices,
    gradient: 'from-purple-500 to-indigo-600',
    shadow: 'shadow-purple-500/30',
    badge: 'NUEVO',
    badgeColor: 'bg-green-500/20 text-green-400 border-green-500/20',
    tag: 'Casino Clásico',
    route: '/roulette',
    available: true,
  },
  {
    id: 'hilo',
    title: 'Arena Hi-Lo',
    description: 'Adivina si la siguiente carta será Mayor o Menor que la carta base. ¡Rápido y divertido!',
    icon: Club,
    gradient: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-500/30',
    badge: 'NUEVO',
    badgeColor: 'bg-green-500/20 text-green-400 border-green-500/20',
    tag: 'Juego de Cartas',
    route: '/hilo',
    available: true,
  },
  {
    id: 'snake',
    title: 'Arena Snake 🐍',
    description: 'Paga tu entrada y cómete todas las manzanas posibles. Recupera tu entrada al comer 10 manzanas y gana recompensas sin límite.',
    icon: Keyboard,
    gradient: 'from-green-500 to-emerald-600',
    shadow: 'shadow-green-500/30',
    badge: 'NUEVO',
    badgeColor: 'bg-green-500/20 text-green-400 border-green-500/20',
    tag: 'Habilidad',
    route: '/games/snake',
    available: true,
  }
];

export default function GamesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => { logout(); navigate('/login'); };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-arena-gradient flex flex-col">
      <div className="fixed inset-0 bg-hero-glow pointer-events-none" />

      {/* Navbar */}
      <nav className="relative border-b border-white/10 backdrop-blur-md bg-white/5 shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-arena-500 rounded-lg flex items-center justify-center shadow-arena">
              <Gamepad2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-white text-lg hidden sm:block">Mini-Juegos</span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            <button onClick={() => navigate('/dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/dashboard' ? 'bg-arena-500/20 text-arena-300' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
              <LayoutDashboard className="w-4 h-4" /><span className="hidden sm:inline">Dashboard</span>
            </button>
            <button onClick={() => navigate('/ranking')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/ranking' ? 'bg-arena-500/20 text-arena-300' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
              <Trophy className="w-4 h-4" /><span className="hidden sm:inline">Ranking</span>
            </button>
            <button onClick={() => navigate('/games')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${['/games','/crash','/roulette','/hilo'].includes(location.pathname) ? 'bg-arena-500/20 text-arena-300' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
              <Flame className="w-4 h-4" /><span className="hidden sm:inline">Mini-Juegos</span>
            </button>
            <button onClick={() => navigate('/profile')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/profile' ? 'bg-arena-500/20 text-arena-300' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
              <UserIcon className="w-4 h-4" /><span className="hidden sm:inline">Perfil</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="coin-badge shrink-0"><span>🪙</span>{user.arenaCoins.toLocaleString()}</div>
            <button onClick={handleLogout}
              className="text-white/40 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-1">
            🎮 Arena Games Hub
          </h1>
          <p className="text-white/50">Pon a prueba tu suerte, temple y reflejos en nuestros 3 juegos interactivos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {GAMES.map((game) => {
            const Icon = game.icon;
            return (
              <div
                key={game.id}
                onClick={() => game.available && navigate(game.route)}
                className={`relative overflow-hidden card-glass p-6 transition-all duration-300 group flex flex-col justify-between ${game.available ? 'cursor-pointer hover:scale-[1.03] hover:border-white/30' : 'opacity-60 cursor-not-allowed'}`}
              >
                {/* Background glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-5 group-hover:opacity-15 transition-opacity pointer-events-none`} />

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center shadow-lg ${game.shadow}`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${game.badgeColor}`}>
                      {game.badge}
                    </span>
                  </div>

                  {/* Info */}
                  <h3 className="font-display font-bold text-white text-xl mb-2">{game.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-5">{game.description}</p>
                </div>

                {/* Footer */}
                <div className="relative flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <span className="text-xs text-white/40 bg-white/5 px-2.5 py-1 rounded-full">{game.tag}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(game.route); }}
                    className={`px-4 py-2 rounded-xl bg-gradient-to-r ${game.gradient} text-white font-bold text-xs transition-all hover:opacity-90 shadow-lg ${game.shadow}`}
                  >
                    Jugar →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
