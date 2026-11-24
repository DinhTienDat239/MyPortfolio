import raw from './content.json';
import type { Content, Project } from '../types/content';

export const content = raw as Content;

export const projects: Project[] = [...content.projects].sort((a, b) => a.order - b.order);

export const findProject = (slug: string) => projects.find((p) => p.slug === slug);

/** Đường dẫn trong content.json → URL chạy được trên GitHub Pages (base: './'). */
export function asset(path?: string): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|data:|blob:|mailto:)/.test(path)) return path;
  return import.meta.env.BASE_URL + path.replace(/^\.?\//, '');
}

export const formatSize = (kb?: number) => (kb ? (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`) : undefined);
