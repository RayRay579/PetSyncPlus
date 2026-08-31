import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const APP_PATH = path.join(ROOT, 'PetSyncApp.js');
const SERVICE_PATH = path.join(ROOT, 'src', 'services', 'health', 'healthRecordService.js');
const CHECK_DIR = path.join(ROOT, '.petsync-refactor-web-check');
const BACKUP_DIR = path.join(ROOT, '.git', 'petsync-refactor-backups');
const APP_BACKUP = path.join(BACKUP_DIR, `PetSyncApp-stage7-${Date.now()}.js`);
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
  throw new Error(`STOP: working tree is not clean before stage 7:\n${dirtyBefore}`);
}

if (!fs.existsSync(APP_PATH)) {
  throw new Error('STOP: PetSyncApp.js was not found.');
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });
fs.copyFileSync(APP_PATH, APP_BACKUP);

const originalApp = fs.readFileSync(APP_PATH, 'utf8');
let app = originalApp;
let createdService = false;

try {
  if (app.includes("from './src/services/health/healthRecordService'")) {
    console.log('Stage 7 health record service is already extracted.');
  } else {
    const startMarker = 'const resolveAccessibleSharedPetIds = async';
    const endMarker = 'const saveCareReminderToSupabase = async';
    const start = app.indexOf(startMarker);
    const end = app.indexOf(endMarker, start + startMarker.length);

    if (start < 0 || end < 0 || end <= start) {
      throw new Error('Could not locate the Stage 7 health-record block. No app files were changed.');
    }

    let block = app.slice(start, end).trimEnd();

    block = block.replace(
      'const saveHealthRecordToSupabase = async (record) => {',
      "const saveHealthRecordToSupabase = async (record, { currentUserId = null, ensureWritablePetByPetId = async () => true } = {}) => {",
    );
    block = block.replace(
      "const userId = CURRENT_USER_OWNER_ID || null;",
      'const userId = currentUserId || null;',
    );

    block = block.replace(
      'const updateHealthRecordInSupabase = async (record) => {',
      "const updateHealthRecordInSupabase = async (record, { currentUserId = null, ensureWritablePetByPetId = async () => true } = {}) => {",
    );
    block = block.replace(
      "const userId = CURRENT_USER_OWNER_ID || null;",
      'const userId = currentUserId || null;',
    );

    block = block.replace(
      'const deleteHealthRecordFromSupabase = async (recordId) => {',
      "const deleteHealthRecordFromSupabase = async (recordId, { ensureWritablePetByRecordId = async () => true } = {}) => {",
    );

    block = block.replace(
      'const loadHealthRecordsFromSupabase = async (currentUser = null, accessiblePetIds = []) => {',
      'const loadHealthRecordsFromSupabase = async (currentUser = null, accessiblePetIds = [], currentUserIdFallback = null) => {',
    );
    block = block.replace(
      'const currentUserId = currentUser?.id || CURRENT_USER_OWNER_ID;',
      'const currentUserId = currentUser?.id || currentUserIdFallback;',
    );

    if (block.includes('CURRENT_USER_OWNER_ID')) {
      throw new Error('Stage 7 service block still contains a hidden CURRENT_USER_OWNER_ID dependency.');
    }

    const serviceSource = `import { supabase } from '../../../supabase';\nimport { normalizeHealthRecordFromSupabase } from './healthRecordModel';\n\n${block}\n\nexport {\n  resolveAccessibleSharedPetIds,\n  saveHealthRecordToSupabase,\n  updateHealthRecordInSupabase,\n  deleteHealthRecordFromSupabase,\n  loadHealthRecordsFromSupabase,\n};\n`;

    fs.mkdirSync(path.dirname(SERVICE_PATH), { recursive: true });
    fs.writeFileSync(SERVICE_PATH, serviceSource, 'utf8');
    createdService = true;

    const wrappers = `const saveHealthRecordToSupabase = (record) =>\n  saveHealthRecordToSupabaseService(record, {\n    currentUserId: CURRENT_USER_OWNER_ID,\n    ensureWritablePetByPetId,\n  });\n\nconst updateHealthRecordInSupabase = (record) =>\n  updateHealthRecordInSupabaseService(record, {\n    currentUserId: CURRENT_USER_OWNER_ID,\n    ensureWritablePetByPetId,\n  });\n\nconst deleteHealthRecordFromSupabase = (recordId) =>\n  deleteHealthRecordFromSupabaseService(recordId, {\n    ensureWritablePetByRecordId,\n  });\n\nconst loadHealthRecordsFromSupabase = (currentUser = null, accessiblePetIds = []) =>\n  loadHealthRecordsFromSupabaseService(\n    currentUser,\n    accessiblePetIds,\n    CURRENT_USER_OWNER_ID,\n  );\n\n`;

    app = `${app.slice(0, start)}${wrappers}${app.slice(end)}`;

    const reactImportEnd = app.indexOf('\n', app.indexOf('import React'));
    if (reactImportEnd < 0) throw new Error('Could not locate import insertion point.');

    const importText = `import {\n  saveHealthRecordToSupabase as saveHealthRecordToSupabaseService,\n  updateHealthRecordInSupabase as updateHealthRecordInSupabaseService,\n  deleteHealthRecordFromSupabase as deleteHealthRecordFromSupabaseService,\n  loadHealthRecordsFromSupabase as loadHealthRecordsFromSupabaseService,\n} from './src/services/health/healthRecordService';\n`;
    app = `${app.slice(0, reactImportEnd + 1)}${importText}${app.slice(reactImportEnd + 1)}`;

    fs.writeFileSync(APP_PATH, app, 'utf8');
    console.log('EXTRACTED health record Supabase service -> src/services/health/healthRecordService.js');
  }

  validateWeb();

  const dirtyAfter = capture('git', ['status', '--porcelain']);
  if (!dirtyAfter) {
    console.log('\nSUCCESS: Stage 7 is already applied and validated. Nothing to commit.');
    console.log(`Hidden backup kept at: ${APP_BACKUP}`);
    process.exit(0);
  }

  const filesToAdd = createdService
    ? ['PetSyncApp.js', 'src/services/health/healthRecordService.js']
    : ['PetSyncApp.js'];
  const add = run('git', ['add', ...filesToAdd]);
  if (add.status !== 0) throw new Error('git add failed.');

  const staged = capture('git', ['diff', '--cached', '--name-only']);
  if (!staged) {
    console.log('\nSUCCESS: Stage 7 validated with no staged source changes.');
    process.exit(0);
  }

  const commit = run('git', ['commit', '-m', 'Extract health record service']);
  if (commit.status !== 0) throw new Error('git commit failed.');

  const push = run('git', ['push']);
  if (push.status !== 0) {
    console.log('\nStage 7 commit succeeded, but push failed. Your local commit is safe.');
    process.exitCode = 2;
  } else {
    console.log('\nSUCCESS: Stage 7 refactor validated, committed, and pushed.');
  }

  console.log(`Hidden backup kept at: ${APP_BACKUP}`);
} catch (error) {
  console.error(`\nSTAGE 7 FAILED: ${error.message}`);
  console.error('Restoring Stage 7 source files...');

  fs.writeFileSync(APP_PATH, originalApp, 'utf8');
  if (createdService && fs.existsSync(SERVICE_PATH)) fs.rmSync(SERVICE_PATH, { force: true });
  fs.rmSync(CHECK_DIR, { recursive: true, force: true });
  run('git', ['reset', '--', 'PetSyncApp.js', 'src/services/health/healthRecordService.js']);

  console.error('Original files restored. No Stage 7 source commit was created.');
  process.exitCode = 1;
}
