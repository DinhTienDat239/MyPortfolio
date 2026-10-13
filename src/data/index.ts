import raw from './content.json';
import type { Content, Project } from '../types/content';

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
