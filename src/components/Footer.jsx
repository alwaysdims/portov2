import { useLanguage } from "../hooks/useLanguage";
import { useTheme } from "../hooks/useTheme";

export default function Footer() {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const cyan = isDark ? "#00f5ff" : "#0891b2";

  return (
    <footer
      className="py-8 text-center border-t"
      style={{
        borderColor: isDark ? "rgba(0,245,255,0.08)" : "rgba(8,145,178,0.1)",
      }}
    >
      <p
        className="text-sm tracking-widest font-mono"
        style={{
          color: isDark ? "#6b7280" : "#94a3b8",
          textShadow: isDark ? "0 0 10px rgba(0,245,255,0.3)" : "none",
        }}
      >
        © <span style={{ color: cyan }}>dimsWebDev</span> · {t.footer.builtWith}
      </p>
    </footer>
  );
}