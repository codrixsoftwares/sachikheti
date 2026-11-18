import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Truck, Menu, X, MessageCircle, ChevronRight, ChevronDown, BookOpen, Users, PhoneCall, Layers } from 'lucide-react';
import { useCart } from '../context/CartContext';

const BRAND_NAMES = [
  { text: 'SachiKheti', lang: 'English', className: 'font-main' },
  { text: 'ਸੱਚੀ ਖੇਤੀ', lang: 'ਪੰਜਾਬੀ', className: 'font-gurmukhi' },
  { text: 'सच्ची खेती', lang: 'हिन्दी', className: 'font-hindi' },
];

const DEFAULT_CATEGORIES = [
  { slug: 'produce', name: 'Produce & Oils', icon: '🌻', sub: 'Cold-pressed oils & raw forest honey' },
  { slug: 'machinery', name: 'Machinery', icon: '🚜', sub: 'Rotavators, sprayers & farm implements' },
  { slug: 'dairy', name: 'Pure Dairy', icon: '🥛', sub: 'Vedic Bilona A2 cow ghee & fresh makkhan' },
  { slug: 'manure', name: 'Organic Manure', icon: '🌱', sub: 'Bio-enriched vermicompost & soil health' },
  { slug: 'sweets', name: 'Desi Sweets', icon: '🍯', sub: 'Pure desi ghee atta pinnis & treats' },
];

const PREFERRED_CATEGORY_ORDER = ['produce', 'machinery', 'dairy', 'manure', 'sweets'];

const formatNavCategory = (name) => {
  if (!name) return '';
  if (name.includes('Produce') || name.includes('Honey') || name.includes('Oil')) return 'Produce & Oils';
  if (name.includes('Machinery')) return 'Machinery';
  if (name.includes('Dairy')) return 'Pure Dairy';
  if (name.includes('Manure') || name.includes('Fertilizer')) return 'Organic Manure';
  if (name.includes('Sweets') || name.includes('Pinni')) return 'Desi Sweets';
  return name.length > 15 ? name.substring(0, 14) + '…' : name;
};

const getCategoryIcon = (slug) => {
  const match = DEFAULT_CATEGORIES.find((c) => c.slug === slug);
  return match ? match.icon : '🌾';
};

const getCategorySub = (slug) => {
  const match = DEFAULT_CATEGORIES.find((c) => c.slug === slug);
  return match ? match.sub : 'Direct from LFPC farmers';
};

