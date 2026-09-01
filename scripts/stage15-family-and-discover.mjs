import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parse } from '@babel/parser';

const ROOT = process.cwd();
const APP_PATH = path.join(ROOT, 'PetSyncApp.js');
const SERVICE_PATH = path.join(ROOT, 'src', 'services', 'family', 'familyService.js');
const CHECK_DIR = path.join(ROOT, '.petsync-refactor-web-check');
const BACKUP_DIR = path.join(ROOT, '.git', 'petsync-refactor-backups');
const EXPECTED_BRANCH = 'petsync-clean-refactor';

const FAMILY_FUNCTIONS = [
  'getOrCreateOwnerHousehold',
  'loadFamilyMembersFromSupabase',
  'saveFamilyInvitationToSupabase',
  'updateFamilyMemberStatusInSupabase',
  'acceptFamilyInviteInSupabase',
  'removeFamilyMemberFromSupabase',
];

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

const parseApp = (source) => parse(source, {
  sourceType: 'module',
  plugins: ['jsx', 'flow'],
  errorRecovery: false,
});

const getTopLevelConstDeclarations = (source) => {
  const ast = parseApp(source);
  const result = new Map();
  for (const node of ast.program.body) {
    if (node.type !== 'VariableDeclaration' || node.kind !== 'const') continue;
    for (const decl of node.declarations) {
      if (decl.id?.type === 'Identifier') {
        result.set(decl.id.name, { start: node.start, end: node.end });
      }
    }
  }
  return result;
};

const branch = capture('git', ['branch', '--show-current']);
if (branch !== EXPECTED_BRANCH) {
  throw new Error(`STOP: expected branch ${EXPECTED_BRANCH}, found ${branch || '(detached)'}.`);
}

const status = capture('git', ['status', '--porcelain']);
if (status) {
  throw new Error(`STOP: working tree is not clean before Stage 15:\n${status}`);
}

if (!fs.existsSync(APP_PATH)) throw new Error('STOP: PetSyncApp.js not found.');
if (fs.existsSync(SERVICE_PATH)) throw new Error('STOP: familyService.js already exists. Inspect before rerunning Stage 15.');

const original = fs.readFileSync(APP_PATH, 'utf8');
const declarations = getTopLevelConstDeclarations(original);
const missing = FAMILY_FUNCTIONS.filter((name) => !declarations.has(name));
if (missing.length) {
  throw new Error(`STOP: Stage 15 could not find expected family functions: ${missing.join(', ')}`);
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });
const stamp = Date.now();
const backupPath = path.join(BACKUP_DIR, `PetSyncApp-stage15-${stamp}.js`);
fs.writeFileSync(backupPath, original, 'utf8');

