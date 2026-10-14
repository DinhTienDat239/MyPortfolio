/**
 * Bộ sprite pixel-art NGUYÊN BẢN của site (tự vẽ, không lấy từ game nào).
 * Mỗi sprite là lưới 16×16: mỗi ký tự = 1 pixel, '.' = trong suốt.
 * Màu tra theo bảng PALETTE bên dưới. Thêm sprite mới: vẽ thêm 1 mảng 16 dòng × 16 ký tự.
 */
export const PALETTE: Record<string, string> = {
  k: '#14121f', // viền
  w: '#8a5a34', // gỗ
  W: '#b07a45', // gỗ sáng
  s: '#9aa3b8', // kim loại
  S: '#d6dcea', // kim loại sáng
  d: '#5c637a', // kim loại tối
  o: '#ff9a3c', // lửa cam
  y: '#ffd76a', // lửa vàng
  r: '#e8552e', // lửa đỏ
  c: '#5ef2e6', // pha lê
  C: '#c9fffa', // pha lê sáng
  b: '#1f9c9a', // pha lê tối
  g: '#f5c542', // vàng
  G: '#fff0a8', // vàng sáng
  h: '#b8862a', // vàng tối
  p: '#b77cff', // tím
  P: '#e6ccff', // tím sáng
  v: '#6d3fb3', // tím tối
  m: '#4fd6ff', // nấm phát sáng
  M: '#c4f3ff', // nấm sáng
  n: '#6e4d36', // đất
  N: '#4a3426', // đất tối
  q: '#4b4e6d', // đá
  Q: '#6b6f93', // đá sáng
  l: '#7fc35a', // rêu
  L: '#3f7a32', // rêu tối
  x: '#f1e3c6', // giấy
  X: '#c9b48e', // giấy tối
  R: '#e8434f', // đỏ
  f: '#ff9aa4', // hồng
  e: '#ffffff', // trắng
};

