import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const APP_PATH = path.join(ROOT, 'PetSyncApp.js');
const MEDIA_PATH = path.join(ROOT, 'src', 'models', 'communityMedia.js');
const CHECK_DIR = path.join(ROOT, '.petsync-refactor-web-check');
const BACKUP_DIR = path.join(ROOT, '.git', 'petsync-refactor-backups');
const APP_BACKUP = path.join(BACKUP_DIR, `PetSyncApp-stage4-${Date.now()}.js`);
const MEDIA_BACKUP = path.join(BACKUP_DIR, `communityMedia-stage4-${Date.now()}.js`);
const EXPECTED_BRANCH = 'petsync-clean-refactor';

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
    shell: false,
    ...options,
  });
  if (result.error) throw result.error;
  return result;
};

const capture = (command, args) => {
  const result = run(command, args, { capture: true });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `${command} failed`).trim());
  }
  return (result.stdout || '').trim();
};

const validateWeb = () => {
  console.log('\nRunning Expo web export validation...');
  fs.rmSync(CHECK_DIR, { recursive: true, force: true });

  let result;
  if (process.platform === 'win32') {
    result = run('powershell.exe', [
      '-NoProfile',
      '-Command',
      'npx expo export --platform web --output-dir .petsync-refactor-web-check --clear',
    ]);
  } else {
    result = run('npx', [
      'expo',
      'export',
      '--platform',
      'web',
      '--output-dir',
      '.petsync-refactor-web-check',
      '--clear',
    ]);
  }

  fs.rmSync(CHECK_DIR, { recursive: true, force: true });
  if (result.status !== 0) throw new Error('Expo web export validation failed.');
};

const branch = capture('git', ['branch', '--show-current']);
if (branch !== EXPECTED_BRANCH) {
  throw new Error(`STOP: expected branch ${EXPECTED_BRANCH}, but current branch is ${branch || '(unknown)'}.`);
}

const dirtyBefore = capture('git', ['status', '--porcelain']);
if (dirtyBefore) {
  throw new Error(`STOP: working tree is not clean before stage 4:\n${dirtyBefore}`);
}

if (!fs.existsSync(APP_PATH) || !fs.existsSync(MEDIA_PATH)) {
  throw new Error('STOP: required Stage 4 files were not found.');
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });
fs.copyFileSync(APP_PATH, APP_BACKUP);
fs.copyFileSync(MEDIA_PATH, MEDIA_BACKUP);

const originalApp = fs.readFileSync(APP_PATH, 'utf8');
const originalMedia = fs.readFileSync(MEDIA_PATH, 'utf8');
let app = originalApp;
let media = originalMedia;
let changed = false;

try {
  // Remove the extracted module's dependency on the old PetSyncApp.js global.
  if (media.includes('const mapCommunityPostRow = (row) => {')) {
    media = media.replace(
      'const mapCommunityPostRow = (row) => {',
      "const mapCommunityPostRow = (row, currentUserId = '') => {",
    );
    changed = true;
  }

  if (media.includes("String(CURRENT_USER_OWNER_ID || '')")) {
    media = media.replaceAll(
      "String(CURRENT_USER_OWNER_ID || '')",
      "String(currentUserId || '')",
    );
    changed = true;
  }

  // Preserve ownership behavior at the common array-mapping call sites in PetSyncApp.js.
  const mapPatterns = [
    '.map(mapCommunityPostRow)',
    '.map(mapCommunityPostRow);',
  ];
  for (const pattern of mapPatterns) {
    if (app.includes(pattern)) {
      app = app.replaceAll(
        pattern,
        pattern.endsWith(';')
          ? '.map((row) => mapCommunityPostRow(row, CURRENT_USER_OWNER_ID));'
          : '.map((row) => mapCommunityPostRow(row, CURRENT_USER_OWNER_ID))',
      );
      changed = true;
    }
  }

  if (media.includes('CURRENT_USER_OWNER_ID')) {
    throw new Error('communityMedia.js still contains a hidden CURRENT_USER_OWNER_ID dependency.');
  }

  if (changed) {
    fs.writeFileSync(APP_PATH, app, 'utf8');
    fs.writeFileSync(MEDIA_PATH, media, 'utf8');
  } else {
    console.log('Stage 4 hardening is already applied; no source edits needed.');
  }

  validateWeb();

  const dirtyAfter = capture('git', ['status', '--porcelain']);
  if (!dirtyAfter) {
    console.log('\nSUCCESS: Stage 4 is already applied and validated. Nothing to commit.');
    console.log(`Hidden backups kept at: ${APP_BACKUP} and ${MEDIA_BACKUP}`);
    process.exit(0);
  }

  const add = run('git', ['add', 'PetSyncApp.js', 'src/models/communityMedia.js']);
  if (add.status !== 0) throw new Error('git add failed.');

  const staged = capture('git', ['diff', '--cached', '--name-only']);
  if (!staged) {
    console.log('\nSUCCESS: Stage 4 validated with no staged source changes.');
    process.exit(0);
  }

  const commit = run('git', ['commit', '-m', 'Harden community media ownership mapping']);
  if (commit.status !== 0) throw new Error('git commit failed.');

  const push = run('git', ['push']);
  if (push.status !== 0) {
    console.log('\nStage 4 commit succeeded, but push failed. Your local commit is safe.');
    process.exitCode = 2;
  } else {
    console.log('\nSUCCESS: Stage 4 hardening validated, committed, and pushed.');
  }

  console.log(`Hidden backups kept at: ${APP_BACKUP} and ${MEDIA_BACKUP}`);
} catch (error) {
  console.error(`\nSTAGE 4 FAILED: ${error.message}`);
  console.error('Restoring Stage 4 source files...');

  fs.writeFileSync(APP_PATH, originalApp, 'utf8');
  fs.writeFileSync(MEDIA_PATH, originalMedia, 'utf8');
  fs.rmSync(CHECK_DIR, { recursive: true, force: true });
  run('git', ['reset', '--', 'PetSyncApp.js', 'src/models/communityMedia.js']);

  console.error('Original files restored. No Stage 4 source commit was created.');
  process.exitCode = 1;
}