try {
  const ordered = FAMILY_FUNCTIONS
    .map((name) => ({ name, ...declarations.get(name) }))
    .sort((a, b) => a.start - b.start);

  const extractedSource = ordered
    .map(({ start, end }) => original.slice(start, end).trim())
    .join('\n\n');

  const serviceSource = `export const createFamilyService = ({\n  supabase,\n  CURRENT_USER_OWNER_ID,\n  CURRENT_USER_EMAIL,\n  CURRENT_USER_NAME,\n  mapFamilyMemberRow,\n  normalizeFamilyMemberRole,\n  normalizeFamilyMemberStatus,\n} = {}) => {\n${extractedSource}\n\n  return {\n${FAMILY_FUNCTIONS.map((name) => `    ${name},`).join('\n')}\n  };\n};\n`;

  fs.mkdirSync(path.dirname(SERVICE_PATH), { recursive: true });
  fs.writeFileSync(SERVICE_PATH, serviceSource, 'utf8');

  let next = original;
  for (const item of [...ordered].sort((a, b) => b.start - a.start)) {
    next = next.slice(0, item.start) + next.slice(item.end);
  }

  const insertionPoint = Math.min(...ordered.map((item) => item.start));
  const removedBeforeInsertion = ordered
    .filter((item) => item.end <= insertionPoint)
    .reduce((sum, item) => sum + (item.end - item.start), 0);
  const adjustedInsertionPoint = insertionPoint - removedBeforeInsertion;

  const wrappers = `const getFamilyService = () => createFamilyService({\n  supabase,\n  CURRENT_USER_OWNER_ID,\n  CURRENT_USER_EMAIL,\n  CURRENT_USER_NAME,\n  mapFamilyMemberRow,\n  normalizeFamilyMemberRole,\n  normalizeFamilyMemberStatus,\n});\n\n${FAMILY_FUNCTIONS.map((name) => `const ${name} = (...args) =>\n  getFamilyService().${name}(...args);`).join('\n\n')}\n\n`;

  next = next.slice(0, adjustedInsertionPoint) + wrappers + next.slice(adjustedInsertionPoint);

  const importLine = `import { createFamilyService } from './src/services/family/familyService';\n`;
  if (!next.includes("./src/services/family/familyService")) {
    const firstImportEnd = next.indexOf('\n') + 1;
    next = next.slice(0, firstImportEnd) + importLine + next.slice(firstImportEnd);
  }

  fs.writeFileSync(APP_PATH, next, 'utf8');

  const checkSource = fs.readFileSync(APP_PATH, 'utf8');
  parseApp(checkSource);
  for (const name of FAMILY_FUNCTIONS) {
    const count = (checkSource.match(new RegExp(`const ${name}\\s*=`, 'g')) || []).length;
    if (count !== 1) throw new Error(`Stage 15 wiring check failed for ${name}: found ${count} declarations.`);
  }

  console.log('Stage 15 extracted Family Sharing service -> src/services/family/familyService.js');
  console.log('\nRunning Expo web export validation...');
  fs.rmSync(CHECK_DIR, { recursive: true, force: true });
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const validation = run(npx, ['expo', 'export', '--platform', 'web', '--output-dir', '.petsync-refactor-web-check', '--clear']);
  if (validation.status !== 0) throw new Error('Expo web export validation failed.');

  fs.rmSync(CHECK_DIR, { recursive: true, force: true });
  run('git', ['add', 'PetSyncApp.js', 'src/services/family/familyService.js']);
  const commit = run('git', ['commit', '-m', 'Stage 15: Extract family sharing service']);
  if (commit.status !== 0) throw new Error('git commit failed.');
  const push = run('git', ['push']);
  if (push.status !== 0) throw new Error('git push failed.');

  console.log('\nSUCCESS: Stage 15 Family Sharing validated, committed, and pushed.');
  console.log(`Hidden backup kept at: ${backupPath}`);

  const updated = fs.readFileSync(APP_PATH, 'utf8');
  const remaining = [...getTopLevelConstDeclarations(updated).keys()]
    .filter((name) => /(Supabase|Storage|Upload|Download|Delete|Save|Load|Invite|Household|Activity|Score|Recipe|Vet|Finder|Share)/i.test(name))
    .filter((name) => !FAMILY_FUNCTIONS.includes(name))
    .sort();

  console.log('\n============================================================');
  console.log('NEXT-BATCH DISCOVERY: remaining service/helper candidates');
  console.log('============================================================');
  if (remaining.length) {
    for (const name of remaining) console.log(`CANDIDATE ${name}`);
  } else {
    console.log('No matching top-level candidates found by the discovery filter.');
  }
  console.log('============================================================');
} catch (error) {
  console.error(`\nSTAGE 15 FAILED: ${error.message}`);
  console.error('Restoring PetSyncApp.js and removing familyService.js...');
  fs.writeFileSync(APP_PATH, original, 'utf8');
  fs.rmSync(SERVICE_PATH, { force: true });
  fs.rmSync(CHECK_DIR, { recursive: true, force: true });
  console.error('Original source restored. No Stage 15 source commit was created.');
  console.error(`Hidden backup kept at: ${backupPath}`);
  process.exit(1);
}
