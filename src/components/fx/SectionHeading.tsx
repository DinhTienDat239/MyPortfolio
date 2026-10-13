import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface Props {
  chapter: string;      // "01"
  kicker: string;       // "Selected Work"
  title: string;        // "The Crypt"
  intro?: string;
  align?: 'left' | 'center';
  className?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/** Tiêu đề chương: số La Mã/chương + chữ trượt lên từ sau mặt nạ, từng từ một. */
export default function SectionHeading({ chapter, kicker, title, intro, align = 'left', className }: Props) {
  const words = title.split(' ');
  return (
    <div className={cn('mb-14 md:mb-20', align === 'center' && 'text-center', className)}>
      <motion.p
        initial={{ opacity: 0, x: align === 'center' ? 0 : -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: EASE }}
        className={cn('mb-5 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.35em] text-blood-400', align === 'center' && 'justify-center')}
      >
        <span className="text-fog">Chapter {chapter}</span>
        <span className="h-px w-10 bg-blood-600" />
        {kicker}
      </motion.p>

      <h2 className="font-display text-5xl font-bold leading-[0.95] text-bone md:text-7xl" aria-label={title}>
        {words.map((w, i) => (
          <span key={i} aria-hidden className="mr-[0.25em] inline-block overflow-hidden pb-[0.08em] align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: '110%' }}
              whileInView={{ y: '0%' }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.1 + i * 0.08 }}
            >
              {w}
            </motion.span>
          </span>
        ))}
      </h2>

      {intro && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}
          className={cn('mt-6 max-w-2xl text-base leading-relaxed text-fog md:text-lg', align === 'center' && 'mx-auto')}
        >
          {intro}
        </motion.p>
      )}
    </div>
  );
}
