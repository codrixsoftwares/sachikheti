import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Package,
  ShoppingBag,
  TrendingUp,
  LogOut,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  X,
  AlertCircle,
  Search,
  Filter,
  ExternalLink,
  ArrowLeft,
  RefreshCw,
  Eye,
  Check,
  Layers,
  Megaphone,
  Menu,
  Phone,
  Truck,
  MapPin,
  Calendar,
  FolderPlus,
  UploadCloud,
  Database,
  Receipt,
  Printer,
  Send,
  Minus,
  ShoppingCart,
  CreditCard,
  FileText,
  Tag,
  User,
  Settings,
  Store,
  MessageSquare,
  Palette,
  QrCode,
  Share2,
  CheckSquare,
  History,
  Download,
  FileSpreadsheet,
  DollarSign,
  ArrowUpDown,
  Tractor,
  Timer,
  AlertTriangle,
  Lock,
  EyeOff,
  Key
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  uploadImageToSupabase,
  testSupabaseConnection
} from '../lib/supabase';
import { getSocket } from '../lib/socket';

export default function AdminPortalPage({ onNavigateHome }) {
  const [token, setToken] = useState(() => localStorage.getItem('sachikheti_admin_token') || '');
  const [adminUser, setAdminUser] = useState(null);

  // Supabase storage & configuration state
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseConfig);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [supabaseForm, setSupabaseForm] = useState({
    url: supabaseConfig.url,
    anonKey: supabaseConfig.anonKey,
    bucket: supabaseConfig.bucket,
  });
  const [testResult, setTestResult] = useState(null);
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [uploadingCategoryImg, setUploadingCategoryImg] = useState(false);
  const [categoryUploadStatus, setCategoryUploadStatus] = useState('');
  const [uploadingProductImg, setUploadingProductImg] = useState(false);
  const [productUploadStatus, setProductUploadStatus] = useState('');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Navigation tab state: 'overview' | 'products' | 'categories' | 'orders' | 'banner'
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Live database state
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banner, setBanner] = useState({ id: 'welcome-banner-1', title: '', message: '', isActive: true });
  const [loadingData, setLoadingData] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Real-time Overview Metrics & WebSocket connection state
  const [serverMetrics, setServerMetrics] = useState(null);
  const [realtimeAlert, setRealtimeAlert] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Search & Filter controls
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductCategory, setSelectedProductCategory] = useState('all');
  const [productListingFilter, setProductListingFilter] = useState('all'); // 'all', 'featured', 'rent', 'sale'
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Custom Billing / Virtual Cart state
  const [billingCart, setBillingCart] = useState([]);
  const [billingCustomer, setBillingCustomer] = useState({
    name: '',
    phone: '',
    address: 'Counter Store Sale / Local Delivery',
    city: 'Fatehabad',
    pincode: '125050',
    paymentMethod: 'CASH',
    paymentStatus: 'PAID',
    notes: '',
  });
  const [billingDiscount, setBillingDiscount] = useState(0);
  const [billingDelivery, setBillingDelivery] = useState(0);
  const [billingSearch, setBillingSearch] = useState('');
  const [billingCategoryFilter, setBillingCategoryFilter] = useState('all');
  const [billingListingFilter, setBillingListingFilter] = useState('all'); // 'all', 'sale', 'rent', 'featured'
  const [billingBillType, setBillingBillType] = useState('auto'); // 'auto', 'direct_sale', 'rental', 'combined'
  const [billingRentalDetails, setBillingRentalDetails] = useState({
    tenure: '1 Acre',
    penaltyPerHour: 250,
    penaltyPerAcre: 500,
    gracePeriod: '1 Hour',
    startDate: '',
    returnDate: '',
    operatorIncluded: true,
    securityDeposit: 0,
  });
  const [sendingBillPdf, setSendingBillPdf] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [generatingBill, setGeneratingBill] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);

  // Past Orders & Bills History State
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all'); // 'all', 'pos', 'store', 'whatsapp'
  const [historyPaymentStatusFilter, setHistoryPaymentStatusFilter] = useState('all'); // 'all', 'PAID', 'PENDING'
  const [historyPaymentMethodFilter, setHistoryPaymentMethodFilter] = useState('all'); // 'all', 'CASH', 'UPI', 'BANK_TRANSFER', 'RAZORPAY', 'CREDIT', 'WHATSAPP'
  const [historyDatePreset, setHistoryDatePreset] = useState('all'); // 'all', 'today', 'yesterday', '7days', '30days'
  const [historySort, setHistorySort] = useState('newest'); // 'newest', 'oldest', 'highest', 'lowest'
  const [historyViewMode, setHistoryViewMode] = useState('table'); // 'table', 'cards'
  const [historyActiveSheet, setHistoryActiveSheet] = useState('all'); // 'all', 'pos', 'rental', 'due', 'online'
  const [selectedHistoryRowId, setSelectedHistoryRowId] = useState(null);

  const [customItemForm, setCustomItemForm] = useState({
    title: '',
    titlePunjabi: '',
    price: '',
    quantity: 1,
    unit: 'Unit',
  });

  // Settings & WhatsApp Baileys Integration state
  const [settingsSubTab, setSettingsSubTab] = useState('ribbon'); // 'ribbon', 'whatsapp', 'bill'
  const [whatsappStatus, setWhatsappStatus] = useState({ status: 'DISCONNECTED', qr: null, user: null });
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);
  const [syncingWhatsApp, setSyncingWhatsApp] = useState(false);
  const [resettingWhatsApp, setResettingWhatsApp] = useState(false);
  const [whatsappTestPhone, setWhatsappTestPhone] = useState('');
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  // Customized Bill Design state
  const [billDesign, setBillDesign] = useState({
    companyName: 'ਸੱਚੀ ਖੇਤੀ | SachiKheti (LFPC Ltd.)',
    tagline: 'Direct Farmer Prosperity • Certified Natural Produce & Farm Machinery',
    gstin: 'FSSAI: 20822005001234 | GSTIN: 06AABCL1234E1Z5',
    address: 'VPO Bhirdana, District Fatehabad, Haryana - 125050',
    phone: '+91 8360253372',
    email: 'support@sachikheti.com',
    billTitle: 'TAX INVOICE / CASH MEMO',
    rentalBillTitle: 'AGRICULTURAL MACHINERY CUSTOM HIRING & RENTAL AGREEMENT',
    defaultRentalTenure: '1 Acre',
    defaultPenaltyPerHour: 250,
    defaultPenaltyPerAcre: 500,
    defaultGracePeriod: '1 Hour',
    defaultSecurityDeposit: 0,
    rentalTermsNotes: '1. Machinery is delivered in verified operational condition.\n2. Overdue usage beyond agreed tenure incurs penalty charges at standard agreed rates.\n3. Fuel/Diesel & routine operational care is the responsibility of the hirer unless operator is supplied.\n4. Hirer is responsible for accidental damage caused by negligence.',
    accentColor: '#15733E',
    themeName: 'forest',
    showLogo: true,
    showSignature: true,
    termsNotes: '1. Certified direct farm produce & agricultural machinery custom hiring.\n2. Goods once delivered are verified fresh.\n3. Thank you for supporting indigenous farmers!',
    authorizedSignatoryTitle: 'Authorized Store Manager (LFPC Ltd.)'
  });
  const [savingBillDesign, setSavingBillDesign] = useState(false);

  // Dynamic Razorpay Payment Gateway state (Admin controlled)
  const [razorpaySettings, setRazorpaySettings] = useState({
    razorpayEnabled: false,
    razorpayKeyId: '',
    razorpayKeySecret: '',
    merchantName: 'ਸੱਚੀ ਖੇਤੀ | SachiKheti',
    currency: 'INR',
  });
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);
  const [savingGateway, setSavingGateway] = useState(false);

  // Quick Stock & Quantity Adjustment Modal state
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [stockQuantityInput, setStockQuantityInput] = useState(50);
  const [stockStatusToggle, setStockStatusToggle] = useState(true);
  const [savingStockModal, setSavingStockModal] = useState(false);

  // Product Add / Edit Modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    title: '',
    titlePunjabi: '',
    categoryId: '',
    price: '',
    unit: '1 kg',
    imageUrl: '',
    description: '',
    inStock: true,
    stockCount: 50,
    featured: false,
    specs: '',
    productType: 'produce', // 'produce' | 'machinery'
    isForSale: true,
    isForRent: false,
    workingCapacity: '',
    workingDuration: '',
    machineType: '',
  });

  // Category Add / Edit Modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    namePunjabi: '',
    slug: '',
    description: '',
    icon: 'package',
    imageUrl: '',
  });

  // Order Add / Edit Modal state (Full Database CRUD)
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    address: '',
    city: 'Fatehabad',
    pincode: '',
    totalAmount: '',
    paymentMethod: 'WHATSAPP',
    orderStatus: 'PENDING',
    paymentStatus: 'PENDING',
    itemsText: '',
    notes: '',
  });

  // Helper to auto-generate slug from name
  const slugify = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Verify token on mount
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAdminUser(data.admin);
            loadAllData();
          } else {
            handleLogout();
          }
        })
        .catch(() => handleLogout());
    }
  }, [token]);

  const loadAllData = async () => {
    try {
      setLoadingData(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [ordersRes, productsRes, categoriesRes, bannersRes, metricsRes, waRes, billDesignRes, gatewayRes] = await Promise.all([
        fetch('/api/orders', { headers }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch('/api/products').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('/api/categories').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('/api/banners').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('/api/admin/metrics', { headers }).then(r => r.json()).catch(() => null),
        fetch('/api/whatsapp/status').then(r => r.json()).catch(() => null),
        fetch('/api/settings/bill-design').then(r => r.json()).catch(() => null),
        fetch('/api/settings/payment-gateway').then(r => r.json()).catch(() => null),
      ]);

      if (ordersRes.success) setOrders(ordersRes.data || []);
      if (productsRes.success) setProducts(productsRes.data || []);
      if (categoriesRes.success) setCategories(categoriesRes.data || []);
      if (bannersRes.success && bannersRes.data && bannersRes.data.length > 0) {
        setBanner(bannersRes.data[0]);
      }
      if (metricsRes?.success && metricsRes.data) {
        setServerMetrics(metricsRes.data);
      }
      if (waRes?.success) {
        setWhatsappStatus(waRes);
      }
      if (billDesignRes?.success && billDesignRes.data) {
        setBillDesign(prev => ({ ...prev, ...billDesignRes.data }));
      }
      if (gatewayRes?.success && gatewayRes.data) {
        setRazorpaySettings(gatewayRes.data);
      }
    } catch (err) {
      console.error('Error refreshing admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Real-time WebSocket IO listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    if (socket.connected) {
      setSocketConnected(true);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Live Metrics Update Push from Database
    const handleMetricsUpdate = (newMetrics) => {
      if (newMetrics) {
        setServerMetrics(newMetrics);
      }
    };

    // Live Orders Update with Sound Chime & Visual Notification
    const handleOrderRealtime = (data) => {
      if (data?.action === 'create' && data.order) {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
          }
        } catch (e) {}

        setRealtimeAlert(`🔔 New Order Received: #${data.order.orderNumber} (₹${data.order.totalAmount}) from ${data.order.customerName}`);
        setTimeout(() => setRealtimeAlert(null), 8000);
      }
      loadAllData();
    };

    const handleGenericRefresh = () => {
      loadAllData();
    };

    const handleWhatsAppRealtime = (waData) => {
      if (waData) {
        setWhatsappStatus(waData);
      }
    };

    const handleBillDesignRealtime = (newDesign) => {
      if (newDesign) {
        setBillDesign(prev => ({ ...prev, ...newDesign }));
      }
    };

    const handleGatewayRealtime = (gwData) => {
      if (gwData) {
        setRazorpaySettings(gwData);
      }
    };

    socket.on('metrics:updated', handleMetricsUpdate);
    socket.on('orders:updated', handleOrderRealtime);
    socket.on('categories:updated', handleGenericRefresh);
    socket.on('catalogs:updated', handleGenericRefresh);
    socket.on('products:updated', handleGenericRefresh);
    socket.on('banners:updated', handleGenericRefresh);
    socket.on('whatsapp:status', handleWhatsAppRealtime);
    socket.on('settings:bill-design-updated', handleBillDesignRealtime);
    socket.on('settings:payment-gateway-updated', handleGatewayRealtime);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('metrics:updated', handleMetricsUpdate);
      socket.off('orders:updated', handleOrderRealtime);
      socket.off('categories:updated', handleGenericRefresh);
      socket.off('catalogs:updated', handleGenericRefresh);
      socket.off('products:updated', handleGenericRefresh);
      socket.off('banners:updated', handleGenericRefresh);
      socket.off('whatsapp:status', handleWhatsAppRealtime);
      socket.off('settings:bill-design-updated', handleBillDesignRealtime);
      socket.off('settings:payment-gateway-updated', handleGatewayRealtime);
    };
  }, [token]);

  const handleUploadCategoryImg = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCategoryImg(true);
      setCategoryUploadStatus('Uploading image...');
      const res = await uploadImageToSupabase(file, 'catalogs');
      if (res.success) {
        setCategoryForm((prev) => ({ ...prev, imageUrl: res.url }));
        setCategoryUploadStatus(res.isLocalFallback ? '✓ Image saved to local server storage!' : '✓ Uploaded to Supabase CDN!');
      } else {
        setCategoryUploadStatus(`Upload failed: ${res.error}`);
      }
    } catch (err) {
      setCategoryUploadStatus(`Error: ${err.message}`);
    } finally {
      setUploadingCategoryImg(false);
    }
  };

  const handleUploadProductImg = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingProductImg(true);
      setProductUploadStatus('Uploading image...');
      const res = await uploadImageToSupabase(file, 'products');
      if (res.success) {
        setProductForm((prev) => ({ ...prev, imageUrl: res.url }));
        setProductUploadStatus(res.isLocalFallback ? '✓ Image saved to local server storage!' : '✓ Uploaded to Supabase CDN!');
      } else {
        setProductUploadStatus(`Upload failed: ${res.error}`);
      }
    } catch (err) {
      setProductUploadStatus(`Error: ${err.message}`);
    } finally {
      setUploadingProductImg(false);
    }
  };

  const handleTestSupabase = async () => {
    try {
      setTestingSupabase(true);
      setTestResult(null);
      saveSupabaseConfig(supabaseForm);
      const res = await testSupabaseConnection();
      setTestResult(res);
      setSupabaseConfig(getSupabaseConfig());
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestingSupabase(false);
    }
  };

  const handleSaveSupabaseConfig = () => {
    saveSupabaseConfig(supabaseForm);
    const updated = getSupabaseConfig();
    setSupabaseConfig(updated);
    alert('Supabase configuration saved successfully!');
    setShowSupabaseModal(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('sachikheti_admin_token', data.token);
        setToken(data.token);
        setAdminUser(data.admin);
        setActionSuccess('Welcome back, Superadmin! Live database connected.');
        setTimeout(() => setActionSuccess(''), 4000);
      } else {
        setLoginError(data.message || 'Invalid username or password.');
      }
    } catch (err) {
      setLoginError('Cannot connect to authentication service.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sachikheti_admin_token');
    setToken('');
    setAdminUser(null);
    setUsername('');
    setPassword('');
  };

  // ==========================================
  // PRODUCT MANAGEMENT HANDLERS
  // ==========================================
  const openAddProductModal = (initialType = 'produce') => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      titlePunjabi: '',
      categoryId: categories[0]?.id || '',
      price: '',
      unit: initialType === 'machinery' ? '1 Acre' : '1 kg',
      imageUrl: '',
      description: '',
      inStock: true,
      stockCount: initialType === 'machinery' ? 1 : 50,
      featured: false,
      specs: '',
      productType: initialType,
      isForSale: true,
      isForRent: initialType === 'machinery',
      workingCapacity: initialType === 'machinery' ? '1 Acre' : '',
      workingDuration: '',
      machineType: '',
    });
    setProductUploadStatus('');
    setShowProductModal(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    let parsedSpecs = {};
    try {
      if (product.specs) {
        parsedSpecs = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs;
      }
    } catch (e) {
      parsedSpecs = {};
    }

    let isRental = false;
    let isSale = true;
    if (parsedSpecs.isForRent !== undefined) {
      isRental = Boolean(parsedSpecs.isForRent);
    } else if (parsedSpecs['Listing Type']) {
      isRental = parsedSpecs['Listing Type'].toLowerCase().includes('rent');
    } else {
      const unit = (product.unit || '').toLowerCase();
      const cat = (product.category?.name || product.category?.slug || '').toLowerCase();
      isRental = unit.includes('acre') || unit.includes('hour') || cat.includes('machin') || cat.includes('rent');
    }

    if (parsedSpecs.isForSale !== undefined) {
      isSale = Boolean(parsedSpecs.isForSale);
    } else if (parsedSpecs['Listing Type']) {
      isSale = parsedSpecs['Listing Type'].toLowerCase().includes('sale') || !isRental;
    } else {
      isSale = !isRental || Boolean(parsedSpecs.isForSale);
    }

    if (!isRental && !isSale) {
      isSale = true;
    }

    const isMachinery = Boolean(
      parsedSpecs.productType === 'machinery' ||
      parsedSpecs.machineType ||
      parsedSpecs['Machine Type'] ||
      parsedSpecs.workingCapacity ||
      parsedSpecs['Working Capacity'] ||
      product.unit?.includes('Acre') ||
      product.unit?.includes('Hour')
    );

    setProductForm({
      title: product.title || '',
      titlePunjabi: product.titlePunjabi || product.title || '',
      categoryId: product.categoryId || categories[0]?.id || '',
      price: product.price !== undefined ? product.price.toString() : '',
      unit: product.unit || '1 kg',
      imageUrl: product.imageUrl || '',
      description: product.description || '',
      inStock: Boolean(product.inStock),
      stockCount: product.stockCount !== undefined ? product.stockCount : 50,
      featured: Boolean(product.featured),
      specs: product.specs || '',
      productType: isMachinery ? 'machinery' : 'produce',
      isForSale: isSale,
      isForRent: isRental,
      workingCapacity: parsedSpecs['Working Capacity'] || parsedSpecs.workingCapacity || '',
      workingDuration: parsedSpecs['Working Duration / Availability'] || parsedSpecs['Working Duration'] || parsedSpecs['Availability'] || parsedSpecs.workingDuration || '',
      machineType: parsedSpecs['Machine Type'] || parsedSpecs.machineType || '',
    });
    setProductUploadStatus('');
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      // Parse any pre-existing specs first
      let baseSpecs = {};
      if (typeof productForm.specs === 'string' && productForm.specs.trim()) {
        try {
          baseSpecs = JSON.parse(productForm.specs);
        } catch (e) {
          baseSpecs = { Notes: productForm.specs.trim() };
        }
      }

      // Explicitly override with user's latest form selections
      const specsObj = {
        ...baseSpecs,
        isForRent: Boolean(productForm.isForRent),
        isForSale: Boolean(productForm.isForSale),
        productType: productForm.productType,
      };

      if (productForm.isForRent && productForm.isForSale) {
        specsObj['Listing Type'] = 'Available for Rent & Sale';
      } else if (productForm.isForRent) {
        specsObj['Listing Type'] = 'Available for Rent (Custom Hiring)';
      } else {
        specsObj['Listing Type'] = 'Direct Sale';
      }

      if (productForm.workingCapacity && productForm.workingCapacity.trim()) {
        specsObj['Working Capacity'] = productForm.workingCapacity.trim();
      } else {
        delete specsObj['Working Capacity'];
      }

      if (productForm.workingDuration && productForm.workingDuration.trim()) {
        specsObj['Working Duration / Availability'] = productForm.workingDuration.trim();
      } else {
        delete specsObj['Working Duration / Availability'];
      }

      if (productForm.machineType && productForm.machineType.trim()) {
        specsObj['Machine Type'] = productForm.machineType.trim();
      } else {
        delete specsObj['Machine Type'];
      }

      const payload = {
        title: productForm.title.trim(),
        titlePunjabi: (productForm.titlePunjabi && productForm.titlePunjabi.trim())
          ? productForm.titlePunjabi.trim()
          : productForm.title.trim(),
        categoryId: productForm.categoryId,
        price: parseFloat(String(productForm.price || '0').replace(/[^0-9.]/g, '')) || 0,
        unit: productForm.unit.trim() || '1 kg',
        imageUrl: productForm.imageUrl.trim() || 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
        description: productForm.description.trim(),
        inStock: Boolean(productForm.inStock),
        stockCount: parseInt(productForm.stockCount, 10) || 0,
        featured: Boolean(productForm.featured),
        specs: JSON.stringify(specsObj),
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowProductModal(false);
        setActionSuccess(editingProduct ? 'Product updated successfully!' : 'New agricultural product created and live in catalog!');
        setTimeout(() => setActionSuccess(''), 4000);
        loadAllData();
      } else {
        alert(data.message || 'Error saving product');
      }
    } catch (err) {
      alert('Network error while saving product');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`"${title}" deleted from catalog.`);
        setTimeout(() => setActionSuccess(''), 4000);
        loadAllData();
      } else {
        alert(data.message || 'Failed to delete product');
      }
    } catch (err) {
      alert('Error deleting product');
    }
  };

  const handleToggleStock = async (product) => {
    try {
      const nextStock = !product.inStock;
      const nextCount = nextStock ? (product.stockCount > 0 ? product.stockCount : 50) : 0;
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ inStock: nextStock, stockCount: nextCount })
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`✓ "${product.title}" is now ${nextStock ? `IN STOCK (${nextCount} units)` : 'OUT OF STOCK (0 units)'}.`);
        setTimeout(() => setActionSuccess(''), 3000);
        loadAllData();
      }
    } catch (err) {
      alert('Error updating stock status');
    }
  };

  const openStockModal = (product) => {
    setStockModalProduct(product);
    const qty = product.stockCount !== undefined && product.stockCount !== null ? product.stockCount : (product.inStock ? 50 : 0);
    setStockQuantityInput(qty);
    setStockStatusToggle(Boolean(product.inStock && qty > 0));
  };

  const handleSaveStockModal = async (e) => {
    if (e) e.preventDefault();
    if (!stockModalProduct) return;
    setSavingStockModal(true);
    try {
      const qty = Math.max(0, parseInt(stockQuantityInput, 10) || 0);
      const isStock = stockStatusToggle && qty > 0;
      const res = await fetch(`/api/products/${stockModalProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ inStock: isStock, stockCount: qty })
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`✓ "${stockModalProduct.title}" stock updated: ${isStock ? `IN STOCK (${qty} units)` : 'OUT OF STOCK (0 units)'}`);
        setTimeout(() => setActionSuccess(''), 4000);
        setStockModalProduct(null);
        loadAllData();
      } else {
        alert(data.message || 'Failed to update stock');
      }
    } catch (err) {
      alert('Error updating stock and quantity');
    } finally {
      setSavingStockModal(false);
    }
  };

  // ==========================================
  // CATEGORY MANAGEMENT HANDLERS
  // ==========================================
  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryUploadStatus('');
    setCategoryForm({
      name: '',
      namePunjabi: '',
      slug: '',
      description: '',
      icon: 'package',
      imageUrl: '',
    });
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (category) => {
    setEditingCategory(category);
    setCategoryUploadStatus('');
    setCategoryForm({
      name: category.name,
      namePunjabi: category.namePunjabi || category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || 'package',
      imageUrl: category.imageUrl || '',
    });
    setShowCategoryModal(true);
  };

  const handleCategoryNameChange = (e) => {
    const name = e.target.value;
    if (!editingCategory) {
      // Auto-generate slug when creating new
      setCategoryForm({
        ...categoryForm,
        name,
        slug: slugify(name),
      });
    } else {
      setCategoryForm({
        ...categoryForm,
        name,
      });
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      alert('Please enter a category name');
      return;
    }
    setSavingCategory(true);
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const payload = {
        name: categoryForm.name.trim(),
        namePunjabi: (categoryForm.namePunjabi && categoryForm.namePunjabi.trim()) ? categoryForm.namePunjabi.trim() : categoryForm.name.trim(),
        slug: categoryForm.slug.trim() || slugify(categoryForm.name),
        description: categoryForm.description.trim(),
        icon: categoryForm.icon,
        imageUrl: categoryForm.imageUrl ? categoryForm.imageUrl.trim() : null,
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowCategoryModal(false);
        setActionSuccess(editingCategory ? 'Category updated successfully!' : 'New category created! Visible across the entire store.');
        setTimeout(() => setActionSuccess(''), 4000);
        loadAllData();
      } else {
        alert(data.message || 'Error saving category');
      }
    } catch (err) {
      alert('Network error while saving category');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id, name, productCount) => {
    if (productCount > 0) {
      if (!window.confirm(`Warning: Category "${name}" contains ${productCount} active products. Deleting it may impact these products. Proceed anyway?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    }

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Category "${name}" deleted.`);
        setTimeout(() => setActionSuccess(''), 4000);
        loadAllData();
      } else {
        alert(data.message || 'Failed to delete category');
      }
    } catch (err) {
      alert('Error deleting category');
    }
  };

  // ==========================================
  // CUSTOM BILLING & VIRTUAL CART HANDLERS
  // ==========================================
  const addToBillingCart = (product) => {
    setBillingCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          title: product.title,
          titlePunjabi: product.titlePunjabi || product.title,
          price: product.price,
          originalPrice: product.price,
          unit: product.unit || '1 kg',
          imageUrl: product.imageUrl || '',
          quantity: 1,
        },
      ];
    });
  };

  const updateCartQty = (id, delta) => {
    setBillingCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const updateCartPrice = (id, newPrice) => {
    const parsed = parseFloat(String(newPrice).replace(/[^0-9.]/g, '')) || 0;
    setBillingCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, price: parsed } : item))
    );
  };

  const removeFromBillingCart = (id) => {
    setBillingCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearBillingCart = () => {
    if (billingCart.length === 0) return;
    if (window.confirm('Clear all items from the current virtual cart?')) {
      setBillingCart([]);
      setBillingDiscount(0);
      setBillingDelivery(0);
    }
  };

  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (!customItemForm.title.trim()) {
      alert('Please enter a description for the custom item');
      return;
    }
    const price = parseFloat(String(customItemForm.price).replace(/[^0-9.]/g, '')) || 0;
    const quantity = parseInt(customItemForm.quantity, 10) || 1;
    const customItem = {
      id: `custom-${Date.now()}`,
      title: customItemForm.title.trim(),
      titlePunjabi: customItemForm.titlePunjabi?.trim() || customItemForm.title.trim(),
      price,
      originalPrice: price,
      quantity,
      unit: customItemForm.unit || 'Unit',
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
      isCustom: true,
    };
    setBillingCart((prev) => [...prev, customItem]);
    setCustomItemForm({ title: '', titlePunjabi: '', price: '', quantity: 1, unit: 'Unit' });
    setShowCustomItemModal(false);
  };

  const billingSubtotal = billingCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const billingGrandTotal = Math.max(0, billingSubtotal - Number(billingDiscount || 0) + Number(billingDelivery || 0));

  const buildCurrentVirtualInvoice = () => {
    const invNumber = `SK-BILL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const hasRentalItems = billingCart.some((it) => {
      const u = (it.unit || '').toLowerCase();
      const t = (it.title || '').toLowerCase();
      return it.isRental || it.isForRent || u.includes('acre') || u.includes('hour') || t.includes('tractor') || t.includes('leveler') || t.includes('planter') || t.includes('digger') || t.includes('seeder');
    });
    const effectiveBillType = billingBillType === 'auto'
      ? (hasRentalItems ? 'rental' : 'direct_sale')
      : billingBillType;

    const isRentalMode = effectiveBillType === 'rental' || effectiveBillType === 'combined';

    return {
      orderNumber: invNumber,
      customerName: billingCustomer.name.trim() || 'Direct Store Customer',
      customerPhone: billingCustomer.phone.trim() || '8360253372',
      address: billingCustomer.address.trim() || 'Store Direct / Local Delivery',
      city: billingCustomer.city.trim() || 'Fatehabad',
      pincode: billingCustomer.pincode.trim() || '125050',
      items: billingCart.map((i) => ({
        id: i.id,
        title: i.title,
        price: i.price,
        quantity: i.quantity,
        unit: i.unit,
        isRental: i.isRental || i.isForRent || (i.unit && (i.unit.toLowerCase().includes('acre') || i.unit.toLowerCase().includes('hour'))),
        subtotal: i.price * i.quantity,
      })),
      totalAmount: billingGrandTotal,
      subtotal: billingSubtotal,
      discount: Number(billingDiscount || 0),
      delivery: Number(billingDelivery || 0),
      paymentMethod: billingCustomer.paymentMethod,
      paymentStatus: billingCustomer.paymentStatus,
      billType: effectiveBillType,
      rentalDetails: isRentalMode ? {
        tenure: billingRentalDetails.tenure || billDesign.defaultRentalTenure || '1 Acre',
        penaltyRate: `₹${billingRentalDetails.penaltyPerHour || billDesign.defaultPenaltyPerHour || 250}/extra hr | ₹${billingRentalDetails.penaltyPerAcre || billDesign.defaultPenaltyPerAcre || 500}/extra acre`,
        penaltyPerHour: Number(billingRentalDetails.penaltyPerHour || billDesign.defaultPenaltyPerHour || 250),
        penaltyPerAcre: Number(billingRentalDetails.penaltyPerAcre || billDesign.defaultPenaltyPerAcre || 500),
        gracePeriod: billingRentalDetails.gracePeriod || billDesign.defaultGracePeriod || '1 Hour',
        operatorIncluded: !!billingRentalDetails.operatorIncluded,
        securityDeposit: Number(billingRentalDetails.securityDeposit || 0),
        startDate: billingRentalDetails.startDate,
        returnDate: billingRentalDetails.returnDate,
      } : null,
      date: new Date().toISOString(),
    };
  };

  const handleDirectPrintVirtualBill = () => {
    if (billingCart.length === 0) {
      alert('Virtual cart is empty! Please add products from the catalog first.');
      return;
    }
    const inv = buildCurrentVirtualInvoice();
    setGeneratedInvoice(inv);
    setShowInvoiceModal(true);
  };

  const handleDirectWhatsAppVirtualBill = () => {
    if (billingCart.length === 0) {
      alert('Virtual cart is empty! Please add products from the catalog first.');
      return;
    }
    const inv = buildCurrentVirtualInvoice();
    handleWhatsAppInvoice(inv);
  };

  const handleCreateBill = async () => {
    if (billingCart.length === 0) {
      alert('Please add at least one item to the virtual cart before generating a bill.');
      return;
    }
    setGeneratingBill(true);
    try {
      const inv = buildCurrentVirtualInvoice();
      const payload = {
        orderNumber: inv.orderNumber,
        customerName: inv.customerName,
        customerPhone: inv.customerPhone,
        address: inv.address,
        city: inv.city,
        pincode: inv.pincode,
        items: inv.items,
        totalAmount: inv.totalAmount,
        paymentMethod: inv.paymentMethod,
        paymentStatus: inv.paymentStatus,
        orderStatus: inv.paymentStatus === 'PAID' ? 'DELIVERED' : 'CONFIRMED',
        notes: `[POS ${inv.billType === 'rental' ? 'RENTAL' : inv.billType === 'combined' ? 'COMBINED' : 'SALE'}] ${billingCustomer.notes || ''} ${inv.rentalDetails ? `| Tenure: ${inv.rentalDetails.tenure} | Penalty: ${inv.rentalDetails.penaltyRate}` : ''} | Subtotal: ₹${billingSubtotal} | Disc: ₹${billingDiscount} | Del: ₹${billingDelivery}`,
        billType: inv.billType,
        rentalDetails: inv.rentalDetails,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        const fullInvoice = {
          ...payload,
          id: data.data?.id || inv.orderNumber,
          date: new Date().toISOString(),
          subtotal: billingSubtotal,
          discount: Number(billingDiscount || 0),
          delivery: Number(billingDelivery || 0),
          items: [...billingCart],
        };
        setGeneratedInvoice(fullInvoice);
        setShowInvoiceModal(true);
        setBillingCart([]);
        setBillingDiscount(0);
        setBillingDelivery(0);
        setBillingCustomer({
          name: '',
          phone: '',
          address: 'Counter Store Sale / Local Delivery',
          city: 'Fatehabad',
          pincode: '125050',
          paymentMethod: 'CASH',
          paymentStatus: 'PAID',
          notes: '',
        });
        setActionSuccess(`Official Bill #${inv.orderNumber} generated and recorded!`);
        setTimeout(() => setActionSuccess(''), 5000);
        loadAllData();
      } else {
        alert(data.message || 'Failed to generate bill');
      }
    } catch (err) {
      alert('Network error while generating bill');
    } finally {
      setGeneratingBill(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleDownloadInvoicePDF = async (inv) => {
    if (!inv) return;
    setDownloadingPdf(true);
    try {
      const res = await fetch('/api/whatsapp/preview-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ billData: inv, billDesignOverride: billDesign })
      });
      if (!res.ok) throw new Error('PDF generation request failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const safeOrderNum = (inv.orderNumber || 'BILL').replace(/[^a-zA-Z0-9_-]/g, '_');
      const link = document.createElement('a');
      link.href = url;
      link.download = `SachiKheti_Bill_${safeOrderNum}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setActionSuccess(`✓ PDF Bill (${safeOrderNum}.pdf) downloaded successfully!`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      console.error('Download PDF error:', err);
      alert('Could not download PDF directly, opening print preview instead.');
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleWhatsAppInvoice = async (inv) => {
    if (!inv) return;
    const phone = (inv.customerPhone || '8360253372').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;

    setSendingBillPdf(true);
    try {
      // 1. If WhatsApp Baileys is active and connected, send official computer-generated PDF document!
      if (whatsappStatus?.status === 'CONNECTED') {
        const res = await fetch('/api/whatsapp/send-bill-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            phone: cleanPhone,
            billData: inv,
            billDesignOverride: billDesign
          })
        });
        const data = await res.json();
        if (data.success) {
          setActionSuccess(`✓ Official PDF Bill (${data.fileName || 'Invoice.pdf'}) dispatched directly to farmer WhatsApp (+${cleanPhone}) via Baileys!`);
          setTimeout(() => setActionSuccess(''), 6000);
          setSendingBillPdf(false);
          return;
        } else {
          console.warn('PDF dispatch returned error:', data.message);
        }
      }
    } catch (err) {
      console.warn('Baileys automated delivery error:', err.message);
    } finally {
      setSendingBillPdf(false);
    }

    // 2. Fallback to WhatsApp Web link if Baileys is not connected or experienced an issue
    const items = Array.isArray(inv.items) ? inv.items : [];
    const isRental = inv.billType === 'rental' || inv.billType === 'combined' || items.some((it) => {
      const u = (it.unit || '').toLowerCase();
      const t = (it.title || '').toLowerCase();
      return it.isRental || it.isForRent || u.includes('acre') || u.includes('hour') || t.includes('tractor') || t.includes('leveler');
    });

    const docTitle = isRental ? (billDesign.rentalBillTitle || 'AGRICULTURAL MACHINERY CUSTOM HIRING AGREEMENT') : billDesign.billTitle;
    const itemsLines = items
      .map(
        (it, idx) =>
          `${idx + 1}. *${it.title}* (${it.quantity} ${it.unit || ''}) - ₹${(it.price * it.quantity).toLocaleString('en-IN')}`
      )
      .join('\n');

    const rawMessage =
      `🌾 *${billDesign.companyName.toUpperCase()}* 🌾\n` +
      `*${docTitle}*\n` +
      `----------------------------------------\n` +
      `*Bill No:* ${inv.orderNumber}\n` +
      `*Date:* ${new Date(inv.date || Date.now()).toLocaleDateString('en-IN')}\n` +
      `*Farmer / Hirer:* ${inv.customerName}\n` +
      `*Contact:* ${inv.customerPhone}\n` +
      `*Address:* ${inv.address}, ${inv.city}\n` +
      `----------------------------------------\n` +
      `*PARTICULARS & PRODUCTS:*\n` +
      `${itemsLines}\n` +
      `----------------------------------------\n` +
      (inv.rentalDetails?.tenure ? `🚜 *Agreed Tenure:* ${inv.rentalDetails.tenure}\n` : '') +
      (inv.rentalDetails?.penaltyRate ? `⚠️ *Overdue Penalty:* ${inv.rentalDetails.penaltyRate}\n` : '') +
      (inv.rentalDetails?.gracePeriod ? `⏱️ *Grace Period Allowed:* ${inv.rentalDetails.gracePeriod}\n` : '') +
      `*Subtotal:* ₹${(inv.subtotal || inv.totalAmount).toLocaleString('en-IN')}\n` +
      (inv.discount ? `*Discount / Concession:* -₹${Number(inv.discount).toLocaleString('en-IN')}\n` : '') +
      (inv.delivery ? `*Delivery / Freight:* +₹${Number(inv.delivery).toLocaleString('en-IN')}\n` : '') +
      `*TOTAL AMOUNT:* ₹${Number(inv.totalAmount).toLocaleString('en-IN')}\n` +
      `*Payment Mode:* ${inv.paymentMethod}\n` +
      `*Payment Status:* ${inv.paymentStatus === 'PAID' ? 'PAID ✅' : 'DUE / PENDING ⏳'}\n` +
      `----------------------------------------\n` +
      `ℹ️ (Connect WhatsApp in Admin Settings to auto-dispatch computer-generated PDF bills directly!)\n` +
      `${billDesign.tagline}\n` +
      `📍 ${billDesign.address}\n` +
      `📞 ${billDesign.phone}`;

    const msg = encodeURIComponent(rawMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  // ==========================================
  // PAST ORDERS & BILLS HISTORY ACTIONS
  // ==========================================
  const handleViewPastBill = (order) => {
    let parsedItems = [];
    try {
      parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    } catch (e) {
      parsedItems = [];
    }
    let discount = 0;
    let delivery = 0;
    const notesStr = order.notes || '';
    if (notesStr) {
      const discMatch = notesStr.match(/Discount:\s*₹?([\d.]+)/i);
      const delMatch = notesStr.match(/Delivery:\s*₹?([\d.]+)/i);
      if (discMatch) discount = parseFloat(discMatch[1]) || 0;
      if (delMatch) delivery = parseFloat(delMatch[1]) || 0;
    }

    const hasRentalNote = notesStr.includes('[POS RENTAL]') || notesStr.includes('Tenure:');
    const isRentalItems = (parsedItems || []).some((it) => {
      const u = (it.unit || '').toLowerCase();
      const t = (it.title || it.name || '').toLowerCase();
      return it.isRental || it.isForRent || u.includes('acre') || u.includes('hour') || t.includes('tractor') || t.includes('leveler');
    });

    let tenure = '';
    let penaltyRate = '';
    const tenureMatch = notesStr.match(/Tenure:\s*([^|]+)/i);
    const penaltyMatch = notesStr.match(/Penalty:\s*([^|]+)/i);
    if (tenureMatch) tenure = tenureMatch[1].trim();
    if (penaltyMatch) penaltyRate = penaltyMatch[1].trim();

    const isRental = hasRentalNote || isRentalItems;

    const invoice = {
      id: order.id,
      orderNumber: order.orderNumber,
      date: order.createdAt,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      address: order.address,
      city: order.city,
      pincode: order.pincode,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus || order.status,
      notes: order.notes,
      items: (parsedItems || []).map((it) => ({
        title: it.title || it.name,
        price: Number(it.price || 0),
        quantity: Number(it.quantity || 1),
        unit: it.unit || '',
        subtotal: Number(it.price || 0) * Number(it.quantity || 1),
      })),
      subtotal: (parsedItems || []).reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0),
      discount,
      delivery,
      totalAmount: order.totalAmount,
      billType: isRental ? 'rental' : 'direct_sale',
      rentalDetails: isRental ? {
        tenure: tenure || billDesign.defaultRentalTenure || '1 Acre',
        penaltyRate: penaltyRate || `₹${billDesign.defaultPenaltyPerHour || 250}/extra hr | ₹${billDesign.defaultPenaltyPerAcre || 500}/extra acre`,
        gracePeriod: billDesign.defaultGracePeriod || '1 Hour',
        operatorIncluded: true,
      } : null,
    };
    setGeneratedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const handleWhatsAppPastBill = (order) => {
    let parsedItems = [];
    try {
      parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    } catch (e) {
      parsedItems = [];
    }
    let discount = 0;
    let delivery = 0;
    const notesStr = order.notes || '';
    if (notesStr) {
      const discMatch = notesStr.match(/Discount:\s*₹?([\d.]+)/i);
      const delMatch = notesStr.match(/Delivery:\s*₹?([\d.]+)/i);
      if (discMatch) discount = parseFloat(discMatch[1]) || 0;
      if (delMatch) delivery = parseFloat(delMatch[1]) || 0;
    }

    const hasRentalNote = notesStr.includes('[POS RENTAL]') || notesStr.includes('Tenure:');
    const isRentalItems = (parsedItems || []).some((it) => {
      const u = (it.unit || '').toLowerCase();
      const t = (it.title || it.name || '').toLowerCase();
      return it.isRental || it.isForRent || u.includes('acre') || u.includes('hour') || t.includes('tractor') || t.includes('leveler');
    });

    let tenure = '';
    let penaltyRate = '';
    const tenureMatch = notesStr.match(/Tenure:\s*([^|]+)/i);
    const penaltyMatch = notesStr.match(/Penalty:\s*([^|]+)/i);
    if (tenureMatch) tenure = tenureMatch[1].trim();
    if (penaltyMatch) penaltyRate = penaltyMatch[1].trim();

    const isRental = hasRentalNote || isRentalItems;

    const invoice = {
      id: order.id,
      orderNumber: order.orderNumber,
      date: order.createdAt,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      address: order.address,
      city: order.city,
      pincode: order.pincode,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus || order.status,
      notes: order.notes,
      items: (parsedItems || []).map((it) => ({
        title: it.title || it.name,
        price: Number(it.price || 0),
        quantity: Number(it.quantity || 1),
        unit: it.unit || '',
        subtotal: Number(it.price || 0) * Number(it.quantity || 1),
      })),
      subtotal: (parsedItems || []).reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0),
      discount,
      delivery,
      totalAmount: order.totalAmount,
      billType: isRental ? 'rental' : 'direct_sale',
      rentalDetails: isRental ? {
        tenure: tenure || billDesign.defaultRentalTenure || '1 Acre',
        penaltyRate: penaltyRate || `₹${billDesign.defaultPenaltyPerHour || 250}/extra hr | ₹${billDesign.defaultPenaltyPerAcre || 500}/extra acre`,
        gracePeriod: billDesign.defaultGracePeriod || '1 Hour',
        operatorIncluded: true,
      } : null,
    };
    handleWhatsAppInvoice(invoice);
  };

  const handleTogglePaymentStatus = async (orderId, currentStatus) => {
    const nextStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentStatus: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Payment status toggled to "${nextStatus}"`);
        setTimeout(() => setActionSuccess(''), 3000);
        loadAllData();
      } else {
        alert(data.message || 'Failed to update payment status');
      }
    } catch (err) {
      alert('Error updating payment status');
    }
  };

  const exportHistoryToCSV = () => {
    if (filteredHistory.length === 0) {
      alert('No order or bill records match your current filter.');
      return;
    }
    const headers = ['Order/Bill Number', 'Record Type', 'Date & Time', 'Customer Name', 'Phone', 'Address', 'City', 'Payment Method', 'Payment Status', 'Order Status', 'Total Amount (INR)', 'Items Purchased'];
    const rows = filteredHistory.map((o) => {
      let itemsStr = '';
      try {
        const its = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
        itemsStr = (its || []).map((it) => `${it.quantity}x ${it.title} (Rs. ${it.price})`).join('; ');
      } catch (e) {
        itemsStr = 'Items';
      }
      const isPos = (o.orderNumber || '').startsWith('SK-BILL') || (o.notes || '').includes('[Custom POS Bill]');
      const typeLabel = isPos ? 'POS Counter Bill' : (o.paymentMethod === 'WHATSAPP' ? 'WhatsApp Order' : 'Web Store Order');
      return [
        `"${o.orderNumber}"`,
        `"${typeLabel}"`,
        `"${new Date(o.createdAt).toLocaleString('en-IN')}"`,
        `"${(o.customerName || '').replace(/"/g, '""')}"`,
        `"${o.customerPhone || ''}"`,
        `"${(o.address || '').replace(/"/g, '""')}"`,
        `"${(o.city || '').replace(/"/g, '""')}"`,
        `"${o.paymentMethod || ''}"`,
        `"${o.paymentStatus || 'PENDING'}"`,
        `"${o.orderStatus || o.status || 'PENDING'}"`,
        o.totalAmount,
        `"${itemsStr.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SachiKheti_Past_Orders_Bills_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // WHATSAPP BAILEYS CONNECTION HANDLERS (SINGLE-DEVICE LIFECYCLE)
  // ==========================================
  const handleSyncWhatsApp = async () => {
    try {
      setSyncingWhatsApp(true);
      const res = await fetch('/api/whatsapp/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setWhatsappStatus(data);
        setActionSuccess('✓ Single-device WhatsApp session synchronized & probed!');
        setTimeout(() => setActionSuccess(''), 4000);
      } else {
        alert(data.message || 'Failed to sync WhatsApp session');
      }
    } catch (err) {
      alert('Error syncing WhatsApp: ' + err.message);
    } finally {
      setSyncingWhatsApp(false);
    }
  };

  const handleResetWhatsApp = async () => {
    if (!window.confirm('⚠️ Hard Reset Session: This will wipe all stored WhatsApp authentication keys on the server and immediately generate a fresh, clean QR code for scanning. Proceed?')) {
      return;
    }
    try {
      setResettingWhatsApp(true);
      const res = await fetch('/api/whatsapp/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setWhatsappStatus(data);
        setActionSuccess('✓ Session hard-reset complete! Fresh QR code generated below.');
        setTimeout(() => setActionSuccess(''), 5000);
      } else {
        alert(data.message || 'Failed to reset session');
      }
    } catch (err) {
      alert('Error resetting session: ' + err.message);
    } finally {
      setResettingWhatsApp(false);
    }
  };

  const handleStartWhatsApp = async (forceNew = false) => {
    try {
      setLoadingWhatsApp(true);
      const res = await fetch('/api/whatsapp/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ forceNew })
      });
      const data = await res.json();
      if (data.success) {
        setWhatsappStatus(data);
        setActionSuccess('WhatsApp session initialized. Scan QR code if displayed.');
        setTimeout(() => setActionSuccess(''), 4000);
      } else {
        alert(data.message || 'Failed to start WhatsApp');
      }
    } catch (err) {
      alert('Error initializing WhatsApp session: ' + err.message);
    } finally {
      setLoadingWhatsApp(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    if (!window.confirm('Are you sure you want to disconnect your WhatsApp Baileys session? You will need to scan QR code again.')) return;
    try {
      setLoadingWhatsApp(true);
      const res = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setWhatsappStatus({ status: 'DISCONNECTED', qr: null, user: null });
        setActionSuccess('WhatsApp Baileys session disconnected.');
        setTimeout(() => setActionSuccess(''), 4000);
      }
    } catch (err) {
      alert('Error disconnecting WhatsApp: ' + err.message);
    } finally {
      setLoadingWhatsApp(false);
    }
  };

  const handleSendTestWhatsApp = async (e) => {
    e.preventDefault();
    if (!whatsappTestPhone) {
      alert('Please enter a test phone number (e.g. 9876543210)');
      return;
    }
    try {
      setSendingWhatsApp(true);
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: whatsappTestPhone,
          message: `🌾 *${billDesign.companyName}*: Baileys WhatsApp connection verified successfully at ${new Date().toLocaleTimeString()}! Ready to dispatch virtual bills & invoices.`
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`✓ Test message sent successfully via Baileys to ${whatsappTestPhone}!`);
        setTimeout(() => setActionSuccess(''), 5000);
      } else {
        alert(data.message || 'Failed to send test message');
      }
    } catch (err) {
      alert('Error sending test message: ' + err.message);
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handleSaveBillDesign = async (e) => {
    e.preventDefault();
    setSavingBillDesign(true);
    try {
      const res = await fetch('/api/settings/bill-design', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(billDesign)
      });
      const data = await res.json();
      if (data.success) {
        setBillDesign(data.data);
        setActionSuccess('✓ Customized Bill Design template saved successfully!');
        setTimeout(() => setActionSuccess(''), 4000);
      } else {
        alert(data.message || 'Failed to save bill design');
      }
    } catch (err) {
      alert('Error saving bill design: ' + err.message);
    } finally {
      setSavingBillDesign(false);
    }
  };

  const handleSavePaymentGateway = async (e) => {
    if (e) e.preventDefault();
    setSavingGateway(true);
    try {
      const res = await fetch('/api/settings/payment-gateway', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(razorpaySettings)
      });
      const data = await res.json();
      if (data.success) {
        setRazorpaySettings(data.data);
        setActionSuccess(data.data.razorpayEnabled
          ? '✓ Razorpay Payment Gateway activated! Online payment options are now LIVE on checkout.'
          : '✓ Razorpay Gateway disabled. Online payment options are now completely HIDDEN from checkout.'
        );
        setTimeout(() => setActionSuccess(''), 5000);
      } else {
        alert(data.message || 'Failed to save payment gateway settings');
      }
    } catch (err) {
      alert('Error saving payment gateway settings: ' + err.message);
    } finally {
      setSavingGateway(false);
    }
  };

  // ==========================================
  // ORDER STATUS UPDATE HANDLER
  // ==========================================
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Order status updated to "${newStatus}"`);
        setTimeout(() => setActionSuccess(''), 3000);
        loadAllData();
      } else {
        alert(data.message || 'Failed to update order status');
      }
    } catch (err) {
      alert('Error updating order');
    }
  };

  // ==========================================
  // ORDER FULL CRUD HANDLERS (CREATE, UPDATE, DELETE)
  // ==========================================
  const openAddOrderModal = () => {
    setEditingOrder(null);
    setOrderForm({
      customerName: '',
      customerPhone: '',
      address: '',
      city: 'Fatehabad',
      pincode: '125050',
      totalAmount: '',
      paymentMethod: 'WHATSAPP',
      orderStatus: 'PENDING',
      paymentStatus: 'PENDING',
      itemsText: '1x Vedic Bilona Cow Ghee (1 Litre)',
      notes: 'Direct phone / WhatsApp order',
    });
    setShowOrderModal(true);
  };

  const openEditOrderModal = (order) => {
    setEditingOrder(order);
    const itemsStr = Array.isArray(order.items)
      ? order.items.map(it => `${it.quantity || 1}x ${it.title}`).join(', ')
      : typeof order.items === 'string'
      ? order.items
      : '';

    setOrderForm({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      address: order.address,
      city: order.city || 'Fatehabad',
      pincode: order.pincode || '',
      totalAmount: (order.totalAmount || '').toString(),
      paymentMethod: order.paymentMethod || 'WHATSAPP',
      orderStatus: order.orderStatus || order.status || 'PENDING',
      paymentStatus: order.paymentStatus || 'PENDING',
      itemsText: itemsStr,
      notes: order.notes || '',
    });
    setShowOrderModal(true);
  };

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.customerName.trim() || !orderForm.customerPhone.trim() || !orderForm.totalAmount) {
      alert('Please fill customer name, phone, and total amount');
      return;
    }
    setSavingOrder(true);
    try {
      if (editingOrder) {
        const res = await fetch(`/api/orders/${editingOrder.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(orderForm)
        });
        const data = await res.json();
        if (data.success) {
          setShowOrderModal(false);
          setActionSuccess(`Order #${editingOrder.orderNumber} updated in database.`);
          setTimeout(() => setActionSuccess(''), 4000);
          loadAllData();
        } else {
          alert(data.message || 'Failed to update order');
        }
      } else {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...orderForm,
            items: orderForm.itemsText
              ? [{ title: orderForm.itemsText, quantity: 1, price: parseFloat(orderForm.totalAmount) }]
              : [{ title: 'Custom Agricultural Order', quantity: 1, price: parseFloat(orderForm.totalAmount) }]
          })
        });
        const data = await res.json();
        if (data.success) {
          setShowOrderModal(false);
          setActionSuccess(`Manual order #${data.data.orderNumber} created and saved in database.`);
          setTimeout(() => setActionSuccess(''), 4000);
          loadAllData();
        } else {
          alert(data.message || 'Failed to create order');
        }
      }
    } catch (err) {
      alert('Network error while saving order');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDeleteOrder = async (orderId, orderNumber) => {
    if (!window.confirm(`Are you sure you want to permanently delete Order #${orderNumber} from the database? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Order #${orderNumber} deleted from database.`);
        setTimeout(() => setActionSuccess(''), 4000);
        loadAllData();
      } else {
        alert(data.message || 'Failed to delete order');
      }
    } catch (err) {
      alert('Error deleting order');
    }
  };

  // ==========================================
  // BANNER FULL CRUD HANDLERS
  // ==========================================
  const handleDeleteBanner = async () => {
    if (!banner.id) return;
    if (!window.confirm('Are you sure you want to delete this promotional banner from the database?')) return;
    try {
      const res = await fetch(`/api/banners/${banner.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBanner({ id: '', title: '', message: '', isActive: false });
        setActionSuccess('Announcement ribbon deleted from database.');
        setTimeout(() => setActionSuccess(''), 4000);
        loadAllData();
      } else {
        alert(data.message || 'Failed to delete banner');
      }
    } catch (err) {
      alert('Error deleting banner');
    }
  };
  const handleSaveBanner = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/banners/${banner.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: banner.title,
          message: banner.message,
          isActive: banner.isActive,
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess('Announcement ribbon updated live!');
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      alert('Error updating banner');
    }
  };

  // Helper to determine product listing type (Direct Sale, Rent, or Both)
  const getProductListingType = (product) => {
    let isForRent = false;
    let isForSale = true;
    let hasExplicitSpecs = false;

    try {
      if (product.specs) {
        const s = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs;
        if (s.isForRent !== undefined) {
          isForRent = Boolean(s.isForRent);
          hasExplicitSpecs = true;
        }
        if (s.isForSale !== undefined) {
          isForSale = Boolean(s.isForSale);
          hasExplicitSpecs = true;
        }
        if (!hasExplicitSpecs && s['Listing Type']) {
          const lt = s['Listing Type'].toLowerCase();
          if (lt.includes('rent') && lt.includes('sale')) {
            isForRent = true;
            isForSale = true;
            hasExplicitSpecs = true;
          } else if (lt.includes('rent')) {
            isForRent = true;
            isForSale = false;
            hasExplicitSpecs = true;
          } else if (lt.includes('sale')) {
            isForRent = false;
            isForSale = true;
            hasExplicitSpecs = true;
          }
        }
      }
    } catch (e) {}

    // Only apply category/unit heuristic if specs were never explicitly set!
    if (!hasExplicitSpecs) {
      const unit = (product.unit || '').toLowerCase();
      const cat = (product.category?.name || product.category?.slug || '').toLowerCase();
      if (unit.includes('acre') || unit.includes('hour') || unit.includes('24 hours') || unit.includes('day') || unit.includes('trip')) {
        isForRent = true;
      }
      if (cat.includes('machin') || cat.includes('tool') || cat.includes('rent') || cat.includes('equip')) {
        isForRent = true;
      }
    }

    if (isForRent && isForSale) return 'both';
    if (isForRent) return 'rent';
    return 'sale';
  };

  // Filter calculations
  const filteredProducts = products.filter(p => {
    const matchesSearch = !productSearch ||
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase()));
    const matchesCat = selectedProductCategory === 'all' || p.categoryId === selectedProductCategory;

    const listingType = getProductListingType(p);
    let matchesListing = true;
    if (productListingFilter === 'featured') {
      matchesListing = Boolean(p.featured);
    } else if (productListingFilter === 'rent') {
      matchesListing = listingType === 'rent' || listingType === 'both';
    } else if (productListingFilter === 'sale') {
      matchesListing = listingType === 'sale' || listingType === 'both';
    }

    return matchesSearch && matchesCat && matchesListing;
  });

  const getStatus = (o) => o.orderStatus || o.status || 'PENDING';

  const filteredOrders = orders.filter(o => {
    const matchesSearch = !orderSearch ||
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerPhone.includes(orderSearch);
    const matchesStatus = orderStatusFilter === 'all' || getStatus(o) === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // History & Past Bills Filtered List & KPI Metrics
  const filteredHistory = orders.filter((o) => {
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase().trim();
      const matchNum = (o.orderNumber || '').toLowerCase().includes(q);
      const matchCust = (o.customerName || '').toLowerCase().includes(q);
      const matchPhone = (o.customerPhone || '').toLowerCase().includes(q);
      const matchCity = (o.city || '').toLowerCase().includes(q);
      let matchItem = false;
      try {
        const its = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
        matchItem = (its || []).some((it) => (it.title || it.name || '').toLowerCase().includes(q));
      } catch (e) {}
      if (!matchNum && !matchCust && !matchPhone && !matchCity && !matchItem) return false;
    }

    const isPos = (o.orderNumber || '').startsWith('SK-BILL') || (o.notes || '').includes('[Custom POS Bill]');
    const isWhatsapp = o.paymentMethod === 'WHATSAPP';

    // Excel Sheet Tab Filtering
    if (historyActiveSheet === 'pos' && !isPos) return false;
    if (historyActiveSheet === 'due' && (o.paymentStatus || 'PENDING').toUpperCase() !== 'PENDING') return false;
    if (historyActiveSheet === 'online' && (isPos || isWhatsapp)) return false;
    if (historyActiveSheet === 'rental') {
      const notes = (o.notes || '').toLowerCase();
      let hasRent = notes.includes('rental') || notes.includes('tenure') || notes.includes('penalty');
      if (!hasRent) {
        try {
          const its = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
          hasRent = (its || []).some(it => {
            const u = (it.unit || '').toLowerCase();
            const t = (it.title || it.name || '').toLowerCase();
            return it.isRental || it.isForRent || u.includes('acre') || u.includes('hour') || t.includes('tractor');
          });
        } catch (e) {}
      }
      if (!hasRent) return false;
    }

    if (historyTypeFilter === 'pos' && !isPos) return false;
    if (historyTypeFilter === 'whatsapp' && !isWhatsapp) return false;
    if (historyTypeFilter === 'store' && (isPos || isWhatsapp)) return false;

    if (historyPaymentStatusFilter !== 'all') {
      const pStatus = (o.paymentStatus || 'PENDING').toUpperCase();
      if (pStatus !== historyPaymentStatusFilter) return false;
    }

    if (historyPaymentMethodFilter !== 'all') {
      if (o.paymentMethod !== historyPaymentMethodFilter) return false;
    }

    if (historyDatePreset !== 'all') {
      const orderDate = new Date(o.createdAt);
      const now = new Date();
      if (historyDatePreset === 'today') {
        if (orderDate.toDateString() !== now.toDateString()) return false;
      } else if (historyDatePreset === 'yesterday') {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (orderDate.toDateString() !== yesterday.toDateString()) return false;
      } else if (historyDatePreset === '7days') {
        const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (orderDate < past7) return false;
      } else if (historyDatePreset === '30days') {
        const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (orderDate < past30) return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (historySort === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (historySort === 'highest') {
      return (b.totalAmount || 0) - (a.totalAmount || 0);
    } else if (historySort === 'lowest') {
      return (a.totalAmount || 0) - (b.totalAmount || 0);
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const historyTotalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const historyPaidRevenue = orders
    .filter((o) => (o.paymentStatus || '').toUpperCase() === 'PAID')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const historyPendingRevenue = orders
    .filter((o) => (o.paymentStatus || '').toUpperCase() === 'PENDING')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const historyPosBillsCount = orders.filter(
    (o) => (o.orderNumber || '').startsWith('SK-BILL') || (o.notes || '').includes('[Custom POS Bill]')
  ).length;
  const historyStoreOrdersCount = orders.length - historyPosBillsCount;
  const historyRentalCount = orders.filter((o) => {
    const notes = (o.notes || '').toLowerCase();
    if (notes.includes('rental') || notes.includes('tenure') || notes.includes('penalty')) return true;
    try {
      const its = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
      return (its || []).some((it) => {
        const u = (it.unit || '').toLowerCase();
        const t = (it.title || it.name || '').toLowerCase();
        return it.isRental || it.isForRent || u.includes('acre') || u.includes('hour') || t.includes('tractor');
      });
    } catch (e) {
      return false;
    }
  }).length;
  const historyDueCount = orders.filter((o) => (o.paymentStatus || '').toUpperCase() === 'PENDING').length;
  const selectedOrderRecord = selectedHistoryRowId ? orders.find((o) => o.id === selectedHistoryRowId) : null;

  // KPI Metrics & Analytics Calculations (Real-time Database Synchronized)
  const totalRevenue = serverMetrics?.totalRevenue !== undefined
    ? serverMetrics.totalRevenue
    : orders
        .filter(o => getStatus(o) !== 'CANCELLED')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const pendingOrdersCount = serverMetrics?.pendingOrders !== undefined
    ? serverMetrics.pendingOrders
    : orders.filter(o => getStatus(o) === 'PENDING').length;

  const inStockProductsCount = serverMetrics?.inStockProducts !== undefined
    ? serverMetrics.inStockProducts
    : products.filter(p => p.inStock).length;

  // 1. Order Fulfillment Funnel Calculations
  const totalOrdersCount = serverMetrics?.totalOrders !== undefined
    ? serverMetrics.totalOrders
    : orders.length;

  const confirmedCount = serverMetrics?.confirmedOrders !== undefined
    ? serverMetrics.confirmedOrders
    : orders.filter(o => ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(getStatus(o))).length;

  const processingCount = serverMetrics?.processingOrders !== undefined
    ? serverMetrics.processingOrders
    : orders.filter(o => ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(getStatus(o))).length;

  const shippedCount = serverMetrics?.shippedOrders !== undefined
    ? serverMetrics.shippedOrders
    : orders.filter(o => ['SHIPPED', 'DELIVERED'].includes(getStatus(o))).length;

  const deliveredCount = serverMetrics?.deliveredOrders !== undefined
    ? serverMetrics.deliveredOrders
    : orders.filter(o => getStatus(o) === 'DELIVERED').length;

  const cancelledCount = serverMetrics?.cancelledOrders !== undefined
    ? serverMetrics.cancelledOrders
    : orders.filter(o => getStatus(o) === 'CANCELLED').length;

  const funnelSteps = [
    {
      stage: '1. Received',
      count: totalOrdersCount,
      color: '#3B82F6',
      bg: '#EFF6FF',
      pct: 100,
      desc: 'All customer checkouts'
    },
    {
      stage: '2. Confirmed',
      count: confirmedCount,
      color: '#059669',
      bg: '#ECFDF5',
      pct: totalOrdersCount > 0 ? Math.round((confirmedCount / totalOrdersCount) * 100) : 0,
      desc: 'Approved & verified'
    },
    {
      stage: '3. Processing',
      count: processingCount,
      color: '#D97706',
      bg: '#FFFBEB',
      pct: totalOrdersCount > 0 ? Math.round((processingCount / totalOrdersCount) * 100) : 0,
      desc: 'Packaged at farm facility'
    },
    {
      stage: '4. Shipped',
      count: shippedCount,
      color: '#7C3AED',
      bg: '#F5F3FF',
      pct: totalOrdersCount > 0 ? Math.round((shippedCount / totalOrdersCount) * 100) : 0,
      desc: 'In transit to address'
    },
    {
      stage: '5. Delivered',
      count: deliveredCount,
      color: '#15733E',
      bg: '#EBF7EE',
      pct: totalOrdersCount > 0 ? Math.round((deliveredCount / totalOrdersCount) * 100) : 0,
      desc: 'Successfully completed'
    },
  ];

  // 2. Sales by Category Bar Graph Calculations
  const categorySalesList = (serverMetrics?.categorySalesList && serverMetrics.categorySalesList.length > 0)
    ? serverMetrics.categorySalesList
    : (() => {
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
          if (getStatus(o) === 'CANCELLED') return;
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

        return Object.values(categorySalesMap);
      })();

  const maxCategorySales = serverMetrics?.maxCategorySales || Math.max(...categorySalesList.map(c => c.sales), 1);

  // 3. Revenue Breakdown by Payment Method
  const whatsappRevenue = serverMetrics?.whatsappRevenue !== undefined
    ? serverMetrics.whatsappRevenue
    : orders
        .filter(o => o.paymentMethod === 'WHATSAPP' && getStatus(o) !== 'CANCELLED')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const onlineRevenue = serverMetrics?.onlineRevenue !== undefined
    ? serverMetrics.onlineRevenue
    : orders
        .filter(o => o.paymentMethod !== 'WHATSAPP' && getStatus(o) !== 'CANCELLED')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const totalValidRevenue = (whatsappRevenue + onlineRevenue) || 1;
  const whatsappRatio = serverMetrics?.whatsappRatio !== undefined
    ? serverMetrics.whatsappRatio
    : (Math.round((whatsappRevenue / totalValidRevenue) * 100) || 50);

  const onlineRatio = 100 - whatsappRatio;

  // Circumference for SVG Donut (r=45 => 2 * PI * 45 ≈ 282.74)
  const donutCircumference = 282.74;
  const whatsappDash = (whatsappRatio / 100) * donutCircumference;
  const onlineDash = donutCircumference - whatsappDash;

  // Timeline points for Dotted Graph
  const timelinePoints = (serverMetrics?.timelinePoints && serverMetrics.timelinePoints.length > 0)
    ? serverMetrics.timelinePoints
    : orders.slice(0, 7).map((o) => ({
        label: new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        amount: o.totalAmount || 0,
        orderNumber: o.orderNumber,
        status: getStatus(o)
      })).reverse();


  // ==========================================
  // RENDER: LOGIN VIEW (IF NOT AUTHENTICATED)
  // ==========================================
  if (!token || !adminUser) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-brand">
            <img
              src="/assets/brand/sachi-kheti-emblem.jpg"
              alt="SachiKheti Emblem"
              className="admin-login-logo"
            />
            <div>
              <div className="admin-login-title">SachiKheti Superadmin</div>
              <div className="admin-login-sub">Platform Administration Portal</div>
            </div>
          </div>

          <div className="admin-login-badge">
            <ShieldCheck size={16} color="#15733E" style={{ flexShrink: 0 }} />
            <span>Authorized LFPC Management Access</span>
          </div>

          {loginError && (
            <div className="admin-login-error">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="admin-login-form" autoComplete="off">
            <div className="form-group admin-login-group">
              <label className="form-label admin-login-label">Username</label>
              <input
                type="text"
                required
                name="admin_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input admin-login-input"
                autoComplete="off"
                placeholder="Enter admin username"
              />
            </div>

            <div className="form-group admin-login-group">
              <label className="form-label admin-login-label">Password</label>
              <div className="admin-login-pwd-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  name="admin_password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input admin-login-input pwd-input"
                  autoComplete="new-password"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="admin-login-pwd-toggle"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="btn btn-primary admin-login-submit-btn"
            >
              {loggingIn ? (
                <>
                  <RefreshCw size={17} className="spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Sign In to Superadmin</span>
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={onNavigateHome}
              className="btn btn-secondary btn-sm admin-login-return-btn"
            >
              <ArrowLeft size={15} />
              <span>Return to Customer Store</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: FULL SUPERADMIN PORTAL APPLICATION
  // ==========================================
  return (
    <div className="admin-portal-app">
      {/* Top Application Header */}
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="admin-sidebar-toggle"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu size={22} />
          </button>
          <div className="admin-brand-lockup">
            <img
              src="/assets/brand/sachi-kheti-emblem.jpg"
              alt="SachiKheti Emblem"
              className="admin-brand-icon"
            />
            <div>
              <div className="admin-brand-name">
                <span style={{ color: '#15733E', marginRight: '6px' }}>SachiKheti</span>
                Superadmin
              </div>
              <div className="admin-brand-sub">LFPC Central Management System</div>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="admin-topbar-divider" />

          {/* Active Page Heading (Aligned in Top Bar as Requested) */}
          <div className="admin-topbar-heading">
            {activeTab === 'overview' && (
              <div className="admin-page-title-badge">
                <TrendingUp size={20} color="#15733E" />
                <span>Executive Operations Overview</span>
              </div>
            )}
            {(activeTab === 'customer-store' || activeTab === 'billing') && (
              <div className="admin-page-title-badge">
                <Store size={20} color="#15733E" />
                <span>Customer Store & Virtual POS</span>
              </div>
            )}
            {activeTab === 'products' && (
              <div className="admin-page-title-badge">
                <Package size={20} color="#15733E" />
                <span>Products Catalog</span>
                <span className="admin-topbar-count-pill">{products.length}</span>
              </div>
            )}
            {activeTab === 'categories' && (
              <div className="admin-page-title-badge">
                <Layers size={20} color="#15733E" />
                <span>Product Categories</span>
                <span className="admin-topbar-count-pill">{categories.length}</span>
              </div>
            )}
            {activeTab === 'orders' && (
              <div className="admin-page-title-badge">
                <ShoppingBag size={20} color="#15733E" />
                <span>Order Fulfillment Center</span>
                <span className="admin-topbar-count-pill">{orders.length}</span>
              </div>
            )}
            {activeTab === 'history' && (
              <div className="admin-page-title-badge">
                <History size={20} color="#15733E" />
                <span>Past Orders & Bills History</span>
                <span className="admin-topbar-count-pill">{orders.length}</span>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="admin-page-title-badge">
                <Settings size={20} color="#15733E" />
                <span>Platform & Store Settings</span>
              </div>
            )}
          </div>
        </div>

        {/* Topbar Right Contextual Action Buttons */}
        <div className="admin-topbar-right">
          {activeTab === 'overview' && (
            <button onClick={openAddProductModal} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={15} />
              <span>Add Product</span>
            </button>
          )}

          {(activeTab === 'customer-store' || activeTab === 'billing') && billingCart.length > 0 && (
            <button
              type="button"
              onClick={clearBillingCart}
              className="btn btn-secondary btn-sm text-red"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <Trash2 size={14} />
              <span>Clear Cart</span>
            </button>
          )}

          {activeTab === 'products' && (
            <button onClick={openAddProductModal} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={15} />
              <span>+ Add New Product</span>
            </button>
          )}

          {activeTab === 'categories' && (
            <button onClick={openAddCategoryModal} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FolderPlus size={15} />
              <span>+ Add New Category</span>
            </button>
          )}

          {activeTab === 'orders' && (
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <History size={15} />
              <span>Past Orders & Bills ({orders.length})</span>
            </button>
          )}
        </div>
      </header>

      {/* Floating Action Success Alert */}
      {actionSuccess && (
        <div className="admin-toast-banner">
          <CheckCircle size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Real-time Live Order Audio & Visual Toast */}
      {realtimeAlert && (
        <div className="admin-toast-banner" style={{ background: '#0A3E22', color: '#FFFFFF', border: '1px solid #15733E', boxShadow: '0 8px 24px rgba(10, 62, 34, 0.3)' }}>
          <ShoppingBag size={18} color="#E8AF30" />
          <span style={{ fontWeight: 600 }}>{realtimeAlert}</span>
          <button
            onClick={() => setRealtimeAlert(null)}
            style={{ marginLeft: '12px', background: 'none', border: 'none', color: '#A7F3D0', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Layout (Sidebar + Content View) */}
      <div className="admin-portal-body admin-portal-layout">
        {/* Navigation Sidebar (Icon-Only Rail with Floating Hover Tooltips) */}
        <aside className={`admin-portal-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="admin-sidebar-nav">
            {/* 1. Overview Metrics */}
            <button
              type="button"
              onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
              className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              aria-label="Overview Metrics"
              title="Overview Metrics"
            >
              <TrendingUp size={20} />
              <span className="admin-nav-tooltip">Overview Metrics</span>
            </button>

            {/* 2. Customer Store & POS */}
            <button
              type="button"
              onClick={() => { setActiveTab('customer-store'); setSidebarOpen(false); }}
              className={`admin-nav-item ${activeTab === 'customer-store' || activeTab === 'billing' ? 'active' : ''}`}
              aria-label="Customer Store & POS"
              title="Customer Store & POS"
            >
              <Store size={20} />
              {billingCart.length > 0 && (
                <span className="admin-nav-icon-badge badge-gold">
                  {billingCart.length}
                </span>
              )}
              <span className="admin-nav-tooltip">
                Customer Store & POS {billingCart.length > 0 ? `(${billingCart.length} in cart)` : ''}
              </span>
            </button>

            {/* 3. Orders Fulfillment */}
            <button
              type="button"
              onClick={() => { setActiveTab('orders'); setSidebarOpen(false); }}
              className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
              aria-label="Orders Fulfillment"
              title="Orders Fulfillment"
            >
              <ShoppingBag size={20} />
              {pendingOrdersCount > 0 && (
                <span className="admin-nav-icon-badge badge-alert">
                  {pendingOrdersCount}
                </span>
              )}
              <span className="admin-nav-tooltip">
                Orders Fulfillment {pendingOrdersCount > 0 ? `(${pendingOrdersCount} pending)` : ''}
              </span>
            </button>

            {/* 4. Past Orders & Bills */}
            <button
              type="button"
              onClick={() => { setActiveTab('history'); setSidebarOpen(false); }}
              className={`admin-nav-item ${activeTab === 'history' ? 'active' : ''}`}
              aria-label="Past Orders & Bills"
              title="Past Orders & Bills"
            >
              <History size={20} />
              {orders.length > 0 && (
                <span className="admin-nav-icon-badge badge-neutral">
                  {orders.length}
                </span>
              )}
              <span className="admin-nav-tooltip">
                Past Orders & Bills ({orders.length})
              </span>
            </button>

            {/* 5. Products Catalog */}
            <button
              type="button"
              onClick={() => { setActiveTab('products'); setSidebarOpen(false); }}
              className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
              aria-label="Products Catalog"
              title="Products Catalog"
            >
              <Package size={20} />
              {products.length > 0 && (
                <span className="admin-nav-icon-badge badge-neutral">
                  {products.length}
                </span>
              )}
              <span className="admin-nav-tooltip">
                Products Catalog ({products.length})
              </span>
            </button>

            {/* 6. Categories */}
            <button
              type="button"
              onClick={() => { setActiveTab('categories'); setSidebarOpen(false); }}
              className={`admin-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
              aria-label="Categories"
              title="Categories"
            >
              <Layers size={20} />
              {categories.length > 0 && (
                <span className="admin-nav-icon-badge badge-neutral">
                  {categories.length}
                </span>
              )}
              <span className="admin-nav-tooltip">
                Categories ({categories.length})
              </span>
            </button>

            {/* 7. Settings */}
            <button
              type="button"
              onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
              className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              aria-label="Settings"
              title="Settings"
            >
              <Settings size={20} />
              {whatsappStatus?.status === 'CONNECTED' && (
                <span
                  className="admin-nav-icon-dot-online"
                  title="WhatsApp Connected via Baileys"
                />
              )}
              <span className="admin-nav-tooltip">
                Settings {whatsappStatus?.status === 'CONNECTED' ? '• WhatsApp Live' : ''}
              </span>
            </button>
          </div>

          {/* Sidebar Bottom: User Profile Avatar & Aligned Logout */}
          <div className="admin-sidebar-footer">
            <div
              className="admin-sidebar-action-btn admin-user-avatar-btn"
              aria-label={`Admin: ${adminUser.username} (Super Admin)`}
              title={`${adminUser.username} • Super Admin`}
            >
              <ShieldCheck size={20} />
              <span className="admin-nav-tooltip">
                {adminUser.username} • Super Admin
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="admin-sidebar-action-btn admin-logout-rail-btn"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={18} />
              <span className="admin-nav-tooltip">
                Logout
              </span>
            </button>
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="admin-sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Content View Area */}
        <main className={`admin-portal-content admin-portal-main ${(activeTab === 'customer-store' || activeTab === 'billing') ? 'pos-active-main' : ''}`}>
          {/* ==================================================== */}
          {/* TAB 1: OVERVIEW METRICS                              */}
          {/* ==================================================== */}
          {activeTab === 'overview' && (
            <div className="admin-tab-view">
              {/* KPI Cards Grid */}
              <div className="admin-kpi-grid">
                <div className="admin-kpi-card">
                  <div className="admin-kpi-icon-wrap" style={{ background: '#EBF7EE', color: '#15733E' }}>
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <div className="admin-kpi-label">Confirmed Revenue</div>
                    <div className="admin-kpi-value">₹ {totalRevenue.toLocaleString('en-IN')}</div>
                    <div className="admin-kpi-meta">{orders.length} Total orders recorded</div>
                  </div>
                </div>

                <div className="admin-kpi-card">
                  <div className="admin-kpi-icon-wrap" style={{ background: '#FFF7E6', color: '#D97706' }}>
                    <Clock size={22} />
                  </div>
                  <div>
                    <div className="admin-kpi-label">Pending Verification</div>
                    <div className="admin-kpi-value">{pendingOrdersCount}</div>
                    <div className="admin-kpi-meta">Awaiting dispatch confirmation</div>
                  </div>
                </div>

                <div className="admin-kpi-card">
                  <div className="admin-kpi-icon-wrap" style={{ background: '#E6F4EA', color: '#0A3E22' }}>
                    <Package size={22} />
                  </div>
                  <div>
                    <div className="admin-kpi-label">Active Catalog Items</div>
                    <div className="admin-kpi-value">{inStockProductsCount} / {products.length}</div>
                    <div className="admin-kpi-meta">Items ready for direct dispatch</div>
                  </div>
                </div>

                <div className="admin-kpi-card">
                  <div className="admin-kpi-icon-wrap" style={{ background: '#F3E8FF', color: '#7E22CE' }}>
                    <Layers size={22} />
                  </div>
                  <div>
                    <div className="admin-kpi-label">Product Categories</div>
                    <div className="admin-kpi-value">{categories.length}</div>
                    <div className="admin-kpi-meta">Configured product groupings</div>
                  </div>
                </div>
              </div>

              {/* 1. ORDER FULFILLMENT FUNNEL */}
              <div className="admin-funnel-card" style={{ marginTop: '28px' }}>
                <div className="admin-funnel-header">
                  <div>
                    <h3 className="admin-panel-title">Order Fulfillment Funnel</h3>
                    <p className="admin-panel-sub">
                      Stage-by-stage conversion from customer checkout to doorstep delivery
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="badge badge-green">
                      Success Rate: {totalOrdersCount > 0 ? Math.round((deliveredCount / totalOrdersCount) * 100) : 0}%
                    </span>
                    {cancelledCount > 0 && (
                      <span className="badge badge-gold">
                        Cancelled: {cancelledCount}
                      </span>
                    )}
                  </div>
                </div>

                <div className="admin-funnel-steps-grid">
                  {funnelSteps.map((step, idx) => (
                    <div key={idx} className="admin-funnel-step-item">
                      <span
                        className="admin-funnel-step-badge"
                        style={{ background: step.bg, color: step.color }}
                      >
                        {step.stage}
                      </span>
                      <div className="admin-funnel-step-count">{step.count}</div>
                      <div className="admin-funnel-step-label">{step.desc}</div>
                      <div className="admin-funnel-step-pct">
                        {step.pct}% of total checkouts
                      </div>
                      <div className="admin-funnel-progress-bar">
                        <div
                          className="admin-funnel-progress-fill"
                          style={{
                            width: `${step.pct}%`,
                            background: step.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. ANALYTICS GRID: CATEGORY BAR GRAPH & REVENUE CHARTS */}
              <div className="admin-analytics-grid">
                {/* Left: Category Sales Bar Graph */}
                <div className="admin-bar-card">
                  <div className="admin-panel-card-header">
                    <div>
                      <h3 className="admin-panel-title">Sales by Category</h3>
                      <p className="admin-panel-sub">Revenue and volume distribution across product categories</p>
                    </div>
                    <button onClick={() => setActiveTab('categories')} className="btn btn-secondary btn-sm">
                      <span>View Categories</span>
                      <ExternalLink size={14} />
                    </button>
                  </div>

                  <div className="admin-bar-list">
                    {categorySalesList.map((cat) => {
                      const pct = Math.round((cat.sales / maxCategorySales) * 100) || (cat.productCount > 0 ? 15 : 5);
                      return (
                        <div key={cat.id} className="admin-bar-row">
                          <div className="admin-bar-row-header">
                            <span className="admin-bar-row-title">
                              <span>{cat.name}</span>
                              <span className="badge" style={{ fontSize: '0.7rem', padding: '1px 6px', background: '#F0F4F1' }}>
                                {cat.productCount} items
                              </span>
                            </span>
                            <span className="admin-bar-row-value">
                              ₹ {cat.sales.toLocaleString('en-IN')}{' '}
                              <span style={{ fontSize: '0.74rem', color: '#7A8B80', fontWeight: 500 }}>
                                ({cat.units} sold)
                              </span>
                            </span>
                          </div>
                          <div className="admin-bar-track">
                            <div
                              className="admin-bar-fill"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {categorySalesList.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '24px', color: '#7A8B80' }}>
                        No categories found.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Revenue Channel Donut & Activity Dotted Graph */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Donut Chart: Revenue Breakdown */}
                  <div className="admin-panel-card">
                    <div className="admin-panel-card-header">
                      <div>
                        <h3 className="admin-panel-title">Revenue Channels</h3>
                        <p className="admin-panel-sub">WhatsApp Direct Orders vs. Online / UPI</p>
                      </div>
                    </div>

                    <div className="admin-donut-box">
                      <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
                        <svg width="130" height="130" viewBox="0 0 130 130">
                          {/* Background Ring */}
                          <circle
                            cx="65"
                            cy="65"
                            r="45"
                            fill="transparent"
                            stroke="#F0F4F1"
                            strokeWidth="16"
                          />
                          {/* Online Slice */}
                          <circle
                            cx="65"
                            cy="65"
                            r="45"
                            fill="transparent"
                            stroke="#D97706"
                            strokeWidth="16"
                            strokeDasharray={donutCircumference}
                            strokeDashoffset="0"
                            transform="rotate(-90 65 65)"
                          />
                          {/* WhatsApp Direct Slice */}
                          <circle
                            cx="65"
                            cy="65"
                            r="45"
                            fill="transparent"
                            stroke="#15733E"
                            strokeWidth="16"
                            strokeDasharray={`${whatsappDash} ${onlineDash}`}
                            strokeDashoffset="0"
                            transform="rotate(-90 65 65)"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: 'none'
                        }}>
                          <div style={{ fontSize: '0.68rem', color: '#7A8B80', textTransform: 'uppercase', fontWeight: 700 }}>Total</div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#122117' }}>₹{totalRevenue.toLocaleString('en-IN')}</div>
                        </div>
                      </div>

                      <div className="admin-donut-legend">
                        <div className="admin-donut-legend-item">
                          <span className="admin-donut-legend-dot" style={{ background: '#15733E' }} />
                          <div>
                            <div style={{ fontWeight: 700, color: '#122117' }}>
                              WhatsApp Orders ({whatsappRatio}%)
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#7A8B80' }}>
                              ₹ {whatsappRevenue.toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>

                        <div className="admin-donut-legend-item">
                          <span className="admin-donut-legend-dot" style={{ background: '#D97706' }} />
                          <div>
                            <div style={{ fontWeight: 700, color: '#122117' }}>
                              Online / UPI ({onlineRatio}%)
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#7A8B80' }}>
                              ₹ {onlineRevenue.toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB: CUSTOMER STORE & VIRTUAL BILL POS TERMINAL     */}
          {/* ==================================================== */}
          {(activeTab === 'customer-store' || activeTab === 'billing') && (
            <div className="admin-tab-view pos-terminal-tab-view">
              {/* Responsive 2-Column Split: Customer Store Catalogs (Left) + Live Virtual Bill (Right) */}
              <div
                className="pos-split-container"
              >
                {/* LEFT: Customer Store Catalog Browser (Independently Scrollable) */}
                <div
                  className="pos-catalog-scroll"
                  style={{
                    height: '100%',
                    overflowY: 'auto',
                    paddingRight: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  {/* Product Cards Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    {products
                      .filter((p) => {
                        const matchesSearch =
                          !billingSearch ||
                          p.title.toLowerCase().includes(billingSearch.toLowerCase()) ||
                          (p.titlePunjabi && p.titlePunjabi.toLowerCase().includes(billingSearch.toLowerCase())) ||
                          (p.description && p.description.toLowerCase().includes(billingSearch.toLowerCase()));
                        const matchesCat = billingCategoryFilter === 'all' || p.categoryId === billingCategoryFilter;

                        const listingType = getProductListingType(p);
                        let matchesListing = true;
                        if (billingListingFilter === 'featured') {
                          matchesListing = Boolean(p.featured);
                        } else if (billingListingFilter === 'rent') {
                          matchesListing = listingType === 'rent' || listingType === 'both';
                        } else if (billingListingFilter === 'sale') {
                          matchesListing = listingType === 'sale' || listingType === 'both';
                        }

                        return matchesSearch && matchesCat && matchesListing;
                      })
                      .map((p) => {
                        const inCartItem = billingCart.find((it) => it.id === p.id);
                        const listingType = getProductListingType(p);

                        return (
                          <div
                            key={p.id}
                            style={{
                              background: '#FFFFFF',
                              borderRadius: '12px',
                              border: inCartItem ? `2px solid ${billDesign.accentColor}` : '1px solid #E5E7EB',
                              padding: '14px',
                              display: 'flex',
                              flexDirection: 'column',
                              boxShadow: inCartItem ? '0 4px 12px rgba(21,115,62,0.14)' : '0 1px 3px rgba(0,0,0,0.04)',
                              transition: 'all 0.2s ease',
                              position: 'relative',
                            }}
                          >
                            {/* Product Image & Badges */}
                            <div style={{ position: 'relative', marginBottom: '10px' }}>
                              <img
                                src={p.imageUrl}
                                alt={p.title}
                                style={{ width: '100%', height: '120px', borderRadius: '8px', objectFit: 'cover' }}
                              />
                              {/* Badges Overlay */}
                              <div style={{ position: 'absolute', top: '6px', left: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {p.featured && (
                                  <span style={{ fontSize: '0.66rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                                    ★ FEATURED
                                  </span>
                                )}
                                {listingType === 'both' ? (
                                  <span style={{ fontSize: '0.66rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                                    RENT & SALE
                                  </span>
                                ) : listingType === 'rent' ? (
                                  <span style={{ fontSize: '0.66rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#F3E8FF', color: '#6B21A8', border: '1px solid #E9D5FF' }}>
                                    🚜 FOR RENT
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.66rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
                                    DIRECT SALE
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Titles */}
                            <div style={{ marginBottom: '8px' }}>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1B2E23', lineHeight: 1.25 }}>
                                {p.title}
                              </div>
                              {p.titlePunjabi && p.titlePunjabi !== p.title && (
                                <div style={{ fontSize: '0.76rem', color: '#15733E', marginTop: '2px' }}>
                                  {p.titlePunjabi}
                                </div>
                              )}
                              <div style={{ fontSize: '0.72rem', color: '#7A8B80', marginTop: '3px' }}>
                                {p.category?.name || 'Produce'}
                              </div>
                            </div>

                            {/* Pricing & Stock */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #F3F4F6' }}>
                              <div>
                                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#15733E' }}>
                                  ₹{p.price.toLocaleString('en-IN')}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: '#7A8B80', marginLeft: '3px' }}>
                                  / {p.unit}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.7rem', color: p.inStock ? '#065F46' : '#DC2626', fontWeight: 600 }}>
                                {p.inStock ? `In Stock (${p.stockCount})` : 'Out of stock'}
                              </span>
                            </div>

                            {/* Interactive Add to Bill / Stepper */}
                            {inCartItem ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #86EFAC', padding: '3px 6px' }}>
                                <button
                                  type="button"
                                  onClick={() => updateCartQty(p.id, -1)}
                                  style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', border: '1px solid #BBF7D0', borderRadius: '6px', cursor: 'pointer', color: '#166534' }}
                                  title="Reduce quantity"
                                >
                                  <Minus size={14} />
                                </button>
                                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#166534' }}>
                                  {inCartItem.quantity} in Bill
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateCartQty(p.id, 1)}
                                  style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#15733E', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#FFFFFF' }}
                                  title="Increase quantity"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addToBillingCart(p)}
                                className="btn btn-sm btn-primary"
                                style={{
                                  width: '100%',
                                  marginTop: '10px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  padding: '7px 10px',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                }}
                              >
                                <Plus size={14} />
                                <span>+ Add to Virtual Bill</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* RIGHT: Live Virtual Bill & Customized POS Slip (Stationary & Fixed to Viewport) */}
                <div
                  className="pos-bill-fixed"
                  style={{
                    height: '100%',
                    background: '#FFFFFF',
                    borderRadius: '14px',
                    border: `2px solid ${billDesign.accentColor}`,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {/* TIER 1: Pinned Fixed Header (Store Branding & Title) */}
                  <div className="pos-bill-header-fixed">
                    <div
                      style={{
                        padding: '10px 16px',
                        background: billDesign.accentColor,
                        color: '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {billDesign.showLogo && (
                            <img
                              src="/assets/brand/sachi-kheti-emblem.jpg"
                              alt="Emblem"
                              style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', background: '#FFFFFF' }}
                            />
                          )}
                          <span style={{ fontWeight: 900, fontSize: '0.94rem', letterSpacing: '0.3px' }}>
                            {billDesign.companyName}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.22)', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                          Live Virtual Bill
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                        {billDesign.tagline}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', opacity: 0.85, marginTop: '2px' }}>
                        <span>📍 {billDesign.address}</span>
                        <span>📞 {billDesign.phone}</span>
                      </div>
                    </div>

                    {/* Bill Title & Subtotal Bar */}
                    <div
                      style={{
                        padding: '7px 16px',
                        borderBottom: '1px solid #E5E7EB',
                        background: '#F9FAFB',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#374151' }}>
                        {billDesign.billTitle}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.74rem', color: '#6B7280' }}>
                          {billingCart.reduce((sum, it) => sum + it.quantity, 0)} Items
                        </span>
                        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: billDesign.accentColor }}>
                          ₹{billingSubtotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TIER 2: Unified Scrollable Body (Cart Items + Customer Info + Terms + Pricing) */}
                  <div className="pos-bill-scrollable-body" style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto' }}>
                    {/* A. Cart Items List */}
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid #E5E7EB' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Billed Items ({billingCart.length})</span>
                        {billingCart.length > 0 && (
                          <span style={{ color: '#6B7280', fontWeight: 600 }}>Edit rate or qty below</span>
                        )}
                      </div>

                      {billingCart.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px 12px', color: '#7A8B80', background: '#F9FAFB', borderRadius: '10px', border: '1px dashed #D1D5DB' }}>
                          <ShoppingCart size={28} color="#9CA3AF" style={{ margin: '0 auto 6px' }} />
                          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#374151' }}>Virtual Bill is Empty</div>
                          <div style={{ fontSize: '0.76rem', color: '#6B7280', marginTop: '2px' }}>
                            Click "+ Add to Virtual Bill" on any catalog item on the left to add items.
                          </div>
                        </div>
                      ) : (
                        <div className="pos-cart-items-scroll">
                          {billingCart.map((item) => (
                            <div
                              key={item.id}
                              style={{
                                padding: '9px 11px',
                                background: '#F9FAFB',
                                borderRadius: '8px',
                                border: '1px solid #E5E7EB',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.title}
                                  </div>
                                  <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>Unit: {item.unit}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFromBillingCart(item.id)}
                                  style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px' }}
                                  title="Remove item"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                {/* Quantity Stepper */}
                                <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #D1D5DB' }}>
                                  <button
                                    type="button"
                                    onClick={() => updateCartQty(item.id, -1)}
                                    style={{ padding: '3px 7px', background: 'none', border: 'none', cursor: 'pointer', color: '#374151' }}
                                  >
                                    <Minus size={11} />
                                  </button>
                                  <span style={{ fontSize: '0.82rem', fontWeight: 800, minWidth: '22px', textAlign: 'center' }}>
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateCartQty(item.id, 1)}
                                    style={{ padding: '3px 7px', background: 'none', border: 'none', cursor: 'pointer', color: '#374151' }}
                                  >
                                    <Plus size={11} />
                                  </button>
                                </div>

                                {/* Custom Price Override */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>₹</span>
                                  <input
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => updateCartPrice(item.id, e.target.value)}
                                    style={{
                                      width: '70px',
                                      padding: '3px 5px',
                                      fontSize: '0.82rem',
                                      fontWeight: 600,
                                      borderRadius: '4px',
                                      border: '1px solid #D1D5DB',
                                      textAlign: 'right',
                                      background: '#FFFFFF',
                                    }}
                                    title="Custom rate per unit"
                                  />
                                </div>

                                {/* Line Total */}
                                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: billDesign.accentColor, minWidth: '65px', textAlign: 'right' }}>
                                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* B. Customer & Payment Information */}
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid #E5E7EB', background: '#FFFFFF' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
                        Customer & Payment Details
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: '2px' }}>
                              Customer Name *
                            </label>
                            <input
                              type="text"
                              value={billingCustomer.name}
                              onChange={(e) => setBillingCustomer({ ...billingCustomer, name: e.target.value })}
                              placeholder="e.g. Gurpreet Singh"
                              className="form-input"
                              style={{ margin: 0, padding: '5px 8px', fontSize: '0.78rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: '2px' }}>
                              Phone / WhatsApp *
                            </label>
                            <input
                              type="text"
                              value={billingCustomer.phone}
                              onChange={(e) => setBillingCustomer({ ...billingCustomer, phone: e.target.value })}
                              placeholder="e.g. 9876543210"
                              className="form-input"
                              style={{ margin: 0, padding: '5px 8px', fontSize: '0.78rem' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: '2px' }}>
                              Payment Method
                            </label>
                            <select
                              value={billingCustomer.paymentMethod}
                              onChange={(e) => setBillingCustomer({ ...billingCustomer, paymentMethod: e.target.value })}
                              className="form-select"
                              style={{ margin: 0, padding: '5px 8px', fontSize: '0.78rem' }}
                            >
                              <option value="CASH">Cash in Hand / COD</option>
                              <option value="UPI">UPI / QR Code</option>
                              <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                              <option value="RAZORPAY">Card / Razorpay</option>
                              <option value="CREDIT">Khata / Pay Later</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: '2px' }}>
                              Payment Status
                            </label>
                            <select
                              value={billingCustomer.paymentStatus}
                              onChange={(e) => setBillingCustomer({ ...billingCustomer, paymentStatus: e.target.value })}
                              className="form-select"
                              style={{ margin: 0, padding: '5px 8px', fontSize: '0.78rem' }}
                            >
                              <option value="PAID">PAID (Complete)</option>
                              <option value="PENDING">PENDING (Payment Due)</option>
                            </select>
                          </div>
                        </div>

                        {/* Bill Type & Agreement Mode Selector */}
                        <div style={{ marginTop: '2px', paddingTop: '6px', borderTop: '1px dashed #E5E7EB' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FileText size={12} color={billDesign.accentColor} />
                              <span>Bill & Agreement Type</span>
                            </label>
                            <span style={{ fontSize: '0.66rem', color: '#6B7280' }}>
                              {billingBillType === 'auto' ? '⚡ Auto-Detecting' : 'Custom Mode'}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                            {[
                              { id: 'auto', label: '⚡ Auto-Detect' },
                              { id: 'direct_sale', label: '🛒 Produce Sale' },
                              { id: 'rental', label: '🚜 Rental Agreement' },
                              { id: 'combined', label: '🌾 Combined Bill' },
                            ].map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setBillingBillType(t.id)}
                                style={{
                                  padding: '4px 6px',
                                  fontSize: '0.7rem',
                                  fontWeight: billingBillType === t.id ? 700 : 500,
                                  borderRadius: '6px',
                                  border: billingBillType === t.id ? `1.5px solid ${billDesign.accentColor}` : '1px solid #E5E7EB',
                                  background: billingBillType === t.id ? '#ECFDF5' : '#F9FAFB',
                                  color: billingBillType === t.id ? billDesign.accentColor : '#4B5563',
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Machinery Custom Hiring & Rental Details Box */}
                        {(billingBillType === 'rental' || billingBillType === 'combined' || (billingBillType === 'auto' && billingCart.some(i => i.isRental || i.isForRent || (i.unit && (i.unit.toLowerCase().includes('acre') || i.unit.toLowerCase().includes('hour')))))) && (
                          <div style={{ marginTop: '4px', padding: '8px 10px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: 800, color: '#166534' }}>
                                <Tractor size={13} />
                                <span>Machinery Rental & Penalty Terms</span>
                              </div>
                              <span style={{ fontSize: '0.66rem', padding: '1px 5px', background: '#DCFCE7', color: '#15803D', borderRadius: '8px', fontWeight: 700 }}>
                                Custom Hiring
                              </span>
                            </div>

                            <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '2px' }}>
                              Agreed Rental Tenure / Work Capacity:
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '5px' }}>
                              {['1 Acre', '2 Acres', '5 Acres', '10 Acres', '1 Hour', '8 Hours', '24 Hours', 'Per Day'].map((chip) => (
                                <button
                                  key={chip}
                                  type="button"
                                  onClick={() => setBillingRentalDetails({ ...billingRentalDetails, tenure: chip })}
                                  style={{
                                    padding: '2px 6px',
                                    fontSize: '0.68rem',
                                    borderRadius: '10px',
                                    border: billingRentalDetails.tenure === chip ? '1.5px solid #16A34A' : '1px solid #D1D5DB',
                                    background: billingRentalDetails.tenure === chip ? '#16A34A' : '#FFFFFF',
                                    color: billingRentalDetails.tenure === chip ? '#FFFFFF' : '#374151',
                                    fontWeight: billingRentalDetails.tenure === chip ? 700 : 500,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {chip}
                                </button>
                              ))}
                            </div>

                            <input
                              type="text"
                              value={billingRentalDetails.tenure}
                              onChange={(e) => setBillingRentalDetails({ ...billingRentalDetails, tenure: e.target.value })}
                              placeholder="e.g. 5 Acres or 2 Days"
                              className="form-input"
                              style={{ margin: '0 0 6px 0', padding: '3px 6px', fontSize: '0.76rem', background: '#FFFFFF' }}
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                              <div>
                                <label style={{ fontSize: '0.66rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '1px' }}>
                                  Penalty / Extra Hour (₹)
                                </label>
                                <input
                                  type="number"
                                  value={billingRentalDetails.penaltyPerHour}
                                  onChange={(e) => setBillingRentalDetails({ ...billingRentalDetails, penaltyPerHour: parseFloat(e.target.value) || 0 })}
                                  className="form-input"
                                  style={{ margin: 0, padding: '3px 5px', fontSize: '0.76rem', background: '#FFFFFF' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.66rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '1px' }}>
                                  Penalty / Extra Acre (₹)
                                </label>
                                <input
                                  type="number"
                                  value={billingRentalDetails.penaltyPerAcre}
                                  onChange={(e) => setBillingRentalDetails({ ...billingRentalDetails, penaltyPerAcre: parseFloat(e.target.value) || 0 })}
                                  className="form-input"
                                  style={{ margin: 0, padding: '3px 5px', fontSize: '0.76rem', background: '#FFFFFF' }}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                              <div>
                                <label style={{ fontSize: '0.66rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '1px' }}>
                                  Grace Period Allowed
                                </label>
                                <input
                                  type="text"
                                  value={billingRentalDetails.gracePeriod}
                                  onChange={(e) => setBillingRentalDetails({ ...billingRentalDetails, gracePeriod: e.target.value })}
                                  placeholder="e.g. 1 Hour"
                                  className="form-input"
                                  style={{ margin: 0, padding: '3px 5px', fontSize: '0.76rem', background: '#FFFFFF' }}
                                />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', paddingTop: '10px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', fontWeight: 600, color: '#166534', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={billingRentalDetails.operatorIncluded}
                                    onChange={(e) => setBillingRentalDetails({ ...billingRentalDetails, operatorIncluded: e.target.checked })}
                                  />
                                  <span>Operator Included</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* C. Pricing Adjustments: Subtotal, Discount & Delivery */}
                    <div style={{ padding: '12px 14px', background: '#F9FAFB' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#4B5563', marginBottom: '4px' }}>
                        <span>Subtotal:</span>
                        <span style={{ fontWeight: 700, color: '#1F2937' }}>₹{billingSubtotal.toLocaleString('en-IN')}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#4B5563', marginBottom: '4px' }}>
                        <span>Discount / Concession:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span>-₹</span>
                          <input
                            type="number"
                            value={billingDiscount}
                            onChange={(e) => setBillingDiscount(parseFloat(e.target.value) || 0)}
                            style={{ width: '65px', padding: '2px 5px', fontSize: '0.78rem', borderRadius: '4px', border: '1px solid #D1D5DB', textAlign: 'right', background: '#FFFFFF' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#4B5563' }}>
                        <span>Delivery / Freight:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span>+₹</span>
                          <input
                            type="number"
                            value={billingDelivery}
                            onChange={(e) => setBillingDelivery(parseFloat(e.target.value) || 0)}
                            style={{ width: '65px', padding: '2px 5px', fontSize: '0.78rem', borderRadius: '4px', border: '1px solid #D1D5DB', textAlign: 'right', background: '#FFFFFF' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TIER 3: Pinned Fixed Footer (Grand Total, Print, WhatsApp & Save Actions) */}
                  <div className="pos-bill-footer-fixed">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#1F2937' }}>Grand Total:</span>
                      <span style={{ fontSize: '1.35rem', fontWeight: 900, color: billDesign.accentColor }}>
                        ₹{billingGrandTotal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Quick Print & WhatsApp Action Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <button
                        type="button"
                        onClick={handleDirectPrintVirtualBill}
                        disabled={billingCart.length === 0}
                        className="btn btn-secondary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 10px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                        }}
                      >
                        <Printer size={14} />
                        <span>Print Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDirectWhatsAppVirtualBill}
                        disabled={billingCart.length === 0 || sendingBillPdf}
                        className="btn btn-secondary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 10px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: '#15803D',
                          borderColor: '#BBF7D0',
                          background: '#F0FDF4',
                        }}
                      >
                        {sendingBillPdf ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
                        <span>
                          {sendingBillPdf
                            ? 'Sending PDF...'
                            : whatsappStatus?.status === 'CONNECTED'
                              ? 'WhatsApp PDF'
                              : 'Send WhatsApp'}
                        </span>
                      </button>
                    </div>

                    {/* Primary Save & Finalize Order Button */}
                    <button
                      type="button"
                      onClick={handleCreateBill}
                      disabled={generatingBill || billingCart.length === 0}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        padding: '11px',
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: billDesign.accentColor,
                        borderColor: billDesign.accentColor,
                      }}
                    >
                      {generatingBill ? (
                        <>
                          <RefreshCw size={16} className="spin" />
                          <span>Recording Official Invoice...</span>
                        </>
                      ) : (
                        <>
                          <Receipt size={16} />
                          <span>Save & Finalize Bill (₹{billingGrandTotal.toLocaleString('en-IN')})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: PRODUCTS CATALOG MANAGER                      */}
          {/* ==================================================== */}
          {activeTab === 'products' && (
            <div className="admin-tab-view">
              {/* Search, Filter & Quick Category Bar */}
              <div
                style={{
                  background: '#FFFFFF',
                  padding: '16px 20px',
                  borderRadius: '14px',
                  border: '1px solid #E5E7EB',
                  marginBottom: '22px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                {/* Top Row: Search Input + Category Dropdown */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Search Input */}
                  <div style={{ flex: '1 1 320px', position: 'relative' }}>
                    <Search
                      size={17}
                      color="#7A8B80"
                      style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                    />
                    <input
                      type="text"
                      placeholder="Search products by title, Punjabi name, category, or description..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="form-input"
                      style={{
                        paddingLeft: '40px',
                        paddingRight: productSearch ? '36px' : '14px',
                        margin: 0,
                        height: '42px',
                        borderRadius: '8px',
                        fontSize: '0.88rem',
                        border: '1px solid #D1D5DB',
                        background: '#FFFFFF',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    />
                    {productSearch && (
                      <button
                        onClick={() => setProductSearch('')}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          fontSize: '1.2rem',
                          color: '#9CA3AF',
                          cursor: 'pointer',
                          padding: '2px',
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Category Select with integrated icon */}
                  <div style={{ minWidth: '220px', position: 'relative' }}>
                    <Filter
                      size={15}
                      color="#15733E"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                    />
                    <select
                      value={selectedProductCategory}
                      onChange={(e) => setSelectedProductCategory(e.target.value)}
                      className="form-select"
                      style={{
                        margin: 0,
                        paddingLeft: '34px',
                        paddingRight: '30px',
                        height: '42px',
                        borderRadius: '8px',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        border: '1px solid #D1D5DB',
                        background: '#FFFFFF',
                        cursor: 'pointer',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="all">All Categories ({products.length})</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bottom Row: Quick Status & Rental Filter Pills */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '6px', borderTop: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.4px', marginRight: '4px' }}>
                    Filter:
                  </span>
                  <button
                    type="button"
                    onClick={() => setProductListingFilter('all')}
                    className={`btn btn-sm ${productListingFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      fontSize: '0.8rem',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontWeight: 700,
                      background: productListingFilter === 'all' ? '#0A3E22' : '#F9FAFB',
                      color: productListingFilter === 'all' ? '#FFFFFF' : '#374151',
                      borderColor: productListingFilter === 'all' ? '#0A3E22' : '#E5E7EB',
                      cursor: 'pointer',
                    }}
                  >
                    All Products ({products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductListingFilter('featured')}
                    className={`btn btn-sm ${productListingFilter === 'featured' ? 'btn-gold' : 'btn-secondary'}`}
                    style={{
                      fontSize: '0.8rem',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontWeight: 700,
                      background: productListingFilter === 'featured' ? '#F59E0B' : '#F9FAFB',
                      color: productListingFilter === 'featured' ? '#FFFFFF' : '#374151',
                      borderColor: productListingFilter === 'featured' ? '#F59E0B' : '#E5E7EB',
                      cursor: 'pointer',
                    }}
                  >
                    ★ Featured ({products.filter((p) => p.featured).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductListingFilter('rent')}
                    className={`btn btn-sm ${productListingFilter === 'rent' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      fontSize: '0.8rem',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontWeight: 700,
                      background: productListingFilter === 'rent' ? '#7E22CE' : '#F9FAFB',
                      color: productListingFilter === 'rent' ? '#FFFFFF' : '#374151',
                      borderColor: productListingFilter === 'rent' ? '#7E22CE' : '#E5E7EB',
                      cursor: 'pointer',
                    }}
                  >
                    🚜 Available for Rent ({products.filter((p) => getProductListingType(p) === 'rent' || getProductListingType(p) === 'both').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductListingFilter('sale')}
                    className={`btn btn-sm ${productListingFilter === 'sale' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      fontSize: '0.8rem',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontWeight: 700,
                      background: productListingFilter === 'sale' ? '#15733E' : '#F9FAFB',
                      color: productListingFilter === 'sale' ? '#FFFFFF' : '#374151',
                      borderColor: productListingFilter === 'sale' ? '#15733E' : '#E5E7EB',
                      cursor: 'pointer',
                    }}
                  >
                    🌾 Direct Sale ({products.filter((p) => getProductListingType(p) === 'sale' || getProductListingType(p) === 'both').length})
                  </button>
                </div>
              </div>

              {/* Products Table */}
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Image</th>
                      <th>Product Title</th>
                      <th>Category</th>
                      <th>Price & Unit</th>
                      <th>Stock Status</th>
                      <th style={{ minWidth: '140px' }}>Featured & Rental Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id}>
                        <td>
                          <img
                            src={p.imageUrl}
                            alt={p.title}
                            className="admin-table-product-thumb"
                          />
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#122117' }}>{p.title}</div>
                          {p.description && (
                            <div style={{ fontSize: '0.78rem', color: '#7A8B80', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="badge" style={{ background: '#F0FAF4', color: '#0A3E22' }}>
                            {p.category?.name || 'Produce'}
                          </span>
                        </td>
                        <td>
                          <strong>₹ {p.price.toLocaleString('en-IN')}</strong>
                          <div style={{ fontSize: '0.78rem', color: '#7A8B80' }}>/ {p.unit}</div>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => openStockModal(p)}
                            className={`badge ${p.inStock && p.stockCount > 0 ? 'badge-green' : 'badge-gold'}`}
                            style={{ cursor: 'pointer', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            title="Click to adjust stock quantity & in/out-of-stock status"
                          >
                            <Package size={12} />
                            <span>{p.inStock && p.stockCount > 0 ? `In Stock (${p.stockCount})` : 'Out of Stock (0)'}</span>
                          </button>
                        </td>
                        <td>
                          {(() => {
                            const listingType = getProductListingType(p);
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                {p.featured ? (
                                  <span
                                    className="badge badge-gold"
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      padding: '2px 8px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    ★ FEATURED
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.74rem', color: '#7A8B80' }}>Standard</span>
                                )}

                                {(listingType === 'rent' || listingType === 'both') && (
                                  <span
                                    className="badge"
                                    style={{
                                      background: listingType === 'both' ? '#E0F2FE' : '#F3E8FF',
                                      color: listingType === 'both' ? '#0369A1' : '#7E22CE',
                                      border: listingType === 'both' ? '1px solid #BAE6FD' : '1px solid #E9D5FF',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      padding: '2px 8px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    🚜 {listingType === 'both' ? 'Rent & Sale' : 'FOR RENT'}
                                  </span>
                                )}

                                {listingType === 'sale' && (
                                  <span
                                    className="badge"
                                    style={{
                                      background: '#F0FAF4',
                                      color: '#15733E',
                                      border: '1px solid #D1E7DD',
                                      fontSize: '0.72rem',
                                      fontWeight: 600,
                                      padding: '2px 7px',
                                    }}
                                  >
                                    🌾 Direct Sale
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => openStockModal(p)}
                              className={`btn btn-sm ${p.inStock && p.stockCount > 0 ? 'btn-secondary' : 'btn-gold'}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                padding: '5px 10px',
                                borderRadius: '6px',
                              }}
                              title="Adjust Stock Quantity & In/Out-of-Stock Status"
                            >
                              <Package size={14} color={p.inStock && p.stockCount > 0 ? '#15733E' : '#B45309'} />
                              <span>Stock ({p.stockCount ?? (p.inStock ? 50 : 0)})</span>
                            </button>
                            <button
                              onClick={() => openEditProductModal(p)}
                              className="btn btn-secondary btn-sm"
                              title="Edit product"
                            >
                              <Edit size={15} />
                              <span className="hide-on-mobile">Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.title)}
                              className="btn btn-secondary btn-sm text-red"
                              title="Delete product"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#7A8B80' }}>
                          No products found matching criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: CATEGORIES MANAGEMENT (FULL CRUD)             */}
          {/* ==================================================== */}
          {activeTab === 'categories' && (
            <div className="admin-tab-view">
              <div className="admin-categories-grid">
                {categories.map(c => (
                  <div key={c.id} className="admin-category-card">
                    <div className="admin-category-icon-box">
                      <Layers size={24} color="#15733E" />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#122117' }}>{c.name}</h3>
                      <p style={{ fontSize: '0.86rem', color: '#4A5B50', margin: '4px 0 10px' }}>
                        {c.description || 'No description provided.'}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        <span className="badge badge-green">
                          Slug: <strong>{c.slug}</strong>
                        </span>
                        <span className="badge" style={{ background: '#EBF7EE', color: '#15733E' }}>
                          {c._count?.products || 0} Products
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => openEditCategoryModal(c)}
                          className="btn btn-secondary btn-sm"
                          style={{ flexGrow: 1, justifyContent: 'center' }}
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c.id, c.name, c._count?.products || 0)}
                          className="btn btn-secondary btn-sm text-red"
                          title="Delete category"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E8ECE9' }}>
                    <Layers size={36} color="#7A8B80" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ fontSize: '1.2rem', color: '#122117', marginBottom: '6px' }}>No Categories Configured</h3>
                    <p style={{ color: '#7A8B80', marginBottom: '18px' }}>Create your first category to organize catalog products.</p>
                    <button onClick={openAddCategoryModal} className="btn btn-primary">
                      <Plus size={16} />
                      <span>Create First Category</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: ORDERS FULFILLMENT CENTER                     */}
          {/* ==================================================== */}
          {activeTab === 'orders' && (
            <div className="admin-tab-view">
              {/* Order Search & Filters */}
              <div className="admin-filter-bar">
                <div className="admin-search-box">
                  <Search size={17} color="#7A8B80" className="admin-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by Order ID (SK-...), Customer, or Phone..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="form-input admin-search-input"
                  />
                  {orderSearch && (
                    <button onClick={() => setOrderSearch('')} className="admin-search-clear">×</button>
                  )}
                </div>

                <div className="admin-filter-select-wrap">
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="form-select admin-filter-select"
                  >
                    <option value="all">All Statuses ({orders.length})</option>
                    <option value="PENDING">Pending Confirmation</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PROCESSING">Processing & Packing</option>
                    <option value="SHIPPED">Shipped / In Transit</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Orders List */}
              <div className="admin-orders-grid">
                {filteredOrders.map(o => (
                  <div key={o.id} className="admin-order-card">
                    <div className="admin-order-card-header">
                      <div>
                        <div className="admin-order-id">{o.orderNumber}</div>
                        <div className="admin-order-date">
                          <Calendar size={13} />
                          <span>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="admin-order-amount">₹ {o.totalAmount.toLocaleString('en-IN')}</div>
                        <span className={`badge ${o.paymentMethod === 'WHATSAPP' ? 'badge-green' : 'badge-gold'}`}>
                          {o.paymentMethod}
                        </span>
                      </div>
                    </div>

                    <div className="admin-order-customer-box">
                      <div className="admin-order-customer-name">{o.customerName}</div>
                      <div className="admin-order-customer-detail">
                        <Phone size={14} color="#15733E" />
                        <a href={`tel:${o.customerPhone}`} style={{ color: '#15733E', textDecoration: 'underline' }}>
                          {o.customerPhone}
                        </a>
                        <a
                          href={`https://wa.me/91${o.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${o.customerName}! Regarding your SachiKheti order #${o.orderNumber}...`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '0.75rem', marginLeft: 'auto' }}
                        >
                          WhatsApp Customer
                        </a>
                      </div>
                      <div className="admin-order-customer-detail">
                        <MapPin size={14} color="#7A8B80" />
                        <span>{o.address}, {o.city} {o.pincode ? `(${o.pincode})` : ''}</span>
                      </div>
                    </div>

                    <div className="admin-order-items-list">
                      <div className="admin-order-items-title">Ordered Products:</div>
                      {(() => {
                        try {
                          const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
                          return (items || []).map((item, idx) => (
                            <div key={idx} className="admin-order-item-row">
                              <span><strong>{item.quantity}x</strong> {item.title}</span>
                              <span>₹ {(item.price * item.quantity).toLocaleString('en-IN')}</span>
                            </div>
                          ));
                        } catch (e) {
                          return <div style={{ fontSize: '0.8rem', color: '#7A8B80' }}>Items detail encoded</div>;
                        }
                      })()}
                    </div>

                    <div className="admin-order-status-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="admin-order-status-label">Status:</span>
                        <select
                          value={o.orderStatus || o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="form-select admin-order-status-select"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => openEditOrderModal(o)}
                          className="btn btn-secondary btn-sm"
                          title="Edit Order Details"
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(o.id, o.orderNumber)}
                          className="btn btn-secondary btn-sm text-red"
                          title="Permanently Delete Order from Database"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredOrders.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E8ECE9' }}>
                    <ShoppingBag size={36} color="#7A8B80" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ fontSize: '1.2rem', color: '#122117', marginBottom: '6px' }}>No Orders Found</h3>
                    <p style={{ color: '#7A8B80' }}>No customer orders match the current status and search filters.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB: PAST ORDERS & BILLS HISTORY LEDGER (EXCEL THEME) */}
          {/* ==================================================== */}
          {activeTab === 'history' && (
            <div className="admin-tab-view" style={{ padding: 0, maxWidth: '100%' }}>
              {/* Excel Workbook Shell Window Container */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #D2D0CE',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* 2. EXCEL RIBBON TOOLBAR & KPI SUMMARY BAR */}
                <div
                  style={{
                    background: '#F9FAFB',
                    borderBottom: '1px solid #E5E7EB',
                    padding: '10px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {/* KPI Mini-Summary Cells (Styled like Excel KPI Formula Tiles) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                      gap: '8px',
                    }}
                  >
                    {/* Card 1: Gross Sales */}
                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        borderLeft: '4px solid #15733E',
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
                        =SUM(GROSS_SALES)
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#15733E', fontFamily: 'monospace' }}>
                        ₹{historyTotalRevenue.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#4B5563' }}>
                        {orders.length} Total Registered Bills
                      </div>
                    </div>

                    {/* Card 2: Settled Paid */}
                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        borderLeft: '4px solid #16A34A',
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
                        =SUMIF(STATUS, "PAID")
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#16A34A', fontFamily: 'monospace' }}>
                        ₹{historyPaidRevenue.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#16A34A' }}>
                        ✓ {orders.filter((o) => (o.paymentStatus || '').toUpperCase() === 'PAID').length} Settled Records
                      </div>
                    </div>

                    {/* Card 3: Pending Due Khata */}
                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        borderLeft: '4px solid #D97706',
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
                        =SUMIF(STATUS, "PENDING")
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#D97706', fontFamily: 'monospace' }}>
                        ₹{historyPendingRevenue.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#D97706' }}>
                        ⏳ {historyDueCount} Khata / Unpaid
                      </div>
                    </div>

                  </div>

                  {/* 3. EXCEL FORMULA BAR (fx) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        background: '#FFFFFF',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Name Box */}
                      <div
                        style={{
                          padding: '6px 12px',
                          background: '#F3F4F6',
                          borderRight: '1px solid #D1D5DB',
                          fontWeight: 800,
                          color: '#374151',
                          fontFamily: 'monospace',
                          minWidth: '95px',
                          textAlign: 'center',
                        }}
                      >
                        {selectedHistoryRowId
                          ? `ROW_${orders.findIndex((o) => o.id === selectedHistoryRowId) + 1}`
                          : `A1:I${filteredHistory.length}`}
                      </div>

                      {/* fx symbol */}
                      <div
                        style={{
                          padding: '6px 10px',
                          borderRight: '1px solid #D1D5DB',
                          fontWeight: 900,
                          fontStyle: 'italic',
                          color: '#15733E',
                          fontFamily: 'serif',
                        }}
                      >
                        fx
                      </div>

                      {/* Formula Content */}
                      <div
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          color: '#1F2937',
                          fontFamily: 'monospace',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {selectedOrderRecord ? (
                          <span>
                            <strong>SELECTED_ROW:</strong> #{selectedOrderRecord.orderNumber} | <strong>FARMER:</strong> {selectedOrderRecord.customerName} ({selectedOrderRecord.customerPhone}) | <strong>GROSS:</strong> ₹{selectedOrderRecord.totalAmount?.toLocaleString('en-IN')} | <strong>PAYMENT:</strong> {selectedOrderRecord.paymentMethod} ({selectedOrderRecord.paymentStatus})
                          </span>
                        ) : (
                          <span>
                            =SUM(F2:F{filteredHistory.length + 1}) ➔ <strong>₹{filteredHistory.reduce((s, o) => s + (o.totalAmount || 0), 0).toLocaleString('en-IN')}</strong> | =COUNT({filteredHistory.length} bills) | =SETTLED(₹{filteredHistory.filter((o) => (o.paymentStatus || '').toUpperCase() === 'PAID').reduce((s, o) => s + (o.totalAmount || 0), 0).toLocaleString('en-IN')}) | =DUE(₹{filteredHistory.filter((o) => (o.paymentStatus || '').toUpperCase() === 'PENDING').reduce((s, o) => s + (o.totalAmount || 0), 0).toLocaleString('en-IN')})
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={exportHistoryToCSV}
                      className="btn btn-secondary btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#0D522C',
                        color: '#FFFFFF',
                        border: '1px solid #22C55E',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        padding: '6px 12px',
                        height: '32px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                      title="Export full ledger as CSV / XLSX file"
                    >
                      <Download size={13} />
                      <span>Export .CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={loadAllData}
                      className="btn btn-secondary btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px 10px',
                        height: '32px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                      title="Refresh Ledger"
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>
                </div>

                {/* 4. EXCEL WORKSHEET TABLE GRID */}
                {historyViewMode === 'table' ? (
                  <div style={{ overflowX: 'auto', background: '#FFFFFF', maxHeight: '72vh' }}>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.8rem',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                      }}
                    >
                      <thead>
                        {/* Row 1: Excel Column Header Letters (A, B, C...) */}
                        <tr style={{ background: '#F3F2F1', borderBottom: '1px solid #D2D0CE' }}>
                          <th style={{ width: '45px', textAlign: 'center', color: '#605E5C', fontWeight: 800, fontSize: '0.72rem', borderRight: '1px solid #D2D0CE', padding: '4px' }}>
                            ◢
                          </th>
                          <th style={{ padding: '4px 8px', textAlign: 'left', color: '#605E5C', fontWeight: 700, fontSize: '0.72rem', borderRight: '1px solid #D2D0CE', width: '135px' }}>
                            A
                          </th>
                          <th style={{ padding: '4px 8px', textAlign: 'left', color: '#605E5C', fontWeight: 700, fontSize: '0.72rem', borderRight: '1px solid #D2D0CE', width: '120px' }}>
                            B
                          </th>
                          <th style={{ padding: '4px 8px', textAlign: 'left', color: '#605E5C', fontWeight: 700, fontSize: '0.72rem', borderRight: '1px solid #D2D0CE', width: '160px' }}>
                            C
                          </th>
                          <th style={{ padding: '4px 8px', textAlign: 'left', color: '#605E5C', fontWeight: 700, fontSize: '0.72rem', borderRight: '1px solid #D2D0CE', width: '110px' }}>
                            D
                          </th>
                          <th style={{ padding: '4px 8px', textAlign: 'left', color: '#605E5C', fontWeight: 700, fontSize: '0.72rem', borderRight: '1px solid #D2D0CE', minWidth: '220px' }}>
                            E
                          </th>
                          <th style={{ padding: '4px 8px', textAlign: 'right', color: '#605E5C', fontWeight: 700, fontSize: '0.72rem', borderRight: '1px solid #D2D0CE', width: '110px' }}>
                            F
                          </th>
                          <th style={{ padding: '4px 8px', textAlign: 'center', color: '#605E5C', fontWeight: 700, fontSize: '0.72rem', borderRight: '1px solid #D2D0CE', width: '120px' }}>
                            G
                          </th>
                          <th style={{ padding: '4px 8px', textAlign: 'center', color: '#605E5C', fontWeight: 700, fontSize: '0.72rem', borderRight: '1px solid #D2D0CE', width: '120px' }}>
                            H
                          </th>
                          <th style={{ padding: '4px 8px', textAlign: 'center', color: '#605E5C', fontWeight: 700, fontSize: '0.72rem', width: '160px' }}>
                            I
                          </th>
                        </tr>

                        {/* Row 2: Human-readable Field Names with Excel Sort / Filter Buttons */}
                        <tr style={{ background: '#FAF9F8', borderBottom: '2px solid #15733E' }}>
                          <th style={{ textAlign: 'center', padding: '7px 4px', color: '#605E5C', borderRight: '1px solid #D2D0CE', fontSize: '0.72rem', fontWeight: 700 }}>
                            #
                          </th>
                          <th style={{ padding: '7px 10px', textAlign: 'left', color: '#201F1E', fontWeight: 800, borderRight: '1px solid #D2D0CE' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>Bill / Order #</span>
                              <span style={{ fontSize: '0.65rem', color: '#15733E' }}>▼</span>
                            </div>
                          </th>
                          <th style={{ padding: '7px 10px', textAlign: 'left', color: '#201F1E', fontWeight: 800, borderRight: '1px solid #D2D0CE' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>Date & Time</span>
                              <span style={{ fontSize: '0.65rem', color: '#15733E' }}>▼</span>
                            </div>
                          </th>
                          <th style={{ padding: '7px 10px', textAlign: 'left', color: '#201F1E', fontWeight: 800, borderRight: '1px solid #D2D0CE' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>Customer & Phone</span>
                              <span style={{ fontSize: '0.65rem', color: '#15733E' }}>▼</span>
                            </div>
                          </th>
                          <th style={{ padding: '7px 10px', textAlign: 'left', color: '#201F1E', fontWeight: 800, borderRight: '1px solid #D2D0CE' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>Channel</span>
                              <span style={{ fontSize: '0.65rem', color: '#15733E' }}>▼</span>
                            </div>
                          </th>
                          <th style={{ padding: '7px 10px', textAlign: 'left', color: '#201F1E', fontWeight: 800, borderRight: '1px solid #D2D0CE' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>Items & Tenure</span>
                              <span style={{ fontSize: '0.65rem', color: '#15733E' }}>▼</span>
                            </div>
                          </th>
                          <th style={{ padding: '7px 10px', textAlign: 'right', color: '#201F1E', fontWeight: 800, borderRight: '1px solid #D2D0CE' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px' }}>
                              <span>Total Amount (₹)</span>
                              <span style={{ fontSize: '0.65rem', color: '#15733E' }}>▼</span>
                            </div>
                          </th>
                          <th style={{ padding: '7px 10px', textAlign: 'center', color: '#201F1E', fontWeight: 800, borderRight: '1px solid #D2D0CE' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                              <span>Payment</span>
                              <span style={{ fontSize: '0.65rem', color: '#15733E' }}>▼</span>
                            </div>
                          </th>
                          <th style={{ padding: '7px 10px', textAlign: 'center', color: '#201F1E', fontWeight: 800, borderRight: '1px solid #D2D0CE' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                              <span>Fulfillment</span>
                              <span style={{ fontSize: '0.65rem', color: '#15733E' }}>▼</span>
                            </div>
                          </th>
                          <th style={{ padding: '7px 10px', textAlign: 'center', color: '#201F1E', fontWeight: 800 }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHistory.map((o, idx) => {
                          const isPos = (o.orderNumber || '').startsWith('SK-BILL') || (o.notes || '').includes('[Custom POS Bill]');
                          const notesStr = (o.notes || '').toLowerCase();
                          const isRental = notesStr.includes('rental') || notesStr.includes('tenure') || notesStr.includes('penalty');
                          let parsedItems = [];
                          try {
                            parsedItems = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
                          } catch (e) {}

                          const isSelected = selectedHistoryRowId === o.id;

                          return (
                            <tr
                              key={o.id}
                              onClick={() => setSelectedHistoryRowId(isSelected ? null : o.id)}
                              style={{
                                background: isSelected ? '#F0FDF4' : idx % 2 === 0 ? '#FFFFFF' : '#FAF9F8',
                                borderBottom: '1px solid #E1DFDD',
                                cursor: 'pointer',
                                transition: 'background 0.1s ease',
                                outline: isSelected ? '2px solid #15733E' : 'none',
                              }}
                            >
                              {/* Row Number Header Cell */}
                              <td
                                style={{
                                  textAlign: 'center',
                                  padding: '8px 4px',
                                  background: isSelected ? '#DCFCE7' : '#F3F2F1',
                                  color: isSelected ? '#15733E' : '#605E5C',
                                  fontWeight: 800,
                                  fontSize: '0.74rem',
                                  borderRight: '1px solid #D2D0CE',
                                  fontFamily: 'monospace',
                                  userSelect: 'none',
                                }}
                              >
                                {idx + 1}
                              </td>

                              {/* Col A: Bill / Order # */}
                              <td style={{ padding: '8px 10px', borderRight: '1px solid #E1DFDD' }}>
                                <div style={{ fontWeight: 800, color: '#111827', fontFamily: 'monospace', fontSize: '0.84rem' }}>
                                  {o.orderNumber}
                                </div>
                                <span
                                  style={{
                                    fontSize: '0.66rem',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    display: 'inline-block',
                                    marginTop: '2px',
                                    fontWeight: 700,
                                    background: isRental ? '#DCFCE7' : isPos ? '#DBEAFE' : '#FEF3C7',
                                    color: isRental ? '#166534' : isPos ? '#1E40AF' : '#92400E',
                                  }}
                                >
                                  {isRental ? '🚜 Rental Hiring' : isPos ? '🛒 POS Bill' : '🌐 Web Order'}
                                </span>
                              </td>

                              {/* Col B: Date & Time */}
                              <td style={{ padding: '8px 10px', borderRight: '1px solid #E1DFDD' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                                  {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                                  {new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>

                              {/* Col C: Customer & Phone */}
                              <td style={{ padding: '8px 10px', borderRight: '1px solid #E1DFDD' }}>
                                <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.82rem' }}>
                                  {o.customerName}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: '#15733E', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Phone size={10} />
                                  <a href={`tel:${o.customerPhone}`} style={{ color: '#15733E', textDecoration: 'none' }}>
                                    {o.customerPhone}
                                  </a>
                                </div>
                                {o.city && (
                                  <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>
                                    📍 {o.city}
                                  </div>
                                )}
                              </td>

                              {/* Col D: Channel */}
                              <td style={{ padding: '8px 10px', borderRight: '1px solid #E1DFDD', fontSize: '0.76rem' }}>
                                <span style={{ fontWeight: 600, color: '#4B5563' }}>
                                  {isPos ? 'Store POS' : (o.paymentMethod === 'WHATSAPP' ? 'WhatsApp' : 'Online Store')}
                                </span>
                              </td>

                              {/* Col E: Items Purchased & Rental Tenure */}
                              <td style={{ padding: '8px 10px', borderRight: '1px solid #E1DFDD' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '260px' }}>
                                  {(parsedItems || []).slice(0, 2).map((it, iIdx) => (
                                    <div key={iIdx} style={{ fontSize: '0.76rem', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      <strong style={{ color: '#15733E' }}>{it.quantity}x</strong> {it.title}
                                      {it.unit && <span style={{ color: '#6B7280', fontSize: '0.7rem' }}> ({it.unit})</span>}
                                    </div>
                                  ))}
                                  {(parsedItems || []).length > 2 && (
                                    <span style={{ fontSize: '0.68rem', color: '#6B7280', fontStyle: 'italic' }}>
                                      + {(parsedItems.length - 2)} more items
                                    </span>
                                  )}
                                  {isRental && (
                                    <div style={{ fontSize: '0.68rem', color: '#166534', fontWeight: 700, marginTop: '2px' }}>
                                      🚜 Custom Hiring Agreement Included
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Col F: Total Amount (₹) */}
                              <td style={{ padding: '8px 10px', textAlign: 'right', borderRight: '1px solid #E1DFDD' }}>
                                <div style={{ fontWeight: 900, color: '#15733E', fontSize: '0.94rem', fontFamily: 'monospace' }}>
                                  ₹{o.totalAmount.toLocaleString('en-IN')}
                                </div>
                              </td>

                              {/* Col G: Payment Status & Method */}
                              <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid #E1DFDD' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#4B5563', marginBottom: '2px' }}>
                                  {o.paymentMethod}
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTogglePaymentStatus(o.id, (o.paymentStatus || 'PENDING').toUpperCase());
                                  }}
                                  style={{
                                    fontSize: '0.7rem',
                                    padding: '2px 7px',
                                    borderRadius: '12px',
                                    border: (o.paymentStatus || '').toUpperCase() === 'PAID' ? '1px solid #86EFAC' : '1px solid #FCD34D',
                                    background: (o.paymentStatus || '').toUpperCase() === 'PAID' ? '#DCFCE7' : '#FEF3C7',
                                    color: (o.paymentStatus || '').toUpperCase() === 'PAID' ? '#166534' : '#92400E',
                                    cursor: 'pointer',
                                    fontWeight: 800,
                                  }}
                                  title="Click to toggle Paid / Pending"
                                >
                                  {(o.paymentStatus || '').toUpperCase() === 'PAID' ? '✓ PAID' : '⏳ PENDING'}
                                </button>
                              </td>

                              {/* Col H: Fulfillment Status */}
                              <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid #E1DFDD' }}>
                                <select
                                  value={o.orderStatus || o.status || 'PENDING'}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                  className="form-select admin-order-status-select"
                                  style={{ margin: 0, padding: '3px 6px', fontSize: '0.74rem', border: '1px solid #D1D5DB' }}
                                >
                                  <option value="PENDING">Pending</option>
                                  <option value="CONFIRMED">Confirmed</option>
                                  <option value="PROCESSING">Processing</option>
                                  <option value="SHIPPED">Shipped</option>
                                  <option value="DELIVERED">Delivered</option>
                                  <option value="CANCELLED">Cancelled</option>
                                </select>
                              </td>

                              {/* Col I: Actions / Dispatch */}
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => handleViewPastBill(o)}
                                    style={{
                                      padding: '4px 7px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      borderRadius: '4px',
                                      border: '1px solid #D1D5DB',
                                      background: '#FFFFFF',
                                      color: '#15733E',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                    }}
                                    title="View & Print Official Tax Invoice"
                                  >
                                    <Receipt size={12} color="#15733E" />
                                    <span>Bill</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleWhatsAppPastBill(o)}
                                    style={{
                                      padding: '4px 7px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      borderRadius: '4px',
                                      border: '1px solid #BBF7D0',
                                      background: '#F0FDF4',
                                      color: '#15803D',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                    }}
                                    title="Send Official PDF Bill to Customer on WhatsApp"
                                  >
                                    <Send size={12} />
                                    <span>PDF</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openEditOrderModal(o)}
                                    style={{
                                      padding: '4px 6px',
                                      borderRadius: '4px',
                                      border: '1px solid #D1D5DB',
                                      background: '#FFFFFF',
                                      color: '#4B5563',
                                      cursor: 'pointer',
                                    }}
                                    title="Edit Order / Bill Record"
                                  >
                                    <Edit size={12} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOrder(o.id, o.orderNumber)}
                                    style={{
                                      padding: '4px 6px',
                                      borderRadius: '4px',
                                      border: '1px solid #FECACA',
                                      background: '#FEF2F2',
                                      color: '#DC2626',
                                      cursor: 'pointer',
                                    }}
                                    title="Permanently Delete Record"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>

                      {/* AutoSum Accounting Total Footer Row */}
                      <tfoot>
                        <tr
                          style={{
                            background: '#FAF9F8',
                            borderTop: '2px solid #15733E',
                            borderBottom: '3px double #15733E',
                            fontWeight: 800,
                          }}
                        >
                          <td style={{ textAlign: 'center', padding: '10px 4px', background: '#F3F2F1', borderRight: '1px solid #D2D0CE', color: '#15733E' }}>
                            Σ
                          </td>
                          <td colSpan={4} style={{ padding: '10px 12px', borderRight: '1px solid #E1DFDD', color: '#15733E' }}>
                            =AUTOSUM_TOTALS ({filteredHistory.length} Filtered Ledger Rows)
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'left', borderRight: '1px solid #E1DFDD', color: '#6B7280', fontSize: '0.74rem' }}>
                            Gross Ledger Balance:
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', borderRight: '1px solid #E1DFDD', color: '#15733E', fontSize: '1.05rem', fontFamily: 'monospace' }}>
                            ₹{filteredHistory.reduce((s, o) => s + (o.totalAmount || 0), 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', borderRight: '1px solid #E1DFDD', fontSize: '0.74rem' }}>
                            <span style={{ color: '#16A34A' }}>
                              ✓ ₹{filteredHistory.filter((o) => (o.paymentStatus || '').toUpperCase() === 'PAID').reduce((s, o) => s + (o.totalAmount || 0), 0).toLocaleString('en-IN')}
                            </span>
                            <br />
                            <span style={{ color: '#D97706' }}>
                              ⏳ ₹{filteredHistory.filter((o) => (o.paymentStatus || '').toUpperCase() === 'PENDING').reduce((s, o) => s + (o.totalAmount || 0), 0).toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td colSpan={2} style={{ padding: '10px 12px', textAlign: 'center', color: '#6B7280', fontSize: '0.72rem' }}>
                            Audit Confirmed • SachiKheti
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  /* Cards View Mode */
                  <div style={{ padding: '16px' }}>
                    <div className="admin-orders-grid">
                      {filteredHistory.map((o) => {
                        const isPos = (o.orderNumber || '').startsWith('SK-BILL') || (o.notes || '').includes('[Custom POS Bill]');
                        let parsedItems = [];
                        try {
                          parsedItems = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
                        } catch (e) {}

                        return (
                          <div key={o.id} className="admin-order-card" style={{ borderLeft: '4px solid #15733E' }}>
                            <div className="admin-order-card-header">
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div className="admin-order-id" style={{ fontFamily: 'monospace', color: '#15733E' }}>
                                    {o.orderNumber}
                                  </div>
                                  <span className={`badge ${isPos ? 'badge-blue' : 'badge-gold'}`} style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                                    {isPos ? 'POS Bill' : 'Web Store'}
                                  </span>
                                </div>
                                <div className="admin-order-date">
                                  <Calendar size={13} />
                                  <span>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div className="admin-order-amount" style={{ color: '#15733E', fontFamily: 'monospace' }}>
                                  ₹{o.totalAmount.toLocaleString('en-IN')}
                                </div>
                                <span className={`badge ${(o.paymentStatus || '').toUpperCase() === 'PAID' ? 'badge-green' : 'badge-gold'}`} style={{ fontSize: '0.72rem' }}>
                                  {o.paymentMethod} • {(o.paymentStatus || '').toUpperCase() === 'PAID' ? 'PAID' : 'DUE'}
                                </span>
                              </div>
                            </div>

                            <div className="admin-order-customer-box">
                              <div className="admin-order-customer-name">{o.customerName}</div>
                              <div className="admin-order-customer-detail">
                                <Phone size={14} color="#15733E" />
                                <a href={`tel:${o.customerPhone}`} style={{ color: '#15733E', textDecoration: 'underline' }}>
                                  {o.customerPhone}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleWhatsAppPastBill(o)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '2px 8px', fontSize: '0.75rem', marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16A34A' }}
                                >
                                  <Send size={12} />
                                  <span>Send WA PDF</span>
                                </button>
                              </div>
                              {o.address && (
                                <div className="admin-order-customer-detail">
                                  <MapPin size={14} color="#7A8B80" />
                                  <span>{o.address}, {o.city}</span>
                                </div>
                              )}
                            </div>

                            <div className="admin-order-items-list">
                              <div className="admin-order-items-title">Purchased Items:</div>
                              {(parsedItems || []).map((item, idx) => (
                                <div key={idx} className="admin-order-item-row">
                                  <span><strong>{item.quantity}x</strong> {item.title}</span>
                                  <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                            </div>

                            <div className="admin-order-status-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Status:</span>
                                <select
                                  value={o.orderStatus || o.status}
                                  onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                  className="form-select admin-order-status-select"
                                  style={{ fontSize: '0.78rem', padding: '3px 6px' }}
                                >
                                  <option value="PENDING">Pending</option>
                                  <option value="CONFIRMED">Confirmed</option>
                                  <option value="PROCESSING">Processing</option>
                                  <option value="SHIPPED">Shipped</option>
                                  <option value="DELIVERED">Delivered</option>
                                  <option value="CANCELLED">Cancelled</option>
                                </select>
                              </div>

                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleViewPastBill(o)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Receipt size={13} color="#15733E" />
                                  <span>Print Bill</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditOrderModal(o)}
                                  className="btn btn-secondary btn-sm"
                                >
                                  <Edit size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOrder(o.id, o.orderNumber)}
                                  className="btn btn-secondary btn-sm text-red"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 5. EXCEL WORKBOOK SHEET TABS (Bottom Bar) */}
                <div
                  style={{
                    background: '#F3F2F1',
                    borderTop: '1px solid #D2D0CE',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0 12px',
                    overflowX: 'auto',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  {/* Sheet Tabs */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', paddingTop: '4px' }}>
                    {[
                      { id: 'all', label: '📄 All Bills & Orders', count: orders.length },
                      { id: 'pos', label: '🛒 POS Counter Bills', count: historyPosBillsCount },
                      { id: 'rental', label: '🚜 Machinery Rentals', count: historyRentalCount },
                      { id: 'due', label: '⏳ Due Khata', count: historyDueCount },
                      { id: 'online', label: '🌐 Web Store', count: historyStoreOrdersCount },
                    ].map((tab) => {
                      const isActive = historyActiveSheet === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setHistoryActiveSheet(tab.id);
                            if (tab.id === 'all') {
                              setHistoryTypeFilter('all');
                              setHistoryPaymentStatusFilter('all');
                            } else if (tab.id === 'pos') {
                              setHistoryTypeFilter('pos');
                              setHistoryPaymentStatusFilter('all');
                            } else if (tab.id === 'due') {
                              setHistoryTypeFilter('all');
                              setHistoryPaymentStatusFilter('PENDING');
                            } else if (tab.id === 'online') {
                              setHistoryTypeFilter('store');
                              setHistoryPaymentStatusFilter('all');
                            }
                          }}
                          style={{
                            padding: '6px 14px',
                            fontSize: '0.74rem',
                            fontWeight: isActive ? 800 : 600,
                            color: isActive ? '#15733E' : '#4B5563',
                            background: isActive ? '#FFFFFF' : '#E1DFDD',
                            border: '1px solid #D2D0CE',
                            borderBottom: isActive ? '2px solid #FFFFFF' : '1px solid #D2D0CE',
                            borderTop: isActive ? '3px solid #15733E' : '1px solid #D2D0CE',
                            borderRadius: '6px 6px 0 0',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: isActive ? '-1px' : '0',
                            zIndex: isActive ? 2 : 1,
                            boxShadow: isActive ? '0 -1px 3px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.1s ease',
                          }}
                        >
                          <span>{tab.label}</span>
                          <span
                            style={{
                              background: isActive ? '#EBF7EE' : '#D1D5DB',
                              color: isActive ? '#15733E' : '#374151',
                              fontSize: '0.66rem',
                              padding: '1px 5px',
                              borderRadius: '8px',
                              fontWeight: 700,
                            }}
                          >
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Excel Status Bar on Right */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.72rem', color: '#605E5C', padding: '6px 0' }}>
                    <span style={{ fontWeight: 700, color: '#15733E' }}>● READY</span>
                    <span>•</span>
                    <span>Count: <strong>{filteredHistory.length}</strong></span>
                    <span>•</span>
                    <span>Sum: <strong style={{ color: '#15733E', fontFamily: 'monospace' }}>₹{filteredHistory.reduce((s, o) => s + (o.totalAmount || 0), 0).toLocaleString('en-IN')}</strong></span>
                    <span>•</span>
                    <span>Avg: <strong style={{ fontFamily: 'monospace' }}>₹{filteredHistory.length ? Math.round(filteredHistory.reduce((s, o) => s + (o.totalAmount || 0), 0) / filteredHistory.length).toLocaleString('en-IN') : 0}</strong></span>
                    <span>•</span>
                    <span>Zoom: 100%</span>
                  </div>
                </div>
              </div>

              {/* Empty Search/Filter State */}
              {filteredHistory.length === 0 && (
                <div style={{ textAlign: 'center', padding: '50px 20px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', marginTop: '16px' }}>
                  <History size={36} color="#9CA3AF" style={{ margin: '0 auto 10px' }} />
                  <h3 style={{ fontSize: '1.1rem', color: '#111827', marginBottom: '6px' }}>No Orders or Bills Match Your Search</h3>
                  <p style={{ color: '#6B7280', fontSize: '0.84rem', maxWidth: '420px', margin: '0 auto 12px' }}>
                    Try searching with another keyword or reset the filter criteria to see all historical records.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setHistorySearch('');
                      setHistoryActiveSheet('all');
                      setHistoryTypeFilter('all');
                      setHistoryPaymentStatusFilter('all');
                      setHistoryPaymentMethodFilter('all');
                      setHistoryDatePreset('all');
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Reset Worksheet Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 5: SYSTEM & STORE SETTINGS                      */}
          {/* ==================================================== */}
          {activeTab === 'settings' && (
            <div className="admin-tab-view">
              {/* Settings Sub-Navigation Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  background: '#FFFFFF',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  marginBottom: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('ribbon')}
                  className={`btn btn-sm ${settingsSubTab === 'ribbon' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.86rem' }}
                >
                  <Megaphone size={16} />
                  <span>Announcement Ribbon</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsSubTab('whatsapp')}
                  className={`btn btn-sm ${settingsSubTab === 'whatsapp' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.86rem' }}
                >
                  <MessageSquare size={16} />
                  <span>WhatsApp Baileys Connect</span>
                  {whatsappStatus?.status === 'CONNECTED' ? (
                    <span style={{ fontSize: '0.72rem', background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                      Live
                    </span>
                  ) : whatsappStatus?.status === 'SCAN_QR' ? (
                    <span style={{ fontSize: '0.72rem', background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                      Scan QR
                    </span>
                  ) : null}
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsSubTab('bill')}
                  className={`btn btn-sm ${settingsSubTab === 'bill' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.86rem' }}
                >
                  <Palette size={16} />
                  <span>Customized Bill Design</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsSubTab('payments')}
                  className={`btn btn-sm ${settingsSubTab === 'payments' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.86rem' }}
                >
                  <CreditCard size={16} />
                  <span>Razorpay Payment Gateway</span>
                  {razorpaySettings.razorpayEnabled ? (
                    <span style={{ fontSize: '0.72rem', background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                      Live Active
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', background: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                      Disabled
                    </span>
                  )}
                </button>
              </div>

              {/* SUB-TAB 1: ANNOUNCEMENT RIBBON */}
              {settingsSubTab === 'ribbon' && (
                <div style={{ maxWidth: '800px' }}>
                  {/* Live Preview Card */}
                  <div style={{ marginBottom: '20px', background: '#FFFFFF', padding: '16px 20px', borderRadius: '14px', border: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Live Storefront Banner Preview:
                    </div>
                    {banner.isActive ? (
                      <div
                        style={{
                          background: 'linear-gradient(90deg, #0A3E22 0%, #15733E 100%)',
                          color: '#FFFFFF',
                          padding: '12px 18px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        <Megaphone size={18} color="#FBBF24" style={{ flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#FDE68A' }}>
                            {banner.title || 'Announcement Title'}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#E6F4EA', marginTop: '2px' }}>
                            {banner.message || 'Announcement message displayed to all customer store visitors.'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '12px 16px', background: '#F3F4F6', color: '#6B7280', borderRadius: '10px', fontSize: '0.84rem', fontStyle: 'italic' }}>
                        Ribbon is currently deactivated (hidden from storefront visitors).
                      </div>
                    )}
                  </div>

                  <div className="admin-panel-card">
                    <form onSubmit={handleSaveBanner}>
                      <div className="form-group">
                        <label className="form-label">Banner Title</label>
                        <input
                          type="text"
                          required
                          value={banner.title}
                          onChange={(e) => setBanner({ ...banner, title: e.target.value })}
                          className="form-input"
                          placeholder="e.g. 🌾 SachiKheti Festive Harvest Offer"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Banner Message</label>
                        <textarea
                          rows={3}
                          required
                          value={banner.message}
                          onChange={(e) => setBanner({ ...banner, message: e.target.value })}
                          className="form-textarea"
                          placeholder="e.g. Get 10% off on Pure Desi Ghee & Sweets! Direct WhatsApp farmer delivery available."
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0 24px' }}>
                        <input
                          type="checkbox"
                          id="bannerActive"
                          checked={banner.isActive}
                          onChange={(e) => setBanner({ ...banner, isActive: e.target.checked })}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <label htmlFor="bannerActive" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#122117', cursor: 'pointer' }}>
                          Publish Banner Active on Live Site
                        </label>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button type="submit" className="btn btn-primary">
                          <CheckCircle size={17} />
                          <span>Save Announcement Ribbon</span>
                        </button>
                        {banner.id && (
                          <button
                            type="button"
                            onClick={handleDeleteBanner}
                            className="btn btn-secondary text-red"
                            title="Delete this banner from database"
                          >
                            <Trash2 size={16} />
                            <span>Delete Ribbon</span>
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: WHATSAPP BAILEYS INTEGRATION (SINGLE ACTIVE DEVICE ENFORCED) */}
              {settingsSubTab === 'whatsapp' && (
                <div style={{ maxWidth: '860px' }}>
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E5E7EB',
                      padding: '24px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      marginBottom: '20px',
                    }}
                  >
                    {/* Header with Title */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <MessageSquare size={22} color="#15733E" />
                          <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#1F2937', margin: 0 }}>
                            WhatsApp Baileys Headless Connection
                          </h3>
                        </div>
                        <p style={{ fontSize: '0.84rem', color: '#6B7280', marginTop: '4px' }}>
                          Direct server-side WhatsApp Web session for automated invoice & bill dispatching without opening external apps.
                        </p>
                      </div>
                    </div>

                    {/* Prominent Action Controls Bar (Sync, Hard Reset, Disconnect) */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '10px',
                        background: '#F9FAFB',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB',
                        marginBottom: '20px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {/* Sync Button */}
                        <button
                          type="button"
                          onClick={handleSyncWhatsApp}
                          disabled={syncingWhatsApp}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                          title="Probe live Baileys socket and sync status across all admin portals"
                        >
                          <RefreshCw size={14} className={syncingWhatsApp ? 'spin' : ''} />
                          <span>{syncingWhatsApp ? 'Syncing...' : 'Sync & Refresh Status'}</span>
                        </button>

                        {/* Hard Reset Button */}
                        <button
                          type="button"
                          onClick={handleResetWhatsApp}
                          disabled={resettingWhatsApp}
                          className="btn btn-secondary btn-sm text-red"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                          title="Wipe stored credentials and generate brand new QR code"
                        >
                          <Trash2 size={14} className={resettingWhatsApp ? 'spin' : ''} />
                          <span>{resettingWhatsApp ? 'Resetting...' : 'Hard Reset Session'}</span>
                        </button>
                      </div>

                      <div>
                        {/* Disconnect Button */}
                        {whatsappStatus?.status === 'CONNECTED' && (
                          <button
                            type="button"
                            onClick={handleDisconnectWhatsApp}
                            disabled={loadingWhatsApp}
                            className="btn btn-secondary btn-sm text-red"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                            title="Unlink device and close socket cleanly"
                          >
                            <LogOut size={14} />
                            <span>Disconnect WhatsApp</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* QR Code Presentation when SCAN_QR */}
                    {whatsappStatus?.status === 'SCAN_QR' && whatsappStatus.qr && (
                      <div
                        style={{
                          background: '#F9FAFB',
                          borderRadius: '14px',
                          border: '2px dashed #15733E',
                          padding: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          margin: '18px 0',
                        }}
                      >
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#15733E', marginBottom: '8px' }}>
                          Scan with WhatsApp on your Mobile Phone
                        </h4>
                        <p style={{ fontSize: '0.84rem', color: '#4B5563', maxWidth: '460px', marginBottom: '16px', lineHeight: 1.5 }}>
                          1. Open <strong>WhatsApp</strong> on your mobile phone.<br />
                          2. Tap <strong>Settings</strong> (iOS) or <strong>Three Dots ⋮</strong> (Android) &gt; <strong>Linked Devices</strong>.<br />
                          3. Tap <strong>Link a Device</strong> and point your camera at this QR code:
                        </p>

                        <div
                          style={{
                            background: '#FFFFFF',
                            padding: '16px',
                            borderRadius: '16px',
                            boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
                            border: '1px solid #E5E7EB',
                          }}
                        >
                          <img
                            src={whatsappStatus.qr}
                            alt="WhatsApp Baileys QR Code"
                            style={{ width: '250px', height: '250px', display: 'block', borderRadius: '8px' }}
                          />
                        </div>

                        <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={handleSyncWhatsApp}
                            disabled={syncingWhatsApp}
                            className="btn btn-primary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <RefreshCw size={14} className={syncingWhatsApp ? 'spin' : ''} />
                            <span>I Scanned It (Check Status)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartWhatsApp(true)}
                            disabled={loadingWhatsApp}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <RefreshCw size={14} className={loadingWhatsApp ? 'spin' : ''} />
                            <span>Regenerate QR</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Connected View */}
                    {whatsappStatus?.status === 'CONNECTED' ? (
                      <div style={{ background: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0', padding: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                          <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: '10px', border: '1px solid #DCFCE7' }}>
                            <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Connected Mobile</div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#14532D', marginTop: '2px' }}>
                              +{whatsappStatus.user?.phone || '8360253372'}
                            </div>
                          </div>

                          <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: '10px', border: '1px solid #DCFCE7' }}>
                            <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Session Mode</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#14532D', marginTop: '2px' }}>
                              Single Dedicated Server Instance
                            </div>
                          </div>

                          <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: '10px', border: '1px solid #DCFCE7' }}>
                            <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Live Connectivity</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#166534', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} />
                              WebSocket Open & Ready
                            </div>
                          </div>

                          <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: '10px', border: '1px solid #DCFCE7' }}>
                            <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Last Synced</div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#4B5563', marginTop: '2px' }}>
                              {whatsappStatus.lastSyncedAt ? new Date(whatsappStatus.lastSyncedAt).toLocaleTimeString('en-IN') : 'Just now'}
                            </div>
                          </div>
                        </div>

                        {/* Test Message Form */}
                        <form onSubmit={handleSendTestWhatsApp} style={{ paddingTop: '16px', borderTop: '1px solid #DCFCE7' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#166534', display: 'block', marginBottom: '6px' }}>
                            Send Test Ping Message to Customer / Farmer Phone
                          </label>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                              type="text"
                              value={whatsappTestPhone}
                              onChange={(e) => setWhatsappTestPhone(e.target.value)}
                              placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                              className="form-input"
                              style={{ margin: 0, flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                            />
                            <button
                              type="submit"
                              disabled={sendingWhatsApp}
                              className="btn btn-primary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                            >
                              {sendingWhatsApp ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
                              <span>Send Test Ping</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      /* Disconnected View Action */
                      whatsappStatus?.status !== 'SCAN_QR' && (
                        <div style={{ marginTop: '14px' }}>
                          <p style={{ fontSize: '0.84rem', color: '#4B5563', marginBottom: '16px', lineHeight: 1.5 }}>
                            Connecting your WhatsApp mobile app enables single-device automated dispatch. All virtual bills, customized invoices, and rental booking slips created in the Customer Store will be sent directly to the customer's phone without opening external browser windows.
                          </p>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => handleStartWhatsApp(false)}
                              disabled={loadingWhatsApp}
                              className="btn btn-primary"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                            >
                              {loadingWhatsApp ? (
                                <>
                                  <RefreshCw size={16} className="spin" />
                                  <span>Generating QR Code...</span>
                                </>
                              ) : (
                                <>
                                  <QrCode size={18} />
                                  <span>Connect WhatsApp (Show QR Code)</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={handleResetWhatsApp}
                              disabled={resettingWhatsApp}
                              className="btn btn-secondary text-red"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                            >
                              <Trash2 size={16} className={resettingWhatsApp ? 'spin' : ''} />
                              <span>Reset Stored Credentials</span>
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: CUSTOMIZED BILL DESIGN */}
              {settingsSubTab === 'bill' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.25fr) minmax(360px, 420px)',
                    gap: '24px',
                    alignItems: 'start',
                  }}
                >
                  {/* Left: Customization Form */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E5E7EB',
                      padding: '24px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1F2937', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Palette size={20} color={billDesign.accentColor} />
                      <span>Customized Invoice & Bill Template</span>
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: '#6B7280', marginBottom: '20px' }}>
                      Customize company headers, tax identifiers, billing titles, and themes for all generated invoices and virtual bills.
                    </p>

                    <form onSubmit={handleSaveBillDesign} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Company / Store Name (English & Punjabi)</label>
                        <input
                          type="text"
                          required
                          value={billDesign.companyName}
                          onChange={(e) => setBillDesign({ ...billDesign, companyName: e.target.value })}
                          className="form-input"
                          style={{ margin: 0 }}
                          placeholder="e.g. ਸੱਚੀ ਖੇਤੀ | SachiKheti (LFPC Ltd.)"
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Tagline / Organization Subtitle</label>
                        <input
                          type="text"
                          value={billDesign.tagline}
                          onChange={(e) => setBillDesign({ ...billDesign, tagline: e.target.value })}
                          className="form-input"
                          style={{ margin: 0 }}
                          placeholder="e.g. Direct Farmer Prosperity • Certified Natural Produce & Farm Machinery"
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Invoice Header Title</label>
                          <input
                            type="text"
                            required
                            value={billDesign.billTitle}
                            onChange={(e) => setBillDesign({ ...billDesign, billTitle: e.target.value })}
                            className="form-input"
                            style={{ margin: 0 }}
                            placeholder="e.g. TAX INVOICE / CASH MEMO"
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Tax / FSSAI / GSTIN Numbers</label>
                          <input
                            type="text"
                            value={billDesign.gstin}
                            onChange={(e) => setBillDesign({ ...billDesign, gstin: e.target.value })}
                            className="form-input"
                            style={{ margin: 0 }}
                            placeholder="e.g. FSSAI: 20822005001234 | GSTIN: ..."
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Store Address</label>
                          <input
                            type="text"
                            value={billDesign.address}
                            onChange={(e) => setBillDesign({ ...billDesign, address: e.target.value })}
                            className="form-input"
                            style={{ margin: 0 }}
                            placeholder="e.g. VPO Bhirdana, Fatehabad, Haryana"
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Official Contact Phone</label>
                          <input
                            type="text"
                            value={billDesign.phone}
                            onChange={(e) => setBillDesign({ ...billDesign, phone: e.target.value })}
                            className="form-input"
                            style={{ margin: 0 }}
                            placeholder="e.g. +91 8360253372"
                          />
                        </div>
                      </div>

                      {/* Theme Accent Color Picker */}
                      <div>
                        <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>
                          Invoice Theme Accent Color
                        </label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          {[
                            { name: 'Forest Green', hex: '#15733E' },
                            { name: 'Royal Navy', hex: '#1E3A8A' },
                            { name: 'Crimson Red', hex: '#991B1B' },
                            { name: 'Harvest Gold', hex: '#B45309' },
                            { name: 'Classic Charcoal', hex: '#1F2937' },
                          ].map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setBillDesign({ ...billDesign, accentColor: c.hex })}
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: c.hex,
                                border: billDesign.accentColor === c.hex ? '3px solid #000000' : '2px solid #FFFFFF',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#FFFFFF',
                                transition: 'transform 0.15s ease',
                                transform: billDesign.accentColor === c.hex ? 'scale(1.15)' : 'scale(1)',
                              }}
                              title={c.name}
                            >
                              {billDesign.accentColor === c.hex && <Check size={16} strokeWidth={3} />}
                            </button>
                          ))}
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: billDesign.accentColor, marginLeft: '8px' }}>
                            {billDesign.accentColor}
                          </span>
                        </div>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Direct Produce Sales Terms & Assurance Note</label>
                        <textarea
                          rows={2}
                          value={billDesign.termsNotes}
                          onChange={(e) => setBillDesign({ ...billDesign, termsNotes: e.target.value })}
                          className="form-textarea"
                          style={{ margin: 0, fontSize: '0.8rem' }}
                        />
                      </div>

                      {/* Dedicated Machinery Rental & Custom Hiring Agreement Configuration */}
                      <div style={{ marginTop: '10px', padding: '16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <Tractor size={18} color="#15803D" />
                          <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: '#166534' }}>
                            Machinery Rental Agreement & Overdue Penalty Policy
                          </h4>
                        </div>
                        <p style={{ margin: '0 0 12px 0', fontSize: '0.76rem', color: '#166534' }}>
                          Specify the legal header, default tenure units, and enforceable overdue penalties for agricultural tractors, seeders, levelers, and custom hiring.
                        </p>

                        <div className="form-group" style={{ marginBottom: '10px' }}>
                          <label className="form-label" style={{ fontSize: '0.78rem', color: '#14532D' }}>
                            Rental Agreement Header Title
                          </label>
                          <input
                            type="text"
                            value={billDesign.rentalBillTitle || ''}
                            onChange={(e) => setBillDesign({ ...billDesign, rentalBillTitle: e.target.value })}
                            className="form-input"
                            style={{ margin: 0, background: '#FFFFFF' }}
                            placeholder="AGRICULTURAL MACHINERY CUSTOM HIRING & RENTAL AGREEMENT"
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.74rem', color: '#14532D' }}>
                              Default Overdue Rate / Hr (₹)
                            </label>
                            <input
                              type="number"
                              value={billDesign.defaultPenaltyPerHour || 250}
                              onChange={(e) => setBillDesign({ ...billDesign, defaultPenaltyPerHour: parseFloat(e.target.value) || 0 })}
                              className="form-input"
                              style={{ margin: 0, background: '#FFFFFF' }}
                            />
                          </div>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.74rem', color: '#14532D' }}>
                              Default Overdue Rate / Acre (₹)
                            </label>
                            <input
                              type="number"
                              value={billDesign.defaultPenaltyPerAcre || 500}
                              onChange={(e) => setBillDesign({ ...billDesign, defaultPenaltyPerAcre: parseFloat(e.target.value) || 0 })}
                              className="form-input"
                              style={{ margin: 0, background: '#FFFFFF' }}
                            />
                          </div>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.74rem', color: '#14532D' }}>
                              Default Grace Period
                            </label>
                            <input
                              type="text"
                              value={billDesign.defaultGracePeriod || '1 Hour'}
                              onChange={(e) => setBillDesign({ ...billDesign, defaultGracePeriod: e.target.value })}
                              className="form-input"
                              style={{ margin: 0, background: '#FFFFFF' }}
                              placeholder="e.g. 1 Hour"
                            />
                          </div>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.78rem', color: '#14532D' }}>
                            Machinery Rental Agreement Legal Terms & Damage Clauses
                          </label>
                          <textarea
                            rows={3}
                            value={billDesign.rentalTermsNotes || ''}
                            onChange={(e) => setBillDesign({ ...billDesign, rentalTermsNotes: e.target.value })}
                            className="form-textarea"
                            style={{ margin: 0, fontSize: '0.78rem', background: '#FFFFFF' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '20px', margin: '4px 0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={billDesign.showLogo}
                            onChange={(e) => setBillDesign({ ...billDesign, showLogo: e.target.checked })}
                          />
                          <span>Show SachiKheti Emblem</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={billDesign.showSignature}
                            onChange={(e) => setBillDesign({ ...billDesign, showSignature: e.target.checked })}
                          />
                          <span>Show Authorized Signatory Line</span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={savingBillDesign}
                        className="btn btn-primary"
                        style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        {savingBillDesign ? <RefreshCw size={16} className="spin" /> : <CheckCircle size={16} />}
                        <span>Save Customized Bill Design</span>
                      </button>
                    </form>
                  </div>

                  {/* Right: Real-time Live Bill Preview */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      border: `2px solid ${billDesign.accentColor}`,
                      padding: '20px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: billDesign.accentColor, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
                      Real-time Invoice Slip Preview
                    </div>

                    <div style={{ borderBottom: `2px solid ${billDesign.accentColor}`, paddingBottom: '12px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {billDesign.showLogo && (
                          <img
                            src="/assets/brand/sachi-kheti-emblem.jpg"
                            alt="Emblem"
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        )}
                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: 900, color: billDesign.accentColor }}>
                            {billDesign.companyName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#4B5563', lineHeight: 1.2 }}>
                            {billDesign.tagline}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#6B7280', marginTop: '6px' }}>
                        📍 {billDesign.address} • 📞 {billDesign.phone}
                      </div>
                      {billDesign.gstin && (
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#374151', marginTop: '2px' }}>
                          {billDesign.gstin}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 800, color: '#1F2937' }}>{billDesign.billTitle}</span>
                      <span style={{ fontWeight: 700, color: billDesign.accentColor }}>#SK-BILL-2026-PREVIEW</span>
                    </div>

                    <div style={{ background: '#F9FAFB', padding: '8px 10px', borderRadius: '8px', fontSize: '0.74rem', marginBottom: '12px' }}>
                      <div><strong>Farmer / Customer:</strong> Gurpreet Singh</div>
                      <div><strong>Payment:</strong> CASH IN HAND (PAID)</div>
                    </div>

                    {/* Sample Items Table */}
                    <table style={{ width: '100%', fontSize: '0.74rem', borderCollapse: 'collapse', marginBottom: '12px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#6B7280', textAlign: 'left' }}>
                          <th style={{ padding: '4px 0' }}>Item</th>
                          <th style={{ padding: '4px 0', textAlign: 'center' }}>Qty</th>
                          <th style={{ padding: '4px 0', textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '4px 0', fontWeight: 600 }}>Pure Desi Ghee (500 ml)</td>
                          <td style={{ padding: '4px 0', textAlign: 'center' }}>2</td>
                          <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 700, color: billDesign.accentColor }}>₹1,200</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '4px 0', fontWeight: 600 }}>Laser Land Leveler (1 Hour)</td>
                          <td style={{ padding: '4px 0', textAlign: 'center' }}>1</td>
                          <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 700, color: billDesign.accentColor }}>₹900</td>
                        </tr>
                      </tbody>
                    </table>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.94rem', fontWeight: 900, color: billDesign.accentColor, borderTop: `1px solid ${billDesign.accentColor}`, paddingTop: '8px' }}>
                      <span>Grand Total:</span>
                      <span>₹2,100</span>
                    </div>

                    <div style={{ fontSize: '0.66rem', color: '#6B7280', marginTop: '14px', whiteSpace: 'pre-line' }}>
                      {billDesign.termsNotes}
                    </div>

                    {billDesign.showSignature && (
                      <div style={{ textAlign: 'right', marginTop: '16px', fontSize: '0.7rem' }}>
                        <div style={{ borderTop: '1px solid #9CA3AF', display: 'inline-block', paddingTop: '3px', fontWeight: 700, color: '#374151' }}>
                          {billDesign.authorizedSignatoryTitle}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: RAZORPAY PAYMENT GATEWAY SETTINGS */}
              {settingsSubTab === 'payments' && (
                <div style={{ maxWidth: '840px' }}>
                  {/* Master Status & Admin Mood Control Card */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E5E7EB',
                      padding: '24px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: razorpaySettings.razorpayEnabled ? '#E8F5E9' : '#F3F4F6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: razorpaySettings.razorpayEnabled ? '#15733E' : '#6B7280',
                            }}
                          >
                            <CreditCard size={22} />
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1B2E23' }}>
                              Online Payment Gateway (Razorpay)
                            </h3>
                            <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '2px' }}>
                              Collect prepaid UPI (Google Pay, PhonePe, Paytm), Debit Cards, and Netbanking.
                            </div>
                          </div>
                        </div>

                        <p style={{ fontSize: '0.84rem', color: '#4B5563', lineHeight: 1.5, margin: '12px 0 0' }}>
                          {razorpaySettings.razorpayEnabled
                            ? 'Online Payments are currently ENABLED. Customers will see Razorpay at checkout and orders will only finalize after 100% verified payment.'
                            : 'Online Payments are currently DISABLED. The Razorpay card is completely HIDDEN from customer checkout. Orders are strictly Cash on Delivery or WhatsApp.'}
                        </p>
                      </div>

                      {/* Master Checkbox Switch (Default OFF) */}
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: 'pointer',
                          padding: '12px 18px',
                          borderRadius: '12px',
                          background: razorpaySettings.razorpayEnabled ? '#F0FDF4' : '#F9FAFB',
                          border: razorpaySettings.razorpayEnabled ? '2px solid #16A34A' : '2px solid #E5E7EB',
                          userSelect: 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(razorpaySettings.razorpayEnabled)}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            setRazorpaySettings({ ...razorpaySettings, razorpayEnabled: enabled });
                          }}
                          style={{
                            width: '22px',
                            height: '22px',
                            accentColor: '#15733E',
                            cursor: 'pointer',
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: razorpaySettings.razorpayEnabled ? '#15733E' : '#374151' }}>
                            {razorpaySettings.razorpayEnabled ? 'Gateway Is ACTIVE' : 'Enable Online Payments'}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#6B7280' }}>
                            {razorpaySettings.razorpayEnabled ? 'Click to disable' : 'Initially unchecked (OFF)'}
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Dynamic Real-time Storefront Status Banner */}
                    <div
                      style={{
                        marginTop: '18px',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        background: razorpaySettings.razorpayEnabled ? '#ECFDF5' : '#F9FAFB',
                        border: razorpaySettings.razorpayEnabled ? '1px solid #A7F3D0' : '1px solid #E5E7EB',
                        color: razorpaySettings.razorpayEnabled ? '#065F46' : '#6B7280',
                      }}
                    >
                      {razorpaySettings.razorpayEnabled ? (
                        <>
                          <CheckCircle size={18} color="#16A34A" style={{ flexShrink: 0 }} />
                          <span>Storefront Status: Online checkout active. Orders confirm after 100% cryptographic signature check.</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={18} color="#9CA3AF" style={{ flexShrink: 0 }} />
                          <span>Storefront Status: All online payment buttons are hidden from customers. Cash on Delivery is active.</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Credentials & Configuration Form (Visible when admin toggles gateway ON) */}
                  {razorpaySettings.razorpayEnabled && (
                    <div
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '16px',
                        border: '1px solid #E5E7EB',
                        padding: '24px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        marginBottom: '20px',
                      }}
                    >
                      <h4 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 800, color: '#1B2E23', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Key size={18} color="#15733E" />
                        <span>Razorpay API Credentials</span>
                      </h4>

                      <form onSubmit={handleSavePaymentGateway}>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                            Razorpay Key ID *
                          </label>
                          <input
                            type="text"
                            required
                            value={razorpaySettings.razorpayKeyId || ''}
                            onChange={(e) => setRazorpaySettings({ ...razorpaySettings, razorpayKeyId: e.target.value.trim() })}
                            className="form-input"
                            placeholder="e.g. rzp_live_xxxxxxxxxxxxxx or rzp_test_xxxxxxxxxxxxxx"
                            style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                          />
                          <div style={{ fontSize: '0.74rem', color: '#6B7280', marginTop: '4px' }}>
                            Found under Razorpay Dashboard → Settings → API Keys → Key ID.
                          </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.86rem' }}>
                              Razorpay Key Secret *
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowRazorpaySecret(!showRazorpaySecret)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#15733E',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              {showRazorpaySecret ? <EyeOff size={13} /> : <Eye size={13} />}
                              <span>{showRazorpaySecret ? 'Hide Secret' : 'Show Secret'}</span>
                            </button>
                          </div>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showRazorpaySecret ? 'text' : 'password'}
                              required
                              value={razorpaySettings.razorpayKeySecret || ''}
                              onChange={(e) => setRazorpaySettings({ ...razorpaySettings, razorpayKeySecret: e.target.value.trim() })}
                              className="form-input"
                              placeholder="Razorpay Key Secret from dashboard"
                              style={{ fontFamily: 'monospace', fontSize: '0.9rem', paddingRight: '40px' }}
                            />
                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}>
                              <Lock size={16} />
                            </div>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#6B7280', marginTop: '4px' }}>
                            Used for backend HMAC-SHA256 signature verification. Kept encrypted on your server.
                          </div>
                        </div>

                        <div className="checkout-grid-2col" style={{ marginBottom: '16px' }}>
                          <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                              Merchant Display Name
                            </label>
                            <input
                              type="text"
                              value={razorpaySettings.merchantName || 'ਸੱਚੀ ਖੇਤੀ | SachiKheti'}
                              onChange={(e) => setRazorpaySettings({ ...razorpaySettings, merchantName: e.target.value })}
                              className="form-input"
                              placeholder="e.g. SachiKheti LFPC Ltd."
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                              Store Currency
                            </label>
                            <input
                              type="text"
                              disabled
                              value={razorpaySettings.currency || 'INR'}
                              className="form-input"
                              style={{ background: '#F3F4F6', color: '#6B7280' }}
                            />
                          </div>
                        </div>

                        {/* Security Notice Card */}
                        <div
                          style={{
                            background: '#F0FDF4',
                            border: '1px solid #BBF7D0',
                            borderRadius: '10px',
                            padding: '14px 16px',
                            marginBottom: '20px',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start',
                          }}
                        >
                          <ShieldCheck size={22} color="#15733E" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div style={{ fontSize: '0.8rem', color: '#166534', lineHeight: 1.5 }}>
                            <strong>100% Secure Payment Architecture:</strong>
                            <div style={{ marginTop: '2px' }}>
                              Online orders are placed only after the Razorpay checkout completes and the server independently validates the cryptographic HMAC-SHA256 signature against your Key Secret. No fraudulent or unpaid orders can ever be confirmed.
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                          <button
                            type="submit"
                            disabled={savingGateway}
                            className="btn btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px' }}
                          >
                            {savingGateway ? <RefreshCw size={16} className="spin" /> : <CheckCircle size={16} />}
                            <span>Save & Activate Razorpay Gateway</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Quick Action when Disabled to Save the OFF state */}
                  {!razorpaySettings.razorpayEnabled && (
                    <div style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={handleSavePaymentGateway}
                        disabled={savingGateway}
                        className="btn btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        {savingGateway ? <RefreshCw size={14} className="spin" /> : <Check size={14} />}
                        <span>Confirm Online Payments Disabled</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ==================================================== */}
      {/* ADD / EDIT PRODUCT MODAL                             */}
      {/* ==================================================== */}
      {showProductModal && (
        <div className="modal-overlay" style={{ zIndex: 600 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '700px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              borderRadius: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 24px 14px',
                borderBottom: '1px solid #E5E7EB',
                background: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#1B2E23' }}>
                  {editingProduct ? 'Edit Agricultural Product' : 'Add New Agricultural Product'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#7A8B80', margin: '4px 0 0 0' }}>
                  Configure farm produce, dairy, groceries, or agricultural machinery for direct sale or rental.
                </p>
              </div>
              <button onClick={() => setShowProductModal(false)} className="modal-close-btn" type="button">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSaveProduct}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                overflow: 'hidden',
                margin: 0,
              }}
            >
              <div
                style={{
                  padding: '20px 24px',
                  overflowY: 'auto',
                  flex: 1,
                }}
              >
                {/* Product Type Quick Switcher */}
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '18px',
                    background: '#F1F5F2',
                    padding: '4px',
                    borderRadius: '10px',
                  }}
                >
              <button
                type="button"
                onClick={() => {
                  setProductForm((prev) => ({
                    ...prev,
                    productType: 'produce',
                    isForSale: true,
                    isForRent: false,
                    unit: prev.unit.includes('Acre') || prev.unit.includes('Hour') ? '1 kg' : prev.unit,
                    stockCount: prev.stockCount === 1 ? 50 : prev.stockCount,
                  }));
                }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  background: productForm.productType === 'produce' ? '#15733E' : 'transparent',
                  color: productForm.productType === 'produce' ? '#fff' : '#4B6354',
                  boxShadow: productForm.productType === 'produce' ? '0 2px 6px rgba(21,115,62,0.25)' : 'none',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>🌾 Farm Produce & Dairy (Ghee, Sweets, Pulses, Spices, Honey)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setProductForm((prev) => ({
                    ...prev,
                    productType: 'machinery',
                    isForRent: true,
                    unit: prev.unit === '1 kg' || prev.unit === '500 ml' ? '1 Acre' : prev.unit,
                    stockCount: prev.stockCount === 50 ? 1 : prev.stockCount,
                    workingCapacity: prev.workingCapacity || '1 Acre',
                  }));
                }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  background: productForm.productType === 'machinery' ? '#15733E' : 'transparent',
                  color: productForm.productType === 'machinery' ? '#fff' : '#4B6354',
                  boxShadow: productForm.productType === 'machinery' ? '0 2px 6px rgba(21,115,62,0.25)' : 'none',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>🚜 Agricultural Machinery & Equipment (Rent / Sale)</span>
              </button>
            </div>

              {/* Product Titles: English & Punjabi */}
              <div className="checkout-grid-2col">
                <div className="form-group">
                  <label className="form-label">Product / Equipment Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={productForm.title}
                    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                    className="form-input"
                    placeholder={
                      productForm.productType === 'machinery'
                        ? 'e.g. Basant Potato Digger or Rice Seeder'
                        : 'e.g. Desi Ghee or Khoya Burfi'
                    }
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ margin: 0 }}>Product Name (Punjabi / ਪੰਜਾਬੀ)</label>
                    {productForm.title && !productForm.titlePunjabi && (
                      <button
                        type="button"
                        onClick={() => setProductForm({ ...productForm, titlePunjabi: productForm.title })}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#15733E',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Copy English
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={productForm.titlePunjabi}
                    onChange={(e) => setProductForm({ ...productForm, titlePunjabi: e.target.value })}
                    className="form-input font-gurmukhi"
                    placeholder="e.g. ਦੇਸੀ ਘਿਓ / ਬਸੰਤ ਪੋਟੈਟੋ ਡਿੱਗਰ"
                  />
                </div>
              </div>

              {/* Category & Listing Options */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ margin: 0 }}>Catalog Category *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryModal(true);
                      setEditingCategory(null);
                      setCategoryForm({
                        name: '',
                        namePunjabi: '',
                        slug: '',
                        description: '',
                        icon: 'package',
                        imageUrl: '',
                      });
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#15733E',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Plus size={13} />
                    <span>+ New Category</span>
                  </button>
                </div>
                <select
                  required
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="form-select"
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.namePunjabi ? `(${c.namePunjabi})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Listing Availability & Nature Checkboxes (As required by owner: Rent, Sale, In-Stock, Featured) */}
              <div
                style={{
                  background: '#FAF9F3',
                  border: '1px solid rgba(21, 115, 62, 0.2)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1B2E23', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Availability & Operational Status
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={productForm.isForSale}
                      onChange={(e) => setProductForm({ ...productForm, isForSale: e.target.checked })}
                      style={{ width: '17px', height: '17px', accentColor: '#15733E' }}
                    />
                    <span>Available for Direct Sale</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#15733E' }}>
                    <input
                      type="checkbox"
                      checked={productForm.isForRent}
                      onChange={(e) => setProductForm({ ...productForm, isForRent: e.target.checked })}
                      style={{ width: '17px', height: '17px', accentColor: '#15733E' }}
                    />
                    <span>Available for Rent / Custom Hiring</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={productForm.inStock}
                      onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                      style={{ width: '17px', height: '17px', accentColor: '#15733E' }}
                    />
                    <span>Mark as In-Stock / Available</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#B46F00' }}>
                    <input
                      type="checkbox"
                      checked={productForm.featured}
                      onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                      style={{ width: '17px', height: '17px', accentColor: '#B46F00' }}
                    />
                    <span>Mark as Featured Product</span>
                  </label>
                </div>
              </div>

              {/* Pack Size / Working Capacity / Unit Specification */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Pack Size / Working Capacity / Unit *
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#7A8B80' }}>
                    Pick from dropdown, click a chip, or type custom
                  </span>
                </div>

                {/* Dropdown with all owner options */}
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      setProductForm({ ...productForm, unit: e.target.value });
                    }
                  }}
                  className="form-select"
                  style={{ marginBottom: '8px', fontSize: '0.85rem' }}
                >
                  <option value="">-- Quick Select Pack Size or Working Capacity --</option>
                  <optgroup label="Farm Produce & Dairy Pack Sizes">
                    <option value="500 ml">500 ml (Desi Ghee, Natural Honey)</option>
                    <option value="1 kg">1 kg (Khoya Burfi, Paneer, Khoya, Milkcake, Green Moong)</option>
                    <option value="500 g">500 g (Natural Honey, Dal, etc.)</option>
                    <option value="200 g">200 g (Haldi / Turmeric, Red Chilli Powder)</option>
                    <option value="250 g">250 g</option>
                    <option value="100 g">100 g</option>
                    <option value="2 kg">2 kg</option>
                    <option value="5 kg">5 kg</option>
                    <option value="10 kg">10 kg</option>
                    <option value="1 Litre">1 Litre</option>
                  </optgroup>
                  <optgroup label="Agricultural Machinery & Rental Capacities">
                    <option value="1 Acre">1 Acre (Potato Digger, Rice Seeder, Potato Planter, Spray Boom, Rice Planter)</option>
                    <option value="1 Hour">1 Hour (Laser Land Leveler, Harrow)</option>
                    <option value="24 Hours">24 Hours (Massey Ferguson 9500 Tractor Hire)</option>
                    <option value="Per Acre">Per Acre</option>
                    <option value="Per Hour">Per Hour</option>
                    <option value="Per Day">Per Day</option>
                    <option value="Per Trip">Per Trip</option>
                    <option value="1 Machine">1 Machine (Direct Sale)</option>
                  </optgroup>
                </select>

                {/* Fast Clickable Chips */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {['500 ml', '1 kg', '500 g', '200 g', '1 Acre', '1 Hour', '24 Hours', 'Per Day'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setProductForm({ ...productForm, unit: chip })}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: productForm.unit === chip ? '1px solid #15733E' : '1px solid #D1D5DB',
                        background: productForm.unit === chip ? '#E8F5E9' : '#fff',
                        color: productForm.unit === chip ? '#15733E' : '#374151',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Editable Input Field */}
                <input
                  type="text"
                  required
                  value={productForm.unit}
                  onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 500 ml, 1 kg, 1 Acre, 1 Hour, 24 Hours, Per Day"
                />
              </div>

              {/* Price & Stock Quantity */}
              <div className="checkout-grid-2col">
                <div className="form-group">
                  <label className="form-label">Price in ₹ (INR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="form-input"
                    placeholder="e.g. 600, 451, 2500, 900"
                  />
                  {productForm.price && (
                    <div style={{ fontSize: '0.76rem', color: '#15733E', marginTop: '4px', fontWeight: 600 }}>
                      Rate: ₹{parseFloat(productForm.price).toLocaleString('en-IN')} / {productForm.unit || 'unit'}
                      {productForm.isForRent && !productForm.isForSale && ' (Rental)'}
                      {productForm.isForRent && productForm.isForSale && ' (Rent or Sale)'}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Available Stock / Units</label>
                  <input
                    type="number"
                    value={productForm.stockCount}
                    onChange={(e) => setProductForm({ ...productForm, stockCount: e.target.value })}
                    className="form-input"
                    placeholder="e.g. 50 (Produce) or 1 (Machinery)"
                  />
                </div>
              </div>

              {/* Machinery Specifications (Shown when Machinery is selected or item is For Rent) */}
              {(productForm.productType === 'machinery' || productForm.isForRent) && (
                <div
                  style={{
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#0369A1', marginBottom: '10px' }}>
                    <span>🚜 Machinery Specifications & Rental Terms</span>
                  </div>

                  <div className="checkout-grid-2col" style={{ marginBottom: '10px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Working Capacity</label>
                      <input
                        type="text"
                        value={productForm.workingCapacity}
                        onChange={(e) => setProductForm({ ...productForm, workingCapacity: e.target.value })}
                        className="form-input"
                        placeholder="e.g. 1 Acre, 2 Acres, Per Acre"
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Working Duration / Availability</label>
                      <input
                        type="text"
                        value={productForm.workingDuration}
                        onChange={(e) => setProductForm({ ...productForm, workingDuration: e.target.value })}
                        className="form-input"
                        placeholder="e.g. 1 Hour, 24 Hours, Full Day"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Machine Type / Tractor Compatibility</label>
                    <input
                      type="text"
                      value={productForm.machineType}
                      onChange={(e) => setProductForm({ ...productForm, machineType: e.target.value })}
                      className="form-input"
                      placeholder="e.g. Tractor-Operated, Laser-Guided, Tractor-Mounted, 50+ HP Tractor"
                    />
                  </div>
                </div>
              )}

              {/* Product Image & Supabase Storage */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Product Image *</span>
                  <button
                    type="button"
                    onClick={() => setShowSupabaseModal(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: supabaseConfig.isConfigured ? '#15733E' : '#B46F00',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Database size={12} />
                    {supabaseConfig.isConfigured ? 'Supabase CDN Active' : '⚡ Connect Supabase'}
                  </button>
                </label>

                {/* Supabase Upload Zone */}
                <div
                  style={{
                    border: '2px dashed rgba(21, 115, 62, 0.25)',
                    borderRadius: '12px',
                    padding: '14px',
                    background: '#FAF9F3',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {productForm.imageUrl && (
                      <img
                        src={productForm.imageUrl}
                        alt="Preview"
                        style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #15733E', flexShrink: 0 }}
                      />
                    )}
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <label
                          className="btn btn-secondary btn-sm"
                          style={{
                            cursor: uploadingProductImg ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            opacity: uploadingProductImg ? 0.6 : 1,
                          }}
                        >
                          <UploadCloud size={16} color="#15733E" />
                          <span>{uploadingProductImg ? 'Uploading...' : 'Upload Image to Supabase'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadProductImg}
                            disabled={uploadingProductImg}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>

                      {productUploadStatus && (
                        <div
                          style={{
                            fontSize: '0.78rem',
                            marginTop: '6px',
                            fontWeight: 600,
                            color: productUploadStatus.includes('Error') || productUploadStatus.includes('failed') ? '#DC2626' : '#15733E',
                          }}
                        >
                          {productUploadStatus}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <input
                  type="text"
                  required
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  className="form-input"
                  placeholder="Image URL (auto-filled on upload above)"
                />
              </div>

              {/* Product Description */}
              <div className="form-group">
                <label className="form-label">Product Description</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="form-textarea"
                  placeholder={
                    productForm.productType === 'machinery'
                      ? 'e.g. Tractor-operated potato digging and harvesting machine with high efficiency and uniform field operations.'
                      : 'e.g. Pure, rich and aromatic desi ghee with a natural golden colour. Perfect for traditional cooking...'
                  }
                />
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #E5E7EB',
                background: '#F9FAFB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#7A8B80' }}>
                {editingProduct ? '⚡ Real-time socket sync active' : '🌾 Instant storefront visibility'}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="btn btn-primary"
                >
                  {savingProduct ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    )}

      {/* ==================================================== */}
      {/* ADD / EDIT CATEGORY MODAL                            */}
      {/* ==================================================== */}
      {showCategoryModal && (
        <div className="modal-overlay" style={{ zIndex: 600 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '560px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              borderRadius: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 24px 14px',
                borderBottom: '1px solid #E5E7EB',
                background: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#1B2E23' }}>
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#7A8B80', margin: '4px 0 0 0' }}>
                  Categories automatically appear in the storefront navbar and product filters.
                </p>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="modal-close-btn" type="button">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSaveCategory}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                overflow: 'hidden',
                margin: 0,
              }}
            >
              <div
                style={{
                  padding: '20px 24px',
                  overflowY: 'auto',
                  flex: 1,
                }}
              >
                <div className="form-group">
                  <label className="form-label">Category Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={handleCategoryNameChange}
                    className="form-input"
                    placeholder="e.g. Cold Pressed Oils, Organic Pulses"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category Name (Punjabi / Gurmukhi)</label>
                  <input
                    type="text"
                    value={categoryForm.namePunjabi}
                    onChange={(e) => setCategoryForm({ ...categoryForm, namePunjabi: e.target.value })}
                    className="form-input font-gurmukhi"
                    placeholder="e.g. ਸ਼ੁੱਧ ਡੇਅਰੀ, ਸਰ੍ਹੋਂ ਦਾ ਤੇਲ"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Catalog Image (Supabase CDN)</span>
                    <button
                      type="button"
                      onClick={() => setShowSupabaseModal(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: supabaseConfig.isConfigured ? '#15733E' : '#B46F00',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Database size={12} />
                      {supabaseConfig.isConfigured ? 'Supabase CDN Active' : '⚡ Connect Supabase'}
                    </button>
                  </label>

                  {/* Supabase Upload Zone */}
                  <div
                    style={{
                      border: '2px dashed rgba(21, 115, 62, 0.25)',
                      borderRadius: '12px',
                      padding: '14px',
                      background: '#FAF9F3',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {categoryForm.imageUrl && (
                        <img
                          src={categoryForm.imageUrl}
                          alt="Catalog preview"
                          style={{
                            width: '56px',
                            height: '56px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '2px solid #15733E',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div style={{ textAlign: 'left', flex: 1 }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <label
                            className="btn btn-secondary btn-sm"
                            style={{
                              cursor: uploadingCategoryImg ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              opacity: uploadingCategoryImg ? 0.6 : 1,
                            }}
                          >
                            <UploadCloud size={16} color="#15733E" />
                            <span>{uploadingCategoryImg ? 'Uploading...' : 'Upload Image to Supabase'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleUploadCategoryImg}
                              disabled={uploadingCategoryImg}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>

                        {categoryUploadStatus && (
                          <div
                            style={{
                              fontSize: '0.78rem',
                              marginTop: '6px',
                              fontWeight: 600,
                              color: categoryUploadStatus.includes('Error') || categoryUploadStatus.includes('failed') ? '#DC2626' : '#15733E',
                            }}
                          >
                            {categoryUploadStatus}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Image URL (auto-filled on upload above)"
                    value={categoryForm.imageUrl}
                    onChange={(e) => setCategoryForm({ ...categoryForm, imageUrl: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: slugify(e.target.value) })}
                    className="form-input"
                    placeholder="e.g. cold-pressed-oils"
                  />
                  <span style={{ fontSize: '0.78rem', color: '#7A8B80', display: 'block', marginTop: '4px' }}>
                    Used in URL navigation, e.g. /#catalog?category={categoryForm.slug || 'category-name'}
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="form-textarea"
                    placeholder="Short description of this product grouping..."
                  />
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div
                style={{
                  padding: '14px 24px',
                  borderTop: '1px solid #E5E7EB',
                  background: '#F9FAFB',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: '0.8rem', color: '#7A8B80' }}>
                  {editingCategory ? 'Category updates sync in real time' : 'New category available immediately'}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingCategory}
                    className="btn btn-primary"
                  >
                    {savingCategory ? (
                      <>
                        <RefreshCw size={16} className="spin" />
                        <span>Saving Category...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        <span>{editingCategory ? 'Update Category' : 'Save Category'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* ADD / EDIT ORDER MODAL (FULL DATABASE CRUD)          */}
      {/* ==================================================== */}
      {showOrderModal && (
        <div className="modal-overlay" style={{ zIndex: 600 }}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                  {editingOrder ? `Edit Order #${editingOrder.orderNumber}` : 'Create Manual Customer Order'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#7A8B80' }}>
                  Directly creates and modifies order records in the live PostgreSQL database.
                </p>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveOrder}>
              <div className="checkout-grid-2col">
                <div className="form-group">
                  <label className="form-label">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={orderForm.customerName}
                    onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                    className="form-input"
                    placeholder="e.g. Gurpreet Singh"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Phone *</label>
                  <input
                    type="text"
                    required
                    value={orderForm.customerPhone}
                    onChange={(e) => setOrderForm({ ...orderForm, customerPhone: e.target.value })}
                    className="form-input"
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Address *</label>
                <input
                  type="text"
                  required
                  value={orderForm.address}
                  onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                  className="form-input"
                  placeholder="Street / House address"
                />
              </div>

              <div className="checkout-grid-2col">
                <div className="form-group">
                  <label className="form-label">City / District</label>
                  <input
                    type="text"
                    value={orderForm.city}
                    onChange={(e) => setOrderForm({ ...orderForm, city: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input
                    type="text"
                    value={orderForm.pincode}
                    onChange={(e) => setOrderForm({ ...orderForm, pincode: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="checkout-grid-2col">
                <div className="form-group">
                  <label className="form-label">Total Amount in ₹ *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={orderForm.totalAmount}
                    onChange={(e) => setOrderForm({ ...orderForm, totalAmount: e.target.value })}
                    className="form-input"
                    placeholder="e.g. 1450"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    value={orderForm.paymentMethod}
                    onChange={(e) => setOrderForm({ ...orderForm, paymentMethod: e.target.value })}
                    className="form-select"
                  >
                    <option value="WHATSAPP">WhatsApp Direct Order</option>
                    <option value="RAZORPAY">Razorpay / UPI</option>
                    <option value="CASH">Cash on Delivery</option>
                    <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="checkout-grid-2col">
                <div className="form-group">
                  <label className="form-label">Fulfillment Status</label>
                  <select
                    value={orderForm.orderStatus}
                    onChange={(e) => setOrderForm({ ...orderForm, orderStatus: e.target.value })}
                    className="form-select"
                  >
                    <option value="PENDING">Pending Confirmation</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PROCESSING">Processing & Packing</option>
                    <option value="SHIPPED">Shipped / In Transit</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Status</label>
                  <select
                    value={orderForm.paymentStatus}
                    onChange={(e) => setOrderForm({ ...orderForm, paymentStatus: e.target.value })}
                    className="form-select"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed / Paid</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ordered Items Summary</label>
                <input
                  type="text"
                  value={orderForm.itemsText}
                  onChange={(e) => setOrderForm({ ...orderForm, itemsText: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 2x Pure Vedic Bilona Ghee (1 Litre)"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  className="form-textarea"
                  placeholder="Special instructions or delivery notes..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOrder}
                  className="btn btn-primary"
                >
                  {savingOrder ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      <span>Saving Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>{editingOrder ? 'Update Order' : 'Create Order'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ==================================================== */}
      {/* SUPABASE CLOUD STORAGE SETTINGS MODAL               */}
      {/* ==================================================== */}
      {showSupabaseModal && (
        <div className="modal-overlay" style={{ zIndex: 650 }}>
          <div className="modal-content" style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={22} color="#15733E" />
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#0A3E22' }}>
                  Connect Supabase Cloud Storage
                </h3>
              </div>
              <button
                onClick={() => setShowSupabaseModal(false)}
                className="modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            {/* Status banner */}
            <div
              style={{
                background: supabaseConfig.isConfigured ? '#EBF7EE' : '#FFFBEB',
                border: `1px solid ${supabaseConfig.isConfigured ? '#86EFAC' : '#FDE68A'}`,
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div style={{ marginTop: '2px' }}>
                {supabaseConfig.isConfigured ? (
                  <CheckCircle size={20} color="#15733E" />
                ) : (
                  <AlertCircle size={20} color="#B46F00" />
                )}
              </div>
              <div style={{ flex: 1, fontSize: '0.86rem' }}>
                <strong style={{ color: supabaseConfig.isConfigured ? '#15733E' : '#B46F00' }}>
                  {supabaseConfig.isConfigured
                    ? 'Supabase Credentials Configured'
                    : 'Supabase Key Required'}
                </strong>
                <p style={{ margin: '4px 0 0', color: '#4A5D50', lineHeight: 1.45 }}>
                  {supabaseConfig.isConfigured
                    ? `Connected to project sachikheti (${supabaseForm.bucket}). Direct image uploads for catalogs & products are active.`
                    : 'Paste your Supabase publishable key below to enable direct image CDN uploads.'}
                </p>
              </div>
            </div>

            {/* Config Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem' }}>
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={supabaseForm.url}
                  onChange={(e) => setSupabaseForm({ ...supabaseForm, url: e.target.value })}
                  className="form-input"
                  placeholder="https://uuklvqlwrxvnacbnsyve.supabase.co"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem' }}>
                  Supabase Publishable / "anon" API Key *
                </label>
                <input
                  type="password"
                  value={supabaseForm.anonKey}
                  onChange={(e) => setSupabaseForm({ ...supabaseForm, anonKey: e.target.value })}
                  className="form-input"
                  placeholder="sb_publishable_... or eyJhbGciOi..."
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem' }}>
                  Storage Bucket Name
                </label>
                <input
                  type="text"
                  value={supabaseForm.bucket}
                  onChange={(e) => setSupabaseForm({ ...supabaseForm, bucket: e.target.value })}
                  className="form-input"
                  placeholder="SachiKeti"
                />
              </div>

              {testResult && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    background: testResult.success ? '#EBF7EE' : '#FEE2E2',
                    border: `1px solid ${testResult.success ? '#86EFAC' : '#FCA5A5'}`,
                    color: testResult.success ? '#15733E' : '#B91C1C',
                  }}
                >
                  {testResult.success ? (
                    <div>
                      <strong>✓ Connection Successful!</strong>
                      <div style={{ marginTop: '4px' }}>{testResult.message}</div>
                    </div>
                  ) : (
                    <div>
                      <strong>Connection Failed:</strong> {testResult.error}
                      {testResult.hint && <div style={{ marginTop: '4px' }}>{testResult.hint}</div>}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleTestSupabase}
                  disabled={testingSupabase || !supabaseForm.anonKey}
                  className="btn btn-secondary"
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <RefreshCw size={15} className={testingSupabase ? 'spin' : ''} />
                  <span>{testingSupabase ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveSupabaseConfig}
                  className="btn btn-primary"
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Check size={16} />
                  <span>Save Configuration</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* OFFICIAL INVOICE RECEIPT MODAL (PRINT & WHATSAPP)   */}
      {/* ==================================================== */}
      {showInvoiceModal && generatedInvoice && (
        <div className="modal-overlay" style={{ zIndex: 650 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '680px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              borderRadius: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header (No print) */}
            <div
              className="no-print"
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#F9FAFB',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={20} color="#15733E" />
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1B2E23' }}>
                  Bill Generated: #{generatedInvoice.orderNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            {/* Printable Invoice Container */}
            <div
              id="printable-invoice-container"
              style={{
                padding: '28px 32px',
                overflowY: 'auto',
                flex: 1,
                background: '#FFFFFF',
              }}
            >
              {/* Company & Bill Lockup */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${billDesign.accentColor}`, paddingBottom: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {billDesign.showLogo && (
                    <img
                      src="/assets/brand/sachi-kheti-emblem.jpg"
                      alt="Emblem"
                      style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  )}
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: billDesign.accentColor, margin: 0 }}>
                      {billDesign.companyName}
                    </h2>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginTop: '2px' }}>
                      {billDesign.tagline}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#6B7280', marginTop: '2px' }}>
                      📍 {billDesign.address} • 📞 {billDesign.phone}
                    </div>
                    {billDesign.gstin && (
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#374151', marginTop: '2px' }}>
                        {billDesign.gstin}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#1F2937', letterSpacing: '0.5px' }}>
                    {generatedInvoice.billType === 'rental'
                      ? (billDesign.rentalBillTitle || 'AGRICULTURAL MACHINERY CUSTOM HIRING AGREEMENT')
                      : generatedInvoice.billType === 'combined'
                        ? 'FARM PRODUCE & MACHINERY COMBINED INVOICE'
                        : billDesign.billTitle}
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: billDesign.accentColor, marginTop: '2px' }}>
                    #{generatedInvoice.orderNumber}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#6B7280', marginTop: '2px' }}>
                    Date: {new Date(generatedInvoice.date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Billed To / Payment Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', padding: '14px', background: '#F9FAFB', borderRadius: '10px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>
                    BILLED TO:
                  </div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#1F2937', marginTop: '3px' }}>
                    {generatedInvoice.customerName}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#4B5563', marginTop: '2px' }}>
                    📞 {generatedInvoice.customerPhone}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '2px' }}>
                    📍 {generatedInvoice.address}, {generatedInvoice.city} {generatedInvoice.pincode}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>
                    PAYMENT & STATUS:
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1F2937', marginTop: '3px' }}>
                    Mode: {generatedInvoice.paymentMethod}
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        padding: '3px 9px',
                        borderRadius: '20px',
                        background: generatedInvoice.paymentStatus === 'PAID' ? '#EBF7EE' : '#FEF3C7',
                        color: generatedInvoice.paymentStatus === 'PAID' ? '#065F46' : '#92400E',
                        border: `1px solid ${generatedInvoice.paymentStatus === 'PAID' ? '#A7F3D0' : '#FDE68A'}`,
                      }}
                    >
                      {generatedInvoice.paymentStatus === 'PAID' ? 'PAID IN FULL' : 'PAYMENT DUE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB', background: '#F3F4F6' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '0.78rem', color: '#4B5563' }}>#</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '0.78rem', color: '#4B5563' }}>Item Description</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '0.78rem', color: '#4B5563' }}>Qty</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '0.78rem', color: '#4B5563' }}>Rate</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '0.78rem', color: '#4B5563' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(generatedInvoice.items || []).map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '9px 10px', fontSize: '0.82rem', color: '#6B7280' }}>{idx + 1}</td>
                      <td style={{ padding: '9px 10px', fontSize: '0.86rem', fontWeight: 700, color: '#1F2937' }}>
                        {it.title}
                        {it.unit && <span style={{ fontSize: '0.74rem', color: '#6B7280', fontWeight: 400, marginLeft: '4px' }}>({it.unit})</span>}
                      </td>
                      <td style={{ padding: '9px 10px', fontSize: '0.84rem', textAlign: 'center', color: '#374151' }}>{it.quantity}</td>
                      <td style={{ padding: '9px 10px', fontSize: '0.84rem', textAlign: 'right', color: '#374151' }}>₹{Number(it.price).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '9px 10px', fontSize: '0.86rem', fontWeight: 700, textAlign: 'right', color: '#15733E' }}>
                        ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Machinery Custom Hiring & Overdue Penalty Clause Box */}
              {generatedInvoice.rentalDetails && (
                <div style={{ margin: '14px 0', padding: '12px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 800, color: '#166534', marginBottom: '6px' }}>
                    <Tractor size={16} />
                    <span>Agricultural Machinery Custom Hiring & Overdue Penalty Terms:</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', color: '#14532D' }}>
                    <div><strong>Agreed Working Tenure:</strong> {generatedInvoice.rentalDetails.tenure}</div>
                    <div><strong>Overdue Penalty Rate:</strong> {generatedInvoice.rentalDetails.penaltyRate}</div>
                    <div><strong>Grace Period Permitted:</strong> {generatedInvoice.rentalDetails.gracePeriod}</div>
                    <div><strong>Operator / Driver:</strong> {generatedInvoice.rentalDetails.operatorIncluded ? 'Supplied with Machine' : 'Arranged by Hirer'}</div>
                  </div>
                </div>
              )}

              {/* Totals Summary */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#4B5563' }}>
                    <span>Subtotal:</span>
                    <span>₹{Number(generatedInvoice.subtotal || generatedInvoice.totalAmount).toLocaleString('en-IN')}</span>
                  </div>
                  {generatedInvoice.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#DC2626' }}>
                      <span>Discount / Concession:</span>
                      <span>-₹{Number(generatedInvoice.discount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {generatedInvoice.delivery > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#4B5563' }}>
                      <span>Delivery / Freight:</span>
                      <span>+₹{Number(generatedInvoice.delivery).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 900, color: billDesign.accentColor, borderTop: `2px solid ${billDesign.accentColor}`, paddingTop: '8px' }}>
                    <span>Total Amount:</span>
                    <span>₹{Number(generatedInvoice.totalAmount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Signatory & Terms */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #E5E7EB', paddingTop: '16px', fontSize: '0.74rem', color: '#6B7280' }}>
                <div style={{ maxWidth: '420px', whiteSpace: 'pre-line' }}>
                  {(generatedInvoice.billType === 'rental' || generatedInvoice.rentalDetails)
                    ? (billDesign.rentalTermsNotes || billDesign.termsNotes)
                    : billDesign.termsNotes}
                </div>
                {billDesign.showSignature && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ height: '32px' }}></div>
                    <div style={{ borderTop: '1px solid #9CA3AF', paddingTop: '4px', fontWeight: 700, color: '#374151', minWidth: '150px' }}>
                      {billDesign.authorizedSignatoryTitle}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Footer (No print) */}
            <div
              className="no-print"
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #E5E7EB',
                background: '#F9FAFB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <button
                type="button"
                onClick={() => handleWhatsAppInvoice(generatedInvoice)}
                disabled={sendingBillPdf}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#15803D', borderColor: '#BBF7D0', background: '#F0FDF4', fontWeight: 700 }}
              >
                {sendingBillPdf ? <RefreshCw size={15} className="spin" /> : <Send size={15} />}
                <span>
                  {sendingBillPdf
                    ? 'Generating & Sending PDF...'
                    : whatsappStatus?.status === 'CONNECTED'
                      ? 'Send Official PDF via WhatsApp'
                      : 'Send WhatsApp'}
                </span>
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleDownloadInvoicePDF(generatedInvoice)}
                  disabled={downloadingPdf}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {downloadingPdf ? <RefreshCw size={15} className="spin" /> : <Download size={15} />}
                  <span>{downloadingPdf ? 'Downloading PDF...' : 'Download PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer size={15} />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STOCK & QUANTITY ADJUSTMENT MODAL                    */}
      {/* ==================================================== */}
      {stockModalProduct && (
        <div className="modal-overlay" style={{ zIndex: 660 }} onClick={() => setStockModalProduct(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '440px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={20} color="#15733E" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#1B2E23' }}>
                  Adjust Stock & Quantity
                </h3>
              </div>
              <button
                onClick={() => setStockModalProduct(null)}
                className="modal-close-btn"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#F9FAFB', borderRadius: '10px', marginBottom: '18px' }}>
              <img
                src={stockModalProduct.imageUrl}
                alt={stockModalProduct.title}
                style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {stockModalProduct.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                  {stockModalProduct.category?.name || 'Produce'} • ₹{stockModalProduct.price} / {stockModalProduct.unit}
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveStockModal}>
              {/* In Stock / Out of Stock Fast Toggle */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '8px', display: 'block' }}>
                  Inventory Status
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setStockStatusToggle(true);
                      if (parseInt(stockQuantityInput, 10) <= 0) {
                        setStockQuantityInput(50);
                      }
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: stockStatusToggle ? '2px solid #16A34A' : '1px solid #D1D5DB',
                      background: stockStatusToggle ? '#DCFCE7' : '#FFFFFF',
                      color: stockStatusToggle ? '#15803D' : '#4B5563',
                      fontWeight: 800,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>✓ IN STOCK</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStockStatusToggle(false);
                      setStockQuantityInput(0);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: !stockStatusToggle ? '2px solid #DC2626' : '1px solid #D1D5DB',
                      background: !stockStatusToggle ? '#FEE2E2' : '#FFFFFF',
                      color: !stockStatusToggle ? '#DC2626' : '#4B5563',
                      fontWeight: 800,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>✕ OUT OF STOCK</span>
                  </button>
                </div>
              </div>

              {/* Exact Stock Quantity Input with Quick Increment Buttons */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Available Units / Quantity ({stockModalProduct.unit || 'units'}):</span>
                  <span style={{ color: stockQuantityInput > 0 ? '#15733E' : '#DC2626', fontWeight: 800 }}>
                    {stockQuantityInput > 0 ? `${stockQuantityInput} in stock` : 'Depleted (0)'}
                  </span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.max(0, (parseInt(stockQuantityInput, 10) || 0) - 10);
                      setStockQuantityInput(next);
                      setStockStatusToggle(next > 0);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', fontWeight: 700 }}
                    title="Decrease by 10"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.max(0, (parseInt(stockQuantityInput, 10) || 0) - 1);
                      setStockQuantityInput(next);
                      setStockStatusToggle(next > 0);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', fontWeight: 700 }}
                    title="Decrease by 1"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockQuantityInput}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      setStockQuantityInput(val);
                      setStockStatusToggle(val > 0);
                    }}
                    className="form-input"
                    style={{
                      textAlign: 'center',
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      margin: 0,
                      color: stockQuantityInput > 0 ? '#111827' : '#9CA3AF',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = (parseInt(stockQuantityInput, 10) || 0) + 1;
                      setStockQuantityInput(next);
                      setStockStatusToggle(true);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', fontWeight: 700 }}
                    title="Increase by 1"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = (parseInt(stockQuantityInput, 10) || 0) + 10;
                      setStockQuantityInput(next);
                      setStockStatusToggle(true);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', fontWeight: 700 }}
                    title="Increase by 10"
                  >
                    +10
                  </button>
                </div>

                {/* Quick preset buttons */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                  {[0, 10, 25, 50, 100, 250].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setStockQuantityInput(preset);
                        setStockStatusToggle(preset > 0);
                      }}
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        borderRadius: '6px',
                        border: stockQuantityInput === preset ? '1.5px solid #15733E' : '1px solid #E5E7EB',
                        background: stockQuantityInput === preset ? '#ECFDF5' : '#F9FAFB',
                        color: stockQuantityInput === preset ? '#15733E' : '#374151',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {preset === 0 ? '0 (Out)' : preset}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setStockModalProduct(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStockModal}
                  className="btn btn-primary"
                  style={{ minWidth: '130px' }}
                >
                  {savingStockModal ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Stock</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
