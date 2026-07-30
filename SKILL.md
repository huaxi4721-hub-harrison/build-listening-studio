---
name: build-listening-studio
description: Build or upgrade interactive English listening-practice websites with a rights-screened lesson library, blind listening, microphone-only retelling and feedback, dictation, sentence calibration, vocabulary capture, and audio-synchronized shadowing. Use for new or existing React, Next.js, Vinext, or similar web projects when the user asks for an English learning site, listening workflow, speech practice, transcript interaction, microphone recording, playback-rate controls, or subtitles that automatically follow audio.
---

# Build Listening Studio

Build a usable listening product, not a decorative course landing page. Preserve the host
project's framework and deployment conventions. Default to a local-first single-user version
unless the user explicitly requests accounts or shared persistence.

## Read only what the task needs

- Read [references/product-spec.md](references/product-spec.md) before changing the learning flow.
- Read [references/implementation-patterns.md](references/implementation-patterns.md) for audio,
  microphone, scoring, storage, or transcript work.
- Read [references/source-policy.md](references/source-policy.md) before adding or refreshing
  lesson sources.
- Reuse [assets/shadow-sync.ts](assets/shadow-sync.ts) when the project needs untimed transcript
  cues.

## Build workflow

1. Inspect the existing package scripts, page structure, audio data model, tests, hosting
   metadata, and working-tree status. Preserve unrelated changes.
2. Confirm the product contract from `product-spec.md`. Do not collapse the six learning stages
   into a generic player.
3. Define one lesson data model containing stable IDs, official source and media URLs, duration,
   rights note, level, accent, and either timed cues or a sentence transcript.
4. Add current lessons only from eligible English-language primary sources. Keep lessons at three
   minutes or less by selecting a coherent excerpt; do not merely truncate audio without matching
   the transcript.
5. Implement the stages in order:
   - choose a lesson;
   - listen once with the transcript hidden;
   - retell by microphone and receive clearly labeled practice feedback;
   - replay and type a full dictation;
   - compare sentence by sentence and save unfamiliar words;
   - shadow continuously while subtitles follow audio time.
6. Keep the main interface in English. Offer Chinese assistance as an optional toggle that does
   not replace the English learning surface.
7. Store personal history, progress, saved words, and preferences locally unless the user asks
   for multi-user persistence.
8. Validate the interaction invariants, build the production output, and publish through the
   project's established host.

## Protect the learning method

- Keep retelling microphone-only. Do not provide an editable textarea fallback that lets the user
  bypass speech.
- Present speech scores as a practice estimate. Separate main idea, details, fluency, and
  independence; never imply clinical or exam-grade validity.
- Keep the first listening transcript-free. Avoid tooltips, previews, or accessibility labels that
  accidentally expose the transcript before calibration.
- Let dictation remain editable because writing is the task in that stage.
- Let calibration support word selection, plain-English definitions, an authoritative dictionary
  link, and automatic vocabulary saving.
- Drive shadowing cues from the media element's `currentTime`. Never use a separate wall-clock
  timer, and never require “next sentence” clicks.
- Preserve play/pause and playback-rate controls. A speed change must not desynchronize cues.

## Handle transcript timing honestly

Prefer official sentence or word timestamps. If only sentence text exists, derive approximate
sentence windows from word count and punctuation using `assets/shadow-sync.ts` or
`scripts/build-cues.mjs`.

Label this fallback as approximate in product documentation or source policy. It keeps cues on the
same media timeline but is not forced alignment. For publication-grade timing, add a server-side
forced-alignment step and store the resulting cues with the lesson.

## Validate before publishing

Run the host project's lint, tests, and production build. Add or update tests that prove:

- microphone capture uses `getUserMedia` and `MediaRecorder`;
- retelling has no editable text fallback;
- the first listening hides the transcript;
- shadowing derives its active sentence from audio time;
- pause and playback-rate controls remain available;
- no manual “next sentence” control exists in shadowing;
- duration limits and source links are present.

Optionally run:

```bash
node scripts/validate-listening-studio.mjs /path/to/project
```

Treat its result as a fast structural check, not a substitute for runtime tests.

## Handoff

Return the working URL first. Summarize the user-visible behavior, validation result, and any
material accuracy limit such as approximate subtitle timing. Do not hide source-rights or browser
speech-recognition constraints.
