export type SentenceTiming = {
  start: number;
  end: number;
};

export function buildSentenceTimings(
  transcript: string[],
  duration: number,
): SentenceTiming[] {
  if (!transcript.length || duration <= 0) return [];

  const weights = transcript.map((sentence) => {
    const words = sentence.trim().split(/\s+/).filter(Boolean).length;
    const pauseWeight = /[!?]$/.test(sentence)
      ? 2.2
      : /[.]$/.test(sentence)
        ? 1.5
        : 1;
    return Math.max(2.5, words + pauseWeight);
  });
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  let elapsed = 0;

  return weights.map((weight, index) => {
    const start = elapsed;
    elapsed += (weight / totalWeight) * duration;
    return {
      start,
      end: index === weights.length - 1 ? duration : elapsed,
    };
  });
}

export function sentenceIndexAtTime(
  timings: SentenceTiming[],
  time: number,
): number {
  if (!timings.length) return 0;
  const safeTime = Math.max(0, time);
  const index = timings.findIndex((timing) => safeTime < timing.end);
  return index < 0 ? timings.length - 1 : index;
}
