const FEATURE_LOCKED_BENEFITS = {
  unlimited_pets: [
    'Keep more than one pet in a single account',
    'Manage a full pet family without hitting the free limit',
  ],
  advanced_reminder_scheduling: [
    'Create more than 5 active reminders',
    'Use the advanced reminder planner and scheduling tools',
  ],
  ai_vet_assistant: [
    'Ask AI Vet for guidance',
    'Get AI-powered suggestions for your pet care questions',
  ],
  family_sharing: [
    'Invite household members',
    'Share care access across one home',
  ],
  lost_pet_sos: [
    'Create Lost Pet SOS alerts',
    'Use boosted recovery and sharing tools',
  ],
  health_records: [
    'Create and edit health records',
    'Track visits, meds, and vaccinations in one place',
  ],
  export_health_records: [
    'Export your pet health history',
    'Share records outside the app when needed',
  ],
  community_posting: [
    'Create Community feed posts',
    'Share updates, stories, and tips',
  ],
  community_recipes: [
    'Create Community recipes',
    'Publish food and care ideas',
  ],
  trend_tracking: [
    'Unlock deeper activity trends',
    'See history beyond the basic dashboard summary',
  ],
  streaks: [
    'Track longer streak history',
    'Unlock streak-focused insights and analytics',
  ],
  care_score_history: [
    'View historical care score changes',
    'See how care trends evolve over time',
  ],
  default: [
    'Unlock the full version of this feature',
    'Keep your current free experience while Premium access is unavailable',
  ],
};

function getFeatureLockedBenefits(featureKey) {
  return FEATURE_LOCKED_BENEFITS[featureKey] || FEATURE_LOCKED_BENEFITS.default;
}

export {
  FEATURE_LOCKED_BENEFITS,
  getFeatureLockedBenefits,
};
