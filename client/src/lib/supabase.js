import { createClient } from '@supabase/supabase-js';

// Default project details from your Supabase dashboard
export const DEFAULT_SUPABASE_URL = 'https://uuklvqlwrxvnacbnsyve.supabase.co';
export const DEFAULT_SUPABASE_BUCKET = 'sachikheti-media';

/**
 * Retrieve current Supabase credentials.
 * Priority: localStorage (saved via Admin UI) > Vite environment variables > Defaults.
 */
export function getSupabaseConfig() {
  const url =
    localStorage.getItem('sachikheti_supabase_url') ||
    import.meta.env.VITE_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;

  const anonKey =
    localStorage.getItem('sachikheti_supabase_anon_key') ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    '';

  const bucket =
    localStorage.getItem('sachikheti_supabase_bucket') ||
    import.meta.env.VITE_SUPABASE_BUCKET ||
    DEFAULT_SUPABASE_BUCKET;

  return {
    url: url.trim(),
    anonKey: anonKey.trim(),
    bucket: bucket.trim(),
    isConfigured: Boolean(anonKey.trim()),
  };
}

/**
 * Save credentials directly from Admin Dashboard settings dialog.
 */
export function saveSupabaseConfig({ url, anonKey, bucket }) {
  if (url) localStorage.setItem('sachikheti_supabase_url', url.trim());
  if (anonKey !== undefined) localStorage.setItem('sachikheti_supabase_anon_key', anonKey.trim());
  if (bucket) localStorage.setItem('sachikheti_supabase_bucket', bucket.trim());
}

/**
 * Reset custom configuration to environment variables or defaults.
 */
export function resetSupabaseConfig() {
  localStorage.removeItem('sachikheti_supabase_url');
  localStorage.removeItem('sachikheti_supabase_anon_key');
  localStorage.removeItem('sachikheti_supabase_bucket');
}

/**
 * Get or instantiate Supabase client singleton.
 */
let cachedClient = null;
let lastKey = '';

export function getSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig();

  if (!anonKey) {
    return null;
  }

  if (!cachedClient || lastKey !== anonKey) {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
      },
    });
    lastKey = anonKey;
  }

  return cachedClient;
}

/**
 * Upload an image file directly to Supabase Storage.
 *
 * @param {File} file - The image file to upload.
 * @param {string} folder - Destination subfolder (default: 'products').
 * @returns {Promise<{ success: boolean, url?: string, path?: string, error?: string, hint?: string }>}
 */
export async function uploadImageToSupabase(file, folder = 'products') {
  const { url, anonKey, bucket } = getSupabaseConfig();

  if (!anonKey) {
    return {
      success: false,
      error: 'Supabase Anon Key is not configured yet.',
      hint: 'Please paste your public "anon" key in the Supabase Settings dialog or in client/.env file.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Unable to initialize Supabase client.',
    };
  }

  // Sanitize filename and create unique timestamped path
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${folder}/${Date.now()}-${sanitizedName}`;

  try {
    const { data, error } = await client.storage.from(bucket).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    });

    if (error) {
      // Common Supabase bucket missing or RLS policy error handling
      if (error.message?.toLowerCase().includes('bucket not found')) {
        return {
          success: false,
          error: `Storage bucket "${bucket}" was not found in your Supabase project.`,
          hint: `Go to Supabase Dashboard -> Storage -> Click "+ New bucket" -> Name it "${bucket}" -> Make it PUBLIC -> Save.`,
        };
      }

      if (error.message?.toLowerCase().includes('row-level security') || error.message?.toLowerCase().includes('violates row-level')) {
        return {
          success: false,
          error: 'Row-level security policy restriction on storage bucket.',
          hint: `Ensure bucket "${bucket}" is set to "Public" under Supabase Dashboard -> Storage -> ${bucket} -> Configuration.`,
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to upload image to Supabase.',
      };
    }

    // Retrieve public permanent CDN URL
    const { data: urlData } = client.storage.from(bucket).getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Unexpected network error during Supabase upload.',
    };
  }
}

/**
 * Test Supabase connectivity and verify the storage bucket exists.
 */
export async function testSupabaseConnection() {
  const { url, anonKey, bucket } = getSupabaseConfig();

  if (!anonKey) {
    return {
      success: false,
      error: 'Supabase Anon Key is missing. Paste your anon key to connect.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Failed to initialize Supabase client.',
    };
  }

  try {
    const { data, error } = await client.storage.listBuckets();
    if (error) {
      return {
        success: false,
        error: `Supabase API Error: ${error.message}`,
        hint: 'Verify that your Anon Key is correct from Project Settings -> API.',
      };
    }

    const bucketExists = data.some((b) => b.name === bucket);
    return {
      success: true,
      buckets: data.map((b) => b.name),
      bucketExists,
      message: bucketExists
        ? `Successfully connected! Bucket "${bucket}" is active and ready.`
        : `Connected to Supabase! Note: Bucket "${bucket}" is not created yet. Please create it under Storage -> New bucket.`,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Connection test failed.',
    };
  }
}
