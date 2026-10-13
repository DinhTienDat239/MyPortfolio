import { useEffect, useState } from 'react';
import { scrollToTarget } from '../components/fx/SmoothScroll';

/**
 * Hash router tối giản: #/  và  #/work/<slug>
 * Dùng hash để chạy trên GitHub Pages (không có server rewrite) và
 * mở được ở bất kỳ đường dẫn nào, không cần cấu hình base.
 */
const read = () => window.location.hash.replace(/^#/, '') || '/';

export function useRoute() {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function matchWork(route: string): string | null {
  const m = route.match(/^\/work\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function navigate(to: string) {
  window.location.hash = to;
}

// ---- Cuộn tới section, kể cả khi đang ở trang case study ----
let pendingSection: string | null = null;
let savedHomeScroll: number | null = null;

export function goToSection(id: string) {
  if (matchWork(read())) {
    pendingSection = id;
    navigate('/');
  } else {
    scrollToTarget(`#${id}`);
  }
}

/** Gọi khi rời trang chủ sang case study, để bấm Back quay về đúng chỗ. */
export function rememberHomeScroll() {
  savedHomeScroll = window.scrollY;
}

/** HomePage gọi khi mount: trả về section cần tới hoặc vị trí cuộn cũ. */
export function consumeHomeTarget(): { section?: string; y?: number } {
  const section = pendingSection ?? undefined;
  const y = savedHomeScroll ?? undefined;
  pendingSection = null;
  savedHomeScroll = null;
  return section ? { section } : { y };
}
