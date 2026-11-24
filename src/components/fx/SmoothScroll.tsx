import { useEffect, type ReactNode } from 'react';
import 'lenis/dist/lenis.css';
import { initLenis } from '../../lib/scroll';

/** Smooth scroll quán tính (Lenis). Tự tắt khi bật "reduce motion". */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => initLenis(), []);
  return <>{children}</>;
}
