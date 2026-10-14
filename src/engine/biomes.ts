/**
 * Bảng màu cho từng biome (nguyên bản). Mỗi biome định nghĩa sàn, tường (mặt trên + mặt đứng 3/4),
 * nước, trang trí và màu ánh sáng. Engine + texture nền section đều đọc từ đây.
 */
export type BiomeId = 'burrow' | 'clay' | 'ruins' | 'crystal' | 'garden';

export interface Biome {
  id: BiomeId;
  name: string;
  floor: string[];        // màu nền sàn (chọn ngẫu nhiên theo tile)
  speck: [string, string]; // [tối, sáng] — sỏi lấm tấm
  pebble: string;
  wallTop: [string, string];
  wallFace: string[];      // sọc dọc mặt đứng
  wallLip: string;         // mép trên của mặt đứng (bắt sáng)
  water?: [string, string];
  decor: { kind: 'grass' | 'flower' | 'shroom' | 'crystal' | 'bones'; color: string; accent?: string; chance: number }[];
  ore: { color: string; light?: [number, number, number] }[];
  ambient: [number, number, number]; // ánh sáng nền (rất tối)
  light: [number, number, number];   // màu đuốc
}

export const BIOMES: Record<BiomeId, Biome> = {
  burrow: {
    id: 'burrow',
    name: 'Ember Burrow',
    floor: ['#6b4331', '#734936', '#7c4f39', '#663f2f'],
    speck: ['#553223', '#93603f'],
    pebble: '#4a2b1f',
    wallTop: ['#130d0f', '#1e1418'],
    wallFace: ['#4b2d22', '#42271e', '#553326', '#3c231b'],
    wallLip: '#7a4d37',
    water: ['#0f2a3a', '#1f4f66'],
    decor: [
      { kind: 'grass', color: '#4f7d35', accent: '#76a845', chance: 0.06 },
      { kind: 'shroom', color: '#57c7ff', accent: '#c6f1ff', chance: 0.012 },
      { kind: 'flower', color: '#f2c14e', accent: '#fff2b0', chance: 0.01 },
    ],
    ore: [{ color: '#e8873f' }, { color: '#e8873f' }, { color: '#bfc8d6' }, { color: '#5ef2e6', light: [70, 210, 200] }],
    ambient: [16, 13, 24],
    light: [255, 168, 88],
  },
  clay: {
    id: 'clay',
    name: 'Clay Hollows',
    floor: ['#9a5a41', '#a46146', '#8f533c', '#a8674b'],
    speck: ['#7a4330', '#c17f5e'],
    pebble: '#6a3a29',
    wallTop: ['#140c0c', '#1f1413'],
    wallFace: ['#5e3324', '#55301f', '#68392a', '#4c2a1d'],
    wallLip: '#9a5a41',
    water: ['#13303a', '#24566a'],
    decor: [
      { kind: 'grass', color: '#557f39', accent: '#7aa84a', chance: 0.05 },
      { kind: 'bones', color: '#e6d8bf', chance: 0.008 },
    ],
    ore: [{ color: '#c9d1dc' }],
    ambient: [20, 12, 16],
    light: [255, 160, 92],
  },
  ruins: {
    id: 'ruins',
    name: 'Forgotten Vault',
    floor: ['#3b4762', '#36425b', '#414e6b', '#33405a'],
    speck: ['#2a3449', '#56658a'],
    pebble: '#252e42',
    wallTop: ['#0b0e16', '#121725'],
    wallFace: ['#2b3449', '#262e41', '#323c54', '#222a3b'],
    wallLip: '#56658a',
    decor: [
      { kind: 'grass', color: '#3f6f6a', accent: '#5f9a90', chance: 0.03 },
      { kind: 'crystal', color: '#7fe6ff', accent: '#e3fbff', chance: 0.01 },
    ],
    ore: [{ color: '#f2c14e' }],
    ambient: [12, 16, 28],
    light: [150, 220, 255],
  },
  crystal: {
    id: 'crystal',
    name: 'Glimmer Grotto',
    floor: ['#27264a', '#2c2a52', '#232246', '#302d58'],
    speck: ['#1c1b38', '#4a4790'],
    pebble: '#19183a',
    wallTop: ['#0b0a18', '#141228'],
    wallFace: ['#28254c', '#231f44', '#2e2b58', '#1f1c3c'],
    wallLip: '#4a4790',
    decor: [
      { kind: 'crystal', color: '#b48cff', accent: '#efe2ff', chance: 0.025 },
      { kind: 'crystal', color: '#5ef2e6', accent: '#d8fffb', chance: 0.02 },
    ],
    ore: [{ color: '#b48cff', light: [170, 120, 255] }, { color: '#5ef2e6', light: [80, 230, 220] }],
    ambient: [14, 12, 30],
    light: [190, 150, 255],
  },
  garden: {
    id: 'garden',
    name: 'Wild Garden',
    floor: ['#2f5a33', '#336239', '#2a522f', '#386a3d'],
    speck: ['#234526', '#4f8a47'],
    pebble: '#1f3c22',
    wallTop: ['#0a110c', '#121c14'],
    wallFace: ['#24402a', '#1f3825', '#2a4a30', '#1b3220'],
    wallLip: '#4f8a47',
    water: ['#10324a', '#2a6a8a'],
    decor: [
      { kind: 'grass', color: '#5d9a43', accent: '#8cc65a', chance: 0.12 },
      { kind: 'flower', color: '#f2c14e', accent: '#fff2b0', chance: 0.03 },
      { kind: 'flower', color: '#ff8fb1', accent: '#ffe0ea', chance: 0.02 },
      { kind: 'shroom', color: '#57c7ff', accent: '#c6f1ff', chance: 0.01 },
    ],
    ore: [{ color: '#7fd35a' }],
    ambient: [10, 18, 16],
    light: [255, 196, 120],
  },
};

export const rgb = (c: [number, number, number], a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
