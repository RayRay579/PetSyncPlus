import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const APP_PATH = path.join(ROOT, 'PetSyncApp.js');
const SERVICE_PATH = path.join(ROOT, 'src', 'services', 'pets', 'petService.js');
const CHECK_DIR = path.join(ROOT, '.petsync-refactor-web-check');
const BACKUP_DIR = path.join(ROOT, '.git', 'petsync-refactor-backups');
const APP_BACKUP = path.join(BACKUP_DIR, `PetSyncApp-stage9-${Date.now()}.js`);
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

const findNextTopLevelDeclaration = (source, fromIndex) => {
  const candidates = ['\nconst ', '\nfunction ', '\nclass ', '\nlet ', '\nvar ']
    .map((marker) => source.indexOf(marker, fromIndex))
    .filter((index) => index >= 0);
  return candidates.length > 0 ? Math.min(...candidates) + 1 : source.length;
};

const branch = capture('git', ['branch', '--show-current']);
if (branch !== EXPECTED_BRANCH) {
  throw new Error(`STOP: expected branch ${EXPECTED_BRANCH}, but current branch is ${branch || '(unknown)'}.`);
}

const dirtyBefore = capture('git', ['status', '--porcelain']);
if (dirtyBefore) {
  throw new Error(`STOP: working tree is not clean before stage 9:\n${dirtyBefore}`);
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
  if (app.includes("from './src/services/pets/petService'")) {
    console.log('Stage 9 pet Supabase service is already extracted.');
  } else {
    const saveMarker = 'const savePetToSupabase = async';
    const loadMarker = 'const loadPetsFromSupabase = async';
    const deleteMarker = 'const deletePetFromSupabase = async';

    const start = app.indexOf(saveMarker);
    const loadStart = app.indexOf(loadMarker, start + saveMarker.length);
    const deleteStart = app.indexOf(deleteMarker, loadStart + loadMarker.length);

    if (start < 0 || loadStart < 0 || deleteStart < 0 || !(start < loadStart && loadStart < deleteStart)) {
      throw new Error('Could not locate the complete Stage 9 pet Supabase CRUD block. No app files were changed.');
    }

    const end = findNextTopLevelDeclaration(app, deleteStart + deleteMarker.length);
    if (end <= deleteStart) {
      throw new Error('Could not locate the end of the Stage 9 pet Supabase CRUD block.');
    }

    const block = app.slice(start, end).trimEnd();
    const requiredNames = [
      'savePetToSupabase',
      'loadPetsFromSupabase',
      'deletePetFromSupabase',
    ];

    for (const name of requiredNames) {
      if (!block.includes(`const ${name} =`)) {
        throw new Error(`Stage 9 preflight could not find ${name}. No app files were changed.`);
      }
    }

    // Pet CRUD has accumulated a few app-level helpers over time. Only inject a
    // helper when the extracted block actually references it, so the service has
    // no hidden dependency on PetSyncApp.js globals.
    const dependencyCandidates = [
      'CURRENT_USER_OWNER_ID',
      'Alert',
      'ensureWritablePetByPetId',
      'ensureWritablePetByRecordId',
      'resolveAccessibleSharedPetIds',
      'getCurrentHouseholdId',
      'getCurrentUserHouseholdId',
      'getActiveHouseholdId',
      'resolveCurrentHouseholdId',
      'loadCurrentHouseholdId',
      'getHouseholdIdForUser',
      'getUserHouseholdId',
      'getPrimaryHouseholdId',
      'loadHouseholdMembersFromSupabase',
      'loadHouseholdMembers',
      'getHouseholdMembers',
      'normalizePet',
      'normalizePetRow',
      'normalizePetFromSupabase',
      'mapPetFromSupabase',
      'mapSupabasePetToPet',
      'PET_SPECIES_EMOJIS',
      'PET_EMOJIS',
      'DEFAULT_PET_EMOJI',
    ];

    const dependencyNames = dependencyCandidates.filter((name) => block.includes(name));
    const dependencySignature = dependencyNames.length
      ? `${dependencyNames.map((name) => `  ${name},`).join('\n')}\n`
      : '';
    const dependencyObject = dependencyNames.length
      ? `${dependencyNames.map((name) => `  ${name},`).join('\n')}\n`
      : '';

    const serviceSource = `import { supabase } from '../../../supabase';\n\nexport const createPetService = ({\n${dependencySignature}} = {}) => {\n${block.split('\n').map((line) => `  ${line}`).join('\n')}\n\n  return {\n    savePetToSupabase,\n    loadPetsFromSupabase,\n    deletePetFromSupabase,\n  };\n};\n`;

    fs.mkdirSync(path.dirname(SERVICE_PATH), { recursive: true });
    fs.writeFileSync(SERVICE_PATH, serviceSource, 'utf8');
    createdService = true;

    const wrappers = `const getPetService = () => createPetService({\n${dependencyObject}});\n\nconst savePetToSupabase = (...args) =>\n  getPetService().savePetToSupabase(...args);\n\nconst loadPetsFromSupabase = (...args) =>\n  getPetService().loadPetsFromSupabase(...args);\n\nconst deletePetFromSupabase = (...args) =>\n  getPetService().deletePetFromSupabase(...args);\n\n`;

    app = `${app.slice(0, start)}${wrappers}${app.slice(end)}`;

    const reactImportEnd = app.indexOf('\n', app.indexOf('import React'));
    if (reactImportEnd < 0) throw new Error('Could not locate import insertion point.');

    const importText = `import { createPetService } from './src/services/pets/petService';\n`;
    app = `${app.slice(0, reactImportEnd + 1)}${importText}${app.slice(reactImportEnd + 1)}`;

    fs.writeFileSync(APP_PATH, app, 'utf8');
    console.log('EXTRACTED pet Supabase CRUD service -> src/services/pets/petService.js');
    if (dependencyNames.length) {
      console.log(`Injected pet service dependencies: ${dependencyNames.join(', ')}`);
    }
  }

  validateWeb();

  const dirtyAfter = capture('git', ['status', '--porcelain']);
  if (!dirtyAfter) {
    console.log('\nSUCCESS: Stage 9 is already applied and validated. Nothing to commit.');
    console.log(`Hidden backup kept at: ${APP_BACKUP}`);
    process.exit(0);
  }

  const filesToAdd = createdService
    ? ['PetSyncApp.js', 'src/services/pets/petService.js']
    : ['PetSyncApp.js'];
  const add = run('git', ['add', ...filesToAdd]);
  if (add.status !== 0) throw new Error('git add failed.');

  const staged = capture('git', ['diff', '--cached', '--name-only']);
  if (!staged) {
    console.log('\nSUCCESS: Stage 9 validated with no staged source changes.');
    process.exit(0);
  }

  const commit = run('git', ['commit', '-m', 'Extract pet Supabase service']);
  if (commit.status !== 0) throw new Error('git commit failed.');

  const push = run('git', ['push']);
  if (push.status !== 0) {
    console.log('\nStage 9 commit succeeded, but push failed. Your local commit is safe.');
    process.exitCode = 2;
  } else {
    console.log('\nSUCCESS: Stage 9 refactor validated, committed, and pushed.');
  }

  console.log(`Hidden backup kept at: ${APP_BACKUP}`);
} catch (error) {
  console.error(`\nSTAGE 9 FAILED: ${error.message}`);
  console.error('Restoring Stage 9 source files...');

  fs.writeFileSync(APP_PATH, originalApp, 'utf8');
  if (createdService && fs.existsSync(SERVICE_PATH)) fs.rmSync(SERVICE_PATH, { force: true });
  fs.rmSync(CHECK_DIR, { recursive: true, force: true });
  run('git', ['reset', '--', 'PetSyncApp.js', 'src/services/pets/petService.js']);

  console.error('Original files restored. No Stage 9 source commit was created.');
  console.error(`Hidden backup kept at: ${APP_BACKUP}`);
  process.exitCode = 1;
}
