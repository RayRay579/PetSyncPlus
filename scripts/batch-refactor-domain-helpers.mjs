import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const APP_PATH = path.join(ROOT, 'PetSyncApp.js');
const MODEL_PATH = path.join(ROOT, 'src', 'models', 'petModel.js');
const CHECK_DIR = path.join(ROOT, '.petsync-refactor-web-check');
const BACKUP_DIR = path.join(ROOT, '.git', 'petsync-refactor-backups');
const APP_BACKUP = path.join(BACKUP_DIR, `PetSyncApp-stage5-${Date.now()}.js`);
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
  throw new Error(`STOP: working tree is not clean before stage 5:\n${dirtyBefore}`);
}

if (!fs.existsSync(APP_PATH)) {
  throw new Error('STOP: PetSyncApp.js was not found.');
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });
fs.copyFileSync(APP_PATH, APP_BACKUP);

const originalApp = fs.readFileSync(APP_PATH, 'utf8');
let app = originalApp;
let createdModel = false;

const extractRange = (startMarker, endMarker) => {
  const start = app.indexOf(startMarker);
  if (start < 0) throw new Error(`Could not locate start marker: ${startMarker}`);
  const end = app.indexOf(endMarker, start + startMarker.length);
  if (end < 0 || end <= start) throw new Error(`Could not locate end marker: ${endMarker}`);
  const block = app.slice(start, end).trimEnd();
  app = `${app.slice(0, start)}${app.slice(end)}`;
  return block;
};

try {
  if (app.includes("from './src/models/petModel'")) {
    console.log('Stage 5 pet model is already extracted.');
  } else {
    const soundsBlock = extractRange(
      'const PET_SOUNDS = {',
      'const SOS_SOUND =',
    );

    const petHelpersBlock = extractRange(
      'const getDefaultPetEmoji =',
      'const isSharedPetForCurrentUser =',
    );

    const modelSource = `import { PET_SPECIES_EMOJIS } from '../config/petSpecies';\n\n${soundsBlock.replaceAll("require('./assets/sounds/", "require('../../assets/sounds/")}\n\n${petHelpersBlock}\n\nexport {\n  PET_SOUNDS,\n  getDefaultPetEmoji,\n  getStarterPetScore,\n  getPetSoundAsset,\n  getPetOwnerIdentity,\n};\n`;

    fs.mkdirSync(path.dirname(MODEL_PATH), { recursive: true });
    fs.writeFileSync(MODEL_PATH, modelSource, 'utf8');
    createdModel = true;

    const reactImportEnd = app.indexOf('\n', app.indexOf('import React'));
    if (reactImportEnd < 0) throw new Error('Could not locate import insertion point.');

    const importText = `import {\n  PET_SOUNDS,\n  getDefaultPetEmoji,\n  getStarterPetScore,\n  getPetSoundAsset,\n  getPetOwnerIdentity,\n} from './src/models/petModel';\n`;
    app = `${app.slice(0, reactImportEnd + 1)}${importText}${app.slice(reactImportEnd + 1)}`;

    fs.writeFileSync(APP_PATH, app, 'utf8');
    console.log('EXTRACTED pet sounds and pure pet helpers -> src/models/petModel.js');
  }

  validateWeb();

  const dirtyAfter = capture('git', ['status', '--porcelain']);
  if (!dirtyAfter) {
    console.log('\nSUCCESS: Stage 5 is already applied and validated. Nothing to commit.');
    console.log(`Hidden backup kept at: ${APP_BACKUP}`);
    process.exit(0);
  }

  const filesToAdd = createdModel
    ? ['PetSyncApp.js', 'src/models/petModel.js']
    : ['PetSyncApp.js'];
  const add = run('git', ['add', ...filesToAdd]);
  if (add.status !== 0) throw new Error('git add failed.');

  const staged = capture('git', ['diff', '--cached', '--name-only']);
  if (!staged) {
    console.log('\nSUCCESS: Stage 5 validated with no staged source changes.');
    process.exit(0);
  }

  const commit = run('git', ['commit', '-m', 'Extract pet model helpers']);
  if (commit.status !== 0) throw new Error('git commit failed.');

  const push = run('git', ['push']);
  if (push.status !== 0) {
    console.log('\nStage 5 commit succeeded, but push failed. Your local commit is safe.');
    process.exitCode = 2;
  } else {
    console.log('\nSUCCESS: Stage 5 refactor validated, committed, and pushed.');
  }

  console.log(`Hidden backup kept at: ${APP_BACKUP}`);
} catch (error) {
  console.error(`\nSTAGE 5 FAILED: ${error.message}`);
  console.error('Restoring Stage 5 source files...');

  fs.writeFileSync(APP_PATH, originalApp, 'utf8');
  if (createdModel && fs.existsSync(MODEL_PATH)) fs.rmSync(MODEL_PATH, { force: true });
  fs.rmSync(CHECK_DIR, { recursive: true, force: true });
  run('git', ['reset', '--', 'PetSyncApp.js', 'src/models/petModel.js']);

  console.error('Original files restored. No Stage 5 source commit was created.');
  process.exitCode = 1;
}
