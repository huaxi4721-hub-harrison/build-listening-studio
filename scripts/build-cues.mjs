#!/usr/bin/env node

import { readFile } from "node:fs/promises";

function usage() {
  console.error(
    "Usage: node scripts/build-cues.mjs <transcript.json> <duration-seconds>",
  );
}

function buildCues(transcript, duration) {
  const weights = transcript.map((sentence) => {
    const words = sentence.trim().split(/\s+/).filter(Boolean).length;
    const pause = /[!?]$/.test(sentence) ? 2.2 : /[.]$/.test(sentence) ? 1.5 : 1;
    return Math.max(2.5, words + pause);
  });
  const total = weights.reduce((sum, value) => sum + value, 0);
  let elapsed = 0;

  return transcript.map((text, index) => {
    const start = elapsed;
    elapsed += (weights[index] / total) * duration;
    return {
      start: Number(start.toFixed(3)),
      end: Number(
        (index === transcript.length - 1 ? duration : elapsed).toFixed(3),
      ),
      text,
    };
  });
}

const [transcriptPath, durationValue] = process.argv.slice(2);
const duration = Number(durationValue);

if (!transcriptPath || !Number.isFinite(duration) || duration <= 0) {
  usage();
  process.exit(1);
}

let transcript;
try {
  transcript = JSON.parse(await readFile(transcriptPath, "utf8"));
} catch (error) {
  console.error(`Could not read transcript JSON: ${error.message}`);
  process.exit(1);
}

if (
  !Array.isArray(transcript) ||
  !transcript.length ||
  transcript.some((sentence) => typeof sentence !== "string" || !sentence.trim())
) {
  console.error("Transcript must be a non-empty JSON array of non-empty strings.");
  process.exit(1);
}

process.stdout.write(`${JSON.stringify(buildCues(transcript, duration), null, 2)}\n`);
