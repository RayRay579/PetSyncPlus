export const createCommunityCommentService = ({
  supabase,
  CURRENT_USER_OWNER_ID,
  CURRENT_USER_NAME,
} = {}) => {
const mapCommunityCommentRow = (row) => ({
  id: row.id,
  parentType: row.parent_type || 'post',
  parentId: row.parent_id || '',
  user_id: row.user_id || row.author_id || null,
  author_id: row.author_id || row.user_id || null,
  userId: row.user_id || row.author_id || null,
    author: row.author || 'Community Member',
  owner: Boolean(row.user_id || row.author_id) && String(row.user_id || row.author_id) === String(CURRENT_USER_OWNER_ID || ''),
  text: row.text || '',
  createdAt: row.created_at || '',
});

const loadCommunityCommentsFromSupabase = async () => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.log('Supabase comments load error:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('No Supabase comments found');
    return [];
  }

  console.log('Loaded comments from Supabase');
  return data.map(mapCommunityCommentRow);
};

const saveCommunityCommentToSupabase = async (comment) => {
  try {
    const currentUserId = CURRENT_USER_OWNER_ID || '';
    const payload = {
      id: comment.id,
      parent_type: comment.parentType,
      parent_id: comment.parentId,
      user_id: currentUserId || null,
      author_id: currentUserId || null,
      author: comment.author || CURRENT_USER_NAME || 'Pet Parent',
      text: comment.text || '',
    };

    const { data, error } = await supabase
      .from('comments')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      console.log('Supabase comment save error:', error);
      return null;
    }

    console.log('Comment saved to Supabase');
    return data ? mapCommunityCommentRow(data) : null;
  } catch (error) {
    console.log('Supabase comment save error:', error);
    return null;
  }
};

const deleteCommunityCommentFromSupabase = async (commentId) => {
  const currentUserId = CURRENT_USER_OWNER_ID || '';
  let query = supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (currentUserId) {
    query = query.or(`user_id.eq.${currentUserId},author_id.eq.${currentUserId}`);
  }

  const { error } = await query;

  if (error) {
    console.log('Supabase comment delete error:', error);
    return;
  }

  console.log('Comment deleted from Supabase');
};

  return {
    mapCommunityCommentRow,
    loadCommunityCommentsFromSupabase,
    saveCommunityCommentToSupabase,
    deleteCommunityCommentFromSupabase,
  };
};
