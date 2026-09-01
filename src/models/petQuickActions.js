export const createBuildQuickActionsForSpecies = ({} = {}) => {
const buildQuickActionsForSpecies = (pet, handleQuickAction, navigation, onAIVetPress = null) => {
  const openAIVet = typeof onAIVetPress === 'function'
    ? onAIVetPress
    : () => navigation.navigate('AIVet', { selectedPetId: pet?.id || '' });
  const baseVetAction = { icon: 'stethoscope', label: 'AI Vet', action: openAIVet };
  const species = pet.species?.toLowerCase();

  switch (species) {
    case 'dog':
      return [
        { icon: 'silverware-fork-knife', label: 'Log Meal', action: () => handleQuickAction('meal', 'Meal logged', pet, 'silverware-fork-knife') },
        { icon: 'walk', label: 'Log Walk', action: () => handleQuickAction('walk', 'Walk logged', pet, 'walk') },
        { icon: 'scale-bathroom', label: 'Log Weight', action: () => handleQuickAction('weight', 'Weight updated', pet, 'scale-bathroom') },
        { icon: 'pill', label: 'Medication', action: () => handleQuickAction('medication', 'Medication given', pet, 'pill') },
        { icon: 'paw', label: 'Play Time', action: () => handleQuickAction('custom', 'Play time logged', pet, 'paw') },
        { icon: 'content-cut', label: 'Grooming', action: () => handleQuickAction('grooming', 'Grooming logged', pet, 'content-cut') },
        baseVetAction,
      ];
    case 'cat':
      return [
        { icon: 'silverware-fork-knife', label: 'Log Meal', action: () => handleQuickAction('meal', 'Meal logged', pet, 'silverware-fork-knife') },
        { icon: 'paw', label: 'Play Time', action: () => handleQuickAction('custom', 'Play time logged', pet, 'paw') },
        { icon: 'content-cut', label: 'Grooming', action: () => handleQuickAction('grooming', 'Grooming logged', pet, 'content-cut') },
        { icon: 'scale-bathroom', label: 'Log Weight', action: () => handleQuickAction('weight', 'Weight updated', pet, 'scale-bathroom') },
        { icon: 'pill', label: 'Medication', action: () => handleQuickAction('medication', 'Medication given', pet, 'pill') },
        { icon: 'broom', label: 'Litter Cleaned', action: () => handleQuickAction('custom', 'Litter cleaned', pet, 'broom') },
        baseVetAction,
      ];
    case 'fish':
      return [
        { icon: 'fish', label: 'Feed Fish', action: () => handleQuickAction('meal', 'Fish fed', pet, 'fish') },
        { icon: 'water', label: 'Water Change', action: () => handleQuickAction('custom', 'Water changed', pet, 'water') },
        { icon: 'thermometer', label: 'Tank Temp', action: () => handleQuickAction('custom', 'Tank temperature checked', pet, 'thermometer') },
        { icon: 'flask-outline', label: 'Check pH', action: () => handleQuickAction('custom', 'Water pH checked', pet, 'flask-outline') },
        { icon: 'air-filter', label: 'Filter Cleaned', action: () => handleQuickAction('custom', 'Filter cleaned', pet, 'air-filter') },
        baseVetAction,
      ];
    case 'bird':
      return [
        { icon: 'twitter', label: 'Feed Bird', action: () => handleQuickAction('meal', 'Bird fed', pet, 'twitter') },
        { icon: 'broom', label: 'Cage Cleaned', action: () => handleQuickAction('custom', 'Cage cleaned', pet, 'broom') },
        { icon: 'account-group-outline', label: 'Social Time', action: () => handleQuickAction('custom', 'Social time logged', pet, 'account-group-outline') },
        { icon: 'scale-bathroom', label: 'Log Weight', action: () => handleQuickAction('weight', 'Weight updated', pet, 'scale-bathroom') },
        baseVetAction,
      ];
    case 'reptile':
      return [
        { icon: 'snake', label: 'Feed Reptile', action: () => handleQuickAction('meal', 'Reptile fed', pet, 'snake') },
        { icon: 'thermometer', label: 'Heat Check', action: () => handleQuickAction('custom', 'Heat checked', pet, 'thermometer') },
        { icon: 'water', label: 'Humidity Check', action: () => handleQuickAction('custom', 'Humidity checked', pet, 'water') },
        { icon: 'broom', label: 'Habitat Cleaned', action: () => handleQuickAction('custom', 'Habitat cleaned', pet, 'broom') },
        baseVetAction,
      ];
    case 'rabbit':
      return [
        { icon: 'paw', label: 'Feed Rabbit', action: () => handleQuickAction('meal', 'Rabbit fed', pet, 'paw') },
        { icon: 'broom', label: 'Hutch Cleaned', action: () => handleQuickAction('custom', 'Hutch cleaned', pet, 'broom') },
        { icon: 'paw', label: 'Play Time', action: () => handleQuickAction('custom', 'Play time logged', pet, 'paw') },
        baseVetAction,
      ];
    case 'hamster':
      return [
        { icon: 'paw', label: 'Feed Hamster', action: () => handleQuickAction('meal', 'Hamster fed', pet, 'paw') },
        { icon: 'broom', label: 'Cage Tidy', action: () => handleQuickAction('custom', 'Cage tidied', pet, 'broom') },
        { icon: 'rotate-right', label: 'Wheel Time', action: () => handleQuickAction('custom', 'Wheel time logged', pet, 'rotate-right') },
        baseVetAction,
      ];
    case 'horse':
      return [
        { icon: 'horse', label: 'Feed Horse', action: () => handleQuickAction('meal', 'Horse fed', pet, 'horse') },
        { icon: 'content-cut', label: 'Grooming', action: () => handleQuickAction('grooming', 'Grooming logged', pet, 'content-cut') },
        { icon: 'walk', label: 'Trail Ride', action: () => handleQuickAction('walk', 'Trail ride logged', pet, 'walk') },
        baseVetAction,
      ];
    default:
      return [
        { icon: 'silverware-fork-knife', label: 'Log Meal', action: () => handleQuickAction('meal', 'Meal logged', pet, 'silverware-fork-knife') },
        { icon: 'heart-pulse', label: 'Care Check', action: () => handleQuickAction('custom', 'Care check logged', pet, 'heart-pulse') },
        { icon: 'scale-bathroom', label: 'Log Weight', action: () => handleQuickAction('weight', 'Weight updated', pet, 'scale-bathroom') },
        baseVetAction,
      ];
  }
};
  return buildQuickActionsForSpecies;
};
