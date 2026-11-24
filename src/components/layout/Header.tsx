import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { useState } from 'react';
import { content } from '../../data';
import { scrollTo } from '../../lib/scroll';
import { cn } from '../../lib/utils';

const NAV = [
  { id: 'work', label: 'Playables' },
  { id: 'experience', label: 'Experience' },
  { id: 'ventures', label: 'Ventures' },
  { id: 'awards', label: 'Awards' },
  { id: 'contact', label: 'Contact' },
];

export default function Header() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  // Cuộn xuống → header trượt đi để không đè lên nội dung; cuộn lên một chút → hiện lại.
  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 8);
    if (Math.abs(y - prev) < 4) return;
    setHidden(y > 160 && y > prev);
  });

  const go = (id: string) => {
    setOpen(false);
    scrollTo(`#${id}`, -64);
  };

  return (
    <>
      {/* mix-blend-difference: chữ trắng tự đảo thành đen trên nền trắng, giữ trắng trên nền đen */}
      <header
        className={cn(
          'pointer-events-none fixed inset-x-0 top-0 z-50 text-white mix-blend-difference transition-[padding,transform] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]',
          scrolled ? 'py-0' : 'py-2',
          hidden && !open && '-translate-y-full',
        )}>
        <nav className="pointer-events-auto mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:px-8">
          <button onClick={() => scrollTo(0)} className="text-[15px] font-medium tracking-tight">
            {content.profile.fullName}
          </button>
          <ul className="hidden items-center gap-8 text-[15px] md:flex">
            {NAV.map((n) => (
              <li key={n.id}>
                <button onClick={() => go(n.id)} className="link text-white/70 transition-colors hover:text-white">
                  {n.label}
                </button>
              </li>
            ))}
          </ul>
          <button onClick={() => setOpen((o) => !o)} className="text-[15px] md:hidden" aria-expanded={open}>
            {open ? 'Close' : 'Menu'}
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 top-16 z-40 bg-bg px-5 pt-10 md:hidden"
          >
            <ul className="space-y-1">
              {NAV.map((n) => (
                <li key={n.id}>
                  <button onClick={() => go(n.id)} className="py-2 text-4xl font-medium tracking-tight">
                    {n.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
