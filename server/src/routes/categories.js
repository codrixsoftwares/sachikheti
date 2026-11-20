import express from 'express';
import prisma from '../prisma.js';
import { verifyAdminToken } from '../middleware/auth.js';
import { broadcastRealtimeUpdate } from '../lib/broadcast.js';

const router = express.Router();

// Helper to generate URL-safe slug
function generateSlug(name) {
  const ascii = (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return ascii || `category-${Date.now().toString().slice(-6)}`;
}

// GET /api/categories - public
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// POST /api/categories (Admin Only) - Create a new category
router.post('/', verifyAdminToken, async (req, res) => {
  try {
    const { name, slug, description, icon, namePunjabi, imageUrl } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    let finalSlug = (slug && slug.trim()) ? slug.trim().toLowerCase() : generateSlug(name);
    if (!finalSlug) finalSlug = generateSlug(name);

    // Auto-resolve any slug collision by appending a counter
    let candidateSlug = finalSlug;
    let counter = 1;
    while (await prisma.category.findUnique({ where: { slug: candidateSlug } })) {
      candidateSlug = `${finalSlug}-${counter++}`;
    }
    finalSlug = candidateSlug;

    let newCategory;
    try {
      newCategory = await prisma.category.create({
        data: {
          name: name.trim(),
          namePunjabi: (namePunjabi && namePunjabi.trim()) ? namePunjabi.trim() : name.trim(),
          slug: finalSlug,
          description: description ? description.trim() : null,
          icon: icon ? icon.trim() : 'package',
          imageUrl: imageUrl ? imageUrl.trim() : null,
        },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });
    } catch (createErr) {
      console.warn('Prisma create with imageUrl failed, retrying without imageUrl field:', createErr.message);
      // Defensive fallback if the database column imageUrl is pending migration
      newCategory = await prisma.category.create({
        data: {
          name: name.trim(),
          namePunjabi: (namePunjabi && namePunjabi.trim()) ? namePunjabi.trim() : name.trim(),
          slug: finalSlug,
          description: description ? description.trim() : null,
          icon: icon ? icon.trim() : 'package',
        },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });
    }

    // Real-time WebSocket IO Broadcast with Live Overview Metrics
    try {
      const io = req.app.get('io');
      if (io) {
        await broadcastRealtimeUpdate(io, 'categories:updated', { action: 'create', category: newCategory });
        io.emit('catalogs:updated', { action: 'create', category: newCategory });
      }
    } catch (ioErr) {
      console.warn('Socket broadcast warning:', ioErr.message);
    }

    res.status(201).json({ success: true, message: 'Category created successfully', data: newCategory });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create category' });
  }
});

// PUT /api/categories/:id (Admin Only) - Update a category
router.put('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, namePunjabi, imageUrl } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (namePunjabi !== undefined) updateData.namePunjabi = (namePunjabi && namePunjabi.trim()) ? namePunjabi.trim() : updateData.name || '';
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (icon !== undefined) updateData.icon = icon ? icon.trim() : null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl ? imageUrl.trim() : null;
    if (slug !== undefined && slug.trim()) {
      let candidateSlug = slug.trim().toLowerCase();
      // Verify candidateSlug doesn't collide with another category
      const clash = await prisma.category.findFirst({
        where: { slug: candidateSlug, NOT: { id } }
      });
      if (clash) {
        candidateSlug = `${candidateSlug}-${Date.now().toString().slice(-4)}`;
      }
      updateData.slug = candidateSlug;
    }

    let updated;
    try {
      updated = await prisma.category.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: { products: true }
          }
        }
      });
    } catch (updateErr) {
      console.warn('Prisma update with imageUrl failed, retrying without imageUrl field:', updateErr.message);
      const fallbackData = { ...updateData };
      delete fallbackData.imageUrl;
      updated = await prisma.category.update({
        where: { id },
        data: fallbackData,
        include: {
          _count: {
            select: { products: true }
          }
        }
      });
    }

    // Real-time WebSocket IO Broadcast with Live Overview Metrics
    try {
      const io = req.app.get('io');
      if (io) {
        await broadcastRealtimeUpdate(io, 'categories:updated', { action: 'update', category: updated });
        io.emit('catalogs:updated', { action: 'update', category: updated });
      }
    } catch (ioErr) {
      console.warn('Socket broadcast warning:', ioErr.message);
    }

    res.json({ success: true, message: 'Category updated successfully', data: updated });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update category' });
  }
});

// DELETE /api/categories/:id (Admin Only) - Delete a category
router.delete('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    // Delete associated products first if any exist to prevent foreign key errors
    await prisma.product.deleteMany({ where: { categoryId: id } });
    await prisma.category.delete({
      where: { id }
    });

    // Real-time WebSocket IO Broadcast with Live Overview Metrics
    try {
      const io = req.app.get('io');
      if (io) {
        await broadcastRealtimeUpdate(io, 'categories:updated', { action: 'delete', id });
        io.emit('catalogs:updated', { action: 'delete', id });
      }
    } catch (ioErr) {
      console.warn('Socket broadcast warning:', ioErr.message);
    }

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete category' });
  }
});

export default router;
