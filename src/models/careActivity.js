const CARE_ACTIVITY_TYPES = new Set([
  'meal',
  'walk',
  'medication',
  'weight',
  'grooming',
  'vet_visit',
  'reminder_completed',
  'custom',
]);

const normalizeCareActivityType = (type) => {
  const normalized = String(type || '').toLowerCase().trim();
  if (normalized === 'feed' || normalized === 'feeding') return 'meal';
  if (normalized === 'vet' || normalized === 'appointment' || normalized === 'checkup' || normalized === 'wellness_check') return 'vet_visit';
  if (normalized === 'reminder complete' || normalized === 'reminder completed' || normalized === 'reminder_completed' || normalized === 'completed_reminder' || normalized === 'complete reminder') return 'reminder_completed';
  return normalized;
};

export { CARE_ACTIVITY_TYPES, normalizeCareActivityType };
