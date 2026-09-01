import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';

const ROOT = process.cwd();
const APP_PATH = path.join(ROOT, 'PetSyncApp.js');
const EXPECTED_BRANCH = 'petsync-clean-refactor';

const { execFileSync } = await import('node:child_process');
const capture = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8' }).trim();

const branch = capture('git', ['branch', '--show-current']);
if (branch !== EXPECTED_BRANCH) {
  throw new Error(`STOP: expected branch ${EXPECTED_BRANCH}, found ${branch || '(detached)'}.`);
}

const status = capture('git', ['status', '--porcelain']);
if (status) {
  throw new Error(`STOP: working tree is not clean:\n${status}`);
}

if (!fs.existsSync(APP_PATH)) throw new Error('STOP: PetSyncApp.js not found.');
const source = fs.readFileSync(APP_PATH, 'utf8');
const ast = parse(source, { sourceType: 'module', plugins: ['jsx', 'flow'], errorRecovery: false });

const declarations = [];
for (const node of ast.program.body) {
  if (node.type !== 'VariableDeclaration' || node.kind !== 'const') continue;
  for (const decl of node.declarations) {
    if (decl.id?.type !== 'Identifier') continue;
    const name = decl.id.name;
    const text = source.slice(node.start, node.end);
    declarations.push({ name, start: node.start, end: node.end, text });
  }
}

const groups = [
  ['Community comments', /(Comment|Reply)/i],
  ['Recipes', /Recipe/i],
  ['Activity logs', /(Activity|Log)/i],
  ['Pet scores', /(PetScore|Score)/i],
  ['Vet finder', /(Vet|Clinic|Finder)/i],
  ['Storage/media', /(Storage|Upload|Media|File)/i],
  ['Supabase/data', /(Supabase|Save|Load|Delete|Update|Insert|Upsert)/i],
];

console.log('============================================================');
console.log('STAGE 16+ DISCOVERY');
console.log('============================================================');
for (const [label, regex] of groups) {
  const matches = declarations.filter(({ name }) => regex.test(name));
  console.log(`\n[${label}]`);
  if (!matches.length) {
    console.log('  (none)');
    continue;
  }
  for (const item of matches) console.log(`  ${item.name}`);
}

console.log('\n[Supabase/storage callers by source text]');
for (const item of declarations) {
  if (/supabase\.|supabase\.storage|\.from\(|\.rpc\(/.test(item.text)) {
    console.log(`  ${item.name}`);
  }
}
console.log('============================================================');
