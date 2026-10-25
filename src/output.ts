import { lstatSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

import { MANIFEST_PATH, parseManifest } from './deployment.ts';

export const ROOT_DIR = resolve(import.meta.dir, '..');
export const DEFAULT_OUTPUT = resolve(ROOT_DIR, '_site');

// A typo must never turn output replacement into deletion of authored inputs.
export function outputRoot(value = DEFAULT_OUTPUT): string {
  const destination = resolve(ROOT_DIR, value);
  const rel = relative(ROOT_DIR, destination);
  const back = relative(destination, ROOT_DIR);
  if (!back || (!back.startsWith(`..${sep}`) && back !== '..' && !isAbsolute(back))) {
    throw new Error('Output must not be the repository or an ancestor');
  }
  const outside = rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel);
  if (!outside && !['_site', 'dist'].includes(rel.split(sep)[0]!)) {
    throw new Error('In-repository output must be under _site/ or dist/');
  }
  if (destination.split(sep).includes('.git')) throw new Error('Output must not be a .git path');
  // Canonical paths only, including system ancestors (macOS: /private/tmp, not /tmp).
  // Reject aliases instead of following them into a different source or checkout.
  for (let path = destination; ; path = resolve(path, '..')) {
    const status = lstatSync(path, { throwIfNoEntry: false });
    if (status?.isSymbolicLink()) throw new Error(`Symlink in output path; use its canonical realpath: ${path}`);
    if (path !== ROOT_DIR && status?.isDirectory() && lstatSync(join(path, '.git'), { throwIfNoEntry: false })) throw new Error(`Output belongs to another checkout: ${path}`);
    if (resolve(path, '..') === path) break;
  }
  return destination;
}

// Validate ownership separately from path resolution: verify/serve may inspect a damaged artifact,
// but a builder must never replace unrelated files. The marker's own digest is validated; current
// bytes need not match it, and previously recorded files may already have been removed.
export function assertReplaceableOutput(value: string): void {
  const destination = outputRoot(value);
  if (!existsSync(destination)) return;
  if (!lstatSync(destination).isDirectory()) throw new Error('Output destination is not a directory');
  const entries = readdirSync(destination);
  if (entries.length === 0) return;
  const marker = join(destination, MANIFEST_PATH);
  let owned: Set<string>;
  try {
    if (!lstatSync(marker).isFile()) throw new Error('Marker must be a regular file');
    const manifest = parseManifest(readFileSync(marker, 'utf8'));
    owned = new Set(manifest.files.map((file) => file.path));
    if (!['index.html', 'index.md', 'llms.txt', 'CNAME'].every((path) => owned.has(path))) {
      throw new Error('Marker does not identify a generated site');
    }
  } catch (error) {
    throw new Error(`Refusing to replace nonempty output without a valid generated-site manifest: ${String(error)}`);
  }
  const directories = new Set<string>();
  for (const path of owned) {
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i++) directories.add(parts.slice(0, i).join('/'));
  }
  function inspect(rel: string): void {
    for (const entry of readdirSync(join(destination, rel), { withFileTypes: true })) {
      const path = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.name === '.git') throw new Error('Refusing to replace a checkout/.git destination');
      if (entry.isSymbolicLink()) throw new Error(`Refusing symlink in previous output: ${path}`);
      if (entry.isDirectory() && directories.has(path)) inspect(path);
      else if (!entry.isFile() || (path !== MANIFEST_PATH && !owned.has(path))) {
        throw new Error(`Refusing unknown file or directory in previous output: ${path}`);
      }
    }
  }
  inspect('');
}

export function parseOutputArgs(args = process.argv.slice(2)): string {
  if (args.length === 0) return DEFAULT_OUTPUT;
  if (args.length !== 2 || args[0] !== '--out' || !args[1]) {
    throw new Error('Usage: [--out <output-directory>]');
  }
  return outputRoot(args[1]);
}
