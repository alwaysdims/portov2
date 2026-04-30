import { motion } from "framer-motion";
import { useModal } from "../hooks/useModal";
import Modal from "../components/Modal";

// Pindahkan data ini ke folder /data/certificates.js jika ingin dipisah
const certificates = [
  {
    id: 1,
    title: "System Informasi Sekolah JHIC 2025",
    issuer: "Jagoan Hosting",
    image: "/images/sertif/JHIC.png", 
  },
 
  {
    id: 2,
    title: "Design Web MIKROPTIK 2025",
    issuer: "PTIK UNS",
    image: "/images/sertif/mikroptik.png", 
  },
  {
    id: 3,
    title: "UI/UX Design Sevent 9.0 2025",
    issuer: "Software Engineering Telkom University Purwokerto",
    image: "/images/sertif/sevent.png", 
  },
  {
    id: 4,
    title: "Web/Mobile App Traspac 2025",
    issuer: "PT. Traspac",
    image: "/images/sertif/traspac.png", 
  },
  {
    id: 5,
    title: "Pelatihan HTML, CSS, JS",
    issuer: "GameLab Indonesia",
    image: "/images/sertif/1.png", 
  },
  {
    id: 6,
    title: "Pelatihan NodeJs dan Mysql",
    issuer: "GameLab Indonesia",
    image: "/images/sertif/2.png", 
  },
  {
    id: 7,
    title: "Pelatihan NodeJs dan MongoDB",
    issuer: "GameLab Indonesia",
    image: "/images/sertif/3.png", 
  },
 
];

export default function Certificates() {
  const { isOpen, selectedItem, openModal, closeModal } = useModal();

  return (
    <section id="certificates" className="py-24 px-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase mb-2">&gt;_ My Achievements</p>
        <h2 className="text-3xl md:text-4xl font-black text-white">
          Professional{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, #00f5ff, #a855f7)" }}
          >
            Certificates
          </span>
        </h2>
      </motion.div>

      {/* Grid: Mobile(1), Tablet(2), Desktop(3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map((cert, i) => (
          <motion.div
            key={cert.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -6, scale: 1.02 }} // Sedikit zoom card secara keseluruhan
            onClick={() => openModal(cert)}
            className="group relative rounded-xl overflow-hidden border border-gray-800 hover:border-cyan-500/50 cursor-pointer transition-all duration-300"
            style={{ boxShadow: "0 0 0 rgba(0,245,255,0)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 0 30px rgba(0,245,255,0.2)"; // Hover glow effect cyan
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 rgba(0,245,255,0)";
            }}
          >
            {/* Image Thumbnail */}
            <div className="h-52 bg-gradient-to-br from-gray-900 to-gray-950 relative overflow-hidden flex items-center justify-center">
              <img
                src={cert.image}
                alt={cert.title}
                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" // Efek zoom animasi pada gambar
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              {/* Fallback placeholder jika gambar error/tidak ada */}
              <div className="absolute inset-0 flex items-center justify-center -z-10">
                <span className="text-5xl opacity-20">📜</span>
              </div>
              {/* Overlay shadow bawah */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
            </div>

            {/* Certificate Detail */}
            <div className="p-5 bg-gray-950">
              <h3 className="text-white font-bold text-base tracking-wide mb-1 group-hover:text-cyan-300 transition-colors duration-300">
                {cert.title}
              </h3>
              
              {/* Issuer (Platform/Organization) */}
              <div className="inline-flex mt-1">
                <span className="text-xs px-2 py-1 rounded font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {cert.issuer}
                </span>
              </div>
              
              <p className="text-xs text-gray-500 mt-4 font-mono group-hover:text-cyan-400 transition-colors">
                Click to view certificate →
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal Reusable */}
      <Modal isOpen={isOpen} item={selectedItem} onClose={closeModal} />
    </section>
  );
}