import { useEffect, useRef, useState, useCallback } from "react";
import { createSeranganFajarGame } from "./game/createGame.js";
import { useTheme } from "../../hooks/useTheme";
import { GameOverPanel } from "./components/GameOverPanel.jsx";
import { VirtualJoystick } from "./components/VirtualJoystick.jsx";
import { audioManager } from "./game/audio/AudioManager.js";
import bossIconPng from "./assets/boss/boss-icon.png";
import {
  HiArrowLeft,
  HiPlay,
  HiPause,
  HiArrowPath,
  HiClock,
  HiTrophy,
  HiDocumentCheck,
  HiEnvelope,
  HiSpeakerWave,
  HiSpeakerXMark,
  HiSparkles,
  HiHeart,
  HiBolt,
  HiDevicePhoneMobile,
  HiArrowsPointingOut,
  HiArrowsPointingIn,
} from "react-icons/hi2";

export default function SeranganFajar() {
  const { isDark } = useTheme();
  const mountRef = useRef(null);
  const stageContainerRef = useRef(null);
  const gameRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playerPos, setPlayerPos] = useState({ x: 1200, y: 1200, isMoving: false });
  const [formattedTime, setFormattedTime] = useState("00:00");
  const [score, setScore] = useState(0);
  const [isMuted, setIsMuted] = useState(audioManager.isMuted);
  const [gameOverSummary, setGameOverSummary] = useState(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showJoystick, setShowJoystick] = useState(true);
  const [isPortrait, setIsPortrait] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Boss encounter states (Update Fitur Boss Level Up)
  const [bossStatus, setBossStatus] = useState(null);
  const [bossAlert, setBossAlert] = useState(null);
  const [bossVictory, setBossVictory] = useState(null);

  useEffect(() => {
    const checkViewportAndTouch = () => {
      if (typeof window === "undefined") return;
      const hasTouch =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia("(pointer: coarse)").matches;
      setIsTouchDevice(hasTouch);
      setIsPortrait(window.innerHeight > window.innerWidth && window.innerWidth < 768);
    };

    checkViewportAndTouch();
    window.addEventListener("resize", checkViewportAndTouch);
    window.addEventListener("orientationchange", checkViewportAndTouch);
    return () => {
      window.removeEventListener("resize", checkViewportAndTouch);
      window.removeEventListener("orientationchange", checkViewportAndTouch);
    };
  }, []);

  const [basicAttack, setBasicAttack] = useState({
    name: "Surat Suara",
    range: 300,
    attacksFired: 0,
    damage: 25,
  });

  const [stats, setStats] = useState({
    hp: 1000,
    maxHp: 1000,
    hpPercent: 100,
    mana: 100,
    maxMana: 100,
    manaPercent: 100,
    energy: 0,
    maxEnergy: 100,
    energyPercent: 0,
    speed: 220,
    level: 1,
    xp: 0,
    xpRequired: 50,
    xpPercent: 0,
    coins: 0,
    queuedLevelUps: 0,
    upgradeLevels: {},
    isInvulnerable: false,
    status: "alive",
    isAlive: true,
  });

  const [levelUpModal, setLevelUpModal] = useState({
    isOpen: false,
    level: 1,
    choices: [],
  });

  const [skills, setSkills] = useState({
    skill1: { isReady: false, cooldownRemaining: 0, cooldownTotal: 5, cooldownPercent: 0, hasMana: true, manaCost: 20 },
    skill2: { isReady: false, cooldownRemaining: 0, cooldownTotal: 8, cooldownPercent: 0, hasMana: true, manaCost: 35 },
    ultimate: { isReady: false, currentEnergy: 0, energyCost: 100, hasEnergy: false },
  });

  // Navigation back to games gallery
  const handleBack = useCallback(() => {
    window.history.pushState({}, "", "/games");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  // Skill & Attack casting handlers (Tahap 5, 6, 9)
  const handleFireBasicAttack = useCallback(() => {
    const scene = gameRef.current?.scene?.getScene("SurvivalScene");
    scene?.fireBasicAttack();
  }, []);

  const handleCastSkill1 = useCallback(() => {
    const scene = gameRef.current?.scene?.getScene("SurvivalScene");
    scene?.castSkill1();
  }, []);

  const handleCastSkill2 = useCallback(() => {
    const scene = gameRef.current?.scene?.getScene("SurvivalScene");
    scene?.castSkill2();
  }, []);

  const handleCastUltimate = useCallback(() => {
    const scene = gameRef.current?.scene?.getScene("SurvivalScene");
    scene?.castUltimate();
  }, []);

  // Control handlers
  const handleTogglePause = useCallback(() => {
    const scene = gameRef.current?.scene?.getScene("SurvivalScene");
    if (scene) {
      scene.togglePause();
    }
  }, []);

  const handleRestart = useCallback(() => {
    const scene = gameRef.current?.scene?.getScene("SurvivalScene");
    if (scene) {
      scene.restartGame();
      scene.setMovement(0, 0);
      setGameOverSummary(null);
      setFormattedTime("00:00");
      setScore(0);
      setBossStatus(null);
      setBossAlert(null);
      setBossVictory(null);
    }
  }, []);

  const handleTestBoss = useCallback((lvl = 1) => {
    const scene = gameRef.current?.scene?.getScene("SurvivalScene");
    scene?.debugSpawnBoss(lvl);
  }, []);

  const handleJoystickMove = useCallback((movement) => {
    const scene = gameRef.current?.scene?.getScene("SurvivalScene");
    scene?.setMovement(movement.vx, movement.vy);
  }, []);

  const handleToggleMute = useCallback(() => {
    audioManager.init();
    const nextMuted = audioManager.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  // Debug testing helpers
  const handleTestHit = useCallback((amount = 150) => {
    const scene = gameRef.current?.scene?.getScene("SurvivalScene");
    if (scene) {
      scene.takeDamage(amount);
    }
  }, []);

  const handleTestHeal = useCallback((amount = 150) => {
    const scene = gameRef.current?.scene?.getScene("SurvivalScene");
    if (scene) {
      scene.heal(amount);
    }
  }, []);

  const handleTestMana = useCallback((amount = 25) => {
    const scene = gameRef.current?.scene?.getScene("SurvivalScene");
    if (scene?.stats) {
      scene.stats.consumeMana(amount);
    }
  }, []);

  const handleTestEnergy = useCallback((amount = 25) => {
    const scene = gameRef.current?.scene?.getScene("SurvivalScene");
    if (scene?.stats) {
      scene.stats.addEnergy(amount);
    }
  }, []);

  const handleTestXp = useCallback((amount = 50) => {
    const scene = gameRef.current?.scene?.getScene("SurvivalScene");
    scene?.debugAddXp(amount);
  }, []);

  const handleTestCoins = useCallback((amount = 5) => {
    const scene = gameRef.current?.scene?.getScene("SurvivalScene");
    scene?.debugAddCoins(amount);
  }, []);

  const handleChooseUpgrade = useCallback((upgradeId) => {
    const scene = gameRef.current?.scene?.getScene("SurvivalScene");
    scene?.chooseUpgrade(upgradeId);
  }, []);

  // Fullscreen mode handler
  const handleToggleFullscreen = useCallback(() => {
    if (!stageContainerRef.current) return;

    const isCurrentlyFs = Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      isFullscreen
    );

    if (!isCurrentlyFs) {
      const el = stageContainerRef.current;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen && document.webkitFullscreenElement) {
        document.webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }

    setTimeout(() => {
      gameRef.current?.scale?.refresh();
    }, 80);
  }, [isFullscreen]);

  // Fullscreen change & keyboard shortcut [F] listener
  useEffect(() => {
    const onFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement || document.webkitFullscreenElement
      );
      setIsFullscreen(isFs);
      setTimeout(() => {
        gameRef.current?.scale?.refresh();
      }, 50);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);

    const handleGlobalKey = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        handleToggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleGlobalKey);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      window.removeEventListener("keydown", handleGlobalKey);
    };
  }, [handleToggleFullscreen]);

  const toggleFullscreenRef = useRef(handleToggleFullscreen);
  useEffect(() => {
    toggleFullscreenRef.current = handleToggleFullscreen;
  });

  // Keyboard shortcut [1], [2], [3] for upgrade selection
  useEffect(() => {
    if (!levelUpModal.isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "1" && levelUpModal.choices[0]) {
        handleChooseUpgrade(levelUpModal.choices[0].id);
      } else if (e.key === "2" && levelUpModal.choices[1]) {
        handleChooseUpgrade(levelUpModal.choices[1].id);
      } else if (e.key === "3" && levelUpModal.choices[2]) {
        handleChooseUpgrade(levelUpModal.choices[2].id);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [levelUpModal, handleChooseUpgrade]);

  // React 19 StrictMode resilient lifecycle
  useEffect(() => {
    let isMounted = true;

    // Small delay allows DOM node layout computation
    const initTimer = setTimeout(() => {
      if (mountRef.current && !gameRef.current && isMounted) {
        const gameInstance = createSeranganFajarGame(mountRef.current, {
          onGameReady: (data) => {
            if (isMounted) {
              setIsReady(true);
              if (data?.formattedTime) setFormattedTime(data.formattedTime);
              if (data?.score !== undefined) setScore(data.score);
            }
          },
          onPauseChange: (paused) => {
            if (isMounted) setIsPaused(paused);
          },
          onPlayerUpdate: (pos) => {
            if (isMounted) {
              setPlayerPos(pos);
              if (pos?.skills) {
                setSkills(pos.skills);
              }
              if (pos?.basicAttack) {
                setBasicAttack(pos.basicAttack);
              }
              if (pos?.formattedTime !== undefined) {
                setFormattedTime(pos.formattedTime);
              }
              if (pos?.score !== undefined) {
                setScore(pos.score);
              }
            }
          },
          onStatsUpdate: (newStats) => {
            if (isMounted) setStats(newStats);
          },
          onLevelUp: ({ level, choices }) => {
            if (isMounted) {
              setLevelUpModal({ isOpen: true, level, choices: choices || [] });
            }
          },
          onLevelUpClose: () => {
            if (isMounted) {
              setLevelUpModal({ isOpen: false, level: 1, choices: [] });
            }
          },
          onGameOver: (summary) => {
            if (isMounted) {
              setGameOverSummary(summary);
            }
          },
          onGameOverChange: (val) => {
            if (isMounted) {
              setGameOverSummary(val);
            }
          },
          onBossStatus: (status) => {
            if (isMounted) {
              setBossStatus(status?.active ? status : null);
            }
          },
          onBossAlert: (alert) => {
            if (isMounted) {
              setBossAlert(alert);
              setTimeout(() => {
                if (isMounted) setBossAlert(null);
              }, alert.duration || 3500);
            }
          },
          onBossDefeated: (victory) => {
            if (isMounted) {
              setBossStatus(null);
              setBossVictory(victory);
              setTimeout(() => {
                if (isMounted) setBossVictory(null);
              }, 4500);
            }
          },
          onToggleFullscreen: () => {
            if (isMounted) {
              toggleFullscreenRef.current?.();
            }
          },
        });
        gameRef.current = gameInstance;
        window.__SERANGAN_FAJAR_GAME__ = gameInstance;
      }
    }, 10);

    return () => {
      isMounted = false;
      clearTimeout(initTimer);
      audioManager.destroy();
      if (window.__SERANGAN_FAJAR_GAME__ === gameRef.current) {
        delete window.__SERANGAN_FAJAR_GAME__;
      }
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between p-2 md:p-6 select-none"
      style={{
        background: isDark ? "#090d16" : "#f1f5f9",
        color: isDark ? "#f8fafc" : "#0f172a",
        paddingTop: "max(0.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(0.5rem, env(safe-area-inset-left))",
        paddingRight: "max(0.5rem, env(safe-area-inset-right))",
      }}
    >
      {/* Landscape Orientation Hint for small portrait screens */}
      {isPortrait && stats.isAlive && !isPaused && (
        <div className="w-full max-w-5xl mb-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-1.5">
            <HiDevicePhoneMobile className="w-4 h-4 text-amber-400 rotate-90 shrink-0" />
            <span>Mode Landscape disarankan untuk jarak pandang arena TPS lebih luas.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsPortrait(false)}
            className="text-amber-400 hover:text-amber-200 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
            title="Tutup Pesan"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header bar */}
      <header className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-2 py-2 px-3 mb-2 rounded-xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 cursor-pointer"
          >
            <HiArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
          <div>
            <h1 className="text-sm sm:text-base md:text-lg font-black tracking-wide text-amber-400">
              SERANGAN FAJAR: THE LAST STAND
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Top-Down Survival Action Satire Pemilu
            </p>
          </div>
        </div>

        {/* Vital Match Stats: Timer & Score (Tahap 9) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-slate-950/80 border border-cyan-500/30 text-cyan-300 shadow-inner"
            title="Lama Bertahan Hidup"
          >
            <HiClock className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 leading-none hidden sm:inline">WAKTU</span>
              <span className="font-mono font-black text-xs sm:text-sm tracking-wider leading-none">
                {formattedTime}
              </span>
            </div>
          </div>

          <div
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-slate-950/80 border border-amber-500/40 text-amber-300 shadow-inner"
            title="Total Skor Permainan"
          >
            <HiTrophy className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-amber-500 leading-none hidden sm:inline">SKOR</span>
              <span className="font-mono font-black text-xs sm:text-sm tracking-wider leading-none">
                {score.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleToggleMute}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-colors border cursor-pointer ${
              isMuted
                ? "border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                : "border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
            }`}
            title={isMuted ? "Aktifkan Suara" : "Bisukan Suara"}
          >
            {isMuted ? (
              <>
                <HiSpeakerXMark className="w-4 h-4" />
                <span className="hidden sm:inline">Mute</span>
              </>
            ) : (
              <>
                <HiSpeakerWave className="w-4 h-4" />
                <span className="hidden sm:inline">Audio</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleTogglePause}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-colors border cursor-pointer ${
              isPaused
                ? "bg-emerald-600 border-emerald-400 text-white"
                : "border-slate-600 text-slate-300 hover:bg-slate-800"
            }`}
          >
            {isPaused ? (
              <>
                <HiPlay className="w-4 h-4" />
                <span>Lanjut</span>
              </>
            ) : (
              <>
                <HiPause className="w-4 h-4" />
                <span>Pause (P)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-colors border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 cursor-pointer"
          >
            <HiArrowPath className="w-4 h-4" />
            <span>Reset (R)</span>
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-colors border border-purple-500/40 text-purple-300 hover:bg-purple-500/10 cursor-pointer"
            title="Mode Layar Penuh (F)"
          >
            {isFullscreen ? (
              <>
                <HiArrowsPointingIn className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">Normal</span>
              </>
            ) : (
              <>
                <HiArrowsPointingOut className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">Layar Penuh (F)</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Player Stats & Progression HUD Bar (Tahap 3, 7 & 9) */}
      <section className="w-full max-w-5xl flex flex-col gap-2 mb-2 p-2.5 rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-md">
        {/* Row 1: Level, XP Progress Bar, and Coins */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs tracking-wider">
              LEVEL {stats.level}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 font-bold text-xs flex items-center gap-1">
              <span>🪙</span>
              <span>{stats.coins} DANA</span>
            </span>
          </div>

          <div className="flex-1 w-full flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-emerald-400">PROGRESS SUARA (XP)</span>
              <span className="font-mono text-slate-300">
                {stats.xp} / {stats.xpRequired} XP ({Math.round(stats.xpPercent)}%)
              </span>
            </div>
            <div className="h-2 w-full bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-green-500 to-teal-400 transition-all duration-200"
                style={{ width: `${stats.xpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Row 2: HP, Mana, and Energy (Tahap 9 & 13 Responsive Layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2">
          {/* HP Bar */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="flex items-center gap-1 text-rose-400">
                <HiHeart className="w-3.5 h-3.5" />
                <span>HP</span>
                {stats.isInvulnerable && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 animate-pulse border border-amber-500/40 font-mono">
                    I-FRAME
                  </span>
                )}
                {stats.hpPercent <= 20 && stats.isAlive && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/40 font-black">
                    KRITIS!
                  </span>
                )}
              </span>
              <span className="font-mono text-slate-300">
                {stats.hp} / {stats.maxHp}
              </span>
            </div>
            <div className={`h-3 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border transition-all ${
              stats.hpPercent <= 20 && stats.isAlive ? "border-rose-500/80 ring-1 ring-rose-500/50" : "border-slate-700/50"
            }`}>
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  stats.hpPercent > 50
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                    : stats.hpPercent > 20
                    ? "bg-gradient-to-r from-amber-500 to-amber-400"
                    : "bg-gradient-to-r from-rose-600 to-rose-500 animate-pulse"
                }`}
                style={{ width: `${stats.hpPercent}%` }}
              />
            </div>
          </div>

          {/* Mana Bar */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="flex items-center gap-1 text-sky-400">
                <HiBolt className="w-3.5 h-3.5" />
                <span>MANA (+{stats.manaRegen ?? 5}/dtk)</span>
              </span>
              <span className="font-mono text-slate-300">
                {Math.round(stats.mana)} / {stats.maxMana}
              </span>
            </div>
            <div className="h-3 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-600 to-cyan-400 transition-all duration-150"
                style={{ width: `${stats.manaPercent}%` }}
              />
            </div>
          </div>

          {/* Energy Bar & Status */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="flex items-center gap-1 text-amber-400">
                <HiSparkles className="w-3.5 h-3.5" />
                <span>FAJAR ENERGY</span>
                {stats.energy >= 100 && stats.isAlive && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 animate-pulse border border-amber-400 font-black">
                    ULTIMATE SIAP!
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <span className="text-slate-300">{Math.round(stats.energy)} / 100</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide ${
                    stats.isAlive
                      ? stats.energy >= 100
                        ? "bg-amber-500/30 text-amber-300 border border-amber-400 animate-pulse"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  }`}
                >
                  {stats.isAlive ? "HIDUP" : "MATI"}
                </span>
              </span>
            </div>
            <div className={`h-3 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border transition-all ${
              stats.energy >= 100 && stats.isAlive
                ? "border-amber-400/90 ring-1 ring-amber-400 shadow-md shadow-amber-500/30"
                : "border-slate-700/50"
            }`}>
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  stats.energy >= 100
                    ? "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 animate-pulse"
                    : "bg-gradient-to-r from-amber-500 to-yellow-300"
                }`}
                style={{ width: `${stats.energyPercent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Game Stage Container */}
      <main className="relative w-full max-w-5xl flex-1 flex flex-col items-center justify-center">
        <div
          ref={stageContainerRef}
          className={`relative ${
            isFullscreen
              ? "fixed inset-0 z-50 w-screen h-screen max-w-none max-h-none rounded-none border-0"
              : "w-full aspect-video max-h-[75vh] rounded-2xl border-2 border-slate-700/60 shadow-2xl shadow-cyan-950/40"
          } overflow-hidden bg-slate-950 flex items-center justify-center`}
        >
          {/* Fullscreen Floating Top Bar Overlay */}
          {isFullscreen && (
            <div className="absolute top-2 left-2 right-2 z-30 flex items-center justify-between gap-2 pointer-events-none px-3 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl">
              {/* Left: Player Vital Bars */}
              <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-[10px] sm:text-xs tracking-wider">
                  LVL {stats.level}
                </span>

                {/* HP Bar */}
                <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-lg border border-rose-500/40 shadow-inner">
                  <HiHeart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <div className="w-16 sm:w-28 h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-150"
                      style={{ width: `${stats.hpPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-200 hidden sm:inline">
                    {stats.hp}
                  </span>
                </div>

                {/* Mana Bar */}
                <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-lg border border-sky-500/40 shadow-inner">
                  <HiBolt className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <div className="w-12 sm:w-20 h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-150"
                      style={{ width: `${stats.manaPercent}%` }}
                    />
                  </div>
                </div>

                {/* Energy Bar */}
                <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-lg border border-amber-500/40 shadow-inner hidden md:flex">
                  <HiSparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div className="w-16 h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-150"
                      style={{ width: `${stats.energyPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Center: Timer & Score */}
              <div className="flex items-center gap-2 font-mono font-black text-xs sm:text-sm">
                <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 text-cyan-300 border border-cyan-500/40 shadow-inner">
                  ⏱️ {formattedTime}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 text-amber-300 border border-amber-500/40 shadow-inner hidden sm:inline">
                  ⭐ {score.toLocaleString("id-ID")}
                </span>
              </div>

              {/* Right: Audio, Pause & Exit Fullscreen Button */}
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 cursor-pointer"
                  title={isMuted ? "Aktifkan Audio" : "Bisukan Audio"}
                >
                  {isMuted ? <HiSpeakerXMark className="w-4 h-4 text-rose-400" /> : <HiSpeakerWave className="w-4 h-4 text-cyan-400" />}
                </button>
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    isPaused ? "bg-emerald-600 text-white border-emerald-400" : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600"
                  }`}
                  title="Pause (P)"
                >
                  {isPaused ? <HiPlay className="w-4 h-4" /> : <HiPause className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleToggleFullscreen}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold shadow-md cursor-pointer border border-purple-400 transition-colors"
                  title="Keluar Layar Penuh (F / Esc)"
                >
                  <HiArrowsPointingIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Keluar (F)</span>
                </button>
              </div>
            </div>
          )}

          {/* Mount point for Phaser canvas */}
          <div
            ref={mountRef}
            onClick={() => {
              const canvas = mountRef.current?.querySelector("canvas");
              if (canvas) canvas.focus();
              if (document.activeElement && document.activeElement !== document.body && document.activeElement !== canvas) {
                document.activeElement.blur();
              }
            }}
            className="w-full h-full flex items-center justify-center [&>canvas]:max-w-full [&>canvas]:max-h-full [&>canvas]:object-contain cursor-default"
          />

          {/* Boss Health Bar Overlay (Update Fitur Boss Level Up) */}
          {bossStatus && bossStatus.active && (
            <div className={`absolute ${isFullscreen ? "top-16" : "top-3"} left-1/2 -translate-x-1/2 w-[92%] max-w-xl z-20 pointer-events-none animate-fadeIn`}>
              <div className="bg-slate-900/95 border-2 border-amber-500/80 rounded-xl px-3 py-2 shadow-2xl shadow-rose-950/60 backdrop-blur-md flex items-center gap-3">
                {/* Boss avatar square */}
                <div className="w-11 h-11 rounded-lg border-2 border-amber-500 overflow-hidden bg-slate-950 flex items-center justify-center shrink-0 shadow-inner">
                  <img
                    src={bossIconPng}
                    alt={bossStatus.name}
                    className="w-full h-full object-cover pixelated"
                  />
                </div>

                {/* Name & HP Bar */}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <div className="flex justify-between items-center text-xs font-black">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-amber-400 font-extrabold tracking-wide uppercase drop-shadow">
                        {bossStatus.name}
                      </span>
                      {bossStatus.isRage && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-600/90 text-white text-[9px] font-black uppercase tracking-wider animate-pulse border border-rose-400">
                          BERSERK FASE 2
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-300 shrink-0">
                      {Math.round(bossStatus.hp)} / {bossStatus.maxHp} HP ({Math.round(bossStatus.hpPercent)}%)
                    </span>
                  </div>

                  {/* Gradient Health Bar */}
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
                    <div
                      className={`h-full rounded-full transition-all duration-150 ${
                        bossStatus.isRage
                          ? "bg-gradient-to-r from-rose-600 via-red-500 to-amber-500 animate-pulse"
                          : "bg-gradient-to-r from-red-600 via-rose-500 to-orange-400"
                      }`}
                      style={{ width: `${bossStatus.hpPercent}%` }}
                    />
                  </div>
                </div>

                {/* Skull Badge */}
                <div className="w-9 h-9 rounded-lg bg-rose-950/80 border border-rose-500/60 flex items-center justify-center shrink-0 text-base shadow-sm">
                  💀
                </div>
              </div>
            </div>
          )}

          {/* Boss Encounter Alert Banner (Level Up Spawn) */}
          {bossAlert && (
            <div className={`absolute ${isFullscreen ? "top-24" : "top-16"} left-1/2 -translate-x-1/2 z-30 pointer-events-none w-[90%] max-w-md animate-pulse`}>
              <div className="bg-gradient-to-r from-rose-950/95 via-red-900/95 to-slate-950/95 border-2 border-rose-500 rounded-2xl p-4 text-center shadow-2xl shadow-rose-600/50 backdrop-blur-md">
                <div className="text-amber-300 font-black text-xs uppercase tracking-widest mb-0.5">
                  ⭐ {bossAlert.title} ⭐
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white tracking-wider drop-shadow-md">
                  {bossAlert.subtitle}
                </h3>
                <p className="text-xs text-rose-200 mt-1 font-medium">
                  {bossAlert.message}
                </p>
              </div>
            </div>
          )}

          {/* Boss Defeated Victory Banner */}
          {bossVictory && (
            <div className={`absolute ${isFullscreen ? "top-24" : "top-16"} left-1/2 -translate-x-1/2 z-30 pointer-events-none w-[90%] max-w-md animate-pulse`}>
              <div className="bg-gradient-to-r from-amber-950/95 via-yellow-900/95 to-slate-950/95 border-2 border-yellow-400 rounded-2xl p-4 text-center shadow-2xl shadow-yellow-500/50 backdrop-blur-md">
                <div className="text-yellow-300 font-black text-sm uppercase tracking-widest mb-0.5">
                  🏆 VICTORY! 🏆
                </div>
                <h3 className="text-lg md:text-xl font-black text-white tracking-wider drop-shadow-md">
                  {bossVictory.message}
                </h3>
                <p className="text-xs text-yellow-100 mt-1 font-medium">
                  {bossVictory.rewardText}
                </p>
              </div>
            </div>
          )}

          {/* Level Up Upgrade Selection Modal (Tahap 7) */}
          {levelUpModal.isOpen && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center z-30 p-4">
              <div className="w-full max-w-2xl bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl p-5 shadow-2xl shadow-amber-500/20 text-center">
                <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs uppercase tracking-widest mb-1">
                  ⭐ LEVEL UP! (LEVEL {levelUpModal.level}) ⭐
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide">
                  PILIH UPGRADE WOWO
                </h2>
                <p className="text-xs text-slate-400 mb-5">
                  Pilih salah satu dari 3 kartu berikut untuk memperkuat statistik tempur Wowo (Klik atau tekan [1], [2], [3])
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {levelUpModal.choices.map((choice, index) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => handleChooseUpgrade(choice.id)}
                      className="group relative flex flex-col items-center justify-between p-4 rounded-xl border-2 border-slate-700 bg-slate-800/80 hover:bg-slate-800 hover:border-amber-400 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer text-left shadow-lg"
                    >
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs flex items-center justify-center">
                        {index + 1}
                      </div>

                      <div className="w-full text-center mt-3">
                        <span className="text-3xl filter drop-shadow">{choice.icon}</span>
                        <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors mt-2">
                          {choice.name}
                        </h3>
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-900/80 text-amber-400 border border-slate-700 mt-1">
                          {choice.statLabel}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 text-center my-3 leading-relaxed">
                        {choice.description}
                      </p>

                      <div className="w-full pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Level</span>
                        <span className="font-bold text-amber-300">
                          Lv. {choice.currentLevel} → {choice.nextLevel} (Maks {choice.maxLevel})
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pause overlay modal */}
          {isPaused && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
              <div className="text-center p-6 rounded-2xl border border-amber-500/30 bg-slate-900/90 shadow-xl max-w-sm">
                <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
                  Sesi Dijeda
                </span>
                <h2 className="text-2xl font-black text-white mt-1 mb-4">GAME PAUSED</h2>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleTogglePause}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-transform active:scale-95 cursor-pointer"
                  >
                    Lanjutkan Permainan
                  </button>
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="w-full py-2 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Restart Sesi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Game Over & Leaderboard Panel (Tahap 10) */}
          {(!stats.isAlive || gameOverSummary !== null) && (
            <GameOverPanel
              summary={
                gameOverSummary || {
                  score,
                  survivalTime: 0,
                  formattedTime,
                  level: stats.level,
                  enemiesKilled: playerPos.enemiesKilled ?? 0,
                  votesCollected: stats.xp,
                  fundsCollected: stats.coins,
                  attacksFired: playerPos.attacksFired ?? 0,
                }
              }
              onRestart={handleRestart}
              onBack={handleBack}
            />
          )}

          {/* Virtual Analog Joystick (Tahap 13 — Left Thumb Movement) */}
          {showJoystick && stats.isAlive && !isPaused && !levelUpModal.isOpen && (
            <div
              className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 z-20"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <VirtualJoystick
                onMove={handleJoystickMove}
                disabled={!stats.isAlive || isPaused || levelUpModal.isOpen}
                size={110}
                knobSize={44}
                maxRadius={38}
              />
            </div>
          )}

          {/* Touch Skill Bar (Tahap 9 & 13 — Desktop Centered: [BASIC ATTACK] [SKILL 1] [SKILL 2] [ULTIMATE]) */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute bottom-2 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-10 w-[95%] max-w-xl hidden md:flex items-center justify-center gap-1.5 sm:gap-2.5 bg-slate-950/90 backdrop-blur-md px-2 sm:px-4 py-1.5 sm:py-2 rounded-2xl border border-slate-700/70 shadow-2xl select-none"
            style={{ touchAction: "manipulation" }}
          >
            {/* 1. Basic Attack: Surat Suara */}
            <button
              type="button"
              onClick={handleFireBasicAttack}
              disabled={!stats.isAlive || isPaused}
              title="Serangan Otomatis Surat Suara (Klik untuk tembak terdekat)"
              className="relative flex-1 max-w-[100px] h-14 sm:h-16 flex flex-col items-center justify-center rounded-xl border-2 border-emerald-600/50 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/50 hover:border-emerald-400 active:scale-95 transition-all cursor-pointer shadow-md shadow-emerald-950/30 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
            >
              <span className="absolute top-1 left-1.5 text-[9px] font-black font-mono px-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                AUTO
              </span>
              <HiDocumentCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mt-1" />
              <span className="text-[10px] sm:text-xs font-black tracking-tight mt-0.5 leading-none">
                SURAT SUARA
              </span>
              <span className="text-[9px] text-emerald-400/90 font-mono mt-0.5 leading-none">
                {basicAttack.damage || 25} DMG
              </span>
            </button>

            {/* 2. Skill 1: Tebar Pesona (Q) */}
            <button
              type="button"
              onClick={handleCastSkill1}
              disabled={!stats.isAlive || isPaused || !skills.skill1?.isReady}
              title="Skill 1: Tebar Pesona (3 Amplop Burst) - Shortcut Q"
              className={`relative flex-1 max-w-[100px] h-14 sm:h-16 flex flex-col items-center justify-center rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                skills.skill1?.isReady
                  ? "bg-sky-950/80 border-sky-400 text-sky-200 hover:bg-sky-900/80 active:scale-95 shadow-md shadow-sky-500/20 ring-1 ring-sky-400/50"
                  : skills.skill1?.cooldownRemaining > 0
                  ? "bg-slate-950/90 border-slate-700/60 text-slate-400 cursor-not-allowed"
                  : "bg-slate-900/60 border-rose-900/40 text-rose-400/80 cursor-not-allowed opacity-75"
              }`}
            >
              {/* Cooldown sweep overlay */}
              {skills.skill1?.cooldownRemaining > 0 && (
                <div
                  className="absolute inset-x-0 bottom-0 bg-slate-900/85 transition-all pointer-events-none"
                  style={{ height: `${skills.skill1.cooldownPercent || 100}%` }}
                />
              )}

              <span className="absolute top-1 left-1.5 text-[9px] font-black font-mono px-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 z-10">
                Q
              </span>
              <HiEnvelope className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 mt-1 z-10" />
              <span className="text-[10px] sm:text-xs font-black tracking-tight mt-0.5 leading-none z-10">
                {skills.skill1?.cooldownRemaining > 0
                  ? `${skills.skill1.cooldownRemaining}s`
                  : !skills.skill1?.hasMana
                  ? "NO MANA"
                  : "AMPLOP"}
              </span>
              <span className="text-[9px] text-sky-300 font-mono mt-0.5 leading-none z-10">
                {skills.skill1?.cooldownRemaining > 0 ? "COOLDOWN" : "20 MP"}
              </span>
            </button>

            {/* 3. Skill 2: Orasi Akbar (E) */}
            <button
              type="button"
              onClick={handleCastSkill2}
              disabled={!stats.isAlive || isPaused || !skills.skill2?.isReady}
              title="Skill 2: Orasi Akbar (AoE Gelombang & Knockback) - Shortcut E"
              className={`relative flex-1 max-w-[100px] h-14 sm:h-16 flex flex-col items-center justify-center rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                skills.skill2?.isReady
                  ? "bg-cyan-950/80 border-cyan-400 text-cyan-200 hover:bg-cyan-900/80 active:scale-95 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/50"
                  : skills.skill2?.cooldownRemaining > 0
                  ? "bg-slate-950/90 border-slate-700/60 text-slate-400 cursor-not-allowed"
                  : "bg-slate-900/60 border-rose-900/40 text-rose-400/80 cursor-not-allowed opacity-75"
              }`}
            >
              {/* Cooldown sweep overlay */}
              {skills.skill2?.cooldownRemaining > 0 && (
                <div
                  className="absolute inset-x-0 bottom-0 bg-slate-900/85 transition-all pointer-events-none"
                  style={{ height: `${skills.skill2.cooldownPercent || 100}%` }}
                />
              )}

              <span className="absolute top-1 left-1.5 text-[9px] font-black font-mono px-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 z-10">
                E
              </span>
              <HiSpeakerWave className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 mt-1 z-10" />
              <span className="text-[10px] sm:text-xs font-black tracking-tight mt-0.5 leading-none z-10">
                {skills.skill2?.cooldownRemaining > 0
                  ? `${skills.skill2.cooldownRemaining}s`
                  : !skills.skill2?.hasMana
                  ? "NO MANA"
                  : "ORASI"}
              </span>
              <span className="text-[9px] text-cyan-300 font-mono mt-0.5 leading-none z-10">
                {skills.skill2?.cooldownRemaining > 0 ? "COOLDOWN" : "35 MP"}
              </span>
            </button>

            {/* 4. Ultimate: Serangan Fajar (R) */}
            <button
              type="button"
              onClick={handleCastUltimate}
              disabled={!stats.isAlive || isPaused || !skills.ultimate?.isReady}
              title="Ultimate: Serangan Fajar (Ledakan Emas Radius 500) - Shortcut R"
              className={`relative flex-1 max-w-[108px] h-14 sm:h-16 flex flex-col items-center justify-center rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                skills.ultimate?.isReady
                  ? "bg-gradient-to-b from-amber-500 to-yellow-400 border-amber-300 text-slate-950 font-black animate-pulse shadow-lg shadow-amber-500/50 hover:from-amber-400 hover:to-yellow-300 active:scale-95 ring-2 ring-amber-300/80"
                  : "bg-slate-900/80 border-amber-900/50 text-amber-500/60 cursor-not-allowed opacity-80"
              }`}
            >
              <span className={`absolute top-1 left-1.5 text-[9px] font-black font-mono px-1 rounded border z-10 ${
                skills.ultimate?.isReady
                  ? "bg-slate-950/30 text-slate-950 border-slate-950/40"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/30"
              }`}>
                R
              </span>
              <HiSparkles className={`w-4 h-4 sm:w-5 sm:h-5 mt-1 z-10 ${
                skills.ultimate?.isReady ? "text-slate-950 animate-bounce" : "text-amber-500"
              }`} />
              <span className={`text-[10px] sm:text-xs font-black tracking-tight mt-0.5 leading-none z-10 ${
                skills.ultimate?.isReady ? "text-slate-950" : "text-amber-300"
              }`}>
                {skills.ultimate?.isReady ? "ULTIMATE!" : "FAJAR"}
              </span>
              <span className={`text-[9px] font-mono mt-0.5 leading-none z-10 ${
                skills.ultimate?.isReady ? "text-slate-900 font-bold" : "text-slate-400"
              }`}>
                {Math.round(stats.energy)}/100 ⚡
              </span>
            </button>
          </div>

          {/* Mobile Right-Hand Thumb Skill Cluster (Tahap 13 — Responsive Thumb Controls) */}
          {stats.isAlive && !isPaused && !levelUpModal.isOpen && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-20 md:hidden flex flex-col items-end gap-1.5 select-none"
              style={{ touchAction: "manipulation" }}
            >
              {/* Row 1: Q and E */}
              <div className="flex items-center gap-1.5">
                {/* Q: Tebar Pesona */}
                <button
                  type="button"
                  onClick={handleCastSkill1}
                  disabled={!stats.isAlive || isPaused || !skills.skill1?.isReady}
                  title="Skill 1: Tebar Pesona (Q)"
                  className={`relative w-11 h-11 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden shadow-lg ${
                    skills.skill1?.isReady
                      ? "bg-sky-950/90 border-sky-400 text-sky-200 active:scale-90 shadow-sky-500/30 ring-1 ring-sky-400/50"
                      : "bg-slate-950/80 border-slate-700 text-slate-500 opacity-60"
                  }`}
                >
                  {skills.skill1?.cooldownRemaining > 0 && (
                    <div
                      className="absolute inset-x-0 bottom-0 bg-slate-900/90 pointer-events-none"
                      style={{ height: `${skills.skill1.cooldownPercent || 100}%` }}
                    />
                  )}
                  <HiEnvelope className="w-4 h-4 text-sky-400 z-10" />
                  <span className="text-[8px] font-black z-10 font-mono leading-none">
                    {skills.skill1?.cooldownRemaining > 0 ? `${skills.skill1.cooldownRemaining}s` : "Q"}
                  </span>
                </button>

                {/* E: Orasi Akbar */}
                <button
                  type="button"
                  onClick={handleCastSkill2}
                  disabled={!stats.isAlive || isPaused || !skills.skill2?.isReady}
                  title="Skill 2: Orasi Akbar (E)"
                  className={`relative w-11 h-11 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden shadow-lg ${
                    skills.skill2?.isReady
                      ? "bg-cyan-950/90 border-cyan-400 text-cyan-200 active:scale-90 shadow-cyan-500/30 ring-1 ring-cyan-400/50"
                      : "bg-slate-950/80 border-slate-700 text-slate-500 opacity-60"
                  }`}
                >
                  {skills.skill2?.cooldownRemaining > 0 && (
                    <div
                      className="absolute inset-x-0 bottom-0 bg-slate-900/90 pointer-events-none"
                      style={{ height: `${skills.skill2.cooldownPercent || 100}%` }}
                    />
                  )}
                  <HiSpeakerWave className="w-4 h-4 text-cyan-400 z-10" />
                  <span className="text-[8px] font-black z-10 font-mono leading-none">
                    {skills.skill2?.cooldownRemaining > 0 ? `${skills.skill2.cooldownRemaining}s` : "E"}
                  </span>
                </button>
              </div>

              {/* Row 2: Auto Attack & Ultimate R */}
              <div className="flex items-center gap-1.5">
                {/* Auto / Tap Surat Suara */}
                <button
                  type="button"
                  onClick={handleFireBasicAttack}
                  disabled={!stats.isAlive || isPaused}
                  title="Surat Suara (Auto/Tap)"
                  className="w-10 h-10 rounded-xl border-2 border-emerald-500/60 bg-emerald-950/90 text-emerald-300 flex flex-col items-center justify-center active:scale-90 transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
                >
                  <HiDocumentCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[8px] font-bold font-mono leading-none">AUTO</span>
                </button>

                {/* R: Serangan Fajar Ultimate */}
                <button
                  type="button"
                  onClick={handleCastUltimate}
                  disabled={!stats.isAlive || isPaused || !skills.ultimate?.isReady}
                  title="Ultimate: Serangan Fajar (R)"
                  className={`relative w-13 h-13 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden shadow-xl ${
                    skills.ultimate?.isReady
                      ? "bg-gradient-to-br from-amber-400 to-yellow-500 border-amber-200 text-slate-950 font-black animate-pulse shadow-amber-500/60 ring-2 ring-amber-300"
                      : "bg-amber-950/60 border-amber-900/40 text-amber-500/60 opacity-60"
                  }`}
                >
                  <HiSparkles className="w-5 h-5 z-10" />
                  <span className="text-[9px] font-black z-10 font-mono leading-none">
                    {skills.ultimate?.isReady ? "ULT!" : "R"}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Initial loading screen */}
          {!isReady && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-sm z-10">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
              <span>Memuat Fondasi Arena...</span>
            </div>
          )}
        </div>

        {/* Footer controls & telemetry information (Tahap 13 Responsive Collapsible) */}
        <footer className="w-full mt-2 py-2 px-3 sm:px-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex flex-col gap-2 text-slate-400">
          <div className="w-full flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] sm:text-xs">
              <span>
                Kontrol: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">WASD</kbd> / Touch Stick
              </span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">
                Pause: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">P</kbd>
              </span>
              <span className="hidden sm:inline">
                Restart: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">R</kbd>
              </span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">
                Layar Penuh: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">F</kbd>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowJoystick((prev) => !prev)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                  showJoystick
                    ? "bg-cyan-950/60 border-cyan-500/50 text-cyan-300"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
                title="Toggle Virtual Joystick"
              >
                🎮 {showJoystick ? "Joystick ON" : "Joystick OFF"}
              </button>
              <button
                type="button"
                onClick={() => setShowDebug((prev) => !prev)}
                className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
              >
                {showDebug ? "Tutup Debug ▲" : "Debug ▼"}
              </button>
            </div>
          </div>

          {/* Quick debug combat controls (collapsible) */}
          {showDebug && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-500 font-semibold mr-1">DEBUG:</span>
              <button
                type="button"
                onClick={() => handleTestHit(150)}
                disabled={!stats.isAlive}
                className="px-2 py-1 rounded bg-rose-950/60 border border-rose-800/60 hover:bg-rose-900/60 text-rose-300 text-[10px] font-mono cursor-pointer disabled:opacity-40"
              >
                Damage (-150)
              </button>
              <button
                type="button"
                onClick={() => handleTestHeal(150)}
                disabled={!stats.isAlive}
                className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-800/60 hover:bg-emerald-900/60 text-emerald-300 text-[10px] font-mono cursor-pointer disabled:opacity-40"
              >
                Heal (+150)
              </button>
              <button
                type="button"
                onClick={() => handleTestMana(25)}
                disabled={!stats.isAlive}
                className="px-2 py-1 rounded bg-sky-950/60 border border-sky-800/60 hover:bg-sky-900/60 text-sky-300 text-[10px] font-mono cursor-pointer disabled:opacity-40"
              >
                Mana (-25)
              </button>
              <button
                type="button"
                onClick={() => handleTestHit(1000)}
                disabled={!stats.isAlive}
                className="px-2 py-1 rounded bg-red-900/80 border border-red-700 hover:bg-red-800 text-white text-[10px] font-bold cursor-pointer disabled:opacity-40"
              >
                Lethal (-1000)
              </button>
              <button
                type="button"
                onClick={() => handleTestEnergy(25)}
                disabled={!stats.isAlive}
                className="px-2 py-1 rounded bg-amber-950/60 border border-amber-800/60 hover:bg-amber-900/60 text-amber-300 text-[10px] font-mono cursor-pointer disabled:opacity-40"
              >
                Energy (+25)
              </button>
              <button
                type="button"
                onClick={() => handleTestEnergy(100)}
                disabled={!stats.isAlive}
                className="px-2 py-1 rounded bg-amber-500/80 border border-amber-400 hover:bg-amber-400 text-slate-950 text-[10px] font-bold cursor-pointer disabled:opacity-40"
              >
                Full Energy
              </button>
              <button
                type="button"
                onClick={() => handleTestHit(50)}
                disabled={!stats.isAlive}
                className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-200 text-[10px] font-mono cursor-pointer disabled:opacity-40"
              >
                Hit Musuh (-50)
              </button>
              <button
                type="button"
                onClick={() => handleTestXp(50)}
                disabled={!stats.isAlive}
                className="px-2 py-1 rounded bg-emerald-900/80 border border-emerald-600 hover:bg-emerald-800 text-emerald-200 text-[10px] font-bold cursor-pointer disabled:opacity-40"
              >
                XP (+50)
              </button>
              <button
                type="button"
                onClick={() => handleTestCoins(5)}
                disabled={!stats.isAlive}
                className="px-2 py-1 rounded bg-yellow-900/80 border border-yellow-600 hover:bg-yellow-800 text-yellow-200 text-[10px] font-bold cursor-pointer disabled:opacity-40"
              >
                Koin (+5)
              </button>
              <button
                type="button"
                onClick={() => handleTestXp(Math.max(1, (stats.xpRequired ?? 50) - (stats.xp ?? 0)))}
                disabled={!stats.isAlive}
                className="px-2 py-1 rounded bg-amber-600/90 border border-amber-400 hover:bg-amber-500 text-slate-950 text-[10px] font-black cursor-pointer disabled:opacity-40"
              >
                Naik Level
              </button>
              <button
                type="button"
                onClick={() => handleTestBoss(stats.level || 1)}
                disabled={!stats.isAlive}
                className="px-2 py-1 rounded bg-rose-600 border border-rose-400 hover:bg-rose-500 text-white text-[10px] font-black cursor-pointer disabled:opacity-40"
              >
                Spawn Boss
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-mono text-[10px] sm:text-[11px] text-slate-400">
            <span>⏱️ {formattedTime}</span>
            <span>⭐ {score.toLocaleString("id-ID")}</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
              {isTouchDevice ? "TOUCH" : "DESKTOP"}
            </span>
            <span>POS: ({playerPos.x}, {playerPos.y})</span>
            <span>MUSUH: {playerPos.enemiesActive ?? 0}</span>
            <span>KILL: {playerPos.enemiesKilled ?? 0}</span>
            <span>SURAT: {playerPos.attacksFired ?? 0}</span>
            <span className={playerPos.isMoving ? "text-emerald-400" : "text-slate-500"}>
              {playerPos.isMoving ? "BERGERAK" : "DIAM"}
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
