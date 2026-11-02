/**
 * Decorative hexagon grid for the title slide, echoing the hexagons in the
 * College of Computer Studies logo. Pure SVG, faint, and behind the text.
 */

const SIZE = 46; // hexagon radius
const W = Math.sqrt(3) * SIZE;
const H = 1.5 * SIZE;

function hexPath(cx: number, cy: number, r: number): string {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
  });
  return `M${pts.join("L")}Z`;
}

// A loose cluster that fades out toward the left: keep cells whose column is far enough right.
const CELLS: { d: string; filled: boolean }[] = [];
for (let row = 0; row < 9; row++) {
  for (let col = 0; col < 9; col++) {
    const cx = col * W + (row % 2 ? W / 2 : 0);
    const cy = row * H;
    const keep = col + (row % 3) * 0.6 > 3.2 && (col * 7 + row * 11) % 5 !== 0;
    if (keep) CELLS.push({ d: hexPath(cx, cy, SIZE - 4), filled: (col * 3 + row * 5) % 7 === 0 });
  }
}

export function HexPattern() {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${9 * W} ${9 * H}`}
      preserveAspectRatio="xMaxYMid slice"
      className="pointer-events-none absolute inset-y-0 right-0 h-full w-[55%] opacity-60"
    >
      <defs>
        <linearGradient id="hex-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {CELLS.map((c, i) => (
        <path
          key={i}
          d={c.d}
          fill={c.filled ? "#d6eef5" : "none"}
          stroke="#8fd0e2"
          strokeWidth="2"
        />
      ))}
      <rect x="0" y="0" width={9 * W} height={9 * H} fill="url(#hex-fade)" />
    </svg>
  );
}
