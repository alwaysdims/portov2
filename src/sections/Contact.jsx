import { motion } from "framer-motion";
import { FaInstagram, FaTiktok, FaGithub } from "react-icons/fa";
import { useLanguage } from "../hooks/useLanguage";
import { useTheme } from "../hooks/useTheme";

const contacts = [
  {
    icon: FaInstagram,
    label: "Instagram",
    value: "@dimszyo",
    href: "https://instagram.com/dimszyo",
    color: "#E1306C",
  },
  {
    icon: FaTiktok,
    label: "TikTok",
    value: "@dims8000",
    href: "https://tiktok.com/@dims8000",
    color: "#00f5ff",
  },
  {
    icon: FaGithub,
    label: "GitHub",
    value: "@alwaysdims",
    href: "https://github.com/alwaysdims",
    color: "#ffffff", // Putih untuk kesan netral di background gelap
  },
];

export default function Contact() {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const cyan = isDark ? "#00f5ff" : "#0891b2";
  const textWhite = isDark ? "#ffffff" : "#0f172a";
  const textMuted = isDark ? "#6b7280" : "#94a3b8";

  return (
    <section id="contact" className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <p className="font-mono text-sm tracking-widest uppercase mb-2" style={{ color: cyan }}>
          {t.contact.subtitle}
        </p>
        <h2 className="text-3xl md:text-4xl font-black" style={{ color: textWhite }}>
          {t.contact.title1}{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: isDark
                ? "linear-gradient(135deg, #00f5ff, #ff00ff)"
                : "linear-gradient(135deg, #0891b2, #db2777)",
            }}
          >
            {t.contact.title2}
          </span>
        </h2>
        <p className="mt-4 max-w-md mx-auto text-sm" style={{ color: textMuted }}>
          {t.contact.description}
        </p>
      </motion.div>

      {/* Grid disesuaikan agar rapi jika ada 4 item. */}
      {/* Mobile: 1 kolom. Tablet: 2 kolom. Desktop: 4 kolom (flex-wrap) */}
      <div className="flex flex-wrap gap-6 justify-center items-center max-w-4xl mx-auto">
        {contacts.map((c, i) => {
          const Icon = c.icon;
          // Adjust GitHub icon color for light mode
          const iconColor = c.label === "GitHub" && !isDark ? "#0f172a" : c.color;
          return (
            <motion.a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="group flex flex-col items-center gap-4 p-8 rounded-2xl border w-full sm:w-[calc(50%-12px)] md:w-56 transition-all duration-300"
              style={{
                borderColor: isDark ? "#1f2937" : "#cbd5e1",
                background: isDark ? "rgba(3,7,18,0.6)" : "rgba(255,255,255,0.6)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = iconColor + "60";
                e.currentTarget.style.boxShadow = `0 0 30px ${iconColor}25`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDark ? "#1f2937" : "#cbd5e1";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300"
                style={{
                  background: iconColor + "15",
                  border: `1px solid ${iconColor}30`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 20px ${iconColor}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <Icon size={28} color={iconColor} />
              </div>
              <div className="text-center">
                <p
                  className="text-xs font-mono uppercase tracking-widest mb-1"
                  style={{ color: textMuted }}
                >
                  {c.label}
                </p>
                <p className="font-semibold text-sm" style={{ color: textWhite }}>
                  {c.value}
                </p>
              </div>
            </motion.a>
          );
        })}
      </div>
    </section>
  );
}