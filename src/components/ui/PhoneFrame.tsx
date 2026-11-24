import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * Điện thoại vẽ bằng CSS, đơn sắc nhưng có chiều sâu: thân đen, viền sáng mảnh bên trong,
 * dynamic island, nút cạnh. Màn hình được cắt bằng clip-path (không dùng overflow + border-radius)
 * để ảnh scale/transform 3D không bao giờ lòi góc vuông ra ngoài.
 */
export default function PhoneFrame({
  children,
  className,
  style,
  landscape,
  screenClassName,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  landscape?: boolean;
  /** ghi đè tỉ lệ màn hình (mặc định 9/19 dọc · 16/9 ngang) */
  screenClassName?: string;
}) {
  return (
    <div
      className={cn(
        'relative rounded-[13%/6%] bg-[#161616] p-[3.2%] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.09),inset_0_0_0_3px_#0b0b0b]',
        landscape && 'rounded-[6%/13%] p-[1.6%]',
        className,
      )}
      style={style}
    >
      {/* nút cạnh */}
      {!landscape && (
        <>
          <span aria-hidden className="absolute -left-[2px] top-[20%] h-[6%] w-[2px] rounded-l-sm bg-[#2a2a2a]" />
          <span aria-hidden className="absolute -left-[2px] top-[29%] h-[10%] w-[2px] rounded-l-sm bg-[#2a2a2a]" />
          <span aria-hidden className="absolute -right-[2px] top-[25%] h-[13%] w-[2px] rounded-r-sm bg-[#2a2a2a]" />
        </>
      )}
      <div
        className={cn('relative isolate bg-black', landscape ? 'aspect-[16/9]' : 'aspect-[9/19]', screenClassName)}
        style={{ clipPath: landscape ? 'inset(0 round 4.5% / 8%)' : 'inset(0 round 11% / 5.2%)' }}
      >
        {children}
        {!landscape && <span aria-hidden className="pointer-events-none absolute left-1/2 top-[1.6%] z-20 h-[3.4%] w-[30%] -translate-x-1/2 rounded-full bg-black" />}
      </div>
    </div>
  );
}
