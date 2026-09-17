import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../hooks/useTheme";
import { useLanguage } from "../hooks/useLanguage";
import { HiArrowLeft, HiPlay, HiArrowPath, HiSpeakerWave } from "react-icons/hi2";

const LANGUAGES_HELLO = [
  { lang: "JavaScript", code: 'console.log("Hello, World!");' },
  { lang: "Python", code: 'print("Hello, World!")' },
  { lang: "C++", code: 'std::cout << "Hello, World!";' },
  { lang: "Java", code: 'System.out.println("Hello, World!");' },
  { lang: "Go", code: 'fmt.Println("Hello, World!")' },
  { lang: "Rust", code: 'println!("Hello, World!");' },
  { lang: "Ruby", code: 'puts "Hello, World!"' },
  { lang: "PHP", code: 'echo "Hello, World!";' },
  { lang: "HTML", code: '<h1>Hello, World!</h1>' },
  { lang: "Swift", code: 'print("Hello, World!")' },
];

export default function GameContainer() {
  const { isDark } = useTheme();
  const { language } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem("helloworld_high_score")) || 0;
  });
  const [timeLeft, setTimeLeft] = useState(30);
  const [bubbles, setBubbles] = useState([]);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const gameAreaRef = useRef(null);

  // Play retro synthesised sound using Web Audio API
  const playRetroSound = (type) => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "pop") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === "gold") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(900, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(1500, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === "gameover") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === "start") {
        osc.type = "square";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24); // C6
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      // Audio auto-play blocking or not supported
    }
  };

  // Start the game
  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setBubbles([]);
    setFloatingTexts([]);
    playRetroSound("start");
  };

  // Back to home page
  const navigateHome = () => {
    window.location.hash = "";
    window.location.pathname = "/";
    window.dispatchEvent(new Event("popstate"));
  };

  // Spawn bubbles
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (!gameAreaRef.current) return;
      const rect = gameAreaRef.current.getBoundingClientRect();
      const id = Date.now() + Math.random();
      
      // Randomize position
      const x = Math.random() * (rect.width - 70);
      const y = Math.random() * (rect.height - 70);

      const helloData = LANGUAGES_HELLO[Math.floor(Math.random() * LANGUAGES_HELLO.length)];
      const isGold = Math.random() > 0.85; // 15% chance of gold bubble

      const newBubble = {
        id,
        x,
        y,
        isGold,
        lang: helloData.lang,
        code: helloData.code,
        size: isGold ? 50 : 60,
      };

      setBubbles((prev) => [...prev, newBubble]);

      // Automatically remove bubble after 3.5 seconds if not clicked
      setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== id));
      }, 3500);

    }, 850);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Timer countdown
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsPlaying(false);
          playRetroSound("gameover");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying]);

  // Check and save High Score
  useEffect(() => {
    if (!isPlaying && score > highScore) {
      setHighScore(score);
      localStorage.setItem("helloworld_high_score", score.toString());
    }
  }, [isPlaying, score, highScore]);

  // Handle bubble clicking
  const handleBubbleClick = (bubble, e) => {
    e.stopPropagation();
    
    // Remove bubble
    setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));

    // Calculate score
    const points = bubble.isGold ? 30 : 10;
    setScore((prev) => prev + points);

    // Play corresponding sound
    playRetroSound(bubble.isGold ? "gold" : "pop");

    // Add floating text
    const textId = Date.now() + Math.random();
    const newText = {
      id: textId,
      text: `+${points} ${bubble.lang}!`,
      code: bubble.code,
      x: bubble.x,
      y: bubble.y,
    };
    setFloatingTexts((prev) => [...prev, newText]);

    // Remove floating text after 2 seconds
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== textId));
    }, 2000);
  };

  // Translations / localization values inside game
  const texts = {
    title: language === "id" ? "Hello World Arkade" : "Hello World Arcade",
    subtitle: language === "id" ? "Tangkap gelembung Hello World sebelum kehabisan waktu!" : "Pop the Hello World bubbles before time runs out!",
    score: language === "id" ? "Skor" : "Score",
    highScore: language === "id" ? "Skor Tertinggi" : "High Score",
    time: language === "id" ? "Waktu" : "Time",
    startGame: language === "id" ? "Mulai Main" : "Start Game",
    playAgain: language === "id" ? "Main Lagi" : "Play Again",
    gameOver: language === "id" ? "GAME OVER!" : "GAME OVER!",
    finalScore: language === "id" ? "Skor Akhir Anda" : "Your Final Score",
    backBtn: language === "id" ? "Kembali ke Portfolio" : "Back to Portfolio",
    instructions: language === "id" 
      ? "Instruksi: Klik gelembung pemrograman untuk mendapatkan poin. Gelembung emas (Gold) bernilai +30 poin, gelembung biasa bernilai +10 poin!" 
      : "Instructions: Click/tap the programming bubbles to score points. Golden bubbles are worth +30 points, regular bubbles are +10 points!",
    soundOn: language === "id" ? "Suara Aktif" : "Sound On",
    soundOff: language === "id" ? "Suara Bisu" : "Sound Muted",
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative font-sans overflow-hidden"
      style={{
        background: isDark ? "#050510" : "#f0f4f8",
        color: isDark ? "#ffffff" : "#0f172a",
      }}
    >
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(${isDark ? "rgba(0,245,255,0.02)" : "rgba(0,180,200,0.03)"} 1px, transparent 1px),
            linear-gradient(90deg, ${isDark ? "rgba(0,245,255,0.02)" : "rgba(0,180,200,0.03)"} 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Cyberpunk ambient light orbs */}
      <div
        className="absolute top-10 left-10 w-72 h-72 rounded-full pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle, ${isDark ? "rgba(0,245,255,0.05)" : "rgba(0,180,200,0.04)"} 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute bottom-10 right-10 w-72 h-72 rounded-full pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle, ${isDark ? "rgba(168,85,247,0.05)" : "rgba(124,58,237,0.04)"} 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />

      <div className="w-full max-w-3xl z-10 flex flex-col gap-4">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={navigateHome}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border self-start group cursor-pointer"
            style={{
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)",
            }}
          >
            <HiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            {texts.backBtn}
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border self-start sm:self-center cursor-pointer"
            style={{
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)",
              opacity: soundEnabled ? 1 : 0.6,
            }}
          >
            <HiSpeakerWave className={soundEnabled ? "text-cyan-400" : "text-gray-400"} />
            {soundEnabled ? texts.soundOn : texts.soundOff}
          </button>
        </div>

        {/* Title Container */}
        <div className="text-center my-2">
          <h1
            className="text-3xl md:text-5xl font-black tracking-wider uppercase bg-clip-text text-transparent"
            style={{
              backgroundImage: isDark
                ? "linear-gradient(to r, #00f5ff, #a855f7)"
                : "linear-gradient(to r, #0891b2, #7c3aed)",
            }}
          >
            {texts.title}
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1 max-w-md mx-auto leading-relaxed">
            {texts.subtitle}
          </p>
        </div>

        {/* Game Stats Hub */}
        <div
          className="grid grid-cols-3 gap-2 p-3 rounded-2xl border text-center font-mono font-bold"
          style={{
            borderColor: isDark ? "rgba(0,245,255,0.2)" : "rgba(0,180,200,0.25)",
            background: isDark ? "rgba(5,5,16,0.6)" : "rgba(255,255,255,0.8)",
            boxShadow: isDark ? "0 0 15px rgba(0,245,255,0.05)" : "0 4px 15px rgba(0,0,0,0.03)",
          }}
        >
          <div>
            <div className="text-xxs uppercase tracking-wider text-gray-500">{texts.score}</div>
            <div className="text-lg md:text-2xl text-cyan-500">{score}</div>
          </div>
          <div className="border-x" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
            <div className="text-xxs uppercase tracking-wider text-gray-500">{texts.time}</div>
            <div
              className={`text-lg md:text-2xl ${
                timeLeft <= 5 ? "text-red-500 animate-pulse" : isDark ? "text-white" : "text-slate-800"
              }`}
            >
              {timeLeft}s
            </div>
          </div>
          <div>
            <div className="text-xxs uppercase tracking-wider text-gray-500">{texts.highScore}</div>
            <div className="text-lg md:text-2xl text-purple-500">{highScore}</div>
          </div>
        </div>

        {/* Main Arcade screen / Gameboard */}
        <div
          ref={gameAreaRef}
          className="h-[380px] md:h-[450px] w-full rounded-3xl border relative overflow-hidden flex items-center justify-center select-none shadow-inner"
          style={{
            borderColor: isDark ? "rgba(0,245,255,0.25)" : "rgba(0,180,200,0.3)",
            background: isDark ? "#020208" : "#ffffff",
            boxShadow: isDark ? "inset 0 0 40px rgba(0,245,255,0.1), 0 10px 30px rgba(0,0,0,0.3)" : "inset 0 0 20px rgba(0,180,200,0.05), 0 10px 20px rgba(0,0,0,0.05)",
          }}
        >
          {/* CRT scanlines effect for retro look in dark mode */}
          {isDark && (
            <div
              className="absolute inset-0 pointer-events-none z-40 opacity-[0.03]"
              style={{
                backgroundImage: "linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%), linear-gradient(90deg, rgba(255,0,0,0.06), rgba(0,255,0,0.02), rgba(0,0,255,0.06))",
                backgroundSize: "100% 4px, 6px 100%",
              }}
            />
          )}

          <AnimatePresence>
            {!isPlaying && timeLeft === 30 && (
              /* START STATE */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center p-6 z-10 max-w-md flex flex-col items-center gap-4"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl animate-bounce shadow-lg"
                  style={{
                    background: isDark ? "linear-gradient(135deg, #00f5ff, #a855f7)" : "linear-gradient(135deg, #0891b2, #7c3aed)",
                    color: "#ffffff",
                  }}
                >
                  🚀
                </div>
                <h3 className="text-xl md:text-2xl font-bold tracking-wide">
                  {language === "id" ? "Siap Bermain?" : "Ready to Play?"}
                </h3>
                <p className="text-xs md:text-sm text-gray-500">
                  {texts.instructions}
                </p>
                <button
                  onClick={startGame}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white transition-all duration-300 shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                  style={{
                    background: isDark ? "linear-gradient(to r, #00f5ff, #a855f7)" : "linear-gradient(to r, #0891b2, #7c3aed)",
                  }}
                >
                  <HiPlay className="text-lg" />
                  {texts.startGame}
                </button>
              </motion.div>
            )}

            {!isPlaying && timeLeft === 0 && (
              /* GAME OVER STATE */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center p-6 z-10 max-w-md flex flex-col items-center gap-3"
              >
                <h2 className="text-3xl font-black tracking-widest text-red-500 animate-pulse">
                  {texts.gameOver}
                </h2>
                <p className="text-sm text-gray-500">
                  {texts.finalScore}
                </p>
                <div className="text-5xl font-black text-cyan-400 my-2">{score}</div>
                {score >= highScore && score > 0 && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-xs bg-yellow-400 text-yellow-950 font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2"
                  >
                    👑 {language === "id" ? "SKOR TERTINGGI BARU!" : "NEW HIGH SCORE!"}
                  </motion.div>
                )}
                <button
                  onClick={startGame}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white transition-all duration-300 shadow-md hover:scale-105 active:scale-95 cursor-pointer mt-2"
                  style={{
                    background: isDark ? "linear-gradient(to r, #00f5ff, #a855f7)" : "linear-gradient(to r, #0891b2, #7c3aed)",
                  }}
                >
                  <HiArrowPath className="text-lg animate-spin-hover" />
                  {texts.playAgain}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ACTIVE BUBBLES */}
          {isPlaying &&
            bubbles.map((bubble) => (
              <motion.button
                key={bubble.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.08 }}
                onClick={(e) => handleBubbleClick(bubble, e)}
                className="absolute flex flex-col items-center justify-center rounded-full cursor-pointer focus:outline-none select-none p-1 font-mono text-center overflow-hidden shadow-lg border"
                style={{
                  left: bubble.x,
                  top: bubble.y,
                  width: bubble.size,
                  height: bubble.size,
                  background: bubble.isGold
                    ? "radial-gradient(circle, #facc15 0%, #eab308 70%)"
                    : isDark
                    ? "radial-gradient(circle, rgba(6,182,212,0.8) 0%, rgba(8,145,178,0.9) 75%)"
                    : "radial-gradient(circle, rgba(34,211,238,0.9) 0%, rgba(14,116,144,0.9) 75%)",
                  borderColor: bubble.isGold ? "#fef08a" : isDark ? "#22d3ee" : "#0e7490",
                  color: bubble.isGold ? "#422006" : "#ffffff",
                  fontSize: bubble.size > 55 ? "10px" : "8px",
                  fontWeight: "bold",
                  textShadow: bubble.isGold ? "none" : "0 1px 2px rgba(0,0,0,0.5)",
                }}
              >
                <div className="truncate w-full text-center leading-none px-0.5">{bubble.lang}</div>
                <div className="opacity-75 scale-75 mt-0.5">{"<>"}</div>
              </motion.button>
            ))}

          {/* FLOATING TEXT AND CODE EFFECT */}
          <AnimatePresence>
            {floatingTexts.map((txt) => (
              <motion.div
                key={txt.id}
                initial={{ y: txt.y, x: txt.x, opacity: 1, scale: 0.8 }}
                animate={{ y: txt.y - 60, opacity: [1, 1, 0], scale: 1.1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute pointer-events-none font-mono text-center flex flex-col items-center justify-center z-30"
              >
                <span className="text-sm font-black text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {txt.text}
                </span>
                <span
                  className="text-xxs px-2 py-0.5 mt-1 rounded bg-black/80 border text-emerald-400 font-semibold max-w-[200px] truncate"
                  style={{ borderColor: isDark ? "#10b981" : "#047857" }}
                >
                  {txt.code}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <p className="text-center font-mono text-xxs opacity-40 uppercase tracking-widest mt-1">
          Hello World Arcade v1.0.0 • Pure React & Web Audio Synthesizer
        </p>
      </div>
    </div>
  );
}
