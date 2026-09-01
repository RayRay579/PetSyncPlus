import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';

const ROOT = process.cwd();
const APP = path.join(ROOT, 'PetSyncApp.js');
const source = fs.readFileSync(APP, 'utf8');
const ast = parse(source, { sourceType: 'module', plugins: ['jsx', 'flow'], errorRecovery: false });

const rows = [];
for (const node of ast.program.body) {
  if (node.type === 'FunctionDeclaration' && node.id?.name) {
    rows.push({
      name: node.id.name,
      kind: 'function',
      size: node.end - node.start,
      lines: source.slice(node.start, node.end).split(/\r?\n/).length,
      start: node.start,
      end: node.end,
    });
    continue;
  }
  if (node.type !== 'VariableDeclaration') continue;
  for (const decl of node.declarations) {
    if (decl.id?.type !== 'Identifier') continue;
    const initType = decl.init?.type || '';
    const isCallable = initType === 'ArrowFunctionExpression' || initType === 'FunctionExpression';
    if (!isCallable) continue;
    rows.push({
      name: decl.id.name,
      kind: 'const-fn',
      size: node.end - node.start,
      lines: source.slice(node.start, node.end).split(/\r?\n/).length,
      start: node.start,
      end: node.end,
    });
  }
}

const existingWrapperPrefixes = [
  'getPetService','getPetAccessService','getCommunityMediaStorageService','getCommunityPostService',
  'getLostPetService','getMemoryService','getFamilyService','getCommunityCommentService','getRecipeService',
  'getWeeklyTrendService'
];

const filtered = rows.filter(r => !existingWrapperPrefixes.some(p => r.name.startsWith(p)));
filtered.sort((a,b) => b.lines - a.lines || b.size - a.size);

console.log('============================================================');
console.log('STAGE 22+ LARGE TOP-LEVEL CANDIDATES');
console.log('============================================================');
for (const r of filtered.slice(0, 40)) {
  console.log(`${String(r.lines).padStart(5)} lines  ${r.name}`);
}

console.log('\n============================================================');
console.log('LIKELY UI COMPONENT CANDIDATES');
console.log('============================================================');
for (const r of filtered.filter(r => /^[A-Z]/.test(r.name)).slice(0, 30)) {
  console.log(`${String(r.lines).padStart(5)} lines  ${r.name}`);
}

console.log('\n============================================================');
console.log('LIKELY NON-UI HELPERS');
console.log('============================================================');
for (const r of filtered.filter(r => !/^[A-Z]/.test(r.name)).slice(0, 30)) {
  console.log(`${String(r.lines).padStart(5)} lines  ${r.name}`);
}
console.log('============================================================');
