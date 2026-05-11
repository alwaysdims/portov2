import { motion } from "framer-motion";
import {
  SiPhp, SiHtml5, SiJavascript, SiGo, SiDart,
  SiReact, SiCodeigniter, SiLaravel, SiTailwindcss, SiBootstrap, SiFlutter,
  SiGit, SiFigma, SiMysql, SiPostgresql, SiMongodb,
} from "react-icons/si";
import { DiCss3, DiDotnet } from "react-icons/di";
import { useLanguage } from "../hooks/useLanguage";
import { useTheme } from "../hooks/useTheme";

const skillsData = [
  // Languages
  { name: "PHP", category: "Languages", Icon: SiPhp, color: "#777BB4" },
  { name: "HTML", category: "Languages", Icon: SiHtml5, color: "#E34F26" },
  { name: "CSS", category: "Languages", Icon: DiCss3, color: "#1572B6" },
  { name: "JavaScript", category: "Languages", Icon: SiJavascript, color: "#F7DF1E" },
  { name: "Golang", category: "Languages", Icon: SiGo, color: "#00ADD8" },
  { name: "C#", category: "Languages", Icon: DiDotnet, color: "#9B59B6" },
  { name: "Dart", category: "Languages", Icon: SiDart, color: "#0175C2" },
  // Frameworks
  { name: "React", category: "Frameworks", Icon: SiReact, color: "#61DAFB" },
  { name: "CodeIgniter", category: "Frameworks", Icon: SiCodeigniter, color: "#EF4223" },
  { name: "Laravel", category: "Frameworks", Icon: SiLaravel, color: "#FF2D20" },
  { name: "Tailwind", category: "Frameworks", Icon: SiTailwindcss, color: "#06B6D4" },
  { name: "Bootstrap", category: "Frameworks", Icon: SiBootstrap, color: "#7952B3" },
  { name: "Flutter", category: "Frameworks", Icon: SiFlutter, color: "#02569B" },
  // Tools
  { name: "Git", category: "Tools", Icon: SiGit, color: "#F05032" },
  { name: "Figma", category: "Tools", Icon: SiFigma, color: "#F24E1E" },
  // Databases
  { name: "MySQL", category: "Databases", Icon: SiMysql, color: "#4479A1" },
  { name: "PostgreSQL", category: "Databases", Icon: SiPostgresql, color: "#336791" },
  { name: "MongoDB", category: "Databases", Icon: SiMongodb, color: "#47A248" },
];

const categoryKeys = ["Languages", "Frameworks", "Tools", "Databases"];

export default function Skills() {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const cyan = isDark ? "#00f5ff" : "#0891b2";
  const purple = isDark ? "#a855f7" : "#7c3aed";
  const textWhite = isDark ? "#ffffff" : "#0f172a";
  const textGray = isDark ? "#9ca3af" : "#475569";

  return (
    <section id="skills" className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <p className="font-mono text-sm tracking-widest uppercase mb-2" style={{ color: cyan }}>
          {t.skills.subtitle}
        </p>
        <h2 className="text-3xl md:text-4xl font-black" style={{ color: textWhite }}>
          {t.skills.title1}{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: isDark
                ? "linear-gradient(135deg, #00f5ff, #a855f7)"
                : "linear-gradient(135deg, #0891b2, #7c3aed)",
            }}
          >
            {t.skills.title2}
          </span>
        </h2>
      </motion.div>

      {categoryKeys.map((key, ci) => (
        <div key={key} className="mb-12">
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: ci * 0.05 }}
            viewport={{ once: true }}
            className="text-xs font-mono tracking-widest uppercase mb-5 flex items-center gap-3"
            style={{ color: purple }}
          >
            <span
              className="flex-1 h-px"
              style={{ background: isDark ? "rgba(168,85,247,0.2)" : "rgba(124,58,237,0.15)" }}
            />
            {t.skills.categories[key]}
            <span
              className="flex-1 h-px"
              style={{ background: isDark ? "rgba(168,85,247,0.2)" : "rgba(124,58,237,0.15)" }}
            />
          </motion.h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {skillsData
              .filter((s) => s.category === key)
              .map((skill, i) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.08 }}
                  className="group relative flex flex-col items-center gap-3 p-4 rounded-xl border cursor-default transition-all duration-300 overflow-hidden"
                  style={{
                    borderColor: isDark ? "#1f2937" : "#cbd5e1",
                    background: isDark ? "rgba(3,7,18,0.6)" : "rgba(255,255,255,0.6)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = isDark
                      ? "rgba(0,245,255,0.4)"
                      : "rgba(8,145,178,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isDark ? "#1f2937" : "#cbd5e1";
                  }}
                >
                  <div
                    className="transition-all duration-300"
                    style={{ color: skill.color }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.filter = `drop-shadow(0 0 10px ${skill.color})`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter = "none";
                    }}
                  >
                    <skill.Icon size={32} />
                  </div>
                  <span
                    className="text-xs font-mono transition-colors duration-300 text-center"
                    style={{ color: textGray }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = textWhite;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = textGray;
                    }}
                  >
                    {skill.name}
                  </span>
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                    style={{ background: skill.color }}
                  />
                </motion.div>
              ))}
          </div>
        </div>
      ))}
    </section>
  );
}