export const SPRITES = {
  pickaxe: [
    '................',
    '....kkkkkkkk....',
    '..kkSSSSSSSSkk..',
    '.kSSsssssssssSk.',
    'kSsdkkkkkkkkdsSk',
    'kSdk...kwk...dSk',
    'kdk....kwk....dk',
    'kk.....kwk.....k',
    '.......kWk......',
    '.......kwk......',
    '.......kwk......',
    '.......kWk......',
    '.......kwk......',
    '.......kwk......',
    '.......kkk......',
    '................',
  ],
  torch: [
    '................',
    '.......y........',
    '......yoy.......',
    '.....yooyy......',
    '.....oyyyo......',
    '.....orooo......',
    '......rro.......',
    '......kddk......',
    '......kSsk......',
    '.......kwk......',
    '.......kWk......',
    '.......kwk......',
    '.......kwk......',
    '.......kWk......',
    '.......kkk......',
    '................',
  ],
  torch2: [
    '................',
    '........y.......',
    '.......yoy......',
    '......yyooy.....',
    '......oyyyo.....',
    '......ooorr.....',
    '.......orr......',
    '......kddk......',
    '......kSsk......',
    '.......kwk......',
    '.......kWk......',
    '.......kwk......',
    '.......kwk......',
    '.......kWk......',
    '.......kkk......',
    '................',
  ],
  gem: [
    '................',
    '.......kk.......',
    '......kCCk......',
    '.....kCCcck.....',
    '....kCCcccbk....',
    '...kCCccccbbk...',
    '..kCCcccccbbbk..',
    '..kCcccccccbbk..',
    '..kcccccccbbbk..',
    '...kccccccbbk...',
    '....kcccccbk....',
    '.....kcccbk.....',
    '......kcbk......',
    '.......kk.......',
    '................',
    '................',
  ],
  ore: [
    '................',
    '................',
    '.....kkkkkk.....',
    '...kkQQQqqqkk...',
    '..kQQqgGqqqqqk..',
    '..kQqqggqqgGqk..',
    '.kQqqqqqqqggqqk.',
    '.kqqGgqqqqqqqqk.',
    '.kqqggqqqqGgqqk.',
    '.kqqqqqqqqggqNk.',
    '..kqqqqgGqqqNk..',
    '..kNqqqggqqNNk..',
    '...kkNNNNNNkk...',
    '.....kkkkkk.....',
    '................',
    '................',
  ],
  chest: [
    '................',
    '................',
    '..kkkkkkkkkkkk..',
    '.kWWWWWWWWWWWWk.',
    '.kwwwwwwwwwwwwk.',
    '.kwwwwwwwwwwwwk.',
    '.khhhhhkkhhhhhk.',
    '.kkkkkkGgkkkkkk.',
    '.kWWWWWggWWWWWk.',
    '.kwwwwwkkwwwwwk.',
    '.kwwwwwwwwwwwwk.',
    '.khwwwwwwwwwwhk.',
    '.khhwwwwwwwwhhk.',
    '.kkkkkkkkkkkkkk.',
    '................',
    '................',
  ],
  mushroom: [
    '................',
    '................',
    '......kkkk......',
    '....kkmmmmkk....',
    '...kmmMmmmmmk...',
    '..kmMMmmmMmmmk..',
    '..kmmmmmmMMmmk..',
    '..kkkkkkkkkkkk..',
    '......kxxk......',
    '......kxXk......',
    '......kxXk......',
    '.....kkxxkk.....',
    '.....kXXXXk.....',
    '......kkkk......',
    '................',
    '................',
  ],
  heart: [
    '................',
    '................',
    '...kkk...kkk....',
    '..kfRRk.kRRRk...',
    '.kfeRRRkRRRRRk..',
    '.kfRRRRRRRRRRk..',
    '.kRRRRRRRRRRRk..',
    '..kRRRRRRRRRk...',
    '...kRRRRRRRk....',
    '....kRRRRRk.....',
    '.....kRRRk......',
    '......kRk.......',
    '.......k........',
    '................',
    '................',
    '................',
  ],
  scroll: [
    '................',
    '................',
    '..kkkkkkkkkkk...',
    '.kXxxxxxxxxxXk..',
    '.kkXxxxxxxxxXk..',
    '...kxkkkkkkxk...',
    '...kxxxxxxxxk...',
    '...kxkkkkkxxk...',
    '...kxxxxxxxxk...',
    '...kxkkkkkkxk...',
    '...kxxxxxxxxk...',
    '..kkXxxxxxxxkk..',
    '.kXxxxxxxxxxXk..',
    '..kkkkkkkkkkk...',
    '................',
    '................',
  ],
  potion: [
    '................',
    '......kkkk......',
    '......kwWk......',
    '......kkkk......',
    '.......kk.......',
    '......kSSk......',
    '.....kSppPk.....',
    '....kSppppPk....',
    '...kSpppppppk...',
    '...kpPpppppvk...',
    '...kppppppvvk...',
    '...kpppppvvvk...',
    '....kvvvvvvk....',
    '.....kkkkkk.....',
    '................',
    '................',
  ],
  sword: [
    '................',
    '.............kk.',
    '............kSk.',
    '...........kSsk.',
    '..........kSsk..',
    '.........kSsk...',
    '........kSsk....',
    '...kk..kSsk.....',
    '...kgkkSsk......',
    '....kgdsk.......',
    '.....kgdk.......',
    '....kwkgk.......',
    '...kWk.kk.......',
    '..kkk...........',
    '................',
    '................',
  ],
  coin: [
    '................',
    '................',
    '.....kkkkkk.....',
    '....kGGGgggk....',
    '...kGgghhgggk...',
    '...kGgkGgkggk...',
    '...kggkggkghk...',
    '...kggkggkghk...',
    '...kggkkkkghk...',
    '...kgggggghhk...',
    '....khhhhhhk....',
    '.....kkkkkk.....',
    '................',
    '................',
    '................',
    '................',
  ],
  lantern: [
    '................',
    '.......kk.......',
    '......k..k......',
    '.....kkkkkk.....',
    '.....kddddk.....',
    '....kdyyyydk....',
    '....kdyGGydk....',
    '....kdyGoydk....',
    '....kdyooydk....',
    '....kdyyyydk....',
    '.....kddddk.....',
    '.....kkkkkk.....',
    '................',
    '................',
    '................',
    '................',
  ],
  star: [
    '................',
    '.......kk.......',
    '......kGgk......',
    '......kGgk......',
    '.kkkkkkGgkkkkkk.',
    '.kGGGGGggggggghk',
    '..kkGggggggghkk.',
    '....kgggggghk...',
    '....kgggkgghk...',
    '...kgghk.kghhk..',
    '...kghk...khhk..',
    '...kkk.....kkk..',
    '................',
    '................',
    '................',
    '................',
  ],
  book: [
    '................',
    '................',
    '..kkkkkkkkkkkk..',
    '.kvppppppppppvk.',
    '.kvpPPppppppvvk.',
    '.kvpppgggpppvvk.',
    '.kvppgGggppppvk.',
    '.kvpppgggpppvvk.',
    '.kvppppppppppvk.',
    '.kvvvvvvvvvvvvk.',
    '.kxxxxxxxxxxxxk.',
    '.kXXXXXXXXXXXXk.',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
    '................',
  ],
  slime: [
    '................',
    '................',
    '................',
    '................',
    '.....kkkkkk.....',
    '...kklllllLkk...',
    '..klleelleelLk..',
    '..klekklekklLk..',
    '.kllekklekkllLk.',
    '.kllllllllllLLk.',
    '.klllkkkkkllLLk.',
    '.kLlllllllllLLk.',
    '..kLLLLLLLLLLk..',
    '...kkkkkkkkkk...',
    '................',
    '................',
  ],
  explorer: [
    '................',
    '.....kkkkkk.....',
    '....kddsssdk....',
    '...kdssyysssk...',
    '...kkkkkkkkkk...',
    '....kxxxxxxk....',
    '....kxkxxkxk....',
    '....kxxxxxxk....',
    '.....kxXXxk.....',
    '...kkwwwwwwkk...',
    '..kxkwWwwWwkxk..',
    '..kxkwwwwwwkxk..',
    '...kkqqqqqqkk...',
    '....kqqkkqqk....',
    '....kNNk.kNNk...',
    '....kkkk.kkkk...',
  ],
} satisfies Record<string, string[]>;

export type SpriteName = keyof typeof SPRITES;

/** Gộp các pixel liền nhau cùng màu trên 1 hàng thành 1 <rect> → SVG nhẹ hơn nhiều. */
export function spriteRects(rows: string[], recolor?: Record<string, string>) {
  const rects: { x: number; y: number; w: number; fill: string }[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.') {
        x++;
        continue;
      }
      let w = 1;
      while (row[x + w] === ch) w++;
      rects.push({ x, y, w, fill: recolor?.[ch] ?? PALETTE[ch] ?? '#ff00ff' });
      x += w;
    }
  });
  return rects;
}

/** SVG data-URI — dùng cho CSS cursor / background. */
export function spriteDataUri(name: SpriteName, scale = 2) {
  const rows = SPRITES[name];
  const rects = spriteRects(rows)
    .map((r) => `<rect x='${r.x}' y='${r.y}' width='${r.w}' height='1' fill='${r.fill}'/>`)
    .join('');
  const size = 16 * scale;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 16 16' shape-rendering='crispEdges'>${rects}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
