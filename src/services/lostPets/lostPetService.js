export const createLostPetService = ({
  supabase,
  CURRENT_USER_OWNER_ID,
  sendLostPetAlertPushNotifications,
  parseLostPetDescription,
} = {}) => {
const uploadLostPetPhotoToStorage = async (photoUri, petId) => {
  if (!photoUri) return '';

  try {
    const response = await fetch(photoUri);
    const arrayBuffer = await response.arrayBuffer();
    const safeFileName = `lost-pet-${Date.now()}.jpg`;
    const filePath = `lost-pet-alerts/${petId || 'unknown-pet'}/${safeFileName}`;

    const { error } = await supabase.storage
      .from('health-record-files')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.log('Lost pet photo upload error:', error);
      return photoUri;
    }

    const { data: publicUrlData } = supabase.storage
      .from('health-record-files')
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || photoUri;
  } catch (error) {
    console.log('Lost pet photo upload error:', error);
    return photoUri;
  }
};

const saveLostPetAlertToSupabase = async (alert) => {
  try {
    const photoUrl = alert.photoUrl || (alert.photoUri ? await uploadLostPetPhotoToStorage(alert.photoUri, alert.petId) : '');
    const payload = {
      id: alert.id,
      pet_id: alert.petId || null,
      user_id: CURRENT_USER_OWNER_ID || null,
      pet_name: alert.petName || '',
      photo_url: photoUrl || '',
      last_seen_location: alert.lastSeenLocation || '',
      description: alert.description || '',
      status: alert.status || 'active',
      latitude: alert.latitude ?? null,
      longitude: alert.longitude ?? null,
    };

    const { error } = await supabase.from('lost_pet_alerts').insert([payload]);

    if (error) {
      console.log('Supabase lost pet alert save error:', error);
      return null;
    }

    console.log('Lost pet alert saved to Supabase');
    void sendLostPetAlertPushNotifications({
      id: payload.id,
      petId: payload.pet_id,
      petName: payload.pet_name,
      lastSeenLocation: payload.last_seen_location,
    });
    return { ...payload, photo_url: photoUrl || '' };
  } catch (error) {
    console.log('Supabase lost pet alert save error:', error);
    return null;
  }
};

const updateLostPetAlertStatusInSupabase = async (alertId, status) => {
  const { error } = await supabase
    .from('lost_pet_alerts')
    .update({ status })
    .eq('id', alertId)
    .eq('user_id', CURRENT_USER_OWNER_ID);

  if (error) {
    console.log('Supabase lost pet alert status update error:', error);
    return;
  }

  console.log('Lost pet alert status updated in Supabase');
};

const loadLostPetAlertsFromSupabase = async () => {
  if (!CURRENT_USER_OWNER_ID) {
    return [];
  }

  const { data, error } = await supabase
    .from('lost_pet_alerts')
    .select('*')
    .eq('user_id', CURRENT_USER_OWNER_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Supabase lost pet alerts load error:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('No Supabase lost pet alerts found');
    return [];
  }

  const mappedAlerts = data.map((row) => ({
    id: row.id,
    petId: row.pet_id || '',
    petName: row.pet_name || 'Lost Pet',
    photoUrl: row.photo_url || '',
    lastSeenLocation: row.last_seen_location || '',
    dateReported: row.created_at || row.date_reported || '',
    ...parseLostPetDescription(row.description),
    status: row.status || 'active',
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
  }));

  console.log('Loaded lost pet alerts from Supabase');
  return mappedAlerts;
};

const deleteLostPetAlertFromSupabase = async (alertId) => {
  try {
    const { error } = await supabase
      .from('lost_pet_alerts')
      .delete()
      .eq('id', alertId);

    if (error) {
      console.log('Supabase lost pet alert delete error:', error);
      return false;
    }

    console.log('Lost pet alert deleted from Supabase');
    return true;
  } catch (error) {
    console.log('Supabase lost pet alert delete error:', error);
    return false;
  }
};


  return {
    uploadLostPetPhotoToStorage,
    saveLostPetAlertToSupabase,
    updateLostPetAlertStatusInSupabase,
    loadLostPetAlertsFromSupabase,
    deleteLostPetAlertFromSupabase,
  };
};
