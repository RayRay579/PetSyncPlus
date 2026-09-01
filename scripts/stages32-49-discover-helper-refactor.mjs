import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default || traverseModule;
const ROOT = process.cwd();
const APP = path.join(ROOT, 'PetSyncApp.js');
const CHECK = path.join(ROOT, '.petsync-refactor-web-check');
const BACKUPS = path.join(ROOT, '.git', 'petsync-refactor-backups');
const BRANCH = 'petsync-clean-refactor';

const GLOBALS = new Set([
  'Array','Boolean','Date','Error','Infinity','Intl','JSON','Map','Math','NaN','Number','Object','Promise','RegExp','Set','String','Symbol','URL','URLSearchParams',
  'clearInterval','clearTimeout','console','decodeURIComponent','encodeURIComponent','fetch','isFinite','isNaN','parseFloat','parseInt','queueMicrotask','setInterval','setTimeout','undefined',
]);

const run = (cmd, args, capture = false) => {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
    shell: false,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || `${cmd} failed`).trim());
  return (r.stdout || '').trim();
};

const expo = () => process.platform === 'win32'
  ? run('cmd.exe', ['/d','/s','/c','npx','expo','export','--platform','web','--output-dir','.petsync-refactor-web-check','--clear'])
  : run('npx', ['expo','export','--platform','web','--output-dir','.petsync-refactor-web-check','--clear']);

const parseSource = source => parse(source, {
  sourceType: 'module',
  plugins: ['jsx','flow'],
  errorRecovery: false,
});

const topLevelDeclaration = (source, name) => {
  const ast = parseSource(source);
  for (const node of ast.program.body) {
    if (node.type !== 'VariableDeclaration' || node.kind !== 'const') continue;
    for (const decl of node.declarations) {
      if (decl.id?.type === 'Identifier' && decl.id.name === name) {
        return { start: node.start, end: node.end, text: source.slice(node.start, node.end).trim() };
      }
    }
  }
  return null;
};

const freeIdentifiers = text => {
  const ast = parseSource(`${text}\n`);
  const names = new Set();
  traverse(ast, {
    ReferencedIdentifier(p) {
      const name = p.node.name;
      if (GLOBALS.has(name)) return;
      if (p.scope.hasBinding(name)) return;
      names.add(name);
    },
  });
  return [...names].sort();
};

const addImport = (source, line) => {
  if (source.includes(line.trim())) return source;
  const firstBreak = source.indexOf('\n');
  if (firstBreak < 0) return `${line}${source}`;
  return source.slice(0, firstBreak + 1) + line + source.slice(firstBreak + 1);
};

const backup = (stage, source) => {
  fs.mkdirSync(BACKUPS, { recursive: true });
  const file = path.join(BACKUPS, `PetSyncApp-stage${stage}-${Date.now()}.js`);
  fs.writeFileSync(file, source, 'utf8');
  return file;
};

const validateCommitPush = (stage, files, message) => {
  console.log(`\nRunning Expo web export validation for Stage ${stage}...`);
  fs.rmSync(CHECK, { recursive: true, force: true });
  expo();
  fs.rmSync(CHECK, { recursive: true, force: true });
  run('git', ['add', ...files]);
  run('git', ['commit', '-m', message]);
  run('git', ['push']);
  console.log(`SUCCESS: Stage ${stage} validated, committed, and pushed.`);
};

