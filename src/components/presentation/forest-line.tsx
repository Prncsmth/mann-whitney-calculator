/**
 * Decorative misty treeline (pure SVG, no images). Two layers of pines:
 * a faint, distant row and a darker near row, fading into the fog.
 */

function pine(x: number, base: number, h: number): string {
  // Three stacked triangles plus a short trunk.
  const w = h * 0.42;
  const tiers = [
    [0.0, 0.45, 0.55],
    [0.25, 0.72, 0.8],
    [0.5, 1.0, 1.0],
  ];
  const parts = tiers.map(([top, bottom, width]) => {
    const yTop = base - h + top * h;
    const yBottom = base - h + bottom * h;
    const half = (w * width) / 2;
    return `M${x} ${yTop}L${x + half} ${yBottom}L${x - half} ${yBottom}Z`;
  });
  return parts.join("") + `M${x - w * 0.05} ${base}h${w * 0.1}v-${h * 0.06}h-${w * 0.1}Z`;
}

/** Deterministic pseudo-random sequence so the treeline is the same every render. */
function row(count: number, base: number, minH: number, maxH: number, seed: number): string {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  let d = "";
  for (let i = 0; i < count; i++) {
    const x = (i + rand() * 0.8) * (1600 / count);
    d += pine(x, base + rand() * 10, minH + rand() * (maxH - minH));
  }
  return d;
}

const FAR = row(46, 300, 70, 150, 7);
const NEAR = row(28, 320, 120, 230, 23);

export function ForestLine() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1600 320"
      preserveAspectRatio="xMidYMax slice"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[38vh] w-full"
    >
      <defs>
        <linearGradient id="fog-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d1513" stopOpacity="0" />
          <stop offset="1" stopColor="#0d1513" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path d={FAR} fill="#30443c" opacity="0.45" />
      <path d={NEAR} fill="#16231f" opacity="0.85" />
      <rect x="0" y="0" width="1600" height="320" fill="url(#fog-fade)" />
    </svg>
  );
}
