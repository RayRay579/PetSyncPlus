import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const APP_PATH = path.join(ROOT, 'PetSyncApp.js');
const ACCESS_SERVICE_PATH = path.join(ROOT, 'src', 'services', 'pets', 'petAccessService.js');
const CHECK_DIR = path.join(ROOT, '.petsync-refactor-web-check');
const BACKUP_DIR = path.join(ROOT, '.git', 'petsync-refactor-backups');
const RUN_ID = Date.now();
const APP_BACKUP = path.join(BACKUP_DIR, `PetSyncApp-stage10-${RUN_ID}.js`);
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
  throw new Error(`STOP: working tree is not clean before Stage 10:\n${dirtyBefore}`);
}

if (!fs.existsSync(APP_PATH)) {
  throw new Error('STOP: PetSyncApp.js was not found.');
}

if (fs.existsSync(ACCESS_SERVICE_PATH)) {
  throw new Error('STOP: petAccessService.js already exists. Stage 10 may already be applied; inspect before rerunning.');
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });
fs.copyFileSync(APP_PATH, APP_BACKUP);

const originalApp = fs.readFileSync(APP_PATH, 'utf8');
let app = originalApp;

const importAnchor = `import { createPetService } from './src/services/pets/petService';`;
const accessImport = `import { createPetAccessService } from './src/services/pets/petAccessService';`;

const guard1StartMarker = `const isSharedPetForCurrentUser =`;
const guard2StartMarker = `const ensureWritablePetByPetId =`;
const guard3StartMarker = `const ensureWritablePetByRecordId =`;
const guardEndMarker = `const getPetService = () => createPetService({`;

const newGuardBlock = `const getPetAccessService = () => createPetAccessService({\n  supabase,\n  currentUserId: CURRENT_USER_OWNER_ID,\n  getPetOwnerIdentity,\n  showAlert: (...args) => Alert.alert(...args),\n});\n\nconst isSharedPetForCurrentUser = (...args) =>\n  getPetAccessService().isSharedPetForCurrentUser(...args);\n\nconst ensureWritablePetByPetId = (...args) =>\n  getPetAccessService().ensureWritablePetByPetId(...args);\n\nconst ensureWritablePetByRecordId = (...args) =>\n  getPetAccessService().ensureWritablePetByRecordId(...args);\n\n`;

const service = `export const createPetAccessService = ({\n  supabase,\n  currentUserId,\n  getPetOwnerIdentity,\n  showAlert,\n} = {}) => {\n  const isSharedPetForCurrentUser = (pet, currentUserIdOverride = currentUserId) => {\n    const ownerIdentity = getPetOwnerIdentity(pet);\n    const normalizedCurrentUserId = String(currentUserIdOverride || '').trim();\n\n    if (!ownerIdentity || !normalizedCurrentUserId) {\n      return false;\n    }\n\n    return ownerIdentity !== normalizedCurrentUserId;\n  };\n\n  const ensureWritablePetByPetId = async (petId, actionLabel = 'modify this pet data') => {\n    const normalizedCurrentUserId = String(currentUserId || '').trim();\n    if (!normalizedCurrentUserId || !petId) {\n      return true;\n    }\n\n    try {\n      const { data, error } = await supabase\n        .from('pets')\n        .select('user_id, owner_id, created_by_user_id')\n        .eq('id', petId)\n        .limit(1);\n\n      if (error) {\n        console.log(\`Pet write access lookup error while trying to \${actionLabel}:\`, error);\n        return false;\n      }\n\n      const petRow = Array.isArray(data) ? data[0] : data;\n      if (!petRow) {\n        return true;\n      }\n\n      if (isSharedPetForCurrentUser(petRow, normalizedCurrentUserId)) {\n        showAlert?.('Read-only pet', 'Family Shared pet: view-only access');\n        return false;\n      }\n\n      return true;\n    } catch (error) {\n      console.log('Pet write access guard error:', error);\n      return false;\n    }\n  };\n\n  const ensureWritablePetByRecordId = async (tableName, recordId, actionLabel = 'modify this record') => {\n    if (!recordId) {\n      return true;\n    }\n\n    try {\n      const { data, error } = await supabase\n        .from(tableName)\n        .select('pet_id')\n        .eq('id', recordId)\n        .limit(1);\n\n      if (error) {\n        console.log(\`\${tableName} write access lookup error while trying to \${actionLabel}:\`, error);\n        return false;\n      }\n\n      const row = Array.isArray(data) ? data[0] : data;\n      if (!row?.pet_id) {\n        return true;\n      }\n\n      return await ensureWritablePetByPetId(row.pet_id, actionLabel);\n    } catch (error) {\n      console.log(\`\${tableName} write access guard error:\`, error);\n      return false;\n    }\n  };\n\n  return {\n    isSharedPetForCurrentUser,\n    ensureWritablePetByPetId,\n    ensureWritablePetByRecordId,\n  };\n};\n`;

