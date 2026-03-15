import { createClient } from '@supabase/supabase-js';
import config from './config.js';

// Service role client (bypasses RLS - for backend use only)
const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

export default supabase;
