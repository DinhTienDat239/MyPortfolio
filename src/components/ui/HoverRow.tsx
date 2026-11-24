import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * Dòng danh sách: hover → nền đen đổ từ dưới lên, chữ đảo trắng.
 * Chỉ animate transform (scaleY) nên rất nhẹ.
 */
export default function HoverRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('group relative isolate border-b border-line transition-colors duration-500 hover:text-bg', className)}>
      <span
        aria-hidden
        className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-fg transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-y-100"
      />
      {children}
    </div>
  );
}
