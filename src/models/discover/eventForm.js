export const createCreateDiscoverEventForm = ({} = {}) => {
const createDiscoverEventForm = (event = {}) => ({
  host_type: String(event.host_type || 'community'),
  business_id: String(event.business_id || ''),
  shelter_id: String(event.shelter_id || ''),
  title: String(event.title || ''),
  description: String(event.description || ''),
  event_type: String(event.event_type || ''),
  starts_at: String(event.starts_at || ''),
  ends_at: String(event.ends_at || ''),
  max_attendees: event.max_attendees != null ? String(event.max_attendees) : '',
  registration_required: Boolean(event.registration_required),
  registration_url: String(event.registration_url || ''),
  address: String(event.address || ''),
  city: String(event.city || ''),
  state: String(event.state || ''),
  zip: String(event.zip || ''),
  image_url: String(event.image_url || ''),
  status: String(event.status || 'pending'),
});
  return createDiscoverEventForm;
};
