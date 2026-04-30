import { motion } from "framer-motion";
import { projects } from "../data/projects";
import { useModal } from "../hooks/useModal";
import Modal from "../components/Modal";

export default function Portfolio() {
  const { isOpen, selectedItem, openModal, closeModal } = useModal();

  return (
    <section id="portfolio" className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase mb-2">&gt;_ My Work</p>
        <h2 className="text-3xl md:text-4xl font-black text-white">
          Featured{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #ff00ff)" }}
          >
            Projects
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
            className="group relative rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500/50 cursor-pointer transition-all duration-300"
            style={{ boxShadow: "0 0 0 rgba(168,85,247,0)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 0 30px rgba(168,85,247,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 rgba(168,85,247,0)";
            }}
          >
            {/* Image */}
            <div className="h-52 bg-gradient-to-br from-gray-900 to-gray-950 relative overflow-hidden flex items-center justify-center">
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
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
            </div>

            {/* Title */}
            <div className="p-5 bg-gray-950">
              <h3 className="text-white font-bold text-base tracking-wide mb-1 group-hover:text-purple-300 transition-colors duration-300">
                {project.title}
              </h3>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {project.tech?.slice(0, 3).map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3 font-mono">Click to view details →</p>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal isOpen={isOpen} item={selectedItem} onClose={closeModal} />
    </section>
  );
}