import * as assert from 'node:assert';
import * as vscode from 'vscode';

const files = () => vscode.workspace.getConfiguration('files');
const exclude = () => files().inspect<Record<string, boolean>>('exclude')!.globalValue;
const setExclude = (value: Record<string, boolean> | undefined) =>
  files().update('exclude', value, vscode.ConfigurationTarget.Global);
const run = (command: string) => vscode.commands.executeCommand(`hideDotfolders.${command}`);

suite('hideDotfolders', () => {
  setup(async () => {
    await run('show');
    await setExclude(undefined);
  });

  test('toggle hides only dotfolders, keeps user entries, then restores', async () => {
    // user already owns .beta (explicitly visible) — must be skipped and survive
    await setExclude({ '**/.beta': false });

    await run('toggle');
    assert.deepStrictEqual(exclude(), { '**/.beta': false, '**/.alpha': true, '**/.vscode': true });

    await run('toggle');
    assert.deepStrictEqual(exclude(), { '**/.beta': false });
  });

  test('hide and show are idempotent, not toggles', async () => {
    await run('show');
    assert.deepStrictEqual(exclude(), undefined);

    await run('hide');
    await run('hide');
    assert.deepStrictEqual(exclude(), { '**/.alpha': true, '**/.beta': true, '**/.vscode': true });

    await run('show');
    await run('show');
    assert.deepStrictEqual(exclude(), undefined);
  });

  // b/.vscode/settings.json already excludes .gamma (folder-level, multi-root)
  test('hide skips keys excluded in any root folder settings', async () => {
    await run('hide');
    assert.deepStrictEqual(exclude(), { '**/.alpha': true, '**/.beta': true, '**/.vscode': true });
  });

  test('show keeps entries the user changed after hide', async () => {
    await run('hide');
    await setExclude({ '**/.alpha': false, '**/.beta': true });

    await run('show');
    assert.deepStrictEqual(exclude(), { '**/.alpha': false });
  });
});
