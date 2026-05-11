import { motion } from "framer-motion";
import { useModal } from "../hooks/useModal";
import Modal from "../components/Modal";
import { useLanguage } from "../hooks/useLanguage";
import { useTheme } from "../hooks/useTheme";

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
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const cyan = isDark ? "#00f5ff" : "#0891b2";
  const purple = isDark ? "#a855f7" : "#7c3aed";
  const textWhite = isDark ? "#ffffff" : "#0f172a";
  const textMuted = isDark ? "#6b7280" : "#94a3b8";

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
        <p className="font-mono text-sm tracking-widest uppercase mb-2" style={{ color: cyan }}>
          {t.certificates.subtitle}
        </p>
        <h2 className="text-3xl md:text-4xl font-black" style={{ color: textWhite }}>
          {t.certificates.title1}{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: isDark
                ? "linear-gradient(135deg, #00f5ff, #a855f7)"
                : "linear-gradient(135deg, #0891b2, #7c3aed)",
            }}
          >
            {t.certificates.title2}
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
            whileHover={{ y: -6, scale: 1.02 }}
            onClick={() => openModal(cert)}
            className="group relative rounded-xl overflow-hidden border cursor-pointer transition-all duration-300"
            style={{
              borderColor: isDark ? "#1f2937" : "#cbd5e1",
              boxShadow: "0 0 0 rgba(0,245,255,0)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = isDark
                ? "0 0 30px rgba(0,245,255,0.2)"
                : "0 0 20px rgba(8,145,178,0.12)";
              e.currentTarget.style.borderColor = isDark
                ? "rgba(0,245,255,0.4)"
                : "rgba(8,145,178,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 rgba(0,245,255,0)";
              e.currentTarget.style.borderColor = isDark ? "#1f2937" : "#cbd5e1";
            }}
          >
            {/* Image Thumbnail */}
            <div
              className="h-52 relative overflow-hidden flex items-center justify-center"
              style={{
                background: isDark
                  ? "linear-gradient(to bottom right, #111827, #030712)"
                  : "linear-gradient(to bottom right, #e2e8f0, #f1f5f9)",
              }}
            >
              <img
                src={cert.image}
                alt={cert.title}
                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              {/* Fallback placeholder jika gambar error/tidak ada */}
              <div className="absolute inset-0 flex items-center justify-center -z-10">
                <span className="text-5xl opacity-20">📜</span>
              </div>
              {/* Overlay shadow bawah */}
              <div
                className="absolute inset-0"
                style={{
                  background: isDark
                    ? "linear-gradient(to top, #030712, transparent, transparent)"
                    : "linear-gradient(to top, #ffffff, transparent, transparent)",
                }}
              />
            </div>

            {/* Certificate Detail */}
            <div className="p-5" style={{ background: isDark ? "#030712" : "#ffffff" }}>
              <h3
                className="font-bold text-base tracking-wide mb-1 transition-colors duration-300"
                style={{ color: textWhite }}
              >
                {cert.title}
              </h3>
              
              {/* Issuer (Platform/Organization) */}
              <div className="inline-flex mt-1">
                <span
                  className="text-xs px-2 py-1 rounded font-mono border"
                  style={{
                    color: cyan,
                    background: isDark ? "rgba(0,245,255,0.06)" : "rgba(8,145,178,0.06)",
                    borderColor: isDark ? "rgba(0,245,255,0.2)" : "rgba(8,145,178,0.15)",
                  }}
                >
                  {cert.issuer}
                </span>
              </div>
              
              <p
                className="text-xs mt-4 font-mono transition-colors"
                style={{ color: textMuted }}
              >
                {t.certificates.viewCert}
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