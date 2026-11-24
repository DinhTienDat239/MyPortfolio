import { useCallback, useEffect, useRef, useState } from 'react';
import { burst } from '../../lib/particles';
import { storage } from '../../lib/store';

/**
 * Easter egg: mini-game 5 giây — chạm càng nhiều chấm càng tốt.
 * Ẩn sau một dòng chữ nhỏ ở footer; giao diện đơn sắc như phần còn lại của site.
 */
const DURATION = 5000;
const KEY = 'tap-rush-best';
type Dot = { id: number; x: number; y: number };

export default function MiniGame() {
  const [phase, setPhase] = useState<'idle' | 'play' | 'end'>('idle');
  const [dots, setDots] = useState<Dot[]>([]);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(DURATION);
  const [best, setBest] = useState(() => Number(storage.get(KEY) ?? 0));
  const id = useRef(0);
  const scoreRef = useRef(0);

  const spawn = useCallback((): Dot => ({ id: ++id.current, x: 6 + Math.random() * 88, y: 12 + Math.random() * 76 }), []);

  const start = () => {
    scoreRef.current = 0;
    setScore(0);
    setLeft(DURATION);
    setDots([spawn(), spawn(), spawn()]);
    setPhase('play');
  };

  useEffect(() => {
    if (phase !== 'play') return;
    const t0 = performance.now();
    const iv = setInterval(() => {
      const l = Math.max(0, DURATION - (performance.now() - t0));
      setLeft(l);
      if (l > 0) return;
      clearInterval(iv);
      setPhase('end');
      setDots([]);
      if (scoreRef.current > Number(storage.get(KEY) ?? 0)) {
        storage.set(KEY, String(scoreRef.current));
        setBest(scoreRef.current);
      }
    }, 100);
    return () => clearInterval(iv);
  }, [phase]);

  const hit = (d: Dot, e: React.PointerEvent) => {
    scoreRef.current += 1;
    setScore(scoreRef.current);
    burst(e.clientX, e.clientY, 8);
    setDots((list) => [...list.filter((x) => x.id !== d.id), spawn()]);
  };

  return (
    <div className="border border-bg/15">
      <div className="flex justify-between border-b border-bg/15 px-4 py-2 text-sm text-bg/50">
        <span>Tap as many dots as you can in 5 seconds</span>
        <span className="tabular-nums">
          {score} · best {best} · {phase === 'play' ? Math.ceil(left / 1000) : 5}s
        </span>
      </div>
      <div className="relative h-56 touch-manipulation select-none">
        {phase === 'play' &&
          dots.map((d) => (
            <button
              key={d.id}
              aria-label="Dot"
              onPointerDown={(e) => hit(d, e)}
              className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bg transition-transform hover:scale-110"
              style={{ left: `${d.x}%`, top: `${d.y}%` }}
            />
          ))}
        {phase !== 'play' && (
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              {phase === 'end' && <p className="mb-3 text-3xl font-medium tracking-tight">{score} points</p>}
              <button onClick={start} className="link text-[15px]">
                {phase === 'idle' ? 'Start' : 'Play again'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
