import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const APP_PATH = path.join(ROOT, 'PetSyncApp.js');
const CHECK_DIR = path.join(ROOT, '.petsync-refactor-web-check');
const BACKUP_DIR = path.join(ROOT, '.git', 'petsync-refactor-backups');
const BACKUP_PATH = path.join(BACKUP_DIR, `PetSyncApp-${Date.now()}.js`);
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

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });
const writeFile = (relativePath, content) => {
  const absolute = path.join(ROOT, relativePath);
  ensureDir(path.dirname(absolute));
  fs.writeFileSync(absolute, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
};

const branch = capture('git', ['branch', '--show-current']);
if (branch !== EXPECTED_BRANCH) {
  throw new Error(`STOP: expected branch ${EXPECTED_BRANCH}, but current branch is ${branch || '(unknown)'}.`);
}

const dirtyBefore = capture('git', ['status', '--porcelain']);
if (dirtyBefore) {
  throw new Error(`STOP: working tree is not clean before batch refactor:\n${dirtyBefore}`);
}

if (!fs.existsSync(APP_PATH)) {
  throw new Error('STOP: PetSyncApp.js was not found.');
}

ensureDir(BACKUP_DIR);
fs.copyFileSync(APP_PATH, BACKUP_PATH);

let source = fs.readFileSync(APP_PATH, 'utf8');
const generatedFiles = [];

const insertImport = (importText) => {
  if (source.includes(importText.trim())) return;
  const firstImportEnd = source.indexOf('\n', source.indexOf("import React"));
  if (firstImportEnd < 0) throw new Error('Could not locate the React import anchor.');
  source = `${source.slice(0, firstImportEnd + 1)}${importText.trim()}\n${source.slice(firstImportEnd + 1)}`;
};

const extractRange = ({
  name,
  startMarker,
  endMarker,
  modulePath,
  modulePrefix = '',
  exports = [],
  importPath,
}) => {
  if (source.includes(`from '${importPath}'`)) {
    console.log(`SKIP ${name}: already extracted.`);
    return;
  }

  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`Could not locate ${name} block.`);
  }

  const block = source.slice(start, end).trimEnd();
  writeFile(modulePath, `${modulePrefix}${block}\n\nexport {\n${exports.map((name) => `  ${name},`).join('\n')}\n};`);
  generatedFiles.push(modulePath);

  insertImport(`import {\n${exports.map((name) => `  ${name},`).join('\n')}\n} from '${importPath}';`);
  source = `${source.slice(0, start)}${source.slice(end)}`;
  console.log(`EXTRACTED ${name} -> ${modulePath}`);
};

extractRange({
  name: 'community profile model',
  startMarker: 'const normalizeCommunityProfile =',
  endMarker: 'const COMMUNITY_PROFILE_ACHIEVEMENTS =',
  modulePath: 'src/models/communityProfile.js',
  exports: ['normalizeCommunityProfile', 'mergeCommunityProfile'],
  importPath: './src/models/communityProfile',
});

extractRange({
  name: 'community achievements model',
  startMarker: 'const COMMUNITY_PROFILE_ACHIEVEMENTS =',
  endMarker: 'const PET_SPECIES_EMOJIS =',
  modulePath: 'src/models/communityAchievements.js',
  exports: ['COMMUNITY_PROFILE_ACHIEVEMENTS', 'getCommunityProfileAchievements'],
  importPath: './src/models/communityAchievements',
});

extractRange({
  name: 'lost pet text model',
  startMarker: 'const sanitizeLostPetDescription =',
  endMarker: 'const FAMILY_ROLE_LABELS =',
  modulePath: 'src/models/lostPetText.js',
  exports: [
    'sanitizeLostPetDescription',
    'getLostPetProfileSummary',
    'getLostPetFlyerContactLines',
    'buildLostPetFlyerText',
  ],
  importPath: './src/models/lostPetText',
});

extractRange({
  name: 'family member model',
  startMarker: 'const FAMILY_ROLE_LABELS =',
  endMarker: 'const sanitizeStorageFileName =',
  modulePath: 'src/models/familyMember.js',
  exports: [
    'FAMILY_ROLE_LABELS',
    'normalizeFamilyMemberRole',
    'getFamilyMemberRoleLabel',
    'normalizeFamilyMemberFromSupabase',
  ],
  importPath: './src/models/familyMember',
});

extractRange({
  name: 'storage filename helper',
  startMarker: 'const sanitizeStorageFileName =',
  endMarker: 'const uploadCommunityMediaToSupabase =',
  modulePath: 'src/utils/storageNames.js',
  exports: ['sanitizeStorageFileName'],
  importPath: './src/utils/storageNames',
});

try {
  fs.writeFileSync(APP_PATH, source, 'utf8');

  console.log('\nRunning Expo web export validation...');
  fs.rmSync(CHECK_DIR, { recursive: true, force: true });
  const expoCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const validation = run(expoCommand, ['expo', 'export', '--platform', 'web', '--output-dir', '.petsync-refactor-web-check', '--clear']);
  if (validation.status !== 0) {
    throw new Error('Expo web export validation failed.');
  }

  fs.rmSync(CHECK_DIR, { recursive: true, force: true });

  const filesToAdd = ['PetSyncApp.js', ...generatedFiles];
  const add = run('git', ['add', ...filesToAdd]);
  if (add.status !== 0) throw new Error('git add failed.');

  const commit = run('git', ['commit', '-m', 'Batch extract PetSync domain helpers']);
  if (commit.status !== 0) throw new Error('git commit failed.');

  const push = run('git', ['push']);
  if (push.status !== 0) {
    console.log('\nRefactor and commit succeeded, but push failed. Your local commit is safe.');
    process.exitCode = 2;
  } else {
    console.log('\nSUCCESS: batch refactor validated, committed, and pushed.');
  }

  console.log(`Hidden backup kept at: ${BACKUP_PATH}`);
} catch (error) {
  console.error(`\nBATCH REFACTOR FAILED: ${error.message}`);
  console.error('Restoring PetSyncApp.js and removing generated batch files...');

  if (fs.existsSync(BACKUP_PATH)) {
    fs.copyFileSync(BACKUP_PATH, APP_PATH);
  }

  for (const relativePath of generatedFiles) {
    const absolute = path.join(ROOT, relativePath);
    if (fs.existsSync(absolute)) fs.rmSync(absolute, { force: true });
  }

  if (fs.existsSync(CHECK_DIR)) {
    fs.rmSync(CHECK_DIR, { recursive: true, force: true });
  }

  run('git', ['reset', '--', 'PetSyncApp.js', ...generatedFiles]);
  console.error('Original working app restored. No batch refactor commit was created.');
  process.exitCode = 1;
}
