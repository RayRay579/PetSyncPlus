const COMMUNITY_MEDIA_BUCKET = 'community-media';

const isRemoteCommunityMediaUri = (uri) => /^https?:\/\//i.test(String(uri || '').trim());

const buildCommunityPostMediaPayload = (post, { clearMedia = false } = {}) => {
  if (clearMedia) {
    return {
      media_url: null,
      media_type: null,
      media_name: null,
      image_url: null,
      video_url: null,
    };
  }

  const mediaUrl = String(
    post?.mediaUrl
    || post?.media_url
    || post?.imageUrl
    || post?.image_url
    || post?.photoUrl
    || post?.photo_url
    || post?.videoUrl
    || post?.video_url
    || ''
  ).trim();

  if (!mediaUrl) {
    return {};
  }

  const resolvedType = String(
    post?.mediaType
    || post?.media_type
    || (post?.videoUrl || post?.video_url ? 'video' : 'image')
  ).trim().toLowerCase() === 'video'
    ? 'video'
    : 'image';

  const mediaName = String(post?.mediaName || post?.media_name || post?.fileName || post?.file_name || '').trim();

  return {
    media_url: mediaUrl,
    media_type: resolvedType,
    media_name: mediaName,
    image_url: resolvedType === 'image' ? mediaUrl : null,
    video_url: resolvedType === 'video' ? mediaUrl : null,
  };
};

const mapCommunityPostRow = (row) => {
  const mediaUrl = String(
    row?.media_url
    || row?.mediaUrl
    || row?.image_url
    || row?.imageUrl
    || row?.photo_url
    || row?.photoUrl
    || row?.video_url
    || row?.videoUrl
    || ''
  ).trim();
  const mediaType = String(
    row?.media_type
    || row?.mediaType
    || (row?.video_url || row?.videoUrl ? 'video' : (row?.image_url || row?.imageUrl || row?.photo_url || row?.photoUrl ? 'image' : ''))
  ).trim();
  const inferredType = mediaType.toLowerCase() === 'video'
    ? 'video'
    : (mediaUrl && String(row?.video_url || row?.videoUrl || '').trim() ? 'video' : (mediaUrl ? 'image' : ''));

  return {
    id: row.id,
    user_id: row.user_id || row.author_id || null,
    author_id: row.author_id || row.user_id || null,
    author: row.author || 'Pet Parent',
    owner: Boolean(row.user_id || row.author_id) && String(row.user_id || row.author_id) === String(CURRENT_USER_OWNER_ID || ''),
    petType: 'Community Member',
    time: 'Just now',
    content: row.content || '',
    emoji: row.emoji || '',
    likes: row.likes || 0,
    comments: row.comments || 0,
    type: row.type || row.post_type || 'general',
    liked: false,
    createdAt: row.created_at || row.createdAt || '',
    mediaUrl,
    mediaType: inferredType || '',
    mediaName: String(row.media_name || row.mediaName || row.file_name || row.fileName || '').trim(),
    media_url: row.media_url || row.mediaUrl || '',
    media_type: row.media_type || row.mediaType || '',
    media_name: row.media_name || row.mediaName || row.file_name || row.fileName || '',
    imageUrl: row.image_url || row.imageUrl || row.photo_url || row.photoUrl || (inferredType === 'image' ? mediaUrl : ''),
    image_url: row.image_url || row.imageUrl || row.photo_url || row.photoUrl || '',
    videoUrl: row.video_url || row.videoUrl || (inferredType === 'video' ? mediaUrl : ''),
    video_url: row.video_url || row.videoUrl || '',
  };
};

const isCommunityPostMediaSchemaError = (error) => {
  const message = String(error?.message || error?.details || error?.hint || '').toLowerCase();
  return message.includes('media_url')
    || message.includes('media_type')
    || message.includes('media_name')
    || message.includes('image_url')
    || message.includes('video_url');
};

export {
  COMMUNITY_MEDIA_BUCKET,
  isRemoteCommunityMediaUri,
  buildCommunityPostMediaPayload,
  mapCommunityPostRow,
  isCommunityPostMediaSchemaError,
};
