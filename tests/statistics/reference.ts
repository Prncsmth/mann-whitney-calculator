/**
 * Independent brute-force reference implementation, used only by tests.
 *
 * It shares NO code with the engine:
 *  - ranks are computed as (#values below) + (#equal values + 1)/2,
 *  - the exact distribution is found by literally listing every C(N, n1) split.
 * Keep inputs small (N ≤ ~16) so enumeration stays fast.
 */

export function referenceRanks(pooled: number[]): number[] {
  return pooled.map((v) => {
    const below = pooled.filter((x) => x < v).length;
    const equal = pooled.filter((x) => x === v).length;
    return below + (equal + 1) / 2;
  });
}

export function referenceU1(a: number[], b: number[]): number {
  // U1 = number of pairs where A > B, plus half of the tied pairs.
  let u = 0;
  for (const x of a) for (const y of b) u += x > y ? 1 : x === y ? 0.5 : 0;
  return u;
}

function* combinations(n: number, k: number, start = 0, chosen: number[] = []): Generator<number[]> {
  if (chosen.length === k) {
    yield chosen;
    return;
  }
  for (let i = start; i <= n - (k - chosen.length); i++) {
    yield* combinations(n, k, i + 1, [...chosen, i]);
  }
}

export function referenceExactPValues(a: number[], b: number[]) {
  const pooled = [...a, ...b];
  const ranks = referenceRanks(pooled);
  const n1 = a.length;
  const n2 = b.length;
  const offset = (n1 * (n1 + 1)) / 2;
  const observed = a.reduce((s, _, i) => s + ranks[i], 0) - offset;
  const mean = (n1 * n2) / 2;
  const eps = 1e-9;

  let total = 0;
  let less = 0;
  let greater = 0;
  let two = 0;
  const distribution = new Map<number, number>();
  for (const combo of combinations(pooled.length, n1)) {
    const u1 = combo.reduce((s, i) => s + ranks[i], 0) - offset;
    total++;
    if (u1 <= observed + eps) less++;
    if (u1 >= observed - eps) greater++;
    if (Math.abs(u1 - mean) >= Math.abs(observed - mean) - eps) two++;
    distribution.set(u1, (distribution.get(u1) ?? 0) + 1);
  }
  return {
    U1: observed,
    less: less / total,
    greater: greater / total,
    twoSided: two / total,
    total,
    distribution,
  };
}

/** Small deterministic random generator so random tests are reproducible. */
export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random integer dataset; small `range` produces many ties. */
export function randomSample(rand: () => number, n: number, range: number, offset = 0): number[] {
  return Array.from({ length: n }, () => Math.floor(rand() * range) + offset);
}
