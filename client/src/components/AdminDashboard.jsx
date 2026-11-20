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
  UploadCloud,
  Database,
  ExternalLink,
  Check,
  Key,
  RefreshCw
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  uploadImageToSupabase,
  testSupabaseConnection,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_BUCKET
} from '../lib/supabase';
import { getSocket } from '../lib/socket';

export default function AdminDashboard({ onClose }) {
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
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // Catalog / Category management state
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState(null);
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [uploadingCatalogImg, setUploadingCatalogImg] = useState(false);
  const [catalogUploadStatus, setCatalogUploadStatus] = useState('');
  const [catalogForm, setCatalogForm] = useState({
    name: '',
    namePunjabi: '',
    slug: '',
    description: '',
    icon: 'package',
    imageUrl: '',
  });

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Dashboard tab state: 'orders' | 'products' | 'catalogs'
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Product modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    title: '',
    titlePunjabi: '',
    categoryId: '',
    price: '',
    unit: '1 Litre',
    imageUrl: 'https://images.unsplash.com/photo-1627483262268-9c2b5b2834b5?auto=format&fit=crop&w=800&q=80',
    description: '',
    inStock: true,
    stockCount: 50,
    featured: false,
  });

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
            loadDashboardData();
          } else {
            handleLogout();
          }
        })
        .catch(() => handleLogout());
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoggingIn(true);
      setLoginError('');
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
        loadDashboardData();
      } else {
        setLoginError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Server connection failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sachikheti_admin_token');
    setToken('');
    setAdminUser(null);
  };

  const loadDashboardData = async () => {
    setLoadingData(true);
    try {
      // 1. Fetch orders
      const ordersRes = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ordersData = await ordersRes.json();
      if (ordersData.success) setOrders(ordersData.data);

      // 2. Fetch products
      const prodRes = await fetch('/api/products');
      const prodData = await prodRes.json();
      if (prodData.success) setProducts(prodData.data);

      // 3. Fetch categories
      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      if (catData.success) {
        setCategories(catData.data);
        if (catData.data.length > 0 && !productForm.categoryId) {
          setProductForm(prev => ({ ...prev, categoryId: catData.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
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

    const handleRealtimeUpdate = () => {
      loadDashboardData();
    };

    socket.on('categories:updated', handleRealtimeUpdate);
    socket.on('catalogs:updated', handleRealtimeUpdate);
    socket.on('products:updated', handleRealtimeUpdate);
    socket.on('orders:updated', handleRealtimeUpdate);
    socket.on('metrics:updated', handleRealtimeUpdate);
    socket.on('banners:updated', handleRealtimeUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('categories:updated', handleRealtimeUpdate);
      socket.off('catalogs:updated', handleRealtimeUpdate);
      socket.off('products:updated', handleRealtimeUpdate);
      socket.off('orders:updated', handleRealtimeUpdate);
      socket.off('metrics:updated', handleRealtimeUpdate);
      socket.off('banners:updated', handleRealtimeUpdate);
    };
  }, [token]);

  // Catalog Handlers
  const openNewCatalogModal = () => {
    setEditingCatalog(null);
    setCatalogUploadStatus('');
    setCatalogForm({
      name: '',
      namePunjabi: '',
      slug: '',
      description: '',
      icon: 'package',
      imageUrl: '',
    });
    setShowCatalogModal(true);
  };

  const openEditCatalogModal = (cat) => {
    setEditingCatalog(cat);
    setCatalogUploadStatus('');
    setCatalogForm({
      name: cat.name,
      namePunjabi: cat.namePunjabi || cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon: cat.icon || 'package',
      imageUrl: cat.imageUrl || '',
    });
    setShowCatalogModal(true);
  };

  const handleUploadCatalogImg = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCatalogImg(true);
      setCatalogUploadStatus('Uploading image...');
      const res = await uploadImageToSupabase(file, 'catalogs');
      if (res.success) {
        setCatalogForm((prev) => ({ ...prev, imageUrl: res.url }));
        setCatalogUploadStatus(res.isLocalFallback ? '✓ Image saved to local server storage!' : '✓ Uploaded to Supabase CDN successfully!');
      } else {
        setCatalogUploadStatus(`Upload failed: ${res.error}`);
      }
    } catch (err) {
      setCatalogUploadStatus(`Error: ${err.message}`);
    } finally {
      setUploadingCatalogImg(false);
    }
  };

  const handleSaveCatalog = async (e) => {
    e.preventDefault();
    if (!catalogForm.name.trim()) {
      alert('Please enter a catalog name');
      return;
    }

    try {
      setSavingCatalog(true);
      const url = editingCatalog ? `/api/categories/${editingCatalog.id}` : '/api/categories';
      const method = editingCatalog ? 'PUT' : 'POST';

      const slug = catalogForm.slug.trim() || catalogForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const payload = {
        name: catalogForm.name.trim(),
        namePunjabi: catalogForm.namePunjabi?.trim() || catalogForm.name.trim(),
        slug,
        description: catalogForm.description?.trim() || '',
        icon: catalogForm.icon || 'package',
        imageUrl: catalogForm.imageUrl ? catalogForm.imageUrl.trim() : null,
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
        setShowCatalogModal(false);
        loadDashboardData();
      } else {
        alert(data.message || 'Failed to save catalog');
      }
    } catch (err) {
      alert('Error saving catalog');
    } finally {
      setSavingCatalog(false);
    }
  };

  const handleDeleteCatalog = async (id, name, productCount = 0) => {
    if (productCount > 0) {
      if (!window.confirm(`Warning: Catalog "${name}" has ${productCount} associated products. Deleting it may impact products. Proceed anyway?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to delete catalog "${name}"?`)) return;
    }

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        loadDashboardData();
      } else {
        alert(data.message || 'Failed to delete catalog');
      }
    } catch (err) {
      alert('Error deleting catalog');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev =>
          prev.map(ord => (ord.id === orderId ? { ...ord, orderStatus: newStatus } : ord))
        );
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const method = editingProduct ? 'PUT' : 'POST';
      const endpoint = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productForm),
      });
      const data = await res.json();

      if (data.success) {
        setShowProductModal(false);
        setEditingProduct(null);
        loadDashboardData();
      } else {
        alert(data.message || 'Failed to save product');
      }
    } catch (err) {
      alert('Server error saving product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.filter(p => p.id !== productId));
      }
    } catch (err) {
      alert('Error deleting product');
    }
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      titlePunjabi: '',
      categoryId: categories.length > 0 ? categories[0].id : '',
      price: '',
      unit: '1 Litre',
      imageUrl: 'https://images.unsplash.com/photo-1627483262268-9c2b5b2834b5?auto=format&fit=crop&w=800&q=80',
      description: '',
      inStock: true,
      stockCount: 50,
      featured: false,
    });
    setShowProductModal(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      titlePunjabi: product.titlePunjabi,
      categoryId: product.categoryId,
      price: product.price,
      unit: product.unit,
      imageUrl: product.imageUrl,
      description: product.description,
      inStock: product.inStock,
      stockCount: product.stockCount,
      featured: product.featured,
    });
    setShowProductModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImg(true);
      setUploadStatus('Uploading image...');
      const res = await uploadImageToSupabase(file, 'products');

      if (res.success) {
        setProductForm((prev) => ({ ...prev, imageUrl: res.url }));
        setUploadStatus(res.isLocalFallback ? '✓ Image saved to local server storage!' : '✓ Uploaded to Supabase CDN successfully!');
      } else {
        setUploadStatus(`Upload failed: ${res.error}`);
      }
    } catch (err) {
      setUploadStatus(`Upload error: ${err.message}`);
    } finally {
      setUploadingImg(false);
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
    alert('Supabase settings saved successfully!');
    setShowSupabaseModal(false);
  };

  // KPIs
  const totalRevenue = orders
    .filter(o => (o.orderStatus || o.status) !== 'CANCELLED')
    .reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(o => (o.orderStatus || o.status) === 'PENDING').length;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 400 }}>
      <div
        className="modal-content admin-dashboard-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="modal-close-btn"
          aria-label="Close Admin Modal"
        >
          <X size={22} />
        </button>

        {!token || !adminUser ? (
          /* Admin Login Screen */
          <div style={{ maxWidth: '420px', margin: '40px auto', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#F0FAF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <ShieldCheck size={36} color="#15733E" />
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0A3E22', marginBottom: '8px' }}>
              Superadmin Portal
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#7A8B80', marginBottom: '24px' }}>
              Secure administrative access for SachiKheti (LFPC)
            </p>

            {loginError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', color: '#B91C1C', padding: '10px', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '16px' }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                  autoComplete="username"
                  placeholder="Enter admin username"
                />
              </div>

              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  autoComplete="current-password"
                  placeholder="Enter admin password"
                />
              </div>

              <button type="submit" disabled={loggingIn} className="btn btn-gold" style={{ width: '100%', marginTop: '10px' }}>
                {loggingIn ? 'Authenticating...' : 'Log In to Superadmin'}
              </button>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSupabaseForm({
                      url: supabaseConfig.url,
                      anonKey: supabaseConfig.anonKey,
                      bucket: supabaseConfig.bucket,
                    });
                    setTestResult(null);
                    setShowSupabaseModal(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#15733E',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    textDecoration: 'underline',
                  }}
                >
                  <Database size={14} />
                  <span>{supabaseConfig.isConfigured ? 'Supabase Storage: Connected' : '⚡ Connect Supabase Cloud Storage'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #E7E3D4' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={22} color="#15733E" />
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0A3E22' }}>
                    SachiKheti Superadmin CMS
                  </h2>
                </div>
                <span style={{ fontSize: '0.82rem', color: '#7A8B80' }}>
                  Logged in as <strong>{adminUser.username}</strong> ({adminUser.role})
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {/* Real-time Socket Badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: socketConnected ? '#EBF7EE' : '#FEF3C7',
                    border: `1px solid ${socketConnected ? '#A7F3D0' : '#FDE68A'}`,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: socketConnected ? '#065F46' : '#92400E',
                  }}
                  title={socketConnected ? 'Real-time WebSocket Live & Synchronized' : 'Connecting to socket...'}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: socketConnected ? '#10B981' : '#F59E0B',
                      boxShadow: socketConnected ? '0 0 6px #10B981' : 'none',
                      display: 'inline-block'
                    }}
                  />
                  <span>{socketConnected ? 'Live Sockets Active' : 'Connecting...'}</span>
                </div>

                <button
                  onClick={() => {
                    setSupabaseForm({
                      url: supabaseConfig.url,
                      anonKey: supabaseConfig.anonKey,
                      bucket: supabaseConfig.bucket,
                    });
                    setTestResult(null);
                    setShowSupabaseModal(true);
                  }}
                  className={`btn ${supabaseConfig.isConfigured ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Database size={15} color={supabaseConfig.isConfigured ? '#15733E' : '#FFFFFF'} />
                  <span>{supabaseConfig.isConfigured ? 'Supabase: Connected' : '⚡ Connect Supabase'}</span>
                </button>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
              <div className="stat-card">
                <div className="stat-icon">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#7A8B80' }}>Total Orders</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#122117' }}>{totalOrdersCount}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon gold">
                  <Clock size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#7A8B80' }}>Pending Orders</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#B46F00' }}>{pendingOrdersCount}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Package size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#7A8B80' }}>Catalog Products</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#122117' }}>{products.length}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon gold">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#7A8B80' }}>Confirmed Revenue</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0A3E22' }}>
                    ₹ {totalRevenue.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Tab navigation */}
            <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #E7E3D4', marginBottom: '20px' }}>
              <button
                onClick={() => setActiveTab('orders')}
                className={`filter-chip ${activeTab === 'orders' ? 'active' : ''}`}
                style={{ borderRadius: '8px 8px 0 0' }}
              >
                Orders Fulfillment ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`filter-chip ${activeTab === 'products' ? 'active' : ''}`}
                style={{ borderRadius: '8px 8px 0 0' }}
              >
                Product Catalog ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('catalogs')}
                className={`filter-chip ${activeTab === 'catalogs' ? 'active' : ''}`}
                style={{ borderRadius: '8px 8px 0 0' }}
              >
                Catalogs / Categories ({categories.length})
              </button>
            </div>

            {/* Content Area */}
            <div style={{ flexGrow: 1, overflowY: 'auto' }}>
              {activeTab === 'orders' ? (
                /* Orders Table */
                orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#7A8B80' }}>No customer orders placed yet.</div>
                ) : (
                  <div className="admin-table-container">
                    <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Address</th>
                        <th>Items</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((ord) => (
                        <tr key={ord.id}>
                          <td><strong>{ord.orderNumber}</strong></td>
                          <td>
                            <div>{ord.customerName}</div>
                            <div style={{ fontSize: '0.78rem', color: '#7A8B80' }}>{ord.customerPhone}</div>
                          </td>
                          <td style={{ maxWidth: '180px', fontSize: '0.82rem' }}>
                            {ord.address}, {ord.city}
                          </td>
                          <td style={{ fontSize: '0.82rem' }}>
                            {Array.isArray(ord.items) && ord.items.map((it, idx) => (
                              <div key={idx}>{it.title} x {it.quantity}</div>
                            ))}
                          </td>
                          <td><strong>₹ {ord.totalAmount.toLocaleString('en-IN')}</strong></td>
                          <td>
                            <span className={`badge ${ord.paymentMethod === 'WHATSAPP' ? 'badge-green' : 'badge-gold'}`}>
                              {ord.paymentMethod}
                            </span>
                          </td>
                          <td>
                            <select
                              value={ord.orderStatus}
                              onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                              className="form-select"
                              style={{ padding: '6px 10px', fontSize: '0.82rem', fontWeight: 600 }}
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="CONFIRMED">CONFIRMED</option>
                              <option value="PROCESSING">PROCESSING</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )
              ) : activeTab === 'products' ? (
                /* Products Table */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                    <button onClick={openNewProductModal} className="btn btn-primary btn-sm">
                      <Plus size={16} />
                      <span>Add New Farm Product</span>
                    </button>
                  </div>

                  <div className="admin-table-container">
                    <table className="data-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Product Title</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover' }}
                            />
                          </td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{p.title}</div>
                            <div className="font-gurmukhi" style={{ fontSize: '0.78rem', color: '#15733E' }}>
                              {p.titlePunjabi}
                            </div>
                          </td>
                          <td>{p.category?.name || 'Produce'}</td>
                          <td><strong>₹ {p.price.toLocaleString('en-IN')}</strong> / {p.unit}</td>
                          <td>
                            <span className={`badge ${p.inStock ? 'badge-green' : 'badge-gold'}`}>
                              {p.inStock ? `${p.stockCount} in stock` : 'Out of stock'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => openEditProductModal(p)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15733E' }}
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              ) : (
                /* Catalogs Table */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                    <button onClick={openNewCatalogModal} className="btn btn-primary btn-sm">
                      <Plus size={16} />
                      <span>Add New Catalog</span>
                    </button>
                  </div>

                  <div className="admin-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>Catalog Name</th>
                          <th>Punjabi Title</th>
                          <th>URL Slug</th>
                          <th>Products Count</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((c) => {
                          const prodCount = c._count?.products ?? products.filter(p => p.categoryId === c.id || p.category?.slug === c.slug).length;
                          return (
                            <tr key={c.id}>
                              <td>
                                {c.imageUrl ? (
                                  <img
                                    src={c.imageUrl}
                                    alt={c.name}
                                    style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div style={{ width: '45px', height: '45px', borderRadius: '8px', background: '#EBF7EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                    {c.icon && c.icon !== 'package' && c.icon !== 'tag' ? c.icon : '🌱'}
                                  </div>
                                )}
                              </td>
                              <td>
                                <div style={{ fontWeight: 700 }}>{c.name}</div>
                                {c.description && (
                                  <div style={{ fontSize: '0.78rem', color: '#7A8B80', maxWidth: '240px' }}>
                                    {c.description}
                                  </div>
                                )}
                              </td>
                              <td className="font-gurmukhi" style={{ fontSize: '0.88rem', color: '#15733E', fontWeight: 600 }}>
                                {c.namePunjabi || c.name}
                              </td>
                              <td>
                                <code style={{ fontSize: '0.78rem', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                                  {c.slug}
                                </code>
                              </td>
                              <td>
                                <span className="badge badge-green">
                                  {prodCount} products
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => openEditCatalogModal(c)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15733E' }}
                                    title="Edit Catalog"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCatalog(c.id, c.name, prodCount)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                                    title="Delete Catalog"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {showProductModal && (
          <div className="modal-overlay" style={{ zIndex: 500 }}>
            <div className="modal-content" style={{ maxWidth: '540px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                  {editingProduct ? 'Edit Product' : 'Add New Farm Product'}
                </h3>
                <button
                  onClick={() => setShowProductModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A8B80' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct}>
                <div className="form-group">
                  <label className="form-label">Title (English) *</label>
                  <input
                    type="text"
                    required
                    value={productForm.title}
                    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Title (Punjabi / Gurmukhi) *</label>
                  <input
                    type="text"
                    required
                    value={productForm.titlePunjabi}
                    onChange={(e) => setProductForm({ ...productForm, titlePunjabi: e.target.value })}
                    className="form-input font-gurmukhi"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      value={productForm.categoryId}
                      onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                      className="form-select"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Unit *</label>
                    <input
                      type="text"
                      placeholder="e.g. 1 Litre, 1 kg, Unit"
                      value={productForm.unit}
                      onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stock Count</label>
                    <input
                      type="number"
                      value={productForm.stockCount}
                      onChange={(e) => setProductForm({ ...productForm, stockCount: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

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

                  {/* Supabase Direct Upload Zone */}
                  <div
                    style={{
                      border: '2px dashed rgba(21, 115, 62, 0.25)',
                      borderRadius: '12px',
                      padding: '16px',
                      background: '#FAF9F3',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {productForm.imageUrl && (
                        <img
                          src={productForm.imageUrl}
                          alt="Product preview"
                          style={{
                            width: '60px',
                            height: '60px',
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
                              cursor: uploadingImg ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              opacity: uploadingImg ? 0.6 : 1,
                            }}
                          >
                            <UploadCloud size={16} color="#15733E" />
                            <span>{uploadingImg ? 'Uploading...' : 'Upload Image to Supabase'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={uploadingImg}
                              style={{ display: 'none' }}
                            />
                          </label>

                          {!supabaseConfig.isConfigured && (
                            <button
                              type="button"
                              onClick={() => setShowSupabaseModal(true)}
                              className="btn btn-gold btn-sm"
                              style={{ fontSize: '0.74rem', padding: '5px 10px' }}
                            >
                              Paste Anon Key
                            </button>
                          )}
                        </div>

                        {uploadStatus && (
                          <div
                            style={{
                              fontSize: '0.78rem',
                              marginTop: '6px',
                              fontWeight: 600,
                              color: uploadStatus.includes('Error') || uploadStatus.includes('failed') ? '#DC2626' : '#15733E',
                            }}
                          >
                            {uploadStatus}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Image URL (auto-filled on upload above)"
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    rows={2}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="form-textarea"
                  />
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={productForm.inStock}
                      onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                    />
                    In Stock
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={productForm.featured}
                      onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                    />
                    Featured on Homepage
                  </label>
                </div>

                <button type="submit" className="btn btn-gold" style={{ width: '100%' }}>
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Add/Edit Catalog Modal */}
        {showCatalogModal && (
          <div className="modal-overlay" style={{ zIndex: 500 }}>
            <div className="modal-content" style={{ maxWidth: '520px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                  {editingCatalog ? 'Edit Catalog / Category' : 'Add New Catalog Category'}
                </h3>
                <button
                  onClick={() => setShowCatalogModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A8B80' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveCatalog}>
                <div className="form-group">
                  <label className="form-label">Catalog Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={catalogForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      if (!editingCatalog) {
                        setCatalogForm({
                          ...catalogForm,
                          name,
                          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                        });
                      } else {
                        setCatalogForm({ ...catalogForm, name });
                      }
                    }}
                    className="form-input"
                    placeholder="e.g. Pure Honey & Spices"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Title (Punjabi / Gurmukhi)</label>
                  <input
                    type="text"
                    value={catalogForm.namePunjabi}
                    onChange={(e) => setCatalogForm({ ...catalogForm, namePunjabi: e.target.value })}
                    className="form-input font-gurmukhi"
                    placeholder="e.g. ਸ਼ੁੱਧ ਸ਼ਹਿਦ ਅਤੇ ਮਸਾਲੇ"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={catalogForm.slug}
                    onChange={(e) => setCatalogForm({ ...catalogForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') })}
                    className="form-input"
                    placeholder="e.g. honey-spices"
                  />
                </div>

                {/* Catalog Image Upload Section (Supabase Cloud Storage) */}
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
                      {catalogForm.imageUrl && (
                        <img
                          src={catalogForm.imageUrl}
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
                              cursor: uploadingCatalogImg ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              opacity: uploadingCatalogImg ? 0.6 : 1,
                            }}
                          >
                            <UploadCloud size={16} color="#15733E" />
                            <span>{uploadingCatalogImg ? 'Uploading...' : 'Upload Image to Supabase'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleUploadCatalogImg}
                              disabled={uploadingCatalogImg}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>

                        {catalogUploadStatus && (
                          <div
                            style={{
                              fontSize: '0.78rem',
                              marginTop: '6px',
                              fontWeight: 600,
                              color: catalogUploadStatus.includes('Error') || catalogUploadStatus.includes('failed') ? '#DC2626' : '#15733E',
                            }}
                          >
                            {catalogUploadStatus}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Image URL (auto-filled on upload above)"
                    value={catalogForm.imageUrl}
                    onChange={(e) => setCatalogForm({ ...catalogForm, imageUrl: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={catalogForm.description}
                    onChange={(e) => setCatalogForm({ ...catalogForm, description: e.target.value })}
                    className="form-textarea"
                    placeholder="Short description of this catalog grouping..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCatalogModal(false)}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingCatalog}
                    className="btn btn-gold"
                    style={{ flex: 1 }}
                  >
                    {savingCatalog ? 'Saving...' : editingCatalog ? 'Update Catalog' : 'Create Catalog'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Supabase Storage & Cloud Settings Modal */}
        {showSupabaseModal && (
          <div className="modal-overlay" style={{ zIndex: 600 }}>
            <div className="modal-content" style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={22} color="#15733E" />
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#0A3E22' }}>
                    Connect Supabase Cloud Storage
                  </h3>
                </div>
                <button
                  onClick={() => setShowSupabaseModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A8B80' }}
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
                      : 'Supabase Anon Key Required'}
                  </strong>
                  <p style={{ margin: '4px 0 0', color: '#4A5D50', lineHeight: 1.45 }}>
                    {supabaseConfig.isConfigured
                      ? `Connected to project sachikheti (${supabaseForm.bucket}). Direct image uploads from this admin panel will be stored on Supabase CDN.`
                      : 'To upload product and marketing photos directly to your Supabase project, paste your project "anon" public key below.'}
                  </p>
                </div>
              </div>

              {/* Step-by-Step Help Guide (matches user\'s dashboard screenshot) */}
              <div
                style={{
                  background: '#F8FAF8',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                  fontSize: '0.84rem',
                }}
              >
                <div style={{ fontWeight: 800, color: '#0A3E22', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📋 3-Step Setup Guide (From Your Supabase Dashboard):</span>
                </div>
                <ol style={{ margin: '0 0 10px', paddingLeft: '20px', color: '#334155', lineHeight: 1.6 }}>
                  <li>
                    <strong>Find your Public Anon Key:</strong> In your Supabase dashboard (project <code>sachikheti</code>), click the green <strong>"Connect"</strong> button at the top (or click <strong>API Keys</strong> in the bottom bar / Project Settings &rarr; API) and copy the <code>anon</code> / <code>public</code> key.
                  </li>
                  <li>
                    <strong>Create Public Storage Bucket:</strong> In the left sidebar, click the <strong>Storage</strong> (bucket) icon &rarr; click <strong>"New bucket"</strong> &rarr; name it <code>SachiKeti</code> &rarr; toggle <strong>"Public bucket"</strong> to <span style={{ color: '#15733E', fontWeight: 700 }}>ON</span> &rarr; click <strong>Save</strong>.
                  </li>
                  <li>
                    <strong>Paste & Test:</strong> Paste your <code>anon</code> key below and click <strong>"Test Connection"</strong>.
                  </li>
                </ol>
                <a
                  href="https://supabase.com/dashboard/project/uuklvqlwrxvnacbnsyve"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#15733E',
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontSize: '0.82rem',
                  }}
                >
                  <span>Open Supabase Project Dashboard</span>
                  <ExternalLink size={13} />
                </a>
              </div>

              {/* Config Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={supabaseForm.url}
                    onChange={(e) => setSupabaseForm({ ...supabaseForm, url: e.target.value })}
                    className="form-input"
                    placeholder="https://uuklvqlwrxvnacbnsyve.supabase.co"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>
                    Supabase Publishable / Anon API Key *
                  </label>
                  <input
                    type="password"
                    value={supabaseForm.anonKey}
                    onChange={(e) => setSupabaseForm({ ...supabaseForm, anonKey: e.target.value })}
                    className="form-input"
                    placeholder="sb_publishable_... or eyJhbGciOi..."
                  />
                  <span style={{ fontSize: '0.74rem', color: '#7A8B80', marginTop: '4px', display: 'block' }}>
                    Copy the VITE_SUPABASE_PUBLISHABLE_KEY from your Supabase Connect dialog.
                  </span>
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

                {/* Test Result Message */}
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

                {/* Actions */}
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
                    className="btn btn-gold"
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
      </div>
    </div>
  );
}
