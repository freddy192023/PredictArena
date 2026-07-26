import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Rocket, LayoutDashboard, Trophy, User as UserIcon, LogOut, Flame, Clock, Gamepad2, Coins } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { gamesAPI } from '../services/api';
import { supabase } from '../services/supabase';

type GameState = 'IDLE' | 'PLAYING' | 'CRASHED' | 'CASHED_OUT';

export default function CrashPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, updateCoins } = useAuthStore();

  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [betAmount, setBetAmount] = useState<number>(100);
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [crashPoint, setCrashPoint] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([]);
  const [error, setError] = useState<string>('');
  const [winAmount, setWinAmount] = useState<number>(0);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Generar curva exponencial suave
  const calculateMultiplier = (timeElapsedMs: number) => {
    // 1% de aumento por cada 100ms
    return Math.max(1, Math.pow(1.03, timeElapsedMs / 200));
  };

  useEffect(() => {
    return () => stopGame();
  }, []);

  const stopGame = () => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
  };

  const generateCrashPoint = () => {
    // 3% de probabilidad de crashear en 1.00x instantáneamente (House Edge)
    if (Math.random() < 0.03) return 1.0;
    // Fórmula para curva de Crash típica: 0.99 / random()
    const r = Math.random();
    return Math.max(1.0, 0.99 / r);
  };

  const handleStartGame = async () => {
    if (!user) return;
    if (betAmount < 10) return setError('Mínimo 10 ArenaCoins');
    if (betAmount > user.arenaCoins) return setError('Fondos insuficientes');
    
    setError('');
    
    try {
      // 1. Cobrar la apuesta en el servidor
      const { newBalance } = await gamesAPI.placeCrashBet(betAmount);
      updateCoins(newBalance);

      // 2. Iniciar el juego
      setGameState('PLAYING');
      setMultiplier(1.0);
      setWinAmount(0);
      
      const nextCrash = generateCrashPoint();
      setCrashPoint(nextCrash);
      startTimeRef.current = performance.now();

      // 3. Loop del juego
      const gameLoop = (currentTime: number) => {
        const elapsed = currentTime - startTimeRef.current;
        const currentMulti = calculateMultiplier(elapsed);
        
        if (currentMulti >= nextCrash) {
          // 💥 BOOM!
          setMultiplier(nextCrash);
          setGameState('CRASHED');
          setHistory(prev => [nextCrash, ...prev].slice(0, 10));
          return;
        }

        setMultiplier(currentMulti);
        timerRef.current = requestAnimationFrame(gameLoop);
      };

      timerRef.current = requestAnimationFrame(gameLoop);

    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
    }
  };

  const handleCashOut = async () => {
    if (gameState !== 'PLAYING') return;
    stopGame();

    const currentMulti = multiplier;
    const won = Math.floor(betAmount * currentMulti);

    setGameState('CASHED_OUT');
    setWinAmount(won);
    setHistory(prev => [currentMulti, ...prev].slice(0, 10)); // Aquí guardamos donde el usuario paró por simplicidad, aunque el cohete real seguiría

    try {
      const { newBalance } = await gamesAPI.winCrashGame(won, currentMulti);
      updateCoins(newBalance);
    } catch (err: any) {
      setError('Error al registrar la ganancia. Actualiza la página.');
    }
  };

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
            <span className="font-display font-bold text-white text-lg hidden sm:block">Arena Crash</span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
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
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil</span>
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
      <main className="relative max-w-5xl mx-auto px-4 py-8 flex-1 flex flex-col lg:flex-row gap-6 w-full">
        
        {/* Panel de Apuestas */}
        <div className="card-glass p-6 flex flex-col shrink-0 lg:w-80 h-full">
          <h2 className="text-white font-semibold flex items-center gap-2 mb-6">
            <Coins className="w-5 h-5 text-gold-400" /> Monto a apostar
          </h2>
          
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-400">🪙</span>
            <input
              type="number"
              min={10}
              value={betAmount || ''}
              onChange={(e) => {
                let v = Number(e.target.value);
                if (v < 0) v = 0;
                setBetAmount(v);
              }}
              disabled={gameState === 'PLAYING'}
              className="input-field w-full pl-12 font-bold text-xl h-14"
            />
          </div>

          <div className="grid grid-cols-4 gap-2 mb-6">
            {[100, 500, 1000, 'MAX'].map(btn => (
              <button
                key={btn}
                disabled={gameState === 'PLAYING'}
                onClick={() => setBetAmount(btn === 'MAX' ? user.arenaCoins : Number(btn))}
                className="py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-white/70 transition-colors disabled:opacity-50"
              >
                {btn}
              </button>
            ))}
          </div>

          {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}

          <div className="mt-auto">
            {gameState === 'PLAYING' ? (
              <button 
                onClick={handleCashOut}
                className="w-full py-4 rounded-xl text-xl font-bold bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Retirar (🪙 {Math.floor(betAmount * multiplier)})
              </button>
            ) : (
              <button 
                onClick={handleStartGame}
                disabled={betAmount < 10 || betAmount > user.arenaCoins}
                className="w-full py-4 rounded-xl text-lg font-bold bg-arena-500 hover:bg-arena-400 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Iniciar Juego
              </button>
            )}
          </div>
        </div>

        {/* Panel de Animación (La Arena de Crash) */}
        <div className="card-glass flex-1 p-1 flex flex-col overflow-hidden h-full min-h-[400px]">
          
          {/* Historial */}
          <div className="h-12 bg-black/20 border-b border-white/5 px-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {history.length === 0 ? <span className="text-white/30 text-xs">Aún no hay partidas</span> : null}
            {history.map((h, i) => (
              <span key={i} className={`px-2.5 py-1 rounded-md text-xs font-bold ${h >= 2 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {h.toFixed(2)}x
              </span>
            ))}
          </div>

          {/* Gráfico / Animación Central */}
          <div className="flex-1 relative bg-gradient-to-t from-arena-900/50 to-transparent rounded-b-xl flex flex-col items-center justify-center p-8 overflow-hidden">
            
            {/* Curva decorativa del cohete */}
            <svg className="absolute bottom-0 left-0 w-full h-full opacity-20 pointer-events-none" preserveAspectRatio="none">
              <path d="M0,400 Q200,400 400,200 T800,0" stroke="url(#gradient)" strokeWidth="4" fill="none" />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
              </defs>
            </svg>

            {/* Número GIGANTE del multiplicador */}
            <div className={`z-10 text-center transition-transform duration-75 ${gameState === 'PLAYING' ? 'scale-110' : 'scale-100'}`}>
              <h1 className={`font-display text-7xl md:text-9xl font-black tracking-tighter drop-shadow-2xl transition-colors duration-300 ${
                gameState === 'CRASHED' ? 'text-red-500' :
                gameState === 'CASHED_OUT' ? 'text-green-400' :
                multiplier > 2 ? 'text-gold-400' :
                multiplier > 1.5 ? 'text-arena-300' :
                'text-white'
              }`}>
                {multiplier.toFixed(2)}x
              </h1>
              
              <div className="mt-6 h-12 flex items-center justify-center">
                {gameState === 'CRASHED' && (
                  <p className="text-red-400 text-xl font-bold bg-red-500/20 px-6 py-2 rounded-full border border-red-500/30 animate-shake">
                    ¡EXPLOTÓ! 💥
                  </p>
                )}
                {gameState === 'CASHED_OUT' && (
                  <p className="text-green-400 text-xl font-bold bg-green-500/20 px-6 py-2 rounded-full border border-green-500/30 flex items-center gap-2 animate-bounce">
                    ¡Retiraste 🪙 {winAmount}! ✅
                  </p>
                )}
                {gameState === 'PLAYING' && (
                  <div className="flex items-center gap-2 text-white/50 text-sm animate-pulse">
                    <Rocket className="w-5 h-5 text-arena-400" /> Volando...
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
