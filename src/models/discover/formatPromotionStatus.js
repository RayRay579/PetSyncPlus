export const createFormatDiscoverPromotionStatus = ({} = {}) => {
const formatDiscoverPromotionStatus = (value) => {
  const status = String(value || 'pending').trim().toLowerCase();
  if (status === 'active') return 'Active';
  if (status === 'paused') return 'Paused';
  if (status === 'expired') return 'Expired';
  if (status === 'rejected') return 'Rejected';
  return 'Pending';
};
  return formatDiscoverPromotionStatus;
};
