/**
 * Particle / confetti engine dùng chung — 1 canvas toàn màn hình, tự dừng rAF khi hết hạt.
 *   burst(x, y)            — nổ hạt nhỏ khi click
 *   confetti(x, y)         — pháo giấy
 *   explode(rect)          — nổ tung cả một vùng (form gửi thành công)
 */
type P = {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number; color: string;
  shape: 'dot' | 'rect' | 'spark'; rot: number; vr: number; g: number; drag: number;
};

/** Đơn sắc sáng — mọi chỗ bắn hạt (Contact, mini-game ở footer) đều nằm trên nền đen. Hạt là pixel vuông. */
const PALETTE = ['#ffffff', '#ffffff', '#bbbbbb', '#777777'];

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let parts: P[] = [];
let raf = 0;
let dpr = 1;

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ensure() {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '100' });
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas!.width = innerWidth * dpr;
    canvas!.height = innerHeight * dpr;
  };
  resize();
  window.addEventListener('resize', resize);
}

function tick() {
  if (!ctx || !canvas) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter((p) => p.life < p.max);
  for (const p of parts) {
    p.life++;
    p.vx *= p.drag;
    p.vy = p.vy * p.drag + p.g;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    const a = 1 - p.life / p.max;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = a > 0.35 ? 1 : a / 0.35; // tắt "cứng" kiểu arcade
    if (p.shape === 'dot' || p.shape === 'spark') {
      // pixel vuông, bám lưới 2px cho cảm giác 8-bit
      const s = Math.max(2, Math.round((p.size * (p.shape === 'spark' ? 1.6 : 2)) / 2) * 2);
      ctx.fillRect(Math.round(p.x / 2) * 2 - s / 2, Math.round(p.y / 2) * 2 - s / 2, s, s);
    } else {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.cos(p.rot * 2));
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
  if (parts.length) raf = requestAnimationFrame(tick);
  else {
    raf = 0;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
}

function spawn(list: P[]) {
  if (reduced()) return;
  ensure();
  parts.push(...list);
  if (parts.length > 900) parts.splice(0, parts.length - 900);
  if (!raf) raf = requestAnimationFrame(tick);
}

const pick = <T,>(a: T[]) => a[(Math.random() * a.length) | 0];

export function burst(x: number, y: number, n = 14, colors = PALETTE) {
  spawn(
    Array.from({ length: n }, () => {
      const ang = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * 4;
      return {
        x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        life: 0, max: 28 + Math.random() * 18, size: 1.5 + Math.random() * 2,
        color: pick(colors), shape: 'spark' as const, rot: 0, vr: 0, g: 0.06, drag: 0.92,
      };
    }),
  );
}

function confetti(x: number, y: number, n = 120) {
  spawn(
    Array.from({ length: n }, () => {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
      const sp = 7 + Math.random() * 10;
      return {
        x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        life: 0, max: 90 + Math.random() * 60, size: 6 + Math.random() * 6,
        color: pick(PALETTE), shape: 'rect' as const, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, g: 0.22, drag: 0.975,
      };
    }),
  );
}

/** Nổ tung một vùng (DOMRect): hạt bắn ra từ khắp bề mặt phần tử. */
export function explode(r: DOMRect, n = 260) {
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  spawn(
    Array.from({ length: n }, () => {
      const x = r.left + Math.random() * r.width;
      const y = r.top + Math.random() * r.height;
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.hypot(dx, dy) || 1;
      const sp = 3 + Math.random() * 9;
      return {
        x, y, vx: (dx / d) * sp, vy: (dy / d) * sp - 2,
        life: 0, max: 60 + Math.random() * 50, size: 1.5 + Math.random() * 3,
        color: pick(PALETTE), shape: Math.random() < 0.6 ? ('dot' as const) : ('spark' as const),
        rot: 0, vr: 0, g: 0.12, drag: 0.95,
      };
    }),
  );
  confetti(cx, cy, 80);
}
