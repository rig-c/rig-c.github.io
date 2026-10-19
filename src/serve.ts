import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT_DIR = resolve(import.meta.dir, '..');
const PORT = Number(process.env.PORT ?? 4321);

const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    const accept = req.headers.get('accept') ?? '';
    let pathname = decodeURIComponent(url.pathname);

    if (pathname.endsWith('/')) {
      const mdCandidate = join(ROOT_DIR, pathname.slice(1), 'index.md');
      if (accept.includes('text/markdown') && existsSync(mdCandidate)) {
        return new Response(Bun.file(mdCandidate), {
          headers: { 'content-type': 'text/markdown; charset=utf-8' },
        });
      }
      pathname = `${pathname}index.html`;
    }

    const filePath = join(ROOT_DIR, pathname.slice(1));
    if (existsSync(filePath)) {
      return new Response(Bun.file(filePath));
    }

    const dirIndex = join(ROOT_DIR, pathname.slice(1), 'index.html');
    if (existsSync(dirIndex)) {
      return new Response(Bun.file(dirIndex));
    }

    return new Response('Not Found\n', { status: 404 });
  },
});

console.log(`rig-c.org static server listening on http://localhost:${server.port}`);