const stageSpecs = [
  { stage:32, name:'formatDiscoverBusinessHours', out:'src/models/discover/formatBusinessHours.js', message:'Stage 32: Extract Discover business hours formatter' },
  { stage:33, name:'createDiscoverBusinessEditForm', out:'src/models/discover/businessEditForm.js', message:'Stage 33: Extract Discover business edit form helper' },
  { stage:34, name:'createDiscoverEventForm', out:'src/models/discover/eventForm.js', message:'Stage 34: Extract Discover event form helper' },
  { stage:35, name:'createDiscoverPetForm', out:'src/models/discover/petForm.js', message:'Stage 35: Extract Discover pet form helper' },
  { stage:36, name:'createDiscoverShelterEditForm', out:'src/models/discover/shelterEditForm.js', message:'Stage 36: Extract Discover shelter edit form helper' },
  { stage:37, name:'createDiscoverPartnerApplicationForm', out:'src/models/discover/partnerApplicationForm.js', message:'Stage 37: Extract Discover partner application helper' },
  { stage:38, name:'createDiscoverPromotionForm', out:'src/models/discover/promotionForm.js', message:'Stage 38: Extract Discover promotion form helper' },
  { stage:39, name:'createDefaultDiscoverBusinessRegistration', out:'src/models/discover/defaultBusinessRegistration.js', message:'Stage 39: Extract Discover default business registration helper' },
  { stage:40, name:'createDefaultDiscoverShelterRegistration', out:'src/models/discover/defaultShelterRegistration.js', message:'Stage 40: Extract Discover default shelter registration helper' },
  { stage:41, name:'formatDiscoverDateTime', out:'src/models/discover/formatDateTime.js', message:'Stage 41: Extract Discover date time formatter' },
  { stage:42, name:'formatDiscoverDate', out:'src/models/discover/formatDate.js', message:'Stage 42: Extract Discover date formatter' },
  { stage:43, name:'formatDiscoverListingDate', out:'src/models/discover/formatListingDate.js', message:'Stage 43: Extract Discover listing date formatter' },
  { stage:44, name:'formatDiscoverPromotionStatus', out:'src/models/discover/formatPromotionStatus.js', message:'Stage 44: Extract Discover promotion status formatter' },
  { stage:45, name:'formatDiscoverEventStatus', out:'src/models/discover/formatEventStatus.js', message:'Stage 45: Extract Discover event status formatter' },
  { stage:46, name:'formatDiscoverListingStatus', out:'src/models/discover/formatListingStatus.js', message:'Stage 46: Extract Discover listing status formatter' },
  { stage:47, name:'formatDiscoverPetStatus', out:'src/models/discover/formatPetStatus.js', message:'Stage 47: Extract Discover pet status formatter' },
  { stage:48, name:'openExternalDiscoverLink', out:'src/services/discover/openExternalLink.js', message:'Stage 48: Extract Discover external link helper' },
  { stage:49, name:'playSosSound', out:'src/services/audio/playSosSound.js', message:'Stage 49: Extract SOS sound helper' },
];

if (run('git', ['branch','--show-current'], true) !== BRANCH) throw new Error(`STOP: expected branch ${BRANCH}.`);
if (run('git', ['status','--porcelain'], true)) throw new Error('STOP: working tree is not clean.');
if (!fs.existsSync(APP)) throw new Error('STOP: PetSyncApp.js not found.');

for (const spec of stageSpecs) {
  const original = fs.readFileSync(APP, 'utf8');
  const decl = topLevelDeclaration(original, spec.name);
  const fullOut = path.join(ROOT, spec.out);

  if (!decl) {
    console.log(`SKIP Stage ${spec.stage}: ${spec.name} is not present.`);
    continue;
  }
  if (fs.existsSync(fullOut)) {
    console.log(`SKIP Stage ${spec.stage}: ${spec.out} already exists.`);
    continue;
  }

  const deps = freeIdentifiers(decl.text).filter(name => name !== spec.name);
  const factory = `create${spec.name[0].toUpperCase()}${spec.name.slice(1)}`;
  const depSignature = deps.length ? `{ ${deps.join(', ')} } = {}` : '{} = {}';
  const depObject = deps.length ? `{ ${deps.join(', ')} }` : '{}';
  const moduleText = `export const ${factory} = (${depSignature}) => {\n${decl.text}\n  return ${spec.name};\n};\n`;
  const wrapper = `const ${spec.name} = (...args) =>\n  ${factory}(${depObject})(...args);\n\n`;
  const importLine = `import { ${factory} } from './${spec.out.replace(/\\\\/g,'/').replace(/^src\//,'src/').replace(/\.js$/,'')}';\n`;

  console.log(`Stage ${spec.stage}: ${spec.name}`);
  console.log(`  dependencies: ${deps.length ? deps.join(', ') : '(none)'}`);

  const hiddenBackup = backup(spec.stage, original);
  try {
    fs.mkdirSync(path.dirname(fullOut), { recursive: true });
    fs.writeFileSync(fullOut, moduleText, 'utf8');

    let next = original.slice(0, decl.start) + wrapper + original.slice(decl.end);
    next = addImport(next, importLine);

    fs.writeFileSync(APP, next, 'utf8');
    parseSource(next);
    validateCommitPush(spec.stage, [APP, spec.out], spec.message);
    console.log(`Hidden backup kept at: ${hiddenBackup}`);
  } catch (error) {
    console.error(`STAGE ${spec.stage} FAILED: ${error.message}`);
    console.log(`Restoring PetSyncApp.js and removing ${spec.out}...`);
    fs.writeFileSync(APP, original, 'utf8');
    fs.rmSync(fullOut, { force: true });
    fs.rmSync(CHECK, { recursive: true, force: true });
    console.log('Original source restored. Earlier successful stages remain committed.');
    console.log(`Hidden backup kept at: ${hiddenBackup}`);
    process.exitCode = 1;
    break;
  }
}

console.log('\n============================================================');
console.log('STAGES 32-49 COMPLETE, SKIPPED, OR STOPPED SAFELY');
console.log('Each successful stage was independently validated and pushed.');
console.log('============================================================');
