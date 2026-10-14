import { createStore } from './store';
import { play } from './sound';
import type { SpriteName } from '../components/pixel/sprites';
import type { MinedKind } from '../components/three/CaveScene';
import { content } from '../data';

// ---------------- Các tầng (section) ----------------
export interface Layer {
  id: string;
  label: string;
  biome: string;
  depth: number; // mét
  icon: SpriteName;
}

export const LAYERS: Layer[] = [
  { id: 'top', label: 'Surface', biome: 'The Surface', depth: 0, icon: 'lantern' },
  { id: 'origin', label: 'Character', biome: 'Topsoil Burrows', depth: 12, icon: 'heart' },
  { id: 'work', label: 'Vault', biome: 'Golden Vault', depth: 48, icon: 'chest' },
  { id: 'arsenal', label: 'Skills', biome: 'Crystal Caverns', depth: 96, icon: 'pickaxe' },
  ...(content.awards.length ? [{ id: 'trophies', label: 'Feats', biome: 'Ancient Ruins', depth: 140, icon: 'star' as SpriteName }] : []),
  { id: 'contact', label: 'Craft', biome: 'Glowshroom Grotto', depth: 180, icon: 'scroll' },
];

export const layerIndex = (id: string) => LAYERS.findIndex((l) => l.id === id);

/** Section đang ở trong viewport (Header/Hotbar đọc) */
export const currentLayer = createStore<string>('top');

// ---------------- Quặng đào được trong Hero ----------------
export const QUEST_GOAL = 10;
export const ores = createStore<{ total: number; last: MinedKind | null }>({ total: 0, last: null });

export function addOre(kind: MinedKind) {
  const prev = ores.get();
  const total = prev.total + 1;
  ores.set({ total, last: kind });
  play(kind === 'stone' || kind === 'dirt' ? 'mine' : 'pickup');
  if (total === QUEST_GOAL) setTimeout(() => startTreasureRain('quest'), 300);
}

// ---------------- Easter egg: Treasure Rain ----------------
export const treasure = createStore<{ on: boolean; reason: string; n: number }>({ on: false, reason: '', n: 0 });

export function startTreasureRain(reason: 'konami' | 'quest' | 'secret') {
  const n = treasure.get().n + 1;
  treasure.set({ on: true, reason, n });
  play('chime');
  setTimeout(() => {
    if (treasure.get().n === n) treasure.set({ on: false, reason, n });
  }, 4500);
}
