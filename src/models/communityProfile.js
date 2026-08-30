const normalizeCommunityProfileKey = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const COMMUNITY_PROFILE_FIXTURES = {};

const getCommunityProfileFixture = (profileKey, displayName) => {
  const normalizedKey = normalizeCommunityProfileKey(profileKey || displayName);
  const fallbackName = displayName || 'Community Member';

  return COMMUNITY_PROFILE_FIXTURES[normalizedKey] || {
    displayName: fallbackName,
    avatarEmoji: '??',
    memberSince: 'Jan 2026',
    bio: 'Community member',
    favoritePetName: '',
    favoritePetSpecies: '',
    favoritePetBreed: '',
    petCount: 0,
    communityPostCount: 0,
    recipeCount: 0,
    lostPetAlertCount: 0,
  };
};

const mapCommunityProfileRow = (row, fallback = {}) => ({
  ...fallback,
  displayName: row.display_name || row.displayName || row.full_name || row.username || row.name || fallback.displayName,
  email: row.email || row.email_address || fallback.email || '',
  avatarUrl: row.avatar_url || row.avatarUrl || row.photo_url || fallback.avatarUrl || '',
  avatarEmoji: row.avatar_emoji || row.avatarEmoji || fallback.avatarEmoji || '??',
  memberSince: row.member_since || row.memberSince || row.created_at || fallback.memberSince || '',
  bio: row.bio || row.about || fallback.bio || '',
  favoritePetName: row.favorite_pet_name || row.favoritePetName || fallback.favoritePetName || '',
  favoritePetSpecies: row.favorite_pet_species || row.favoritePetSpecies || fallback.favoritePetSpecies || '',
  favoritePetBreed: row.favorite_pet_breed || row.favoritePetBreed || fallback.favoritePetBreed || '',
  petCount: row.pet_count ?? row.petCount ?? fallback.petCount ?? 0,
  communityPostCount: row.community_post_count ?? row.communityPostCount ?? fallback.communityPostCount ?? 0,
  recipeCount: row.recipe_count ?? row.recipeCount ?? fallback.recipeCount ?? 0,
  lostPetAlertCount: row.lost_pet_alert_count ?? row.lostPetAlertCount ?? fallback.lostPetAlertCount ?? 0,
});

export {
  normalizeCommunityProfileKey,
  COMMUNITY_PROFILE_FIXTURES,
  getCommunityProfileFixture,
  mapCommunityProfileRow,
};
