import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const SITE_ORIGIN = 'https://rig-c.org';

const CONTENT_DIR = resolve(import.meta.dir, '../content');

export type Section = 'home' | 'docs' | 'examples' | 'exam';

export interface Page {
  route: string;
  section: Section;
  navLabel: string;
  title: string;
  description: string;
  keywords: string[];
  packageName?: string;
  repoUrl: string;
  npmUrl?: string;
  summaryForLlms: string;
  heroEyebrow?: string;
  heroTitle?: string;
  heroLede?: string;
  markdown: string;
}

// Site order: home, the docs in pipeline order, then the two top-level showcases.
const SOURCES: readonly { file: string; route: string; section: Section }[] = [
  { file: 'index.md', route: '/', section: 'home' },
  { file: 'docs/index.md', route: '/docs/', section: 'docs' },
  { file: 'docs/capabilities.md', route: '/docs/capabilities/', section: 'docs' },
  { file: 'docs/getting-started.md', route: '/docs/getting-started/', section: 'docs' },
  { file: 'docs/parts.md', route: '/docs/parts/', section: 'docs' },
  { file: 'docs/pose.md', route: '/docs/pose/', section: 'docs' },
  { file: 'docs/core.md', route: '/docs/core/', section: 'docs' },
  { file: 'docs/review.md', route: '/docs/review/', section: 'docs' },
  { file: 'docs/play.md', route: '/docs/play/', section: 'docs' },
  { file: 'docs/adapters.md', route: '/docs/adapters/', section: 'docs' },
  { file: 'docs/licensing.md', route: '/docs/licensing/', section: 'docs' },
  { file: 'examples.md', route: '/examples/', section: 'examples' },
  { file: 'exam.md', route: '/exam/', section: 'exam' },
];

// The routes the first version of the site used; each is a stub that sends readers on.
export const REDIRECTS: Readonly<Record<string, string>> = {
  '/getting-started/': '/docs/getting-started/',
  '/parts/': '/docs/parts/',
  '/pose/': '/docs/pose/',
  '/core/': '/docs/core/',
  '/review/': '/docs/review/',
  '/play/': '/docs/play/',
  '/adapters/': '/docs/adapters/',
  '/licensing/': '/docs/licensing/',
};

function parse(file: string, raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing frontmatter`);
  const meta: Record<string, string> = {};
  for (const line of (match[1] ?? '').split('\n')) {
    const at = line.indexOf(':');
    if (at < 0) continue;
    meta[line.slice(0, at).trim()] = line.slice(at + 1).trim().replace(/^"(.*)"$/, '$1');
  }
  // Drafting notes (the per-claim source list) live in an HTML comment and are never published.
  const body = (match[2] ?? '').replace(/<!--[\s\S]*?-->/g, '').trim();
  return { meta, body };
}

function required(file: string, meta: Record<string, string>, key: string): string {
  const value = meta[key];
  if (!value) throw new Error(`${file}: frontmatter is missing "${key}"`);
  return value;
}

function load(): Page[] {
  return SOURCES.map(({ file, route, section }) => {
    const { meta, body } = parse(file, readFileSync(join(CONTENT_DIR, file), 'utf8'));
    return {
      route,
      section,
      navLabel: required(file, meta, 'navLabel'),
      title: required(file, meta, 'title'),
      description: required(file, meta, 'description'),
      keywords: (meta.keywords ?? '').split(',').map((k) => k.trim()).filter(Boolean),
      packageName: meta.packageName,
      repoUrl: required(file, meta, 'repoUrl'),
      npmUrl: meta.npmUrl,
      summaryForLlms: required(file, meta, 'summaryForLlms'),
      heroEyebrow: meta.heroEyebrow,
      heroTitle: meta.heroTitle,
      heroLede: meta.heroLede,
      markdown: body,
    };
  });
}

export const PAGES: readonly Page[] = load();

export function htmlRel(route: string): string {
  return route === '/' ? 'index.html' : `${route.slice(1)}index.html`;
}

export function mdRoute(route: string): string {
  return `${route}index.md`;
}
