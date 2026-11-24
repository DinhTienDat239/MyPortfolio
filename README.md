# Dinh Tien Dat — Playable Ads Developer & Creative Director

Portfolio tĩnh phong cách **đơn sắc kiểu editorial**: trắng / đen / xám, chữ Instrument Sans + Instrument Serif nghiêng cho chữ nhấn. Điểm nhấn bằng chuyển động: preloader đếm số, điện thoại 3D nghiêng theo chuột ở hero, dải playable cuộn ngang, câu giới thiệu sáng dần theo cuộn, dòng danh sách đổ đen khi hover, con trỏ "Play".
Playable ads thật chạy trực tiếp trong **Phone Simulator** trên web.

**Stack:** Vite 6 · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion (`motion/react`) · Lenis smooth scroll.
Không database, không backend — nội dung nằm trong `src/data/content.json`, push lên `main` là GitHub Actions tự build & deploy lên GitHub Pages.

## Chạy local

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # xuất ra dist/
npm run lint       # type-check
```

## Cấu trúc

```
src/
├─ App.tsx                      # ghép các section + simulator
├─ styles/index.css             # Tailwind v4 @theme (màu, font) + .link / .field
├─ data/content.json            # TOÀN BỘ nội dung
├─ types/content.ts             # kiểu dữ liệu + danh sách tab GENRES
├─ hooks/useHashRoute.ts        # deep-link #/play/<slug>
├─ lib/    particles (hiệu ứng hạt nhỏ khi gửi form) · scroll (Lenis)
└─ components/
   ├─ fx/        SmoothScroll · Preloader · Cursor
   ├─ ui/        Reveal (Reveal · MaskLine · ScrollText · Section) · HoverRow · PhoneFrame
   ├─ layout/    Header · Footer · MiniGame (ẩn sau link "Got 5 seconds?")
   └─ sections/  Hero · PlayableShowcase · ProjectModal · About · Experience · AiWorkflow · Ventures · Awards · TechStack · Contact
```

> Tailwind v4 không dùng `tailwind.config.js`: theme khai báo bằng `@theme { … }` trong `src/styles/index.css`
> (ví dụ `--color-muted: #888888` → `text-muted`, `border-muted/40`).

## Cập nhật nội dung (`src/data/content.json`)

| Muốn… | Sửa |
|---|---|
| Chức danh, mô tả hero, 4 con số | `hero`, `stats` |
| Câu giới thiệu + 3 dòng thông tin | `about` |
| Playable | `projects` (`genre`: `puzzle` · `casual` · `hypercasual` · `midcore`) |
| Sơ đồ kinh nghiệm (4 nhánh) | `experience.branches` |
| Quy trình AI | `ai` |
| Startup / B2B (NDA) / community | `ventures` (`nda: true` → vẽ UI trừu tượng, ẩn đối tác) |
| Giải thưởng & game indie | `awards`, `games`, `studio` |
| Toolbox | `stack` |
| Mạng xã hội | `socials` (`url` rỗng → ẩn) |

### Thêm 1 playable

```jsonc
{
  "id": "pa-my-game",
  "slug": "my-game",                     // deep-link: #/play/my-game
  "title": "My Game",
  "genre": "puzzle",                     // puzzle | casual | hypercasual | midcore
  "summary": "One or two sentences.",
  "tags": ["Match-3"],
  "thumbnail": "images/playables/MyGame.jpg",   // ảnh dọc 9:16
  "previewVideo": "videos/MyGame.webm",         // tuỳ chọn — chạy khi hover; bỏ trống → ảnh tự pan
  "playableUrl": "playables/MyGame.html",       // build single-file
  "sizeKB": 3200,
  "engine": "Luna Playworks",            // mặc định "HTML5"
  "platform": "iOS · Android",
  "installs": "1.2M",                    // chỉ hiện khi có số thật
  "networks": ["AppLovin", "Unity Ads"],
  "featured": false,
  "order": 10
}
```

## Form liên hệ

Site tĩnh nên mặc định form mở ứng dụng email với nội dung soạn sẵn (`mailto:`).
Muốn nhận thẳng vào hộp thư: tạo endpoint Formspree/Getform rồi đặt biến môi trường lúc build:

```bash
VITE_FORM_ENDPOINT=https://formspree.io/f/xxxxxx
```

(Trên GitHub Actions: thêm vào `env:` của bước build trong `.github/workflows/deploy.yml`.)

## Deploy (GitHub Pages)

1. Lần đầu: **Settings → Pages → Source: GitHub Actions**.
2. `git push` lên `main` → workflow build & deploy.
3. Site: `https://dinhtiendat239.github.io/MyPortfolio/`

`base: './'` + hash routing nên chạy được ở mọi đường dẫn/domain riêng.

## Easter egg

- Footer: link **Got 5 seconds?** mở mini-game 5 giây (lưu best score).
