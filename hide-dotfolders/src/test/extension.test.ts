import * as assert from 'node:assert';
import * as vscode from 'vscode';

suite('hide-dotfolders', () => {
  test('activates and registers toggle command', async () => {
    await vscode.extensions.getExtension('ex-nihilo.hide-dotfolders')!.activate();
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('hideDotfolders.toggle'));
  });
});
