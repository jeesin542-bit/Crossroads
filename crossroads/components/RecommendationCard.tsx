import { SynthesisOutput } from "@/lib/schemas";

const CONFIDENCE_STYLE: Record<string, string> = {
  low: "bg-amber-100 text-amber-900 border-amber-300",
  medium: "bg-stone-200 text-stone-800 border-stone-300",
  high: "bg-green-100 text-green-900 border-green-300",
};

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-paper p-4">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <p className="text-sm leading-relaxed text-ink-soft">{value}</p>
    </div>
  );
}

export default function RecommendationCard({ synthesis }: { synthesis: SynthesisOutput }) {
  return (
    <div className="[perspective:1400px]">
      <section
        aria-label="Panel recommendation"
        className="rounded-2xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(28,25,23,0.06),0_16px_40px_-16px_rgba(28,25,23,0.22)] transition-transform duration-300 motion-safe:hover:[transform:rotateX(1.2deg)_rotateY(-0.8deg)] sm:p-8"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Panel recommendation
            </p>
            <h2 className="mt-2 max-w-[24ch] text-title font-bold leading-[1.15] tracking-tight text-ink sm:text-display">
              {synthesis.recommendation}
            </h2>
          </div>
          <span
            className={
              "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-wide " +
              (CONFIDENCE_STYLE[synthesis.confidence] ?? CONFIDENCE_STYLE.medium)
            }
          >
            {synthesis.confidence.toUpperCase()} CONFIDENCE
          </span>
        </div>

        <p className="mt-4 max-w-[66ch] text-[17px] leading-relaxed text-ink-soft">{synthesis.why}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <InfoTile label="Biggest tradeoff" value={synthesis.biggestTradeoff} />
          <InfoTile label="Biggest risk" value={synthesis.biggestRisk} />
          <InfoTile label="What could change it" value={synthesis.whatCouldChangeIt} />
        </div>
      </section>
    </div>
  );
}
