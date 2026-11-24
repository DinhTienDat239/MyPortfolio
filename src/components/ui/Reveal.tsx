import { motion, useInView, useScroll, useTransform, type MotionValue } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export const EASE = [0.25, 1, 0.5, 1] as const;
export const EASE_IO = [0.76, 0, 0.24, 1] as const;

/** Hiện ra nhẹ: mờ → rõ, trượt lên 16px. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Một dòng chữ trượt lên từ sau mép cắt.
 * Theo dõi khung ngoài (luôn nằm đúng chỗ) chứ không phải dòng chữ bên trong — dòng chữ lúc đầu
 * bị đẩy xuống dưới mép cắt nên IntersectionObserver coi như "không thấy" và không bao giờ chạy.
 */
export function MaskLine({ children, className, delay = 0, inView = false }: { children: ReactNode; className?: string; delay?: number; inView?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: '0px 0px -5% 0px' });
  const show = inView ? seen : true;
  return (
    <span ref={ref} className={cn('block overflow-hidden pb-[0.1em] -mb-[0.1em]', className)}>
      <motion.span className="block" initial={{ y: '110%' }} animate={show ? { y: '0%' } : undefined} transition={{ duration: 1.1, ease: EASE_IO, delay }}>
        {children}
      </motion.span>
    </span>
  );
}

/** Đoạn văn sáng dần từng chữ theo vị trí cuộn. */
export function ScrollText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 50%'] });
  const words = text.split(' ');
  return (
    <p ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
          {w}
        </Word>
      ))}
    </p>
  );
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <motion.span aria-hidden style={{ opacity }} className="inline-block whitespace-pre">
      {children}{' '}
    </motion.span>
  );
}

/**
 * Khung section chuẩn — mọi section dùng chung nhịp khoảng cách:
 *   đường kẻ + "(02)  About ........ ghi chú" ở trên, rồi tiêu đề lớn, rồi nội dung.
 */
export function Section({
  id,
  index,
  label,
  note,
  title,
  children,
  className,
}: {
  id: string;
  index: string;
  label: string;
  note?: string;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={className}>
      <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 md:py-28">
        <Reveal>
          <div className="flex items-baseline justify-between gap-6 border-t border-line pt-4 text-sm text-muted">
            <span>
              <span className="tabular-nums">({index})</span>
              <span className="ml-4">{label}</span>
            </span>
            {note && <span className="hidden text-right sm:block">{note}</span>}
          </div>
        </Reveal>
        {title && <h2 className="mt-10 text-[clamp(2.4rem,5.2vw,5rem)] font-medium leading-[0.98] tracking-[-0.04em] md:mt-14">{title}</h2>}
        <div className={title ? 'mt-14 md:mt-20' : 'mt-10 md:mt-14'}>{children}</div>
      </div>
    </section>
  );
}
