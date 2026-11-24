import Lenis from 'lenis';

/**
 * Lenis instance dùng chung. SmoothScroll khởi tạo, các component gọi scrollTo/lockScroll.
 * Lenis vẫn dùng native scroll bên dưới nên useScroll / whileInView của Framer Motion chạy bình thường.
 */
let lenis: Lenis | null = null;

export function initLenis() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
  let raf = 0;
  const loop = (t: number) => {
    lenis?.raf(t);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf);
    lenis?.destroy();
    lenis = null;
  };
}

export function scrollTo(target: string | number, offset = -80) {
  if (typeof target === 'number') {
    if (lenis) lenis.scrollTo(target, { duration: 1.4 });
    else window.scrollTo({ top: target, behavior: 'smooth' });
    return;
  }
  const el = document.querySelector<HTMLElement>(target);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.4 });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: 'smooth' });
}

let locks = 0;
/** Khoá cuộn khi mở modal (đếm lồng nhau). */
export function lockScroll(locked: boolean) {
  locks = Math.max(0, locks + (locked ? 1 : -1));
  const on = locks > 0;
  if (lenis) (on ? lenis.stop() : lenis.start());
  document.documentElement.style.overflow = on ? 'hidden' : '';
}
