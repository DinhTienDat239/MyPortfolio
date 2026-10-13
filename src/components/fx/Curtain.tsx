import { motion } from 'motion/react';

const EASE = [0.76, 0, 0.24, 1] as const;

/**
 * Chuyển trang kiểu cinematic: 2 tấm màn (đỏ rồi đen) quét qua màn hình.
 * Đặt bên trong <motion.* initial="initial" animate="enter" exit="exit"> — variants lan xuống.
 */
export default function Curtain() {
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[90] bg-blood-600"
        variants={{
          initial: { scaleY: 1, originY: 0 },
          enter: { scaleY: 0, originY: 0, transition: { duration: 0.7, ease: EASE, delay: 0.15 } },
          exit: { scaleY: 1, originY: 1, transition: { duration: 0.5, ease: EASE } },
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[91] bg-void"
        variants={{
          initial: { scaleY: 1, originY: 0 },
          enter: { scaleY: 0, originY: 0, transition: { duration: 0.7, ease: EASE } },
          exit: { scaleY: 1, originY: 1, transition: { duration: 0.5, ease: EASE, delay: 0.12 } },
        }}
      />
    </>
  );
}
