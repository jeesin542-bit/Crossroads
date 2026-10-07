import { AdviserResult } from "@/lib/schemas";
import { dedupeByOption } from "@/lib/scores";
import ScoreBar from "./ScoreBar";

const ROLE_STYLE: Record<
  string,
  { tagline: string; dot: string; label: string; chip: string; bar: string }
> = {
  realist: {
    tagline: "Feasibility, time, and resources",
    dot: "bg-amber-600",
    label: "text-amber-800",
    chip: "bg-amber-100 text-amber-900 border-amber-200",
    bar: "bg-amber-500",
  },
  strategist: {
    tagline: "Long-term consequences",
    dot: "bg-teal-600",
    label: "text-teal-800",
    chip: "bg-teal-100 text-teal-900 border-teal-200",
    bar: "bg-teal-500",
  },
  values: {
    tagline: "Priorities and alignment",
    dot: "bg-rose-600",
    label: "text-rose-800",
    chip: "bg-rose-100 text-rose-900 border-rose-200",
    bar: "bg-rose-500",
  },
  devils_advocate: {
    tagline: "Stress-tests your favorite option",
    dot: "bg-red-600",
    label: "text-red-800",
    chip: "bg-red-100 text-red-900 border-red-200",
    bar: "bg-red-500",
  },
};

const FALLBACK = {
  tagline: "AI perspective",
  dot: "bg-stone-500",
  label: "text-stone-700",
  chip: "bg-stone-100 text-stone-700 border-stone-200",
  bar: "bg-stone-400",
};

export default function AdviserCard({ adviser }: { adviser: AdviserResult }) {
  const style = ROLE_STYLE[adviser.role] ?? FALLBACK;

  if (adviser.status === "failed" || !adviser.output) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
          <div>
            <h3 className="font-bold text-amber-900">{adviser.label}</h3>
            <p className="text-xs text-amber-700">{style.tagline}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-amber-800">
          This adviser didn&apos;t respond in time, so it was excluded from scoring.
        </p>
        {adviser.error && <p className="mt-1 text-xs text-amber-700">{adviser.error}</p>}
      </div>
    );
  }

  const { output } = adviser;

  return (
    <article className="rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
        <div className="min-w-0">
          <h3 className={`font-bold ${style.label}`}>{adviser.label}</h3>
          <p className="text-xs text-ink-faint">{style.tagline}</p>
        </div>
      </div>

      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        <span className={`mr-2 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.chip}`}>
          Take
        </span>
        {output.summary}
      </p>

      <div className="mt-4 space-y-3.5">
        {dedupeByOption(output.scores).map((s, i) => (
          <div key={`${s.option}-${i}`}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium text-ink-soft">{s.option}</span>
              <span className="shrink-0 font-mono font-bold text-ink">{s.score}<span className="font-normal text-ink-faint">/100</span></span>
            </div>
            <ScoreBar value={s.score} barClassName={style.bar} heightClassName="h-2" />
            <p className="mt-1 text-xs leading-relaxed text-ink-faint">{s.reasoning}</p>
          </div>
        ))}
      </div>

      {output.keyConsiderations.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
            Key considerations
          </p>
          <ul className="space-y-1">
            {output.keyConsiderations.map((k, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-ink-soft">
                <span aria-hidden className="text-ink-faint">▸</span>
                <span>{k}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
