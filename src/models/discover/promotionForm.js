export const createCreateDiscoverPromotionForm = ({} = {}) => {
const createDiscoverPromotionForm = (promotion = {}) => ({
  business_id: String(promotion.business_id || ''),
  title: String(promotion.title || ''),
  description: String(promotion.description || ''),
  promo_code: String(promotion.promo_code || ''),
  button_text: String(promotion.button_text || ''),
  button_url: String(promotion.button_url || ''),
  starts_at: String(promotion.starts_at || ''),
  ends_at: String(promotion.ends_at || ''),
  image_url: String(promotion.image_url || ''),
  status: String(promotion.status || 'pending'),
});
  return createDiscoverPromotionForm;
};