export default function Navbar({
  currentPath = '/',
  selectedCategory = 'all',
  onNavigate,
  onOpenTracker,
  onSelectCategory,
}) {
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentBrandIndex, setCurrentBrandIndex] = useState(0);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownTimerRef = useRef(null);

  // Monitor window scroll to activate light glass theme across entire navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch dynamic categories from database
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          // Merge API data with default metadata
          const merged = PREFERRED_CATEGORY_ORDER.map((slug) => {
            const apiCat = data.data.find((c) => c.slug === slug);
            const defCat = DEFAULT_CATEGORIES.find((c) => c.slug === slug);
            return {
              id: apiCat ? apiCat.id : slug,
              slug: slug,
              name: apiCat ? formatNavCategory(apiCat.name) : defCat.name,
              icon: defCat.icon,
              sub: defCat.sub,
            };
          });
          setCategories(merged);
        }
      })
      .catch((err) => console.error('Error loading navbar categories:', err));
  }, []);

  // Circular loop interval cycling every 2.4 seconds: English -> Punjabi -> Hindi
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBrandIndex((prevIndex) => (prevIndex + 1) % BRAND_NAMES.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleMouseEnter = () => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    dropdownTimerRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 150);
  };

  const handleCategorySelect = (categorySlug) => {
    if (onSelectCategory) {
      onSelectCategory(categorySlug, true);
    }
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const handleAllProductsClick = () => {
    if (onSelectCategory) {
      onSelectCategory('all', true);
    }
    if (onNavigate) {
      onNavigate('/products');
    }
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const handlePageNavigate = (path) => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(path);
    }
  };

  const currentBrand = BRAND_NAMES[currentBrandIndex];

  return (
    <>
      <header className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          {/* Top-Left: Brand Emblem & Multi-Language Name */}
          <a
            href="/"
            className="nav-logo-group"
            onClick={(e) => {
              e.preventDefault();
              handlePageNavigate('/');
            }}
          >
            <div className="nav-logo-img-wrap">
              <img
                src="/assets/brand/sachi-kheti-emblem.jpg"
                alt="SachiKheti Emblem"
                className="nav-logo-img"
              />
            </div>
            <div className="nav-brand-text">
              <span
                key={currentBrand.lang}
                className={`brand-title brand-fade-in ${currentBrand.className}`}
              >
                {currentBrand.text}
              </span>
            </div>
          </a>

          {/* Middle: Centered Desktop Navigation Island */}
          <nav className="desktop-nav">
            <ul className="nav-links">
              {/* Link 1: Home */}
              <li>
                <a
                  href="/"
                  className={`nav-link ${currentPath === '/' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageNavigate('/');
                  }}
                >
                  Home
                </a>
              </li>

              {/* Dropdown 2: All Products */}
              <li
                className={`nav-dropdown ${dropdownOpen ? 'open' : ''}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <a
                  href="/products"
                  className={`nav-link nav-dropdown-trigger ${
                    currentPath === '/products' ? 'active' : ''
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleAllProductsClick();
                  }}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <span>All Products</span>
                  <ChevronDown
                    size={14}
                    className={`nav-dropdown-arrow ${dropdownOpen ? 'open' : ''}`}
                  />
                </a>

                {/* Dropdown Menu on Hover */}
                <div className={`nav-dropdown-menu ${dropdownOpen ? 'open' : ''}`}>
                  <a
                    href="/products"
                    className={`nav-dropdown-item ${
                      currentPath === '/products' && selectedCategory === 'all'
                        ? 'active'
                        : ''
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleAllProductsClick();
                    }}
                  >
                    All Farm Products
                  </a>

                  <div className="nav-dropdown-divider" />

                  {categories.map((cat) => (
                    <a
                      key={cat.id || cat.slug}
                      href={`/products?category=${cat.slug}`}
                      className={`nav-dropdown-item ${
                        currentPath === '/products' && selectedCategory === cat.slug
                          ? 'active'
                          : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleCategorySelect(cat.slug);
                      }}
                    >
                      {formatNavCategory(cat.name)}
                    </a>
                  ))}
                </div>
              </li>

              {/* Link 2: Our Story */}
              <li>
                <a
                  href="/story"
                  className={`nav-link ${currentPath === '/story' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageNavigate('/story');
                  }}
                >
                  Our Story
                </a>
              </li>

              {/* Link 3: Leaders */}
              <li>
                <a
                  href="/leaders"
                  className={`nav-link ${currentPath === '/leaders' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageNavigate('/leaders');
                  }}
                >
                  Leaders
                </a>
              </li>

              {/* Link 4: Blogs */}
              <li>
                <a
                  href="/blogs"
                  className={`nav-link ${currentPath === '/blogs' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageNavigate('/blogs');
                  }}
                >
                  Blogs
                </a>
              </li>

              {/* Link 5: Contact Us */}
              <li>
                <a
                  href="/contact"
                  className={`nav-link ${currentPath === '/contact' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageNavigate('/contact');
                  }}
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </nav>

          {/* Top-Right: Track Order & Cart Action Controls */}
          <div className="nav-actions">
            {/* Order Tracker Button */}
            <button
              onClick={onOpenTracker}
              className="btn-track-order nav-hide-mobile"
              title="Track Order by Order ID"
            >
              <Truck size={16} color="#15733E" />
              <span>Track Order</span>
            </button>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="cart-btn"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag size={18} />
              <span className="cart-text">Cart</span>
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </button>

            {/* Mobile menu hamburger (Mobile & Tablet) */}
            <button
              className="nav-mobile-toggle"
              aria-label="Toggle Mobile Navigation"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sliding Navigation Drawer */}
      <div
        className={`mobile-nav-backdrop ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}
        aria-label="Mobile Navigation"
      >
        {/* Drawer Header */}
        <div className="mobile-nav-header">
          <div className="mobile-nav-brand">
            <img
              src="/assets/brand/sachi-kheti-emblem.jpg"
              alt="SachiKheti"
              className="mobile-nav-logo"
            />
            <div>
              <div className="mobile-nav-title">SachiKheti</div>
              <div className="mobile-nav-sub">Pure Farm Direct • LFPC Ltd.</div>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="mobile-nav-close"
            aria-label="Close Navigation"
          >
            <X size={22} />
          </button>
        </div>

        {/* Drawer Body Links */}
        <div className="mobile-nav-body">
          <div className="mobile-nav-section-title">Navigation</div>
          <ul className="mobile-nav-list" style={{ marginBottom: '16px' }}>
            <li>
              <button
                onClick={() => handlePageNavigate('/')}
                className={`mobile-nav-item ${currentPath === '/' ? 'active' : ''}`}
              >
                <span>🏡 Home</span>
                <ChevronRight size={16} color="#7A8B80" />
              </button>
            </li>
          </ul>

          <div className="mobile-nav-section-title">All Products & Categories</div>
          <ul className="mobile-nav-list">
            <li>
              <button
                onClick={handleAllProductsClick}
                className={`mobile-nav-item ${
                  currentPath === '/products' && selectedCategory === 'all' ? 'active' : ''
                }`}
              >
                <span>All Farm Products</span>
                <ChevronRight size={16} color="#7A8B80" />
              </button>
            </li>

            {categories.map((cat) => (
              <li key={cat.id || cat.slug}>
                <button
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`mobile-nav-item ${
                    currentPath === '/products' && selectedCategory === cat.slug ? 'active' : ''
                  }`}
                >
                  <span>{formatNavCategory(cat.name)}</span>
                  <ChevronRight size={16} color="#7A8B80" />
                </button>
              </li>
            ))}
          </ul>

          <div className="mobile-nav-section-title" style={{ marginTop: '20px' }}>
            Explore SachiKheti
          </div>
          <ul className="mobile-nav-list">
            <li>
              <button
                className={`mobile-nav-item ${currentPath === '/story' ? 'active' : ''}`}
                onClick={() => handlePageNavigate('/story')}
              >
                <span>📖 Our Heritage & Story</span>
                <ChevronRight size={16} color="#7A8B80" />
              </button>
            </li>
            <li>
              <button
                className={`mobile-nav-item ${currentPath === '/leaders' ? 'active' : ''}`}
                onClick={() => handlePageNavigate('/leaders')}
              >
                <span>👥 Board of Directors & Leaders</span>
                <ChevronRight size={16} color="#7A8B80" />
              </button>
            </li>
            <li>
              <button
                className={`mobile-nav-item ${currentPath === '/blogs' ? 'active' : ''}`}
                onClick={() => handlePageNavigate('/blogs')}
              >
                <span>📝 Farming & Health Blogs</span>
                <ChevronRight size={16} color="#7A8B80" />
              </button>
            </li>
            <li>
              <button
                className={`mobile-nav-item ${currentPath === '/contact' ? 'active' : ''}`}
                onClick={() => handlePageNavigate('/contact')}
              >
                <span>📞 Contact Us & Support</span>
                <ChevronRight size={16} color="#7A8B80" />
              </button>
            </li>
          </ul>

          <div className="mobile-nav-section-title" style={{ marginTop: '20px' }}>
            Quick Actions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenTracker) onOpenTracker();
              }}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Truck size={17} color="#15733E" />
              <span>Track Your Order</span>
            </button>

            <a
              href="https://wa.me/918295886832?text=Hello%20SachiKheti!%20I%20would%20like%20to%20inquire%20about%20your%20products."
              target="_blank"
              rel="noreferrer"
              className="btn btn-whatsapp"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <MessageCircle size={17} />
              <span>Direct WhatsApp Order</span>
            </a>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="mobile-nav-footer">
          <div
            style={{
              color: '#0A3E22',
              fontSize: '0.85rem',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '4px',
            }}
          >
            SachiKheti by LFPC
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7A8B80', textAlign: 'center' }}>
            Lamma Farmer Producer Co. Ltd. • Fatehabad, Haryana
          </div>
        </div>
      </aside>
    </>
  );
}
