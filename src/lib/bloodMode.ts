import { createStore } from './store';
import { play } from './sound';

/** Easter egg: Konami code (↑↑↓↓←→←→BA) hoặc click 3 lần vào dấu ✝ ở footer. */
export const bloodMode = createStore<boolean>(false);

export function toggleBloodMode() {
  const next = !bloodMode.get();
  bloodMode.set(next);
  document.documentElement.classList.toggle('blood-mode', next);
  play(next ? 'thud' : 'chime');
}
