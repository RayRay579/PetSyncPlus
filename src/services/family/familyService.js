export const createFamilyService = ({
  supabase,
  CURRENT_USER_OWNER_ID,
  CURRENT_USER_EMAIL,
  CURRENT_USER_NAME,
  showAlert = () => {},
  mapFamilyMemberRow,
  normalizeFamilyMemberRole,
  normalizeFamilyMemberStatus,
} = {}) => {
const getOrCreateOwnerHousehold = async (ownerUser) => {
  const ownerId = ownerUser?.id || CURRENT_USER_OWNER_ID;
  if (!ownerId) {
    return null;
  }

  const { data: existingHouseholds, error: loadError } = await supabase
    .from('households')
    .select('*')
    .eq('owner_user_id', ownerId)
    .limit(1);

  if (loadError) {
    console.log('Supabase household load error:', loadError);
    return null;
  }

  const existingHousehold = existingHouseholds?.[0] || null;
  if (existingHousehold) {
    return existingHousehold;
  }

  const payload = {
    owner_user_id: ownerId,
    name: String(ownerUser?.user_metadata?.display_name || ownerUser?.email?.split('@')?.[0] || 'Pet Household').trim() || 'Pet Household',
  };

  const { data: createdHousehold, error: createError } = await supabase
    .from('households')
    .insert([payload])
    .select('*')
    .single();

  if (createError) {
    console.log('Supabase household create error:', createError);
    return null;
  }

  return createdHousehold || null;
};

const loadFamilyMembersFromSupabase = async (currentUser = null) => {
  const ownerId = currentUser?.id || CURRENT_USER_OWNER_ID;
  const currentEmail = String(currentUser?.email || CURRENT_USER_EMAIL || '').trim().toLowerCase();

  if (!ownerId) {
    return [];
  }

  const ownerMembersQuery = supabase
    .from('family_members')
    .select('*')
    .eq('owner_id', ownerId)
    .is('removed_at', null)
    .order('created_at', { ascending: false });

  const pendingInvitesQuery = currentEmail
    ? supabase
      .from('family_members')
      .select('*')
      .eq('member_email', currentEmail)
      .eq('status', 'pending')
      .is('removed_at', null)
      .order('created_at', { ascending: false })
    : Promise.resolve({ data: [], error: null });

  const [ownerResult, pendingResult] = await Promise.all([
    ownerMembersQuery,
    pendingInvitesQuery,
  ]);

  if (ownerResult.error) {
    console.log('Supabase family members load error:', ownerResult.error);
    return null;
  }

  if (pendingResult?.error) {
    console.log('Supabase pending family invites load error:', pendingResult.error);
    return null;
  }

  const mergedRows = [
    ...(ownerResult.data || []),
    ...(pendingResult?.data || []),
  ].filter((row, index, list) => list.findIndex((item) => item.id === row.id) === index);

  if (mergedRows.length === 0) {
    console.log('No Supabase family members found');
    return [];
  }

  console.log('Loaded family members from Supabase');
  return mergedRows.map(mapFamilyMemberRow);
};

const saveFamilyInvitationToSupabase = async ({ ownerUser, memberEmail, role }) => {
  try {
    const ownerHousehold = await getOrCreateOwnerHousehold(ownerUser);
    if (!ownerHousehold?.id || !ownerUser?.id) {
      return null;
    }

    const normalizedEmail = String(memberEmail || '').trim().toLowerCase();
    const { data: existingInvite, error: existingError } = await supabase
      .from('family_members')
      .select('*')
      .eq('household_id', ownerHousehold.id)
      .eq('member_email', normalizedEmail)
      .is('removed_at', null)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.log('Supabase family invite lookup error:', existingError);
      return null;
    }

    if (existingInvite) {
      showAlert('Invitation already exists.', 'Invitation already exists.');
      return mapFamilyMemberRow(existingInvite);
    }

    const payload = {
      owner_id: ownerUser.id,
      household_id: ownerHousehold.id,
      invited_by_user_id: ownerUser.id,
      member_email: normalizedEmail,
      member_user_id: null,
      role: normalizeFamilyMemberRole(role),
      status: 'pending',
    };

    const { data, error } = await supabase
      .from('family_members')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        showAlert('Invitation already exists for this email.', 'Invitation already exists for this email.');
        const { data: duplicateInvite } = await supabase
          .from('family_members')
          .select('*')
          .eq('household_id', ownerHousehold.id)
          .eq('member_email', normalizedEmail)
          .is('removed_at', null)
          .limit(1)
          .maybeSingle();

        return duplicateInvite ? mapFamilyMemberRow(duplicateInvite) : null;
      }

      console.log('Supabase family invitation save error:', error);
      return null;
    }

    console.log('Family invitation saved to Supabase');
    return data ? mapFamilyMemberRow(data) : null;
  } catch (error) {
    console.log('Supabase family invitation save error:', error);
    return null;
  }
};

const updateFamilyMemberStatusInSupabase = async (memberId, status) => {
  const { data, error } = await supabase
    .from('family_members')
    .update({ status: normalizeFamilyMemberStatus(status) })
    .eq('id', memberId)
    .eq('owner_id', CURRENT_USER_OWNER_ID)
    .select('*')
    .single();

  if (error) {
    console.log('Supabase family member update error:', error);
    return null;
  }

  console.log('Family member updated in Supabase');
  return data ? mapFamilyMemberRow(data) : null;
};

const acceptFamilyInviteInSupabase = async (inviteId) => {
  if (!inviteId) {
    return { data: null, error: new Error('Missing invite id') };
  }

  const { data, error } = await supabase.rpc('accept_family_invite', {
    p_family_member_id: inviteId,
  });

  return { data, error };
};

const removeFamilyMemberFromSupabase = async (memberId) => {
  const { error } = await supabase
    .from('family_members')
    .delete()
    .eq('id', memberId)
    .eq('owner_id', CURRENT_USER_OWNER_ID);

  if (error) {
    console.log('Supabase family member delete error:', error);
    return;
  }

  console.log('Family member deleted from Supabase');
};

  return {
    getOrCreateOwnerHousehold,
    loadFamilyMembersFromSupabase,
    saveFamilyInvitationToSupabase,
    updateFamilyMemberStatusInSupabase,
    acceptFamilyInviteInSupabase,
    removeFamilyMemberFromSupabase,
  };
};
