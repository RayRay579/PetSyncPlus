import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const APP_PATH = path.join(ROOT, 'PetSyncApp.js');
const CHECK_DIR = path.join(ROOT, '.petsync-refactor-web-check');
const BACKUP_DIR = path.join(ROOT, '.git', 'petsync-refactor-backups');
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

const assertBranchAndClean = (label) => {
  const branch = capture('git', ['branch', '--show-current']);
  if (branch !== EXPECTED_BRANCH) {
    throw new Error(`STOP: expected branch ${EXPECTED_BRANCH}, but current branch is ${branch || '(unknown)'}.`);
  }
  const dirty = capture('git', ['status', '--porcelain']);
  if (dirty) {
    throw new Error(`STOP: working tree is not clean before ${label}:\n${dirty}`);
  }
};

const addImportAfter = (app, anchor, newImport) => {
  if (app.includes(newImport)) return app;
  if (!app.includes(anchor)) {
    throw new Error(`Import anchor not found: ${anchor}`);
  }
  return app.replace(anchor, `${anchor}\n${newImport}`);
};

const extractRange = (app, startMarker, endMarker, label) => {
  const start = app.indexOf(startMarker);
  const end = app.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`Could not locate ${label} function boundaries.`);
  }
  return { start, end, block: app.slice(start, end) };
};

const currentUserGlobals = (text) => [...new Set(text.match(/\bCURRENT_USER_[A-Z_]+\b/g) || [])];

const commitAndPush = (files, message, successLabel) => {
  const add = run('git', ['add', ...files]);
  if (add.status !== 0) throw new Error('git add failed.');
  const staged = capture('git', ['diff', '--cached', '--name-only']);
  if (!staged) throw new Error(`${successLabel} produced no staged source changes.`);

  const commit = run('git', ['commit', '-m', message]);
  if (commit.status !== 0) throw new Error('git commit failed.');

  const push = run('git', ['push']);
  if (push.status !== 0) {
    throw new Error(`${successLabel} committed locally but push failed. Stop before continuing.`);
  }
};

const runStage = ({
  number,
  label,
  targetRelative,
  startMarker,
  endMarker,
  importAnchor,
  importLine,
  wrapperBlock,
  serviceBuilder,
  expectedFunctions,
  allowedCurrentUserGlobals = [],
  preflight = () => {},
}) => {
  const stageName = `Stage ${number} ${label}`;
  const targetPath = path.join(ROOT, targetRelative);

  assertBranchAndClean(stageName);
  preflight();

  let app = fs.readFileSync(APP_PATH, 'utf8');

  if (fs.existsSync(targetPath)) {
    if (app.includes(importLine) && expectedFunctions.every((fn) => app.includes(`.${fn}(...args)`))) {
      console.log(`\nSKIP: ${stageName} is already applied.`);
      return;
    }
    throw new Error(`STOP: ${targetRelative} already exists but ${stageName} wiring is incomplete. Inspect before continuing.`);
  }

  const runId = Date.now();
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const appBackup = path.join(BACKUP_DIR, `PetSyncApp-stage${number}-${runId}.js`);
  fs.copyFileSync(APP_PATH, appBackup);
  const originalApp = app;

  try {
    const { start, end, block } = extractRange(app, startMarker, endMarker, stageName);

    const unexpectedGlobals = currentUserGlobals(block)
      .filter((name) => !allowedCurrentUserGlobals.includes(name));
    if (unexpectedGlobals.length) {
      throw new Error(`${stageName} has unexpected app globals: ${unexpectedGlobals.join(', ')}`);
    }

    // IMPORTANT: replace using original indexes before adding imports.
    app = app.slice(0, start) + wrapperBlock + app.slice(end);
    app = addImportAfter(app, importAnchor, importLine);

    const service = serviceBuilder(block);
    for (const fn of expectedFunctions) {
      if (!service.includes(`const ${fn}`)) {
        throw new Error(`${stageName} extracted service is missing ${fn}.`);
      }
      if (!app.includes(`.${fn}(...args)`)) {
        throw new Error(`${stageName} wrapper is missing ${fn}.`);
      }
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, service, 'utf8');
    fs.writeFileSync(APP_PATH, app, 'utf8');

    console.log(`\n${stageName}: extracted -> ${targetRelative}`);
    validateWeb();
    commitAndPush(
      ['PetSyncApp.js', targetRelative],
      `Stage ${number}: ${label}`,
      stageName,
    );

    console.log(`SUCCESS: ${stageName} validated, committed, and pushed.`);
    console.log(`Hidden backup kept at: ${appBackup}`);
  } catch (error) {
    console.error(`\n${stageName.toUpperCase()} FAILED: ${error.message}`);
    console.error(`Rolling back only ${stageName}...`);
    fs.writeFileSync(APP_PATH, originalApp, 'utf8');
    fs.rmSync(targetPath, { force: true });
    fs.rmSync(CHECK_DIR, { recursive: true, force: true });
    run('git', ['reset', '--', 'PetSyncApp.js', targetRelative]);
    console.error(`${stageName} restored. Earlier successful stages remain committed.`);
    console.error(`Hidden backup kept at: ${appBackup}`);
    throw error;
  }
};

