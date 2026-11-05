import * as vscode from 'vscode';

type Target = 'global' | 'workspace';
/** What we hid and where; `keys` are only the files.exclude entries we added. */
type HideRecord = { target: Target; keys: string[] };

const RECORD = 'hideDotfolders.record';
const CONTEXT_KEY = 'hideDotfolders.hidden';

export function activate(context: vscode.ExtensionContext) {
  // sync global record so another machine can undo synced user-settings entries
  context.globalState.setKeysForSync([RECORD]);

  // workspace record first: its entries live in this workspace's settings
  const stores = [context.workspaceState, context.globalState];
  const hiddenStore = () => stores.find((s) => s.get<HideRecord>(RECORD));
  const syncContext = () =>
    vscode.commands.executeCommand('setContext', CONTEXT_KEY, hiddenStore() !== undefined);

  const toggle = async () => {
    const store = hiddenStore();
    if (store) {
      await show(store);
    } else {
      const target = vscode.workspace.getConfiguration('hideDotfolders').get<Target>('scope', 'global');
      if (target === 'workspace' && !vscode.workspace.workspaceFolders?.length) {
        vscode.window.showErrorMessage('Hide Dotfolders: workspace scope needs an open folder.');
        return;
      }
      await hide(target === 'workspace' ? context.workspaceState : context.globalState, target);
    }
    await syncContext();
  };

  // while hidden, pick up dotfolders of newly opened projects/folders (add-only)
  const rescan = async () => {
    for (const store of stores) {
      const record = store.get<HideRecord>(RECORD);
      if (record) await hide(store, record.target);
    }
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('hideDotfolders.toggle', toggle),
    vscode.commands.registerCommand('hideDotfolders.hide', toggle),
    vscode.commands.registerCommand('hideDotfolders.show', toggle),
    vscode.workspace.onDidChangeWorkspaceFolders(rescan),
  );
  return rescan().then(syncContext);
}

/** Adds `**\/.name` for each new top-level dotfolder; merges into an existing record. */
async function hide(store: vscode.Memento, target: Target) {
  const record = store.get<HideRecord>(RECORD) ?? { target, keys: [] };
  // effective value (defaults + user + workspace): any existing key is user-owned or already ours → skip
  const effective = vscode.workspace.getConfiguration('files').get<Record<string, boolean>>('exclude', {});
  const added = (await dotfolderNames()).map((n) => `**/${n}`).filter((k) => !(k in effective));
  if (added.length) {
    await writeExclude(record.target, (v) => {
      for (const k of added) v[k] = true;
    });
  }
  await store.update(RECORD, { ...record, keys: [...record.keys, ...added] });
}

async function show(store: vscode.Memento) {
  const record = store.get<HideRecord>(RECORD)!;
  await writeExclude(record.target, (v) => {
    for (const k of record.keys) delete v[k];
  });
  await store.update(RECORD, undefined);
}

async function writeExclude(target: Target, edit: (value: Record<string, boolean>) => void) {
  const config = vscode.workspace.getConfiguration('files');
  const inspected = config.inspect<Record<string, boolean>>('exclude');
  const value = { ...(target === 'global' ? inspected?.globalValue : inspected?.workspaceValue) };
  edit(value);
  await config.update(
    'exclude',
    Object.keys(value).length ? value : undefined,
    target === 'global' ? vscode.ConfigurationTarget.Global : vscode.ConfigurationTarget.Workspace,
  );
}

// ponytail: top-level only per root, `**/` patterns cover same-named nested dirs; recursive scan if nested-only dotfolders matter
async function dotfolderNames() {
  const names = new Set<string>();
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    for (const [name, type] of await vscode.workspace.fs.readDirectory(folder.uri)) {
      if (name.startsWith('.') && type & vscode.FileType.Directory) names.add(name);
    }
  }
  return [...names];
}

export function deactivate() {}
