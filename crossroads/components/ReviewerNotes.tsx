import { ReviewerResult } from "@/lib/schemas";

const FOCUS_LABEL: Record<string, string> = {
  argument_quality: "Argument Quality Reviewer",
  blind_spots: "Blind Spot Reviewer",
};

export default function ReviewerNotes({ reviewers }: { reviewers: ReviewerResult[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {reviewers.map((r) => {
        const label = FOCUS_LABEL[r.focus] ?? r.focus;
        return (
          <article key={r.focus} className="rounded-xl border border-line bg-surface p-5">
            <div className="mb-3">
              <h3 className="font-bold text-ink">{label}</h3>
              <span className="mt-1 inline-block rounded-full border border-stone-300 bg-stone-100 px-2 py-px text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                anonymous
              </span>
            </div>

            {r.status === "failed" || !r.output ? (
              <p className="text-sm text-amber-800">This reviewer didn&apos;t respond in time.</p>
            ) : (
              <div className="space-y-4">
                {r.output.blindSpots.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                      Blind spots
                    </p>
                    <ul className="space-y-1.5">
                      {r.output.blindSpots.map((b, i) => (
                        <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink-soft">
                          <span aria-hidden className="font-bold text-accent">!</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {r.output.argumentQualityNotes.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                      Notes on adviser arguments
                    </p>
                    <ul className="space-y-2">
                      {r.output.argumentQualityNotes.map((n, i) => (
                        <li
                          key={i}
                          className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink-soft"
                        >
                          <span className="font-semibold text-ink">{n.targetPerspective}</span>{" "}
                          <span
                            className={
                              "ml-1 rounded px-1.5 py-0.5 font-mono text-xs font-bold " +
                              (n.qualityAdjustment > 0
                                ? "bg-green-100 text-green-900"
                                : n.qualityAdjustment < 0
                                  ? "bg-red-100 text-red-900"
                                  : "bg-stone-200 text-stone-600")
                            }
                          >
                            {n.qualityAdjustment > 0 ? "+" : ""}
                            {n.qualityAdjustment}
                          </span>
                          <p className="mt-1 leading-relaxed">{n.note}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
