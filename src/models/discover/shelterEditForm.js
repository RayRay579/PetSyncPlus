export const createCreateDiscoverShelterEditForm = ({} = {}) => {
const createDiscoverShelterEditForm = (listing = {}) => ({
  name: String(listing.name || ''),
  description: String(listing.description || ''),
  phone: String(listing.phone || ''),
  email: String(listing.email || ''),
  website: String(listing.website || ''),
  donation_url: String(listing.donation_url || ''),
  volunteer_url: String(listing.volunteer_url || ''),
  wishlist_url: String(listing.wishlist_url || ''),
  amazon_wishlist_url: String(listing.amazon_wishlist_url || ''),
  service_mode: String(listing.service_mode || 'local_only'),
  online_service_url: String(listing.online_service_url || ''),
  address: String(listing.address || ''),
  city: String(listing.city || ''),
  state: String(listing.state || ''),
  zip: String(listing.zip || ''),
  logo_url: String(listing.logo_url || ''),
});
  return createDiscoverShelterEditForm;
};
