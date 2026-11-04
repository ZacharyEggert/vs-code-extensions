import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('hideDotfolders.toggle', () => {
      vscode.window.showInformationMessage('Hide Dotfolders: toggle not implemented yet');
    }),
  );
}

export function deactivate() {}
