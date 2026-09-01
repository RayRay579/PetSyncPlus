import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const APP_PATH = path.join(ROOT, 'PetSyncApp.js');
const SERVICE_PATH = path.join(ROOT, 'src', 'services', 'community', 'communityMediaStorageService.js');
const CHECK_DIR = path.join(ROOT, '.petsync-refactor-web-check');
const BACKUP_DIR = path.join(ROOT, '.git', 'petsync-refactor-backups');
const RUN_ID = Date.now();
const APP_BACKUP = path.join(BACKUP_DIR, `PetSyncApp-stage11-${RUN_ID}.js`);
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
  throw new Error(`STOP: working tree is not clean before Stage 11:\n${dirtyBefore}`);
}

if (!fs.existsSync(APP_PATH)) {
  throw new Error('STOP: PetSyncApp.js was not found.');
}
if (fs.existsSync(SERVICE_PATH)) {
  throw new Error('STOP: communityMediaStorageService.js already exists. Inspect before rerunning Stage 11.');
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });
fs.copyFileSync(APP_PATH, APP_BACKUP);

const originalApp = fs.readFileSync(APP_PATH, 'utf8');
let app = originalApp;

const importAnchor = `import React, { useState, useRef, useEffect, useContext, useMemo, useCallback } from 'react';`;
const serviceImport = `import { createCommunityMediaStorageService } from './src/services/community/communityMediaStorageService';`;
const blockStartMarker = `const uploadCommunityPostMediaToStorage = async (`;
const blockEndMarker = `const saveCommunityPostToSupabase = async (`;

const wrapperBlock = `const getCommunityMediaStorageService = () => createCommunityMediaStorageService({\n  supabase,\n  bucket: COMMUNITY_MEDIA_BUCKET,\n  normalizeStorageFileName,\n  currentUserId: CURRENT_USER_OWNER_ID,\n});\n\nconst uploadCommunityPostMediaToStorage = (...args) =>\n  getCommunityMediaStorageService().uploadCommunityPostMediaToStorage(...args);\n\nconst deleteCommunityPostMediaFromStorage = (...args) =>\n  getCommunityMediaStorageService().deleteCommunityPostMediaFromStorage(...args);\n\n`;

const service = `export const createCommunityMediaStorageService = ({\n  supabase,\n  bucket,\n  normalizeStorageFileName,\n  currentUserId,\n} = {}) => {\n  const uploadCommunityPostMediaToStorage = async ({ uri, fileName, mimeType, mediaType, userId }) => {\n    if (!uri) {\n      return null;\n    }\n\n    try {\n      const response = await fetch(uri);\n      const arrayBuffer = await response.arrayBuffer();\n      const safeName = normalizeStorageFileName(\n        fileName || \`community-\${Date.now()}.\${mediaType === 'video' ? 'mp4' : 'jpg'}\`,\n      );\n      const folder = \`community-posts/\${String(userId || currentUserId || 'guest').trim() || 'guest'}\`;\n      const filePath = \`\${folder}/\${Date.now()}-\${safeName}\`;\n      const resolvedMimeType = mimeType || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg');\n\n      const { error } = await supabase.storage\n        .from(bucket)\n        .upload(filePath, arrayBuffer, {\n          contentType: resolvedMimeType,\n          upsert: true,\n        });\n\n      if (error) {\n        console.log('Community media upload error:', error);\n        return null;\n      }\n\n      const { data: publicUrlData } = supabase.storage\n        .from(bucket)\n        .getPublicUrl(filePath);\n\n      return {\n        filePath,\n        fileUrl: publicUrlData?.publicUrl || '',\n        mimeType: resolvedMimeType,\n      };\n    } catch (error) {\n      console.log('Community media upload error:', error);\n      return null;\n    }\n  };\n\n  const deleteCommunityPostMediaFromStorage = async (filePath) => {\n    if (!filePath) {\n      return;\n    }\n\n    try {\n      const { error } = await supabase.storage\n        .from(bucket)\n        .remove([filePath]);\n\n      if (error) {\n        console.log('Community media delete error:', error);\n      }\n    } catch (error) {\n      console.log('Community media delete error:', error);\n    }\n  };\n\n  return {\n    uploadCommunityPostMediaToStorage,\n    deleteCommunityPostMediaFromStorage,\n  };\n};\n`;

