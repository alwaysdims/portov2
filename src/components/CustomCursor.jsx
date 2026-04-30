import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    let lastBubbleTime = 0; // Untuk mengatur jeda (throttle) agar tidak terlalu banyak gelembung yang spawn

    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      // --- Logika Spawn Gelembung ---
      const now = Date.now();
      // Spawn gelembung maksimal setiap 40ms (agar performa tetap ringan)
      if (now - lastBubbleTime > 40) {
        lastBubbleTime = now;
        setBubbles((prev) => [
          ...prev,
          {
            id: now,
            x: e.clientX,
            y: e.clientY,
            size: Math.random() * 8 + 4, // Ukuran random 4px - 12px
            offsetX: (Math.random() - 0.5) * 40, // Menyebar ke kiri/kanan secara random
          },
        ]);
      }
    };

    const handleMouseOver = (e) => {
      // Deteksi apakah kursor sedang berada di atas elemen yang bisa di-klik
      const target = e.target;
      if (
        target.tagName.toLowerCase() === "a" ||
        target.tagName.toLowerCase() === "button" ||
        target.closest("a") ||
        target.closest("button")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  // Fungsi untuk membersihkan gelembung yang sudah selesai animasi dari state
  const removeBubble = (id) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
  };

  // Variant animasi untuk cincin luar
  const ringVariants = {
    default: {
      x: mousePosition.x - 16,
      y: mousePosition.y - 16,
      scale: 1,
      borderColor: "rgba(0, 245, 255, 0.4)", // Cyan
      backgroundColor: "rgba(0, 245, 255, 0)",
    },
    hover: {
      x: mousePosition.x - 24,
      y: mousePosition.y - 24,
      scale: 1.5,
      borderColor: "rgba(168, 85, 247, 0.8)", // Ungu (Purple) saat hover
      backgroundColor: "rgba(168, 85, 247, 0.1)",
    },
  };

  return (
    <>
      {/* 1. Efek Gelembung (Particle Trail) */}
      <AnimatePresence>
        {bubbles.map((bubble) => (
          <motion.div
            key={bubble.id}
            initial={{
              opacity: 0.8,
              scale: 0.5,
              x: bubble.x - bubble.size / 2,
              y: bubble.y - bubble.size / 2,
            }}
            animate={{
              opacity: 0,
              scale: 1.5,
              x: bubble.x - bubble.size / 2 + bubble.offsetX, // Terbang sedikit menyamping
              y: bubble.y - 40, // Menguap ke atas
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onAnimationComplete={() => removeBubble(bubble.id)} // Hapus dari DOM setelah selesai
            className="fixed rounded-full border border-cyan-400/50 pointer-events-none z-[9997]"
            style={{
              width: bubble.size,
              height: bubble.size,
              boxShadow: "0 0 10px rgba(0,245,255,0.4)", // Glow tipis ala neon
            }}
          />
        ))}
      </AnimatePresence>

      {/* 2. Titik Inti (Cyan Dot) - Pergerakan Instan */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-cyan-400 rounded-full pointer-events-none z-[9999]"
        style={{
          boxShadow: "0 0 10px #00f5ff, 0 0 20px #00f5ff", // Efek Glow
        }}
        animate={{
          x: mousePosition.x - 4, // Offset (8/2)
          y: mousePosition.y - 4,
        }}
        transition={{ type: "tween", ease: "linear", duration: 0 }}
      />

      {/* 3. Cincin Luar (Trailing Ring) - Pergerakan Halus */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border pointer-events-none z-[9998] flex items-center justify-center transition-colors duration-300"
        variants={ringVariants}
        animate={isHovering ? "hover" : "default"}
        transition={{
          type: "spring",
          stiffness: 150,
          damping: 15,
          mass: 0.5,
        }}
      >
        {/* Aksen Crosshair (Garis bidik ala Tech/Cyber) */}
        <div className={`absolute -top-1 w-0.5 h-1.5 transition-colors duration-300 ${isHovering ? 'bg-purple-400' : 'bg-cyan-400'}`} />
        <div className={`absolute -bottom-1 w-0.5 h-1.5 transition-colors duration-300 ${isHovering ? 'bg-purple-400' : 'bg-cyan-400'}`} />
        <div className={`absolute -left-1 w-1.5 h-0.5 transition-colors duration-300 ${isHovering ? 'bg-purple-400' : 'bg-cyan-400'}`} />
        <div className={`absolute -right-1 w-1.5 h-0.5 transition-colors duration-300 ${isHovering ? 'bg-purple-400' : 'bg-cyan-400'}`} />
      </motion.div>
    </>
  );
}