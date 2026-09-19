import { useTheme } from "../hooks/useTheme";

const games = [
  { name: "WowoJump", path: "/games/wowo-jump", available: true },
  { name: "Game 2", available: false },
  { name: "Game 3", available: false },
  { name: "Game 4", available: false },
];

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function GameGates() {
  const { isDark } = useTheme();

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: isDark ? "#050510" : "#f0f4f8" }}
    >
      <section className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-3xl font-bold" style={{ color: isDark ? "#fff" : "#0f172a" }}>
          Pilih Game
        </h1>
        <div className="grid gap-3">
          {games.map((game) => (
            <button
              key={game.name}
              type="button"
              disabled={!game.available}
              onClick={() => game.available && navigate(game.path)}
              className="rounded-xl border px-5 py-4 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderColor: isDark ? "#22d3ee" : "#0891b2",
                color: isDark ? "#cffafe" : "#164e63",
              }}
            >
              {game.name}{!game.available && " — Segera hadir"}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
