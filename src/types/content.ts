/**
 * Toàn bộ nội dung site nằm trong src/data/content.json (không còn database).
 * Sửa JSON → commit → GitHub Actions tự build & deploy.
 *
 * Đường dẫn ảnh/playable: viết tương đối với thư mục public/
 *   "images/profile.webp", "playables/Merge.html"
 * hoặc URL tuyệt đối "https://…". Không cần dấu "/" ở đầu.
 */
export type ProjectCategory = 'game' | 'playable' | 'webapp';

export const CATEGORY_LABEL: Record<ProjectCategory, string> = {
  game: 'Game Dev',
  playable: 'Playable Ad',
  webapp: 'Web App',
};

export interface Profile {
  fullName: string;
  alias: string;          // "Tibber" — tên lớn ở Hero
  roles: string;
  tagline: string;
  location: string;
  email: string;
  phone?: string;
  dob?: string;           // giữ lại dữ liệu cũ, không hiển thị công khai
  aboutMe: string;
  profilePic?: string;
  available?: boolean;    // hiện badge "Open for work"
}

export interface StoryChapter {
  kicker: string;         // "I." / "Who"
  title: string;
  body: string;
}

export interface Stat {
  label: string;
  value: string;          // "1000+", "10M+" — số được đếm lên, hậu tố giữ nguyên
}

export interface Network {
  name: string;
  logo?: string;
}

export interface SkillGroup {
  name: string;           // "Engines", "Web", …
  sigil: string;          // ký hiệu trang trí: "I", "II", …
  skills: { name: string; level: number; note?: string }[]; // level 1–5
}

export interface Social {
  label: string;
  url: string;            // để trống "" → tự ẩn
  handle?: string;
}

export interface Award {
  id: string;
  name: string;
  description: string;
  image?: string;
  link?: string;
  year?: string;
}

export interface Project {
  id: string;
  slug: string;           // URL: #/work/<slug>
  title: string;
  category: ProjectCategory;
  summary: string;
  tagline?: string;
  thumbnail?: string;     // ảnh card 16:10. Bỏ trống → card tự vẽ artwork đỏ-đen
  cover?: string;         // ảnh nền lớn ở trang case study
  previewVideo?: string;  // clip 3–6s webm/mp4 muted, play khi hover card
  tags: string[];
  year?: string;
  role?: string;
  playableUrl?: string;   // "playables/Merge.html" — chơi trực tiếp trong khung điện thoại
  orientation?: 'portrait' | 'landscape';
  externalLink?: string;  // store / itch.io / web demo
  caseStudy?: CaseStudyBlock[];
  featured?: boolean;
  order: number;
}

export type CaseStudyBlock =
  | { type: 'text'; heading?: string; body: string }
  | { type: 'image'; src: string; caption?: string }
  | { type: 'stats'; items: Stat[] }
  | { type: 'quote'; text: string };

export interface Content {
  profile: Profile;
  story: StoryChapter[];
  stats: Stat[];
  networks: Network[];
  skills: SkillGroup[];
  projects: Project[];
  awards: Award[];
  socials: Social[];
}
