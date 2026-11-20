import express from 'express';
import prisma from '../prisma.js';
import { verifyAdminToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Compute real-time aggregated metrics directly from SQLite database via Prisma.
 */
export async function calculateLiveMetrics() {
  const [
    orders,
    products,
    categories,
    recentOrders
  ] = await Promise.all([
    prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        totalAmount: true,
        orderStatus: true,
        paymentMethod: true,
        paymentStatus: true,
        items: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.product.findMany({
      select: {
        id: true,
        title: true,
        categoryId: true,
        price: true,
        inStock: true,
        stockCount: true,
      }
    }),
    prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    }),
    prisma.order.findMany({
      take: 7,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        totalAmount: true,
        orderStatus: true,
        createdAt: true,
      }
    })
  ]);

  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter(o => o.orderStatus !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const pendingOrders = orders.filter(o => o.orderStatus === 'PENDING').length;
  const confirmedOrders = orders.filter(o => ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.orderStatus)).length;
  const processingOrders = orders.filter(o => ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.orderStatus)).length;
  const shippedOrders = orders.filter(o => ['SHIPPED', 'DELIVERED'].includes(o.orderStatus)).length;
  const deliveredOrders = orders.filter(o => o.orderStatus === 'DELIVERED').length;
  const cancelledOrders = orders.filter(o => o.orderStatus === 'CANCELLED').length;

  const totalProducts = products.length;
  const inStockProducts = products.filter(p => p.inStock).length;
  const outOfStockProducts = totalProducts - inStockProducts;
  const totalCategories = categories.length;

  // Category sales mapping
  const categorySalesMap = {};
  categories.forEach(c => {
    categorySalesMap[c.id] = {
      id: c.id,
      name: c.name,
      sales: 0,
      units: 0,
      productCount: c._count?.products || 0,
    };
  });

  orders.forEach(o => {
    if (o.orderStatus === 'CANCELLED') return;
    try {
      const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
      (items || []).forEach(item => {
        const prod = products.find(p => p.id === item.productId || p.title === item.title);
        const catId = prod?.categoryId || (categories.length > 0 ? categories[0].id : null);
        if (catId && categorySalesMap[catId]) {
          categorySalesMap[catId].sales += (item.price || 0) * (item.quantity || 1);
          categorySalesMap[catId].units += (item.quantity || 1);
        }
      });
    } catch (e) {}
  });

  const categorySalesList = Object.values(categorySalesMap);
  const maxCategorySales = Math.max(...categorySalesList.map(c => c.sales), 1);

  // Revenue channels
  const whatsappRevenue = orders
    .filter(o => o.paymentMethod === 'WHATSAPP' && o.orderStatus !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const onlineRevenue = orders
    .filter(o => o.paymentMethod !== 'WHATSAPP' && o.orderStatus !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalValidRevenue = (whatsappRevenue + onlineRevenue) || 1;
  const whatsappRatio = Math.round((whatsappRevenue / totalValidRevenue) * 100) || 50;
  const onlineRatio = 100 - whatsappRatio;

  // Timeline points for recent orders
  const timelinePoints = recentOrders.map(o => ({
    label: new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    amount: o.totalAmount || 0,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    status: o.orderStatus
  })).reverse();

  return {
    totalRevenue,
    totalOrders,
    pendingOrders,
    confirmedOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalProducts,
    inStockProducts,
    outOfStockProducts,
    totalCategories,
    whatsappRevenue,
    onlineRevenue,
    whatsappRatio,
    onlineRatio,
    categorySalesList,
    maxCategorySales,
    timelinePoints,
    lastUpdated: new Date().toISOString()
  };
}

// GET /api/admin/metrics
router.get('/', verifyAdminToken, async (req, res) => {
  try {
    const metrics = await calculateLiveMetrics();
    res.status(200).json({
      success: true,
      statusCode: 200,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Failed to compute live overview metrics.',
      error: error.message
    });
  }
});

export default router;
