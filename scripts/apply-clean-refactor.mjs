import fs from 'node:fs';

const appPath = 'PetSyncApp.js';
let source = fs.readFileSync(appPath, 'utf8');
let changed = false;

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

if (changed) {
  fs.writeFileSync(appPath, source, 'utf8');
  console.log('PetSync clean refactor: shared contexts extracted and wired.');
} else {
  console.log('PetSync clean refactor: no changes required.');
}
