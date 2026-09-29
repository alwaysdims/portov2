import { useEffect, useRef, useState, useCallback } from "react";
import lifeAsset from "./assets/nyawa-animated.gif";
import coinAsset from "./assets/coin-animated.gif";
import { createWowoJumpGame } from "./game/config";
import { audioManager } from "./WowoJumpAudio";
import {
  readHighScore,
  saveHighScore,
  readLeaderboard,
  saveLeaderboardEntry,
  readCoinBalance,
  addCoinsToBalance,
  readSkins,
  readSelectedSkin,
  purchaseSkin,
  selectSkin,
  WOWO_SKINS,
} from "./WowoJumpStorage";

const INITIAL_STATE = {
  score: 0,
  coins: 0,
  lives: 3,
  hasShield: false,
  hasMagnet: false,
  hasRocket: false,
};

function formatDate(timestamp) {
  try {
    const d = new Date(timestamp);
    return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  } catch {
    return "-";
  }
}

export default function WowoJump() {
  const mountRef = useRef(null);
  const gameRef = useRef(null);

  const [status, setStatus] = useState("menu"); // "menu" | "playing" | "gameover"
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [highScore, setHighScore] = useState(readHighScore);
  const [leaderboard, setLeaderboard] = useState(readLeaderboard);
  const [coinBalance, setCoinBalance] = useState(readCoinBalance);
  const [ownedSkins, setOwnedSkins] = useState(readSkins);
  const [selectedSkin, setSelectedSkin] = useState(readSelectedSkin);
  const [isMuted, setIsMuted] = useState(audioManager.isMuted);
  const [showShop, setShowShop] = useState(false);
  const [lastRank, setLastRank] = useState(null);
  const [isNewHigh, setIsNewHigh] = useState(false);

  useEffect(() => {
    return () => {
      audioManager.stopBgm();
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  const handleGameOver = useCallback(
    ({ score, coins, height }) => {
      const prevHigh = readHighScore();
      const nextHigh = saveHighScore(score);
      setHighScore(nextHigh);
      setIsNewHigh(score > prevHigh && score > 0);

      // Save to leaderboard
      const lbResult = saveLeaderboardEntry({ score, coins, height });
      setLeaderboard(lbResult.entries);
      setLastRank(lbResult.rank);

      // Add collected coins to shop balance
      const newBal = addCoinsToBalance(coins);
      setCoinBalance(newBal);

      setGameState((current) => ({ ...current, score, coins }));
      setStatus("gameover");
    },
    []
  );

  const startGame = () => {
    setShowShop(false);
    setGameState(INITIAL_STATE);
    setStatus("playing");
    setLastRank(null);
    setIsNewHigh(false);

    audioManager.init();
    audioManager.startBgm();

    if (gameRef.current) {
      const scene = gameRef.current.scene.getScene("WowoJump");
      if (scene) {
        scene.scene.restart();
      }
      return;
    }

    gameRef.current = createWowoJumpGame(mountRef.current, {
      onState: setGameState,
      onGameOver: handleGameOver,
    });
    window.__WOWO_GAME__ = gameRef.current;
  };

  const toggleMute = () => {
    const next = audioManager.toggleMute();
    setIsMuted(next);
  };

  const setMoveDirection = (direction) => {
    gameRef.current?.scene.getScene("WowoJump")?.setMoveDirection(direction);
  };

  const preventContextMenu = (e) => e.preventDefault();

  const handlePointerDown = (direction, e) => {
    e.preventDefault();
    if (e.target?.setPointerCapture) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch {
        // ignore
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
        // ignore
      }
    }
    setMoveDirection(0);
  };

  const handleBuySkin = (skinId) => {
    const res = purchaseSkin(skinId);
    if (res.success) {
      setCoinBalance(res.balance);
      setOwnedSkins(res.owned);
      setSelectedSkin(res.selected);
      gameRef.current?.scene.getScene("WowoJump")?.applyCosmeticSkin?.();
    }
  };

  const handleSelectSkin = (skinId) => {
    if (selectSkin(skinId)) {
      setSelectedSkin(skinId);
      gameRef.current?.scene.getScene("WowoJump")?.applyCosmeticSkin?.();
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-3 py-5 text-white select-none">
      <section className="mx-auto max-w-[430px] overflow-hidden rounded-2xl border-4 border-amber-400 bg-[#4f8eae] shadow-2xl relative">
        <div className="relative aspect-[3/5] min-h-[560px]">
          <div ref={mountRef} className="h-full w-full" />

          {/* Top Audio Toggle Button */}
          <button
            type="button"
            onClick={toggleMute}
            className="absolute top-3 right-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-amber-300 border border-amber-400/50 hover:bg-slate-800 transition shadow cursor-pointer"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
            aria-label="Toggle Audio"
          >
            {isMuted ? "🔇" : "🔊"}
          </button>

          {/* Realtime In-Game HUD */}
          {status === "playing" && (
            <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-1 bg-slate-950/80 px-3 py-2 text-xs font-bold sm:text-sm z-20">
              <div className="flex items-center justify-between">
                <span>SKOR: {gameState.score}</span>
                <span className="flex items-center gap-1.5">
                  <img src={coinAsset} alt="coin" className="h-5 w-5 object-contain" />
                  <span>{gameState.coins}</span>
                </span>
                <span className="flex items-center gap-1.5 pr-8">
                  NYAWA:{" "}
                  {Array.from({ length: gameState.lives }, (_, index) => (
                    <img key={index} src={lifeAsset} alt="nyawa" className="h-6 w-6 object-contain" />
                  ))}
                </span>
              </div>

              {/* Power-up Active Badges */}
              {(gameState.hasShield || gameState.hasMagnet || gameState.hasRocket) && (
                <div className="flex items-center gap-2 pt-0.5 text-[11px]">
                  {gameState.hasShield && (
                    <span className="rounded bg-cyan-500/30 border border-cyan-400 px-1.5 py-0.5 text-cyan-200 animate-pulse">
                      🛡️ PERISAI
                    </span>
                  )}
                  {gameState.hasMagnet && (
                    <span className="rounded bg-purple-500/30 border border-purple-400 px-1.5 py-0.5 text-purple-200 animate-pulse">
                      🧲 MAGNET
                    </span>
                  )}
                  {gameState.hasRocket && (
                    <span className="rounded bg-orange-500/30 border border-orange-400 px-1.5 py-0.5 text-orange-200 animate-pulse">
                      🚀 ROKET
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Menu Screen with Pre-Start Wowo Skin Selection */}
          {status === "menu" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/88 p-4 text-center overflow-y-auto">
              <div className="w-full max-w-sm rounded-2xl border-2 border-amber-400 bg-slate-900/98 p-5 shadow-2xl space-y-3.5 my-auto max-h-[95%] overflow-y-auto">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-amber-300">WOWOJUMP</h1>
                  <p className="mt-0.5 text-xs text-amber-200 font-medium">Endless Kopdes Vertical Jumper</p>
                </div>

                {/* Score & Coins Summary */}
                <div className="flex items-center justify-around rounded-xl bg-slate-950/70 py-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">HIGH SCORE</span>
                    <span className="text-sm font-bold text-amber-300">{highScore}</span>
                  </div>
                  <div className="h-5 w-px bg-slate-700" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">SALDO KOIN</span>
                    <span className="text-sm font-bold text-yellow-400 flex items-center gap-1 justify-center">
                      <img src={coinAsset} alt="coin" className="h-3.5 w-3.5 inline" /> {coinBalance}
                    </span>
                  </div>
                </div>

                {/* Skin Selector Card Before Start */}
                <div className="rounded-xl border border-amber-400/40 bg-slate-950/80 p-3 text-left">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <span className="text-[11px] font-bold text-amber-400">PILIH SKIN WOWO</span>
                    <button
                      type="button"
                      onClick={() => setShowShop(true)}
                      className="text-[10px] text-amber-300 underline hover:text-amber-200 cursor-pointer"
                    >
                      Lihat Semua
                    </button>
                  </div>

                  {/* Active Preview Carousel */}
                  {(() => {
                    const skin = WOWO_SKINS.find((s) => s.id === selectedSkin) || WOWO_SKINS[0];
                    return (
                      <div className="flex items-center gap-3 pt-2.5">
                        <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-900 border border-slate-700 p-1">
                          <img
                            src={skin.preview}
                            alt={skin.name}
                            className="h-full w-auto object-contain [image-rendering:pixelated]"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-white truncate">{skin.name}</p>
                            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/40">
                              DIPAKAI
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{skin.description}</p>
                          <button
                            type="button"
                            onClick={() => setShowShop(true)}
                            className="mt-2 text-[10px] font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Ganti atau Beli Skin Lain</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="rounded-xl bg-slate-800/80 p-2.5 text-[11px] text-slate-200 space-y-0.5 text-center">
                  <p>Lompat 3 jalur vertikal. Ambil koin & power-up, hindari sawit!</p>
                  <p className="text-amber-300 font-semibold">← → atau A / D untuk bergerak</p>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={startGame}
                    className="w-full rounded-xl bg-amber-400 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:bg-amber-300 active:scale-95 cursor-pointer"
                  >
                    MULAI GAME
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowShop(true)}
                    className="w-full rounded-xl border border-amber-400/60 bg-slate-800/80 py-2 text-xs font-bold text-amber-200 transition hover:bg-slate-700 cursor-pointer"
                  >
                    🛍️ PILIH & BELI SKIN WOWO
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Game Over Screen */}
          {status === "gameover" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/88 p-4 text-center overflow-y-auto">
              <div className="w-full max-w-sm rounded-2xl border-2 border-amber-400 bg-slate-900/98 p-5 shadow-2xl space-y-3.5 my-auto max-h-[92%] overflow-y-auto">
                <div>
                  <h2 className="text-3xl font-black text-rose-500 tracking-wide">WOWO KO!</h2>
                  <p className="text-xs text-slate-300">Wowo terjatuh / nyawa habis!</p>
                </div>

                {isNewHigh && (
                  <div className="rounded-lg bg-amber-400/20 border border-amber-400 px-3 py-1.5 text-xs font-bold text-amber-300 animate-pulse">
                    🎉 REKOR SKOR BARU: {highScore}!
                  </div>
                )}

                {/* Score Summary Box */}
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-950/70 p-2.5 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">SKOR</span>
                    <span className="text-lg font-black text-amber-300">{gameState.score}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">KOIN</span>
                    <span className="text-lg font-black text-yellow-400 flex items-center justify-center gap-1">
                      <img src={coinAsset} alt="coin" className="h-4 w-4" />
                      {gameState.coins}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">TERBAIK</span>
                    <span className="text-lg font-black text-slate-200">{highScore}</span>
                  </div>
                </div>

                {lastRank && (
                  <p className="text-xs font-semibold text-emerald-400">
                    🏆 Masuk Peringkat #{lastRank} di Top 10 Leaderboard!
                  </p>
                )}

                {/* Leaderboard Table */}
                <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-2.5 text-left text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px] font-bold text-amber-400">
                    <span>👑 LOCAL LEADERBOARD</span>
                    <span className="text-[10px] text-slate-400">TOP 10</span>
                  </div>

                  <div className="max-h-36 overflow-y-auto divide-y divide-slate-800/60 mt-1">
                    {leaderboard.length === 0 ? (
                      <p className="py-3 text-center text-[11px] text-slate-500">Belum ada skor tercatat.</p>
                    ) : (
                      leaderboard.map((entry, idx) => {
                        const isCurrent =
                          entry.score === gameState.score && entry.coins === gameState.coins;
                        return (
                          <div
                            key={entry.id || idx}
                            className={`flex items-center justify-between py-1 px-1.5 text-[11px] rounded ${
                              isCurrent ? "bg-amber-400/20 text-amber-200 font-bold" : "text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-4 font-mono text-slate-400">#{idx + 1}</span>
                              <span className="font-semibold text-white">{entry.score} pts</span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400">
                              <span>🪙 {entry.coins}</span>
                              <span>{formatDate(entry.date)}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={startGame}
                    className="w-full rounded-xl bg-amber-400 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:bg-amber-300 active:scale-95 cursor-pointer"
                  >
                    MAIN LAGI
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowShop(true)}
                    className="w-full rounded-xl border border-amber-400/60 bg-slate-800/80 py-2 text-xs font-bold text-amber-200 transition hover:bg-slate-700 cursor-pointer"
                  >
                    🛍️ PILIH & BELI SKIN ({coinBalance} Koin)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Shop Modal: Wowo Character Skins */}
          {showShop && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/92 p-4 text-center overflow-y-auto">
              <div className="w-full max-w-sm rounded-2xl border-2 border-amber-400 bg-slate-900/98 p-5 shadow-2xl space-y-3.5 my-auto max-h-[92%] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <h3 className="text-base font-black text-amber-300">PILIH & BELI SKIN WOWO</h3>
                  <div className="flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-yellow-400">
                    <img src={coinAsset} alt="coin" className="h-4 w-4" /> {coinBalance}
                  </div>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto text-left pr-1">
                  {WOWO_SKINS.map((item) => {
                    const isOwned = ownedSkins.includes(item.id) || item.cost === 0;
                    const isSelected = selectedSkin === item.id;
                    const canAfford = coinBalance >= item.cost;

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between rounded-xl border p-2.5 transition ${
                          isSelected
                            ? "border-amber-400 bg-amber-400/10 shadow-sm shadow-amber-400/20"
                            : "border-slate-700 bg-slate-800/60 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 border border-slate-700/80 p-0.5">
                            <img
                              src={item.preview}
                              alt={item.name}
                              className="h-full w-auto object-contain [image-rendering:pixelated]"
                            />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{item.name}</p>
                            <p className="text-[10px] text-slate-400 leading-tight">{item.description}</p>
                          </div>
                        </div>

                        <div className="shrink-0 pl-2">
                          {isSelected ? (
                            <span className="rounded bg-amber-400/20 px-2 py-1 text-[11px] font-bold text-amber-300 border border-amber-400/50">
                              DIPAKAI
                            </span>
                          ) : isOwned ? (
                            <button
                              type="button"
                              onClick={() => handleSelectSkin(item.id)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 cursor-pointer shadow"
                            >
                              Pakai
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={!canAfford}
                              onClick={() => handleBuySkin(item.id)}
                              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition shadow ${
                                canAfford
                                  ? "bg-amber-400 text-slate-950 hover:bg-amber-300 cursor-pointer"
                                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
                              }`}
                            >
                              Beli ({item.cost} 🪙)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setShowShop(false)}
                  className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  KEMBALI KE MENU
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile touch controls */}
        {status === "playing" && (
          <div className="flex items-center justify-center gap-6 bg-slate-950 px-4 py-3 border-t border-slate-800">
            <button
              type="button"
              onPointerDown={(e) => handlePointerDown(-1, e)}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onContextMenu={preventContextMenu}
              className="flex-1 max-w-[120px] rounded-xl border-2 border-amber-300 bg-slate-900 py-3 text-lg font-black text-amber-300 select-none touch-none active:bg-amber-400 active:text-slate-950 transition shadow"
              aria-label="Gerak Kiri"
            >
              ← KIRI
            </button>
            <span className="text-[11px] font-bold text-slate-400 tracking-wider">KENDALI</span>
            <button
              type="button"
              onPointerDown={(e) => handlePointerDown(1, e)}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onContextMenu={preventContextMenu}
              className="flex-1 max-w-[120px] rounded-xl border-2 border-amber-300 bg-slate-900 py-3 text-lg font-black text-amber-300 select-none touch-none active:bg-amber-400 active:text-slate-950 transition shadow"
              aria-label="Gerak Kanan"
            >
              KANAN →
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
