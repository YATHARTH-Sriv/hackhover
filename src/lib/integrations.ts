import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fieldCardSchema } from "./schemas";
import { cleanTranscript } from "./transcript";
import type { FieldCard, Setting } from "./types";

const BACKBOARD_BASE = "https://app.backboard.io/api";
const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

export class IntegrationError extends Error {
  constructor(public service: "Ollama" | "Backboard" | "ElevenLabs", message: string) {
    super(`${service}: ${message}`);
    this.name = "IntegrationError";
  }
}

function requiredEnv(name: string, service: IntegrationError["service"]): string {
  const value = process.env[name]?.trim();
  if (!value) throw new IntegrationError(service, `${name} is not configured. Add it to .env.local and retry.`);
  return value;
}

async function backboardRequest<T>(endpoint: string, body: unknown): Promise<T> {
  const key = requiredEnv("BACKBOARD_API_KEY", "Backboard");
  let response: Response;
  try {
    response = await fetch(`${BACKBOARD_BASE}${endpoint}`, {
      method: "POST",
      headers: { "X-API-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new IntegrationError("Backboard", "Could not reach the memory service. Check the connection and retry.");
  }
  if (!response.ok) {
    throw new IntegrationError("Backboard", `Request failed (${response.status}). Check the API key, credits, and retry.`);
  }
  return response.json() as Promise<T>;
}

export async function createBackboardAssistant(nickname: string): Promise<string> {
  const result = await backboardRequest<{ assistant_id?: string }>("/assistants", {
    name: `One Tree — ${nickname}`,
    system_prompt: "Store only the user's observations about this place. Do not infer species or precise location.",
  });
  if (!result.assistant_id) throw new IntegrationError("Backboard", "Assistant creation returned no ID.");
  return result.assistant_id;
}

export async function addBackboardMemory(
  assistantId: string,
  visitNumber: number,
  note: string,
  date: string,
): Promise<string> {
  const result = await backboardRequest<{ memory_id?: string }>(
    `/assistants/${encodeURIComponent(assistantId)}/memories`,
    {
      content: `Visit ${visitNumber} on ${date}: ${note}`,
      metadata: { source: "one-tree-two-visits", visit_number: visitNumber, observed_at: date },
    },
  );
  if (!result.memory_id) throw new IntegrationError("Backboard", "Memory save returned no ID.");
  return result.memory_id;
}

export async function searchBackboardMemory(assistantId: string, nickname: string): Promise<string> {
  const result = await backboardRequest<{ memories?: Array<{ content?: string; score?: number }> }>(
    `/assistants/${encodeURIComponent(assistantId)}/memories/search`,
    { query: `What has the user actually noticed on previous visits to ${nickname}?`, limit: 3 },
  );
  return (result.memories ?? []).map((memory) => memory.content?.trim()).filter(Boolean).join("\n");
}

type ChatResponse = { message?: { content?: string }; error?: string };

async function chatWithGemma(system: string, user: string): Promise<string> {
  const base = (process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL ?? "gemma3:4b";
  let response: Response;
  try {
    response = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model, stream: false, format: "json",
        options: { temperature: 0.4, num_predict: 450 },
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch {
    throw new IntegrationError("Ollama", "Local model is unavailable. Start Ollama, pull the configured model, then retry.");
  }
  const result = (await response.json().catch(() => ({}))) as ChatResponse;
  if (!response.ok || !result.message?.content) {
    throw new IntegrationError("Ollama", result.error ?? `Model request failed (${response.status}).`);
  }
  return result.message.content;
}

export async function generateCard(args: {
  nickname: string; setting: Setting; durationMinutes: 10 | 15; visitNumber: number; previousMemory: string | null;
}): Promise<FieldCard> {
  const system = `You design quiet outdoor observation rituals. Return ONLY valid JSON with keys title, focus, actions (array of exactly two strings), spokenScript, durationMinutes. The durationMinutes value must be ${args.durationMinutes}. The spokenScript is the core invitation: 25 to 55 words, easy to remember after hearing once. The app adds its own phone and safety reminder, so do not include those in spokenScript. Invite unstructured attention and a little boredom without prescribing breathing, mood, or a feeling. Actions must be observational: no touching, eating, collecting, disturbing wildlife, entering private property, or crossing roads. Never identify species or assert ecological causes. Do not invent prior observations. If referring to a previous visit, attribute the observation to the user as "you noticed"; never claim that you, the narrator, saw or noticed it.`;
  const user = args.visitNumber === 1
    ? `Place nickname: ${args.nickname}. Setting: ${args.setting}. This is the first visit. Give one simple focus and two concrete but gentle actions for a ${args.durationMinutes}-minute visit.`
    : `Place nickname: ${args.nickname}. Setting: ${args.setting}. This is visit ${args.visitNumber}. Here is a real retrieved memory from a previous visit:\n${args.previousMemory}\nMake the new focus directly refer to one specific detail in that memory. Ask the user to notice what is the same or different. Give two simple actions for a ${args.durationMinutes}-minute visit.`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const content = await chatWithGemma(system, user + (attempt ? "\nYour previous reply failed validation. Follow the JSON shape exactly." : ""));
    try {
      const card = fieldCardSchema.parse(JSON.parse(content));
      if (card.durationMinutes !== args.durationMinutes) throw new Error("Wrong duration");
      const coreWords = card.spokenScript.trim().split(/\s+/).length;
      if (coreWords < 25 || coreWords > 55) throw new Error("Wrong spoken length");
      if (/\bI\s+(?:saw|noticed|observed|heard|felt|found)\b/i.test(card.spokenScript)) {
        throw new Error("Narrator claimed a previous observation");
      }
      return fieldCardSchema.parse({
        ...card,
        spokenScript: `Leave your phone here. ${card.spokenScript.trim()} Observe without touching, collecting, or disturbing living things.`,
      });
    } catch {
      if (attempt === 1) throw new IntegrationError("Ollama", "The model returned an invalid field card twice. Retry generation.");
    }
  }
  throw new IntegrationError("Ollama", "Could not generate a field card.");
}

export async function compareObservations(first: string, second: string): Promise<string> {
  const content = await chatWithGemma(
    "Return ONLY valid JSON with one key, summary. Write one or two sentences comparing only what the user reported. Use 'you noticed' or 'you reported'. Preserve exact details, including singular versus plural. If both notes mention the same detail, say that both mention it; do not claim a change. Do not infer species, causes, measurements, or unreported details. Maximum 280 characters.",
    `First visit: ${first}\nSecond visit: ${second}`,
  );
  try {
    const parsed = JSON.parse(content) as { summary?: unknown };
    if (typeof parsed.summary === "string" && parsed.summary.length <= 280) return parsed.summary.trim();
  } catch { /* comparison is optional */ }
  throw new IntegrationError("Ollama", "The comparison could not be generated.");
}

export async function synthesizeCard(visitId: string, script: string): Promise<string> {
  const key = requiredEnv("ELEVENLABS_API_KEY", "ElevenLabs");
  const voiceId = requiredEnv("ELEVENLABS_VOICE_ID", "ElevenLabs");
  let response: Response;
  try {
    response = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ text: script, model_id: process.env.ELEVENLABS_TTS_MODEL ?? "eleven_flash_v2_5" }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    throw new IntegrationError("ElevenLabs", "Could not reach text-to-speech. Retry when online.");
  }
  if (!response.ok) throw new IntegrationError("ElevenLabs", `Speech generation failed (${response.status}). Check the key, voice, and credits.`);
  const dir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.AUDIO_DIR ?? "./data/audio");
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${visitId}.mp3`);
  await writeFile(filePath, Buffer.from(await response.arrayBuffer()));
  return filePath;
}

export async function transcribeReflection(file: File): Promise<string> {
  const key = requiredEnv("ELEVENLABS_API_KEY", "ElevenLabs");
  const form = new FormData();
  form.set("model_id", "scribe_v2");
  form.set("tag_audio_events", "false");
  form.set("no_verbatim", "true");
  form.set("file", file, file.name || "reflection.webm");
  let response: Response;
  try {
    response = await fetch(`${ELEVENLABS_BASE}/speech-to-text`, {
      method: "POST", headers: { "xi-api-key": key }, body: form,
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    throw new IntegrationError("ElevenLabs", "Could not transcribe the recording. Retry or type your reflection.");
  }
  if (!response.ok) throw new IntegrationError("ElevenLabs", `Transcription failed (${response.status}). Retry or type your reflection.`);
  const result = (await response.json()) as { text?: string };
  const transcript = cleanTranscript(result.text ?? "");
  if (!transcript) throw new IntegrationError("ElevenLabs", "No speech was detected. Try again or type your reflection.");
  return transcript;
}
