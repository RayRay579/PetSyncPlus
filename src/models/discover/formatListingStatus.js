export const createFormatDiscoverListingStatus = ({} = {}) => {
const formatDiscoverListingStatus = (value) => {
  const status = String(value || 'pending').trim().toLowerCase();
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  if (status === 'suspended') return 'Suspended';
  return 'Pending Review';
};
  return formatDiscoverListingStatus;
};
