# PetSync Intelligence

This module is the bridge between the recovered PetSync+ app and the newer V3 intelligence direction.

It uses only real application data supplied by the caller:

- pet profile
- health records
- care reminders
- memories

It does not create database tables, seed mock data, invent health scores, or diagnose medical conditions.

## Public API

```js
import { buildPetSyncIntelligence } from './src/services/PetSyncIntelligence';

const intelligence = buildPetSyncIntelligence({
  pet,
  healthRecords,
  careReminders,
  memories,
});
```

Returned fields:

- `observations`
- `primaryObservation`
- `dailyRecommendation`
- `educationalNote`
- `healthInsight`
- `nextBestAction`
- `trendSummary`
- `routineSummary`
- `riskAwareness`
- `speciesGuidance`

The wording is intentionally educational and non-diagnostic. Voice / conversation generation is not included in this build.
