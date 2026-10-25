import { existsSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { parseOutputArgs } from './output.ts';

const ROOT_DIR = parseOutputArgs();
const PORT = Number(process.env.PORT ?? 4321);
if (!existsSync(join(ROOT_DIR, 'index.html'))) throw new Error('Build the output directory before serving');

const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    const accept = req.headers.get('accept') ?? '';
    let pathname: string;
    try { pathname = decodeURIComponent(url.pathname); }
    catch { return new Response('Bad Request\n', { status: 400 }); }
    const absolute = resolve(ROOT_DIR, `.${pathname}`);
    const rel = relative(ROOT_DIR, absolute);
    if (rel === '..' || rel.startsWith(`..${sep}`) || pathname.includes('\0')) {
      return new Response('Forbidden\n', { status: 403 });
    }
    if (pathname.endsWith('/')) {
      const mdCandidate = join(absolute, 'index.md');
      if (accept.includes('text/markdown') && existsSync(mdCandidate)) {
        return new Response(Bun.file(mdCandidate), { headers: { 'content-type': 'text/markdown; charset=utf-8' } });
      }
    }
    const filePath = existsSync(absolute) && statSync(absolute).isFile() ? absolute : join(absolute, 'index.html');
    if (existsSync(filePath) && statSync(filePath).isFile()) return new Response(Bun.file(filePath));
    return new Response('Not Found\n', { status: 404 });
  },
});
console.log(`rig-c.org static server listening on http://localhost:${server.port} from ${ROOT_DIR}`);
