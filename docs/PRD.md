# Product requirements document: Hover

**Version:** 1.1  
**Prepared:** 9 October 2026  
**Challenge:** Hacktoberfest Open-Source AI Challenge, Week 1: Touch Grass  
**Target categories:** Best Use of Backboard ($100), Best Use of ElevenLabs ($100)  
**Submission deadline:** 11 October 2026, 11:59 PM PDT / 12 October 2026, 12:29 PM IST

## 1. Product summary

Hover helps someone notice one ordinary outdoor place more closely by visiting it twice. Before each visit, it gives them one short, spoken observation task. After the visit, they record what they noticed. On the second visit, the task refers to their own first observation, so the AI has a reason to remember rather than merely generate another generic walk suggestion.

The emotional premise is simple: constant content fills every spare moment, leaving little room to be bored, think, or notice small things. The app creates a brief starting ritual, then sends the user out **without a phone**. Boredom and unstructured attention are part of the experience; the product does not try to fill the walk with continuous guidance.

The product should make the outdoor activity longer than the interaction with the app. The first demo will follow a real nearby tree, planter, or garden patch; it will show both visits and a meaningful change in the second prompt.

**One-sentence pitch:** “Leave your phone behind. Visit one familiar place. Get bored enough to notice something new.”

## 2. Problem and opportunity

Most nature apps emphasize identification, feeds, maps, or long conversations. These can keep users looking at a screen while they are outside. A brief, personally relevant prompt heard **before leaving the desk** can instead direct attention to a real place. Returning to that same place makes the experience cumulative: the app can ask what changed, what stayed the same, and what the user wants to notice next.

