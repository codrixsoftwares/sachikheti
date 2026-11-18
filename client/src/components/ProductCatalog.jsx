import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, MessageCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

// Top 3 catalogs by sales ratio in SachiKheti (LFPC)
const HOME_TOP_3_CATALOGS = [
  { id: 'all', label: 'All Top Sellers', ratio: 'Top 3 Catalogs' },
  { id: 'dairy', label: 'Pure Dairy', ratio: '48% Sales Ratio' },
  { id: 'produce', label: 'Produce & Oils', ratio: '28% Sales Ratio' },
  { id: 'sweets', label: 'Desi Sweets', ratio: '24% Sales Ratio' },
];

const PRODUCT_SALES_META = {
  dairy: { ratio: '48% Sales Ratio', rank: '#1 Best Seller' },
  produce: { ratio: '28% Sales Ratio', rank: '#2 High Demand' },
  sweets: { ratio: '24% Sales Ratio', rank: '#3 Customer Favorite' },
};

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

  // Dynamically load categories from live database
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const apiCats = data.data.map((c) => ({
            id: c.slug,
            label: c.name,
            punjabi: c.namePunjabi && c.namePunjabi !== c.name ? c.namePunjabi : '',
          }));
          setCategories([
            { id: 'all', label: 'All Products', punjabi: 'ਸਾਰੇ ਉਤਪਾਦ' },
            ...apiCats,
          ]);
        }
      })
      .catch((err) => console.error('Error fetching categories in catalog:', err));
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = '/api/products';
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchQuery.trim()) {
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
  }, [selectedCategory, searchQuery]);

  const handleQuickWhatsApp = (product, e) => {
    e.stopPropagation();
    const msg = encodeURIComponent(
      `Hello SachiKheti! I want to order:\n- *${product.title}*\n- Price: ₹${product.price.toLocaleString('en-IN')} / ${product.unit}\n\nPlease confirm availability and delivery to my address.`
    );
    window.open(`https://wa.me/918295886832?text=${msg}`, '_blank');
  };

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  // Determine which categories to display in the filter bar
  const activeFilters = isHome ? HOME_TOP_3_CATALOGS : categories;

  // On Home page, constrain display to the top 3 catalogs based on verified sales ratios
  let displayedProducts = products;
  if (isHome) {
    if (!selectedCategory || selectedCategory === 'all') {
      // Pick top representative bestseller from each of the 3 catalogs
      const ghee =
        products.find((p) => p.category?.slug === 'dairy' && p.title.includes('Ghee')) ||
        products.find((p) => p.category?.slug === 'dairy');
      const oil =
        products.find((p) => p.category?.slug === 'produce' && p.title.includes('Mustard')) ||
        products.find((p) => p.category?.slug === 'produce');
      const pinni =
        products.find((p) => p.category?.slug === 'sweets' && p.title.includes('Pinni')) ||
        products.find((p) => p.category?.slug === 'sweets');

      const top3 = [ghee, oil, pinni].filter(Boolean);
      displayedProducts = top3.length > 0 ? top3.slice(0, 3) : products.slice(0, 3);
    } else {
      // If user selected one of the 3 top catalogs on home, show top 3 items in that catalog
      displayedProducts = products.slice(0, 3);
    }
  }

  return (
    <section id="catalog" className="catalog-section">
      <div className="container">
        {/* Title & Search Bar */}
        <div className="catalog-header">
          <div className="catalog-title-col">
            <span
              className="badge badge-gold"
              style={{
                marginBottom: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isHome ? <TrendingUp size={14} /> : null}
              {isHome ? 'Top 3 Catalogs by Sales Ratio' : 'LFPC Certified Catalog'}
            </span>
            <h2 className="catalog-h2">Direct From Farm To Table</h2>
            <p className="catalog-subtitle">
              {isHome
                ? 'Top 3 consumer-favorite agricultural catalogs ranked by verified household order volume.'
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

        {/* Category Filters */}
        <div className="catalog-filters-scroll">
          <div className="catalog-filters">
            {activeFilters.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`filter-chip ${selectedCategory === cat.id ? 'active' : ''}`}
              >
                <span>{cat.label}</span>
                {isHome && cat.ratio && cat.id !== 'all' && (
                  <span className="catalog-filter-ratio-pill">{cat.ratio.split(' ')[0]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

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
          <div className="product-grid">
            {displayedProducts.map((product) => {
              const salesMeta = PRODUCT_SALES_META[product.category?.slug];

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

                    {/* Sales Ratio Badge */}
                    {isHome && salesMeta && (
                      <span className="product-card-tag badge-sales-ratio">
                        {salesMeta.ratio}
                      </span>
                    )}

                    {!isHome && product.featured && (
                      <span className="product-card-tag badge-gold">Featured</span>
                    )}

                    {!product.inStock && (
                      <span className="product-card-tag badge-out-of-stock">Sold Out</span>
                    )}
                  </div>

                  {/* Product Content */}
                  <div className="product-card-body">
                    <div
                      className="product-card-cat"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>{product.category?.name || 'Produce'}</span>
                      {salesMeta && (
                        <span style={{ fontSize: '0.72rem', color: '#B46F00', fontWeight: 700 }}>
                          {salesMeta.rank}
                        </span>
                      )}
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
                Looking for our complete agricultural range?
              </div>
              <div className="catalog-home-cta-sub">
                Explore all 5 producer catalogs including heavy tractor rotavators, high-potency
                vermicompost, and whole farm grains.
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
