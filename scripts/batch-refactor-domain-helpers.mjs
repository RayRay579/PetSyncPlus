import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const APP_PATH = path.join(ROOT, 'PetSyncApp.js');
const SERVICE_PATH = path.join(ROOT, 'src', 'services', 'reminders', 'careReminderService.js');
const CHECK_DIR = path.join(ROOT, '.petsync-refactor-web-check');
const BACKUP_DIR = path.join(ROOT, '.git', 'petsync-refactor-backups');
const APP_BACKUP = path.join(BACKUP_DIR, `PetSyncApp-stage8-${Date.now()}.js`);
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
  throw new Error(`STOP: working tree is not clean before stage 8:\n${dirtyBefore}`);
}

if (!fs.existsSync(APP_PATH)) {
  throw new Error('STOP: PetSyncApp.js was not found.');
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });
fs.copyFileSync(APP_PATH, APP_BACKUP);

const originalApp = fs.readFileSync(APP_PATH, 'utf8');
let app = originalApp;
let createdService = false;

const findNextTopLevelDeclaration = (source, fromIndex) => {
  const candidates = ['\nconst ', '\nfunction ', '\nclass ', '\nlet ', '\nvar ']
    .map((marker) => source.indexOf(marker, fromIndex))
    .filter((index) => index >= 0);
  return candidates.length > 0 ? Math.min(...candidates) + 1 : source.length;
};

try {
  if (app.includes("from './src/services/reminders/careReminderService'")) {
    console.log('Stage 8 care reminder service is already extracted.');
  } else {
    const startMarker = 'const saveCareReminderToSupabase = async';
    const loadMarker = 'const loadCareRemindersFromSupabase = async';
    const start = app.indexOf(startMarker);
    const loadStart = app.indexOf(loadMarker, start + startMarker.length);

    if (start < 0 || loadStart < 0 || loadStart <= start) {
      throw new Error('Could not locate the Stage 8 care-reminder service block. No app files were changed.');
    }

    const end = findNextTopLevelDeclaration(app, loadStart + loadMarker.length);
    if (end <= loadStart) {
      throw new Error('Could not locate the end of the Stage 8 care-reminder service block.');
    }

    const block = app.slice(start, end).trimEnd();
    const requiredNames = [
      'saveCareReminderToSupabase',
      'updateCareReminderInSupabase',
      'upsertCareReminderInSupabase',
      'deleteCareReminderFromSupabase',
      'loadCareRemindersFromSupabase',
    ];

    for (const name of requiredNames) {
      if (!block.includes(`const ${name} =`)) {
        throw new Error(`Stage 8 preflight could not find ${name}. No app files were changed.`);
      }
    }

    const serviceSource = `import { supabase } from '../../../supabase';\nimport { resolveAccessibleSharedPetIds as defaultResolveAccessibleSharedPetIds } from '../health/healthRecordService';\n\nexport const createCareReminderService = ({\n  currentUserId = null,\n  ensureWritablePetByPetId = async () => true,\n  ensureWritablePetByRecordId = async () => true,\n  resolveAccessibleSharedPetIdsFn = defaultResolveAccessibleSharedPetIds,\n} = {}) => {\n  // Compatibility aliases keep the extracted service behavior identical while\n  // making all former PetSyncApp globals explicit dependencies.\n  const CURRENT_USER_OWNER_ID = currentUserId;\n  const resolveAccessibleSharedPetIds = resolveAccessibleSharedPetIdsFn;\n\n${block.split('\n').map((line) => `  ${line}`).join('\n')}\n\n  return {\n    saveCareReminderToSupabase,\n    updateCareReminderInSupabase,\n    upsertCareReminderInSupabase,\n    deleteCareReminderFromSupabase,\n    loadCareRemindersFromSupabase,\n  };\n};\n`;

    fs.mkdirSync(path.dirname(SERVICE_PATH), { recursive: true });
    fs.writeFileSync(SERVICE_PATH, serviceSource, 'utf8');
    createdService = true;

    const wrappers = `const getCareReminderService = () => createCareReminderService({\n  currentUserId: CURRENT_USER_OWNER_ID,\n  ensureWritablePetByPetId,\n  ensureWritablePetByRecordId,\n});\n\nconst saveCareReminderToSupabase = (...args) =>\n  getCareReminderService().saveCareReminderToSupabase(...args);\n\nconst updateCareReminderInSupabase = (...args) =>\n  getCareReminderService().updateCareReminderInSupabase(...args);\n\nconst upsertCareReminderInSupabase = (...args) =>\n  getCareReminderService().upsertCareReminderInSupabase(...args);\n\nconst deleteCareReminderFromSupabase = (...args) =>\n  getCareReminderService().deleteCareReminderFromSupabase(...args);\n\nconst loadCareRemindersFromSupabase = (...args) =>\n  getCareReminderService().loadCareRemindersFromSupabase(...args);\n\n`;

    app = `${app.slice(0, start)}${wrappers}${app.slice(end)}`;

    const reactImportEnd = app.indexOf('\n', app.indexOf('import React'));
    if (reactImportEnd < 0) throw new Error('Could not locate import insertion point.');

    const importText = `import { createCareReminderService } from './src/services/reminders/careReminderService';\n`;
    app = `${app.slice(0, reactImportEnd + 1)}${importText}${app.slice(reactImportEnd + 1)}`;

    fs.writeFileSync(APP_PATH, app, 'utf8');
    console.log('EXTRACTED care reminder Supabase service -> src/services/reminders/careReminderService.js');
  }

  validateWeb();

  const dirtyAfter = capture('git', ['status', '--porcelain']);
  if (!dirtyAfter) {
    console.log('\nSUCCESS: Stage 8 is already applied and validated. Nothing to commit.');
    console.log(`Hidden backup kept at: ${APP_BACKUP}`);
    process.exit(0);
  }

  const filesToAdd = createdService
    ? ['PetSyncApp.js', 'src/services/reminders/careReminderService.js']
    : ['PetSyncApp.js'];
  const add = run('git', ['add', ...filesToAdd]);
  if (add.status !== 0) throw new Error('git add failed.');

  const staged = capture('git', ['diff', '--cached', '--name-only']);
  if (!staged) {
    console.log('\nSUCCESS: Stage 8 validated with no staged source changes.');
    process.exit(0);
  }

  const commit = run('git', ['commit', '-m', 'Extract care reminder service']);
  if (commit.status !== 0) throw new Error('git commit failed.');

  const push = run('git', ['push']);
  if (push.status !== 0) {
    console.log('\nStage 8 commit succeeded, but push failed. Your local commit is safe.');
    process.exitCode = 2;
  } else {
    console.log('\nSUCCESS: Stage 8 refactor validated, committed, and pushed.');
  }

  console.log(`Hidden backup kept at: ${APP_BACKUP}`);
} catch (error) {
  console.error(`\nSTAGE 8 FAILED: ${error.message}`);
  console.error('Restoring Stage 8 source files...');

  fs.writeFileSync(APP_PATH, originalApp, 'utf8');
  if (createdService && fs.existsSync(SERVICE_PATH)) fs.rmSync(SERVICE_PATH, { force: true });
  fs.rmSync(CHECK_DIR, { recursive: true, force: true });
  run('git', ['reset', '--', 'PetSyncApp.js', 'src/services/reminders/careReminderService.js']);

  console.error('Original files restored. No Stage 8 source commit was created.');
  process.exitCode = 1;
}
