/** Độ trễ cho animation đầu trang: chờ preloader chạy xong ở lần vào đầu tiên trong phiên. */
function seen() {
  try {
    return !!sessionStorage.getItem('seen-intro') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export const INTRO_DELAY = seen() ? 0.1 : 1.9;
