export const createFormatDiscoverDate = ({} = {}) => {
const formatDiscoverDate = (value, options = {}) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...options,
  });
};
  return formatDiscoverDate;
};
