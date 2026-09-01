export const createRecipeService = ({
  supabase,
  CURRENT_USER_OWNER_ID,
  CURRENT_USER_NAME,
} = {}) => {
const normalizeRecipeSafeFor = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  const text = String(value || '').trim();
  if (!text) return [];
  return text.split(',').map((item) => item.trim()).filter(Boolean);
};

const normalizeRecipeIngredients = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  const text = String(value || '').trim();
  if (!text) return [];
  return text.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
};

const saveRecipeToSupabase = async (recipe) => {
  const currentUserId = CURRENT_USER_OWNER_ID || '';
  const payload = {
    id: recipe.id,
    user_id: currentUserId || null,
    author_id: currentUserId || null,
    author: recipe.author || CURRENT_USER_NAME || 'Pet Parent',
    title: recipe.title || '',
    description: recipe.description || '',
    ingredients: recipe.ingredients || [],
    pet_type: Array.isArray(recipe.safeFor) ? recipe.safeFor.join(', ') : String(recipe.safeFor || ''),
    prep_time: recipe.prepTime || '',
    likes: recipe.likes || 0,
    comments: recipe.comments || 0,
  };

  const { error } = await supabase.from('recipes').insert([payload]);

  if (error) {
    console.log('Supabase recipe save error:', error);
    return;
  }

  console.log('Recipe saved to Supabase');
};

const updateRecipeInSupabase = async (recipe) => {
  const currentUserId = CURRENT_USER_OWNER_ID || '';
  const payload = {
    user_id: currentUserId || null,
    author_id: currentUserId || null,
    author: recipe.author || CURRENT_USER_NAME || 'Pet Parent',
    title: recipe.title || '',
    description: recipe.description || '',
    ingredients: recipe.ingredients || [],
    pet_type: Array.isArray(recipe.safeFor) ? recipe.safeFor.join(', ') : String(recipe.safeFor || ''),
    prep_time: recipe.prepTime || '',
    likes: recipe.likes || 0,
    comments: recipe.comments || 0,
  };

  const { error } = await supabase
    .from('recipes')
    .update(payload)
    .eq('id', recipe.id);

  if (error) {
    console.log('Supabase recipe update error:', error);
    return;
  }

  console.log('Recipe updated in Supabase');
};

const deleteRecipeFromSupabase = async (recipeId) => {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', recipeId);

  if (error) {
    console.log('Supabase recipe delete error:', error);
    return;
  }

  console.log('Recipe deleted from Supabase');
};

const loadRecipesFromSupabase = async () => {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Supabase recipes load error:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('No Supabase recipes found, using existing recipe list');
    return [];
  }

  const mappedRecipes = data.map((row) => ({
    id: row.id,
    user_id: row.user_id || row.author_id || null,
    author_id: row.author_id || row.user_id || null,
    author: row.author || 'Pet Parent',
    owner: Boolean(row.user_id || row.author_id) && String(row.user_id || row.author_id) === String(CURRENT_USER_OWNER_ID || ''),
    title: row.title,
    description: row.description,
    ingredients: normalizeRecipeIngredients(row.ingredients),
    safeFor: normalizeRecipeSafeFor(row.pet_type),
    prepTime: row.prep_time,
    likes: row.likes || 0,
    comments: row.comments || 0,
    emoji: row.emoji || '??',
    instructions: [],
    liked: false,
  }));

  console.log('Loaded recipes from Supabase');
  return mappedRecipes;
};

  return {
    normalizeRecipeSafeFor,
    normalizeRecipeIngredients,
    saveRecipeToSupabase,
    updateRecipeInSupabase,
    deleteRecipeFromSupabase,
    loadRecipesFromSupabase,
  };
};
