import { useEffect, useRef, useState } from "react";
import lifeAsset from "./assets/nyawa-animated.gif";
import coinAsset from "./assets/coin-animated.gif";
import { createWowoJumpGame } from "./game/config";

const INITIAL_STATE = { score: 0, coins: 0, lives: 3 };
const HIGH_SCORE_KEY = "wowojump-high-score";

function readHighScore() {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(score) {
  try {
    const nextScore = Math.max(readHighScore(), score);
    localStorage.setItem(HIGH_SCORE_KEY, String(nextScore));
    return nextScore;
  } catch {
    return score;
  }
}

export default function WowoJump() {
  const mountRef = useRef(null);
  const gameRef = useRef(null);
  const [status, setStatus] = useState("menu");
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [highScore, setHighScore] = useState(readHighScore);

  useEffect(() => {
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  const startGame = () => {
    setGameState(INITIAL_STATE);
    setStatus("playing");
    if (gameRef.current) {
      const scene = gameRef.current.scene.getScene("WowoJump");
      if (scene) {
        scene.restart();
      }
      return;
    }
    gameRef.current = createWowoJumpGame(mountRef.current, {
      onState: setGameState,
      onGameOver: ({ score, coins }) => {
        const nextHighScore = saveHighScore(score);
        setHighScore(nextHighScore);
        setGameState((current) => ({ ...current, score, coins }));
        setStatus("gameover");
      },
    });
  };

  const setMoveDirection = (direction) => {
    gameRef.current?.scene.getScene("WowoJump")?.setMoveDirection(direction);
  };

  // Prevent context menu and keep pointer captured on long press (mobile touch controls)
  const preventContextMenu = (e) => e.preventDefault();

  const handlePointerDown = (direction, e) => {
    e.preventDefault();
    if (e.target?.setPointerCapture) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch {
        // ignore capture errors on unsupported devices
      }
    }
    setMoveDirection(direction);
  };

  const handlePointerUp = (e) => {
    e.preventDefault();
    if (e.target?.releasePointerCapture) {
      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch {
        // ignore release errors
      }
    }
    setMoveDirection(0);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-3 py-5 text-white">
      <section className="mx-auto max-w-[430px] overflow-hidden rounded-2xl border-4 border-amber-400 bg-[#4f8eae] shadow-2xl">
        <div className="relative aspect-[3/5] min-h-[540px]">
          <div ref={mountRef} className="h-full w-full" />

          {status === "playing" && (
            <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between bg-slate-950/75 px-3 py-2 text-xs font-bold sm:text-sm">
              <span>SKOR: {gameState.score}</span>
              <span className="flex items-center gap-1.5">
                <img src={coinAsset} alt="coin" className="h-5 w-5 object-contain" />
                <span>{gameState.coins}</span>
              </span>
              <span className="flex items-center gap-1.5">
                NYAWA:{" "}
                {Array.from({ length: gameState.lives }, (_, index) => (
                  <img
                    key={index}
                    src={lifeAsset}
                    alt="nyawa"
                    className="h-6 w-6 object-contain"
                  />
                ))}
              </span>
            </div>
          )}

          {status !== "playing" && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75 p-6 text-center">
              <div className="w-full rounded-2xl border border-amber-300 bg-slate-900/95 p-6 shadow-xl">
                <h1 className="text-4xl font-black tracking-tight text-amber-300">WOWOJUMP</h1>
                {status === "menu" ? (
                  <>
                    <p className="mt-3 text-sm text-slate-200">Naik setinggi mungkin di 3 jalur vertikal (Kiri, Tengah, Kanan). Ambil coin & hindari sawit!</p>
                    <p className="mt-2 text-xs text-amber-300 font-semibold">← → atau A / D untuk berpindah jalur</p>
                    <button type="button" onClick={startGame} className="mt-6 rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-amber-300 active:scale-95">MULAI GAME</button>
                  </>
                ) : (
                  <>
                    <p className="mt-4 text-xl font-bold">GAME OVER</p>
                    <p className="mt-2">SKOR: {gameState.score}</p>
                    <p className="flex items-center justify-center gap-1.5">
                      <img src={coinAsset} alt="coin" className="h-5 w-5 object-contain" />
                      <span>COIN: {gameState.coins}</span>
                    </p>
                    <p className="mt-2 text-amber-300">HIGH SCORE: {highScore}</p>
                    <button type="button" onClick={startGame} className="mt-6 rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-950">MAIN LAGI</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {status === "playing" && (
          <div className="flex items-center justify-center gap-4 bg-slate-950 px-4 py-3">
            <button
              type="button"
              onPointerDown={(e) => handlePointerDown(-1, e)}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onContextMenu={preventContextMenu}
              className="rounded-lg border border-amber-300 px-6 py-3 font-bold select-none touch-none"
            >
              ←
            </button>
            <span className="text-xs text-slate-300">GERAK</span>
            <button
              type="button"
              onPointerDown={(e) => handlePointerDown(1, e)}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onContextMenu={preventContextMenu}
              className="rounded-lg border border-amber-300 px-6 py-3 font-bold select-none touch-none"
            >
              →
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
