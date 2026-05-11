import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RiDownloadLine, RiArrowDownLine } from "react-icons/ri";
import { useLanguage } from "../hooks/useLanguage";
import { useTheme } from "../hooks/useTheme";

const hobies = ["Sport", "Crypto", "Stocks", "Gaming", "Music"];

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
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const typeText = useTypewriter(t.about.roles);

  // Theme-aware colors
  const cyan = isDark ? "#00f5ff" : "#0891b2";
  const purple = isDark ? "#a855f7" : "#7c3aed";
  const textWhite = isDark ? "#ffffff" : "#0f172a";
  const textGray = isDark ? "#9ca3af" : "#475569";
  const textMuted = isDark ? "#6b7280" : "#94a3b8";
  const borderColor = isDark ? "rgba(168,85,247,0.2)" : "rgba(124,58,237,0.15)";

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
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 font-mono text-xs rounded-sm tracking-widest border"
                style={{
                  color: cyan,
                  background: isDark ? "rgba(0,245,255,0.06)" : "rgba(8,145,178,0.06)",
                  borderColor: isDark ? "rgba(0,245,255,0.2)" : "rgba(8,145,178,0.2)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: cyan, boxShadow: `0 0 8px ${cyan}` }}
                />
                {t.about.badge}
              </span>
            </motion.div>

            {/* Nama & Sapaan */}
            <div>
              <motion.p
                variants={fadeUp(0.15)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="font-mono text-sm tracking-widest mb-3 uppercase opacity-90"
                style={{ color: cyan }}
              >
                {t.about.greeting}
              </motion.p>
              <motion.h1
                variants={fadeUp(0.2)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="font-black leading-tight text-5xl md:text-6xl"
              >
                <span style={{ color: textWhite }}>Orlando</span>
                <br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: isDark
                      ? "linear-gradient(135deg, #00f5ff, #a855f7, #ff00ff)"
                      : "linear-gradient(135deg, #0891b2, #7c3aed, #db2777)",
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
              <span style={{ color: textMuted }}>// </span>
              <span
                style={{
                  color: purple,
                  textShadow: isDark ? `0 0 10px rgba(168,85,247,0.4)` : "none",
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
              className="text-base sm:text-lg leading-relaxed max-w-lg"
              style={{ color: textGray }}
            >
              {t.about.bio.part1}{" "}
              <span className="font-semibold" style={{ color: cyan }}>
                {t.about.bio.school}
              </span>
              {t.about.bio.part2}{" "}
              <span className="font-semibold" style={{ color: textWhite }}>
                {t.about.bio.major}
              </span>{" "}
              {t.about.bio.part3}{" "}
              <span className="font-semibold" style={{ color: textGray }}>
                {t.about.bio.university}
              </span>
              {t.about.bio.part4}
            </motion.p>

            {/* Baris Statistik */}
            <motion.div
              variants={fadeUp(0.5)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex gap-8 py-4 border-y"
              style={{ borderColor }}
            >
              {[
                { value: "18+", label: t.about.stats.skills },
                { value: "6+", label: t.about.stats.projects },
                { value: "3+", label: t.about.stats.yearsExp },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-bold text-2xl" style={{ color: cyan }}>
                    {stat.value}
                  </div>
                  <div
                    className="font-mono text-xs tracking-widest uppercase mt-0.5"
                    style={{ color: textGray }}
                  >
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
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold tracking-widest uppercase rounded-lg transition-all duration-300"
                style={{
                  background: isDark
                    ? "linear-gradient(135deg, #00f5ff, #a855f7)"
                    : "linear-gradient(135deg, #0891b2, #7c3aed)",
                  boxShadow: isDark
                    ? "0 0 20px rgba(0,245,255,0.4)"
                    : "0 0 20px rgba(8,145,178,0.3)",
                  color: isDark ? "#000000" : "#ffffff",
                }}
              >
                {t.about.cta.contact}
              </motion.a>
              <motion.a
                href="/CV_Orlando.pdf"
                download
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold tracking-widest uppercase rounded-lg transition-all duration-300 border"
                style={{
                  color: cyan,
                  borderColor: isDark ? "rgba(0,245,255,0.3)" : "rgba(8,145,178,0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark
                    ? "rgba(0,245,255,0.08)"
                    : "rgba(8,145,178,0.08)";
                  e.currentTarget.style.boxShadow = isDark
                    ? "0 0 15px rgba(0,245,255,0.3)"
                    : "0 0 15px rgba(8,145,178,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <RiDownloadLine className="text-lg" />
                {t.about.cta.downloadCv}
              </motion.a>
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
                style={{ background: `radial-gradient(circle, ${cyan}, transparent)` }}
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
                <div
                  key={i}
                  className={`absolute ${cls} z-10 rounded-sm`}
                  style={{ borderColor: cyan }}
                />
              ))}

              {/* Kontainer Gambar Profil */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-2xl overflow-hidden"
                style={{
                  border: `2px solid ${isDark ? "rgba(0,245,255,0.3)" : "rgba(8,145,178,0.3)"}`,
                  boxShadow: isDark
                    ? "0 0 60px rgba(0,245,255,0.3), 0 0 120px rgba(168,85,247,0.2), inset 0 0 20px rgba(0,245,255,0.1)"
                    : "0 0 40px rgba(8,145,178,0.15), 0 0 80px rgba(124,58,237,0.1)",
                }}
              >
                <img
                  src="/images/profile2.jpeg"
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
                  <div className="text-6xl mb-4" style={{ color: cyan }}>
                    👨‍💻
                  </div>
                  <span className="font-mono text-xs tracking-widest" style={{ color: `${cyan}99` }}>
                    profile.jpg
                  </span>
                </div>

                {/* Efek Garis Scanline Biru */}
                <div
                  className="absolute left-0 right-0 h-px pointer-events-none"
                  style={{
                    background: isDark ? "rgba(0,245,255,0.4)" : "rgba(8,145,178,0.3)",
                    top: "0%",
                    animation: "scan 4s linear infinite",
                    boxShadow: isDark ? "0 0 8px #00f5ff" : "0 0 8px rgba(8,145,178,0.4)",
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
                  className="px-3 py-1.5 text-[10px] sm:text-xs font-mono rounded-lg border backdrop-blur-sm"
                  style={{
                    borderColor: isDark ? "rgba(168,85,247,0.3)" : "rgba(124,58,237,0.25)",
                    color: isDark ? "#c084fc" : "#7c3aed",
                    background: isDark ? "rgba(3,7,18,0.8)" : "rgba(255,255,255,0.6)",
                    boxShadow: isDark ? "0 0 15px rgba(168,85,247,0.2)" : "0 0 10px rgba(124,58,237,0.1)",
                  }}
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
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2"
        >
          <span className="font-mono text-xs tracking-widest uppercase" style={{ color: textMuted }}>
            {t.about.scroll}
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <RiArrowDownLine className="text-xl" style={{ color: `${cyan}99` }} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}