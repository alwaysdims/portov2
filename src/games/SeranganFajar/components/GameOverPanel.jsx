import { useState, useCallback, useId } from "react";
import {
  HiTrophy,
  HiClock,
  HiArrowPath,
  HiArrowLeft,
  HiUser,
  HiCheck,
  HiSparkles,
} from "react-icons/hi2";
import { FaCoins, FaMedal } from "react-icons/fa6";
import {
  readHighScore,
  readLeaderboard,
  saveLeaderboardEntry,
  validatePlayerName,
  DEFAULT_PLAYER_NAME,
} from "../services/LeaderboardService.js";

/**
 * GameOverPanel — Modal rekapitulasi hasil pemilu dan Leaderboard Top 10
 */
export function GameOverPanel({ summary, onRestart, onBack }) {
  const [playerName, setPlayerName] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState(readLeaderboard);
  const [highScore, setHighScore] = useState(readHighScore);
  const [inputError, setInputError] = useState("");
  const inputId = useId();

  const finalScore = Math.floor(Number(summary?.score) || 0);
  const isNewRecord = finalScore > 0 && finalScore >= highScore;

  const handleSubmit = useCallback(
    (e) => {
      e?.preventDefault?.();
      if (hasSubmitted) return;

      const validation = validatePlayerName(playerName || DEFAULT_PLAYER_NAME);
      if (!validation.valid && playerName.trim().length > 0) {
        setInputError(validation.error || "Nama tidak valid");
        return;
      }
      setInputError("");

      const result = saveLeaderboardEntry({
        playerName: validation.sanitized,
        score: finalScore,
        survivalTime: summary?.survivalTime ?? 0,
        formattedTime: summary?.formattedTime ?? "00:00",
        level: summary?.level ?? 1,
        enemiesKilled: summary?.enemiesKilled ?? 0,
        votesCollected: summary?.votesCollected ?? 0,
        fundsCollected: summary?.fundsCollected ?? 0,
        attacksFired: summary?.attacksFired ?? 0,
      });

      setHasSubmitted(true);
      setSubmitResult(result);
      setLeaderboard(result.entries);
      setHighScore(readHighScore());
    },
    [finalScore, hasSubmitted, playerName, summary]
  );

  return (
    <div
      className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="relative w-full max-w-xl my-auto rounded-2xl border-2 border-rose-500/60 bg-slate-900/95 shadow-2xl shadow-rose-950/50 p-4 sm:p-6 text-slate-100 flex flex-col gap-4">
        {/* Header Title */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] sm:text-xs font-black tracking-widest uppercase">
            <span>HASIL REKAPITULASI RESMI</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-wide text-rose-500 mt-1 mb-0.5">
            WOWO TERELIMINASI
          </h2>
          <p className="text-xs text-slate-400">
            Perjuangan mempertahankan TPS terhenti. Berikut rekap hasil audit pemilu Anda:
          </p>
        </div>

        {/* Highlight Score & High Score Cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-slate-950/80 border border-amber-500/40 shadow-inner">
            <span className="text-[10px] sm:text-xs font-bold text-amber-400 flex items-center gap-1">
              <HiSparkles className="w-3.5 h-3.5" />
              <span>SKOR AKHIR</span>
            </span>
            <span className="font-mono text-xl sm:text-2xl md:text-3xl font-black text-amber-300">
              {finalScore.toLocaleString("id-ID")}
            </span>
            {isNewRecord && (
              <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.2 rounded-md animate-pulse mt-0.5">
                REKOR BARU!
              </span>
            )}
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 shadow-inner">
            <span className="text-[10px] sm:text-xs font-bold text-cyan-400 flex items-center gap-1">
              <HiTrophy className="w-3.5 h-3.5" />
              <span>REKOR TERTINGGI</span>
            </span>
            <span className="font-mono text-xl sm:text-2xl md:text-3xl font-black text-cyan-300">
              {highScore.toLocaleString("id-ID")}
            </span>
            <span className="text-[9px] font-mono text-slate-400 mt-0.5">
              LEADERBOARD LOKAL
            </span>
          </div>
        </div>

        {/* Detailed Match Statistics */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-bold flex items-center justify-center gap-1">
              <HiClock className="w-3 h-3 text-cyan-400" />
              <span>WAKTU</span>
            </span>
            <span className="font-mono text-xs sm:text-sm font-black text-cyan-300">
              {summary?.formattedTime ?? "00:00"}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-bold">LEVEL</span>
            <span className="font-mono text-xs sm:text-sm font-black text-amber-300">
              {summary?.level ?? 1}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-bold">KILLS</span>
            <span className="font-mono text-xs sm:text-sm font-black text-rose-400">
              {summary?.enemiesKilled ?? 0}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-bold">SUARA (XP)</span>
            <span className="font-mono text-xs sm:text-sm font-black text-emerald-400">
              {summary?.votesCollected ?? 0}
            </span>
          </div>

          <div className="flex flex-col col-span-3 sm:col-span-1">
            <span className="text-[9px] text-slate-400 font-bold">DANA</span>
            <span className="font-mono text-xs sm:text-sm font-black text-yellow-400 flex items-center justify-center gap-1">
              <FaCoins className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <span>{summary?.fundsCollected ?? 0}</span>
            </span>
          </div>
        </div>

        {/* Leaderboard Submission Form */}
        {!hasSubmitted ? (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-700/80"
          >
            <div className="flex items-center justify-between">
              <label htmlFor={inputId} className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <HiUser className="w-4 h-4 text-amber-400" />
                <span>Simpan Skor ke Top 10:</span>
              </label>
              <span className="text-[10px] text-slate-400">Maks. 12 Karakter</span>
            </div>

            <div className="flex gap-2">
              <input
                id={inputId}
                type="text"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setInputError("");
                }}
                onKeyDown={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
                maxLength={12}
                placeholder="NAMA / INISIAL (Cth: WOWO)"
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-xs sm:text-sm font-bold tracking-wide focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-md shadow-amber-500/20"
              >
                SIMPAN
              </button>
            </div>
            {inputError && (
              <span className="text-[11px] text-rose-400 font-semibold">{inputError}</span>
            )}
          </form>
        ) : (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <HiCheck className="w-4 h-4 text-emerald-400" />
              <span>Skor tersimpan sebagai {submitResult?.entry?.playerName}!</span>
            </span>
            {submitResult?.isTop10 ? (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400 text-amber-300 font-extrabold text-[11px] flex items-center gap-1">
                <HiTrophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>PERINGKAT #{submitResult?.rank} DI TOP 10!</span>
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">
                Belum menembus Top 10
              </span>
            )}
          </div>
        )}

        {/* Leaderboard Top 10 Table */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
            <span className="flex items-center gap-1 text-amber-400">
              <HiTrophy className="w-3.5 h-3.5" />
              <span>LEADERBOARD TOP 10</span>
            </span>
            <span className="text-[10px]">Browser LocalStorage</span>
          </div>

          <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/90 divide-y divide-slate-800/80">
            {leaderboard.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                Belum ada rekor pemilu tersimpan.
              </div>
            ) : (
              leaderboard.map((item, index) => {
                const isCurrentRun = submitResult?.entry?.id === item.id;
                const rankNum = index + 1;
                return (
                  <div
                    key={item.id || index}
                    className={`flex items-center justify-between px-3 py-1.5 text-xs transition-colors ${
                      isCurrentRun
                        ? "bg-amber-500/15 border-l-4 border-amber-400 text-amber-200 font-bold"
                        : index === 0
                        ? "text-yellow-300"
                        : index === 1
                        ? "text-slate-300"
                        : index === 2
                        ? "text-amber-500"
                        : "text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black w-5 flex items-center justify-center text-[11px]">
                        {rankNum === 1 ? (
                          <FaMedal className="w-3.5 h-3.5 text-amber-300" title="Juara 1" />
                        ) : rankNum === 2 ? (
                          <FaMedal className="w-3.5 h-3.5 text-slate-300" title="Juara 2" />
                        ) : rankNum === 3 ? (
                          <FaMedal className="w-3.5 h-3.5 text-amber-600" title="Juara 3" />
                        ) : (
                          `#${rankNum}`
                        )}
                      </span>
                      <span className="font-bold tracking-wide truncate max-w-[120px] sm:max-w-[160px]">
                        {item.playerName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-[10px] text-slate-400 hidden sm:flex items-center gap-1">
                        <HiClock className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>{item.formattedTime}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        Lv.{item.level}
                      </span>
                      <span className="font-black text-amber-400 text-xs sm:text-sm">
                        {item.score?.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={onRestart}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm tracking-wide transition-all active:scale-95 cursor-pointer shadow-lg shadow-amber-500/25"
          >
            <HiArrowPath className="w-4 h-4 stroke-[3]" />
            <span>MAIN LAGI (R)</span>
          </button>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              <HiArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
