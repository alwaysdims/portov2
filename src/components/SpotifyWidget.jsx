// src/components/SpotifyWidget.jsx
import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useSpotifyWidget } from "../hooks/useSpotifyWidget";
import { useTheme } from "../hooks/useTheme";

// ─── Replace this with your actual Spotify embed URL ───────────────────────
const SPOTIFY_EMBED_URL =
  "https://open.spotify.com/embed/playlist/6sFLDll2ruJn1tUMGaiprp?utm_source=generator";
// ────────────────────────────────────────────────────────────────────────────

  // <iframe data-testid="embed-iframe" style="border-radius:12px" src="https://open.spotify.com/embed/playlist/6sFLDll2ruJn1tUMGaiprp?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
/* ─── Neon pulse ring that sits behind the button ─────────────────────── */
function PulseRing({ isDark }) {
  return (
    <span
      className="absolute inset-0 rounded-full pointer-events-none"
      style={{
        animation: "spotify-pulse 2.4s ease-out infinite",
        background: "transparent",
        border: `2px solid ${isDark ? "#00f5ff" : "#0891b2"}`,
        opacity: 0,
      }}
    />
  );
}

/* ─── Animated music bars icon ────────────────────────────────────────── */
function MusicBarsIcon({ isDark, isOpen }) {
  const color = isDark ? "#00f5ff" : "#0891b2";
  const bars = [
    { delay: "0s",    height: isOpen ? 12 : 14 },
    { delay: "0.15s", height: isOpen ? 18 : 10 },
    { delay: "0.3s",  height: isOpen ? 10 : 18 },
    { delay: "0.45s", height: isOpen ? 16 : 12 },
  ];

  return (
    <span className="flex items-end gap-[3px]" style={{ height: 20 }}>
      {bars.map((b, i) => (
        <span
          key={i}
          style={{
            display: "block",
            width: 4,
            height: b.height,
            borderRadius: 2,
            background: color,
            boxShadow: `0 0 6px ${color}`,
            animation: isOpen
              ? `spotify-bar 0.8s ease-in-out infinite alternate`
              : "none",
            animationDelay: b.delay,
            transition: "height 0.3s ease",
          }}
        />
      ))}
    </span>
  );
}

