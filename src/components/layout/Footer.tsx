import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { content } from '../../data';
import { scrollTo } from '../../lib/scroll';
import MiniGame from './MiniGame';

export default function Footer() {
  const { profile } = content;
  const [game, setGame] = useState(false);

  return (
    <footer className="bg-fg text-bg">
      <div className="mx-auto max-w-[1400px] px-5 pb-10 sm:px-8">
      <AnimatePresence>
        {game && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="pb-10">
              <MiniGame />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col gap-3 border-t border-bg/15 pt-6 text-sm text-bg/50 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {profile.fullName}
        </p>
        <div className="flex gap-6">
          <button onClick={() => setGame((g) => !g)} className="link hover:text-bg">
            {game ? 'Close game' : 'Got 5 seconds?'}
          </button>
          <button onClick={() => scrollTo(0)} className="link hover:text-bg">
            Back to top ↑
          </button>
        </div>
      </div>
      </div>
    </footer>
  );
}
