export const createFormatDiscoverPetStatus = ({} = {}) => {
const formatDiscoverPetStatus = (value) => {
  const status = String(value || 'available').trim().toLowerCase();
  if (status === 'pending') return 'Pending';
  if (status === 'adopted') return 'Adopted';
  if (status === 'hidden') return 'Hidden';
  return 'Available';
};
  return formatDiscoverPetStatus;
};
