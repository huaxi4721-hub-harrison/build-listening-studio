# Resilient lesson library

Use this pattern when a listening site needs more than a demo lesson and upstream publishers may
reject server-side requests.

## Bundled starter

The skill ships:

- `assets/library/static-episodes.ts`: 15 screened VOA lessons in six collections;
- `assets/library/route.ts`: a Next.js/Vinext route that merges the verified baseline with live
  VOA and NASA results.

Copy both files into `app/api/library/` when the host project does not already have a library
implementation. If a custom route exists, merge the data model and fallback behavior rather than
overwriting unrelated logic.

The verified snapshot contains:

- Everyday Grammar;
- Science & Technology;
- Arts & Culture;
- Words and Their Stories;
- Education Tips;
- American Stories.

The live NASA adapter adds Curious Universe episodes when the official feed and transcript pages
are reachable. At the 2026-07-30 verification, the combined deployed API returned 21 lessons in
seven collections, with no missing media URLs or transcripts.

## Merge contract

1. Load the static screened baseline first.
2. Fetch current official feeds and pages with bounded candidate counts.
3. Validate audio, transcript, duration, and rights before applying collection limits.
4. Insert live lessons after baseline lessons in a map keyed by stable lesson ID so a current
   result replaces the snapshot value without creating duplicates.
5. Return the baseline even when every remote request fails.
6. Cache successful responses for a bounded period and keep stale data available during transient
   publisher outages.

Do not slice a feed before transcript validation. A publisher may expose a same-title article page
and audio-only page; group candidates by normalized title and prefer a slugged article page with a
description before fetching the transcript.

## Three-minute study boundary

Set `duration` to the coherent study excerpt and retain `originalDuration`. Stop the player at the
study duration. Clip the reference transcript to the same opening segment; do not expose a full
transcript for audio the learner cannot hear.

## Refresh procedure

1. Re-fetch official English-language source pages.
2. Reject AP, Reuters, AFP, or other syndicated material even if it appears on VOA.
3. Confirm each media URL still plays and each source page still contains the matching text.
4. Confirm the study boundary is at most 180 seconds and the transcript contains at least three
   usable sentences.
5. Update the static baseline only after the new entry passes all checks.
6. Run `node scripts/validate-bundled-library.mjs`.
7. Build the host project and call its deployed `/api/library` endpoint.
8. Count lessons and collections in the deployed response; local success alone is insufficient
   because publisher access can differ in a serverless runtime.

The bundle has no API keys. Keep any future speech, dictionary, or storage credentials in the host
platform's server-side environment rather than in Skill assets.
