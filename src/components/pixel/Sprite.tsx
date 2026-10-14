import { memo } from 'react';
import { SPRITES, spriteRects, type SpriteName } from './sprites';
import { cn } from '../../lib/utils';

interface SpriteProps {
  name: SpriteName;
  /** kích thước hiển thị (px). Nên là bội số của 16 để pixel đều nhau. */
  size?: number;
  className?: string;
  /** đổi màu theo ký tự palette, vd { g: '#5aa8ff' } để có quặng xanh */
  recolor?: Record<string, string>;
  title?: string;
}

/** Vẽ 1 sprite pixel thành SVG sắc nét ở mọi kích thước. */
export const Sprite = memo(function Sprite({ name, size = 32, className, recolor, title }: SpriteProps) {
  const rects = spriteRects(SPRITES[name], recolor);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={cn('shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
      ))}
    </svg>
  );
});

/** Đuốc cháy: 2 khung hình luân phiên + quầng sáng nhấp nháy. */
export function Torch({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('relative inline-block', className)} style={{ width: size, height: size }} aria-hidden>
      <span
        className="absolute rounded-full animate-flicker"
        style={{ inset: -size * 0.6, background: 'radial-gradient(circle, rgb(255 179 71 / 0.35), transparent 65%)' }}
      />
      <Sprite name="torch" size={size} className="frame-a absolute inset-0" />
      <Sprite name="torch2" size={size} className="frame-b absolute inset-0" />
    </span>
  );
}

/** Hạt lấp lánh nhỏ (dấu cộng pixel). */
export function Sparkle({ color = 'var(--color-gold)', size = 12, className, delay = 0 }: { color?: string; size?: number; className?: string; delay?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 3 3" shapeRendering="crispEdges" className={cn('animate-twinkle', className)} style={{ animationDelay: `${delay}s` }} aria-hidden>
      <rect x="1" y="0" width="1" height="3" fill={color} />
      <rect x="0" y="1" width="3" height="1" fill={color} />
    </svg>
  );
}
