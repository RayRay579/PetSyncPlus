import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parse } from '@babel/parser';

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
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || `${command} failed`).trim());
  return (result.stdout || '').trim();
};

const runExpoExport = () => {
  const args = ['expo', 'export', '--platform', 'web', '--output-dir', '.petsync-refactor-web-check', '--clear'];
  if (process.platform === 'win32') return run('cmd.exe', ['/d', '/s', '/c', 'npx', ...args]);
  return run('npx', args);
};

const parseApp = (source) => parse(source, {
  sourceType: 'module',
  plugins: ['jsx', 'flow'],
  errorRecovery: false,
});

const getDeclarations = (source) => {
  const ast = parseApp(source);
  const result = new Map();
  for (const node of ast.program.body) {
    if (node.type !== 'VariableDeclaration' || node.kind !== 'const') continue;
    for (const decl of node.declarations) {
      if (decl.id?.type === 'Identifier') result.set(decl.id.name, { start: node.start, end: node.end });
    }
  }
  return result;
};

const assertClean = () => {
  const branch = capture('git', ['branch', '--show-current']);
  if (branch !== EXPECTED_BRANCH) throw new Error(`STOP: expected branch ${EXPECTED_BRANCH}, found ${branch || '(detached)'}.`);
  const status = capture('git', ['status', '--porcelain']);
  if (status) throw new Error(`STOP: working tree is not clean:\n${status}`);
};

const validateAndCommit = ({ stageLabel, files, commitMessage }) => {
  console.log('\nRunning Expo web export validation...');
  fs.rmSync(CHECK_DIR, { recursive: true, force: true });
  const validation = runExpoExport();
  if (validation.status !== 0) throw new Error('Expo web export validation failed.');
  fs.rmSync(CHECK_DIR, { recursive: true, force: true });
  run('git', ['add', ...files]);
  const commit = run('git', ['commit', '-m', commitMessage]);
  if (commit.status !== 0) throw new Error('git commit failed.');
  const push = run('git', ['push']);
  if (push.status !== 0) throw new Error('git push failed.');
  console.log(`SUCCESS: ${stageLabel} validated, committed, and pushed.`);
};

const extractFactoryStage = ({ stage, label, names, servicePath, importPath, factoryName, dependencyNames }) => {
  assertClean();
  const absoluteService = path.join(ROOT, servicePath);
  if (fs.existsSync(absoluteService)) throw new Error(`STOP: ${servicePath} already exists.`);
  const original = fs.readFileSync(APP_PATH, 'utf8');
  const declarations = getDeclarations(original);
  const missing = names.filter((name) => !declarations.has(name));
  if (missing.length) throw new Error(`STOP: ${label} missing expected declarations: ${missing.join(', ')}`);

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const backupPath = path.join(BACKUP_DIR, `PetSyncApp-stage${stage}-${Date.now()}.js`);
  fs.writeFileSync(backupPath, original, 'utf8');

  try {
    const ordered = names.map((name) => ({ name, ...declarations.get(name) })).sort((a, b) => a.start - b.start);
    const extracted = ordered.map(({ start, end }) => original.slice(start, end).trim()).join('\n\n');
    const dependencyLines = dependencyNames.map((name) => `  ${name},`).join('\n');
    const serviceSource = `export const ${factoryName} = ({\n${dependencyLines}\n} = {}) => {\n${extracted}\n\n  return {\n${names.map((name) => `    ${name},`).join('\n')}\n  };\n};\n`;
    fs.mkdirSync(path.dirname(absoluteService), { recursive: true });
    fs.writeFileSync(absoluteService, serviceSource, 'utf8');

    let next = original;
    for (const item of [...ordered].sort((a, b) => b.start - a.start)) {
      next = next.slice(0, item.start) + next.slice(item.end);
    }
    const insertionPoint = Math.min(...ordered.map((item) => item.start));
    const getName = `get${factoryName.replace(/^create/, '')}`;
    const wrappers = `const ${getName} = () => ${factoryName}({\n${dependencyLines}\n});\n\n${names.map((name) => `const ${name} = (...args) =>\n  ${getName}().${name}(...args);`).join('\n\n')}\n\n`;
    next = next.slice(0, insertionPoint) + wrappers + next.slice(insertionPoint);

    const importLine = `import { ${factoryName} } from '${importPath}';\n`;
    if (!next.includes(importPath)) {
      const firstImportEnd = next.indexOf('\n') + 1;
      next = next.slice(0, firstImportEnd) + importLine + next.slice(firstImportEnd);
    }

    fs.writeFileSync(APP_PATH, next, 'utf8');
    parseApp(next);
    for (const name of names) {
      const count = (next.match(new RegExp(`const ${name}\\s*=`, 'g')) || []).length;
      if (count !== 1) throw new Error(`${label} wiring check failed for ${name}: found ${count} declarations.`);
    }

    console.log(`\n${label}: extracted -> ${servicePath}`);
    validateAndCommit({
      stageLabel: label,
      files: ['PetSyncApp.js', servicePath],
      commitMessage: `${label}`,
    });
    console.log(`Hidden backup kept at: ${backupPath}`);
  } catch (error) {
    fs.writeFileSync(APP_PATH, original, 'utf8');
    fs.rmSync(absoluteService, { force: true });
    fs.rmSync(CHECK_DIR, { recursive: true, force: true });
    throw error;
  }
};

