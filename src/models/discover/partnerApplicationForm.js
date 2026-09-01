export const createCreateDiscoverPartnerApplicationForm = ({} = {}) => {
const createDiscoverPartnerApplicationForm = (application = {}) => ({
  business_name: String(application.business_name || ''),
  organization_name: String(application.organization_name || ''),
  contact_name: String(application.contact_name || ''),
  email: String(application.email || ''),
  phone: String(application.phone || ''),
  website: String(application.website || ''),
  category: String(application.category || ''),
  city: String(application.city || ''),
  state: String(application.state || ''),
  short_description: String(application.short_description || ''),
  partner_type: String(application.partner_type || 'shelter'),
  status: String(application.status || 'pending'),
});
  return createDiscoverPartnerApplicationForm;
};
