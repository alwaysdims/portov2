import { motion, AnimatePresence } from "framer-motion";

export default function Modal({ isOpen, item, onClose }) {
  if (!item) return null;

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
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          {/* Modal Card */}
          <motion.div
            className="relative z-10 bg-gray-950 border border-cyan-500/30 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
            style={{ boxShadow: "0 0 40px rgba(0,245,255,0.15)" }}
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="relative h-52 bg-gray-900 overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover opacity-80"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 border border-cyan-500/40 text-gray-300 hover:text-cyan-400 flex items-center justify-center text-lg transition-all"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-3 tracking-wide">
                {item.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                {item.description}
              </p>
              {/* Tech stack badges */}
              <div className="flex flex-wrap gap-2">
                {item.tech?.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 text-xs rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono"
                  >
                    {t}
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