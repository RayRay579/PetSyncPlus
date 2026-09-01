export const createCreateDiscoverPetForm = ({} = {}) => {
const createDiscoverPetForm = (pet = {}) => ({
  shelter_id: String(pet.shelter_id || ''),
  name: String(pet.name || ''),
  species: String(pet.species || ''),
  breed: String(pet.breed || ''),
  age_label: String(pet.age_label || ''),
  sex: String(pet.sex || ''),
  size: String(pet.size || ''),
  weight: String(pet.weight || ''),
  description: String(pet.description || ''),
  personality: String(pet.personality || ''),
  good_with_kids: pet.good_with_kids ?? null,
  good_with_dogs: pet.good_with_dogs ?? null,
  good_with_cats: pet.good_with_cats ?? null,
  house_trained: pet.house_trained ?? null,
  medical_status: String(pet.medical_status || ''),
  adoption_fee: pet.adoption_fee != null ? String(pet.adoption_fee) : '',
  status: String(pet.status || 'available'),
});
  return createDiscoverPetForm;
};
