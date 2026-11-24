import { useCallback, useEffect, useState } from 'react';

/**
 * Deep-link cho Phone Simulator: #/play/<slug>.
 * Dùng hash để chạy trên GitHub Pages mà không cần server rewrite.
 *
 * Lịch sử trình duyệt: mở simulator thêm đúng MỘT mục; chuyển qua lại giữa các playable
 * thay thế mục đó. Nhờ vậy nút Back luôn đóng simulator thay vì mở lại bản vừa xem.
 */
const read = () => {
  const m = window.location.hash.match(/^#\/play\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
};

const MARK = 'play-modal';

export function usePlayRoute() {
  const [slug, setSlug] = useState<string | null>(read);

  useEffect(() => {
    const onChange = () => setSlug(read());
    window.addEventListener('hashchange', onChange);
    window.addEventListener('popstate', onChange);
    return () => {
      window.removeEventListener('hashchange', onChange);
      window.removeEventListener('popstate', onChange);
    };
  }, []);

  const open = useCallback((s: string) => {
    const url = `${window.location.pathname}${window.location.search}#/play/${encodeURIComponent(s)}`;
    if (read()) history.replaceState(history.state, '', url);
    else history.pushState({ [MARK]: true }, '', url);
    setSlug(s);
  }, []);

  const close = useCallback(() => {
    // Mục lịch sử do chính trang tạo → lùi lại; vào thẳng từ link chia sẻ → chỉ xoá hash.
    if (history.state?.[MARK]) history.back();
    else {
      history.replaceState(null, '', window.location.pathname + window.location.search);
      setSlug(null);
    }
  }, []);

  return { slug, open, close };
}
