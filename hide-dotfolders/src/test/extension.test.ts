import * as assert from 'node:assert';
import * as vscode from 'vscode';

const exclude = () =>
  vscode.workspace.getConfiguration('files').inspect<Record<string, boolean>>('exclude')!.globalValue;

suite('hideDotfolders.toggle', () => {
  test('hides only dotfolders, keeps user entries, then restores', async () => {
    // user already owns .beta (explicitly visible) — must be skipped and survive
    await vscode.workspace
      .getConfiguration('files')
      .update('exclude', { '**/.beta': false }, vscode.ConfigurationTarget.Global);

    await vscode.commands.executeCommand('hideDotfolders.toggle');
    assert.deepStrictEqual(exclude(), { '**/.beta': false, '**/.alpha': true });

    await vscode.commands.executeCommand('hideDotfolders.toggle');
    assert.deepStrictEqual(exclude(), { '**/.beta': false });
  });
});
