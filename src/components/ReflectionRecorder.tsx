"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, RotateCcw, FileAudio } from "lucide-react";

type Props = { visitId: string; onTranscript: (text: string) => void };

export function ReflectionRecorder({ visitId, onTranscript }: Props) {
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!audioBlob) return;
    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);
    return () => { URL.revokeObjectURL(url); setAudioUrl(null); };
  }, [audioBlob]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function start() {
    setError(null);
    setAudioBlob(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("This browser cannot record audio here. You can type your reflection below.");
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true },
      });
      const preferred = ["audio/webm", "audio/mp4"].find((mime) => MediaRecorder.isTypeSupported(mime));
      chunks.current = [];
      const mediaRecorder = new MediaRecorder(stream.current, preferred ? { mimeType: preferred } : undefined);
      recorder.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      mediaRecorder.onstop = () => {
        setRecording(false);
        if (timer.current) clearTimeout(timer.current);
        const blob = new Blob(chunks.current, { type: mediaRecorder.mimeType || "audio/webm" });
        setAudioBlob(blob.size ? blob : null);
        stream.current?.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.start();
      setRecording(true);
      timer.current = setTimeout(() => mediaRecorder.state === "recording" && mediaRecorder.stop(), 90_000);
    } catch {
      stream.current?.getTracks().forEach((track) => track.stop());
      setError("Microphone access was unavailable. Allow it in your browser settings or type your reflection below.");
    }
  }

  function stop() {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  async function transcribe() {
    if (!audioBlob) return;
    setBusy(true);
    setError(null);
    try {
      const extension = audioBlob.type.includes("mp4") ? "m4a" : "webm";
      const data = new FormData();
      data.set("audio", new File([audioBlob], `reflection.${extension}`, { type: audioBlob.type }));
      const response = await fetch(`/api/visits/${visitId}/transcribe`, { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not transcribe the recording.");
      onTranscript(result.transcript);
      setAudioBlob(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not transcribe. Try again or type below.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="recorder-panel">
      <div className="recorder-head"><div className="recorder-icon"><Mic size={19} aria-hidden="true" /></div><div><strong>Speak what you noticed</strong><p>Thirty seconds is enough. Your recording is sent to ElevenLabs for transcription and is not saved here by default.</p></div></div>
      <div className="recorder-actions">
        {recording ? <button type="button" className="button button-dark" onClick={stop}><Square size={15} aria-hidden="true" /> Stop recording</button>
          : <button type="button" className="button button-secondary" onClick={start} disabled={busy}><Mic size={16} aria-hidden="true" /> {audioBlob ? "Record again" : "Start recording"}</button>}
        {audioBlob && !recording && <button type="button" className="button button-primary" onClick={transcribe} disabled={busy} aria-busy={busy}><FileAudio size={16} aria-hidden="true" /> {busy ? "Transcribing…" : "Transcribe reflection"}</button>}
      </div>
      {recording && <p className="recording-indicator" role="status"><span /> Recording… It will stop after 90 seconds.</p>}
      {audioBlob && audioUrl && !recording && <div className="recording-preview"><audio controls src={audioUrl} aria-label="Review your reflection recording" /><a href={audioUrl} download={`my-reflection.${audioBlob.type.includes("mp4") ? "m4a" : "webm"}`} className="text-link"><RotateCcw size={15} aria-hidden="true" /> Keep a copy before leaving</a></div>}
      {error && <p className="inline-error" role="alert">{error}</p>}
    </div>
  );
}
