/**
 * Cricket 360 - Supabase Storage Configuration
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './constants';

// Create Supabase client with service role key for server-side operations
export const supabase = createClient(
  SUPABASE_CONFIG.URL,
  SUPABASE_CONFIG.SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Storage bucket names
export const STORAGE_BUCKETS = {
  PROFILE_PICTURES: 'profile-pictures',
  TEAM_LOGOS: 'team-logos',
} as const;

/**
 * Get public URL for a file in storage
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a file from storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Upload a file to storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer,
  contentType: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: true, // Replace if exists
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  return data.path;
}

