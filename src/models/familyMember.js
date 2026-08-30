const normalizeFamilyMemberRole = (role) => {
  const value = String(role || 'Viewer').trim().toLowerCase();
  if (value === 'caregiver') return 'Caregiver';
  if (value === 'admin') return 'Admin';
  return 'Viewer';
};

const normalizeFamilyMemberStatus = (status) => {
  const value = String(status || 'pending').trim().toLowerCase();
  if (value === 'accepted') return 'accepted';
  return 'pending';
};

const mapFamilyMemberRow = (row) => ({
  id: row.id,
  ownerId: row.owner_id || '',
  memberEmail: row.member_email || '',
  role: normalizeFamilyMemberRole(row.role),
  status: normalizeFamilyMemberStatus(row.status),
  householdId: row.household_id || '',
  invitedByUserId: row.invited_by_user_id || '',
  memberUserId: row.member_user_id || '',
  acceptedAt: row.accepted_at || '',
  removedAt: row.removed_at || '',
  createdAt: row.created_at || '',
});

export {
  normalizeFamilyMemberRole,
  normalizeFamilyMemberStatus,
  mapFamilyMemberRow,
};
