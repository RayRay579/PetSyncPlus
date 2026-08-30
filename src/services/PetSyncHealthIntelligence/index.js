const DAY_MS = 24 * 60 * 60 * 1000;

const asArray = (value) => (Array.isArray(value) ? value : []);
const text = (value) => String(value || '').trim();
const lower = (value) => text(value).toLowerCase();

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const rowDate = (row) =>
  toDate(row?.recorded_at || row?.record_date || row?.event_time || row?.date || row?.created_at || row?.updated_at);

const rowType = (row) => lower(row?.type || row?.record_type || row?.category || row?.kind || row?.title);
const hasType = (row, words) => words.some((word) => rowType(row).includes(word));
const petNameOf = (pet) => text(pet?.name) || 'your pet';

const numberFrom = (row) => {
  const candidates = [row?.weight, row?.weight_value, row?.value, row?.measurement, row?.details?.weight];
  for (const candidate of candidates) {
    const match = String(candidate ?? '').match(/-?\d+(?:\.\d+)?/);
    if (match) {
      const value = Number(match[0]);
      if (Number.isFinite(value)) return value;
    }
  }
  return null;
};

const daysBetween = (a, b) => Math.floor((b.getTime() - a.getTime()) / DAY_MS);

const speciesGuidance = (pet) => {
  const species = lower(pet?.species || pet?.animal_type || pet?.type);
  if (species.includes('cat')) return 'For cats, consistent hydration, weight, grooming, litter habits, activity, and preventive care records can make changes easier to notice.';
  if (species.includes('dog')) return 'For dogs, consistent meals, activity, weight, grooming, medication, and preventive care records can make changes easier to notice.';
  if (species.includes('bird')) return 'For birds, regular weight, feeding, enrichment, cage-care, and behavior notes can be especially useful for spotting meaningful changes.';
  if (species.includes('rabbit') || species.includes('guinea') || species.includes('hamster')) return 'For small animals, regular diet, weight, activity, habitat-care, nail, and dental notes can make routines easier to track.';
  if (species.includes('fish')) return 'For fish, feeding, water changes, temperature, filter care, and water-quality records can help establish a reliable tank-care routine.';
  if (species.includes('reptile') || species.includes('lizard') || species.includes('snake') || species.includes('turtle')) return 'For reptiles, feeding, temperature, humidity, UVB, enclosure care, and shedding notes can help establish a reliable routine.';
  return '';
};

const educationFromRecentRecords = (records, now, petName) => {
  const recent = records
    .map((row) => ({ row, date: rowDate(row) }))
    .filter(({ date }) => date && daysBetween(date, now) <= 14)
    .sort((a, b) => b.date - a.date);

  const symptom = recent.find(({ row }) => hasType(row, ['vomit', 'symptom', 'diarrhea', 'cough', 'scratch', 'letharg']));
  if (symptom) {
    return `Recent symptom notes for ${petName} are useful for tracking patterns. If a symptom becomes frequent, severe, or is joined by other concerning changes, contact your veterinarian.`;
  }

  const vaccine = recent.find(({ row }) => hasType(row, ['vaccine', 'vaccination', 'booster']));
  if (vaccine) {
    return 'Vaccination schedules vary by species, age, health history, and local risk. Your veterinarian can confirm the schedule that is right for your pet.';
  }

  const weight = recent.find(({ row }) => hasType(row, ['weight']));
  if (weight) {
    return 'Gradual weight changes are easier to notice when measurements are recorded consistently under similar conditions.';
  }

  return '';
};

export function buildHealthIntelligence({
  pet = null,
  healthRecords = [],
  careReminders = [],
  observations = null,
  now = new Date(),
} = {}) {
  const current = toDate(now) || new Date();
  const records = asArray(healthRecords);
  const reminders = asArray(careReminders);
  const petName = petNameOf(pet);

  const weights = records
    .filter((row) => hasType(row, ['weight']))
    .map((row) => ({ row, date: rowDate(row), value: numberFrom(row) }))
    .filter((item) => item.date && item.value !== null)
    .sort((a, b) => a.date - b.date);

  let trendSummary = '';
  let healthInsight = '';
  if (weights.length >= 2) {
    const first = weights[Math.max(0, weights.length - 4)];
    const latest = weights[weights.length - 1];
    const delta = latest.value - first.value;
    const abs = Math.abs(delta);
    const direction = abs < 0.1 ? 'stable' : delta > 0 ? 'up' : 'down';
    trendSummary = direction === 'stable'
      ? `${petName}'s recent recorded weight has been stable.`
      : `${petName}'s recent recorded weight is ${direction} by about ${abs.toFixed(abs >= 10 ? 0 : 1)} from the earlier entry in this trend.`;
    healthInsight = `${trendSummary} Consistent measurements make gradual changes easier to spot.`;
  }

  const datedRecords = records
    .map((row) => rowDate(row))
    .filter(Boolean)
    .sort((a, b) => b - a);

  const routineSummary = datedRecords.length
    ? `You have ${datedRecords.length} dated care record${datedRecords.length === 1 ? '' : 's'} available for ${petName}, with the latest recorded ${daysBetween(datedRecords[0], current)} day${daysBetween(datedRecords[0], current) === 1 ? '' : 's'} ago.`
    : '';

  const upcoming = reminders
    .map((row) => ({ row, due: toDate(row?.reminder_at || row?.due_at || row?.reminder_date || row?.due_date || row?.date) }))
    .filter(({ row, due }) => due && !row?.completed && !row?.completed_at && due.getTime() >= current.getTime())
    .sort((a, b) => a.due - b.due)[0];

  let dailyRecommendation = '';
  if (upcoming) {
    const days = Math.ceil((upcoming.due.getTime() - current.getTime()) / DAY_MS);
    if (days <= 7) {
      const label = text(upcoming.row?.title || upcoming.row?.name || upcoming.row?.reminder_type) || 'care reminder';
      dailyRecommendation = days <= 0
        ? `Review ${petName}'s ${label} today.`
        : `Take a quick look at ${petName}'s ${label}, due in ${days} day${days === 1 ? '' : 's'}.`;
    }
  }

  if (!dailyRecommendation && observations?.nextBestAction?.label) {
    dailyRecommendation = observations.nextBestAction.label;
  }

  const educationalNote = educationFromRecentRecords(records, current, petName);
  const guidance = speciesGuidance(pet);

  const recentSymptoms = records.filter((row) => {
    if (!hasType(row, ['symptom', 'vomit', 'diarrhea', 'cough', 'scratch', 'letharg'])) return false;
    const date = rowDate(row);
    return date && daysBetween(date, current) <= 7;
  });

  const riskAwareness = recentSymptoms.length >= 2
    ? `There are multiple recent symptom-related entries for ${petName}. That does not establish a diagnosis, but the pattern may be worth monitoring and discussing with your veterinarian if it continues or worsens.`
    : '';

  const nextBestAction = observations?.nextBestAction || (dailyRecommendation ? { type: 'review_care', label: dailyRecommendation } : null);

  return {
    healthInsight,
    trendSummary,
    routineSummary,
    riskAwareness,
    speciesGuidance: guidance,
    educationalNote,
    dailyRecommendation,
    nextBestAction,
  };
}

export default buildHealthIntelligence;