The contest requires a *new* project with open-source AI at its core, a real connection to the “Touch Grass” theme, a code repository, a demo, and a DEV write-up explaining why the open approach matters. Writing quality carries the most weight in judging. A single entry may list multiple partner categories it genuinely uses, but can receive only one prize. [Challenge rules](https://dev.to/page/hacktoberfest-week1-2026-10-05-contest-rules) · [Challenge page and FAQ](https://dev.to/challenges/hacktoberfest-week1-2026-10-05)

## 3. Goals and measures

### Product goals

1. Get a user outdoors for two separate observation sessions at the same place.
2. Keep each pre-visit and post-visit app interaction short and understandable.
3. Make the second visit visibly depend on the first visit's notes.
4. Make voice useful: the user hears the task before leaving and can speak a reflection after returning, without carrying a screen outside.
5. Show an open-weight model doing the core reasoning, with a reproducible local setup.

### MVP success criteria

- A new user can create a place and generate a first field card in under two minutes, excluding the first local model download.
- Each field card has one observation focus, two or three concrete actions, an estimated 10–15 minute duration, and a reminder to leave living things undisturbed.
- The user can play the field card audio before going outside, then leave the phone and laptop behind.
- The user can record a 30–90 second reflection on the laptop after returning, review/edit its transcript, and save it; typing remains available if microphone access fails.
- The user can save a note after visit one, return to the same place, and receive a second card that names at least one real detail from that note.
- A before/after screen shows both observations and the question that connected them.
- The end-to-end flow works in a recorded demo using an actual outdoor visit. No fabricated field observations are presented as real.

### Measurement in the demo

- Record approximate seconds spent in-app before and after each outing, and minutes spent outside; report the observed values without claiming a broad study.
- Show the exact first note, the retrieved Backboard memory, and the resulting second prompt.
- Show the spoken pre-walk card, a short return reflection recorded on the MacBook, the editable ElevenLabs transcript, and the phone being left behind.

## 4. Users and use cases

**Primary user:** A student or desk worker who has 10–15 minutes and can reach a tree, planter, courtyard, or park patch nearby.

**Secondary user:** A casual naturalist who wants to build a habit of noticing seasonal or daily change without learning species names.

**Main use case:** “I want a small reason to go outside now, and on my next visit I want to notice something connected to what I saw today.”

No precise location, route planning, account, social feed, or species identification is required for the MVP.

## 5. Core user journey

1. **Choose a place.** User gives it a nickname such as “the tree by my gate,” selects a setting (tree, planter, garden patch, or other), and chooses a 10- or 15-minute visit. Precise GPS is not requested.
2. **Prepare visit one.** The open-weight model creates a short observation card. ElevenLabs turns its spoken script into audio. The user listens at their MacBook, then closes or leaves the app.
3. **Go outside without a device.** The user remembers one simple task and allows the rest of the visit to be unstructured. Example: “Look at the same branch from two steps away. Notice one texture, one movement, and one sound.”
4. **Speak a reflection on return.** The user records 30–90 seconds in the desktop browser. ElevenLabs transcribes it; the user reviews and edits the text before saving. Typed entry is an alternative. The approved note is saved locally; a concise text memory is also sent to Backboard. Photos are deferred.
5. **Prepare visit two.** The app searches Backboard memory for relevant prior observations for that place. The open-weight model uses the retrieved note to make a specific follow-up card, and ElevenLabs voices it.
6. **Return and compare.** User visits again, records a second note, and sees a simple two-visit comparison. The model may summarize observed differences, but must not invent ecological facts.

## 6. Scope

### P0: required for submission

- Create and select a named place.
- Generate visit-one and visit-two cards with an open-weight model.
- Save visits, timestamps, cards, and confirmed text observations.
- Add and search place-specific memories with Backboard; visibly display the retrieved source note in developer/demo view.
- Generate and play the spoken card with ElevenLabs before the user leaves.
- Record a short post-visit reflection in the desktop browser, transcribe it with ElevenLabs Scribe, and let the user edit before saving.
- Show a two-visit timeline and comparison.
- Handle missing model, Backboard, or ElevenLabs service with a clear error and a retry action; preserve the user's note.
- README with setup, architecture, environment variables, category proof, and demo instructions.
- Real outdoor photos or clips captured separately for the contest story, a short video demo, and a DEV submission post. The person doing the visit does not need to carry the camera or phone.

### P1: only after P0 works and the real visits are complete

- Downloadable printable field card.
- A third visit to show continuing memory.

### Out of scope for this deadline

- Mobile app or mobile web flow, on-device phone inference, full offline PWA behavior, precise GPS or maps, wildlife/species diagnosis, weather forecasts, accounts, reminders, leaderboards, and a public observations feed.

## 7. Partner and open-AI requirements

### Open-weight AI: Gemma 3 4B via Ollama

Gemma 3 4B is the proposed default because Ollama distributes a 4B text/vision variant of about 3.4 GB. The user's M4 MacBook Air with 16 GB unified memory should be able to run this quantized model; this is a fit estimate, **not a measured latency claim**. Ollama supports Apple M-series Macs, but it is not installed in the current environment, so benchmark one real card early. The MVP uses **text input** for prompt generation and note comparison; vision is optional and must not become necessary for the two-visit flow. Keep the model name configurable so a smaller supported open-weight model can be used if speed is poor. The model must generate structured JSON that the server validates before displaying a card. [Ollama Gemma 3 model sizes](https://ollama.com/library/gemma3/tags) · [Ollama macOS support](https://github.com/ollama/ollama/blob/main/docs/macos.mdx)

The model is the product's reasoning core: it transforms observations into the next field task. A hard-coded prompt library can be a failure fallback, but should not be presented as the AI feature.

### Backboard: place-specific memory

For each place, persist one Backboard `assistant_id`. On note submission, store a concise memory containing the place nickname, visit number, date, and the user's observation. Before the next card, run semantic memory search for that place and pass the retrieved memory text to Gemma. Keep the exact source note visible in a developer/demo panel so the memory use is auditable. Backboard documents manual add and search memory operations and notes that memory belongs to an assistant. [Backboard memory documentation](https://docs.backboard.io/sdk/memory)

Backboard is a hosted service, so the product must **not** claim that all observations stay on the user's device. The interface should state that text notes used for memory are sent to Backboard. Use a nickname rather than an address; never store precise coordinates in memory.

### ElevenLabs: spoken card and return reflection

Send the final, validated field-card script to ElevenLabs text-to-speech and save the returned MP3 locally for replay. The user hears it at the desk before leaving. After the visit, the browser records a short reflection and the server sends it to ElevenLabs Scribe v2 for transcription. Show the transcript for correction before it becomes a saved observation. Discard the raw recording after transcription by default; the user must know the audio is sent to ElevenLabs. The model's task generation remains separate from both voice services. [ElevenLabs text-to-speech API](https://elevenlabs.io/docs/api-reference/text-to-speech/convert) · [ElevenLabs speech-to-text API](https://elevenlabs.io/docs/api-reference/speech-to-text/convert)

The user-provided screenshot shows an ElevenAPI Free plan with **10,000 available credits** at the time of capture. Confirm the actual balance in the account before testing; keep cards short and cache generated audio. The user reports **$5 in Backboard credits**.

### Prize-category evidence

The DEV post should list **Best Use of Backboard** and **Best Use of ElevenLabs** in its Prize Categories section, with screenshots or a short clip proving both integrations. Add any other category only if its technology is genuinely used and demonstrable. The open-weight model may also make the project eligible for the Gemma featured category, but the build plan does not depend on that prize.

## 8. Functional requirements and acceptance tests

| ID | Requirement | Acceptance check |
| --- | --- | --- |
| FR-01 | Create a place with nickname and setting. | Place appears in the place list and survives app restart. |
| FR-02 | Generate a first card. | Card contains one focus, 2–3 safe actions, time estimate, and spoken script; invalid model output is rejected and retried once. |
| FR-03 | Generate audio. | The spoken card plays on the MacBook; repeat playback uses the cached MP3 and does not re-bill the API. |
| FR-04 | Record and transcribe a reflection. | Browser requests microphone permission, records up to 90 seconds, sends audio for Scribe transcription, and displays editable text. A typed fallback works. |
| FR-04a | Save an observation. | Only the user-confirmed text becomes a note; it survives app restart; blank notes cannot be submitted. Raw recorded audio is not retained by default. |
| FR-05 | Persist Backboard memory. | Saved note creates a searchable memory tied to the selected place's assistant ID. |
| FR-06 | Personalize visit two. | Retrieved memory is shown in developer/demo view; second card includes a concrete detail from visit one and a related observation question. |
| FR-07 | Compare visits. | Timeline displays both cards, notes, and dates; summary cites the two notes and avoids invented measurements. |
| FR-08 | Handle failures. | If an external call fails, the note remains saved, the error names the failing step, and retry does not create duplicate visits. |
| FR-09 | Protect secrets. | API keys exist only in server environment variables and never appear in browser code, screenshots, repository, or DEV post. |

## 9. Content and safety rules

- Prompt users to observe without touching, eating, collecting, disturbing, or identifying potentially hazardous plants or animals.
- Do not suggest entering private property, crossing roads for a target, or going out in unsafe weather. The app does not know local conditions, so keep advice modest and user-controlled.
- Do not assert species, health, ecological cause, or environmental change from a short note. Phrase comparisons as “you reported…” or questions to investigate.
- Limit spoken scripts to roughly 40–70 words, with a calm, direct tone and no lengthy chatbot conversation.
- Offer text alongside audio for accessibility.
- Keep the tone invitational. Do not prescribe a mood, promise mental-health benefits, or turn boredom into a score.

## 10. Technical design

### Architecture

```text
Next.js desktop browser UI (TypeScript)
  |-- place setup, spoken card, microphone recorder, transcript editor, timeline
  |
Next.js Route Handlers (Node.js runtime, TypeScript)
  |-- SQLite: places, visits, cards, confirmed notes, audio file paths
  |-- Ollama/Gemma: structured card generation and comparison
  |-- Backboard API: add/search text memories by place assistant_id
  `-- ElevenLabs API: card speech + reflection transcription
```

This is a **desktop-first, local demo build**: the Next.js app and Gemma run on the MacBook; Backboard and ElevenLabs need an internet connection when preparing a card, transcribing a reflection, or syncing a note. The user listens before leaving, then goes outside without a phone. Browser microphone capture works on `localhost` with user permission; a deployed version would need HTTPS. A video demo and repository satisfy the rule's stated demo options. If time permits, a public preview can be added later without changing the core flow. [Browser microphone requirements](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) · [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)

### Suggested repository layout

```text
one-tree-two-visits/
  src/
    app/
      page.tsx             # place list and introduction
      places/[id]/page.tsx # spoken card, reflection, timeline
      api/                 # Node.js Route Handlers
    components/
      ReflectionRecorder.tsx
      FieldCard.tsx
      PlaceTimeline.tsx
    lib/
      db.ts               # SQLite schema and queries
      schemas.ts          # Zod request and model-output validation
      gemma.ts            # Ollama adapter
      backboard.ts        # add/search memory adapter
      elevenlabs.ts       # speech and transcription adapters
      prompts.ts          # card and comparison instructions
  data/                   # database and generated audio (gitignored)
  tests/                  # focused service and flow tests
  docs/demo-script.md
  README.md
  .env.example
```

### Data model

- `places`: `id`, `nickname`, `setting`, `created_at`, `backboard_assistant_id`.
- `visits`: `id`, `place_id`, `ordinal`, `card_json`, `audio_path`, `status`, `created_at`, `completed_at`.
- `observations`: `id`, `visit_id`, `note_text`, `input_method` (`speech` or `typed`), `created_at`, `backboard_memory_id` (nullable).

SQLite is the source of truth for the user-facing record. Backboard provides semantic retrieval for the next prompt. If Backboard add fails, mark the observation as pending memory sync and allow retry; do not lose the note.

### Core server actions

1. `POST /api/places`: validate nickname and setting; create place and Backboard assistant; store assistant ID.
2. `POST /api/places/{id}/visits`: search Backboard memory if a prior observation exists; call Gemma; validate the card; synthesize ElevenLabs audio; persist visit.
3. `POST /api/visits/{id}/transcribe`: accept a short browser recording, send it to ElevenLabs Scribe, and return editable transcript text without saving the raw audio.
4. `POST /api/visits/{id}/observation`: save only confirmed text in SQLite; add concise Backboard memory; save returned memory ID or pending-sync state.
5. `GET /api/places/{id}`: return timeline, latest audio, and comparison when two observations exist.
6. Retry actions for speech and memory recover from external service failures without duplicate visits or notes.

Use Next.js App Router with TypeScript throughout. Server components render the place and timeline views; a small client component uses `getUserMedia` and `MediaRecorder` for microphone capture. Route Handlers run in the Node.js runtime so API keys and local SQLite access stay server-side. Validate user input and Gemma JSON with Zod. No Python service or Python code is part of the product.

### Configuration

`OLLAMA_MODEL=gemma3:4b`, `OLLAMA_BASE_URL`, `BACKBOARD_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `DATABASE_PATH`, and `AUDIO_DIR`. `.env.example` contains names only; `.env`, the database, recordings, and generated audio are gitignored.

## 11. Build sequence and schedule

Assume one builder starting on 9 October. The sequence prioritizes a working two-visit story before presentation polish.

| When | Deliverable | Exit condition |
| --- | --- | --- |
| **9 Oct** | New Next.js/TypeScript repository, SQLite schema, Ollama adapter, first-card page. | Generate a valid first card from the local open-weight model. |
| **10 Oct morning** | Backboard assistant creation, memory add/search, second-card generation. | A saved first note changes the second card using retrieved memory. |
| **10 Oct afternoon/evening** | ElevenLabs speech and Scribe transcription, desktop microphone flow, clear error states; make the first real outdoor visit. | First spoken reflection and a short outdoor clip are recorded. |
| **11 Oct morning** | Return to the same place for visit two; capture a short clip/photo and note. | Both visits appear in the app timeline with an honest before/after story. |
| **11 Oct afternoon** | Fix observed issues, README, setup test, video demo, DEV post draft. | A fresh setup can follow README; video shows complete flow and partner proof. |
| **Before 12 Oct 12:29 PM IST** | Publish DEV post using official template and required tags. | Post has repo link, demo, open-AI explanation, category names, and real field-test findings. |

The user reports $5 in Backboard credits and has shown an ElevenLabs free-plan balance of 10,000 credits. Verify both API keys and actual available balances before the first integration test. Do not upgrade to a paid plan as part of the MVP.

## 12. Verification plan

Run a complete two-visit flow with a test place and known note before the real outing. Verify that the second prompt includes a specific first-note detail; inspect the displayed Backboard retrieval, not just the model's output. Test one failed Backboard call and one failed ElevenLabs call to confirm notes remain intact and retries work. Check microphone permission, recording, transcription review, and playback in the actual desktop browser used for the demo. Finally, run the project from a clean environment using the README instructions and inspect the repository for leaked secrets or generated personal data.

## 13. Submission story and proof

The DEV post should answer these questions in order:

1. **Who is it for?** Someone whose spare moments are filled with content and who wants room to feel bored, think, and notice their surroundings again.
2. **What did I actually do?** Show the chosen place, two visits, short notes, and time spent outdoors.
3. **What did the AI contribute?** Show the first note, Backboard retrieval, and a second prompt that uses the detail.
4. **Why open AI?** Demonstrate Gemma running locally through Ollama and explain model control, reproducibility, and what remains hosted.
5. **Why these partners?** Backboard carries the place memory; ElevenLabs speaks the pre-walk prompt and transcribes the reflection after the walk.
6. **What failed or changed?** Include one honest limitation or iteration from the field test.

Use the official template and required `#devchallenge` and `#hf26challenge` tags. List the target categories by their exact names. Link to the new repository and a short video showing the real field activity plus the app. Avoid claiming the app works fully offline or keeps all data local.

## 14. Risks and decisions

| Risk | Mitigation |
| --- | --- |
| Local 4B model is too slow for the available laptop. | Keep the model adapter configurable; test a smaller open-weight model early. Record actual latency in the write-up. |
| Backboard memory returns an irrelevant note. | Search only the selected place's assistant; include place and visit metadata; show retrieved text and use a relevance check before generation. |
| Voice API or credits fail. | Preserve the text card and note; retry synthesis later. Do not list ElevenLabs as a prize category without a working demonstrated integration. |
| Microphone access or transcription fails. | Keep typed reflection available; retain the recording in browser memory long enough to retry or download it, then discard it when the user leaves the flow. |
| Second visit is too similar to the first. | Require the generated card to quote or paraphrase one first-note detail and ask a different observation question; validate this manually in the demo. |
| Build scope crowds out the real outdoor test and write-up. | Cut P1 features first. Reserve 11 October for two visits and the submission. |
| Cloud-memory privacy claim is misleading. | Explain clearly that concise text notes go to Backboard; use place nicknames and avoid GPS. |

## 15. Confirmed decisions and remaining checks

- **Device:** M4 MacBook Air with 16 GB memory. `gemma3:4b` should fit based on its published 3.4 GB model size; actual speed remains to be measured after Ollama installation.
- **Credits:** User reports $5 Backboard credits; the supplied ElevenLabs screenshot shows 10,000 free-plan credits available. Verify working keys and balances at integration time.
- **Place:** User has selected a real place for the two visits. Its exact location does not need to appear in the app or repository.
- **Photos:** Defer user-uploaded photos to the later-stage scrapbook. Real outdoor clips or photos may still document the contest demo.
- **Platform:** Desktop browser on the MacBook. The intended walk happens without a phone or other screen.

The P0 flow remains a named place, two observations, memory-guided second card, pre-walk audio, post-walk speech transcription, and an honest field-tested submission.

## 16. Later stages: place scrapbook

After the contest MVP, each place can become a quiet personal scrapbook rather than a one-off challenge. Its page would show a dated timeline of visits, the original field cards, edited reflections, and optional photos. Photos should stay in local storage by default and require an explicit choice before any hosted service receives them.

A per-place visit count or gentle streak can acknowledge that the user returned. It should reward attention without pushing daily engagement: no punishment for a missed day, urgency notifications, leaderboard, or requirement to post. A useful later metric is *number of distinct visits to the same place*, not time spent in the app. The scrapbook remains secondary to the walk and to the user's own words.
