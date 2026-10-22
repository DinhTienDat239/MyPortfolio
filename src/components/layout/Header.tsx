import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';
import { content } from '../../data';
import { goToSection } from '../../lib/router';
import { setSound, soundOn } from '../../lib/sound';
import { useStore } from '../../lib/store';
import { currentLayer, LAYERS, ores, QUEST_GOAL } from '../../lib/game';
import { Sprite } from '../pixel/Sprite';

/** Đồng hồ độ sâu: chạy theo vị trí cuộn, hiện tên tầng hiện tại. */
function DepthMeter() {
  const { scrollYProgress } = useScroll();
  const maxDepth = LAYERS[LAYERS.length - 1].depth + 40;
  const depth = useTransform(scrollYProgress, (p) => `-${Math.round(p * maxDepth)}m`);
  const layerId = useStore(currentLayer);
  const layer = LAYERS.find((l) => l.id === layerId) ?? LAYERS[0];
  return (
    <div className="px-slot hidden items-center gap-3 px-3 py-1.5 md:flex">
      <span className="font-label text-[12px] uppercase text-mist">Depth</span>
      <motion.span className="w-14 font-label text-xs text-torch tabular-nums">{depth}</motion.span>
      <span className="h-3 w-px bg-edge" />
      <span className="font-label text-[12px] uppercase text-parchment">{layer.biome}</span>
    </div>
  );
}

function OreCounter() {
  const { total } = useStore(ores);
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (total) setPulse((p) => p + 1);
  }, [total]);
  return (
    <motion.div
      key={pulse}
      initial={pulse ? { scale: 1.25 } : false}
      animate={{ scale: 1 }}
      className="px-slot flex items-center gap-2 px-2.5 py-1"
      title={`Ore mined: ${total}. Quest: ${QUEST_GOAL}`}
    >
      <Sprite name="ore" size={20} />
      <span className="font-label text-xs text-gold tabular-nums">{total}</span>
    </motion.div>
  );
}

export default function Header() {
  const sound = useStore(soundOn);
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <button onClick={() => goToSection('top')} className="px-panel pointer-events-auto flex items-center gap-2.5 px-3 py-2" aria-label="Back to the surface">
          <Sprite name="gem" size={24} />
          <span className="pixel-shadow text-lg font-bold tracking-wider text-parchment">{content.profile.alias.toUpperCase()}</span>
        </button>

        <div className="px-panel pointer-events-auto flex items-center gap-2 p-2">
          <DepthMeter />
          <OreCounter />
          {content.profile.available && (
            <span className="px-slot hidden items-center gap-2 px-2.5 py-1.5 font-label text-[12px] uppercase text-uncommon lg:flex">
              <span className="h-2 w-2 bg-uncommon animate-blink" /> Open for work
            </span>
          )}
          <button
            onClick={() => setSound(!sound)}
            aria-label={sound ? 'Mute sounds' : 'Enable sounds'}
            className="px-slot flex h-8 w-8 items-center justify-center text-parchment hover:text-torch"
          >
            {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
