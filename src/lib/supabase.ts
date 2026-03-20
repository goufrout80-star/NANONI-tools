import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail loudly in production if env vars missing
if (!supabaseUrl || !supabaseKey) {
  if (import.meta.env.PROD) {
    throw new Error(
      'Missing required environment variables: ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
    );
  } else {
    console.warn(
      'Missing Supabase env vars — check your .env file'
    );
  }
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseKey ?? ''
);
