import { appendFileSync } from 'node:fs';
import { compareLive, verifyManifest } from '../src/deployment.ts';
import { parseOutputArgs } from '../src/output.ts';

const result = await compareLive(verifyManifest(parseOutputArgs()));
console.log(JSON.stringify(result));
// Emit eligibility only after all local and network validation succeeds.
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `changed=${result.changed}\nsha256=${result.sha256}\n`);
}
