export const createFormatDiscoverEventStatus = ({} = {}) => {
const formatDiscoverEventStatus = (value) => {
  const status = String(value || 'pending').trim().toLowerCase();
  if (status === 'active') return 'Active';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'hidden') return 'Hidden';
  if (status === 'rejected') return 'Rejected';
  return 'Pending';
};
  return formatDiscoverEventStatus;
};
