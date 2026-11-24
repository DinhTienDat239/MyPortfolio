/** localStorage có thể ném lỗi (private mode…) → luôn bọc try/catch. */
export const storage = {
  get(key: string) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
};
