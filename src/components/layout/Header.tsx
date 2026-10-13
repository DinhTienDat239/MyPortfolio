import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, Volume2, VolumeX, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { goToSection } from '../../lib/router';
import { setSound, soundOn } from '../../lib/sound';
import { useStore } from '../../lib/store';
import { content } from '../../data';

const LINKS = [
  { id: 'origin', label: 'Origin', n: 'I' },
  { id: 'work', label: 'Crypt', n: 'II' },
  { id: 'arsenal', label: 'Arsenal', n: 'III' },
  ...(content.awards.length ? [{ id: 'trophies', label: 'Trophies', n: 'IV' }] : []),
  { id: 'contact', label: 'Summon', n: content.awards.length ? 'V' : 'IV' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const sound = useStore(soundOn);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    goToSection(id);
  };

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500',
          scrolled ? 'glass-dark py-3' : 'bg-transparent py-6',
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 md:px-8">
          <button
            onClick={() => go('top')}
            className="group flex items-center gap-3"
            aria-label="Back to top"
          >
            <span className="flex h-8 w-8 rotate-45 items-center justify-center border border-blood-600 transition-colors group-hover:bg-blood-600">
              <span className="-rotate-45 font-display text-xs font-black text-bone">{content.profile.alias[0]}</span>
            </span>
            <span className="font-display text-lg font-bold tracking-[0.2em] text-bone">{content.profile.alias.toUpperCase()}</span>
          </button>

          <nav className="hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => go(l.id)}
                className="group relative font-mono text-xs uppercase tracking-[0.25em] text-fog transition-colors hover:text-bone"
              >
                <span className="mr-1.5 text-blood-500/70">{l.n}.</span>
                {l.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-blood-500 transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {content.profile.available && (
              <span className="mr-3 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-fog lg:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-blood-500 animate-pulse-blood" />
                Open for work
              </span>
            )}
            <button
              onClick={() => setSound(!sound)}
              aria-label={sound ? 'Mute sounds' : 'Enable sounds'}
              className="flex h-9 w-9 items-center justify-center border border-ash text-fog transition-colors hover:border-blood-600 hover:text-bone"
            >
              {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center border border-ash text-bone md:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu toàn màn hình */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: 'circle(0% at 100% 0%)' }}
            animate={{ clipPath: 'circle(150% at 100% 0%)' }}
            exit={{ clipPath: 'circle(0% at 100% 0%)' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[70] flex flex-col bg-void px-6 py-6"
          >
            <div className="flex justify-end">
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="flex h-9 w-9 items-center justify-center border border-ash text-bone">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="mt-12 flex flex-col gap-6">
              {LINKS.map((l, i) => (
                <motion.button
                  key={l.id}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.07, ease: [0.22, 1, 0.36, 1], duration: 0.6 }}
                  onClick={() => go(l.id)}
                  className="flex items-baseline gap-4 text-left font-display text-5xl font-bold text-bone active:text-blood-500"
                >
                  <span className="font-mono text-sm text-blood-500">{l.n}</span>
                  {l.label}
                </motion.button>
              ))}
            </nav>
            <p className="mt-auto font-mono text-xs uppercase tracking-[0.3em] text-fog">{content.profile.email}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
