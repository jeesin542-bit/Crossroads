"use client";

import { SavedDeliberation } from "@/lib/saved";

interface Props {
  saved: SavedDeliberation[];
  onLoad: (entry: SavedDeliberation) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Renders inside the persistent sidebar. Always renders — shows an empty
 *  state when nothing is saved yet. */
export default function SavedList({ saved, onLoad, onDelete }: Props) {
  if (saved.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line px-3.5 py-4 text-sm leading-relaxed text-ink-faint">
        Nothing saved yet. Run a decision, then hit <span className="font-semibold text-ink-soft">Save</span> on
        the results — it will land here for later.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {saved.map((s) => (
        <li
          key={s.id}
          className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{s.input.question}</p>
            <p className="text-xs text-ink-faint">
              {formatDate(s.savedAt)} · {s.input.options.length} options
            </p>
          </div>
          <button
            type="button"
            onClick={() => onLoad(s)}
            className="min-h-[44px] shrink-0 rounded-lg border border-accent px-3 text-xs font-semibold text-accent hover:bg-accent-soft"
          >
            Load
          </button>
          <button
            type="button"
            onClick={() => onDelete(s.id)}
            className="min-h-[44px] min-w-[44px] shrink-0 rounded-lg text-xs text-ink-faint hover:bg-stone-100 hover:text-red-700"
            aria-label={`Delete saved deliberation: ${s.input.question}`}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
