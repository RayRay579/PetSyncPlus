import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const APP_PATH = path.join(ROOT, 'PetSyncApp.js');
const SERVICE_PATH = path.join(ROOT, 'src', 'services', 'pets', 'petService.js');
const CHECK_DIR = path.join(ROOT, '.petsync-refactor-web-check');
const BACKUP_DIR = path.join(ROOT, '.git', 'petsync-refactor-backups');
const RUN_ID = Date.now();
const APP_BACKUP = path.join(BACKUP_DIR, `PetSyncApp-stage9-hardening-${RUN_ID}.js`);
const SERVICE_BACKUP = path.join(BACKUP_DIR, `petService-stage9-hardening-${RUN_ID}.js`);
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
  throw new Error(`STOP: working tree is not clean before Stage 9 hardening:\n${dirtyBefore}`);
}

if (!fs.existsSync(APP_PATH) || !fs.existsSync(SERVICE_PATH)) {
  throw new Error('STOP: Stage 9 source files were not found.');
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });
fs.copyFileSync(APP_PATH, APP_BACKUP);
fs.copyFileSync(SERVICE_PATH, SERVICE_BACKUP);

const originalApp = fs.readFileSync(APP_PATH, 'utf8');
const originalService = fs.readFileSync(SERVICE_PATH, 'utf8');
let app = originalApp;
let service = originalService;

const oldServiceSignature = `export const createPetService = ({\n  CURRENT_USER_OWNER_ID,\n  ensureWritablePetByPetId,\n} = {}) => {`;
const newServiceSignature = `export const createPetService = ({\n  CURRENT_USER_OWNER_ID,\n  CURRENT_USER_EMAIL,\n  CURRENT_USER_NAME,\n  getOrCreateOwnerHousehold,\n  ensureWritablePetByPetId,\n} = {}) => {`;

const oldAppWrapper = `const getPetService = () => createPetService({\n  CURRENT_USER_OWNER_ID,\n  ensureWritablePetByPetId,\n});`;
const newAppWrapper = `const getPetService = () => createPetService({\n  CURRENT_USER_OWNER_ID,\n  CURRENT_USER_EMAIL,\n  CURRENT_USER_NAME,\n  getOrCreateOwnerHousehold,\n  ensureWritablePetByPetId,\n});`;

const assertHardened = () => {
  const requiredServiceParams = [
    'CURRENT_USER_OWNER_ID',
    'CURRENT_USER_EMAIL',
    'CURRENT_USER_NAME',
    'getOrCreateOwnerHousehold',
    'ensureWritablePetByPetId',
  ];

  const signatureStart = service.indexOf('export const createPetService = ({');
  const signatureEnd = service.indexOf('} = {}) => {', signatureStart);
  if (signatureStart < 0 || signatureEnd < 0) {
    throw new Error('Could not verify the pet service factory signature.');
  }
  const signature = service.slice(signatureStart, signatureEnd);
  for (const name of requiredServiceParams) {
    if (!signature.includes(name)) {
      throw new Error(`Pet service still has an uninjected dependency: ${name}`);
    }
  }

  if (!service.includes('const ownerHousehold = await getOrCreateOwnerHousehold({')) {
    throw new Error('Could not verify the owner household call in petService.js.');
  }
  if (!service.includes('email: CURRENT_USER_EMAIL')) {
    throw new Error('Could not verify CURRENT_USER_EMAIL usage in petService.js.');
  }
  if (!service.includes('display_name: CURRENT_USER_NAME')) {
    throw new Error('Could not verify CURRENT_USER_NAME usage in petService.js.');
  }

  const wrapperStart = app.indexOf('const getPetService = () => createPetService({');
  const wrapperEnd = app.indexOf('});', wrapperStart);
  if (wrapperStart < 0 || wrapperEnd < 0) {
    throw new Error('Could not verify the PetSyncApp pet service wrapper.');
  }
  const wrapper = app.slice(wrapperStart, wrapperEnd);
  for (const name of requiredServiceParams) {
    if (!wrapper.includes(name)) {
      throw new Error(`PetSyncApp is not passing pet service dependency: ${name}`);
    }
  }
};

try {
  const alreadyHardened = service.includes(newServiceSignature) && app.includes(newAppWrapper);

  if (alreadyHardened) {
    console.log('Stage 9 dependency leak is already fixed.');
  } else {
    if (!service.includes(oldServiceSignature)) {
      throw new Error('Could not locate the expected Stage 9 pet service signature. No source files were changed.');
    }
    if (!app.includes(oldAppWrapper)) {
      throw new Error('Could not locate the expected Stage 9 PetSyncApp wrapper. No source files were changed.');
    }

    service = service.replace(oldServiceSignature, newServiceSignature);
    app = app.replace(oldAppWrapper, newAppWrapper);

    assertHardened();

    fs.writeFileSync(SERVICE_PATH, service, 'utf8');
    fs.writeFileSync(APP_PATH, app, 'utf8');
    console.log('FIXED Stage 9 pet service dependency leak.');
    console.log('Injected: CURRENT_USER_EMAIL, CURRENT_USER_NAME, getOrCreateOwnerHousehold');
  }

  assertHardened();
  validateWeb();

  const dirtyAfter = capture('git', ['status', '--porcelain']);
  if (!dirtyAfter) {
    console.log('\nSUCCESS: Stage 9 dependency hardening is already applied and validated. Nothing to commit.');
    console.log(`Hidden backups kept at: ${APP_BACKUP} and ${SERVICE_BACKUP}`);
    process.exit(0);
  }

  const add = run('git', ['add', 'PetSyncApp.js', 'src/services/pets/petService.js']);
  if (add.status !== 0) throw new Error('git add failed.');

  const staged = capture('git', ['diff', '--cached', '--name-only']);
  if (!staged) {
    console.log('\nSUCCESS: Stage 9 dependency hardening validated with no staged source changes.');
    process.exit(0);
  }

  const commit = run('git', ['commit', '-m', 'Harden pet service dependencies']);
  if (commit.status !== 0) throw new Error('git commit failed.');

  const push = run('git', ['push']);
  if (push.status !== 0) {
    console.log('\nStage 9 dependency hardening commit succeeded, but push failed. Your local commit is safe.');
    process.exitCode = 2;
  } else {
    console.log('\nSUCCESS: Stage 9 dependency leak fixed, validated, committed, and pushed.');
  }

  console.log(`Hidden backups kept at: ${APP_BACKUP} and ${SERVICE_BACKUP}`);
} catch (error) {
  console.error(`\nSTAGE 9 HARDENING FAILED: ${error.message}`);
  console.error('Restoring PetSyncApp.js and petService.js...');

  fs.writeFileSync(APP_PATH, originalApp, 'utf8');
  fs.writeFileSync(SERVICE_PATH, originalService, 'utf8');
  fs.rmSync(CHECK_DIR, { recursive: true, force: true });
  run('git', ['reset', '--', 'PetSyncApp.js', 'src/services/pets/petService.js']);

  console.error('Original source files restored. No hardening source commit was created.');
  console.error(`Hidden backups kept at: ${APP_BACKUP} and ${SERVICE_BACKUP}`);
  process.exitCode = 1;
}
