#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const target = resolve(
  process.argv[2] ??
    resolve(scriptDirectory, "../assets/library/static-episodes.ts"),
);

let source;
try {
  source = await readFile(target, "utf8");
} catch (error) {
  console.error(`Could not read bundled library: ${error.message}`);
  process.exit(1);
}

const payload = source.match(
  /export const STATIC_VOA_EPISODES\s*=\s*([\s\S]*?)\s+as const;\s*$/,
)?.[1];

if (!payload) {
  console.error("Could not locate STATIC_VOA_EPISODES JSON payload.");
  process.exit(1);
}

let episodes;
try {
  episodes = JSON.parse(payload);
} catch (error) {
  console.error(`Bundled lesson data is not valid JSON: ${error.message}`);
  process.exit(1);
}

const errors = [];
const ids = new Set();
const collections = new Set();

if (!Array.isArray(episodes) || episodes.length < 12) {
  errors.push("expected at least 12 bundled lessons");
}

for (const [index, episode] of episodes.entries()) {
  const label = episode?.id || `lesson ${index + 1}`;
  if (!episode?.id || ids.has(episode.id)) errors.push(`${label}: duplicate or missing id`);
  ids.add(episode?.id);
  if (!episode?.collection) errors.push(`${label}: missing collection`);
  else collections.add(episode.collection);
  if (!/^https:\/\//.test(episode?.sourceUrl ?? "")) {
    errors.push(`${label}: missing HTTPS source URL`);
  }
  if (!/^https:\/\//.test(episode?.mediaUrl ?? "")) {
    errors.push(`${label}: missing HTTPS media URL`);
  }
  if (
    !Number.isFinite(episode?.duration) ||
    episode.duration <= 0 ||
    episode.duration > 180
  ) {
    errors.push(`${label}: invalid study duration`);
  }
  if (
    !Array.isArray(episode?.transcript) ||
    episode.transcript.length < 3 ||
    episode.transcript.some(
      (sentence) => typeof sentence !== "string" || !sentence.trim(),
    )
  ) {
    errors.push(`${label}: incomplete transcript`);
  }
  if (!episode?.rights) errors.push(`${label}: missing rights note`);
}

if (collections.size < 5) errors.push("expected at least five distinct collections");

console.log(`${episodes.length} bundled lessons`);
console.log(`${collections.size} collections`);

if (errors.length) {
  for (const error of errors) console.error(`FAIL  ${error}`);
  process.exit(1);
}

console.log("PASS  bundled library structure and minimum diversity");
