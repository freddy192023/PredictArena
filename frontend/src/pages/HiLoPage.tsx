import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Trophy, Flame, User as UserIcon, LogOut, Club, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { gamesAPI } from '../services/api';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const VALUE_NAMES: Record<number, string> = {
  11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

interface Card {
  value: number;
  suit: string;
  name: string;
  color: string;
}

const getRandomCard = (): Card => {
  const value = VALUES[Math.floor(Math.random() * VALUES.length)];
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const name = VALUE_NAMES[value] || String(value);
  const color = (suit === '♥' || suit === '♦') ? 'text-red-500' : 'text-slate-100';
  return { value, suit, name, color };
};

type GameState = 'IDLE' | 'PLAYING' | 'RESULT';

export default function HiLoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, updateCoins } = useAuthStore();

  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [nextCard, setNextCard] = useState<Card | null>(null);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [prediction, setPrediction] = useState<'HI' | 'LO' | null>(null);
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [won, setWon] = useState<boolean | null>(null);
  const [winAmount, setWinAmount] = useState(0);
  const [multiplier, setMultiplier] = useState(1.9);
  const [error, setError] = useState('');

  const handleLogout = () => { logout(); navigate('/login'); };

  const startGame = () => {
    setCurrentCard(getRandomCard());
    setNextCard(null);
    setGameState('IDLE');
    setWon(null);
    setError('');
  };

  const makeGuess = async (guess: 'HI' | 'LO') => {
    if (!user) return;
    if (betAmount < 10) return setError('Mínimo 10 ArenaCoins');
    if (betAmount > user.arenaCoins) return setError('Fondos insuficientes');
    setError('');

    const baseCard = currentCard || getRandomCard();
    if (!currentCard) setCurrentCard(baseCard);

    try {
      // Cobrar apuesta
      const { newBalance } = await gamesAPI.placeCrashBet(betAmount);
      updateCoins(newBalance);

      setPrediction(guess);
      setGameState('PLAYING');

      // Generar siguiente carta distinta o igual
      let drawn = getRandomCard();
      setNextCard(drawn);

      let didWin = false;
      if (guess === 'HI') didWin = drawn.value >= baseCard.value;
      if (guess === 'LO') didWin = drawn.value <= baseCard.value;

      setWon(didWin);

      if (didWin) {
        const p = 1.9; // Multiplicador base
        setMultiplier(p);
        const earned = Math.floor(betAmount * p);
        setWinAmount(earned);
        const { newBalance: nb } = await gamesAPI.winCrashGame(earned, p);
        updateCoins(nb);
      } else {
        setWinAmount(0);
      }

      setGameState('RESULT');
    } catch (err: any) {
      setError(err.message || 'Error al conectar');
      setGameState('IDLE');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-arena-gradient flex flex-col">
      <div className="fixed inset-0 bg-hero-glow pointer-events-none" />

      {/* Navbar */}
      <nav className="relative border-b border-white/10 backdrop-blur-md bg-white/5 shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-arena-500 rounded-lg flex items-center justify-center shadow-arena">
              <Club className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-white text-lg hidden sm:block">Arena Hi-Lo</span>
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

      <main className="relative max-w-4xl mx-auto px-4 py-8 flex-1 w-full flex flex-col lg:flex-row gap-6">

        {/* Panel de control */}
        <div className="card-glass p-6 flex flex-col gap-4 lg:w-80 shrink-0">
          <h2 className="font-display font-bold text-white text-xl">¿Mayor o Menor?</h2>
          <p className="text-white/50 text-sm">Adivina si la siguiente carta será de mayor/igual valor o menor/igual valor.</p>

          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Monto de apuesta</label>
            <div className="relative mb-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-400">🪙</span>
              <input
                type="number" min={10} value={betAmount || ''}
                onChange={e => setBetAmount(Math.max(0, Number(e.target.value)))}
                disabled={gameState === 'PLAYING'}
                className="input-field w-full pl-12 font-bold text-lg h-12"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[100, 500, 1000, 'MAX'].map(btn => (
                <button key={String(btn)} disabled={gameState === 'PLAYING'}
                  onClick={() => setBetAmount(btn === 'MAX' ? user.arenaCoins : Number(btn))}
                  className="py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-white/70 transition-colors disabled:opacity-50"
                >{btn}</button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}

          <div className="grid grid-cols-2 gap-3 mt-auto">
            <button
              onClick={() => makeGuess('HI')}
              disabled={gameState === 'PLAYING'}
              className="py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold rounded-xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-green-500/20 transition-all disabled:opacity-50"
            >
              <ArrowUp className="w-6 h-6" />
              <span>Mayor u Igual</span>
              <span className="text-xs opacity-80">x1.90</span>
            </button>
            <button
              onClick={() => makeGuess('LO')}
              disabled={gameState === 'PLAYING'}
              className="py-4 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold rounded-xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
            >
              <ArrowDown className="w-6 h-6" />
              <span>Menor u Igual</span>
              <span className="text-xs opacity-80">x1.90</span>
            </button>
          </div>
        </div>

        {/* Mesa de juego */}
        <div className="card-glass flex-1 p-8 flex flex-col items-center justify-center gap-8 min-h-[400px] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/10 pointer-events-none" />

          <div className="flex items-center gap-6 sm:gap-12 z-10">
            {/* Carta actual */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">Carta Base</span>
              <div className="w-32 h-44 sm:w-40 sm:h-56 bg-slate-900 border-2 border-white/20 rounded-2xl p-4 flex flex-col justify-between shadow-2xl relative select-none animate-fade-in">
                {currentCard ? (
                  <>
                    <div className={`text-2xl font-bold ${currentCard.color}`}>{currentCard.name}{currentCard.suit}</div>
                    <div className={`text-5xl self-center font-black ${currentCard.color}`}>{currentCard.suit}</div>
                    <div className={`text-2xl font-bold self-end rotate-180 ${currentCard.color}`}>{currentCard.name}{currentCard.suit}</div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-white/20 font-bold">Inicia</div>
                )}
              </div>
            </div>

            <div className="text-white/30 text-2xl font-bold">VS</div>

            {/* Siguiente carta */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">Siguiente Carta</span>
              <div className={`w-32 h-44 sm:w-40 sm:h-56 rounded-2xl p-4 flex flex-col justify-between shadow-2xl relative select-none transition-all duration-300 ${
                nextCard ? 'bg-slate-900 border-2 border-white/20 animate-flip' : 'bg-white/5 border-2 border-dashed border-white/10'
              }`}>
                {nextCard ? (
                  <>
                    <div className={`text-2xl font-bold ${nextCard.color}`}>{nextCard.name}{nextCard.suit}</div>
                    <div className={`text-5xl self-center font-black ${nextCard.color}`}>{nextCard.suit}</div>
                    <div className={`text-2xl font-bold self-end rotate-180 ${nextCard.color}`}>{nextCard.name}{nextCard.suit}</div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-white/20 text-4xl font-bold">❓</div>
                )}
              </div>
            </div>
          </div>

          {/* Banner de Resultado */}
          {gameState === 'RESULT' && won !== null && (
            <div className="z-10 text-center animate-slide-up">
              {won ? (
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl px-8 py-3">
                  <p className="text-green-400 font-bold text-2xl">¡Acertaste! 🎉</p>
                  <p className="text-green-300 text-sm mt-1">+🪙 {winAmount.toLocaleString()}</p>
                </div>
              ) : (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-8 py-3">
                  <p className="text-red-400 font-bold text-2xl">¡Fallaste! 💸</p>
                  <p className="text-red-300 text-sm mt-1">-🪙 {betAmount.toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
