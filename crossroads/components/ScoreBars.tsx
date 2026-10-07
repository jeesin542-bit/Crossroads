import { OptionFinalScore } from "@/lib/schemas";
import { dedupeByOption } from "@/lib/scores";
import ScoreBar from "./ScoreBar";

const RANK_BADGE = ["bg-accent text-white", "bg-stone-200 text-stone-700", "bg-stone-200 text-stone-700"];

export default function ScoreBars({ scores }: { scores: OptionFinalScore[] }) {
  const sorted = dedupeByOption(scores).sort((a, b) => b.adjustedScore - a.adjustedScore);
  const top = sorted[0]?.adjustedScore ?? 0;

  return (
    <section aria-label="Final scores" className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="mb-1 flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-h3 font-bold text-ink">Final scores</h3>
      </div>
      <p className="mb-5 max-w-[66ch] text-sm text-ink-faint">
        Average of adviser scores, adjusted by anonymous peer-review quality ratings.
      </p>
      <div className="space-y-5">
        {sorted.map((s, rank) => {
          const isTop = s.adjustedScore === top && top > 0;
          return (
            <div key={`${s.option}-${rank}`}>
              <div className="mb-1.5 flex items-center gap-2.5">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                    RANK_BADGE[rank] ?? "bg-stone-200 text-stone-700"
                  }`}
                >
                  {rank + 1}
                </span>
                <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${isTop ? "text-ink" : "text-ink-soft"}`}>
                  {s.option}
                </span>
                <span className={`shrink-0 font-mono text-sm font-bold ${isTop ? "text-accent-deep" : "text-ink-faint"}`}>
                  {s.adjustedScore.toFixed(1)}
                </span>
              </div>
              <div className="ml-[34px]">
                <ScoreBar
                  value={s.adjustedScore}
                  barClassName={isTop ? "bg-accent" : "bg-stone-400"}
                  heightClassName="h-2.5"
                />
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-ink-faint">
                  <span>raw avg {s.averageScore.toFixed(1)}</span>
                  {Object.entries(s.perAdviser).map(([label, score]) => (
                    <span key={label}>
                      {label}: <span className="font-mono">{score}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
