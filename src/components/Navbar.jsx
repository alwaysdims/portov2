import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineSun, HiOutlineMoon } from "react-icons/hi2";
import { IoLanguageOutline } from "react-icons/io5";
import { useLanguage } from "../hooks/useLanguage";
import { useTheme } from "../hooks/useTheme";

const navKeys = ["about", "skills", "portfolio", "certificates", "contact"];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("about");
  const [menuOpen, setMenuOpen] = useState(false);

  const { t, language, toggleLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const navLinks = navKeys.map((key) => ({
    label: t.nav[key],
    href: `#${key}`,
    key,
  }));

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const sections = navKeys;
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActive(id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`fixed z-50 transition-all duration-300 ${
        scrolled
          ? "top-3 left-4 right-4 backdrop-blur-xl border rounded-2xl"
          : "top-0 left-0 right-0 bg-transparent"
      }`}
      style={
        scrolled
          ? {
              background: isDark
                ? "rgba(5,5,16,0.8)"
                : "rgba(240,244,248,0.85)",
              borderColor: isDark
                ? "rgba(0,245,255,0.15)"
                : "rgba(0,180,200,0.2)",
              boxShadow: isDark
                ? "0 4px 30px rgba(0,245,255,0.05)"
                : "0 4px 30px rgba(0,0,0,0.06)",
            }
          : {}
      }
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#about" className="text-xl font-black tracking-widest group">
          <span style={{ color: isDark ? "#00f5ff" : "#0891b2" }}>&lt;</span>
          <span style={{ color: isDark ? "#ffffff" : "#0f172a" }}>dims</span>
          <span style={{ color: isDark ? "#a855f7" : "#7c3aed" }}>zyo</span>
          <span style={{ color: isDark ? "#00f5ff" : "#0891b2" }}>/&gt;</span>
        </a>

        {/* Desktop Links */}
        <ul className="hidden md:flex gap-6 lg:gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm tracking-widest uppercase font-semibold transition-all duration-300 relative group"
                style={{
                  color:
                    active === link.key
                      ? isDark
                        ? "#00f5ff"
                        : "#0891b2"
                      : isDark
                        ? "#9ca3af"
                        : "#64748b",
                }}
                onMouseEnter={(e) => {
                  if (active !== link.key) {
                    e.currentTarget.style.color = isDark ? "#00f5ff" : "#0891b2";
                  }
                }}
                onMouseLeave={(e) => {
                  if (active !== link.key) {
                    e.currentTarget.style.color = isDark ? "#9ca3af" : "#64748b";
                  }
                }}
              >
                {link.label}
                <span
                  className="absolute -bottom-1 left-0 h-px transition-all duration-300"
                  style={{
                    background: isDark ? "#00f5ff" : "#0891b2",
                    boxShadow: isDark ? "0 0 8px #00f5ff" : "0 0 8px rgba(8,145,178,0.4)",
                    width: active === link.key ? "100%" : "0",
                  }}
                />
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language Toggle */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-300 border"
            style={{
              color: isDark ? "#a855f7" : "#7c3aed",
              borderColor: isDark ? "rgba(168,85,247,0.3)" : "rgba(124,58,237,0.3)",
              background: isDark ? "rgba(168,85,247,0.08)" : "rgba(124,58,237,0.08)",
            }}
            aria-label="Toggle language"
          >
            <IoLanguageOutline className="text-sm" />
            <span>{language === "en" ? "EN" : "ID"}</span>
          </motion.button>

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 border"
            style={{
              color: isDark ? "#00f5ff" : "#0891b2",
              borderColor: isDark ? "rgba(0,245,255,0.3)" : "rgba(8,145,178,0.3)",
              background: isDark ? "rgba(0,245,255,0.08)" : "rgba(8,145,178,0.08)",
            }}
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <HiOutlineSun className="text-lg" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <HiOutlineMoon className="text-lg" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Hamburger Button */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 z-50"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span
            className="block w-6 h-0.5 transition-all duration-300"
            style={{
              background: isDark ? "#00f5ff" : "#0891b2",
              transform: menuOpen ? "rotate(45deg) translateY(8px)" : "none",
            }}
          />
          <span
            className="block w-6 h-0.5 transition-all duration-300"
            style={{
              background: isDark ? "#00f5ff" : "#0891b2",
              opacity: menuOpen ? 0 : 1,
            }}
          />
          <span
            className="block w-6 h-0.5 transition-all duration-300"
            style={{
              background: isDark ? "#00f5ff" : "#0891b2",
              transform: menuOpen ? "rotate(-45deg) translateY(-8px)" : "none",
            }}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t backdrop-blur-xl"
            style={{
              background: isDark
                ? "rgba(5,5,16,0.97)"
                : "rgba(240,244,248,0.97)",
              borderColor: isDark
                ? "rgba(0,245,255,0.15)"
                : "rgba(0,180,200,0.2)",
            }}
          >
            <div className="px-6 py-6 flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    document.body.style.overflow = "";
                    setMenuOpen(false);
                    // Scroll after menu close so body overflow is restored
                    setTimeout(() => {
                      const target = document.getElementById(link.key);
                      if (target) {
                        target.scrollIntoView({ behavior: "smooth" });
                      }
                    }, 50);
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="text-sm tracking-widest uppercase font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                  style={{
                    color:
                      active === link.key
                        ? isDark
                          ? "#00f5ff"
                          : "#0891b2"
                        : isDark
                          ? "#9ca3af"
                          : "#64748b",
                    background:
                      active === link.key
                        ? isDark
                          ? "rgba(0,245,255,0.06)"
                          : "rgba(8,145,178,0.06)"
                        : "transparent",
                    borderLeft:
                      active === link.key
                        ? `2px solid ${isDark ? "#00f5ff" : "#0891b2"}`
                        : "2px solid transparent",
                  }}
                >
                  {link.label}
                </motion.a>
              ))}

              {/* Mobile Controls */}
              <div
                className="flex items-center gap-3 mt-4 pt-4 border-t"
                style={{
                  borderColor: isDark
                    ? "rgba(0,245,255,0.1)"
                    : "rgba(0,180,200,0.15)",
                }}
              >
                {/* Language Toggle - Mobile */}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={toggleLanguage}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-300 border flex-1 justify-center"
                  style={{
                    color: isDark ? "#a855f7" : "#7c3aed",
                    borderColor: isDark ? "rgba(168,85,247,0.3)" : "rgba(124,58,237,0.3)",
                    background: isDark ? "rgba(168,85,247,0.08)" : "rgba(124,58,237,0.08)",
                  }}
                >
                  <IoLanguageOutline className="text-sm" />
                  <span>{language === "en" ? "EN" : "ID"}</span>
                </motion.button>

                {/* Theme Toggle - Mobile */}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={toggleTheme}
                  className="w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-300 border"
                  style={{
                    color: isDark ? "#00f5ff" : "#0891b2",
                    borderColor: isDark ? "rgba(0,245,255,0.3)" : "rgba(8,145,178,0.3)",
                    background: isDark ? "rgba(0,245,255,0.08)" : "rgba(8,145,178,0.08)",
                  }}
                >
                  {isDark ? (
                    <HiOutlineSun className="text-lg" />
                  ) : (
                    <HiOutlineMoon className="text-lg" />
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}