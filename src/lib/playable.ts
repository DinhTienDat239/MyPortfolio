/**
 * Chạy playable ad trong trang mà không để CTA "bay" ra store.
 *
 * Playable luôn có nút tải: gọi mraid.open / window.open, hoặc gán location.href (iOS fallback).
 * Ta tải HTML, chèn một shim nhỏ vào đầu <head> rồi render bằng srcdoc:
 *  - window.open → báo về trang cha thay vì mở tab
 *  - click <a href="http…"> → chặn, báo về trang cha
 *  - beforeunload (khi playable tự điều hướng location) → báo về trang cha để mount lại
 * mraid giữ nguyên là undefined để playable chạy đúng nhánh "trình duyệt" như lúc QA.
 * Iframe còn được sandbox (không allow-popups / allow-top-navigation) làm lớp chặn cuối.
 */

export const CTA_MESSAGE = '__portfolio_playable_cta';

const SHIM = `<script>(function(){
var K=${JSON.stringify(CTA_MESSAGE)};
function cta(u,nav){try{parent.postMessage({type:K,url:String(u||''),nav:!!nav},'*')}catch(e){}}
window.open=function(u){cta(u);return null};
document.addEventListener('click',function(e){var t=e.target,a=t&&t.closest&&t.closest('a[href]');if(a&&/^https?:/i.test(a.href)){e.preventDefault();cta(a.href)}},true);
window.addEventListener('beforeunload',function(){cta('',true)});
})();</script>`;

const cache = new Map<string, Promise<string>>();

function inject(html: string, baseUrl: string): string {
  const head = `<base href="${baseUrl}">${SHIM}`;
  const m = html.match(/<head[^>]*>/i);
  if (m && m.index !== undefined) {
    const at = m.index + m[0].length;
    return html.slice(0, at) + head + html.slice(at);
  }
  // Không có <head>: chèn sau <!doctype>/<html> để không rơi vào quirks mode
  const d = html.match(/^\s*(<!doctype[^>]*>)?\s*(<html[^>]*>)?/i);
  const at = d ? d[0].length : 0;
  return html.slice(0, at) + `<head>${head}</head>` + html.slice(at);
}

/** HTML đã chèn shim, cache theo URL để Restart / chuyển qua lại không tải lại 3–5 MB. */
export function loadPlayable(url: string): Promise<string> {
  let p = cache.get(url);
  if (!p) {
    const abs = new URL(url, window.location.href).href;
    p = fetch(abs)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((html) => inject(html, abs));
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p;
}

/** "App Store" / "Google Play" / "the store" từ URL mà playable định mở. */
export function storeName(url: string): string {
  if (/apple\.com|itunes/i.test(url)) return 'the App Store';
  if (/play\.google|market:/i.test(url)) return 'Google Play';
  return 'the store';
}
