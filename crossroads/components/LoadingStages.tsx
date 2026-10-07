"use client";

import { PIPELINE_STAGES } from "@/lib/pipeline-stages";

interface Props {
  activeIndex: number; // index into PIPELINE_STAGES that's currently running
}

export default function LoadingStages({ activeIndex }: Props) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <h2 className="mb-5 text-h3 font-bold text-ink">Running the panel…</h2>
      <ol className="space-y-5">
        {PIPELINE_STAGES.map((stage, i) => {
          const state = i < activeIndex ? "done" : i === activeIndex ? "active" : "pending";
          return (
            <li key={stage.id} className="flex items-start gap-3.5">
              <span
                aria-hidden
                className={
                  "mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                  (state === "done"
                    ? "bg-green-700 text-white"
                    : state === "active"
                      ? "bg-accent text-white motion-safe:animate-pulse"
                      : "bg-stone-200 text-ink-faint")
                }
              >
                {state === "done" ? "✓" : i + 1}
              </span>
              <div>
                <p
                  className={
                    "font-semibold " +
                    (state === "pending" ? "text-ink-faint" : "text-ink")
                  }
                >
                  {stage.label}
                </p>
                <p className="mt-0.5 max-w-[66ch] text-sm leading-relaxed text-ink-faint">{stage.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
