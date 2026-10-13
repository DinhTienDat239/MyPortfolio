import { useEffect, useRef, useState } from 'react';
import { animate, useInView } from 'motion/react';

/** "1000+" → đếm 0→1000 rồi giữ hậu tố "+". "10M+" → 0→10 + "M+". Không phải số → hiện nguyên văn. */
export default function Counter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const m = value.match(/^([^\d]*)([\d.,]+)(.*)$/);
  const target = m ? parseFloat(m[2].replace(/,/g, '')) : NaN;
  const decimals = m && m[2].includes('.') ? m[2].split('.')[1].length : 0;
  const [display, setDisplay] = useState(Number.isFinite(target) ? 0 : NaN);

  useEffect(() => {
    if (!inView || !Number.isFinite(target)) return;
    const controls = animate(0, target, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, target]);

  if (!m || !Number.isFinite(target)) return <span ref={ref}>{value}</span>;
  return (
    <span ref={ref} className="tabular-nums">
      {m[1]}
      {display.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {m[3]}
    </span>
  );
}
