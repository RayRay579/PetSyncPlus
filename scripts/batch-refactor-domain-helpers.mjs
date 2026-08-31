import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const APP_PATH = path.join(ROOT, 'PetSyncApp.js');
const SERVICE_PATH = path.join(ROOT, 'src', 'services', 'notifications', 'pushNotifications.js');
const CHECK_DIR = path.join(ROOT, '.petsync-refactor-web-check');
const BACKUP_DIR = path.join(ROOT, '.git', 'petsync-refactor-backups');
const APP_BACKUP = path.join(BACKUP_DIR, `PetSyncApp-stage6-${Date.now()}.js`);
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
  throw new Error(`STOP: working tree is not clean before stage 6:\n${dirtyBefore}`);
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
  if (app.includes("from './src/services/notifications/pushNotifications'")) {
    console.log('Stage 6 push notification service is already extracted.');
  } else {
    const startMarker = 'const savePushTokenToSupabase = async';
    const endMarker = 'const resolveAccessibleSharedPetIds = async';
    const start = app.indexOf(startMarker);
    const end = app.indexOf(endMarker, start + startMarker.length);

    if (start < 0 || end < 0 || end <= start) {
      throw new Error('Could not locate the Stage 6 push-notification block. No app files were changed.');
    }

    let block = app.slice(start, end).trimEnd();

    block = block.replace(
      'const savePushTokenToSupabase = async (expoPushToken, deviceName) => {',
      'const savePushTokenToSupabase = async (expoPushToken, deviceName, userId = null) => {',
    );
    block = block.replace(
      'user_id: CURRENT_USER_OWNER_ID || null,',
      'user_id: userId || null,',
    );
    block = block.replace(
      'const registerForPushNotificationsAsync = async () => {',
      'const registerForPushNotificationsAsync = async (userId = null) => {',
    );
    block = block.replace(
      'await savePushTokenToSupabase(token, deviceName);',
      'await savePushTokenToSupabase(token, deviceName, userId);',
    );

    if (block.includes('CURRENT_USER_OWNER_ID')) {
      throw new Error('Stage 6 block still contains a hidden CURRENT_USER_OWNER_ID dependency.');
    }

    const serviceSource = `import Constants from 'expo-constants';\nimport * as Device from 'expo-device';\nimport * as Notifications from 'expo-notifications';\nimport { supabase } from '../../../supabase';\n\nconst getExpoProjectId = () => Constants?.expoConfig?.extra?.eas?.projectId\n  ?? Constants?.easConfig?.projectId\n  ?? '';\n\n${block}\n\nexport {\n  savePushTokenToSupabase,\n  loadPushTokensFromSupabase,\n  sendExpoPushNotifications,\n  sendLostPetAlertPushNotifications,\n  registerForPushNotificationsAsync,\n};\n`;

    fs.mkdirSync(path.dirname(SERVICE_PATH), { recursive: true });
    fs.writeFileSync(SERVICE_PATH, serviceSource, 'utf8');
    createdService = true;

    app = `${app.slice(0, start)}${app.slice(end)}`;

    const reactImportEnd = app.indexOf('\n', app.indexOf('import React'));
    if (reactImportEnd < 0) throw new Error('Could not locate import insertion point.');

    const importText = `import {\n  savePushTokenToSupabase,\n  loadPushTokensFromSupabase,\n  sendExpoPushNotifications,\n  sendLostPetAlertPushNotifications,\n  registerForPushNotificationsAsync,\n} from './src/services/notifications/pushNotifications';\n`;
    app = `${app.slice(0, reactImportEnd + 1)}${importText}${app.slice(reactImportEnd + 1)}`;

    const registrationCall = 'await registerForPushNotificationsAsync();';
    if (!app.includes(registrationCall)) {
      throw new Error('Could not locate the push registration call site.');
    }
    app = app.replaceAll(
      registrationCall,
      'await registerForPushNotificationsAsync(CURRENT_USER_OWNER_ID);',
    );

    fs.writeFileSync(APP_PATH, app, 'utf8');
    console.log('EXTRACTED push notification service -> src/services/notifications/pushNotifications.js');
  }

  validateWeb();

  const dirtyAfter = capture('git', ['status', '--porcelain']);
  if (!dirtyAfter) {
    console.log('\nSUCCESS: Stage 6 is already applied and validated. Nothing to commit.');
    console.log(`Hidden backup kept at: ${APP_BACKUP}`);
    process.exit(0);
  }

  const filesToAdd = createdService
    ? ['PetSyncApp.js', 'src/services/notifications/pushNotifications.js']
    : ['PetSyncApp.js'];
  const add = run('git', ['add', ...filesToAdd]);
  if (add.status !== 0) throw new Error('git add failed.');

  const staged = capture('git', ['diff', '--cached', '--name-only']);
  if (!staged) {
    console.log('\nSUCCESS: Stage 6 validated with no staged source changes.');
    process.exit(0);
  }

  const commit = run('git', ['commit', '-m', 'Extract push notification service']);
  if (commit.status !== 0) throw new Error('git commit failed.');

  const push = run('git', ['push']);
  if (push.status !== 0) {
    console.log('\nStage 6 commit succeeded, but push failed. Your local commit is safe.');
    process.exitCode = 2;
  } else {
    console.log('\nSUCCESS: Stage 6 refactor validated, committed, and pushed.');
  }

  console.log(`Hidden backup kept at: ${APP_BACKUP}`);
} catch (error) {
  console.error(`\nSTAGE 6 FAILED: ${error.message}`);
  console.error('Restoring Stage 6 source files...');

  fs.writeFileSync(APP_PATH, originalApp, 'utf8');
  if (createdService && fs.existsSync(SERVICE_PATH)) fs.rmSync(SERVICE_PATH, { force: true });
  fs.rmSync(CHECK_DIR, { recursive: true, force: true });
  run('git', ['reset', '--', 'PetSyncApp.js', 'src/services/notifications/pushNotifications.js']);

  console.error('Original files restored. No Stage 6 source commit was created.');
  process.exitCode = 1;
}
