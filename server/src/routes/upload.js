import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure base upload directory exists inside client/public/uploads
const uploadBaseDir = path.join(__dirname, '../../../client/public/uploads');
if (!fs.existsSync(uploadBaseDir)) {
  fs.mkdirSync(uploadBaseDir, { recursive: true });
}

// POST /api/upload - Accepts base64 image and saves locally as resilient fallback
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

    if (image.includes(';base64,')) {
      const parts = image.split(';base64,');
      const mimeMatch = parts[0].match(/:(.*?)$/);
      if (mimeMatch && mimeMatch[1]) {
        const mimeType = mimeMatch[1];
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

    const publicUrl = `/uploads/${safeFolder}/${finalFilename}`;

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Image uploaded successfully to server storage.',
      url: publicUrl,
      path: publicUrl,
      filename: finalFilename,
      size: buffer.length,
    });
  } catch (error) {
    console.error('Server upload error:', error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Failed to save uploaded image on server.',
      error: error.message,
    });
  }
});

export default router;
