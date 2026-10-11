"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, AudioLines, Check, Clock3, Leaf, RotateCcw, Sparkles } from "lucide-react";
import { ReflectionRecorder } from "./ReflectionRecorder";
import type { Place, Visit } from "@/lib/types";

function readableDate(date: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

function errorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : "Something interrupted this step. Please retry.";
}

export function PlaceExperience({ initialPlace }: { initialPlace: Place }) {
  const [place, setPlace] = useState(initialPlace);
  const [duration, setDuration] = useState<10 | 15>(10);
  const [returned, setReturned] = useState(false);
  const [showNewVisit, setShowNewVisit] = useState(initialPlace.visits.length === 0);
  const [note, setNote] = useState("");
  const [inputMethod, setInputMethod] = useState<"speech" | "typed">("typed");
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const latest = place.visits[0];
  const active = latest && !latest.observation ? latest : null;
  const completedVisit = !active && place.visits.length > 0 && !showNewVisit;
  const stepsComplete = completedVisit ? 2 : active && returned ? 1 : 0;

  async function callJson(url: string, body?: unknown) {
    const response = await fetch(url, {
      method: "POST",
      ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "The request could not be completed.");
    return data;
  }

  async function refreshPlace() {
    const response = await fetch(`/api/places/${place.id}`, { cache: "no-store" });
    const data = await response.json();
    if (response.ok) setPlace(data.place);
  }

  async function beginVisit() {
    setBusy(true); setBusyLabel("Preparing your field card"); setError(null); setNotice(null);
    try {
      const result = await callJson(`/api/places/${place.id}/visits`, { durationMinutes: duration });
      await refreshPlace();
      setShowNewVisit(false);
      setReturned(false);
      setNote("");
      setInputMethod("typed");
      if (result.warning) setNotice(result.warning);
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); setBusyLabel(""); }
  }

  async function retryAudio(visit: Visit) {
    setBusy(true); setBusyLabel("Preparing the audio"); setError(null);
    try { await callJson(`/api/visits/${visit.id}/retry-audio`); await refreshPlace(); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); setBusyLabel(""); }
  }

  async function retryMemory(observationId: string) {
    setBusy(true); setBusyLabel("Saving this memory"); setError(null);
    try { await callJson(`/api/observations/${observationId}/retry-memory`); await refreshPlace(); setNotice("This reflection is now in place memory."); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); setBusyLabel(""); }
  }

  async function saveReflection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active) return;
    setBusy(true); setBusyLabel("Saving your visit"); setError(null); setNotice(null);
    try {
      const result = await callJson(`/api/visits/${active.id}/observation`, { noteText: note, inputMethod });
      setPlace(result.place);
      setReturned(false);
      setShowNewVisit(false);
      setNote("");
      if (result.warning) setNotice(`Your reflection is saved locally. ${result.warning}`);
      else setNotice("Your reflection is saved. This place will remember it next time.");
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); setBusyLabel(""); }
  }

  return (
    <main className="place-page">
      <Link href="/" className="back-link"><ArrowLeft size={17} aria-hidden="true" /> Back to Hover</Link>
      <div className="setup-heading">
        <div><p className="setup-overline">Your place / {place.nickname}</p><h1>Set up your visit</h1><p className="setup-subtitle">One small invitation. The rest is yours to notice.</p></div>
        <div className="progress-summary"><span>{stepsComplete} of 2 complete</span><progress max={2} value={stepsComplete} aria-label="Visit steps completed" /></div>
      </div>

      {notice && <div className="notice" role="status"><Check size={18} aria-hidden="true" /><span>{notice}</span></div>}
      {error && <div className="error-banner" role="alert"><span>{error}</span><button type="button" className="text-link" onClick={() => setError(null)}>Dismiss</button></div>}
      {!place.assistantReady && <div className="setup-banner" role="status">Place memory needs a connection before a later visit. You can still save a reflection here.</div>}
      {busy && <div className="operation-progress" role="status"><span>{busyLabel}</span><span className="progress-line progress-indeterminate" role="progressbar" aria-label={busyLabel}><span /></span></div>}

      <div className="step-stack">
        <section className={`visit-step ${active && returned || completedVisit ? "step-done" : "step-active"}`} aria-labelledby="step-one-heading">
          <div className="step-marker" aria-hidden="true">{active && returned || completedVisit ? <Check size={18} /> : "1"}</div>
          <div className="step-content">
            <div className="step-heading"><div><h2 id="step-one-heading">Listen, then leave</h2><p>Take one thought with you. Leave the screen behind.</p></div><span className="step-state">{active && returned || completedVisit ? "Complete" : "Step 01"}</span></div>
            {completedVisit ? (
              <div className="step-summary"><Check size={18} aria-hidden="true" /><span>Field card heard for visit {latest.ordinal}: <strong>{latest.card.title}</strong></span></div>
            ) : active && returned ? (
              <div className="step-summary"><Check size={18} aria-hidden="true" /><span>You returned from <strong>{place.nickname}</strong>. Your field card was “{active.card.title}”.</span></div>
            ) : active ? (
              <div className="field-card">
                <div className="field-card-meta"><span>VISIT {active.ordinal.toString().padStart(2, "0")}</span><span><Clock3 size={15} aria-hidden="true" /> {active.card.durationMinutes} MIN</span></div>
                <h3>{active.card.title}</h3>
                <p className="field-card-focus">{active.card.focus}</p>
                <ol className="action-list">{active.card.actions.map((action, index) => <li key={index}><span>0{index + 1}</span>{action}</li>)}</ol>
                <div className="audio-panel"><div className="audio-heading"><AudioLines size={19} aria-hidden="true" /><div><strong>Listen before you go</strong><p>Your field card is ready to hear.</p></div></div>{active.audioReady ? <audio key={active.id} controls preload="none" src={`/api/visits/${active.id}/audio`} aria-label="Listen to your field card" /> : <div className="audio-error"><p>{active.audioError ?? "Audio is not ready yet."}</p><button type="button" className="button button-secondary" onClick={() => retryAudio(active)} disabled={busy}><RotateCcw size={15} aria-hidden="true" /> Retry audio</button></div>}</div>
                <div className="field-card-footer"><p>Go to {place.nickname}. Take your time. There is nothing to complete outside.</p><button type="button" className="button button-primary" onClick={() => setReturned(true)}>I’m back <ArrowRight size={17} aria-hidden="true" /></button></div>
              </div>
            ) : (
              <div className="start-visit-panel">
                <div className="start-visit-copy"><span className="mini-label">YOUR NEXT MOMENT OUTSIDE</span><h3>A little space to be bored.</h3><p>Hover will give you one simple thing to notice at {place.nickname}. Hear it once, then go without your phone.</p></div>
                <fieldset className="duration-picker"><legend>How long will you stay?</legend><label><input type="radio" name="duration" value="10" checked={duration === 10} onChange={() => setDuration(10)} /> 10 minutes</label><label><input type="radio" name="duration" value="15" checked={duration === 15} onChange={() => setDuration(15)} /> 15 minutes</label></fieldset>
                <button type="button" className="button button-primary" onClick={beginVisit} disabled={busy} aria-busy={busy}>{busy ? "Preparing…" : "Prepare my visit"}<ArrowRight size={17} aria-hidden="true" /></button>
              </div>
            )}
          </div>
        </section>

        <section className={`visit-step ${active && returned ? "step-active" : completedVisit ? "step-done" : "step-locked"}`} aria-labelledby="step-two-heading" aria-disabled={!completedVisit && !(active && returned)}>
          <div className="step-marker" aria-hidden="true">{completedVisit ? <Check size={18} /> : "2"}</div>
          <div className="step-content">
            <div className="step-heading"><div><h2 id="step-two-heading">Return with a thought</h2><p>One detail is enough. Say it or write it down.</p></div><span className="step-state">{completedVisit ? "Complete" : active && returned ? "Step 02" : "After your visit"}</span></div>
            {completedVisit ? (
              <div className="step-summary step-summary-note"><Check size={18} aria-hidden="true" /><span>Your reflection is saved. It will help shape your next visit.</span></div>
            ) : active && returned ? (
              <div className="reflection-workspace"><div className="reflection-heading"><span className="mini-label">WELCOME BACK</span><h3>What stayed with you?</h3><p>Speak naturally. You can adjust the words before saving.</p></div><ReflectionRecorder key={active.id} visitId={active.id} onTranscript={(text) => { setNote(text); setInputMethod("speech"); }} /><form onSubmit={saveReflection} className="form-stack"><div className="field"><label htmlFor="reflection">Your reflection</label><textarea id="reflection" name="reflection" rows={5} minLength={5} maxLength={2000} required value={note} onChange={(event) => { setNote(event.target.value); if (inputMethod !== "speech") setInputMethod("typed"); }} placeholder="The leaves looked different when I stood still…" /><span className="field-hint">Only the words you save become part of this place’s memory.</span></div><div className="step-submit"><span>Your notebook keeps the full note. <details className="privacy-detail"><summary>How your note is handled</summary><p>Recordings go to ElevenLabs for transcription. Saved text also goes to Backboard for future visits.</p></details></span><button type="submit" className="button button-primary" disabled={busy || note.trim().length < 5} aria-busy={busy}>{busy ? "Saving…" : "Complete visit"}<ArrowRight size={17} aria-hidden="true" /></button></div></form></div>
            ) : (
              <div className="locked-step"><span>Step 2 opens when you return from your visit.</span><button type="button" className="button button-muted" disabled>Complete visit</button></div>
            )}
          </div>
        </section>
      </div>

      {completedVisit && <div className="completion-panel"><div><span className="mini-label">VISIT COMPLETE</span><h2>There’s always more to notice.</h2><p>Return to the same place another time. Hover will remember what you shared.</p></div><button type="button" className="button button-secondary" onClick={() => { setShowNewVisit(true); setNotice(null); }}>Set up another visit <ArrowRight size={17} aria-hidden="true" /></button></div>}

      <section className="explore-section" aria-labelledby="explore-heading">
        <div className="explore-heading"><div><p className="mini-label">EXPLORE MORE</p><h2 id="explore-heading">Your place, over time.</h2><p>A quiet record of the days you came back.</p></div><span>{place.visits.length} {place.visits.length === 1 ? "visit" : "visits"}</span></div>
        {place.visits.length === 0 ? <div className="archive-empty"><Leaf size={22} aria-hidden="true" /><p>Your visit archive begins after the first field card.</p></div> : <div className="archive-grid">{place.visits.map((visit) => <article className="archive-card" key={visit.id}><div className="archive-meta"><span>VISIT {visit.ordinal.toString().padStart(2, "0")}</span><time dateTime={visit.createdAt}>{readableDate(visit.createdAt)}</time></div><h3>{visit.card.title}</h3>{visit.observation ? <><p className="archive-note">“{visit.observation.noteText}”</p>{visit.observation.memoryStatus === "pending" && <button type="button" className="text-link" onClick={() => retryMemory(visit.observation!.id)} disabled={busy}><RotateCcw size={14} aria-hidden="true" /> Retry memory sync</button>}</> : <p className="archive-pending">Waiting for your reflection.</p>}{visit.retrievedMemory && <details className="memory-proof"><summary>What this visit remembered</summary><p>{visit.retrievedMemory}</p></details>}</article>)}</div>}
        {place.comparison && <div className="comparison-card"><span><Sparkles size={17} aria-hidden="true" /> Across visits</span><p>{place.comparison}</p></div>}
      </section>
    </main>
  );
}
