import { supabase } from '../../../supabase';
import {
  normalizeCommunityProfileKey,
  getCommunityProfileFixture,
  mapCommunityProfileRow,
} from '../../models/communityProfile';

const loadCommunityProfileFromSupabase = async ({ profileKey, displayName }) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(200);

    if (error) {
      console.log('Supabase profile load error:', error);
      return null;
    }

    const normalizedKey = normalizeCommunityProfileKey(profileKey || displayName);
    const normalizedName = normalizeCommunityProfileKey(displayName || profileKey);
    const row = (data || []).find((item) => {
      const candidateValues = [
        item.id,
        item.user_id,
        item.author_id,
        item.profile_key,
        item.username,
        item.display_name,
        item.full_name,
        item.name,
      ].filter(Boolean).map(normalizeCommunityProfileKey);

      return candidateValues.includes(normalizedKey) || candidateValues.includes(normalizedName);
    });

    if (!row) {
      return null;
    }

    return mapCommunityProfileRow(row, getCommunityProfileFixture(profileKey, displayName));
  } catch (error) {
  console.log('Supabase profile load error:', error);
  return null;
}
};

const loadAuthProfileFromSupabase = async (userId) => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .limit(1);

  if (error) {
    console.log('Auth profile load error:', error);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  return row || null;
};

let PROFILE_AVATAR_URL_SUPPORTED = null;

const canWriteProfileAvatarUrl = async () => {
  if (PROFILE_AVATAR_URL_SUPPORTED != null) {
    return PROFILE_AVATAR_URL_SUPPORTED;
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .limit(1);

    if (error) {
      PROFILE_AVATAR_URL_SUPPORTED = false;
      return false;
    }

    PROFILE_AVATAR_URL_SUPPORTED = true;
    return true;
  } catch (error) {
    PROFILE_AVATAR_URL_SUPPORTED = false;
    return false;
  }
};

const uploadProfileAvatarToStorage = async (photoUri, userId) => {
  if (!photoUri || !userId) {
    return '';
  }

  try {
    const response = await fetch(photoUri);
    const arrayBuffer = await response.arrayBuffer();
    const filePath = `profiles/${userId}/avatar-${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from('profile-avatars')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.log('Profile avatar upload error:', error);
      return '';
    }

    const { data: publicUrlData } = supabase.storage
      .from('profile-avatars')
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || '';
  } catch (error) {
    console.log('Profile avatar upload error:', error);
    return '';
  }
};


const upsertAuthProfileToSupabase = async (user, displayName, avatarUrl = '') => {
  if (!user?.id) {
    return null;
  }

  const nextProfileName = String(displayName || user.user_metadata?.display_name || user.email?.split('@')?.[0] || 'Pet Parent').trim();
  const payload = {
    id: user.id,
    email: user.email || '',
    display_name: nextProfileName,
  };

  if (avatarUrl && await canWriteProfileAvatarUrl()) {
    payload.avatar_url = avatarUrl;
  } else if (avatarUrl) {
  }

  const { error } = await supabase
    .from('profiles')
    .upsert([payload], { onConflict: 'id' });

  if (error) {
    console.log('Auth profile save error:', error);
    return payload;
  }

  const loaded = await loadAuthProfileFromSupabase(user.id);
  console.log('Auth profile saved to Supabase');
  return loaded || payload;
};

const saveCommunityProfileToSupabase = async (profileKey, draft) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(200);

    if (error) {
      console.log('Supabase profile save lookup error:', error);
      return false;
    }

    const normalizedKey = normalizeCommunityProfileKey(profileKey);
    const row = (data || []).find((item) => {
      const candidateValues = [
        item.id,
        item.user_id,
        item.profile_key,
        item.username,
        item.display_name,
        item.full_name,
        item.name,
      ].filter(Boolean).map(normalizeCommunityProfileKey);

      return candidateValues.includes(normalizedKey);
    });

    if (!row?.id) {
      console.log('Supabase profile save skipped: no matching profile row found');
      return false;
    }

    const payload = {
      email: draft.email || row.email || '',
      display_name: draft.displayName || row.display_name || '',
    };

    const { error: updateError } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', row.id);

    if (updateError) {
      console.log('Supabase profile save error:', updateError);
      return false;
    }

    console.log('Profile saved to Supabase');
    return true;
  } catch (error) {
    console.log('Supabase profile save error:', error);
    return false;
  }
};

export {
  loadCommunityProfileFromSupabase,
  loadAuthProfileFromSupabase,
  canWriteProfileAvatarUrl,
  uploadProfileAvatarToStorage,
  upsertAuthProfileToSupabase,
  saveCommunityProfileToSupabase,
};
