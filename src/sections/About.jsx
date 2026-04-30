import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RiDownloadLine, RiArrowDownLine } from "react-icons/ri";

const roles = [
  "Fullstack Developer",
  "Mobile Developer",
  "Desktop Developer",
  "UI/UX Designer",
];

const hobies = [
    "Sport",
    "Crypto",
    "Stocks",
    "Gaming",
    "Music",
];

// Hook untuk efek mesin ketik
function useTypewriter(words, typingSpeed = 80, deletingSpeed = 50, pause = 1800) {
  const [text, setText] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [phase, setPhase] = useState("typing");

  useEffect(() => {
    const current = words[wordIdx];
    if (phase === "typing") {
      if (text.length < current.length) {
        const t = setTimeout(() => setText(current.slice(0, text.length + 1)), typingSpeed);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase("deleting"), pause);
        return () => clearTimeout(t);
      }
    } else {
      if (text.length > 0) {
        const t = setTimeout(() => setText(text.slice(0, -1)), deletingSpeed);
        return () => clearTimeout(t);
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWordIdx((i) => (i + 1) % words.length);
        setPhase("typing");
      }
    }
  }, [text, phase, wordIdx, words, typingSpeed, deletingSpeed, pause]);

  return text;
}

// Variants animasi Framer Motion
const fadeInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } },
};
const fadeInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut", delay: 0.2 } },
};
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut", delay } },
});