const assertStage10 = () => {
  if (!app.includes(accessImport)) {
    throw new Error('Stage 10 access service import is missing.');
  }
  if (!app.includes('const getPetAccessService = () => createPetAccessService({')) {
    throw new Error('Stage 10 access service wrapper is missing.');
  }
  if (!app.includes('getPetAccessService().isSharedPetForCurrentUser(...args)')) {
    throw new Error('Stage 10 shared-pet wrapper is missing.');
  }
  if (!app.includes('getPetAccessService().ensureWritablePetByPetId(...args)')) {
    throw new Error('Stage 10 pet-id write guard wrapper is missing.');
  }
  if (!app.includes('getPetAccessService().ensureWritablePetByRecordId(...args)')) {
    throw new Error('Stage 10 record-id write guard wrapper is missing.');
  }
  if (!fs.existsSync(ACCESS_SERVICE_PATH)) {
    throw new Error('petAccessService.js was not created.');
  }

  const accessService = fs.readFileSync(ACCESS_SERVICE_PATH, 'utf8');
  for (const required of [
    'createPetAccessService',
    'isSharedPetForCurrentUser',
    'ensureWritablePetByPetId',
    'ensureWritablePetByRecordId',
    'Family Shared pet: view-only access',
  ]) {
    if (!accessService.includes(required)) {
      throw new Error(`petAccessService.js is missing expected content: ${required}`);
    }
  }
};

try {
  if (!app.includes(importAnchor)) {
    throw new Error('Could not locate the petService import anchor. No source files were changed.');
  }

  const guard1Start = app.indexOf(guard1StartMarker);
  const guard2Start = app.indexOf(guard2StartMarker, guard1Start);
  const guard3Start = app.indexOf(guard3StartMarker, guard2Start);
  const guardEnd = app.indexOf(guardEndMarker, guard3Start);

  if (
    guard1Start < 0 ||
    guard2Start < 0 ||
    guard3Start < 0 ||
    guardEnd < 0 ||
    !(guard1Start < guard2Start && guard2Start < guard3Start && guard3Start < guardEnd)
  ) {
    throw new Error('Could not locate the three Stage 10 guard declarations in order. No source files were changed.');
  }

  const prefix = app.slice(0, guard1Start);
  const suffix = app.slice(guardEnd);

  if (!prefix.endsWith('\n\n') && !prefix.endsWith('\r\n\r\n')) {
    throw new Error('Stage 10 guard section does not begin at a clean top-level boundary. No source files were changed.');
  }

  app = app.replace(importAnchor, `${importAnchor}\n${accessImport}`);
  app = app.slice(0, guard1Start) + newGuardBlock + suffix;

  fs.mkdirSync(path.dirname(ACCESS_SERVICE_PATH), { recursive: true });
  fs.writeFileSync(ACCESS_SERVICE_PATH, service, 'utf8');
  fs.writeFileSync(APP_PATH, app, 'utf8');

  assertStage10();
  console.log('Stage 10 extracted pet ownership/read-only guards into petAccessService.js.');
  validateWeb();

  const add = run('git', ['add', 'PetSyncApp.js', 'src/services/pets/petAccessService.js']);
  if (add.status !== 0) throw new Error('git add failed.');

  const staged = capture('git', ['diff', '--cached', '--name-only']);
  if (!staged) {
    throw new Error('Stage 10 produced no staged source changes.');
  }

  const commit = run('git', ['commit', '-m', 'Extract pet access service']);
  if (commit.status !== 0) throw new Error('git commit failed.');

  const push = run('git', ['push']);
  if (push.status !== 0) {
    console.log('\nStage 10 commit succeeded, but push failed. Your local commit is safe.');
    process.exitCode = 2;
  } else {
    console.log('\nSUCCESS: Stage 10 extracted, validated, committed, and pushed.');
  }

  console.log(`Hidden backup kept at: ${APP_BACKUP}`);
} catch (error) {
  console.error(`\nSTAGE 10 FAILED: ${error.message}`);
  console.error('Restoring PetSyncApp.js and removing the new access service...');

  fs.writeFileSync(APP_PATH, originalApp, 'utf8');
  fs.rmSync(ACCESS_SERVICE_PATH, { force: true });
  fs.rmSync(CHECK_DIR, { recursive: true, force: true });
  run('git', ['reset', '--', 'PetSyncApp.js', 'src/services/pets/petAccessService.js']);

  console.error('Original source restored. No Stage 10 source commit was created.');
  console.error(`Hidden backup kept at: ${APP_BACKUP}`);
  process.exitCode = 1;
}
