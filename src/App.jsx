import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import About from "./sections/About";
import Skills from "./sections/Skills";
import Portfolio from "./sections/Portfolio";
import Contact from "./sections/Contact";
import Certificates from "./sections/Certificates";
import CustomCursor from "./components/CustomCursor";

export default function App() {
  return (
    <div className="min-h-screen relative" style={{ background: "#050510" }}>
      {/* Background grid effect */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
      {/* Glow orbs */}
      <div
        className="fixed top-20 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(0,245,255,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div className="hidden md:block">
          <CustomCursor />
        </div>

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
  );
}