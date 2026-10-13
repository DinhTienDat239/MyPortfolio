import { useState } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Play, RotateCcw, Smartphone } from 'lucide-react';
import { asset } from '../../data';
import { cn } from '../../lib/utils';
import { play } from '../../lib/sound';

interface Props {
  src: string;
  title: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Khung điện thoại chạy playable thật. Iframe chỉ được tải khi người xem bấm
 * "Awaken" — playable nặng 2–5MB nên không tải sẵn.
 */
export default function PlayableFrame({ src, title, orientation = 'portrait' }: Props) {
  const [awake, setAwake] = useState(false);
  const [mode, setMode] = useState(orientation);
  const [reloadKey, setReloadKey] = useState(0);
  const url = asset(src)!;
  const portrait = mode === 'portrait';

  return (
    <div className="flex flex-col items-center">
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 160, damping: 22 }}
        className={cn(
          'relative rounded-[2.2rem] border border-ash bg-void p-3 shadow-blood-lg',
          portrait ? 'aspect-[9/17] w-[min(360px,82vw)]' : 'aspect-[16/9] w-[min(820px,92vw)]',
        )}
      >
        {/* tai thỏ */}
        <div className={cn('absolute z-10 rounded-full bg-ash', portrait ? 'left-1/2 top-5 h-1.5 w-16 -translate-x-1/2' : 'left-5 top-1/2 h-16 w-1.5 -translate-y-1/2')} />
        <div className="relative h-full w-full overflow-hidden rounded-[1.6rem] bg-crypt">
          {awake ? (
            <iframe
              key={reloadKey}
              src={url}
              title={title}
              allow="autoplay; fullscreen"
              className="h-full w-full border-0"
            />
          ) : (
            <button
              onClick={() => {
                play('thud');
                setAwake(true);
              }}
              data-cursor="play"
              className="group absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[radial-gradient(circle,rgb(255_0_51/0.18),transparent_65%)]"
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full border border-blood-500 text-blood-400 transition-all group-hover:scale-110 group-hover:bg-blood-500 group-hover:text-void animate-pulse-blood">
                <Play className="ml-1 h-8 w-8 fill-current" />
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.35em] text-bone">Awaken the playable</span>
            </button>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setMode(portrait ? 'landscape' : 'portrait')}
            className="flex items-center gap-2 border border-ash px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-fog transition-colors hover:border-blood-600 hover:text-bone"
          >
            <Smartphone className={cn('h-3.5 w-3.5 transition-transform', !portrait && 'rotate-90')} />
            {portrait ? 'Landscape' : 'Portrait'}
          </button>
          {awake && (
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="flex items-center gap-2 border border-ash px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-fog transition-colors hover:border-blood-600 hover:text-bone"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Restart
            </button>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border border-ash px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-fog transition-colors hover:border-blood-600 hover:text-bone"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Fullscreen
          </a>
      </motion.div>
    </div>
  );
}
