import { useState } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, RotateCcw, Smartphone } from 'lucide-react';
import { asset } from '../../data';
import { cn } from '../../lib/utils';
import { play } from '../../lib/sound';
import { Sprite } from '../pixel/Sprite';

interface Props {
  src: string;
  title: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Máy chơi game cầm tay pixel chạy playable thật. Iframe chỉ tải khi bấm "Power on"
 * vì mỗi playable nặng 2–5MB.
 */
export default function PlayableFrame({ src, title, orientation = 'portrait' }: Props) {
  const [on, setOn] = useState(false);
  const [mode, setMode] = useState(orientation);
  const [reloadKey, setReloadKey] = useState(0);
  const url = asset(src)!;
  const portrait = mode === 'portrait';

  return (
    <div className="flex flex-col items-center">
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 170, damping: 22 }}
        className={cn('px-panel relative bg-rock-2 p-4 pb-5', portrait ? 'w-[min(380px,86vw)]' : 'w-[min(880px,92vw)]')}
      >
        {/* đèn nguồn */}
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="font-label text-[10px] uppercase text-mist">Pocket-Cave</span>
          <span className="flex items-center gap-2 font-label text-[9px] uppercase text-mist">
            <span className={cn('h-2 w-2', on ? 'bg-uncommon animate-blink' : 'bg-ruby/60')} /> {on ? 'On' : 'Off'}
          </span>
        </div>
        <div className={cn('px-slot relative overflow-hidden bg-void', portrait ? 'aspect-[9/16]' : 'aspect-[16/9]')}>
          {on ? (
            <iframe key={reloadKey} src={url} title={title} allow="autoplay; fullscreen" className="h-full w-full border-0" />
          ) : (
            <button
              onClick={() => {
                play('chime');
                setOn(true);
              }}
              data-cursor
              className="bg-tile-stone group absolute inset-0 flex flex-col items-center justify-center gap-5"
            >
              <Sprite name="gem" size={64} className="animate-bob" />
              <span className="px-btn">▶ Power on</span>
              <span className="font-label text-[9px] uppercase text-mist">Loads the real build (~3MB)</span>
            </button>
          )}
        </div>
        {/* D-pad + nút trang trí */}
        <div aria-hidden className="mt-4 flex items-center justify-between px-3">
          <div className="relative h-12 w-12">
            <span className="absolute left-4 top-0 h-12 w-4 bg-ink" />
            <span className="absolute left-0 top-4 h-4 w-12 bg-ink" />
          </div>
          <div className="flex gap-3">
            <span className="h-7 w-7 rounded-full bg-ruby shadow-[inset_0_-3px_0_0_rgb(0_0_0/0.35)]" />
            <span className="mt-3 h-7 w-7 rounded-full bg-gold shadow-[inset_0_-3px_0_0_rgb(0_0_0/0.35)]" />
          </div>
        </div>
      </motion.div>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button onClick={() => setMode(portrait ? 'landscape' : 'portrait')} className="px-btn-stone !py-2">
          <Smartphone className={cn('h-4 w-4 transition-transform', !portrait && 'rotate-90')} /> {portrait ? 'Landscape' : 'Portrait'}
        </button>
        {on && (
          <button onClick={() => setReloadKey((k) => k + 1)} className="px-btn-stone !py-2">
            <RotateCcw className="h-4 w-4" /> Restart
          </button>
        )}
        <a href={url} target="_blank" rel="noopener noreferrer" className="px-btn-stone !py-2">
          <ExternalLink className="h-4 w-4" /> Fullscreen
        </a>
      </div>
    </div>
  );
}
