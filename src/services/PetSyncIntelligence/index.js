import { buildObservations } from '../PetSyncObservation';
import { buildHealthIntelligence } from '../PetSyncHealthIntelligence';

export function buildPetSyncIntelligence({
  pet = null,
  healthRecords = [],
  careReminders = [],
  memories = [],
  now = new Date(),
} = {}) {
  const observationResult = buildObservations({
    pet,
    healthRecords,
    careReminders,
    memories,
    now,
  });

  const healthIntelligence = buildHealthIntelligence({
    pet,
    healthRecords,
    careReminders,
    observations: observationResult,
    now,
  });

  return {
    observations: observationResult.observations,
    primaryObservation: observationResult.primaryObservation,
    dailyRecommendation: healthIntelligence.dailyRecommendation,
    educationalNote: healthIntelligence.educationalNote,
    healthInsight: healthIntelligence.healthInsight,
    nextBestAction: healthIntelligence.nextBestAction || observationResult.nextBestAction,
    trendSummary: healthIntelligence.trendSummary,
    routineSummary: healthIntelligence.routineSummary,
    riskAwareness: healthIntelligence.riskAwareness,
    speciesGuidance: healthIntelligence.speciesGuidance,
  };
}

export default buildPetSyncIntelligence;
