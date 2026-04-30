import { motion } from "framer-motion";
import { FaWhatsapp, FaInstagram, FaTiktok, FaGithub } from "react-icons/fa";

const contacts = [
  {
    icon: FaWhatsapp,
    label: "WhatsApp",
    value: "085703113703",
    href: "https://wa.me/6285703113703",
    color: "#25D366",
  },
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
    value: "@dimszyo",
    href: "https://tiktok.com/@dimszyo",
    color: "#ff00ff",
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
  return (
    <section id="contact" className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase mb-2">&gt;_ Reach Out</p>
        <h2 className="text-3xl md:text-4xl font-black text-white">
          Get In{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, #00f5ff, #ff00ff)" }}
          >
            Touch
          </span>
        </h2>
        <p className="text-gray-500 mt-4 max-w-md mx-auto text-sm">
        Available for collaboration or exciting projects. Let’s connect through the platforms below!
        </p>
      </motion.div>

      {/* Grid disesuaikan agar rapi jika ada 4 item. */}
      {/* Mobile: 1 kolom. Tablet: 2 kolom. Desktop: 4 kolom (flex-wrap) */}
      <div className="flex flex-wrap gap-6 justify-center items-center max-w-4xl mx-auto">
        {contacts.map((c, i) => {
          const Icon = c.icon;
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
              className="group flex flex-col items-center gap-4 p-8 rounded-2xl border border-gray-800 bg-gray-950/60 w-full sm:w-[calc(50%-12px)] md:w-56 transition-all duration-300"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = c.color + "60";
                e.currentTarget.style.boxShadow = `0 0 30px ${c.color}25`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300"
                style={{ background: c.color + "15", border: `1px solid ${c.color}30` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 20px ${c.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <Icon size={28} color={c.color} />
              </div>
              <div className="text-center">
                <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">{c.label}</p>
                <p className="text-white font-semibold text-sm">{c.value}</p>
              </div>
            </motion.a>
          );
        })}
      </div>
    </section>
  );
}