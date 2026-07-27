import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, RotateCcw, Keyboard, Coins, ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 }; // Up
const GAME_SPEED = 130;
const ENTRY_FEE = 50;
const COINS_PER_APPLE = 5;

const generateFood = (snake: {x:number, y:number}[]) => {
  let newFood: { x: number; y: number };
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    if (!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      break;
    }
  }
  return newFood;
};

export default function SnakePage() {
  const navigate = useNavigate();
  const { user, updateCoins } = useAuthStore();
  
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [status, setStatus] = useState<'IDLE' | 'PLAYING' | 'GAME_OVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [error, setError] = useState('');
  
  const directionRef = useRef(direction);
  const foodRef = useRef(food);
  const coinsEarnedRef = useRef(coinsEarned);

  // Mantener refs actualizados
  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { coinsEarnedRef.current = coinsEarned; }, [coinsEarned]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (status !== 'PLAYING') return;
    
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (directionRef.current.y !== 1) setDirection({ x: 0, y: -1 });
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (directionRef.current.y !== -1) setDirection({ x: 0, y: 1 });
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (directionRef.current.x !== 1) setDirection({ x: -1, y: 0 });
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (directionRef.current.x !== -1) setDirection({ x: 1, y: 0 });
        break;
    }
    // Prevenir scroll
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
  }, [status]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const handleMobileControl = (dx: number, dy: number) => {
    if (status !== 'PLAYING') return;
    if (dy === -1 && directionRef.current.y !== 1) setDirection({ x: 0, y: -1 });
    if (dy === 1 && directionRef.current.y !== -1) setDirection({ x: 0, y: 1 });
    if (dx === -1 && directionRef.current.x !== 1) setDirection({ x: -1, y: 0 });
    if (dx === 1 && directionRef.current.x !== -1) setDirection({ x: 1, y: 0 });
  };

  const startGame = async () => {
    if (!user) return;
    if (user.arenaCoins < ENTRY_FEE) {
      setError(`Necesitas al menos ${ENTRY_FEE} ArenaCoins para jugar.`);
      return;
    }

    // Cobrar entrada
    updateCoins(user.arenaCoins - ENTRY_FEE);
    
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setCoinsEarned(0);
    setError('');
    setStatus('PLAYING');
  };

  // Referencia mutable para evitar dependencias en useEffect del loop
  const snakeRef = useRef(snake);
  useEffect(() => { snakeRef.current = snake; }, [snake]);

  const endGame = async () => {
    setStatus('GAME_OVER');
    // Pagar ganancias
    if (coinsEarnedRef.current > 0 && user) {
      updateCoins(user.arenaCoins + coinsEarnedRef.current);
    }
  };

  // Game Loop
  useEffect(() => {
    if (status !== 'PLAYING') return;

    const gameInterval = setInterval(() => {
      const currentSnake = snakeRef.current;
      const head = currentSnake[0];
      const newHead = {
        x: head.x + directionRef.current.x,
        y: head.y + directionRef.current.y
      };

      // Colisión paredes
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        endGame();
        return;
      }

      // Colisión cuerpo
      if (currentSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        endGame();
        return;
      }

      const newSnake = [newHead, ...currentSnake];

      // Comer manzana
      if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
        setScore(s => s + 1);
        setCoinsEarned(c => c + COINS_PER_APPLE);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop(); // Remover cola si no comió
      }

      setSnake(newSnake);
    }, GAME_SPEED);

    return () => clearInterval(gameInterval);
  }, [status]); 

  // Crear la grilla visual
  const gridCells = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const isSnakeHead = snake[0].x === col && snake[0].y === row;
      const isSnakeBody = !isSnakeHead && snake.some(segment => segment.x === col && segment.y === row);
      const isFood = food.x === col && food.y === row;
      
      gridCells.push(
        <div 
          key={`${row}-${col}`} 
          className={`w-full h-full rounded-sm ${
            isSnakeHead ? 'bg-green-400 z-10 scale-110 shadow-[0_0_10px_rgba(74,222,128,0.5)]' :
            isSnakeBody ? 'bg-green-500/80 border border-green-900/20' :
            isFood ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse rounded-full' :
            'bg-arena-900/30 border border-white/5'
          }`}
        />
      );
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button 
              onClick={() => navigate('/games')}
              className="flex items-center text-white/50 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver a Juegos
            </button>
            <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
              <span className="text-green-500">🐍 Arena Snake</span>
            </h1>
          </div>
          <div className="bg-arena-800/50 p-4 rounded-xl border border-white/10 flex gap-6">
            <div className="text-center">
              <p className="text-white/50 text-xs font-medium mb-1">Manzanas</p>
              <p className="text-white text-xl font-bold font-display">{score}</p>
            </div>
            <div className="text-center">
              <p className="text-white/50 text-xs font-medium mb-1">Ganancia</p>
              <p className="text-green-400 text-xl font-bold font-display flex items-center justify-center gap-1">
                <Coins className="w-4 h-4" />
                +{coinsEarned}
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          
          {/* Game Area */}
          <div className="card-glass p-6 rounded-2xl border border-white/10 flex flex-col items-center">
            
            <div 
              className="grid gap-[1px] bg-arena-950 border-4 border-arena-800 rounded-lg overflow-hidden relative"
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                width: '100%',
                maxWidth: '500px',
                aspectRatio: '1/1'
              }}
            >
              {gridCells}

              {/* Overlays */}
              {status === 'IDLE' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                  <h2 className="text-2xl font-bold text-white mb-2">Juega al Snake</h2>
                  <p className="text-white/70 text-sm mb-6 max-w-xs">
                    Entrada: {ENTRY_FEE} ArenaCoins. Gana {COINS_PER_APPLE} monedas por cada manzana. ¡Cuidado con los bordes!
                  </p>
                  <button 
                    onClick={startGame}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Trophy className="w-5 h-5" />
                    Pagar {ENTRY_FEE} y Jugar
                  </button>
                  {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
                </div>
              )}

              {status === 'GAME_OVER' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
                  <h2 className="text-3xl font-bold text-red-500 mb-2">¡Choque!</h2>
                  <p className="text-white text-lg mb-1">Comiste {score} manzanas</p>
                  <p className="text-green-400 font-bold mb-6 flex items-center gap-1 justify-center">
                    <Coins className="w-5 h-5" /> Ganaste {coinsEarned} monedas
                  </p>
                  <button 
                    onClick={startGame}
                    className="btn-primary flex items-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Volver a jugar (-{ENTRY_FEE})
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Controls (Only visible on md and below) */}
            <div className="mt-8 grid grid-cols-3 gap-2 md:hidden">
              <div />
              <button 
                onClick={() => handleMobileControl(0, -1)}
                className="w-14 h-14 bg-arena-800 rounded-xl flex items-center justify-center active:bg-arena-700 transition-colors border border-white/5"
              >
                <ArrowUp className="w-6 h-6 text-white" />
              </button>
              <div />
              <button 
                onClick={() => handleMobileControl(-1, 0)}
                className="w-14 h-14 bg-arena-800 rounded-xl flex items-center justify-center active:bg-arena-700 transition-colors border border-white/5"
              >
                <ArrowLeftIcon className="w-6 h-6 text-white" />
              </button>
              <button 
                onClick={() => handleMobileControl(0, 1)}
                className="w-14 h-14 bg-arena-800 rounded-xl flex items-center justify-center active:bg-arena-700 transition-colors border border-white/5"
              >
                <ArrowDown className="w-6 h-6 text-white" />
              </button>
              <button 
                onClick={() => handleMobileControl(1, 0)}
                className="w-14 h-14 bg-arena-800 rounded-xl flex items-center justify-center active:bg-arena-700 transition-colors border border-white/5"
              >
                <ArrowRight className="w-6 h-6 text-white" />
              </button>
            </div>
            
          </div>

          {/* Side Info */}
          <div className="space-y-6">
            <div className="card-glass p-6 rounded-2xl border border-white/10 hidden md:block">
              <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                <Keyboard className="w-5 h-5 text-arena-400" />
                Controles PC
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-arena-900/50 p-3 rounded-lg flex items-center justify-center text-sm text-white/70 border border-white/5">
                  Flechas
                </div>
                <div className="bg-arena-900/50 p-3 rounded-lg flex items-center justify-center text-sm text-white/70 border border-white/5">
                  W A S D
                </div>
              </div>
            </div>

            <div className="card-glass p-6 rounded-2xl border border-white/10">
              <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Reglas
              </h3>
              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-arena-400 mt-0.5">•</span>
                  Pagas {ENTRY_FEE} monedas para iniciar la partida.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-arena-400 mt-0.5">•</span>
                  Recibes +{COINS_PER_APPLE} monedas por cada manzana que la serpiente coma.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-arena-400 mt-0.5">•</span>
                  Si la serpiente choca contra las paredes o su propio cuerpo, el juego termina.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-arena-400 mt-0.5">•</span>
                  Si comes 10 manzanas recuperas tu entrada. ¡Todo lo demás es ganancia pura!
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
