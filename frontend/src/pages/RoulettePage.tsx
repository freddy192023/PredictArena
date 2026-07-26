import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Trophy, Flame, User as UserIcon, LogOut, Dices, RotateCcw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { gamesAPI } from '../services/api';

// Números de ruleta europea en orden oficial de la rueda
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const getColor = (n: number): 'red' | 'black' | 'green' => {
  if (n === 0) return 'green';
  return RED_NUMBERS.includes(n) ? 'red' : 'black';
};

type BetType = 'red' | 'black' | 'green' | 'even' | 'odd' | '1-18' | '19-36' | 'number' | null;
type SpinState = 'IDLE' | 'SPINNING' | 'RESULT';

const PAYOUTS: Record<string, number> = {
  red: 2, black: 2, even: 2, odd: 2, '1-18': 2, '19-36': 2, green: 18, number: 36,
};

const BET_LABEL: Record<string, string> = {
  red: '🔴 Rojo',
  black: '⚫ Negro',
  even: '🔵 Par',
  odd: '🟡 Impar',
  '1-18': '1️⃣ 1 al 18',
  '19-36': '2️⃣ 19 al 36',
  green: '🟢 Verde (0)',
  number: '🎯 Número exacto',
};

export default function RoulettePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, updateCoins } = useAuthStore();

  const [betType, setBetType] = useState<BetType>(null);
  const [betNumber, setBetNumber] = useState<number>(7);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [spinState, setSpinState] = useState<SpinState>('IDLE');
  const [result, setResult] = useState<number | null>(null);
  const [won, setWon] = useState<boolean | null>(null);
  const [winAmount, setWinAmount] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [rotation, setRotation] = useState(0);

  const handleLogout = () => { logout(); navigate('/login'); };

  const spin = async () => {
    if (!user || !betType) return setError('Elige un tipo de apuesta primero');
    if (betAmount < 10) return setError('Mínimo 10 ArenaCoins');
    if (betAmount > user.arenaCoins) return setError('Fondos insuficientes');
    setError('');

    try {
      // Cobrar apuesta
      const { newBalance } = await gamesAPI.placeCrashBet(betAmount);
      updateCoins(newBalance);

      setSpinState('SPINNING');

      // Elegir número aleatorio
      const winningNumber = WHEEL_NUMBERS[Math.floor(Math.random() * WHEEL_NUMBERS.length)];

      // Calcular ángulo objetivo basado en la posición en WHEEL_NUMBERS
      const targetIndex = WHEEL_NUMBERS.indexOf(winningNumber);
      const anglePerSegment = 360 / WHEEL_NUMBERS.length;
      const targetAngle = 360 - (targetIndex * anglePerSegment);

      // Girar 5 vueltas completas + el ángulo exacto del número ganador
      const nextRotation = rotation + (360 * 5) + (targetAngle - (rotation % 360));
      setRotation(nextRotation);

      // Esperar a que la física del giro termine
      await new Promise(r => setTimeout(r, 3500));

      setResult(winningNumber);
      setHistory(prev => [winningNumber, ...prev].slice(0, 10));

      const color = getColor(winningNumber);
      let didWin = false;
      if (betType === 'red') didWin = color === 'red';
      else if (betType === 'black') didWin = color === 'black';
      else if (betType === 'green') didWin = winningNumber === 0;
      else if (betType === 'even') didWin = winningNumber !== 0 && winningNumber % 2 === 0;
      else if (betType === 'odd') didWin = winningNumber % 2 !== 0;
      else if (betType === '1-18') didWin = winningNumber >= 1 && winningNumber <= 18;
      else if (betType === '19-36') didWin = winningNumber >= 19 && winningNumber <= 36;
      else if (betType === 'number') didWin = winningNumber === betNumber;

      setWon(didWin);
      if (didWin) {
        const earned = betAmount * PAYOUTS[betType];
        setWinAmount(earned);
        const { newBalance: nb } = await gamesAPI.winCrashGame(earned, PAYOUTS[betType]);
        updateCoins(nb);
      } else {
        setWinAmount(0);
      }
      setSpinState('RESULT');
    } catch (err: any) {
      setError(err.message || 'Error al conectar');
      setSpinState('IDLE');
    }
  };

  const reset = () => {
    setSpinState('IDLE');
    setResult(null);
    setWon(null);
    setWinAmount(0);
  };

  if (!user) return null;

  const colorClass = result !== null ? (
    getColor(result) === 'red' ? 'text-red-500' :
    getColor(result) === 'black' ? 'text-slate-200' : 'text-green-400'
  ) : 'text-white';

  return (
    <div className="min-h-screen bg-arena-gradient flex flex-col">
      <div className="fixed inset-0 bg-hero-glow pointer-events-none" />

      {/* Navbar */}
      <nav className="relative border-b border-white/10 backdrop-blur-md bg-white/5 shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-arena-500 rounded-lg flex items-center justify-center shadow-arena">
              <Dices className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-white text-lg hidden sm:block">Arena Roulette</span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto">
            <button onClick={() => navigate('/dashboard')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/dashboard' ? 'bg-arena-500/20 text-arena-300' : 'text-white/50 hover:text-white hover:bg-white/10'}`}><LayoutDashboard className="w-4 h-4" /><span className="hidden sm:inline">Dashboard</span></button>
            <button onClick={() => navigate('/ranking')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/ranking' ? 'bg-arena-500/20 text-arena-300' : 'text-white/50 hover:text-white hover:bg-white/10'}`}><Trophy className="w-4 h-4" /><span className="hidden sm:inline">Ranking</span></button>
            <button onClick={() => navigate('/games')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${['/games','/crash','/roulette','/hilo'].includes(location.pathname) ? 'bg-arena-500/20 text-arena-300' : 'text-white/50 hover:text-white hover:bg-white/10'}`}><Flame className="w-4 h-4" /><span className="hidden sm:inline">Mini-Juegos</span></button>
            <button onClick={() => navigate('/profile')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/profile' ? 'bg-arena-500/20 text-arena-300' : 'text-white/50 hover:text-white hover:bg-white/10'}`}><UserIcon className="w-4 h-4" /><span className="hidden sm:inline">Perfil</span></button>
          </div>
          <div className="flex items-center gap-3">
            <div className="coin-badge shrink-0"><span>🪙</span>{user.arenaCoins.toLocaleString()}</div>
            <button onClick={handleLogout} className="text-white/40 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </nav>

      <main className="relative max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Historial de Giros */}
        <div className="card-glass p-3 mb-6 flex items-center gap-3 overflow-x-auto no-scrollbar">
          <span className="text-white/40 text-xs font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" /> Historial:
          </span>
          {history.length === 0 ? (
            <span className="text-white/30 text-xs">Sin giros recientes</span>
          ) : (
            history.map((h, idx) => {
              const c = getColor(h);
              const bg = c === 'red' ? 'bg-red-500/20 text-red-400 border-red-500/30' : c === 'black' ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-green-500/20 text-green-400 border-green-500/30';
              return (
                <span key={idx} className={`px-2.5 py-1 rounded-md text-xs font-bold border shrink-0 ${bg}`}>
                  {h}
                </span>
              );
            })
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Panel Izquierdo: Mesa de Apuestas */}
          <div className="card-glass p-6 flex flex-col gap-5 lg:col-span-6">
            <h2 className="font-display font-bold text-white text-xl">Mesa de Apuestas</h2>

            {/* Opciones de Apuesta */}
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Opciones disponibles</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['red','black','even','odd','1-18','19-36','green','number'] as BetType[]).map(bt => (
                  <button
                    key={bt!}
                    disabled={spinState === 'SPINNING'}
                    onClick={() => setBetType(bt)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-0.5 ${
                      betType === bt
                        ? 'border-arena-400 bg-arena-500/20 text-white shadow-md shadow-arena-500/10'
                        : 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{BET_LABEL[bt!]}</span>
                    <span className="text-[10px] text-arena-400 font-normal">x{PAYOUTS[bt!]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de número exacto */}
            {betType === 'number' && (
              <div className="animate-fade-in">
                <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Elige tu número (0 al 36)</label>
                <div className="grid grid-cols-7 gap-1.5 max-h-40 overflow-y-auto p-2 bg-black/20 rounded-xl border border-white/5 no-scrollbar">
                  {Array.from({ length: 37 }, (_, i) => i).map(n => {
                    const c = getColor(n);
                    const isSel = betNumber === n;
                    const bg = c === 'red' ? 'bg-red-500/30 text-red-200' : c === 'black' ? 'bg-slate-800 text-slate-200' : 'bg-green-500/30 text-green-200';
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setBetNumber(n)}
                        className={`h-8 rounded-lg text-xs font-bold transition-all border ${bg} ${isSel ? 'ring-2 ring-gold-400 border-gold-400 scale-105' : 'border-white/10 hover:border-white/30'}`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Monto de Apuesta */}
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Monto a apostar</label>
              <div className="relative mb-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-400">🪙</span>
                <input
                  type="number" min={10} value={betAmount || ''}
                  onChange={e => setBetAmount(Math.max(0, Number(e.target.value)))}
                  disabled={spinState === 'SPINNING'}
                  className="input-field w-full pl-12 font-bold text-lg h-12"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 'MAX'].map(btn => (
                  <button key={String(btn)} disabled={spinState === 'SPINNING'}
                    onClick={() => setBetAmount(btn === 'MAX' ? user.arenaCoins : Number(btn))}
                    className="py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-white/70 transition-colors disabled:opacity-50"
                  >{btn}</button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}

            <div className="mt-auto pt-2">
              {spinState === 'RESULT' ? (
                <button onClick={reset} className="w-full py-3.5 rounded-xl text-base font-bold bg-arena-500 hover:bg-arena-400 text-white transition-all shadow-lg shadow-arena-500/20">
                  Siguiente Giro
                </button>
              ) : (
                <button
                  onClick={spin}
                  disabled={spinState === 'SPINNING' || !betType}
                  className="w-full py-3.5 rounded-xl text-base font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all disabled:opacity-50 shadow-lg shadow-purple-500/30 active:scale-98 flex items-center justify-center gap-2"
                >
                  {spinState === 'SPINNING' ? '🎡 Girando Rueda...' : '🎡 Girar Ruleta'}
                </button>
              )}
            </div>
          </div>

          {/* Panel Derecho: Rueda Física 3D Visual */}
          <div className="card-glass lg:col-span-6 flex flex-col items-center justify-center p-8 min-h-[420px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-indigo-600/10 pointer-events-none" />

            {/* Aguja indicadora superior */}
            <div className="absolute top-6 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-gold-400 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />

            {/* Rueda giratoria */}
            <div className="relative z-10 flex flex-col items-center my-4">
              <div
                className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-gold-500/60 shadow-[0_0_50px_rgba(168,85,247,0.3)] flex items-center justify-center relative overflow-hidden"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinState === 'SPINNING' ? 'transform 3.5s cubic-bezier(0.15, 0.85, 0.15, 1)' : 'none',
                }}
              >
                {/* SVG renderizado de 37 sectores exactos de Ruleta */}
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {WHEEL_NUMBERS.map((num, i) => {
                    const angle = 360 / WHEEL_NUMBERS.length;
                    const startAngle = i * angle;
                    const endAngle = (i + 1) * angle;

                    const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                    const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                    const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                    const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                    const color = getColor(num);
                    const fill = color === 'red' ? '#dc2626' : color === 'black' ? '#1e293b' : '#16a34a';

                    // Calcular centro del segmento para posicionar el texto del número
                    const midAngle = startAngle + angle / 2;
                    const textRadius = 38; // Posición entre el centro y el borde exterior
                    const tx = 50 + textRadius * Math.cos((Math.PI * midAngle) / 180);
                    const ty = 50 + textRadius * Math.sin((Math.PI * midAngle) / 180);

                    return (
                      <g key={num}>
                        <path
                          d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                          fill={fill}
                          stroke="#0f172a"
                          strokeWidth="0.5"
                        />
                        <text
                          x={tx}
                          y={ty}
                          fill="#ffffff"
                          fontSize="3.2"
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                          className="select-none pointer-events-none"
                        >
                          {num}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Centro de la rueda */}
                <div className="absolute w-20 h-20 bg-slate-900 border-4 border-gold-400 rounded-full flex flex-col items-center justify-center shadow-inner z-10">
                  <span className="text-gold-400 font-display font-black text-xl">
                    {result !== null ? result : '🎡'}
                  </span>
                </div>
              </div>
            </div>

            {/* Banner de Resultado */}
            {spinState === 'RESULT' && result !== null && (
              <div className="z-20 text-center animate-slide-up mt-2">
                <div className={`text-4xl font-black font-display mb-1 ${colorClass}`}>
                  {result} {getColor(result) === 'red' ? '🔴' : getColor(result) === 'black' ? '⚫' : '🟢'}
                </div>
                {won ? (
                  <div className="bg-green-500/20 border border-green-500/40 rounded-xl px-6 py-2 animate-bounce">
                    <p className="text-green-400 font-bold text-lg">¡GANASTE! 🎉</p>
                    <p className="text-green-300 text-xs font-semibold">+🪙 {winAmount.toLocaleString()}</p>
                  </div>
                ) : (
                  <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-6 py-2">
                    <p className="text-red-400 font-bold text-lg">¡PERDISTE! 💸</p>
                    <p className="text-red-300 text-xs font-semibold">-🪙 {betAmount.toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}

            {spinState === 'IDLE' && (
              <p className="text-white/40 text-xs text-center z-10 mt-2">Selecciona una opción a la izquierda y presiona Girar Ruleta</p>
            )}
            {spinState === 'SPINNING' && (
              <p className="text-gold-400 font-bold text-sm text-center z-10 animate-pulse mt-2">¡Girando la ruleta real! 🎡</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
