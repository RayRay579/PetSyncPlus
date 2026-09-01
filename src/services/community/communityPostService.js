export const createCommunityPostService = ({
  supabase,
  CURRENT_USER_OWNER_ID,
  CURRENT_USER_NAME,
  buildCommunityPostMediaPayload,
  mapCommunityPostRow,
  isCommunityPostMediaSchemaError,
} = {}) => {
const saveCommunityPostToSupabase = async (post, options = {}) => {
  const currentUserId = CURRENT_USER_OWNER_ID || '';
  const payload = {
    id: post.id,
    user_id: currentUserId || null,
    author_id: currentUserId || null,
    author: post.author || CURRENT_USER_NAME || 'Pet Parent',
    content: post.content || '',
    likes: post.likes || 0,
    comments: post.comments || 0,
    ...(options.clearMedia ? buildCommunityPostMediaPayload(post, { clearMedia: true }) : buildCommunityPostMediaPayload(post)),
  };

  const { data, error } = await supabase
    .from('community_posts')
    .insert([payload])
    .select('*')
    .single();

  if (error) {
    if (isCommunityPostMediaSchemaError(error)) {
      console.log('Community post media columns are missing. Run the Community media SQL migration.', error);
      return { ok: false, needsSchema: true, error };
    }

    console.log('Supabase community post save error:', error);
    return { ok: false, needsSchema: false, error };
  }

  console.log('Community post saved to Supabase');
  return { ok: true, post: data ? mapCommunityPostRow(data) : null };
};

const updateCommunityPostLikesInSupabase = async (postId, likes) => {
  const { error } = await supabase
    .from('community_posts')
    .update({ likes })
    .eq('id', postId);

  if (error) {
    console.log('Supabase community post likes update error:', error);
    return;
  }

  console.log('Community post likes updated in Supabase');
};

const updateCommunityPostInSupabase = async (post, options = {}) => {
  const payload = {
    user_id: CURRENT_USER_OWNER_ID || null,
    author_id: CURRENT_USER_OWNER_ID || null,
    author: post.author || CURRENT_USER_NAME || 'Pet Parent',
    content: post.content || '',
    likes: post.likes || 0,
    comments: post.comments || 0,
    ...(options.clearMedia ? buildCommunityPostMediaPayload(post, { clearMedia: true }) : buildCommunityPostMediaPayload(post)),
  };

  const { data, error } = await supabase
    .from('community_posts')
    .update(payload)
    .eq('id', post.id)
    .select('*')
    .single();

  if (error) {
    if (isCommunityPostMediaSchemaError(error)) {
      console.log('Community post media columns are missing. Run the Community media SQL migration.', error);
      return { ok: false, needsSchema: true, error };
    }

    console.log('Supabase community post update error:', error);
    return { ok: false, needsSchema: false, error };
  }

  console.log('Community post updated in Supabase');
  return { ok: true, post: data ? mapCommunityPostRow(data) : null };
};

const deleteCommunityPostFromSupabase = async (postId) => {
  const { error } = await supabase
    .from('community_posts')
    .delete()
    .eq('id', postId);

  if (error) {
    console.log('Supabase community post delete error:', error);
    return;
  }

  console.log('Community post deleted from Supabase');
};

const loadCommunityPostsFromSupabase = async () => {
  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Supabase community posts load error:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('No Supabase community posts found');
    return [];
  }

  const mappedPosts = data.map((row) => mapCommunityPostRow(row, CURRENT_USER_OWNER_ID));

  console.log('Loaded community posts from Supabase');
  return mappedPosts;
};


  return {
    saveCommunityPostToSupabase,
    updateCommunityPostLikesInSupabase,
    updateCommunityPostInSupabase,
    deleteCommunityPostFromSupabase,
    loadCommunityPostsFromSupabase,
  };
};
