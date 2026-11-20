import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure base upload directory exists inside client/public/uploads
const uploadBaseDir = path.join(__dirname, '../../../client/public/uploads');
if (!fs.existsSync(uploadBaseDir)) {
  fs.mkdirSync(uploadBaseDir, { recursive: true });
}

// Instantiate Supabase Admin Client using Secret Key for 100% RLS bypass
function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://uuklvqlwrxvnacbnsyve.supabase.co';
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseSecret) return null;
  return createClient(supabaseUrl, supabaseSecret, {
    auth: { persistSession: false },
  });
}

// POST /api/upload - Accepts base64 image, uploads to Supabase CDN (with admin bypass) + local disk backup
router.post('/', async (req, res) => {
  try {
    const { image, filename = 'image.jpg', folder = 'products' } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'No image data provided for upload.',
      });
    }

    // Determine target subfolder
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const targetDir = path.join(uploadBaseDir, safeFolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Extract base64 payload & extension
    let base64Data = image;
    let extension = 'jpg';
    let mimeType = 'image/jpeg';

    if (image.includes(';base64,')) {
      const parts = image.split(';base64,');
      const mimeMatch = parts[0].match(/:(.*?)$/);
      if (mimeMatch && mimeMatch[1]) {
        mimeType = mimeMatch[1];
        if (mimeType.includes('png')) extension = 'png';
        else if (mimeType.includes('webp')) extension = 'webp';
        else if (mimeType.includes('gif')) extension = 'gif';
        else if (mimeType.includes('svg')) extension = 'svg';
        else extension = 'jpg';
      }
      base64Data = parts[1];
    } else {
      const ext = path.extname(filename).replace('.', '');
      if (ext) extension = ext.toLowerCase();
    }

    const safeFilename = filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.[^/.]+$/, '');
    const finalFilename = `${Date.now()}-${safeFilename}.${extension}`;
    const filePath = path.join(targetDir, finalFilename);

    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    const localUrl = `/uploads/${safeFolder}/${finalFilename}`;
    const host = req.get('host') || 'sachikheti.com';
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const absoluteLocalUrl = `${proto}://${host}${localUrl}`;

    let finalUrl = absoluteLocalUrl;
    let storageProvider = 'local';

    // 1. Upload directly to Supabase Storage CDN via Secret Key (bypasses RLS)
    const supabaseAdmin = getSupabaseAdmin();
    const supabaseBucket = process.env.SUPABASE_BUCKET || 'SachiKeti';
    if (supabaseAdmin) {
      try {
        const storagePath = `${safeFolder}/${finalFilename}`;
        const { data, error } = await supabaseAdmin.storage
          .from(supabaseBucket)
          .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!error && data) {
          const { data: urlData } = supabaseAdmin.storage
            .from(supabaseBucket)
            .getPublicUrl(data.path);
          if (urlData?.publicUrl) {
            finalUrl = urlData.publicUrl;
            storageProvider = 'supabase';
          }
        } else if (error) {
          console.warn(`[Supabase Admin Upload Warning]: ${error.message}. Serving absolute local URL.`);
        }
      } catch (sbErr) {
        console.warn(`[Supabase Admin Exception]: ${sbErr.message}. Serving absolute local URL.`);
      }
    }

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: `Image uploaded successfully via ${storageProvider}.`,
      url: finalUrl,
      path: finalUrl,
      localUrl,
      storageProvider,
      filename: finalFilename,
      size: buffer.length,
    });
  } catch (error) {
    console.error('Server upload error:', error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Failed to save uploaded image.',
      error: error.message,
    });
  }
});

export default router;
