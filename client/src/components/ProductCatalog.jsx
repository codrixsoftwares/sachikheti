import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, MessageCircle, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getSocket } from '../lib/socket';

export default function ProductCatalog({
  selectedCategory = 'all',
  onSelectCategory,
  onOpenProductDetail,
  isHome = false,
  onNavigateProducts,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart } = useCart();

  const [categories, setCategories] = useState([
    { id: 'all', label: 'All Products', punjabi: 'ਸਾਰੇ ਉਤਪਾਦ' },
  ]);

  const fetchCategories = () => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const apiCats = data.data.map((c) => ({
            id: c.slug,
            label: c.name,
            punjabi: c.namePunjabi && c.namePunjabi !== c.name ? c.namePunjabi : '',
            imageUrl: c.imageUrl,
          }));
          setCategories([
            { id: 'all', label: 'All Products', punjabi: 'ਸਾਰੇ ਉਤਪਾਦ' },
            ...apiCats,
          ]);
        }
      })
      .catch((err) => console.error('Error fetching categories in catalog:', err));
  };

  // Dynamically load categories from live database
  useEffect(() => {
    fetchCategories();
  }, []);

  // Real-time WebSocket IO listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onCatalogsChange = () => {
      fetchCategories();
      fetchProducts();
    };

    const onProductsChange = () => {
      fetchProducts();
    };

    socket.on('categories:updated', onCatalogsChange);
    socket.on('catalogs:updated', onCatalogsChange);
    socket.on('products:updated', onProductsChange);

    return () => {
      socket.off('categories:updated', onCatalogsChange);
      socket.off('catalogs:updated', onCatalogsChange);
      socket.off('products:updated', onProductsChange);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = '/api/products';
      const params = new URLSearchParams();
      if (!isHome && selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (!isHome && searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery, isHome]);

  const handleQuickWhatsApp = (product, e) => {
    e.stopPropagation();
    let typeNote = '';
    try {
      if (product.specs) {
        const s = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs;
        if (s.isForRent && !s.isForSale) typeNote = ' (For Rent / Custom Hiring)';
        else if (s.isForRent && s.isForSale) typeNote = ' (Available for Rent or Purchase)';
      }
    } catch (err) {}
    const msg = encodeURIComponent(
      `Hello SachiKheti! I want to inquire/order:\n- *${product.title}*${typeNote}\n- Price: ₹${product.price.toLocaleString('en-IN')} / ${product.unit}\n\nPlease confirm availability and details.`
    );
    window.open(`https://wa.me/918360253372?text=${msg}`, '_blank');
  };

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  // On Home page, display the 4 core agricultural catalogs
  let displayedProducts = products;
  if (isHome) {
    const ghee =
      products.find((p) => p.category?.slug === 'dairy' && p.title.includes('Ghee')) ||
      products.find((p) => p.category?.slug === 'dairy');
    const oil =
      products.find((p) => p.category?.slug === 'produce' && p.title.includes('Mustard')) ||
      products.find((p) => p.category?.slug === 'produce');
    const pinni =
      products.find((p) => p.category?.slug === 'sweets' && p.title.includes('Pinni')) ||
      products.find((p) => p.category?.slug === 'sweets');
    const manure =
      products.find((p) => p.category?.slug === 'manure' && p.title.includes('Vermicompost')) ||
      products.find((p) => p.category?.slug === 'manure');

    const top4 = [ghee, oil, pinni, manure].filter(Boolean);
    displayedProducts = top4.length === 4 ? top4 : products.slice(0, 4);
  }

  return (
    <section id="catalog" className="catalog-section">
      <div className="container">
        {/* Title & Search Bar */}
        <div className="catalog-header">
          <div className="catalog-title-col">
            {!isHome && (
              <span
                className="badge badge-gold"
                style={{
                  marginBottom: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                LFPC Certified Catalog
              </span>
            )}
            <h2 className="catalog-h2">Direct From Farm To Table</h2>
            <p className="catalog-subtitle">
              {isHome
                ? 'Handcrafted pure dairy, wood-pressed oils, desi sweets, and certified organic manure.'
                : 'Handcrafted pure dairy, farm-grade fertilizers, and reliable agricultural machinery.'}
            </p>
          </div>

          {/* Search Box (Full catalog view) */}
          {!isHome && (
            <div className="catalog-search-wrapper">
              <Search size={18} color="#7A8B80" className="catalog-search-icon" />
              <input
                type="text"
                placeholder="Search products or descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input catalog-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="catalog-search-clear"
                  aria-label="Clear Search"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>

        {/* Category Filters (Only on dedicated full catalog page) */}
        {!isHome && (
          <div className="catalog-filters-scroll">
            <div className="catalog-filters">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`filter-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                >
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="catalog-state-box">
            <div className="catalog-loading-text">Loading fresh farm produce...</div>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="catalog-empty-box">
            <h3 style={{ fontSize: '1.3rem', color: '#0A3E22', marginBottom: '8px' }}>
              No products found
            </h3>
            <p style={{ color: '#7A8B80' }}>
              Try adjusting your search query or switching categories.
            </p>
          </div>
        ) : (
          <div className={`product-grid ${isHome ? 'home-4-grid' : ''}`}>
            {displayedProducts.map((product) => {
              let isRental = false;
              let isBoth = false;
              try {
                if (product.specs) {
                  const s = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs;
                  if (s.isForRent && s.isForSale) isBoth = true;
                  else if (s.isForRent) isRental = true;
                }
              } catch (err) {}

              return (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => onOpenProductDetail(product)}
                >
                  {/* Product Image Wrap */}
                  <div className="product-card-media">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="product-card-img"
                      loading="lazy"
                    />

                    {product.featured && (
                      <span className="product-card-tag badge-gold">Featured</span>
                    )}

                    {isBoth && (
                      <span
                        className="product-card-tag"
                        style={{
                          background: '#0284C7',
                          color: '#fff',
                          left: product.featured ? '86px' : '10px',
                        }}
                      >
                        Rent & Sale
                      </span>
                    )}

                    {!isBoth && isRental && (
                      <span
                        className="product-card-tag"
                        style={{
                          background: '#7C3AED',
                          color: '#fff',
                          left: product.featured ? '86px' : '10px',
                        }}
                      >
                        For Rent
                      </span>
                    )}

                    {!product.inStock && (
                      <span className="product-card-tag badge-out-of-stock">Sold Out</span>
                    )}
                  </div>

                {/* Product Content */}
                <div className="product-card-body">
                  <div className="product-card-cat">
                    {product.category?.name || 'Produce'}
                  </div>

                  <h3 className="product-card-title">{product.title}</h3>

                  <p className="product-card-desc">{product.description}</p>

                  <div className="product-card-footer">
                    <div className="product-price-box">
                      <span className="product-currency">₹</span>
                      <span className="product-price">
                        {product.price.toLocaleString('en-IN')}
                      </span>
                      <span className="product-unit">/{product.unit}</span>
                    </div>

                    <div className="product-card-actions">
                      <button
                        onClick={(e) => handleQuickWhatsApp(product, e)}
                        className="btn-icon-whatsapp"
                        title="Inquire or Order via WhatsApp"
                        aria-label="Order on WhatsApp"
                      >
                        <MessageCircle size={18} />
                      </button>

                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={!product.inStock}
                        className="btn btn-primary btn-sm product-add-btn"
                        aria-label="Add to cart"
                      >
                        <ShoppingBag size={15} />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}

        {/* Home Section CTA to explore complete catalog */}
        {isHome && (
          <div className="catalog-home-footer-cta">
            <div className="catalog-home-cta-text">
              <div className="catalog-home-cta-heading">
                Explore Our Complete Farm & Machinery Catalog
              </div>
              <div className="catalog-home-cta-sub">
                View all agricultural machinery, sprayers, raw honey, and bulk fertilizer in our full
                marketplace.
              </div>
            </div>
            <button
              onClick={() => {
                if (onNavigateProducts) onNavigateProducts();
                else window.location.href = '/products';
              }}
              className="btn btn-primary btn-md"
            >
              <span>View All Products in Catalog</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
