import { createStore, storage } from './store';

/**
 * Âm thanh tổng hợp bằng Web Audio — không cần file mp3 nào.
 * Mặc định TẮT; người dùng bật bằng nút loa trên Header (nhớ qua localStorage).
 */
export const soundOn = createStore<boolean>(storage.get('vamp-sound') === '1');

let ctx: AudioContext | null = null;
const audio = () => {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
};

export function setSound(on: boolean) {
  soundOn.set(on);
  storage.set('vamp-sound', on ? '1' : '0');
  if (on) play('chime');
}

type Kind = 'tick' | 'key' | 'thud' | 'chime';

export function play(kind: Kind) {
  if (!soundOn.get()) return;
  try {
    const ac = audio();
    const t = ac.currentTime;
    const gain = ac.createGain();
    gain.connect(ac.destination);
    const osc = ac.createOscillator();
    osc.connect(gain);

    switch (kind) {
      case 'tick': // click: tiếng "tách" ngắn
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, t);
        osc.frequency.exponentialRampToValueAtTime(500, t + 0.05);
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
        osc.start(t);
        osc.stop(t + 0.08);
        break;
      case 'key': // gõ phím: cao độ ngẫu nhiên nhẹ
        osc.type = 'square';
        osc.frequency.setValueAtTime(900 + Math.random() * 500, t);
        gain.gain.setValueAtTime(0.018, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
        osc.start(t);
        osc.stop(t + 0.04);
        break;
      case 'thud': // nhịp tim trầm
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.32);
        break;
      case 'chime': // bật âm / easter egg
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, t);
        osc.frequency.setValueAtTime(990, t + 0.09);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        osc.start(t);
        osc.stop(t + 0.36);
        break;
    }
  } catch {
    /* trình duyệt không hỗ trợ — bỏ qua */
  }
}
