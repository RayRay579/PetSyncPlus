import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://msyybvrjrulikcrimguv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zgO5P7icFeazNFdiRFl_ow_pAkPawou';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
