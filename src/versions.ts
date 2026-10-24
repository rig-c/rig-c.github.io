import { createHash } from 'node:crypto';

type RegistryFetch = (url: string, init: RequestInit) => Promise<Response>;

export interface PublishedVersion {
  name: string;
  version: string;
  url: string;
  sha256: string;
}

// Fetch exact latest manifests once per build. A failed lookup never falls back to page metadata.
export async function publishedVersions(
  names: readonly string[],
  fetchRegistry: RegistryFetch = fetch,
): Promise<PublishedVersion[]> {
  return Promise.all([...new Set(names)].sort().map(async (name) => {
    const url = `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`;
    try {
      const response = await fetchRegistry(url, {
        headers: { accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.text();
      const manifest = JSON.parse(body);
      if (manifest?.name !== name) throw new Error('manifest package name does not match');
      if (typeof manifest.version !== 'string'
        || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(manifest.version)) {
        throw new Error('manifest has no valid version');
      }
      return { name, version: manifest.version, url, sha256: createHash('sha256').update(body).digest('hex') };
    } catch (error) {
      throw new Error(`npm latest lookup failed for ${name} (${url}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }));
}

export function versionLabel(names: readonly string[], versions: ReadonlyMap<string, string>): string {
  return names.map((name) => {
    const version = versions.get(name);
    if (!version) throw new Error(`npm latest version not resolved for ${name}`);
    return names.length === 1 ? version : `${name.split('/').at(-1)} ${version}`;
  }).join(' / ');
}
