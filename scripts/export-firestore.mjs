#!/usr/bin/env node
/**
 * ONE-TIME MIGRATION: Firestore → src/data/content.json + public/images/
 *
 *   node scripts/export-firestore.mjs
 *
 * - Đọc các collection công khai của site cũ (profile, playables, games, awards, stats, networks)
 *   qua Firestore REST API — không cần cài thêm gì (Node 18+ có sẵn fetch).
 * - Ảnh lưu dạng base64 trong Firestore / Firebase Storage được tách ra thành file thật
 *   trong public/images/, để site mới không phụ thuộc Firebase nữa.
 * - MERGE vào content.json hiện có: những gì bạn tự viết thêm (story, skills, socials,
 *   tags, caseStudy, previewVideo…) được giữ nguyên.
 * Chạy lại bao nhiêu lần cũng được. Xong thì có thể xoá file này.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ID = 'gen-lang-client-0525059841';
const DATABASE_ID = 'ai-studio-7fffb00b-b2f4-4647-8d5e-9201985af899';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_PATH = path.join(ROOT, 'src', 'data', 'content.json');
const IMAGES_DIR = path.join(ROOT, 'public', 'images');

// ---------- Firestore REST helpers ----------
function decode(value) {
  if (value == null) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decode);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
  return null;
}
const decodeFields = (fields) => Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decode(v)]));
const docId = (doc) => doc.name.split('/').pop();

async function getDoc(p) {
  const res = await fetch(`${BASE}/${p}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${p} → ${res.status} ${await res.text()}`);
  return decodeFields((await res.json()).fields || {});
}

async function listCollection(name) {
  const out = [];
  let pageToken = '';
  do {
    const url = `${BASE}/${name}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`LIST ${name} → ${res.status} ${await res.text()}`);
    const json = await res.json();
    for (const d of json.documents || []) out.push({ id: docId(d), ...decodeFields(d.fields || {}) });
    pageToken = json.nextPageToken || '';
  } while (pageToken);
  return out.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

// ---------- Image extraction ----------
const EXT = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'image/avif': 'avif' };
let saved = 0;

async function localizeImage(src, folder, name) {
  if (!src || typeof src !== 'string') return undefined;
  if (/picsum\.photos|example\.com/.test(src)) return undefined; // placeholder cũ của AI Studio

  let buffer, mime;
  const m = src.match(/^data:([^;,]+)(;base64)?,(.*)$/s);
  if (m) {
    mime = m[1];
    buffer = m[2] ? Buffer.from(m[3], 'base64') : Buffer.from(decodeURIComponent(m[3]));
  } else if (/firebasestorage\.googleapis\.com|\.firebasestorage\.app/.test(src)) {
    const res = await fetch(src);
    if (!res.ok) {
      console.warn(`  ! không tải được ${src.slice(0, 80)}… (${res.status}) — giữ URL gốc`);
      return src;
    }
    mime = (res.headers.get('content-type') || 'image/png').split(';')[0];
    buffer = Buffer.from(await res.arrayBuffer());
  } else {
    return src; // URL ngoài (vectorlogo.zone…) — giữ nguyên
  }

  const ext = EXT[mime] || 'bin';
  const dir = path.join(IMAGES_DIR, folder);
  await mkdir(dir, { recursive: true });
  const file = `${name}.${ext}`;
  await writeFile(path.join(dir, file), buffer);
  saved++;
  return `images/${folder}/${file}`;
}

// ---------- Mapping helpers ----------
const slugify = (s) =>
  String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';

const normUrl = (u) => String(u || '').replace(/^\.?\//, '');
const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''));

// ---------- Main ----------
async function main() {
  console.log('→ Đọc content.json hiện tại');
  const content = JSON.parse(await readFile(CONTENT_PATH, 'utf8'));

  console.log('→ Tải dữ liệu từ Firestore…');
  const [profile, playables, games, awards, stats, networks] = await Promise.all([
    getDoc('config/profile'),
    listCollection('playables'),
    listCollection('games'),
    listCollection('awards'),
    listCollection('stats'),
    listCollection('networks'),
  ]);
  console.log(`  profile: ${profile ? 'có' : 'không'} · playables: ${playables.length} · games: ${games.length} · awards: ${awards.length} · stats: ${stats.length} · networks: ${networks.length}`);

  // Profile
  if (profile) {
    const pic = await localizeImage(profile.profilePic, 'profile', 'portrait');
    content.profile = {
      ...content.profile,
      ...clean({
        fullName: profile.fullName,
        roles: profile.roles,
        location: profile.location,
        email: profile.email,
        phone: profile.phone,
        dob: profile.dob,
        aboutMe: profile.aboutMe,
        profilePic: pic,
      }),
    };
  }

  // Projects: merge theo id hoặc theo đường dẫn playable để không bị trùng
  const existing = [...content.projects];
  const used = new Set();
  const take = (pred) => {
    const i = existing.findIndex((p, idx) => !used.has(idx) && pred(p));
    if (i >= 0) used.add(i);
    return i >= 0 ? existing[i] : undefined;
  };

  const merged = [];
  for (const g of games) {
    if (/example\.com/.test(g.externalLink || '')) continue;
    const prev = take((p) => p.id === `game-${g.id}`) || {};
    merged.push({
      tags: [],
      ...prev,
      ...clean({
        id: `game-${g.id}`,
        slug: prev.slug || slugify(g.title),
        title: g.title,
        category: 'game',
        summary: g.description,
        tagline: g.tagline,
        year: g.publishedAt,
        externalLink: g.externalLink,
        thumbnail: (await localizeImage(g.mainImage, 'games', `${g.id}-main`)) ?? prev.thumbnail,
        cover: (await localizeImage(g.bgImage, 'games', `${g.id}-bg`)) ?? prev.cover,
      }),
    });
  }
  for (const pl of playables) {
    if (/sample-ad\.html/.test(pl.iframeUrl || '')) continue;
    const url = normUrl(pl.iframeUrl);
    const prev = take((p) => p.id === `pa-${pl.id}` || (url && normUrl(p.playableUrl) === url)) || {};
    merged.push({
      tags: ['HTML5', 'Playable Ad'],
      orientation: 'portrait',
      ...prev,
      ...clean({
        id: prev.id || `pa-${pl.id}`,
        slug: prev.slug || slugify(pl.title),
        title: pl.title,
        category: 'playable',
        summary: pl.description,
        playableUrl: url || undefined,
        thumbnail: (await localizeImage(pl.thumbnail, 'playables', `${pl.id}-thumb`)) ?? prev.thumbnail,
      }),
    });
  }
  // Những project chỉ có trong content.json (bạn tự thêm) được giữ lại phía sau
  existing.forEach((p, idx) => !used.has(idx) && merged.push(p));
  // Slug phải duy nhất
  const seen = new Map();
  merged.forEach((p, i) => {
    const n = seen.get(p.slug) || 0;
    seen.set(p.slug, n + 1);
    if (n) p.slug = `${p.slug}-${n + 1}`;
    p.order = i;
  });
  content.projects = merged;

  if (awards.length) {
    content.awards = [];
    for (const a of awards) {
      if (/example\.com/.test(a.checkoutLink || '') && /picsum/.test(a.image || '')) continue;
      content.awards.push(
        clean({
          id: a.id,
          name: a.name,
          description: a.description,
          image: await localizeImage(a.image, 'awards', a.id),
          link: a.showCheckout ? a.checkoutLink : undefined,
        }),
      );
    }
  }
  if (stats.length) content.stats = stats.map((s) => ({ label: s.label, value: String(s.value) }));
  if (networks.length) {
    content.networks = [];
    for (const n of networks) {
      content.networks.push(clean({ name: n.name, logo: await localizeImage(n.logo, 'networks', slugify(n.name)) }));
    }
  }

  await writeFile(CONTENT_PATH, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log(`✓ Đã ghi ${path.relative(ROOT, CONTENT_PATH)} — ${content.projects.length} projects, ${saved} ảnh vào public/images/`);
  if (!existsSync(IMAGES_DIR)) console.log('  (không có ảnh nào cần tách)');
}

main().catch((err) => {
  console.error('✗ Export thất bại:', err.message);
  process.exit(1);
});