/* ─── Close (×) button ────────────────────────────────────────────────── */
function CloseButton({ onClick, isDark }) {
  const color = isDark ? "#00f5ff" : "#0891b2";
  return (
    <motion.button
      whileHover={{ scale: 1.15, rotate: 90 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label="Close Spotify player"
      className="w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-200"
      style={{
        color,
        borderColor: isDark ? "rgba(0,245,255,0.3)" : "rgba(8,145,178,0.3)",
        background: isDark ? "rgba(0,245,255,0.07)" : "rgba(8,145,178,0.07)",
        boxShadow: `0 0 8px ${isDark ? "rgba(0,245,255,0.15)" : "rgba(8,145,178,0.15)"}`,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </motion.button>
  );
}

/* ─── Panel header ─────────────────────────────────────────────────────── */
function PanelHeader({ onClose, isDark }) {
  const cyan   = isDark ? "#00f5ff" : "#0891b2";
  const purple = isDark ? "#a855f7" : "#7c3aed";

  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-3">
      {/* Spotify wordmark + custom label */}
      <div className="flex items-center gap-2.5">
        {/* Spotify green circle logo */}
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "#1db954", boxShadow: "0 0 10px rgba(29,185,84,0.5)" }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </span>

        <div className="flex flex-col leading-tight">
          <span
            className="text-xs font-black tracking-widest uppercase"
            style={{
              background: `linear-gradient(90deg, ${cyan}, ${purple})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Now Playing
          </span>
          <span
            className="text-[10px] tracking-wider uppercase font-medium"
            style={{ color: isDark ? "rgba(0,245,255,0.5)" : "rgba(8,145,178,0.55)" }}
          >
            dimszyo · playlist
          </span>
        </div>
      </div>

      <CloseButton onClick={onClose} isDark={isDark} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main SpotifyWidget component
═══════════════════════════════════════════════════════════════════════════ */
export default function SpotifyWidget() {
  const { isOpen, toggle, close } = useSpotifyWidget();
  const { isDark } = useTheme();
  const panelRef = useRef(null);

  const cyan   = isDark ? "#00f5ff"            : "#0891b2";
  const purple = isDark ? "#a855f7"            : "#7c3aed";
  const pink   = isDark ? "#f472b6"            : "#db2777";

  /* Close on outside click */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        close();
      }
    };
    // slight delay so the toggle click itself doesn't immediately close
    const id = setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => { clearTimeout(id); document.removeEventListener("mousedown", handler); };
  }, [isOpen, close]);

  /* ── Panel motion variants ─────────────────────────────────────────── */
  // Panel is ALWAYS mounted so the iframe (and music) never gets destroyed.
  // We animate between "visible" and "hidden" states instead of mount/unmount.
  const panelVariants = {
    hidden: {
      opacity: 0,
      scale: 0.85,
      y: 20,
      transformOrigin: "bottom right",
      transitionEnd: { visibility: "hidden" }, // hide from a11y tree after fade-out
      transition: { duration: 0.22, ease: "easeIn" },
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      visibility: "visible",                   // restore before fade-in starts
      transformOrigin: "bottom right",
      transition: { type: "spring", stiffness: 320, damping: 28 },
    },
  };

  /* ── Floating button motion variants ──────────────────────────────── */
  const btnVariants = {
    rest:  { scale: 1 },
    hover: { scale: 1.1 },
    tap:   { scale: 0.92 },
  };

  return (
    <>
      {/* ── Keyframe injector ─────────────────────────────────────────── */}
      <style>{`
        @keyframes spotify-pulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(1.9); opacity: 0;   }
        }
        @keyframes spotify-bar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1);   }
        }
        @keyframes spotify-scan {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(400%);  }
        }
      `}</style>

      {/* ── Wrapper anchored to bottom-right ─────────────────────────── */}
      <div
        className="fixed bottom-24 md:bottom-10 right-5 md:right-8 flex flex-col items-end gap-4 pointer-events-none"
        style={{ zIndex: 40 }}
        ref={panelRef}
      >

        {/* ── Floating Panel ─────────────────────────────────────────── */}
        {/* Always mounted — iframe stays alive so music keeps playing     */}
        {/* when the panel is "closed" (just animated to hidden state).    */}
            <motion.div
              variants={panelVariants}
              initial="hidden"
              animate={isOpen ? "visible" : "hidden"}
              className="relative overflow-hidden rounded-2xl border pointer-events-auto"
              style={{
                width: "min(340px, calc(100vw - 48px))",
                pointerEvents: isOpen ? "auto" : "none",
                background: isDark
                  ? "rgba(5, 5, 16, 0.82)"
                  : "rgba(240, 244, 248, 0.88)",
                borderColor: isDark
                  ? "rgba(0,245,255,0.22)"
                  : "rgba(8,145,178,0.25)",
                boxShadow: isDark
                  ? `0 0 0 1px rgba(168,85,247,0.12),
                     0 8px 40px rgba(0,245,255,0.12),
                     0 24px 60px rgba(0,0,0,0.55)`
                  : `0 0 0 1px rgba(124,58,237,0.1),
                     0 8px 40px rgba(8,145,178,0.1),
                     0 24px 60px rgba(0,0,0,0.18)`,
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
              }}
            >
              {/* Scanline overlay for extra cyber feel */}
              <div
                className="absolute inset-0 pointer-events-none overflow-hidden"
                style={{ zIndex: 1, borderRadius: "inherit" }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: "30%",
                    background: isDark
                      ? "linear-gradient(transparent, rgba(0,245,255,0.025), transparent)"
                      : "linear-gradient(transparent, rgba(8,145,178,0.02), transparent)",
                    animation: "spotify-scan 4s linear infinite",
                  }}
                />
                {/* Corner accent dots */}
                {[
                  { top: 8,  left: 8  },
                  { top: 8,  right: 8 },
                ].map((pos, i) => (
                  <span
                    key={i}
                    style={{
                      position: "absolute",
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: i === 0 ? cyan : purple,
                      boxShadow: `0 0 6px ${i === 0 ? cyan : purple}`,
                      ...pos,
                    }}
                  />
                ))}
              </div>

              {/* Gradient top strip */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${cyan}, ${purple}, transparent)`,
                  opacity: 0.7,
                }}
              />

              {/* Header */}
              <div style={{ position: "relative", zIndex: 2 }}>
                <PanelHeader onClose={close} isDark={isDark} />
              </div>

              {/* Spotify iframe */}
              <div
                className="px-3 pb-3"
                style={{ position: "relative", zIndex: 2 }}
              >
                <div
                  className="overflow-hidden rounded-xl"
                  style={{
                    border: `1px solid ${isDark ? "rgba(0,245,255,0.12)" : "rgba(8,145,178,0.15)"}`,
                    boxShadow: `0 0 20px ${isDark ? "rgba(0,245,255,0.06)" : "rgba(8,145,178,0.06)"}`,
                  }}
                >
                  <iframe
                    style={{ borderRadius: "10px" }}
                    src={SPOTIFY_EMBED_URL}
                    width="100%"
                    height="352"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title="Spotify Playlist"
                  />
                </div>
              </div>

              {/* Bottom gradient strip */}
              <div
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${purple}, ${pink}, transparent)`,
                  opacity: 0.5,
                }}
              />
            </motion.div>

        {/* ── Floating trigger button ───────────────────────────────── */}
        <motion.button
          variants={btnVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          onClick={toggle}
          className="relative w-14 h-14 rounded-full flex items-center justify-center border-2 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 pointer-events-auto"
          style={{
            background: isDark
              ? "rgba(5,5,16,0.85)"
              : "rgba(240,244,248,0.9)",
            borderColor: isOpen
              ? (isDark ? purple : "#7c3aed")
              : (isDark ? cyan   : "#0891b2"),
            boxShadow: isOpen
              ? `0 0 20px ${isDark ? "rgba(168,85,247,0.5)" : "rgba(124,58,237,0.35)"},
                 0 0 40px ${isDark ? "rgba(168,85,247,0.2)" : "rgba(124,58,237,0.15)"}`
              : `0 0 20px ${isDark ? "rgba(0,245,255,0.4)"  : "rgba(8,145,178,0.3)"},
                 0 0 40px ${isDark ? "rgba(0,245,255,0.15)" : "rgba(8,145,178,0.12)"}`,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            transition: "border-color 0.35s ease, box-shadow 0.35s ease",
          }}
        >
          {/* Pulse rings — only when closed */}
          {!isOpen && (
            <>
              <PulseRing isDark={isDark} />
              <span
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  animation: "spotify-pulse 2.4s ease-out 1.2s infinite",
                  border: `2px solid ${isDark ? "#00f5ff" : "#0891b2"}`,
                  opacity: 0,
                }}
              />
            </>
          )}

          {/* Icon */}
          <MusicBarsIcon isDark={isDark} isOpen={isOpen} />

          {/* Inner gradient overlay */}
          <span
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: isOpen
                ? `radial-gradient(circle, ${isDark ? "rgba(168,85,247,0.12)" : "rgba(124,58,237,0.08)"} 0%, transparent 70%)`
                : `radial-gradient(circle, ${isDark ? "rgba(0,245,255,0.12)" : "rgba(8,145,178,0.08)"} 0%, transparent 70%)`,
            }}
          />
        </motion.button>
      </div>
    </>
  );
}