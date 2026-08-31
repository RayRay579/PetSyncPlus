import { PET_SPECIES_EMOJIS } from '../config/petSpecies';

const PET_SOUNDS = {
  dog: require('../../assets/sounds/dog.mp3'),
  cat: require('../../assets/sounds/cat.mp3'),
  fish: require('../../assets/sounds/fish.mp3'),
  bird: require('../../assets/sounds/bird.mp3'),
  reptile: require('../../assets/sounds/reptile.mp3'),
};

const getDefaultPetEmoji = (species) => PET_SPECIES_EMOJIS[species] || '??';

const getStarterPetScore = (species) => {
  const scoreMap = {
    dog: 87,
    cat: 92,
    fish: 89,
    bird: 84,
    reptile: 82,
    rabbit: 85,
    hamster: 83,
    horse: 86,
    other: 80,
  };

  return scoreMap[species] ?? 80;
};

const getPetSoundAsset = (species) => PET_SOUNDS[species] || PET_SOUNDS.dog;


const getPetOwnerIdentity = (pet) => String(
  pet?.user_id
  || pet?.userId
  || pet?.owner_id
  || pet?.ownerId
  || pet?.created_by_user_id
  || pet?.createdByUserId
  || '',
).trim();

export {
  PET_SOUNDS,
  getDefaultPetEmoji,
  getStarterPetScore,
  getPetSoundAsset,
  getPetOwnerIdentity,
};
