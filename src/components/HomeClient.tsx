"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Headphones, Leaf, Mic2, Plus, Sparkles } from "lucide-react";
import type { PlaceSummary, Setting } from "@/lib/types";

type Health = {
  ollamaReady: boolean;
  backboardConfigured: boolean;
  elevenlabsConfigured: boolean;
  model: string;
};

const settingLabels: Record<Setting, string> = {
  tree: "Tree", planter: "Planter", garden: "Garden patch", other: "Other place",
};

export function HomeClient({ initialPlaces }: { initialPlaces: PlaceSummary[] }) {
  const router = useRouter();
  const [places, setPlaces] = useState(initialPlaces);
  const [nickname, setNickname] = useState("");
  const [setting, setSetting] = useState<Setting>("tree");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/health").then((res) => res.json()).then(setHealth).catch(() => setHealth(null));
  }, []);

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

  return (
    <main>
      <section className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> A quieter kind of outside</p>
          <h1>Leave the noise.<br /><em>Find a place.</em></h1>
          <p className="hero-lead">Every spare minute has something playing. This is a reason to let the world be quiet again. Pick one familiar place, hear a small invitation, and go there without your phone.</p>
          <div className="three-steps" aria-label="How it works">
            <div><span>01</span><Headphones size={18} aria-hidden="true" /><strong>Listen</strong><p>Hear one simple thing to notice.</p></div>
            <div><span>02</span><Leaf size={18} aria-hidden="true" /><strong>Leave</strong><p>Go outside. Let yourself get bored.</p></div>
            <div><span>03</span><Mic2 size={18} aria-hidden="true" /><strong>Return</strong><p>Tell your notebook what stayed with you.</p></div>
          </div>
        </div>
        <div className="hero-side">
          <div className="illustration-card" aria-hidden="true">
            <div className="sun-disc" />
            <div className="tree-trunk" />
            <div className="tree-canopy canopy-one" />
            <div className="tree-canopy canopy-two" />
            <div className="tree-canopy canopy-three" />
            <div className="ground-line" />
            <span className="illustration-caption">The same place can hold a different day.</span>
          </div>
          <div className="quiet-note"><Sparkles size={18} aria-hidden="true" /><p>No endless prompts. No scroll to finish. The best part happens away from this screen.</p></div>
        </div>
      </section>

      <section className="home-lower" id="places">
        <div className="places-panel">
          <div className="section-heading"><div><p className="eyebrow">Your notebook</p><h2>Places you return to</h2></div><span className="place-count">{places.length} {places.length === 1 ? "place" : "places"}</span></div>
          {places.length === 0 ? (
            <div className="empty-places"><Leaf size={28} aria-hidden="true" /><h3>Start with somewhere close.</h3><p>A tree by your gate or a planter on your street is enough. Give it a name to begin.</p><a href="#new-place" className="text-link">Add your first place <ArrowUpRight size={16} aria-hidden="true" /></a></div>
          ) : (
            <div className="place-list">{places.map((place) => (
              <Link href={`/places/${place.id}`} className="place-row" key={place.id}>
                <span className="place-icon"><Leaf size={19} aria-hidden="true" /></span>
                <span className="place-row-main"><strong>{place.nickname}</strong><small>{settingLabels[place.setting]} · {place.visitCount} {place.visitCount === 1 ? "visit" : "visits"}</small></span>
                <ArrowUpRight size={19} aria-hidden="true" />
              </Link>
            ))}</div>
          )}
        </div>

        <div className="create-panel" id="new-place">
          <div className="section-heading"><div><p className="eyebrow">Begin here</p><h2>Choose one place</h2></div><Plus size={20} aria-hidden="true" /></div>
          <p className="panel-intro">Keep it nearby. You’ll visit this same spot twice and notice what changes.</p>
          <form onSubmit={submit} className="form-stack">
            <div className="field"><label htmlFor="nickname">What do you call it?</label><input id="nickname" name="nickname" type="text" minLength={2} maxLength={80} required autoComplete="off" placeholder="The tree by my gate" value={nickname} onChange={(event) => setNickname(event.target.value)} /><span className="field-hint">A nickname is enough. No address needed.</span></div>
            <div className="field"><label htmlFor="setting">What kind of place?</label><select id="setting" name="setting" value={setting} onChange={(event) => setSetting(event.target.value as Setting)}>{Object.entries(settingLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
            {error && <p className="inline-error" role="alert">{error}</p>}
            <button className="button button-primary" type="submit" disabled={busy} aria-busy={busy}>{busy ? "Saving your place…" : "Make this my place"}<ArrowUpRight size={17} aria-hidden="true" /></button>
          </form>
        </div>
      </section>

      <section className="setup-strip" aria-label="Local setup status"><span className="eyebrow">Local setup</span>{health ? <><span className={health.ollamaReady ? "status ready" : "status"}>{health.ollamaReady ? `${health.model} ready` : `${health.model} not ready`}</span><span className={health.backboardConfigured ? "status ready" : "status"}>{health.backboardConfigured ? "Backboard key set" : "Backboard key needed"}</span><span className={health.elevenlabsConfigured ? "status ready" : "status"}>{health.elevenlabsConfigured ? "ElevenLabs key set" : "ElevenLabs key needed"}</span></> : <span>Checking your local setup…</span>}</section>
    </main>
  );
}
