# VS Code Extensions

VS Code extensions by [Ex Nihilo LLC](https://www.ex-nihilo.llc/), published as `ExNihiloLLC` on the Marketplace.

| Extension | Description |
| --- | --- |
| [Hide Dotfolders](hide-dotfolders) | One-click toggle to hide dotfolders from the Explorer |

## Contributing

### Setup

Requires Node.js (current LTS) and pnpm, at the version pinned in the root `package.json` `packageManager` field.

```sh
pnpm install
pnpm build   # all extensions
pnpm test    # all extensions (launches VS Code)
```

Run a single extension's scripts with `pnpm --filter <name> <script>`, e.g. `pnpm --filter hide-dotfolders test`.

### Running locally

Open the repo in VS Code, pick **Run hide-dotfolders** in Run and Debug, press F5. It starts a watch build and opens an Extension Development Host with the extension loaded.

### Adding an extension

1. Create a top-level folder. The folder name must match `name` in its `package.json` (the publish workflow relies on it).
2. Set `"publisher": "ExNihiloLLC"` and extend `../tsconfig.base.json` in its `tsconfig.json`.
3. Add `build`, `watch`, `test` and `vscode:prepublish` scripts. See `hide-dotfolders/package.json`.
4. Add a launch config to `.vscode/launch.json` and a watch task to `.vscode/tasks.json`.
5. Add a row to the table above.

### Pull requests

- Branch off `main`; PRs target `main`.
- Commit messages: `<Feature|Bug|Refactor|Docs|Chore>: Short description`, with an optional bullet list of changes.
- Run `pnpm test` before opening a PR.

### Releasing

1. Bump `version` in the extension's `package.json` and merge to `main`.
2. Tag the merge commit as `<extension>-vA.B.C` and push it:

   ```sh
   git tag hide-dotfolders-v1.0.0
   git push origin hide-dotfolders-v1.0.0
   ```

3. The [Publish workflow](.github/workflows/publish.yml) checks that the tag matches the extension's `name` and `version`, runs its tests and publishes it to the Marketplace.

Publishing uses Marketplace trusted publishing (OIDC), no token secret. The `ExNihiloLLC` publisher has a policy for `ZacharyEggert/vs-code-extensions`, workflow `publish.yml`, no environment.

## License

[MIT](LICENSE)
