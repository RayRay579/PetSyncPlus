export const createOpenExternalDiscoverLink = ({ Linking } = {}) => {
const openExternalDiscoverLink = (url) => {
  const normalized = String(url || '').trim();
  if (!normalized) return;
  const nextUrl = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
  Linking.openURL(nextUrl);
};
  return openExternalDiscoverLink;
};