assertClean();

// Stage 15H - repair runtime-only Alert dependency leaked by Stage 15 extraction.
{
  const familyPath = path.join(ROOT, 'src', 'services', 'family', 'familyService.js');
  const originalApp = fs.readFileSync(APP_PATH, 'utf8');
  const originalFamily = fs.readFileSync(familyPath, 'utf8');
  const appBackup = path.join(BACKUP_DIR, `PetSyncApp-stage15h-${Date.now()}.js`);
  const familyBackup = path.join(BACKUP_DIR, `familyService-stage15h-${Date.now()}.js`);
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  fs.writeFileSync(appBackup, originalApp, 'utf8');
  fs.writeFileSync(familyBackup, originalFamily, 'utf8');
  try {
    let familyNext = originalFamily;
    if (!familyNext.includes('showAlert,')) {
      familyNext = familyNext.replace('  CURRENT_USER_NAME,\n', '  CURRENT_USER_NAME,\n  showAlert = () => {},\n');
    }
    familyNext = familyNext.replaceAll('Alert.alert(', 'showAlert(');

    let appNext = originalApp;
    const marker = '  CURRENT_USER_NAME,\n  mapFamilyMemberRow,';
    if (!appNext.includes('showAlert: (...args) => Alert.alert(...args),')) {
      if (!appNext.includes(marker)) throw new Error('Could not locate getFamilyService dependency block.');
      appNext = appNext.replace(marker, '  CURRENT_USER_NAME,\n  showAlert: (...args) => Alert.alert(...args),\n  mapFamilyMemberRow,');
    }

    fs.writeFileSync(familyPath, familyNext, 'utf8');
    fs.writeFileSync(APP_PATH, appNext, 'utf8');
    parseApp(appNext);
    if (familyNext.includes('Alert.alert(')) throw new Error('Family service still contains direct Alert.alert dependency.');
    console.log('Stage 15H fixed Family Sharing alert dependency.');
    validateAndCommit({
      stageLabel: 'Stage 15H Family Sharing dependency hardening',
      files: ['PetSyncApp.js', 'src/services/family/familyService.js'],
      commitMessage: 'Stage 15H: Harden family service dependencies',
    });
  } catch (error) {
    fs.writeFileSync(APP_PATH, originalApp, 'utf8');
    fs.writeFileSync(familyPath, originalFamily, 'utf8');
    fs.rmSync(CHECK_DIR, { recursive: true, force: true });
    throw error;
  }
}

