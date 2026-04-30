

export default function Footer() {
    return (
      <footer className="py-8 text-center border-t border-cyan-500/10">
        <p
          className="text-gray-500 text-sm tracking-widest font-mono"
          style={{ textShadow: "0 0 10px rgba(0,245,255,0.3)" }}
        >
          © <span className="text-cyan-400">dimsWebDev</span> · Built with React & ☕
        </p>
      </footer>
    );
  }