# Hide Dotfolders

One-click toggle to hide dotfolders (`.vscode`, `.github`, `.idea`, …) from the Explorer.

## Usage

- Click the eye icon in the Explorer title bar to hide; it becomes eye-closed — click it to show.
- Or run **Hide Dotfolders: Toggle** from the Command Palette.

## How it works

Hiding scans the top level of each workspace folder for dotfolders and adds a `**/.name: true` entry to `files.exclude` for each one. Showing removes only the entries the extension added.

- Any key already in effective `files.exclude` (VS Code defaults, user, workspace, or folder settings — even `false`) is left alone. Matching is by exact key, so equivalent patterns like `.vscode/**` aren't recognized.
- `.git` is already hidden by VS Code's default `files.exclude`, so the toggle doesn't touch it.
- An added entry you change to `false` is treated as yours and kept on show.
- While hidden, dotfolders are rescanned on startup and when folders are added to the workspace. Dotfolders created on disk in between aren't picked up until then.
- Dotfiles (`.env`, `.gitignore`, …) are not scanned. But `**/.name` patterns match anything with that name at any depth, including nested files.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `hideDotfolders.scope` | `global` | Where entries are written: `global` (user settings) or `workspace` (this workspace's settings). Changing it while hidden applies to the next hide. |

- **`global`**: hidden state is shared across all projects. Opening another project while hidden adds its dotfolders to user settings too.
- **`workspace`**: requires an open folder. Writes to `.vscode/settings.json` (or the `.code-workspace` file), creating it if needed.

With `global` scope and Settings Sync on (Settings + Extensions), the entries and the extension's record of them both sync, so any machine can show them again.

## License

MIT
