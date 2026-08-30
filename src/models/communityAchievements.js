const buildCommunityProfileAchievements = (profile) => ([
  {
    key: 'first-pet-added',
    label: 'First Pet Added',
    achieved: (profile.petCount || 0) > 0,
  },
  {
    key: 'first-health-record',
    label: 'First Health Record',
    achieved: (profile.healthRecordCount || 0) > 0,
  },
  {
    key: 'first-recipe-shared',
    label: 'First Recipe Shared',
    achieved: (profile.recipeCount || 0) > 0,
  },
  {
    key: 'community-helper',
    label: 'Community Helper',
    achieved: (profile.communityPostCount || 0) > 0,
  },
  {
    key: 'lost-pet-supporter',
    label: 'Lost Pet Supporter',
    achieved: (profile.lostPetAlertCount || 0) > 0,
  },
]);

export {
  buildCommunityProfileAchievements,
};
