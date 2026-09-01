export const createBuildStarterReminders = ({ addDaysLocal, toLocalDateKey } = {}) => {
const buildStarterReminders = (pet) => {
  const now = new Date();
  const makeReminder = (title, icon, dayOffset, time) => ({
    id: `${pet.id}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${dayOffset}`,
    petId: pet.id,
    title,
    icon,
    date: toLocalDateKey(addDaysLocal(now, dayOffset)),
    time,
    completed: false,
    source: 'starter',
  });

  const species = pet.species?.toLowerCase();

  switch (species) {
    case 'dog':
      return [
        makeReminder('Morning Feeding', 'silverware-fork-knife', 0, '7:00 AM'),
        makeReminder('Evening Feeding', 'silverware-fork-knife', 0, '6:00 PM'),
        makeReminder('Daily Walk', 'walk', 1, '8:00 AM'),
        makeReminder('Grooming Reminder', 'content-cut', 2, '4:00 PM'),
      ];
    case 'cat':
      return [
        makeReminder('Feeding', 'silverware-fork-knife', 0, '8:00 AM'),
        makeReminder('Litter Cleaning', 'broom', 0, '5:00 PM'),
        makeReminder('Play Session', 'paw', 1, '6:00 PM'),
      ];
    case 'fish':
      return [
        makeReminder('Feed Fish', 'fish', 0, '9:00 AM'),
        makeReminder('Water Change', 'water', 1, '4:00 PM'),
        makeReminder('Tank Check', 'fish', 2, '10:00 AM'),
      ];
    case 'bird':
      return [
        makeReminder('Feed Bird', 'bird', 0, '8:00 AM'),
        makeReminder('Cage Cleaning', 'broom', 1, '5:00 PM'),
        makeReminder('Enrichment Time', 'dots-horizontal', 2, '3:00 PM'),
      ];
    case 'reptile':
      return [
        makeReminder('Heat Lamp Check', 'lightbulb-on-outline', 0, '8:00 AM'),
        makeReminder('Feeding', 'silverware-fork-knife', 0, '6:00 PM'),
        makeReminder('Habitat Cleaning', 'broom', 1, '4:00 PM'),
      ];
    case 'rabbit':
      return [
        makeReminder('Morning Feeding', 'silverware-fork-knife', 0, '8:00 AM'),
        makeReminder('Hutch Cleaning', 'broom', 1, '5:00 PM'),
        makeReminder('Play Time', 'paw', 2, '4:00 PM'),
      ];
    case 'hamster':
      return [
        makeReminder('Feed Hamster', 'silverware-fork-knife', 0, '8:00 AM'),
        makeReminder('Cage Tidy', 'broom', 1, '5:00 PM'),
        makeReminder('Wheel Time', 'rotate-right', 2, '4:00 PM'),
      ];
    case 'horse':
      return [
        makeReminder('Morning Feed', 'silverware-fork-knife', 0, '7:00 AM'),
        makeReminder('Grooming', 'content-cut', 1, '4:00 PM'),
        makeReminder('Trail Ride', 'horse-human', 2, '3:00 PM'),
      ];
    default:
      return [
        makeReminder('Daily Care Check', 'check-circle-outline', 0, '9:00 AM'),
        makeReminder('Feed Time', 'silverware-fork-knife', 1, '9:00 AM'),
        makeReminder('Habitat Cleaning', 'broom', 2, '4:00 PM'),
      ];
  }
};
  return buildStarterReminders;
};
