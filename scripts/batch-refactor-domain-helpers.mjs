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

const originalSource = fs.readFileSync(APP_PATH, 'utf8');
let source = originalSource;
const generatedFiles = [];

const insertImport = (importText) => {
  if (source.includes(importText.trim())) return;
  const reactStart = source.indexOf('import React');
  const firstImportEnd = source.indexOf('\n', reactStart);
  if (reactStart < 0 || firstImportEnd < 0) {
    throw new Error('Could not locate the React import anchor.');
  }
  source = `${source.slice(0, firstImportEnd + 1)}${importText.trim()}\n${source.slice(firstImportEnd + 1)}`;
};

const findMarker = (markers, fromIndex = 0) => {
  for (const marker of markers) {
    const index = source.indexOf(marker, fromIndex);
    if (index >= 0) return { marker, index };
  }
  return null;
};

const plans = [
  {
    name: 'profile Supabase service',
    startMarkers: ['const loadCommunityProfileFromSupabase = async'],
    endMarkers: ['const PET_SPECIES_EMOJIS ='],
    modulePath: 'src/services/profiles/profileService.js',
    exports: [
      'loadCommunityProfileFromSupabase',
      'loadAuthProfileFromSupabase',
      'canWriteProfileAvatarUrl',
      'uploadProfileAvatarToStorage',
      'upsertAuthProfileToSupabase',
      'saveCommunityProfileToSupabase',
    ],
    importPath: './src/services/profiles/profileService',
    prefix: "import { supabase } from '../../../supabase';\nimport {\n  normalizeCommunityProfileKey,\n  getCommunityProfileFixture,\n  mapCommunityProfileRow,\n} from '../../models/communityProfile';\n\n",
  },
  {
    name: 'community tab config',
    startMarkers: ['const COMMUNITY_TABS ='],
    endMarkers: ['const loadCommunityProfileFromSupabase = async'],
    modulePath: 'src/config/community.js',
    exports: ['COMMUNITY_TABS'],
    importPath: './src/config/community',
  },
  {
    name: 'pet species emoji config',
    startMarkers: ['const PET_SPECIES_EMOJIS ='],
    endMarkers: ['const navigationRef = createNavigationContainerRef();'],
    modulePath: 'src/config/petSpecies.js',
    exports: ['PET_SPECIES_EMOJIS'],
    importPath: './src/config/petSpecies',
  },
  {
    name: 'feature locked benefits config',
    startMarkers: ['const FEATURE_LOCKED_BENEFITS ='],
    endMarkers: ['function FeatureLockedModal('],
    modulePath: 'src/config/featureLockedBenefits.js',
    exports: ['FEATURE_LOCKED_BENEFITS', 'getFeatureLockedBenefits'],
    importPath: './src/config/featureLockedBenefits',
  },
];

const preflight = () => {
  for (const plan of plans) {
    if (source.includes(`from '${plan.importPath}'`)) continue;
    const start = findMarker(plan.startMarkers);
    const end = start ? findMarker(plan.endMarkers, start.index + start.marker.length) : null;
    if (!start || !end || end.index <= start.index) {
      throw new Error(`Preflight could not locate ${plan.name} block. No app files were changed.`);
    }
  }
};

const buildEditPlan = () => {
  const edits = [];
  for (const plan of plans) {
    if (source.includes(`from '${plan.importPath}'`)) {
      console.log(`SKIP ${plan.name}: already extracted.`);
      continue;
    }
    const start = findMarker(plan.startMarkers);
    const end = findMarker(plan.endMarkers, start.index + start.marker.length);
    edits.push({ plan, start, end });
  }
  return edits.sort((a, b) => b.start.index - a.start.index);
};

const applyExtraction = ({ plan, start, end }) => {
  const block = source.slice(start.index, end.index).trimEnd();
  const prefix = plan.prefix || '';
  writeFile(
    plan.modulePath,
    `${prefix}${block}\n\nexport {\n${plan.exports.map((name) => `  ${name},`).join('\n')}\n};`
  );
  generatedFiles.push(plan.modulePath);
  source = `${source.slice(0, start.index)}${source.slice(end.index)}`;
  console.log(`EXTRACTED ${plan.name} -> ${plan.modulePath}`);
};

try {
  preflight();
  const edits = buildEditPlan();

  for (const edit of edits) {
    applyExtraction(edit);
  }

  for (const { plan } of [...edits].reverse()) {
    insertImport(
      `import {\n${plan.exports.map((name) => `  ${name},`).join('\n')}\n} from '${plan.importPath}';`
    );
  }

  fs.writeFileSync(APP_PATH, source, 'utf8');

  console.log('\nRunning Expo web export validation...');
  fs.rmSync(CHECK_DIR, { recursive: true, force: true });

  let validation;
  if (process.platform === 'win32') {
    validation = run('powershell.exe', [
      '-NoProfile',
      '-Command',
      'npx expo export --platform web --output-dir .petsync-refactor-web-check --clear',
    ]);
  } else {
    validation = run('npx', [
      'expo',
      'export',
      '--platform',
      'web',
      '--output-dir',
      '.petsync-refactor-web-check',
      '--clear',
    ]);
  }

  if (validation.status !== 0) {
    throw new Error('Expo web export validation failed.');
  }

  fs.rmSync(CHECK_DIR, { recursive: true, force: true });

  const filesToAdd = ['PetSyncApp.js', ...generatedFiles];
  const add = run('git', ['add', ...filesToAdd]);
  if (add.status !== 0) throw new Error('git add failed.');

  const commit = run('git', ['commit', '-m', 'Extract profile service and shared config']);
  if (commit.status !== 0) throw new Error('git commit failed.');

  const push = run('git', ['push']);
  if (push.status !== 0) {
    console.log('\nRefactor and commit succeeded, but push failed. Your local commit is safe.');
    process.exitCode = 2;
  } else {
    console.log('\nSUCCESS: stage 2 refactor validated, committed, and pushed.');
  }

  console.log(`Hidden backup kept at: ${BACKUP_PATH}`);
} catch (error) {
  console.error(`\nBATCH REFACTOR FAILED: ${error.message}`);
  console.error('Restoring PetSyncApp.js and removing generated stage 2 files...');

  fs.writeFileSync(APP_PATH, originalSource, 'utf8');

  for (const relativePath of generatedFiles) {
    const absolute = path.join(ROOT, relativePath);
    if (fs.existsSync(absolute)) fs.rmSync(absolute, { force: true });
  }

  if (fs.existsSync(CHECK_DIR)) {
    fs.rmSync(CHECK_DIR, { recursive: true, force: true });
  }

  run('git', ['reset', '--', 'PetSyncApp.js', ...generatedFiles]);
  console.error('Original working app restored. No stage 2 refactor commit was created.');
  process.exitCode = 1;
}
