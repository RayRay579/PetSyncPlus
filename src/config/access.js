const PLAN_FREE = 'free';
const PLAN_PREMIUM = 'premium';

// Intended product limits for future gating.
// free_pet_limit = 1
// free_reminder_limit = 5
const MONETIZATION_LIMITS = {
  free_pet_limit: 1,
  free_reminder_limit: 5,
};

// TODO: Use this map for local-only feature checks once gating is introduced.
// TODO: Keep behavior unchanged until payment and entitlement work is ready.
const FEATURE_GATES = {
  // Free features
  auth: PLAN_FREE,
  profile: PLAN_FREE,
  basic_profile: PLAN_FREE,
  basic_profile_avatar: PLAN_FREE,
  basic_pet_management: PLAN_FREE,
  basic_health_records: PLAN_FREE,
  basic_reminders: PLAN_FREE,
  basic_memory_vault: PLAN_FREE,
  view_family_shared_pets: PLAN_FREE,
  basic_lost_pet_report: PLAN_FREE,
  community_browsing: PLAN_FREE,
  local_notifications: PLAN_FREE,

  // Premium features
  unlimited_pets: PLAN_PREMIUM,
  health_records: PLAN_PREMIUM,
  health_file_uploads: PLAN_PREMIUM,
  medications: PLAN_PREMIUM,
  vaccinations: PLAN_PREMIUM,
  vet_visits: PLAN_PREMIUM,
  advanced_health_analytics: PLAN_PREMIUM,
  trend_tracking: PLAN_PREMIUM,
  streak_system: PLAN_PREMIUM,
  streaks: PLAN_PREMIUM,
  care_score_history: PLAN_PREMIUM,
  ai_vet_assistant: PLAN_PREMIUM,
  advanced_reminder_scheduling: PLAN_PREMIUM,
  advanced_reminders: PLAN_PREMIUM,
  expanded_file_uploads: PLAN_PREMIUM,
  family_household_management: PLAN_PREMIUM,
  family_sharing: PLAN_PREMIUM,
  lost_pet_boosted_alerts: PLAN_PREMIUM,
  lost_pet_sos: PLAN_PREMIUM,
  export_health_records: PLAN_PREMIUM,
  advanced_memory_storage: PLAN_PREMIUM,
  unlimited_memory_storage: PLAN_PREMIUM,
  community_posting: PLAN_PREMIUM,
  community_recipes: PLAN_PREMIUM,
  premium_community_customization: PLAN_PREMIUM,
  premium_profile_customization: PLAN_PREMIUM,
};

const normalizePlanValue = (value) => String(value || '').trim().toLowerCase();

const getUserPlan = (profile) => {
  const candidates = [
    profile?.plan,
    profile?.tier,
    profile?.membership,
    profile?.account_tier,
    profile?.subscription_plan,
    profile?.subscription?.plan,
    profile?.subscription?.tier,
    profile?.subscription?.status,
    profile?.subscription_status,
    profile?.billing_plan,
    profile?.billing?.plan,
    profile?.revenueCatPremiumActive,
    profile?.revenueCat?.premiumActive,
    profile?.premium,
    profile?.is_premium,
  ];

  for (const candidate of candidates) {
    if (candidate === true) return PLAN_PREMIUM;
    if (candidate === false || candidate == null) continue;
    const normalized = normalizePlanValue(candidate);
    if (!normalized) continue;
    if (/premium|pro|plus|paid|active|trial/.test(normalized)) return PLAN_PREMIUM;
    if (/free|basic/.test(normalized)) return PLAN_FREE;
  }

  return PLAN_FREE;
};

const isPetSyncAdminProfile = (profile) => {
  const email = String(profile?.email || '').trim().toLowerCase();
  return email === 'rayray579@gmail.com';
};

const isPremiumUser = (profile) =>
  isPetSyncAdminProfile(profile) ||
  getUserPlan(profile) === PLAN_PREMIUM;

const canUseFeature = (profile, featureKey) => {
  const requiredPlan = FEATURE_GATES[featureKey];
  if (!requiredPlan || requiredPlan === PLAN_FREE) {
    return true;
  }
  return isPremiumUser(profile);
};

export {
  FEATURE_GATES,
  MONETIZATION_LIMITS,
  PLAN_FREE,
  PLAN_PREMIUM,
  canUseFeature,
  getUserPlan,
  isPetSyncAdminProfile,
  isPremiumUser,
  normalizePlanValue,
};
