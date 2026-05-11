import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../hooks/useTheme";

export default function Modal({ isOpen, item, onClose }) {
  const { isDark } = useTheme();

  if (!item) return null;

  const cyan = isDark ? "#00f5ff" : "#0891b2";
  const textWhite = isDark ? "#ffffff" : "#0f172a";
  const textGray = isDark ? "#9ca3af" : "#475569";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-md"
            style={{
              background: isDark ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.4)",
            }}
          />

          {/* Modal Card */}
          <motion.div
            className="relative z-10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border"
            style={{
              background: isDark ? "#030712" : "#ffffff",
              borderColor: isDark ? "rgba(0,245,255,0.2)" : "rgba(8,145,178,0.2)",
              boxShadow: isDark
                ? "0 0 40px rgba(0,245,255,0.15)"
                : "0 0 40px rgba(0,0,0,0.1)",
            }}
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div
              className="relative h-52 overflow-hidden"
              style={{ background: isDark ? "#111827" : "#e2e8f0" }}
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover opacity-80"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: isDark
                    ? "linear-gradient(to top, #030712, transparent, transparent)"
                    : "linear-gradient(to top, #ffffff, transparent, transparent)",
                }}
              />
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all border"
                style={{
                  background: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.8)",
                  borderColor: isDark ? "rgba(0,245,255,0.3)" : "rgba(8,145,178,0.2)",
                  color: isDark ? "#d1d5db" : "#475569",
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3
                className="text-xl font-bold mb-3 tracking-wide"
                style={{ color: textWhite }}
              >
                {item.title}
              </h3>
              <p
                className="text-sm leading-relaxed mb-4"
                style={{ color: textGray }}
              >
                {item.description}
              </p>
              {/* Tech stack badges */}
              <div className="flex flex-wrap gap-2">
                {item.tech?.map((techItem) => (
                  <span
                    key={techItem}
                    className="px-3 py-1 text-xs rounded-full font-mono border"
                    style={{
                      color: cyan,
                      background: isDark ? "rgba(0,245,255,0.06)" : "rgba(8,145,178,0.06)",
                      borderColor: isDark ? "rgba(0,245,255,0.2)" : "rgba(8,145,178,0.15)",
                    }}
                  >
                    {techItem}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}