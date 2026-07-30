#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const target = resolve(process.argv[2] ?? ".");
const ignored = new Set([
  ".git",
  ".next",
  ".wrangler",
  "coverage",
  "dist",
  "node_modules",
  "test",
  "tests",
  "__tests__",
]);

async function collectFiles(directory, result = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await collectFiles(path, result);
    else if (/\.(?:js|jsx|mjs|ts|tsx)$/.test(entry.name)) result.push(path);
  }
  return result;
}

try {
  if (!(await stat(target)).isDirectory()) throw new Error("Target is not a directory.");
} catch (error) {
  console.error(`Cannot inspect ${target}: ${error.message}`);
  process.exit(1);
}

const files = await collectFiles(target);
const source = (
  await Promise.all(files.map((file) => readFile(file, "utf8")))
).join("\n");

const checks = [
  ["microphone permission", /getUserMedia\s*\(/],
  ["browser audio recording", /\bMediaRecorder\b/],
  ["audio-time cue sync", /currentTime/],
  ["playback-rate control", /playbackRate|setSpeed|onSpeed/],
  ["transcript data", /\btranscript\b|\bcues\b/],
  ["pause control", /\bpause\b/i],
  ["local learning state", /localStorage|indexedDB/i],
];

let failed = 0;
for (const [label, pattern] of checks) {
  const passed = pattern.test(source);
  console.log(`${passed ? "PASS" : "FAIL"}  ${label}`);
  if (!passed) failed += 1;
}

const manualPaging = /Next sentence\s*(?:→|->)/i.test(source);
console.log(`${manualPaging ? "FAIL" : "PASS"}  no manual shadow sentence paging`);
if (manualPaging) failed += 1;

console.log(`\n${checks.length + 1 - failed}/${checks.length + 1} structural checks passed.`);
process.exit(failed ? 1 : 0);
