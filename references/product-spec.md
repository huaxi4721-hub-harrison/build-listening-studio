# Product specification

## Required learning loop

| Stage | Progress | Required behavior |
| --- | ---: | --- |
| Choose | 1% | Show current, rights-screened English lessons grouped by source or collection. |
| Blind listen | 15% | Play at 1.0x by default with 0.5x and other speed options. Hide all transcript text. |
| Retell | 35% | Ask whether the learner wants to retell. Capture English speech from the microphone and score the practice response. |
| Dictation | 65% | Replay with the transcript hidden. Let the learner type a full dictation and repeat this stage before calibration. |
| Calibrate | 85% | Present exact reference sentences one at a time. Let the learner select unknown words, read plain-English explanations, open an authoritative dictionary, and save words. |
| Shadow | 100% | Play continuously, advance subtitles from audio time, allow pause/resume and speed changes, and optionally record a full take. |

## Library

- Prefer lessons of three minutes or less.
- Display title, provider, collection, level, accent, duration, publication date, and source link.
- Refresh current feeds on the server or at a bounded interval; keep a reliable fallback lesson.
- For a shared starter, ship a screened multi-lesson baseline rather than one fallback demo. Merge
  verified live results over it without deleting the baseline during source outages.
- Import only audio with a matching transcript and a documented reuse basis.
- Keep an excerpt and its transcript coherent. Do not cut in the middle of an idea.

## Personal learning state

- Show cumulative completed lessons, saved words, recent lessons, and progress.
- Let the learner reopen history and vocabulary for review.
- Use device-local storage for the first version.
- Do not add registration merely because the product may later support other learners.

## Language and feedback

- Render the product in English by default.
- Offer optional Chinese assistance for instructions, not replacement subtitles during blind
  listening.
- Include concise, non-distracting encouragement.
- Call automated scores estimates and show their components.

## Interaction requirements

- Make every stage usable by keyboard and touch.
- Request microphone permission only after a clear user action.
- Explain recording state and browser limitations.
- Keep play/pause controls visually dominant during shadowing.
- Auto-start shadowing from the user's “Start shadowing” click when browser policy allows it.
- Stop at the lesson or excerpt duration even if the original media file is longer.
