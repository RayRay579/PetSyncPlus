export const createCreateDiscoverBusinessEditForm = ({} = {}) => {
const createDiscoverBusinessEditForm = (listing = {}) => ({
  name: String(listing.name || ''),
  description: String(listing.description || ''),
  phone: String(listing.phone || ''),
  email: String(listing.email || ''),
  website: String(listing.website || ''),
  facebook_url: String(listing.facebook_url || ''),
  instagram_url: String(listing.instagram_url || ''),
  tiktok_url: String(listing.tiktok_url || ''),
  youtube_url: String(listing.youtube_url || ''),
  service_mode: String(listing.service_mode || 'local_only'),
  online_service_url: String(listing.online_service_url || ''),
  address: String(listing.address || ''),
  city: String(listing.city || ''),
  state: String(listing.state || ''),
  zip: String(listing.zip || ''),
  hours_json: typeof listing.hours_json === 'string'
    ? listing.hours_json
    : listing.hours_json && typeof listing.hours_json === 'object'
      ? JSON.stringify(listing.hours_json, null, 2)
      : '',
  logo_url: String(listing.logo_url || ''),
});
  return createDiscoverBusinessEditForm;
};
