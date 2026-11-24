/**
 * Toàn bộ nội dung site nằm trong src/data/content.json (không database, không backend).
 * Sửa JSON → commit → GitHub Actions tự build & deploy.
 * Đường dẫn ảnh/playable: tương đối với public/ ("images/a.jpg") hoặc URL "https://…".
 */

export type Genre = 'puzzle' | 'casual' | 'hypercasual' | 'midcore';

export const GENRE_LABEL: Record<Genre, string> = {
  puzzle: 'Puzzle',
  casual: 'Casual',
  hypercasual: 'Hyper-casual',
  midcore: 'Midcore',
};

export interface Profile {
  fullName: string;
  alias: string;
  title: string;
  location: string;
  email: string;
  phone?: string;
  profilePic?: string;
  available?: boolean;
}

export interface Stat {
  label: string;
  value: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  genre: Genre;
  summary: string;
  tags: string[];
  thumbnail?: string;
  previewVideo?: string;
  playableUrl?: string;
  sizeKB?: number;
  engine?: string;
  platform?: string;
  installs?: string;
  networks?: string[];
  featured?: boolean;
  order: number;
}

/** Một nhánh trong sơ đồ kinh nghiệm */
export interface Branch {
  id: string;
  label: string;      // tên ngắn trên sơ đồ
  title: string;      // tiêu đề chi tiết
  meta: string;       // "2 years · in-house"
  body: string;
  highlight?: string; // câu nhấn mạnh, in lớn
  leaves: string[];   // các nút con
}

export interface AiFlow {
  intro: string;
  steps: { name: string; detail: string; tools?: string[] }[];
  points: string[];
}

export interface Venture {
  id: string;
  kind: string;
  title: string;
  body: string;
  facts: string[];
  stack: string[];
  image?: string;
  link?: string;
  nda?: boolean;      // true → vẽ UI trừu tượng, ẩn danh tính đối tác
  modules?: string[];
}

export interface Award {
  title: string;
  result: string;
  year: string;
  project?: string;   // slug game liên quan
  entry?: string;     // tên bài dự thi khi không có trong games
  link?: string;
  image?: string;
  /** cover: ảnh chụp, cắt vừa khung · contain: banner có chữ, giữ nguyên + nền mờ */
  fit?: 'cover' | 'contain';
  caption?: string;
}

export interface WebGame {
  slug: string;
  title: string;
  year: string;
  genre: string;
  blurb: string;
  cover: string;
  engine?: string;
  link?: string;
  portals: { name: string; status: string }[];
}

export interface Game {
  slug: string;
  title: string;
  year: string;
  status?: string;
  genre: string;
  cover: string;
  link: string;
}

export interface StackGroup {
  name: string;
  note: string;
  items: { name: string; detail?: string }[];
}

export interface Social {
  label: string;
  url: string;
  handle?: string;
}

export interface Content {
  profile: Profile;
  hero: { headlineAccent: string; subheadline: string };
  stats: Stat[];
  about: { statement: string; facts: { k: string; v: string }[] };
  projects: Project[];
  experience: { center: string; intro: string; branches: Branch[] };
  ai: AiFlow;
  ventures: Venture[];
  studio: { name: string; link: string };
  awards: Award[];
  games: Game[];
  webGames: WebGame[];
  stack: StackGroup[];
  socials: Social[];
}