extractFactoryStage({
  stage: 16,
  label: 'Stage 16: Extract community comment service',
  names: ['mapCommunityCommentRow', 'loadCommunityCommentsFromSupabase', 'saveCommunityCommentToSupabase', 'deleteCommunityCommentFromSupabase'],
  servicePath: 'src/services/community/communityCommentService.js',
  importPath: './src/services/community/communityCommentService',
  factoryName: 'createCommunityCommentService',
  dependencyNames: ['supabase', 'CURRENT_USER_OWNER_ID', 'CURRENT_USER_NAME'],
});

extractFactoryStage({
  stage: 17,
  label: 'Stage 17: Extract recipe service',
  names: ['normalizeRecipeSafeFor', 'normalizeRecipeIngredients', 'saveRecipeToSupabase', 'updateRecipeInSupabase', 'deleteRecipeFromSupabase', 'loadRecipesFromSupabase'],
  servicePath: 'src/services/recipes/recipeService.js',
  importPath: './src/services/recipes/recipeService',
  factoryName: 'createRecipeService',
  dependencyNames: ['supabase', 'CURRENT_USER_OWNER_ID', 'CURRENT_USER_NAME'],
});

// Stage 18 - pure care activity constants/helpers move without a service factory.
{
  assertClean();
  const modelRel = 'src/models/careActivity.js';
  const modelPath = path.join(ROOT, modelRel);
  if (fs.existsSync(modelPath)) throw new Error(`STOP: ${modelRel} already exists.`);
  const original = fs.readFileSync(APP_PATH, 'utf8');
  const declarations = getDeclarations(original);
  const names = ['CARE_ACTIVITY_TYPES', 'normalizeCareActivityType'];
  const missing = names.filter((name) => !declarations.has(name));
  if (missing.length) throw new Error(`STOP: Stage 18 missing expected declarations: ${missing.join(', ')}`);
  const ordered = names.map((name) => ({ name, ...declarations.get(name) })).sort((a, b) => a.start - b.start);
  const backupPath = path.join(BACKUP_DIR, `PetSyncApp-stage18-${Date.now()}.js`);
  fs.writeFileSync(backupPath, original, 'utf8');
  try {
    const modelSource = `${ordered.map(({ start, end }) => original.slice(start, end).trim()).join('\n\n')}\n\nexport { CARE_ACTIVITY_TYPES, normalizeCareActivityType };\n`;
    fs.mkdirSync(path.dirname(modelPath), { recursive: true });
    fs.writeFileSync(modelPath, modelSource, 'utf8');
    let next = original;
    for (const item of [...ordered].sort((a, b) => b.start - a.start)) next = next.slice(0, item.start) + next.slice(item.end);
    const importLine = `import { CARE_ACTIVITY_TYPES, normalizeCareActivityType } from './src/models/careActivity';\n`;
    const firstImportEnd = next.indexOf('\n') + 1;
    next = next.slice(0, firstImportEnd) + importLine + next.slice(firstImportEnd);
    fs.writeFileSync(APP_PATH, next, 'utf8');
    parseApp(next);
    console.log('\nStage 18: extracted care activity model -> src/models/careActivity.js');
    validateAndCommit({
      stageLabel: 'Stage 18: Extract care activity model',
      files: ['PetSyncApp.js', modelRel],
      commitMessage: 'Stage 18: Extract care activity model',
    });
    console.log(`Hidden backup kept at: ${backupPath}`);
  } catch (error) {
    fs.writeFileSync(APP_PATH, original, 'utf8');
    fs.rmSync(modelPath, { force: true });
    fs.rmSync(CHECK_DIR, { recursive: true, force: true });
    throw error;
  }
}

console.log('\n============================================================');
console.log('MULTI-STAGE SUCCESS: Stage 15H and Stages 16, 17, 18 complete.');
console.log('Each stage was independently validated, committed, and pushed.');
console.log('============================================================');