const stage12ImportAnchor = `import { createCommunityMediaStorageService } from './src/services/community/communityMediaStorageService';`;
const stage12Import = `import { createCommunityPostService } from './src/services/community/communityPostService';`;
const stage12Wrapper = `const getCommunityPostService = () => createCommunityPostService({\n  supabase,\n  CURRENT_USER_OWNER_ID,\n  CURRENT_USER_NAME,\n  buildCommunityPostMediaPayload,\n  mapCommunityPostRow,\n  isCommunityPostMediaSchemaError,\n});\n\nconst saveCommunityPostToSupabase = (...args) =>\n  getCommunityPostService().saveCommunityPostToSupabase(...args);\n\nconst updateCommunityPostLikesInSupabase = (...args) =>\n  getCommunityPostService().updateCommunityPostLikesInSupabase(...args);\n\nconst updateCommunityPostInSupabase = (...args) =>\n  getCommunityPostService().updateCommunityPostInSupabase(...args);\n\nconst deleteCommunityPostFromSupabase = (...args) =>\n  getCommunityPostService().deleteCommunityPostFromSupabase(...args);\n\nconst loadCommunityPostsFromSupabase = (...args) =>\n  getCommunityPostService().loadCommunityPostsFromSupabase(...args);\n\n`;

const buildCommunityPostService = (block) => `export const createCommunityPostService = ({\n  supabase,\n  CURRENT_USER_OWNER_ID,\n  CURRENT_USER_NAME,\n  buildCommunityPostMediaPayload,\n  mapCommunityPostRow,\n  isCommunityPostMediaSchemaError,\n} = {}) => {\n${block}\n  return {\n    saveCommunityPostToSupabase,\n    updateCommunityPostLikesInSupabase,\n    updateCommunityPostInSupabase,\n    deleteCommunityPostFromSupabase,\n    loadCommunityPostsFromSupabase,\n  };\n};\n`;

const stage13ImportAnchor = stage12Import;
const stage13Import = `import { createLostPetService } from './src/services/lostPets/lostPetService';`;
const stage13Wrapper = `const getLostPetService = () => createLostPetService({\n  supabase,\n  CURRENT_USER_OWNER_ID,\n  sendLostPetAlertPushNotifications,\n  parseLostPetDescription,\n});\n\nconst uploadLostPetPhotoToStorage = (...args) =>\n  getLostPetService().uploadLostPetPhotoToStorage(...args);\n\nconst saveLostPetAlertToSupabase = (...args) =>\n  getLostPetService().saveLostPetAlertToSupabase(...args);\n\nconst updateLostPetAlertStatusInSupabase = (...args) =>\n  getLostPetService().updateLostPetAlertStatusInSupabase(...args);\n\nconst loadLostPetAlertsFromSupabase = (...args) =>\n  getLostPetService().loadLostPetAlertsFromSupabase(...args);\n\nconst deleteLostPetAlertFromSupabase = (...args) =>\n  getLostPetService().deleteLostPetAlertFromSupabase(...args);\n\n`;

const buildLostPetService = (block) => `export const createLostPetService = ({\n  supabase,\n  CURRENT_USER_OWNER_ID,\n  sendLostPetAlertPushNotifications,\n  parseLostPetDescription,\n} = {}) => {\n${block}\n  return {\n    uploadLostPetPhotoToStorage,\n    saveLostPetAlertToSupabase,\n    updateLostPetAlertStatusInSupabase,\n    loadLostPetAlertsFromSupabase,\n    deleteLostPetAlertFromSupabase,\n  };\n};\n`;

