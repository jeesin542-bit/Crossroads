"use client";

import { useEffect } from "react";
import DecisionForm, { DecisionFormValues } from "./DecisionForm";

interface Props {
  initialValues: DecisionFormValues;
  onClose: () => void;
  onApply: (values: DecisionFormValues) => void;
}

/** Floating editor panel over the results page. The backdrop is translucent so
 *  the results stay visible around/behind the panel for reference while editing. */
export default function EditModal({ initialValues, onClose, onApply }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      {/* Translucent backdrop — click anywhere outside the panel to close */}
      <button
        aria-label="Close editor"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-stone-950/60"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit decision inputs"
        className="relative w-full max-w-2xl rounded-2xl border border-line bg-surface p-6 shadow-[0_24px_64px_-16px_rgba(28,25,23,0.35)] sm:p-8"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-h3 font-bold text-ink">Edit inputs</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Tweak anything — your results stay visible behind this panel for reference.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close editor"
            className="min-h-[44px] min-w-[44px] rounded-lg text-ink-faint hover:bg-stone-100 hover:text-ink"
          >
            ✕
          </button>
        </div>
        <DecisionForm
          initialValues={initialValues}
          onSubmit={onApply}
          onTryDemo={() => {}}
          hideDemoButton
          submitLabel="Apply & re-run"
        />
      </div>
    </div>
  );
}
