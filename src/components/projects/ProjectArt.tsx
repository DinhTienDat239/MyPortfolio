import { cn } from '../../lib/utils';

/** Hash ổn định từ chuỗi → mỗi project có artwork khác nhau nhưng không đổi giữa các lần load. */
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/**
 * Artwork tự sinh khi project chưa có thumbnail: vòng tròn nghi lễ, vạch quét,
 * chữ cái đầu viền đỏ. Thuần SVG/CSS — 0 byte ảnh.
 */
export default function ProjectArt({ title, seed, className }: { title: string; seed: string; className?: string }) {
  const h = hash(seed);
  const rot = h % 360;
  const cx = 30 + (h % 40);
  const cy = 30 + ((h >> 4) % 40);
  const initials = title
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-crypt', className)}>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${cx}% ${cy}%, rgb(255 0 51 / 0.32), transparent 55%), radial-gradient(circle at ${100 - cx}% ${100 - cy}%, rgb(77 0 16 / 0.6), transparent 60%)`,
        }}
      />
      <svg viewBox="0 0 200 125" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <g transform={`rotate(${rot} 100 62.5)`} fill="none" stroke="rgb(255 0 51 / 0.35)" strokeWidth="0.4">
          <circle cx="100" cy="62.5" r="48" />
          <circle cx="100" cy="62.5" r="40" strokeDasharray="2 3" />
          <polygon points="100,18 138,84 62,84" />
          <polygon points="100,107 62,41 138,41" strokeOpacity="0.5" />
        </g>
        {Array.from({ length: 24 }).map((_, i) => (
          <line key={i} x1="0" x2="200" y1={i * 5.2} y2={i * 5.2} stroke="rgb(0 0 0 / 0.35)" strokeWidth="0.6" />
        ))}
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-display text-[5.5rem] font-black leading-none text-transparent"
        style={{ WebkitTextStroke: '1.5px rgb(255 45 85 / 0.85)' }}
      >
        {initials}
      </span>
    </div>
  );
}
