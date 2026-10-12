"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, ChevronDown, CirclePlay, Gem, MapPin, Sparkles } from "lucide-react";
import type { PlaceSummary, Setting } from "@/lib/types";

const settingLabels: Record<Setting, string> = {
  tree: "Tree", planter: "Planter", garden: "Garden", other: "Other",
};

export function HomeClient({ initialPlaces }: { initialPlaces: PlaceSummary[] }) {
  const router = useRouter();
  const savedPlaces = useRef<HTMLDetailsElement>(null);
  const [places, setPlaces] = useState(initialPlaces);
  const [nickname, setNickname] = useState("");
  const [setting, setSetting] = useState<Setting>("other");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/places", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, setting }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save this place.");
      setPlaces((current) => [{
        id: data.place.id, nickname: data.place.nickname, setting: data.place.setting,
        createdAt: data.place.createdAt, assistantReady: data.place.assistantReady, visitCount: 0,
      }, ...current]);
      router.push(`/places/${data.place.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this place. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function closeSavedPlacesOnEscape(event: KeyboardEvent<HTMLDetailsElement>) {
    if (event.key === "Escape" && savedPlaces.current?.open) {
      savedPlaces.current.open = false;
      savedPlaces.current.querySelector("summary")?.focus();
    }
  }

  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <Image src="/hover-landscape-color.png" alt="" fill priority sizes="100vw" className="hero-landscape" />
        <div className="hero-content">
          <p className="hero-kicker">A small ritual for a better life</p>
          <h1 id="hero-title"><span>Your agents are working.</span><br />Time to connect with yourself.</h1>
          <p className="hero-description">Select a place, keep your phone at your desk and experience things you miss</p>
          <div className="hero-actions">
            <form className="place-entry" onSubmit={submit} aria-busy={busy}>
              <MapPin size={18} aria-hidden="true" />
              <label className="sr-only" htmlFor="place-name">Place name</label>
              <input id="place-name" name="place-name" value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="Enter your place" minLength={2} maxLength={80} autoComplete="off" required aria-invalid={Boolean(error)} aria-describedby={error ? "place-error" : undefined} />
              <label className="sr-only" htmlFor="place-setting">Place type</label>
              <select id="place-setting" name="place-setting" value={setting} onChange={(event) => setSetting(event.target.value as Setting)} aria-label="Place type">
                {Object.entries(settingLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
              <button type="submit" aria-label="Create place and set up visit" disabled={busy}><ArrowRight size={19} aria-hidden="true" /></button>
            </form>
            <details className="saved-places" ref={savedPlaces} onKeyDown={closeSavedPlacesOnEscape}>
              <summary>Saved places <ChevronDown size={17} aria-hidden="true" /></summary>
              <div className="saved-menu">
                <p>Pick up where you left off</p>
                {places.length === 0 ? <span className="saved-empty">No places yet. Name one to begin.</span> : places.map((place) => (
                  <Link href={`/places/${place.id}`} key={place.id} onClick={() => { if (savedPlaces.current) savedPlaces.current.open = false; }}>
                    <span><strong>{place.nickname}</strong><small>{place.visitCount} {place.visitCount === 1 ? "visit" : "visits"}</small></span><ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </details>
          </div>
          {busy && <div className="hero-loading" role="status"><span>Opening your place</span><span className="progress-line progress-indeterminate" aria-hidden="true"><span /></span></div>}
          {error && <p className="hero-error" id="place-error" role="alert">{error}</p>}
        </div>
      </section>

      <section className="how-section" id="how-it-works" aria-labelledby="how-heading">
        <div className="section-inner">
          <div className="how-heading"><p className="section-label">How hover works</p><h2 id="how-heading">less input.<br /><span>more life.</span></h2></div>
          <div className="ritual-steps" aria-label="The visit ritual">
            <div><span>01</span><strong>Choose a place</strong><p>Somewhere familiar is enough.</p></div>
            <div><span>02</span><strong>Leave the screen</strong><p>Take one thought outside, experience it.</p></div>
            <div><span>03</span><strong>Come back</strong><p>Speak or write what stayed with you.</p></div>
          </div>

          <div className="systems-heading"><h3>Three tools. One reason to look up.</h3></div>
          <div className="systems-grid">
            <article className="system-card">
              <div className="system-preview voice-preview" aria-hidden="true">
                <div className="preview-top"><span>FIELD CARD / AUDIO</span><span>00:34</span></div>
                <div className="voice-wave">{[28, 45, 65, 36, 77, 55, 89, 52, 72, 42, 91, 61, 38, 70, 48, 79, 54, 31, 66, 40, 24].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
                <div className="voice-player"><CirclePlay size={30} /><span>Listen once. Then go.</span><span>01 / 01</span></div>
              </div>
              <div className="system-body"><div className="system-name"><Image src="/elevenlabs-logo-white.png" alt="ElevenLabs" width={2082} height={270} className="system-brand-logo" /></div><h4>Hear it. Say it.</h4><ul><li>Turns a short field card into audio.</li><li>Transcribes your reflection after you return.</li></ul></div>
            </article>
            <article className="system-card">
              <div className="system-preview memory-preview" aria-hidden="true">
                <div className="preview-top"><span>PLACE MEMORY</span><span>VISIT 02</span></div>
                <div className="memory-example"><span className="memory-node" /><p>“The air felt cooler near the garden.”</p><small>Remembered from your last visit</small></div>
                <div className="memory-followup"><Sparkles size={15} /><span>What feels different today?</span></div>
              </div>
              <div className="system-body"><div className="system-name"><Image src="/bakboardlogo.png" alt="Backboard" width={582} height={72} className="system-brand-logo" /></div><h4>A place that remembers.</h4><ul><li>Keeps the words you choose to save.</li><li>Brings a real detail into your next visit.</li></ul></div>
            </article>
            <article className="system-card system-card-wide">
              <div className="system-preview model-preview" aria-hidden="true">
                <div className="preview-top"><span>LOCAL MODEL / GEMMA 3</span><span>Local Model</span></div>
                <div className="model-screen"><span className="model-cursor" /><p>From your last note: cooler air.</p><strong>Notice one thing that changed, and one that stayed.</strong></div>
                <div className="model-status"><span /><span>Field card ready</span></div>
              </div>
              <div className="system-body"><div className="system-name"><Gem className="gemma-mark" size={22} aria-hidden="true" /><span>Gemma via Ollama</span></div><h4>The thinking stays close.</h4><ul><li>Gives You a short observation card.</li><li>Uses retrieved memory to make the next one personal.</li></ul></div>
            </article>
          </div>
        </div>
      </section>

      <section className="closing-strip"><span>Less to scroll. More to notice.</span><a href="#hero-title">Start with a place <ArrowUpRight size={17} aria-hidden="true" /></a></section>
    </main>
  );
}
