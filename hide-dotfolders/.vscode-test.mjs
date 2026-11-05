import { defineConfig } from '@vscode/test-cli';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export default defineConfig({
  files: 'out/test/**/*.test.js',
  workspaceFolder: 'test-fixture/fixture.code-workspace',
  // fresh profile per run: test-electron otherwise reuses .vscode-test/user-data, leaking state between runs
  launchArgs: [`--user-data-dir=${mkdtempSync(join(tmpdir(), 'hide-dotfolders-'))}`, '--disable-extensions'],
});
