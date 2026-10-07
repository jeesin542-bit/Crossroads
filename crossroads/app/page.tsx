"use client";

import { useEffect, useRef, useState } from "react";
import DecisionForm, { DecisionFormValues } from "@/components/DecisionForm";
import LoadingStages from "@/components/LoadingStages";
import AdviserCard from "@/components/AdviserCard";
import ReviewerNotes from "@/components/ReviewerNotes";
import ScoreBars from "@/components/ScoreBars";
import RecommendationCard from "@/components/RecommendationCard";
import SavedList from "@/components/SavedList";
import EditModal from "@/components/EditModal";
import { DecideResponse } from "@/lib/schemas";
import { DEMO_INPUT, DEMO_RESPONSE } from "@/lib/demo";
import { DEMO_MODE } from "@/lib/config";
import { PIPELINE_STAGES } from "@/lib/pipeline-stages";
import {
  SavedDeliberation,
  loadSaved,
  saveDeliberation,
  deleteDeliberation,
} from "@/lib/saved";
import {
  buildMarkdown,
  copyToClipboard,
  downloadMarkdown,
  exportFilename,
} from "@/lib/export";

type ViewState = "form" | "loading" | "result" | "error";

const EMPTY_FORM: DecisionFormValues = { question: "", options: ["", ""], context: "" };

function toFormValues(input: { question: string; options: string[]; context?: string }): DecisionFormValues {
  return {
    question: input.question,
    options: input.options.length >= 2 ? [...input.options] : ["", ""],
    context: input.context ?? "",
  };
}

const TOOLBAR_BTN =
  "no-print inline-flex min-h-[44px] items-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:border-stone-400 hover:bg-stone-100";

