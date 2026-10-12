# projecthover

A small desktop ritual for getting outside without a phone. Hear one brief field card, leave the screen, visit one familiar place, then return and say what you noticed. The next card refers to your actual previous observation.

Built for the Hacktoberfest 2026 Open-Source AI Challenge, Week 1: **Touch Grass**.

## What is running where

- **Gemma 3 4B via Ollama** runs locally on the Machine and generates field cards and short comparisons.
- **Backboard** stores and retrieves concise place-specific text memories. It is a hosted service.
- **ElevenLabs** creates the pre-walk audio and transcribes the post-walk reflection. It is a hosted service.
- The default speech model is Flash v2.5 to keep short demo cards inexpensive; generated MP3s are cached locally for replay.
- **Next.js + TypeScript + SQLite** provide the desktop web app and local notebook. Raw reflection recordings are not persisted by the app; the user reviews the transcript before saving it.

The app is designed for `localhost` on a laptop. The user leaves their phone behind during the visit. Internet is needed for Backboard and ElevenLabs calls. The field activity itself requires no device.

### What each service does

| Part | Responsibility |
| --- | --- |
| Ollama + Gemma 3 4B | Generates the observation card locally. On later visits it uses a retrieved prior note to make a relevant follow-up; it can also compare two confirmed notes. |
| ElevenLabs | Speaks each card before the walk and transcribes a recording after the walk. Scribe is asked to omit non-speech events, fillers, and false starts. |
| Backboard | Holds text memories for each named place. Only after the user saves a reflection does the app send that confirmed text to Backboard; before the next card, the app retrieves it and passes it to Gemma. |
| Next.js + SQLite | Runs the browser interface and stores places, visits, cards, confirmed notes, and cached speech on the Machine. |

Backboard does not write the field card or receive the raw recording. ElevenLabs does not decide what the next observation task should be.

## Requirements

- Node.js 24.10 or newer
- Ollama with `gemma3:4b`
- Backboard API key
- ElevenLabs API key with text-to-speech and speech-to-text access, plus a voice ID

Ollama: <https://ollama.com/download> · Gemma 3: <https://ollama.com/library/gemma3> · Backboard: <https://docs.backboard.io/> · ElevenLabs: <https://elevenlabs.io/docs>

## Setup

```bash
cd projecthover
npm install
cp .env.example .env
export OLLAMA_MODELS="$PWD/data/models"
ollama serve
```

In another terminal, pull the model:

```bash
cd projecthover
export OLLAMA_MODELS="$PWD/data/models"
ollama pull gemma3:4b
```

Use the same `OLLAMA_MODELS` value for the server and pull commands. This workspace keeps the model under the ignored `data/models/` directory; if you prefer Ollama's default model directory, omit that export in both terminals.

Fill in `BACKBOARD_API_KEY` and `ELEVENLABS_API_KEY` in `.env`; the included voice ID is a starting choice. Then run:

```bash
npm run dev
```

Open <http://localhost:3000>. The home page shows which integrations are configured. The API keys remain server-side. `.env`, `.env.local`, `data/`, the SQLite database, and generated audio are ignored by Git. If you use both env files, `.env.local` takes precedence; avoid leaving blank key overrides there.

If Ollama is already running, `ollama serve` will report that the port is in use; you can keep the existing server. If your Machine is slower with the 4B model, set `OLLAMA_MODEL` to another locally pulled open-weight model and report that change in the project write-up.

## User flow

1. Name a nearby place without entering its precise location.
2. Prepare and listen to a 10- or 15-minute field card.
3. Leave the laptop and phone behind. Visit the place.
4. Return and record a short reflection in the browser, or type it. Review and edit the transcript.
5. Save it. The note stays in local SQLite; a concise copy is sent to Backboard memory.
6. Prepare a second card. The app searches that place's Backboard memory, selects the highest-ranked source note, and passes it to Gemma. The exact retrieved note can be opened on the new card and remains visible in the visit timeline.

If Backboard is temporarily unavailable when saving a note, the note still saves locally and the notebook offers **Retry memory sync**. If ElevenLabs audio fails, the text card remains and **Retry audio** uses the same visit.

## Development checks

```bash
npm run typecheck
npm run build
```

The app uses `better-sqlite3` for local persistence. Keep the Node version pinned when running the demo so the native package stays compatible.

