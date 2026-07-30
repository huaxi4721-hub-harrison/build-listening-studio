# Implementation patterns

## Lesson data

Keep the contract explicit:

```ts
type Cue = { start: number; end: number; text: string };

type Lesson = {
  id: string;
  provider: string;
  collection: string;
  title: string;
  sourceUrl: string;
  mediaUrl: string;
  mediaType: string;
  publishedAt: string;
  duration: number;
  originalDuration: number;
  level: string;
  accent: string;
  rights: string;
  transcript: string[];
  cues?: Cue[];
};
```

Treat `duration` as the study boundary and `originalDuration` as source context.

## Audio state

Use one media element across the learning stages. Keep:

- a media ref;
- `currentTime`;
- playback rate;
- playing/paused state;
- stage completion flags.

Set `media.playbackRate` whenever speed changes. Clamp seeking and time updates to the lesson
duration. Pause at the study boundary.

For shadowing, derive the active cue from `media.currentTime` on `timeupdate` or a throttled
`requestAnimationFrame` loop. Playback rate changes how quickly media time advances in real time,
so cue logic must not multiply time by the rate.

## Untimed transcript fallback

Use official cues when present. Otherwise allocate duration proportionally:

1. Count words in each sentence.
2. Add a small punctuation pause weight.
3. Divide total duration by the total weight.
4. Produce contiguous `[start, end)` windows.
5. Select the first window whose `end` is greater than `currentTime`.

Copy `assets/shadow-sync.ts` or preprocess JSON with `scripts/build-cues.mjs`.

## Microphone retelling

Request `navigator.mediaDevices.getUserMedia({ audio: true })` only from a user click. Record with
`MediaRecorder`. When supported, run Web Speech Recognition in English for a locked automatic
transcript used by the feedback estimator.

Do not make the transcript editable. Provide recording, stop, replay, re-record, and score actions.
Stop all media tracks after recording to release the microphone indicator.

If browser transcription is unavailable, keep the recording and explain that automatic scoring
needs compatible speech recognition. Do not silently convert the task into typing.

## Practice feedback

For a local heuristic:

- extract meaningful reference keywords;
- estimate main-idea coverage;
- measure supporting detail coverage;
- estimate fluency from words per minute and filler frequency;
- penalize long copied runs when evaluating independent expression.

Label the result “Practice estimate”. For stronger scoring, use a server-side speech-to-text and
semantic evaluation service, protect secrets server-side, and retain the same epistemic label.

## Persistence

Persist only preferences and personal learning state in browser storage:

- history records;
- last progress per lesson;
- saved vocabulary;
- translation and speed preferences.

Move to authenticated server storage only when multi-user access is explicitly in scope.
