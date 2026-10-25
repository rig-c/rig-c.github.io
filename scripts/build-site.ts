import { buildSite } from '../src/build.ts';
import { parseOutputArgs } from '../src/output.ts';
import type { RegistryFetch } from '../src/versions.ts';

export type FailureFixture = 'none' | 'invalid-version';
export function failureFixture(value: string): FailureFixture {
  if (value !== 'none' && value !== 'invalid-version') throw new Error(`Unknown build fixture: ${value}`);
  return value;
}

// The plant uses the real exported builder and resolver. It is deliberately NOT an expected
// failure: its exception escapes the CLI so the dispatched Actions build job stays red.
export async function buildForActions(outDir: string, fixture: FailureFixture): Promise<void> {
  let fetchRegistry: RegistryFetch | undefined;
  if (fixture === 'invalid-version') {
    fetchRegistry = async (url) => {
      const name = decodeURIComponent(new URL(url).pathname.slice(1, -'/latest'.length));
      return Response.json({ name, version: 'INVALID_VERSION_FIXTURE' });
    };
  }
  await buildSite({ outDir, fetchRegistry });
  // Independent tripwire: a resolver regression can NEVER turn the plant into a green build.
  if (fixture !== 'none') throw new Error('Failure fixture was unexpectedly accepted; deployment remains forbidden');
}

if (import.meta.main) {
  await buildForActions(parseOutputArgs(), failureFixture(process.env.SITE_FAILURE_FIXTURE ?? 'none'));
}
