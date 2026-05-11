import { motion } from "framer-motion";
import { projects } from "../data/projects";
import { useModal } from "../hooks/useModal";
import Modal from "../components/Modal";
import { useLanguage } from "../hooks/useLanguage";
import { useTheme } from "../hooks/useTheme";

export default function Portfolio() {
  const { isOpen, selectedItem, openModal, closeModal } = useModal();
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const cyan = isDark ? "#00f5ff" : "#0891b2";
  const purple = isDark ? "#a855f7" : "#7c3aed";
  const textWhite = isDark ? "#ffffff" : "#0f172a";
  const textMuted = isDark ? "#6b7280" : "#94a3b8";

  return (
    <section id="portfolio" className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <p className="font-mono text-sm tracking-widest uppercase mb-2" style={{ color: cyan }}>
          {t.portfolio.subtitle}
        </p>
        <h2 className="text-3xl md:text-4xl font-black" style={{ color: textWhite }}>
          {t.portfolio.title1}{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: isDark
                ? "linear-gradient(135deg, #a855f7, #ff00ff)"
                : "linear-gradient(135deg, #7c3aed, #db2777)",
            }}
          >
            {t.portfolio.title2}
          </span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -6 }}
            onClick={() => openModal(project)}
            className="group relative rounded-xl overflow-hidden border cursor-pointer transition-all duration-300"
            style={{
              borderColor: isDark ? "#1f2937" : "#cbd5e1",
              boxShadow: "0 0 0 rgba(168,85,247,0)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = isDark
                ? "0 0 30px rgba(168,85,247,0.2)"
                : "0 0 20px rgba(124,58,237,0.12)";
              e.currentTarget.style.borderColor = isDark
                ? "rgba(168,85,247,0.4)"
                : "rgba(124,58,237,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 rgba(168,85,247,0)";
              e.currentTarget.style.borderColor = isDark ? "#1f2937" : "#cbd5e1";
            }}
          >
            {/* Image */}
            <div
              className="h-52 relative overflow-hidden flex items-center justify-center"
              style={{
                background: isDark
                  ? "linear-gradient(to bottom right, #111827, #030712)"
                  : "linear-gradient(to bottom right, #e2e8f0, #f1f5f9)",
              }}
            >
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              {/* Fallback placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl opacity-20">🖥️</span>
              </div>
              {/* Overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: isDark
                    ? "linear-gradient(to top, #030712, rgba(3,7,18,0.4), transparent)"
                    : "linear-gradient(to top, #ffffff, rgba(255,255,255,0.3), transparent)",
                }}
              />
            </div>

            {/* Title */}
            <div
              className="p-5"
              style={{ background: isDark ? "#030712" : "#ffffff" }}
            >
              <h3
                className="font-bold text-base tracking-wide mb-1 transition-colors duration-300"
                style={{ color: textWhite }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = isDark ? "#c084fc" : "#7c3aed";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = textWhite;
                }}
              >
                {project.title}
              </h3>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {project.tech?.slice(0, 3).map((techItem) => (
                  <span
                    key={techItem}
                    className="text-xs px-2 py-0.5 rounded font-mono border"
                    style={{
                      color: purple,
                      background: isDark ? "rgba(168,85,247,0.08)" : "rgba(124,58,237,0.06)",
                      borderColor: isDark ? "rgba(168,85,247,0.2)" : "rgba(124,58,237,0.15)",
                    }}
                  >
                    {techItem}
                  </span>
                ))}
              </div>
              <p className="text-xs mt-3 font-mono" style={{ color: textMuted }}>
                {t.portfolio.viewDetails}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal isOpen={isOpen} item={selectedItem} onClose={closeModal} />
    </section>
  );
}