export default function Home() {
  const [view, setView] = useState<ViewState>("form");
  const [stageIndex, setStageIndex] = useState(0);
  const [result, setResult] = useState<DecideResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [formValues, setFormValues] = useState<DecisionFormValues>(EMPTY_FORM);
  const [saved, setSaved] = useState<SavedDeliberation[]>([]);
  const [savedCurrentId, setSavedCurrentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load client-only saved deliberations after mount to avoid a hydration mismatch
  // (localStorage doesn't exist during server rendering).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(loadSaved());
  }, []);

  // Close the mobile sidebar drawer with Escape.
  useEffect(() => {
    if (!sidebarOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  function startStageAnimation() {
    setStageIndex(0);
    let i = 0;
    stageTimer.current = setInterval(() => {
      i += 1;
      if (i >= PIPELINE_STAGES.length - 1) {
        // hold on the last stage until real data arrives
        setStageIndex(PIPELINE_STAGES.length - 1);
        if (stageTimer.current) clearInterval(stageTimer.current);
      } else {
        setStageIndex(i);
      }
    }, 1400);
  }

  function stopStageAnimation() {
    if (stageTimer.current) {
      clearInterval(stageTimer.current);
      stageTimer.current = null;
    }
  }

  async function runDecision(values: DecisionFormValues) {
    setFormValues(values);
    setSavedCurrentId(null);
    setView("loading");
    startStageAnimation();

    try {
      const res = await fetch("/api/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Something went wrong while running the panel.");
      }

      stopStageAnimation();
      setResult(data as DecideResponse);
      setView("result");
    } catch (err) {
      stopStageAnimation();
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setView("error");
    }
  }

  async function runDemo() {
    setFormValues(toFormValues(DEMO_INPUT));
    setSavedCurrentId(null);
    setView("loading");
    startStageAnimation();
    // Simulate pipeline timing with zero API calls.
    await new Promise((r) => setTimeout(r, PIPELINE_STAGES.length * 1400 + 400));
    stopStageAnimation();
    setResult(DEMO_RESPONSE);
    setView("result");
  }

  /** Back button: return to the form with every input preserved. */
  function backToEdit() {
    stopStageAnimation();
    if (result) {
      setFormValues(toFormValues(result.input));
    }
    setErrorMsg("");
    setView("form");
  }

  function newDecision() {
    stopStageAnimation();
    setResult(null);
    setErrorMsg("");
    setFormValues(EMPTY_FORM);
    setSavedCurrentId(null);
    setView("form");
  }

  function handleSave() {
    if (!result || savedCurrentId) return;
    const entry = saveDeliberation(result.input, result);
    setSavedCurrentId(entry.id);
    setSaved(loadSaved());
  }

  function handleLoadSaved(entry: SavedDeliberation) {
    stopStageAnimation();
    setResult(entry.result);
    setFormValues(toFormValues(entry.input));
    setSavedCurrentId(entry.id);
    setErrorMsg("");
    setSidebarOpen(false);
    setView("result");
  }

  function handleDeleteSaved(id: string) {
    setSaved(deleteDeliberation(id));
    if (savedCurrentId === id) setSavedCurrentId(null);
  }

  async function handleCopy() {
    if (!result) return;
    setCopyFailed(false);
    const ok = await copyToClipboard(buildMarkdown(result));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 3000);
    }
  }

  function handleDownload() {
    if (!result) return;
    downloadMarkdown(exportFilename(), buildMarkdown(result));
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="no-print border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-expanded={sidebarOpen}
            aria-controls="past-decisions-sidebar"
            aria-label="Open past decisions menu"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink hover:bg-stone-100 lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <line x1="3" y1="6" x2="17" y2="6" />
              <line x1="3" y1="10" x2="17" y2="10" />
              <line x1="3" y1="14" x2="17" y2="14" />
            </svg>
          </button>
          <div className="min-w-0">
            <p className="text-lg font-bold tracking-tight">Crossroads</p>
            <p className="truncate text-sm text-ink-soft">
              Four advisers, two anonymous reviewers, one clear answer.
            </p>
          </div>
          {DEMO_MODE && (
            <span className="ml-auto rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
              DEMO MODE
            </span>
          )}
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl items-start gap-8 px-4 py-8 sm:px-6">
        {/* Scrim for the mobile drawer */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close past decisions menu"
            onClick={() => setSidebarOpen(false)}
            className="no-print fixed inset-0 z-30 cursor-default bg-stone-950/50 lg:hidden"
          />
        )}

        <aside
          id="past-decisions-sidebar"
          aria-label="Past decisions"
          className={
            "no-print fixed inset-y-0 left-0 z-40 w-80 max-w-[85vw] overflow-y-auto border-r border-line bg-paper p-5 transition-transform duration-300 motion-safe:transition-transform " +
            (sidebarOpen ? "translate-x-0" : "-translate-x-full") +
            " lg:static lg:z-auto lg:w-72 lg:shrink-0 lg:translate-x-0 lg:border-r-0 lg:bg-transparent lg:p-0"
          }
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
              Past decisions
            </h2>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close past decisions menu"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink-faint hover:bg-stone-200/60 hover:text-ink lg:hidden"
            >
              ✕
            </button>
          </div>
          <SavedList saved={saved} onLoad={handleLoadSaved} onDelete={handleDeleteSaved} />
        </aside>

        <main className="min-w-0 flex-1">
          {view === "form" && (
            <div className="space-y-8">
              <div className="max-w-[66ch]">
                <h1 className="text-title font-bold leading-[1.15] tracking-tight sm:text-display">
                  A committee for your hardest decisions.
                </h1>
                <p className="mt-3 text-lg leading-relaxed text-ink-soft">
                  Type a decision and your options. Four AI advisers argue it out, two
                  anonymous reviewers grade the arguments, and clear scores show the
                  winner. Made for anyone choosing between good options — students,
                  founders, teams.
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(28,25,23,0.05)] sm:p-8">
                {DEMO_MODE && (
                  <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    This deployment is running in demo mode — every submission returns the canned example below with no
                    API calls.
                  </p>
                )}
                <DecisionForm
                  onSubmit={(values) => (DEMO_MODE ? runDemo() : runDecision(values))}
                  onTryDemo={runDemo}
                  initialValues={formValues}
                />
                <p className="mt-6 max-w-[66ch] text-sm text-ink-faint">
                  Example: &ldquo;{DEMO_INPUT.question}&rdquo; — try the demo button to see a full walkthrough instantly.
                </p>
              </div>
            </div>
          )}

          {view === "loading" && <LoadingStages activeIndex={stageIndex} />}

          {view === "error" && (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-6 sm:p-8">
              <h2 className="text-h3 font-bold text-red-900">Something went wrong</h2>
              <p className="mt-2 max-w-[66ch] text-sm leading-relaxed text-red-800">{errorMsg}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={backToEdit} className={TOOLBAR_BTN}>
                  ← Back to edit
                </button>
                <button onClick={newDecision} className={TOOLBAR_BTN}>
                  Start over
                </button>
              </div>
            </div>
          )}

          {view === "result" && result && (
            <div className="space-y-8">
              <div className="max-w-[66ch]">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-faint">Decision</p>
                <h1 className="mt-1 text-title font-bold leading-[1.15] tracking-tight text-ink">
                  {result.input.question}
                </h1>
              </div>

              {/* Results toolbar — hidden in print */}
              <div className="-mt-4 flex flex-wrap gap-2">
                <button onClick={backToEdit} className={TOOLBAR_BTN} title="Go back and edit your inputs">
                  ← Back to edit
                </button>
                <button
                  onClick={() => setEditOpen(true)}
                  className={TOOLBAR_BTN}
                  title="Edit inputs in a floating panel over the results"
                >
                  Edit
                </button>
                <button
                  onClick={handleSave}
                  disabled={savedCurrentId !== null}
                  className={TOOLBAR_BTN + " disabled:cursor-default disabled:opacity-50"}
                  title="Save this deliberation in your browser"
                >
                  {savedCurrentId ? "Saved ✓" : "Save"}
                </button>
                <button onClick={handleCopy} className={TOOLBAR_BTN} title="Copy as Markdown">
                  {copied ? "Copied ✓" : "Copy"}
                </button>
                <button onClick={handleDownload} className={TOOLBAR_BTN} title="Download as a .md file">
                  Download .md
                </button>
                <button onClick={handlePrint} className={TOOLBAR_BTN} title="Print or save as PDF">
                  Print / PDF
                </button>
                <button onClick={newDecision} className={TOOLBAR_BTN + " ml-auto"} title="Clear and start a new decision">
                  New decision
                </button>
              </div>
              {copyFailed && (
                <p className="no-print -mt-6 text-xs font-medium text-amber-800">
                  Copy didn&apos;t work in this browser — try the .md download instead.
                </p>
              )}
              {editOpen && (
                <EditModal
                  initialValues={toFormValues(result.input)}
                  onClose={() => setEditOpen(false)}
                  onApply={(values) => {
                    setEditOpen(false);
                    if (DEMO_MODE) runDemo();
                    else runDecision(values);
                  }}
                />
              )}

              <RecommendationCard synthesis={result.synthesis} />

              <ScoreBars scores={result.scores} />

              <section aria-label="Adviser perspectives">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-ink-soft">
                  Adviser perspectives
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {result.advisers.map((a) => (
                    <AdviserCard key={a.role} adviser={a} />
                  ))}
                </div>
              </section>

              <section aria-label="Anonymous peer review">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-ink-soft">
                  Anonymous peer review
                </h2>
                <ReviewerNotes reviewers={result.reviewers} />
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
