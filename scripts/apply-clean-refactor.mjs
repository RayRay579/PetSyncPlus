import fs from 'node:fs';

const appPath = 'PetSyncApp.js';
let source = fs.readFileSync(appPath, 'utf8');
let changed = false;

const ensureDir = (path) => fs.mkdirSync(path, { recursive: true });

const contextsImport = `import {\n  ActivityLogsContext,\n  AddPetContext,\n  AuthContext,\n  CareRemindersContext,\n  FeatureGateContext,\n  HealthRecordsContext,\n  LostPetAlertsContext,\n  PetsContext,\n  PetScoresContext,\n  RevenueCatContext,\n  VetFinderContext,\n} from './src/contexts';\n`;

if (!source.includes("from './src/contexts'")) {
  const reactImportOld = "import React, { useState, useRef, useEffect, createContext, useContext, useMemo, useCallback } from 'react';";
  const reactImportNew = "import React, { useState, useRef, useEffect, useContext, useMemo, useCallback } from 'react';";

  if (!source.includes(reactImportOld)) {
    throw new Error('Expected React import with createContext was not found.');
  }

  source = source.replace(reactImportOld, `${reactImportNew}\n${contextsImport.trimEnd()}`);

  const startMarker = 'const PetsContext = createContext(';
  const finalMarker = 'const FeatureGateContext = createContext(';
  const start = source.indexOf(startMarker);
  const finalStart = source.indexOf(finalMarker);

  if (start < 0 || finalStart < start) {
    throw new Error('Expected PetSync context block was not found.');
  }

  const finalEnd = source.indexOf('\n});', finalStart);
  if (finalEnd < 0) {
    throw new Error('Could not find the end of FeatureGateContext.');
  }

  const removalEnd = finalEnd + '\n});'.length;
  source = `${source.slice(0, start)}${source.slice(removalEnd)}`;
  changed = true;
}

if (!source.includes("from './src/theme/colors'")) {
  const startMarker = 'const C = {';
  const endMarker = '\n\nconst PETSYNC_BACKGROUND_IMAGE';
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);

  if (start < 0 || end < start) {
    throw new Error('Expected PetSync theme color block was not found.');
  }

  const block = source.slice(start, end).trim();
  const moduleSource = `${block.replace(/^const C =/, 'export const C =')}\n`;
  ensureDir('src/theme');
  fs.writeFileSync('src/theme/colors.js', moduleSource, 'utf8');

  const importAnchor = "} from './src/contexts';\n";
  if (!source.includes(importAnchor)) {
    throw new Error('Context import anchor missing while wiring theme module.');
  }

  source = source.replace(importAnchor, `${importAnchor}import { C } from './src/theme/colors';\n`);
  source = `${source.slice(0, start)}${source.slice(end)}`;
  changed = true;
}

if (!source.includes("from './src/config/access'")) {
  const startMarker = "const PLAN_FREE = 'free';";
  const endMarker = 'const upsertAuthProfileToSupabase';
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);

  if (start < 0 || end < start) {
    throw new Error('Expected PetSync monetization/access block was not found.');
  }

  const block = source.slice(start, end).trim();
  const exportsBlock = `\n\nexport {\n  FEATURE_GATES,\n  MONETIZATION_LIMITS,\n  PLAN_FREE,\n  PLAN_PREMIUM,\n  canUseFeature,\n  getUserPlan,\n  isPetSyncAdminProfile,\n  isPremiumUser,\n  normalizePlanValue,\n};\n`;
  ensureDir('src/config');
  fs.writeFileSync('src/config/access.js', `${block}${exportsBlock}`, 'utf8');

  const importAnchor = "import { C } from './src/theme/colors';\n";
  if (!source.includes(importAnchor)) {
    throw new Error('Theme import anchor missing while wiring access module.');
  }

  const accessImport = `import {\n  FEATURE_GATES,\n  MONETIZATION_LIMITS,\n  PLAN_FREE,\n  PLAN_PREMIUM,\n  canUseFeature,\n  getUserPlan,\n  isPetSyncAdminProfile,\n  isPremiumUser,\n  normalizePlanValue,\n} from './src/config/access';\n`;
  source = source.replace(importAnchor, `${importAnchor}${accessImport}`);
  source = `${source.slice(0, start)}${source.slice(end)}`;
  changed = true;
}

if (changed) {
  fs.writeFileSync(appPath, source, 'utf8');
  console.log('PetSync clean refactor: shared contexts, theme, and access configuration extracted and wired.');
} else {
  console.log('PetSync clean refactor: no changes required.');
}
