import { useRef } from 'react';
import { content } from '../../data';
import { goToSection } from '../../lib/router';
import { startTreasureRain } from '../../lib/game';
import { Sprite, Torch } from '../pixel/Sprite';
import { WallBand } from '../fx/Layer';

export default function Footer() {
  const clicks = useRef<number[]>([]);

  // Bí mật: click 3 lần liên tiếp vào viên ngọc ở đáy
  const onGem = () => {
    const now = Date.now();
    clicks.current = [...clicks.current.filter((t) => now - t < 1200), now];
    if (clicks.current.length >= 3) {
      clicks.current = [];
      startTreasureRain('secret');
    }
  };

  return (
    <footer className="relative z-20 overflow-hidden bg-void pb-28">
      {/* Bức tường cuối cùng của hang */}
      <WallBand biome="garden" />
      <div className="bg-void px-5 pt-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-center gap-6">
            <Torch size={48} className="hidden sm:inline-block" />
            <p aria-hidden className="title-glow select-none text-center font-display text-[24vw] leading-none md:text-[14rem]">
              {content.profile.alias.toUpperCase()}
            </p>
            <Torch size={48} className="hidden sm:inline-block" />
          </div>

          <div className="mt-16 flex flex-col items-center justify-between gap-6 font-label text-[13px] uppercase text-mist md:flex-row">
            <p className="flex items-center gap-2">
              © {new Date().getFullYear()} {content.profile.fullName}
              <button onClick={onGem} aria-label="A glinting gem" className="opacity-40 transition-opacity hover:opacity-100">
                <Sprite name="gem" size={16} />
              </button>
            </p>
            <p className="text-mist/60">Hand-placed pixels · React · Three.js</p>
            <button onClick={() => goToSection('top')} className="flex items-center gap-2 hover:text-torch">
              <Sprite name="lantern" size={20} /> Back to surface
            </button>
          </div>
          <p aria-hidden className="mt-8 text-center font-label text-[12px] tracking-[0.4em] text-edge">↑ ↑ ↓ ↓ ← → ← → B A</p>
        </div>
      </div>
    </footer>
  );
}
