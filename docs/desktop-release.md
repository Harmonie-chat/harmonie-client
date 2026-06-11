# Desktop releases

Harmonie desktop is a Tauri app wrapping `apps/harmonie`.

## Local commands

- `pnpm tauri:dev` starts the desktop app in development mode.
- `pnpm tauri:build:app` builds a local macOS `.app` without updater signing.
- `pnpm tauri:build` builds a local macOS `.app` without updater signing.
- `pnpm tauri:build:release` builds the desktop installers locally and requires updater signing environment variables.
- `pnpm --filter @harmonie/app tauri build --no-bundle` validates the desktop executable without producing installers.

## Updater signing keys

Tauri updater artifacts must be signed. Generate the updater key pair once:

```sh
pnpm --filter @harmonie/app tauri signer generate -w ~/.tauri/harmonie.key
```

Add these GitHub Actions secrets:

- `TAURI_SIGNING_PRIVATE_KEY`: the private key content used by Tauri to sign release artifacts.
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: the password if one was set. The workflow also works when this secret is not defined.
- `TAURI_UPDATER_PUBKEY`: the public key printed by the signer command.

Keep the private key backed up. Existing installed apps can only update to releases signed with the same key.

The committed `tauri.conf.json` keeps `plugins.updater.pubkey` empty so local builds can run before release secrets exist. The GitHub release workflow replaces it with `TAURI_UPDATER_PUBKEY` before building signed release artifacts.

## Manual release flow

Run the `Desktop Release` GitHub Action manually and provide a SemVer version like `1.0.0`.

The workflow builds macOS, Windows, and Linux artifacts, creates updater artifacts, publishes the GitHub release after every platform succeeds, and exposes `latest.json` at:

```txt
https://github.com/Harmonie-chat/harmonie-client/releases/latest/download/latest.json
```

The desktop update button checks that file, downloads the matching signed artifact, installs it, then relaunches Harmonie.
