import { supabase } from './client';
import type { Database } from './database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

/** platform 스키마 클라이언트. 사업장 core 원장과 분리한다. */
export function getPlatformClient(): SupabaseClient<Database, 'platform'> {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
    );
  }
  return supabase.schema('platform') as unknown as SupabaseClient<Database, 'platform'>;
}
