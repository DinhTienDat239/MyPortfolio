import { createStore } from '../lib/store';
import { setScrollLocked } from '../components/fx/SmoothScroll';

/** Đang ở play mode (thế giới 3D toàn màn hình, điều khiển nhân vật) */
export const playing = createStore<boolean>(false);
/** slug dự án mà nhân vật đang đứng cạnh (để hiện prompt) */
export const nearProject = createStore<string | null>(null);

/** Input dùng chung giữa joystick/bàn phím (React) và vòng lặp game (useFrame) — mutable để không re-render. */
export const input = {
  x: 0,
  y: 0,
  keys: new Set<string>(),
  action: false,
};

export function pressAction() {
  input.action = true;
}

export function enterPlay() {
  if (playing.get()) return;
  playing.set(true);
  setScrollLocked(true);
  window.scrollTo(0, 0);
}

export function exitPlay() {
  if (!playing.get()) return;
  playing.set(false);
  input.x = 0;
  input.y = 0;
  input.keys.clear();
  nearProject.set(null);
  setScrollLocked(false);
}
