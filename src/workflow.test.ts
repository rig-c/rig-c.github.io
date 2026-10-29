import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT_DIR } from './output.ts';

const workflow = Bun.YAML.parse(readFileSync(join(ROOT_DIR, '.github/workflows/pages.yml'), 'utf8')) as any;
const jobs = workflow.jobs;

describe('Actions deployment authority and ordering', () => {
  test('only deploy gets write authority; actual mode is queried with authenticated read permission', () => {
    expect(workflow.permissions).toEqual({});
    expect(jobs.build.permissions).toEqual({ contents: 'read' });
    expect(jobs['pages-mode'].permissions).toEqual({ contents: 'read', pages: 'read' });
    expect(jobs.deploy.permissions).toEqual({ pages: 'write', 'id-token': 'write' });
    expect(jobs.deploy.environment.name).toBe('github-pages');
    const gate = jobs['pages-mode'].steps.find((step: any) => step.id === 'mode');
    expect(gate.env.GH_TOKEN).toBe('${{ github.token }}');
    expect(gate.run).toContain('gh api "repos/$SITE_REPOSITORY/pages"');
    expect(gate.run).toContain("--jq '.build_type'");
    expect(gate.run).toContain("workflow) echo 'enabled=true'");
    expect(gate.run).toContain('set -euo pipefail');
    expect(JSON.stringify(workflow)).not.toContain('configure-pages');
  });

  test('PRs and fixtures cannot reach upload or deploy, and no change skips both', () => {
    const upload = jobs.build.steps.find((step: any) => step.uses?.startsWith('actions/upload-pages-artifact@'));
    expect(upload).toBeDefined();
    for (const condition of [upload.if, jobs.deploy.if]) {
      expect(condition).toContain("github.event_name != 'pull_request'");
      expect(condition).toContain("github.ref == 'refs/heads/main'");
      expect(condition).toContain("inputs.failure_fixture != 'invalid-version'");
      expect(condition).toContain("needs.pages-mode.outputs.enabled == 'true'");
      expect(condition).toContain("changed == 'true'");
      expect(condition).toContain('success()');
    }
    expect(jobs.deploy.needs).toEqual(['pages-mode', 'build']);
    expect(workflow.concurrency['cancel-in-progress']).toBe(false);
    expect(workflow.on.schedule).toEqual([{ cron: '17 * * * *' }]);
  });

  test('test, build, verify and live comparison precede standard artifact upload', () => {
    const steps = jobs.build.steps;
    const position = (predicate: (step: any) => boolean) => steps.findIndex(predicate);
    const testIndex = position((step) => step.run === 'bun run test');
    const buildIndex = position((step) => step.run === 'bun run build:ci');
    const verifyIndex = position((step) => step.run === 'bun run verify');
    const compareIndex = position((step) => step.run === 'bun run compare:live');
    const uploadIndex = position((step) => step.uses === 'actions/upload-pages-artifact@v4');
    expect(testIndex).toBeGreaterThanOrEqual(0);
    expect(buildIndex).toBeGreaterThan(testIndex);
    expect(verifyIndex).toBeGreaterThan(buildIndex);
    const smokeIndex = position((step) => step.run === 'bun run test:browser');
    expect(smokeIndex).toBeGreaterThan(verifyIndex);
    expect(compareIndex).toBeGreaterThan(smokeIndex);
    expect(steps[smokeIndex]['timeout-minutes']).toBe(3);
    expect(steps[smokeIndex]['continue-on-error']).toBeUndefined();
    expect(jobs.build['timeout-minutes']).toBe(10);
    const install = steps.find((step: any) => step.run === 'bun install --frozen-lockfile');
    expect(install).toBeDefined();
    const browserInstall = steps.find((step: any) => step.run === 'bunx --no-install playwright install --with-deps chromium');
    expect(browserInstall.env.PLAYWRIGHT_SKIP_BROWSER_GC).toBe('1');
    expect(uploadIndex).toBeGreaterThan(compareIndex);
    expect(steps[buildIndex]['continue-on-error']).toBeUndefined();
    expect(steps[buildIndex].env.SITE_FAILURE_FIXTURE).toBe("${{ inputs.failure_fixture || 'none' }}");
    expect(jobs.deploy.steps[0].uses).toBe('actions/deploy-pages@v4');
  });
});
