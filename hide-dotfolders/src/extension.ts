import * as vscode from 'vscode';

type Target = 'global' | 'workspace';
/** What we hid and where; `keys` are only the files.exclude entries we added. */
type HideRecord = { target: Target; keys: string[] };

const RECORD_KEY = 'hideDotfolders.record';
const CONTEXT_KEY = 'hideDotfolders.hidden';
const SETTINGS = {
  global: { value: 'globalValue', target: vscode.ConfigurationTarget.Global },
  workspace: { value: 'workspaceValue', target: vscode.ConfigurationTarget.Workspace },
} as const;

const readRecord = (store: vscode.Memento) => store.get<HideRecord>(RECORD_KEY);

export function activate(context: vscode.ExtensionContext) {
  // sync global record so another machine can undo synced user-settings entries
  context.globalState.setKeysForSync([RECORD_KEY]);

  // workspace record first: its entries live in this workspace's settings
  const storeOf = { workspace: context.workspaceState, global: context.globalState };
  const stores = [storeOf.workspace, storeOf.global];
  const hiddenStore = () => stores.find(readRecord);
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
      await hide(storeOf[target], { target, keys: [] });
    }
    await syncContext();
  };

  // while hidden, pick up dotfolders of newly opened projects/folders (add-only)
  const rescan = async () => {
    for (const store of stores) {
      const record = readRecord(store);
      if (record) await hide(store, record);
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

/** Adds `**\/.name` for each new top-level dotfolder; merges into `record` (existing or fresh). */
async function hide(store: vscode.Memento, record: HideRecord) {
  // effective value (defaults + user + workspace): any existing key is user-owned or already ours → skip
  const effective = vscode.workspace.getConfiguration('files').get<Record<string, boolean>>('exclude', {});
  const added = (await dotfolderNames()).map((n) => `**/${n}`).filter((k) => !(k in effective));
  if (added.length) {
    await writeExclude(record.target, (v) => {
      for (const k of added) v[k] = true;
    });
  }
  await store.update(RECORD_KEY, { ...record, keys: [...record.keys, ...added] });
}

async function show(store: vscode.Memento) {
  const record = readRecord(store)!;
  await writeExclude(record.target, (v) => {
    for (const k of record.keys) delete v[k];
  });
  await store.update(RECORD_KEY, undefined);
}

async function writeExclude(target: Target, edit: (value: Record<string, boolean>) => void) {
  const config = vscode.workspace.getConfiguration('files');
  const inspected = config.inspect<Record<string, boolean>>('exclude');
  const value = { ...inspected?.[SETTINGS[target].value] };
  edit(value);
  await config.update('exclude', Object.keys(value).length ? value : undefined, SETTINGS[target].target);
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
