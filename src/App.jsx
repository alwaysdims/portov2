import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import About from "./sections/About";
import Skills from "./sections/Skills";
import Portfolio from "./sections/Portfolio";
import Contact from "./sections/Contact";
import Certificates from "./sections/Certificates";
import CustomCursor from "./components/CustomCursor";
import SpotifyWidget from "./components/SpotifyWidget";
import GameContainer from "./games/GameContainer";
import GameGates from "./games/GameGates";
import WowoJump from "./games/WowoJump/WowoJump";

import { useTheme } from "./hooks/useTheme";

export default function App() {
  const { isDark } = useTheme();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
      setCurrentHash(window.location.hash);
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("hashchange", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, []);

  const gamePath = currentPath.startsWith("/games")
    ? currentPath
    : currentHash.startsWith("/games")
      ? currentHash
      : "";
  const isGameRoute = Boolean(gamePath) || currentPath === "/game" || currentHash === "/game";
  const gamePage =
    gamePath === "/games/wowo-jump"
      ? <WowoJump />
      : gamePath === "/games"
        ? <GameGates />
        : <GameContainer />;

  return (
    <div
      className="min-h-screen relative theme-transition overflow-x-hidden"
      style={{ background: isDark ? "#050510" : "#f0f4f8" }}
    >
      {/* Background grid effect */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(${isDark ? "rgba(0,245,255,0.03)" : "rgba(0,180,200,0.04)"} 1px, transparent 1px),
            linear-gradient(90deg, ${isDark ? "rgba(0,245,255,0.03)" : "rgba(0,180,200,0.04)"} 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow orbs */}
      <div
        className="fixed top-20 left-1/4 w-96 h-96 rounded-full pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle, ${
            isDark
              ? "rgba(0,245,255,0.06)"
              : "rgba(0,180,200,0.06)"
          } 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />

      <div
        className="fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle, ${
            isDark
              ? "rgba(168,85,247,0.08)"
              : "rgba(124,58,237,0.05)"
          } 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />

      {/* Custom Cursor */}
      <div className="hidden md:block">
        <CustomCursor />
      </div>

      {isGameRoute ? (
        gamePage
      ) : (
        /* Main Content */
        <div className="relative z-10">
          <Navbar />

          <main>
            <About />
            <Skills />
            <Portfolio />
            <Certificates />
            <Contact />
          </main>

          <Footer />
        </div>
      )}

      {/* Floating Spotify Widget */}
      {!isGameRoute && <SpotifyWidget />}
    </div>
  );
}
