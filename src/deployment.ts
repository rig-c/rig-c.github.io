import { createHash, randomUUID } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SITE_ORIGIN } from './content.ts';

export const MANIFEST_PATH = 'deployment-manifest.json';
export const LIVE_MANIFEST_URL = `${SITE_ORIGIN}/${MANIFEST_PATH}`;
export interface ArtifactFile { path: string; bytes: number; sha256: string }
export interface DeploymentManifest { schema: 1; sha256: string; files: ArtifactFile[] }
export type HttpFetch = (url: string, init: RequestInit) => Promise<Response>;
const sha256 = (body: string | Uint8Array) => createHash('sha256').update(body).digest('hex');
const comparePath = (a: ArtifactFile, b: ArtifactFile) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
const digestFiles = (files: ArtifactFile[]) => sha256(JSON.stringify(files));

// Include path, byte count and byte digest for EVERY deployable file; a removal changes the hash.
// The manifest excludes itself and has no clocks, source SHAs or run IDs.
export function artifactManifest(root: string): DeploymentManifest {
  const files: ArtifactFile[] = [];
  function walk(rel: string) {
    for (const entry of readdirSync(join(root, rel), { withFileTypes: true })) {
      if (entry.name.startsWith('.')) throw new Error(`Hidden file is excluded by Pages upload: ${entry.name}`);
      const path = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Artifact contains symlink: ${path}`);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) {
        if (path === MANIFEST_PATH) continue;
        const body = readFileSync(join(root, path));
        files.push({ path, bytes: body.byteLength, sha256: sha256(body) });
      } else throw new Error(`Unsupported artifact entry: ${path}`);
    }
  }
  walk('');
  files.sort(comparePath);
  return { schema: 1, sha256: digestFiles(files), files };
}

export function writeManifest(root: string): DeploymentManifest {
  const manifest = artifactManifest(root);
  writeFileSync(join(root, MANIFEST_PATH), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

function exactKeys(value: object, keys: string[]): boolean {
  return Object.keys(value).sort().join(',') === keys.sort().join(',');
}

export function parseManifest(raw: string): DeploymentManifest {
  if (raw.length > 16_000_000) throw new Error('Deployment manifest too large');
  const value = JSON.parse(raw);
  const hex = /^[a-f0-9]{64}$/;
  if (!value || value.schema !== 1 || typeof value.sha256 !== 'string' || !hex.test(value.sha256) || !Array.isArray(value.files)
    || !value.files.length || !exactKeys(value, ['schema', 'sha256', 'files'])) {
    throw new Error('Invalid deployment manifest header');
  }
  let previous = '';
  for (const file of value.files) {
    if (!file || typeof file.path !== 'string' || file.path <= previous || file.path === MANIFEST_PATH
      || file.path.startsWith('/') || /[\\\x00-\x1f]/.test(file.path)
      || file.path.split('/').some((part: string) => !part || part.startsWith('.'))
      || !Number.isSafeInteger(file.bytes) || file.bytes < 0 || typeof file.sha256 !== 'string' || !hex.test(file.sha256)
      || !exactKeys(file, ['path', 'bytes', 'sha256'])) {
      throw new Error('Invalid deployment manifest file list');
    }
    previous = file.path;
  }
  // Reconstruct field order instead of trusting JSON object insertion order from the network.
  const files = value.files.map((file: ArtifactFile) => ({ path: file.path, bytes: file.bytes, sha256: file.sha256 }));
  if (digestFiles(files) !== value.sha256) throw new Error('Deployment manifest digest mismatch');
  return { schema: 1, sha256: value.sha256, files };
}

export function verifyManifest(root: string): DeploymentManifest {
  const recorded = parseManifest(readFileSync(join(root, MANIFEST_PATH), 'utf8'));
  const actual = artifactManifest(root);
  if (actual.sha256 !== recorded.sha256) throw new Error('Artifact files differ from deployment manifest');
  return recorded;
}

export async function compareLive(candidate: DeploymentManifest, fetchLive: HttpFetch = fetch): Promise<{
  changed: boolean; sha256: string; liveSha256: string | null; reason: 'initial-404' | 'different' | 'identical';
}> {
  // Validate even injected callers; malformed local data must never authorize a deployment.
  const local = parseManifest(JSON.stringify(candidate));
  const requestUrl = new URL(LIVE_MANIFEST_URL);
  requestUrl.searchParams.set('check', randomUUID());
  const response = await fetchLive(requestUrl.href, {
    headers: { accept: 'application/json', 'cache-control': 'no-cache, no-store', pragma: 'no-cache' },
    cache: 'no-store', signal: AbortSignal.timeout(15_000), redirect: 'error',
  });
  if (response.status === 404) {
    return { changed: true, sha256: local.sha256, liveSha256: null, reason: 'initial-404' };
  }
  if (!response.ok) throw new Error(`Live manifest comparison failed: HTTP ${response.status}`);
  const live = parseManifest(await response.text());
  const changed = local.sha256 !== live.sha256;
  return { changed, sha256: local.sha256, liveSha256: live.sha256, reason: changed ? 'different' : 'identical' };
}
