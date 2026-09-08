import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://wikyiauyroewjzzensbb.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpa3lpYXV5cm9ld2p6emVuc2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1OTk1MTMsImV4cCI6MjEwNDE3NTUxM30.MP2h3xnH7DbmPaZ4bt4fgOMb0NQxxanZ6hM-E-m-3Js';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
