import { buildObservations } from '../PetSyncObservation';
import { buildHealthIntelligence } from '../PetSyncHealthIntelligence';

const asArray = (value) => (Array.isArray(value) ? value : []);
const idText = (value) => String(value ?? '').trim();

const rowPetId = (row) =>
  idText(
    row?.petId ??
      row?.pet_id ??
      row?.pet?.id ??
      row?.pet?.petId ??
      row?.pet?.pet_id
  );

const scopeRowsToPet = (rows, pet) => {
  const petId = idText(pet?.id ?? pet?.petId ?? pet?.pet_id);
  if (!petId) return [];

  return asArray(rows).filter((row) => rowPetId(row) === petId);
};

export function buildPetSyncIntelligence({
  pet = null,
  healthRecords = [],
  careReminders = [],
  memories = [],
  now = new Date(),
} = {}) {
  const scopedHealthRecords = scopeRowsToPet(healthRecords, pet);
  const scopedCareReminders = scopeRowsToPet(careReminders, pet);
  const scopedMemories = scopeRowsToPet(memories, pet);

  const observationResult = buildObservations({
    pet,
    healthRecords: scopedHealthRecords,
    careReminders: scopedCareReminders,
    memories: scopedMemories,
    now,
  });

  const healthIntelligence = buildHealthIntelligence({
    pet,
    healthRecords: scopedHealthRecords,
    careReminders: scopedCareReminders,
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
