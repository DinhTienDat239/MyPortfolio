import raw from './content.json';
import type { Content, Project, ProjectCategory } from '../types/content';
import type { SpriteName } from '../components/pixel/sprites';

export const content = raw as Content;

export const projects: Project[] = [...content.projects].sort((a, b) => a.order - b.order);

export const findProject = (slug: string) => projects.find((p) => p.slug === slug);

export const nextProject = (slug: string) => {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
};

/** Chuyển đường dẫn trong content.json thành URL dùng được trên GitHub Pages. */
export function asset(path?: string): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return import.meta.env.BASE_URL + path.replace(/^\.?\//, '');
}

// ---------------- Độ hiếm kiểu RPG cho project ----------------
export type Rarity = NonNullable<Project['rarity']>;

export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};
export const RARITY_COLOR: Record<Rarity, string> = {
  common: 'var(--color-common)',
  uncommon: 'var(--color-uncommon)',
  rare: 'var(--color-rare)',
  epic: 'var(--color-epic)',
  legendary: 'var(--color-legendary)',
};

/** featured → Legendary, game → Epic, playable → Rare, webapp → Uncommon. Ghi đè bằng field "rarity" trong JSON. */
export function rarityOf(p: Project): Rarity {
  if (p.rarity) return p.rarity;
  if (p.featured) return 'legendary';
  return ({ game: 'epic', playable: 'rare', webapp: 'uncommon' } as Record<ProjectCategory, Rarity>)[p.category];
}

export const CATEGORY_ICON: Record<ProjectCategory, SpriteName> = {
  game: 'sword',
  playable: 'gem',
  webapp: 'book',
};
