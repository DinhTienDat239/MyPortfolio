import { motion } from 'motion/react';

const COLS = 10;
const ROWS = 6;
// độ trễ ngẫu nhiên nhưng cố định cho từng ô → hiệu ứng "tan rã pixel"
const DELAYS = Array.from({ length: COLS * ROWS }, (_, i) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1);

/**
 * Chuyển trang: màn hình lấp đầy/vỡ ra thành các khối đá.
 * Đặt bên trong <motion.* initial="initial" animate="enter" exit="exit">.
 */
export default function Curtain() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90] grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}>
      {DELAYS.map((d, i) => (
        <motion.div
          key={i}
          className="bg-tile-stone -m-px"
          style={{ boxShadow: 'inset 0 0 0 2px rgb(0 0 0 / 0.35)' }}
          variants={{
            initial: { scale: 1 },
            enter: { scale: 0, transition: { duration: 0.18, delay: 0.1 + d * 0.45, ease: 'linear' } },
            exit: { scale: 1, transition: { duration: 0.18, delay: d * 0.35, ease: 'linear' } },
          }}
        />
      ))}
    </div>
  );
}
