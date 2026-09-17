import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../hooks/useTheme";
import { useLanguage } from "../hooks/useLanguage";
import { HiArrowLeft, HiSparkles, HiPlay, HiArrowPath } from "react-icons/arrow-left" ? null : "react-icons/hi2"; // fallback safe

export default function HelloWorld() {
  const { isDark } = useTheme();
  const { language } = useLanguage();
  const [clickCount, setClickCount] = useState(0);
  const [activeMessage, setActiveMessage] = useState("Hello, World!");
  const [stars, setStars] = useState([]);

  const messages = [
    "Hello, World! 👋",
    "Halo, Dunia! 🚀",
    "Bonjour, le Monde! 🌍",
    "Hola, Mundo! ⚡",
    "Konnichiwa, Sekai! 🎌",
    "System.out.println('Hello World!'); 💻",
  ];

  const handleInteractiveClick = (e) => {
    setClickCount((prev) => prev + 1);
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    setActiveMessage(randomMsg);

    // Create click effect star animation
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();

    setStars((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setStars((prev) => prev.filter((s) => s.id !== id));
    }, 1000);
  };

  const handleBackToPortfolio = () => {
    window.location.hash = "";
    window.location.pathname = "/";
    window.dispatchEvent(new Event("popstate"));
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative font-sans overflow-hidden"
      style={{
        background: isDark ? "#050510" : "#f0f4f8",
        color: isDark ? "#ffffff" : "#0f172a",
      }}
    >
      {/* Background glow orb */}
      <div
        className="absolute w-96 h-96 rounded-full pointer-events-none z-0 opacity-20"
        style={{
          background: `radial-gradient(circle, ${isDark ? "#00f5ff" : "#0891b2"} 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />

      <div className="w-full max-w-2xl z-10 flex flex-col items-center gap-6 text-center">
        {/* Back Button */}
        <button
          onClick={handleBackToPortfolio}
          className="self-start px-4 py-2 rounded-xl text-sm font-semibold transition-all border cursor-pointer hover:scale-105 active:scale-95"
          style={{
            borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)",
          }}
        >
          ← {language === "id" ? "Kembali ke Portfolio" : "Back to Portfolio"}
        </button>

        {/* Hello World Game Card */}
        <div
          className="w-full p-8 md:p-12 rounded-3xl border relative overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col items-center gap-6"
          style={{
            borderColor: isDark ? "rgba(0,245,255,0.25)" : "rgba(0,180,200,0.3)",
            background: isDark ? "rgba(5,5,16,0.8)" : "rgba(255,255,255,0.9)",
          }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold tracking-widest uppercase border bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
            <span>🎮</span>
            <span>React Game Component (`src/games/HelloWorld.jsx`)</span>
          </div>

          {/* Animated Message Display */}
          <motion.h1
            key={activeMessage}
            initial={{ scale: 0.8, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-black bg-clip-text text-transparent"
            style={{
              backgroundImage: isDark
                ? "linear-gradient(to r, #00f5ff, #a855f7)"
                : "linear-gradient(to r, #0891b2, #7c3aed)",
            }}
          >
            {activeMessage}
          </motion.h1>

          <p className="text-sm md:text-base text-gray-400 max-w-md">
            {language === "id"
              ? "Selamat! File game React kamu di folder `src/games/` berhasil dimuat pada URL `/game`."
              : "Congrats! Your React game file in `src/games/` was successfully loaded on `/game`."}
          </p>

          {/* Interactive Game Button */}
          <div className="relative inline-block my-2">
            <button
              onClick={handleInteractiveClick}
              className="px-8 py-4 rounded-2xl font-bold text-white text-lg transition-all duration-300 shadow-xl hover:scale-105 active:scale-95 cursor-pointer relative overflow-hidden"
              style={{
                background: isDark
                  ? "linear-gradient(135deg, #00f5ff 0%, #a855f7 100%)"
                  : "linear-gradient(135deg, #0891b2 0%, #7c3aed 100%)",
              }}
            >
              {language === "id" ? "Klik untuk Main! ✨" : "Click to Play! ✨"}
            </button>

            {/* Click Burst Effect */}
            <AnimatePresence>
              {stars.map((star) => (
                <motion.span
                  key={star.id}
                  initial={{ opacity: 1, scale: 0.5, y: 0 }}
                  animate={{ opacity: 0, scale: 2, y: -40 }}
                  exit={{ opacity: 0 }}
                  className="absolute pointer-events-none font-bold text-yellow-300 text-sm"
                  style={{ left: star.x, top: star.y }}
                >
                  +1
                </motion.span>
              ))}
            </AnimatePresence>
          </div>

          {/* Score counter */}
          <div className="flex items-center gap-6 font-mono text-sm border-t pt-6 w-full justify-center border-gray-700/30">
            <div>
              <span className="text-gray-400">Total Clicks: </span>
              <span className="font-bold text-cyan-400">{clickCount}</span>
            </div>
            <div>
              <span className="text-gray-400">Route: </span>
              <span className="font-bold text-purple-400">/game</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
