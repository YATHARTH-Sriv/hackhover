"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, AudioLines, Check, Clock3, Leaf, Mic2, RotateCcw, Sparkles } from "lucide-react";
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
  const [note, setNote] = useState("");
  const [inputMethod, setInputMethod] = useState<"speech" | "typed">("typed");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const latest = place.visits[0];
  const active = latest && !latest.observation ? latest : null;

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
    setBusy(true); setError(null); setNotice(null);
    try {
      const result = await callJson(`/api/places/${place.id}/visits`, { durationMinutes: duration });
      await refreshPlace();
      setReturned(false);
      setNote("");
      setInputMethod("typed");
      if (result.warning) setNotice(result.warning);
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }

  async function retryAudio(visit: Visit) {
    setBusy(true); setError(null);
    try { await callJson(`/api/visits/${visit.id}/retry-audio`); await refreshPlace(); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }

  async function retryMemory(observationId: string) {
    setBusy(true); setError(null);
    try { await callJson(`/api/observations/${observationId}/retry-memory`); await refreshPlace(); setNotice("This reflection is now in place memory."); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }

  async function saveReflection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      const result = await callJson(`/api/visits/${active.id}/observation`, { noteText: note, inputMethod });
      setPlace(result.place);
      setReturned(false);
      setNote("");
      if (result.warning) setNotice(`Your reflection is saved locally. ${result.warning}`);
      else setNotice("Your reflection is saved. This place will remember it next time.");
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }

  return (
    <main className="place-page">
      <Link href="/" className="back-link"><ArrowLeft size={17} aria-hidden="true" /> All places</Link>
      <div className="place-heading"><div><p className="eyebrow"><span className="eyebrow-dot" /> Your familiar place</p><h1>{place.nickname}</h1><p>Same place. A little more to notice each time.</p></div><span className="visit-count"><Leaf size={17} aria-hidden="true" /> {place.visits.length} {place.visits.length === 1 ? "visit" : "visits"}</span></div>

      {notice && <div className="notice" role="status"><Check size={18} aria-hidden="true" /><span>{notice}</span></div>}
      {error && <div className="error-banner" role="alert"><span>{error}</span><button type="button" className="text-link" onClick={() => setError(null)}>Dismiss</button></div>}
      {!place.assistantReady && <div className="setup-banner" role="status">Backboard memory is not connected for this place yet. Reflections can still save locally; the next visit needs memory sync.</div>}

      <div className="experience-grid">
        <section className="experience-main" aria-labelledby="current-heading">
          {!active ? (
            <div className="start-card">
              <p className="eyebrow">{place.visits.length === 0 ? "Your first visit" : "The next visit"}</p>
              <h2 id="current-heading">A little space to be bored.</h2>
              <p>We’ll give you one thing to notice. Hear it, leave your phone here, and walk to your place. There is nothing to complete while you’re outside.</p>
              <fieldset className="duration-picker"><legend>How long will you stay?</legend><label><input type="radio" name="duration" value="10" checked={duration === 10} onChange={() => setDuration(10)} /> 10 minutes</label><label><input type="radio" name="duration" value="15" checked={duration === 15} onChange={() => setDuration(15)} /> 15 minutes</label></fieldset>
              <button type="button" className="button button-primary button-wide" onClick={beginVisit} disabled={busy} aria-busy={busy}><Sparkles size={17} aria-hidden="true" /> {busy ? "Preparing your invitation…" : place.visits.length === 0 ? "Prepare first visit" : "Prepare next visit"}<ArrowRight size={17} aria-hidden="true" /></button>
              {busy && <p className="processing-note" role="status">The local model is writing a short card. This can take a moment.</p>}
            </div>
          ) : (
            <div className="current-visit">
              <div className="card-meta"><span>Visit {active.ordinal.toString().padStart(2, "0")}</span><span><Clock3 size={15} aria-hidden="true" /> {active.card.durationMinutes} minutes</span></div>
              <h2 id="current-heading">{active.card.title}</h2>
              <p className="card-focus">{active.card.focus}</p>
              <ol className="action-list">{active.card.actions.map((action, index) => <li key={index}><span>0{index + 1}</span>{action}</li>)}</ol>
              <div className="audio-panel"><div className="audio-heading"><AudioLines size={20} aria-hidden="true" /><div><strong>Hear your field card</strong><p>Listen once, then leave the screen behind.</p></div></div>{active.audioReady ? <audio key={active.id} controls preload="none" src={`/api/visits/${active.id}/audio`} aria-label="Listen to your field card" /> : <div className="audio-error"><p>{active.audioError ?? "The audio is not ready yet."}</p><button type="button" className="button button-secondary" onClick={() => retryAudio(active)} disabled={busy}><RotateCcw size={15} aria-hidden="true" /> Retry audio</button></div>}</div>
              {!returned ? <div className="leave-card"><span className="leave-number">✳</span><div><strong>Now, leave your phone here.</strong><p>Go to {place.nickname}. Notice what you notice. There is nothing to track while you’re there.</p></div><button type="button" className="button button-dark" onClick={() => setReturned(true)}>I’m back <ArrowRight size={17} aria-hidden="true" /></button></div>
                : <div className="return-card"><div className="return-heading"><p className="eyebrow">Welcome back</p><h3>What stayed with you?</h3><p>Say it as you remember it. A small detail is enough.</p></div><ReflectionRecorder key={active.id} visitId={active.id} onTranscript={(text) => { setNote(text); setInputMethod("speech"); }} /><form onSubmit={saveReflection} className="form-stack"><div className="field"><label htmlFor="reflection">Your reflection</label><textarea id="reflection" name="reflection" rows={5} minLength={5} maxLength={2000} required value={note} onChange={(event) => { setNote(event.target.value); if (inputMethod !== "speech") setInputMethod("typed"); }} placeholder="The leaves looked different when I stood still…" /><span className="field-hint">Review the transcript before saving. This text is sent to Backboard as place memory.</span></div><button type="submit" className="button button-primary" disabled={busy || note.trim().length < 5} aria-busy={busy}>{busy ? "Saving your reflection…" : "Save this visit"}<ArrowRight size={17} aria-hidden="true" /></button></form></div>}
            </div>
          )}
        </section>

        <aside className="experience-side" aria-label="Place notebook">
          <div className="side-heading"><p className="eyebrow">Your notebook</p><h2>Visits to this place</h2></div>
          {place.visits.length === 0 ? <div className="timeline-empty"><Leaf size={25} aria-hidden="true" /><p>Your visits will appear here after you begin. The story starts with one ordinary place.</p></div> : <div className="timeline">{place.visits.map((visit) => <article className="timeline-item" key={visit.id}><div className="timeline-marker" /><div className="timeline-content"><div className="timeline-top"><span>Visit {visit.ordinal}</span><time dateTime={visit.createdAt}>{readableDate(visit.createdAt)}</time></div><h3>{visit.card.title}</h3>{visit.observation ? <><p className="timeline-note">“{visit.observation.noteText}”</p>{visit.observation.memoryStatus === "pending" && <button type="button" className="text-link" onClick={() => retryMemory(visit.observation!.id)} disabled={busy}><RotateCcw size={14} aria-hidden="true" /> Retry memory sync</button>}</> : <p className="timeline-pending">Waiting for your reflection.</p>}{visit.retrievedMemory && <details className="memory-proof"><summary>What this visit remembered</summary><p>{visit.retrievedMemory}</p></details>}</div></article>)}</div>}
          {place.comparison && <div className="comparison-card"><span><Sparkles size={16} aria-hidden="true" /> Across visits</span><p>{place.comparison}</p></div>}
          <div className="side-footnote"><Mic2 size={17} aria-hidden="true" /><p>Your approved reflections stay in this local notebook. A short text memory is also sent to Backboard. Recordings go to ElevenLabs only for transcription.</p></div>
        </aside>
      </div>
    </main>
  );
}
