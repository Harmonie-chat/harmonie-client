import { readFileSync, writeFileSync } from 'node:fs';

const version = process.env.RELEASE_VERSION?.replace(/^v/, '');
const pubkey = process.env.TAURI_UPDATER_PUBKEY;

if (!version) {
  throw new Error('RELEASE_VERSION is required.');
}

if (!pubkey) {
  throw new Error('TAURI_UPDATER_PUBKEY secret is required for desktop releases.');
}

const writeJson = (file, data) => {
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
};

const packagePath = 'apps/harmonie/package.json';
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
packageJson.version = version;
writeJson(packagePath, packageJson);

const tauriPath = 'apps/harmonie/src-tauri/tauri.conf.json';
const tauriConfig = JSON.parse(readFileSync(tauriPath, 'utf8'));
tauriConfig.version = version;
tauriConfig.plugins.updater.pubkey = pubkey;
writeJson(tauriPath, tauriConfig);

const cargoPath = 'apps/harmonie/src-tauri/Cargo.toml';
const cargo = readFileSync(cargoPath, 'utf8');
writeFileSync(cargoPath, cargo.replace(/^version = ".*"$/m, `version = "${version}"`));