export default function About() {
  const typeText = useTypewriter(roles);

  return (
    <section
      id="about"
      className="relative min-h-screen flex items-center justify-center overflow-hidden py-24 px-6 max-w-7xl mx-auto"
    >
      <div className="relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* ── Kolom Teks ─────────────────────────── */}
          <motion.div
            variants={fadeInLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="order-2 lg:order-1 flex flex-col gap-6"
          >
            {/* Status badge */}
            <motion.div variants={fadeUp(0.1)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 font-mono text-xs text-cyan-400 rounded-sm tracking-widest">
                <span
                  className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"
                  style={{ boxShadow: "0 0 8px #00f5ff" }}
                />
                AVAILABLE FOR WORK
              </span>
            </motion.div>

            {/* Nama & Sapaan */}
            <div>
              <motion.p
                variants={fadeUp(0.15)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="text-cyan-400 font-mono text-sm tracking-widest mb-3 uppercase opacity-90"
              >
                &gt;_ Hello, World!
              </motion.p>
              <motion.h1
                variants={fadeUp(0.2)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="font-black leading-tight text-5xl md:text-6xl"
              >
                <span className="text-white">Orlando</span>
                <br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: "linear-gradient(135deg, #00f5ff, #a855f7, #ff00ff)",
                  }}
                >
                  Dimas Saputra
                </span>
              </motion.h1>
            </div>

            {/* Efek Typewriter Role */}
            <motion.div
              variants={fadeUp(0.3)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-lg sm:text-xl font-semibold font-mono"
            >
              <span className="text-gray-500">// </span>
              <span
                style={{
                  color: "#a855f7",
                  textShadow: "0 0 10px rgba(168,85,247,0.4)",
                }}
              >
                {typeText}
                <span className="animate-pulse">_</span>
              </span>
            </motion.div>

            {/* Bio */}
            <motion.p
            variants={fadeUp(0.4)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-lg"
            >
            A graduate of <span className="text-cyan-400 font-semibold">SMKN 2 Karanganyar</span> (2026),
            currently pursuing a degree in{" "}
            <span className="text-purple-400 font-semibold">Informatics Engineering Education</span> at
            Universitas Negeri Semarang. Passionate about building digital solutions that are functional,
            visually appealing, and impactful.
            </motion.p>

            {/* Baris Statistik */}
            <motion.div
              variants={fadeUp(0.5)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex gap-8 py-4 border-y border-purple-500/20"
            >
              {[
                { value: "18+", label: "Skills" },
                { value: "6+", label: "Projects" },
                { value: "2+", label: "Years Exp" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-bold text-2xl text-cyan-400">{stat.value}</div>
                  <div className="font-mono text-xs text-gray-400 tracking-widest uppercase mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Tombol CTA */}
            <motion.div
              variants={fadeUp(0.6)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-wrap gap-4 mt-2"
            >
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold tracking-widest uppercase text-black rounded-lg transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, #00f5ff, #a855f7)",
                  boxShadow: "0 0 20px rgba(0,245,255,0.4)",
                }}
              >
                Contact Me
              </motion.a>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold tracking-widest uppercase text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/10 hover:shadow-[0_0_15px_rgba(0,245,255,0.3)] rounded-lg transition-all duration-300"
              >
                <RiDownloadLine className="text-lg" />
                Resume
              </motion.button>
            </motion.div>
          </motion.div>

          {/* ── Kolom Gambar & Roles ────────────────────────── */}
          <motion.div
            variants={fadeInRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="order-1 lg:order-2 flex flex-col items-center justify-center gap-8"
          >
            {/* Area Foto */}
            <div className="relative">
              {/* Efek dekorasi titik dari kode awal */}
              <div
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, #00f5ff, transparent)" }}
              />
              <div
                className="absolute -bottom-12 -left-12 w-24 h-24 rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, #ff00ff, transparent)" }}
              />

              {/* Kurung sudut (Corner brackets) */}
              {[
                "top-0 left-0 border-t-2 border-l-2 w-8 h-8",
                "top-0 right-0 border-t-2 border-r-2 w-8 h-8",
                "bottom-0 left-0 border-b-2 border-l-2 w-8 h-8",
                "bottom-0 right-0 border-b-2 border-r-2 w-8 h-8",
              ].map((cls, i) => (
                <div key={i} className={`absolute ${cls} border-cyan-400 z-10 rounded-sm`} />
              ))}

              {/* Kontainer Gambar Profil */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-2xl overflow-hidden"
                style={{
                  border: "2px solid rgba(0,245,255,0.3)",
                  boxShadow:
                    "0 0 60px rgba(0,245,255,0.3), 0 0 120px rgba(168,85,247,0.2), inset 0 0 20px rgba(0,245,255,0.1)",
                }}
              >
                <img
                  src="/images/profile.jpg"
                  alt="Orlando Dimas Saputra"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />

                {/* Fallback Jika Gambar Tidak Ada */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center -z-10"
                  style={{ background: "linear-gradient(135deg, #0a0a1a, #1a0a2e)" }}
                >
                  <div className="text-6xl mb-4 text-cyan-400">👨‍💻</div>
                  <span className="font-mono text-cyan-400/60 text-xs tracking-widest">
                    profile.jpg
                  </span>
                </div>

                {/* Efek Garis Scanline Biru */}
                <div
                  className="absolute left-0 right-0 h-px bg-cyan-400/40 pointer-events-none"
                  style={{
                    top: "0%",
                    animation: "scan 4s linear infinite",
                    boxShadow: "0 0 8px #00f5ff",
                  }}
                >
                  <style>{`
                    @keyframes scan {
                      0% { top: -10%; opacity: 0; }
                      10% { opacity: 1; }
                      90% { opacity: 1; }
                      100% { top: 110%; opacity: 0; }
                    }
                  `}</style>
                </div>
              </motion.div>
            </div>

            {/* List Roles Di Bawah Foto */}
            <motion.div 
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-wrap justify-center gap-3 w-full max-w-sm"
            >
              {hobies.map((hobi) => (
                <span
                  key={hobi}
                  className="px-3 py-1.5 text-[10px] sm:text-xs font-mono rounded-lg border border-purple-500/40 text-purple-300 bg-gray-900/80 backdrop-blur-sm"
                  style={{ boxShadow: "0 0 15px rgba(168,85,247,0.2)" }}
                >
                  {hobi}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Indikator Scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 hidden md:flex"
        >
          <span className="font-mono text-xs text-gray-500 tracking-widest uppercase">
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <RiArrowDownLine className="text-cyan-400/60 text-xl" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}