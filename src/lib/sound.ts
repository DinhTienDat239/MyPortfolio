import { createStore, storage } from './store';

/**
 * Âm thanh chiptune tổng hợp bằng Web Audio — không có file âm thanh nào.
 * Mặc định TẮT; bật bằng nút loa trên HUD (nhớ qua localStorage).
 */
export const soundOn = createStore<boolean>(storage.get('cave-sound') === '1');

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
  storage.set('cave-sound', on ? '1' : '0');
  if (on) play('pickup');
}

type Kind = 'tick' | 'key' | 'mine' | 'pickup' | 'chime' | 'thud';

/** 1 nốt square/triangle với envelope ngắn */
function blip(ac: AudioContext, t: number, freq: number, dur: number, vol: number, type: OscillatorType = 'square', slideTo?: number) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export function play(kind: Kind) {
  if (!soundOn.get()) return;
  try {
    const ac = audio();
    const t = ac.currentTime;
    switch (kind) {
      case 'tick':
        blip(ac, t, 880, 0.05, 0.03, 'square', 660);
        break;
      case 'key':
        blip(ac, t, 520 + Math.random() * 260, 0.03, 0.02, 'square');
        break;
      case 'mine': // "cộc" đá vỡ
        blip(ac, t, 220, 0.09, 0.09, 'square', 70);
        blip(ac, t + 0.03, 140, 0.08, 0.06, 'triangle', 60);
        break;
      case 'pickup': // nhặt quặng: 2 nốt đi lên
        blip(ac, t, 660, 0.07, 0.05, 'square');
        blip(ac, t + 0.07, 990, 0.1, 0.05, 'square');
        break;
      case 'chime': // mở khoá / easter egg: arpeggio
        [523, 659, 784, 1047].forEach((f, i) => blip(ac, t + i * 0.08, f, 0.16, 0.045, 'square'));
        break;
      case 'thud':
        blip(ac, t, 110, 0.25, 0.18, 'triangle', 45);
        break;
    }
  } catch {
    /* trình duyệt không hỗ trợ — bỏ qua */
  }
}