const assertStage11 = () => {
  if (!app.includes(serviceImport)) throw new Error('Stage 11 service import is missing.');
  if (!app.includes('const getCommunityMediaStorageService = () => createCommunityMediaStorageService({')) {
    throw new Error('Stage 11 service wrapper is missing.');
  }
  if (!app.includes('getCommunityMediaStorageService().uploadCommunityPostMediaToStorage(...args)')) {
    throw new Error('Stage 11 upload wrapper is missing.');
  }
  if (!app.includes('getCommunityMediaStorageService().deleteCommunityPostMediaFromStorage(...args)')) {
    throw new Error('Stage 11 delete wrapper is missing.');
  }
  if (!fs.existsSync(SERVICE_PATH)) throw new Error('communityMediaStorageService.js was not created.');

  const saved = fs.readFileSync(SERVICE_PATH, 'utf8');
  for (const required of [
    'createCommunityMediaStorageService',
    'uploadCommunityPostMediaToStorage',
    'deleteCommunityPostMediaFromStorage',
    'Community media upload error:',
    'Community media delete error:',
  ]) {
    if (!saved.includes(required)) throw new Error(`Stage 11 service is missing: ${required}`);
  }
};

try {
  if (!app.includes(importAnchor)) {
    throw new Error('Could not locate the React import anchor. No source files were changed.');
  }

  const blockStart = app.indexOf(blockStartMarker);
  const blockEnd = app.indexOf(blockEndMarker, blockStart);
  if (blockStart < 0 || blockEnd < 0 || blockEnd <= blockStart) {
    throw new Error('Could not locate the Stage 11 community media storage function boundaries. No source files were changed.');
  }

  const oldBlock = app.slice(blockStart, blockEnd);
  if (!oldBlock.includes('const deleteCommunityPostMediaFromStorage = async')) {
    throw new Error('Stage 11 block did not contain the expected delete function. No source files were changed.');
  }

  // Replace the function block before adding the import so string indexes cannot become stale.
  app = app.slice(0, blockStart) + wrapperBlock + app.slice(blockEnd);
  app = app.replace(importAnchor, `${importAnchor}\n${serviceImport}`);

  fs.mkdirSync(path.dirname(SERVICE_PATH), { recursive: true });
  fs.writeFileSync(SERVICE_PATH, service, 'utf8');
  fs.writeFileSync(APP_PATH, app, 'utf8');

  assertStage11();
  console.log('Stage 11 extracted community media storage into communityMediaStorageService.js.');
  validateWeb();

  const add = run('git', ['add', 'PetSyncApp.js', 'src/services/community/communityMediaStorageService.js']);
  if (add.status !== 0) throw new Error('git add failed.');

  const staged = capture('git', ['diff', '--cached', '--name-only']);
  if (!staged) throw new Error('Stage 11 produced no staged source changes.');

  const commit = run('git', ['commit', '-m', 'Extract community media storage service']);
  if (commit.status !== 0) throw new Error('git commit failed.');

  const push = run('git', ['push']);
  if (push.status !== 0) {
    console.log('\nStage 11 commit succeeded, but push failed. Your local commit is safe.');
    process.exitCode = 2;
  } else {
    console.log('\nSUCCESS: Stage 11 extracted, validated, committed, and pushed.');
  }

  console.log(`Hidden backup kept at: ${APP_BACKUP}`);
} catch (error) {
  console.error(`\nSTAGE 11 FAILED: ${error.message}`);
  console.error('Restoring PetSyncApp.js and removing the new community media storage service...');

  fs.writeFileSync(APP_PATH, originalApp, 'utf8');
  fs.rmSync(SERVICE_PATH, { force: true });
  fs.rmSync(CHECK_DIR, { recursive: true, force: true });
  run('git', ['reset', '--', 'PetSyncApp.js', 'src/services/community/communityMediaStorageService.js']);

  console.error('Original source restored. No Stage 11 source commit was created.');
  console.error(`Hidden backup kept at: ${APP_BACKUP}`);
  process.exitCode = 1;
}