const stage14ImportAnchor = stage13Import;
const stage14Import = `import { createMemoryService } from './src/services/memories/memoryService';`;
const stage14Wrapper = `const getMemoryService = () => createMemoryService({\n  supabase,\n  CURRENT_USER_OWNER_ID,\n  normalizeStorageFileName,\n  ensureWritablePetByPetId,\n});\n\nconst uploadMemoryMediaToStorage = (...args) =>\n  getMemoryService().uploadMemoryMediaToStorage(...args);\n\nconst saveMemoryToSupabase = (...args) =>\n  getMemoryService().saveMemoryToSupabase(...args);\n\nconst loadMemoriesFromSupabase = (...args) =>\n  getMemoryService().loadMemoriesFromSupabase(...args);\n\nconst deleteMemoryFromSupabase = (...args) =>\n  getMemoryService().deleteMemoryFromSupabase(...args);\n\n`;

const buildMemoryService = (block) => `import { resolveAccessibleSharedPetIds } from '../health/healthRecordService';\n\nexport const createMemoryService = ({\n  supabase,\n  CURRENT_USER_OWNER_ID,\n  normalizeStorageFileName,\n  ensureWritablePetByPetId,\n} = {}) => {\n${block}\n  return {\n    uploadMemoryMediaToStorage,\n    saveMemoryToSupabase,\n    loadMemoriesFromSupabase,\n    deleteMemoryFromSupabase,\n  };\n};\n`;

try {
  assertBranchAndClean('multi-stage refactor');

  runStage({
    number: 12,
    label: 'Extract community post service',
    targetRelative: 'src/services/community/communityPostService.js',
    startMarker: 'const saveCommunityPostToSupabase =',
    endMarker: 'const uploadLostPetPhotoToStorage =',
    importAnchor: stage12ImportAnchor,
    importLine: stage12Import,
    wrapperBlock: stage12Wrapper,
    serviceBuilder: buildCommunityPostService,
    expectedFunctions: [
      'saveCommunityPostToSupabase',
      'updateCommunityPostLikesInSupabase',
      'updateCommunityPostInSupabase',
      'deleteCommunityPostFromSupabase',
      'loadCommunityPostsFromSupabase',
    ],
    allowedCurrentUserGlobals: ['CURRENT_USER_OWNER_ID', 'CURRENT_USER_NAME'],
  });

  runStage({
    number: 13,
    label: 'Extract lost pet service',
    targetRelative: 'src/services/lostPets/lostPetService.js',
    startMarker: 'const uploadLostPetPhotoToStorage =',
    endMarker: 'const uploadMemoryMediaToStorage =',
    importAnchor: stage13ImportAnchor,
    importLine: stage13Import,
    wrapperBlock: stage13Wrapper,
    serviceBuilder: buildLostPetService,
    expectedFunctions: [
      'uploadLostPetPhotoToStorage',
      'saveLostPetAlertToSupabase',
      'updateLostPetAlertStatusInSupabase',
      'loadLostPetAlertsFromSupabase',
      'deleteLostPetAlertFromSupabase',
    ],
    allowedCurrentUserGlobals: ['CURRENT_USER_OWNER_ID'],
  });

  runStage({
    number: 14,
    label: 'Extract memory service',
    targetRelative: 'src/services/memories/memoryService.js',
    startMarker: 'const uploadMemoryMediaToStorage =',
    endMarker: 'let CURRENT_USER_OWNER_ID =',
    importAnchor: stage14ImportAnchor,
    importLine: stage14Import,
    wrapperBlock: stage14Wrapper,
    serviceBuilder: buildMemoryService,
    expectedFunctions: [
      'uploadMemoryMediaToStorage',
      'saveMemoryToSupabase',
      'loadMemoriesFromSupabase',
      'deleteMemoryFromSupabase',
    ],
    allowedCurrentUserGlobals: ['CURRENT_USER_OWNER_ID'],
  });

  console.log('\n============================================================');
  console.log('MULTI-STAGE SUCCESS: Stages 12, 13, and 14 are complete.');
  console.log('Each stage was independently validated, committed, and pushed.');
  console.log('============================================================');
} catch (error) {
  console.error('\nMULTI-STAGE RUN STOPPED.');
  console.error(error.message);
  console.error('Any earlier successful stages are already safe on GitHub.');
  process.exitCode = 1;
}
