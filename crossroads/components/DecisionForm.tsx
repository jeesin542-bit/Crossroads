"use client";

import { FormEvent, useState } from "react";

export interface DecisionFormValues {
  question: string;
  options: string[];
  context: string;
}

interface Props {
  onSubmit: (values: DecisionFormValues) => void;
  disabled?: boolean;
  onTryDemo: () => void;
  initialValues?: DecisionFormValues;
  submitLabel?: string;
  hideDemoButton?: boolean;
}

const EMPTY_VALUES: DecisionFormValues = { question: "", options: ["", ""], context: "" };

const FIELD =
  "w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

export default function DecisionForm({ onSubmit, disabled, onTryDemo, initialValues, submitLabel, hideDemoButton }: Props) {
  const seed = initialValues ?? EMPTY_VALUES;
  const [question, setQuestion] = useState(seed.question);
  const [options, setOptions] = useState<string[]>(
    seed.options.length >= 2 ? seed.options : ["", ""]
  );
  const [context, setContext] = useState(seed.context);
  const [error, setError] = useState<string | null>(null);

  function updateOption(i: number, value: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }

  function addOption() {
    if (options.length >= 5) return;
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(i: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedQuestion = question.trim();
    const trimmedOptions = options.map((o) => o.trim()).filter(Boolean);

    if (trimmedQuestion.length < 3) {
      setError("Please describe the decision you're trying to make.");
      return;
    }
    if (trimmedOptions.length < 2) {
      setError("Please provide at least 2 options.");
      return;
    }

    onSubmit({ question: trimmedQuestion, options: trimmedOptions, context: context.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="question" className="mb-1.5 block text-sm font-semibold text-ink">
          What decision are you trying to make?
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Should I take the internship or stay for the summer program?"
          rows={2}
          className={FIELD}
          disabled={disabled}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink">
          Options you&apos;re weighing (2–5)
        </label>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                aria-label={`Option ${i + 1}`}
                className={FIELD}
                disabled={disabled}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  disabled={disabled}
                  className="min-h-[44px] min-w-[44px] shrink-0 rounded-lg text-ink-faint hover:bg-stone-100 hover:text-red-700 disabled:opacity-40"
                  aria-label={`Remove option ${i + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {options.length < 5 && (
          <button
            type="button"
            onClick={addOption}
            disabled={disabled}
            className="mt-2 min-h-[44px] text-sm font-semibold text-accent hover:text-accent-deep disabled:opacity-40"
          >
            + Add another option
          </button>
        )}
      </div>

      <div>
        <label htmlFor="context" className="mb-1.5 block text-sm font-semibold text-ink">
          Any context that matters? <span className="font-normal text-ink-faint">(optional — but the more specific, the sharper the debate)</span>
        </label>
        <textarea
          id="context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Deadlines, what's at stake, what you've already tried, what can't be undone…"
          rows={3}
          className={FIELD}
          disabled={disabled}
        />
      </div>

      {error && <p className="text-sm font-medium text-red-700">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={disabled}
          className="min-h-[44px] rounded-lg bg-accent px-6 py-2.5 font-semibold text-white hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitLabel ?? "Get perspectives"}
        </button>
        {!hideDemoButton && (
          <button
            type="button"
            onClick={onTryDemo}
            disabled={disabled}
            className="min-h-[44px] rounded-lg border border-line bg-surface px-6 py-2.5 font-semibold text-ink hover:border-stone-400 hover:bg-stone-100 disabled:opacity-50"
          >
            Try the demo example
          </button>
        )}
      </div>
    </form>
  );
}
