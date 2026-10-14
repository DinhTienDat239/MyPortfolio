# Tibber · Dinh Tien Dat — Portfolio

Portfolio tĩnh phong cách **pixel-art khám phá hang động**: cuộn trang = đào sâu xuống lòng đất. React 19 + Vite + Tailwind v4 + Motion + React Three Fiber.

Toàn bộ pixel art (sprite, tile, con trỏ, hang voxel 3D) là **nguyên bản**, vẽ bằng code — không dùng asset của game nào.
Không database, không backend: toàn bộ nội dung nằm trong `src/data/content.json`, **push lên `main` là GitHub Actions tự build và deploy lên GitHub Pages**.

## Chạy local

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # xuất ra dist/
npm run preview    # xem bản build
```

## Deploy (GitHub Pages)

1. Lần đầu: repo trên GitHub → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. `git push` lên `main` → workflow `.github/workflows/deploy.yml` build & deploy (≈1–2 phút, xem tab **Actions**).
3. Site: `https://dinhtiendat239.github.io/MyPortfolio/`

Site dùng hash routing (`#/work/<slug>`) và `base: './'` nên chạy được ở mọi đường dẫn / domain riêng mà không cần cấu hình thêm.

## Cập nhật nội dung

Mọi thứ ở **`src/data/content.json`** (kiểu dữ liệu: `src/types/content.ts`):

| Muốn… | Sửa |
|---|---|
| Đổi tên, tagline, about, ảnh đại diện | `profile` |
| 3 thẻ câu chuyện ở phần Origin | `story` |
| Số liệu đếm (1000+, 10M+…) | `stats` |
| Thêm dự án | thêm 1 object vào `projects` |
| Kỹ năng (level 1–5) | `skills` |
| GitHub / itch.io / LinkedIn | `socials` (để `url` rỗng → tự ẩn) |
| Giải thưởng | `awards` (mảng rỗng → section tự ẩn) |

### Thêm 1 project

```jsonc
{
  "id": "my-game",
  "slug": "my-game",                 // URL: #/work/my-game
  "title": "My Game",
  "category": "game",                // "game" | "playable" | "webapp"
  "summary": "One or two sentences.",
  "thumbnail": "images/my-game.webp", // file đặt trong public/images/ — bỏ trống → artwork tự sinh
  "previewVideo": "videos/my-game.webm", // tuỳ chọn: clip 3–6s, play khi hover card
  "playableUrl": "playables/MyGame.html", // tuỳ chọn: chơi trực tiếp trong khung điện thoại
  "externalLink": "https://…",       // tuỳ chọn: store / itch.io
  "tags": ["Unity", "C#"],
  "year": "2026",
  "role": "Solo developer",
  "featured": true,
  "order": 0,
  "caseStudy": [                     // tuỳ chọn: nội dung trang case study
    { "type": "text", "heading": "The hook", "body": "…" },
    { "type": "image", "src": "images/my-game-2.webp", "caption": "…" },
    { "type": "stats", "items": [{ "label": "CTR", "value": "12%" }] },
    { "type": "quote", "text": "…" }
  ]
}
```

Tab **Web Apps** tự xuất hiện khi có project `"category": "webapp"`.

## Lấy dữ liệu cũ từ Firestore (chạy 1 lần)

```bash
npm run export:firestore
```

Script đọc dữ liệu công khai của site cũ, tách ảnh base64 thành file trong `public/images/` và **merge** vào `content.json` (giữ nguyên những gì bạn tự viết thêm). Xong thì commit, có thể xoá `scripts/export-firestore.mjs`.

## Easter eggs

- **Đào quặng**: click vào tường hang ở Hero để đào khối — đủ 10 khối hoàn thành quest → Treasure Rain
- Gõ **↑ ↑ ↓ ↓ ← → ← → B A** → Treasure Rain
- Click 3 lần vào viên ngọc ở footer → Treasure Rain
- Phím số **1–5** (thêm awards thì thành 1–6): nhảy giữa các tầng (hotbar)
- Nút loa trên HUD → âm thanh chiptune (Web Audio, không có file âm thanh)
- Mở DevTools console ⛏

## Thêm sprite pixel

Sprite nằm ở `src/components/pixel/sprites.ts`: mỗi sprite là lưới 16×16 ký tự, màu tra theo `PALETTE`.
Dùng: `<Sprite name="gem" size={32} />`. Có thể đổi màu: `recolor={{ c: '#b77cff' }}`.

## Cấu trúc

```
src/
├─ data/content.json        ← toàn bộ nội dung
├─ types/content.ts
├─ styles/cave.css          ← theme Tailwind v4: màu hang/quặng/độ hiếm, panel pixel, tile nền, con trỏ cuốc
├─ pages/                   HomePage · CaseStudyPage (Item Codex)
├─ components/
│  ├─ sections/             CaveHero · Character · Vault · SkillTree · Feats · Craft
│  ├─ projects/             ItemCard (độ hiếm + 3D tilt + video hover) · PlayableFrame (máy cầm tay)
│  ├─ pixel/                sprites.ts · Sprite · PixelScene (cảnh hang tự sinh)
│  ├─ three/                CaveScene (hang voxel R3F, đào được, lazy-load)
│  ├─ fx/                   Preloader · Curtain · Layer · Ambience · SmoothScroll · Counter
│  └─ layout/               Header (HUD độ sâu) · Hotbar · Footer (địa tầng)
├─ lib/                     router (hash) · game (tầng, quặng, kho báu) · sound · store · utils
└─ hooks/useKonami.ts
public/
├─ playables/               build HTML của từng playable
└─ images/                  ảnh (do export script tạo / bạn tự thêm)
```
