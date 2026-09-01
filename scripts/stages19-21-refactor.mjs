import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parse } from '@babel/parser';

const ROOT = process.cwd();
const APP = path.join(ROOT, 'PetSyncApp.js');
const CHECK = path.join(ROOT, '.petsync-refactor-web-check');
const BACKUPS = path.join(ROOT, '.git', 'petsync-refactor-backups');
const BRANCH = 'petsync-clean-refactor';

const run = (cmd, args, capture = false) => {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit', shell: false });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || `${cmd} failed`).trim());
  return (r.stdout || '').trim();
};
const expo = () => process.platform === 'win32'
  ? run('cmd.exe', ['/d','/s','/c','npx','expo','export','--platform','web','--output-dir','.petsync-refactor-web-check','--clear'])
  : run('npx', ['expo','export','--platform','web','--output-dir','.petsync-refactor-web-check','--clear']);
const parseApp = s => parse(s, { sourceType:'module', plugins:['jsx','flow'], errorRecovery:false });
const declarations = s => {
  const m = new Map();
  for (const n of parseApp(s).program.body) {
    if (n.type !== 'VariableDeclaration' || n.kind !== 'const') continue;
    for (const d of n.declarations) if (d.id?.type === 'Identifier') m.set(d.id.name, { start:n.start, end:n.end });
  }
  return m;
};
const addImport = (s, line) => {
  if (s.includes(line.trim())) return s;
  const p = s.indexOf('\n') + 1;
  return s.slice(0,p) + line + s.slice(p);
};
const backup = (stage, source) => {
  fs.mkdirSync(BACKUPS, { recursive:true });
  const p = path.join(BACKUPS, `PetSyncApp-stage${stage}-${Date.now()}.js`);
  fs.writeFileSync(p, source, 'utf8');
  return p;
};
const validateCommitPush = (stage, files, message) => {
  console.log('\nRunning Expo web export validation...');
  fs.rmSync(CHECK, { recursive:true, force:true });
  expo();
  fs.rmSync(CHECK, { recursive:true, force:true });
  run('git', ['add', ...files]);
  run('git', ['commit','-m',message]);
  run('git', ['push']);
  console.log(`SUCCESS: Stage ${stage} validated, committed, and pushed.`);
};

if (run('git',['branch','--show-current'],true) !== BRANCH) throw new Error(`STOP: expected branch ${BRANCH}.`);
if (run('git',['status','--porcelain'],true)) throw new Error('STOP: working tree is not clean.');
if (!fs.existsSync(APP)) throw new Error('STOP: PetSyncApp.js not found.');

const extractDirect = ({ stage, name, outPath, importLine, message, dependencyNames=[] }) => {
  const original = fs.readFileSync(APP,'utf8');
  const map = declarations(original);
  const d = map.get(name);
  if (!d) { console.log(`SKIP Stage ${stage}: ${name} not present.`); return; }
  if (fs.existsSync(path.join(ROOT,outPath))) { console.log(`SKIP Stage ${stage}: ${outPath} already exists.`); return; }
  const text = original.slice(d.start,d.end).trim();
  const deps = dependencyNames.filter(x => new RegExp(`\\b${x}\\b`).test(text));
  const wrapper = deps.length
    ? `export const create${name[0].toUpperCase()+name.slice(1)} = ({ ${deps.join(', ')} } = {}) => {\n${text}\n  return ${name};\n};\n`
    : `${text}\n\nexport { ${name} };\n`;
  const b = backup(stage, original);
  try {
    const full = path.join(ROOT,outPath); fs.mkdirSync(path.dirname(full),{recursive:true}); fs.writeFileSync(full,wrapper,'utf8');
    let next = original.slice(0,d.start) + original.slice(d.end);
    if (!deps.length) {
      next = addImport(next, importLine);
    } else {
      const factory = `create${name[0].toUpperCase()+name.slice(1)}`;
      const serviceImport = importLine;
      next = addImport(next, serviceImport);
      const replacement = `const ${name} = (...args) => ${factory}({ ${deps.join(', ')} })(...args);\n\n`;
      next = next.slice(0,d.start) + replacement + next.slice(d.start);
    }
    fs.writeFileSync(APP,next,'utf8'); parseApp(next);
    validateCommitPush(stage,[APP,outPath],message);
    console.log(`Hidden backup kept at: ${b}`);
  } catch(e) {
    fs.writeFileSync(APP,original,'utf8'); fs.rmSync(path.join(ROOT,outPath),{force:true}); fs.rmSync(CHECK,{recursive:true,force:true});
    throw e;
  }
};

extractDirect({
  stage:19,
  name:'recalculateCommunityCounts',
  outPath:'src/models/communityCounts.js',
  importLine:"import { recalculateCommunityCounts } from './src/models/communityCounts';\n",
  message:'Stage 19: Extract community count model',
  dependencyNames:[],
});

extractDirect({
  stage:20,
  name:'buildDiscoverMediaLookup',
  outPath:'src/models/discoverMedia.js',
  importLine:"import { createBuildDiscoverMediaLookup } from './src/models/discoverMedia';\n",
  message:'Stage 20: Extract discover media helper',
  dependencyNames:['isRemoteCommunityMediaUri','normalizeStorageFileName'],
});

const stage21 = () => {
  const original = fs.readFileSync(APP,'utf8');
  const map = declarations(original); const d = map.get('getWeeklyTrendSummaryForPet');
  if (!d) { console.log('SKIP Stage 21: getWeeklyTrendSummaryForPet not present.'); return; }
  const outPath = 'src/services/analytics/weeklyTrendService.js'; const full = path.join(ROOT,outPath);
  if (fs.existsSync(full)) { console.log(`SKIP Stage 21: ${outPath} already exists.`); return; }
  const text = original.slice(d.start,d.end).trim();
  const candidates = ['supabase','CURRENT_USER_OWNER_ID','normalizeCareActivityType','CARE_ACTIVITY_TYPES','toLocalDateKey','parseStoredDateKey','formatDate'];
  const deps = candidates.filter(x => new RegExp(`\\b${x}\\b`).test(text));
  const b = backup(21,original);
  try {
    fs.mkdirSync(path.dirname(full),{recursive:true});
    fs.writeFileSync(full,`export const createWeeklyTrendService = ({ ${deps.join(', ')} } = {}) => {\n${text}\n  return { getWeeklyTrendSummaryForPet };\n};\n`,'utf8');
    let next = original.slice(0,d.start) + original.slice(d.end);
    next = addImport(next,"import { createWeeklyTrendService } from './src/services/analytics/weeklyTrendService';\n");
    const wrapper = `const getWeeklyTrendService = () => createWeeklyTrendService({ ${deps.join(', ')} });\n\nconst getWeeklyTrendSummaryForPet = (...args) =>\n  getWeeklyTrendService().getWeeklyTrendSummaryForPet(...args);\n\n`;
    next = next.slice(0,d.start) + wrapper + next.slice(d.start);
    fs.writeFileSync(APP,next,'utf8'); parseApp(next);
    validateCommitPush(21,[APP,outPath],'Stage 21: Extract weekly trend service');
    console.log(`Hidden backup kept at: ${b}`);
  } catch(e) {
    fs.writeFileSync(APP,original,'utf8'); fs.rmSync(full,{force:true}); fs.rmSync(CHECK,{recursive:true,force:true});
    throw e;
  }
};
stage21();

console.log('\n============================================================');
console.log('STAGES 19-21 COMPLETE OR SAFELY SKIPPED');
console.log('============================================================');
