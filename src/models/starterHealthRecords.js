export const createBuildStarterHealthRecords = ({ addDaysLocal, formatMonthYear } = {}) => {
const buildStarterHealthRecords = (pet) => {
  const todayLabel = new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const nextYearLabel = formatMonthYear(addDaysLocal(new Date(), 365));
  const parsedWeightMatch = String(pet.weight || '').match(/[\d.]+/);
  const parsedWeightValue = parsedWeightMatch ? Number(parsedWeightMatch[0]) : null;
  const species = pet.species?.toLowerCase();
  const baseRecords = [
    {
      id: `${pet.id}-weight-baseline`,
      petId: pet.id,
      type: 'weight',
      title: 'Weight Baseline',
      date: todayLabel,
      provider: null,
      status: 'current',
      icon: 'scale-bathroom',
      nextDue: null,
      value: parsedWeightValue,
      unit: 'lbs',
      details: {
        weightValue: pet.weight || '',
        weightNotes: 'Recorded during onboarding',
      },
    },
  ];

  if (species === 'fish') {
    baseRecords.push({
      id: `${pet.id}-tank-setup`,
      petId: pet.id,
      type: 'appointment',
      title: 'Tank Setup Record',
      date: todayLabel,
      provider: 'Onboarding',
      status: 'current',
      icon: 'calendar-check-outline',
      nextDue: null,
      details: {
        vetClinic: 'Onboarding',
        appointmentDate: todayLabel,
      },
    });
  } else {
    baseRecords.push({
      id: `${pet.id}-wellness-check`,
      petId: pet.id,
      type: 'appointment',
      title: 'Wellness Check',
      date: todayLabel,
      provider: 'To be scheduled',
      status: 'upcoming',
      icon: 'calendar-check-outline',
      nextDue: nextYearLabel,
      details: {
        vetClinic: 'To be scheduled',
        appointmentDate: todayLabel,
      },
    });
  }

  return baseRecords;
};
  return buildStarterHealthRecords;
};
