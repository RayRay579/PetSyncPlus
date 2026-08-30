const DAY_MS = 24 * 60 * 60 * 1000;

const asArray = (value) => (Array.isArray(value) ? value : []);
const text = (value) => String(value || '').trim();
const lower = (value) => text(value).toLowerCase();

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const recordDate = (row) =>
  toDate(
    row?.recorded_at ||
      row?.record_date ||
      row?.event_time ||
      row?.date ||
      row?.created_at ||
      row?.updated_at
  );

const recordType = (row) =>
  lower(row?.type || row?.record_type || row?.category || row?.kind || row?.event_type || row?.title);

const isType = (row, words) => {
  const value = recordType(row);
  return words.some((word) => value.includes(word));
};

const daysBetween = (from, to) => Math.floor((to.getTime() - from.getTime()) / DAY_MS);

const sameLocalDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const sortByDateDesc = (rows) =>
  [...rows].sort((a, b) => (recordDate(b)?.getTime() || 0) - (recordDate(a)?.getTime() || 0));

const petNameOf = (pet) => text(pet?.name) || 'your pet';

const speciesOf = (pet) => lower(pet?.species || pet?.animal_type || pet?.type);

const pushObservation = (list, observation) => {
  if (!observation?.message) return;
  const duplicate = list.some((item) => item.key === observation.key || item.message === observation.message);
  if (!duplicate) list.push(observation);
};

export function buildObservations({
  pet = null,
  healthRecords = [],
  careReminders = [],
  memories = [],
  now = new Date(),
} = {}) {
  const current = toDate(now) || new Date();
  const records = asArray(healthRecords);
  const reminders = asArray(careReminders);
  const memoryRows = asArray(memories);
  const petName = petNameOf(pet);
  const species = speciesOf(pet);
  const observations = [];

  const weightRows = sortByDateDesc(records.filter((row) => isType(row, ['weight'])));
  if (weightRows.length) {
    const lastWeightDate = recordDate(weightRows[0]);
    if (lastWeightDate && daysBetween(lastWeightDate, current) >= 30) {
      pushObservation(observations, {
        key: 'weight-stale',
        category: 'weight',
        priority: 55,
        message: `It has been ${daysBetween(lastWeightDate, current)} days since ${petName}'s last weight check. A fresh measurement may be worth logging.`,
        action: { type: 'log_weight', label: 'Log weight' },
      });
    }
  }

  const reminderCandidates = reminders
    .map((row) => {
      const due = toDate(row?.reminder_at || row?.due_at || row?.reminder_date || row?.due_date || row?.date);
      return due ? { row, due } : null;
    })
    .filter(Boolean)
    .filter(({ row, due }) => !row?.completed && !row?.completed_at && due.getTime() >= current.getTime())
    .sort((a, b) => a.due - b.due);

  if (reminderCandidates.length) {
    const next = reminderCandidates[0];
    const days = Math.ceil((next.due.getTime() - current.getTime()) / DAY_MS);
    if (days <= 3) {
      const label = text(next.row?.title || next.row?.name || next.row?.reminder_type) || 'care reminder';
      pushObservation(observations, {
        key: 'upcoming-reminder',
        category: 'preventive-care',
        priority: days <= 1 ? 80 : 65,
        message: days <= 0
          ? `${petName}'s ${label} is due today.`
          : `${petName}'s ${label} is coming up in ${days} day${days === 1 ? '' : 's'}.`,
        action: { type: 'review_reminders', label: 'Review reminder' },
      });
    }
  }

  const sortedMemories = sortByDateDesc(memoryRows);
  if (sortedMemories.length) {
    const lastMemoryDate = recordDate(sortedMemories[0]);
    if (lastMemoryDate && daysBetween(lastMemoryDate, current) >= 14) {
      pushObservation(observations, {
        key: 'memory-gap',
        category: 'memories',
        priority: 20,
        message: `It has been a little while since you added a memory for ${petName}.`,
        action: { type: 'add_memory', label: 'Add a memory' },
      });
    }
  }

  const hydrationRows = records.filter((row) => isType(row, ['water', 'hydration', 'drink']));
  if (hydrationRows.length && ['cat', 'dog'].some((value) => species.includes(value))) {
    const hydrationToday = hydrationRows.some((row) => sameLocalDay(recordDate(row), current));
    if (!hydrationToday && current.getHours() >= 15) {
      pushObservation(observations, {
        key: 'hydration-today',
        category: 'hydration',
        priority: 45,
        message: `No hydration entry has been recorded for ${petName} today. If you track water, you may want to add one.`,
        action: { type: 'log_hydration', label: 'Log hydration' },
      });
    }
  }

  const mealRows = records.filter((row) => isType(row, ['meal', 'feeding', 'food', 'breakfast', 'dinner']));
  if (mealRows.length >= 3) {
    const historicalMealHours = mealRows
      .map((row) => recordDate(row))
      .filter(Boolean)
      .map((date) => date.getHours() + date.getMinutes() / 60);
    const averageHour = historicalMealHours.reduce((sum, value) => sum + value, 0) / historicalMealHours.length;
    const mealToday = mealRows.some((row) => sameLocalDay(recordDate(row), current));
    const currentHour = current.getHours() + current.getMinutes() / 60;
    if (!mealToday && currentHour > averageHour + 1.5) {
      pushObservation(observations, {
        key: 'meal-routine-gap',
        category: 'nutrition',
        priority: 50,
        message: `${petName} usually has a meal logged around this time, but none is recorded today.`,
        action: { type: 'log_meal', label: 'Log meal' },
      });
    }
  }

  const symptomRows = sortByDateDesc(records.filter((row) => isType(row, ['symptom', 'vomit', 'diarrhea', 'scratch', 'cough', 'letharg'])));
  if (symptomRows.length) {
    const latest = symptomRows[0];
    const latestDate = recordDate(latest);
    if (latestDate && daysBetween(latestDate, current) <= 3) {
      const label = text(latest?.title || latest?.symptom_name || latest?.name || latest?.type) || 'recent symptom note';
      pushObservation(observations, {
        key: 'recent-symptom',
        category: 'health',
        priority: 75,
        message: `You recently logged ${label} for ${petName}. Keep an eye on the pattern, and consider discussing it with your veterinarian if it continues or worsens.`,
        action: { type: 'review_health', label: 'Review health record' },
      });
    }
  }

  observations.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const primary = observations[0] || null;

  return {
    observations,
    primaryObservation: primary?.message || '',
    nextBestAction: primary?.action || null,
  };
}

export default buildObservations;
