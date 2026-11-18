import React, { useState, useEffect } from 'react';
import { ShoppingBag, Truck, Menu, X, MessageCircle, ChevronRight, Sparkles, Layers } from 'lucide-react';
import { useCart } from '../context/CartContext';

const BRAND_NAMES = [
  { text: 'SachiKheti', lang: 'English', className: 'font-main' },
  { text: 'ਸੱਚੀ ਖੇਤੀ', lang: 'ਪੰਜਾਬੀ', className: 'font-gurmukhi' },
  { text: 'सच्ची खेती', lang: 'हिन्दी', className: 'font-hindi' },
];

// Desired explicit category ordering matching modern navbar specification
const PREFERRED_CATEGORY_ORDER = ['produce', 'machinery', 'dairy', 'manure', 'sweets'];

// Format category names for clean single-line desktop navbar
const formatNavCategory = (name) => {
  if (!name) return '';
  if (name.includes('Produce') || name.includes('Honey') || name.includes('Oil')) return 'Produce & Oils';
  if (name.includes('Machinery')) return 'Machinery';
  if (name.includes('Dairy')) return 'Pure Dairy';
  if (name.includes('Manure') || name.includes('Fertilizer')) return 'Organic Manure';
  if (name.includes('Sweets') || name.includes('Pinni')) return 'Desi Sweets';
  return name.length > 15 ? name.substring(0, 14) + '…' : name;
};

export default function Navbar({ currentPath = '/', onNavigate, onOpenAdmin, onOpenTracker, onSelectCategory }) {
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentBrandIndex, setCurrentBrandIndex] = useState(0);
  const [categories, setCategories] = useState([]);

  // Fetch dynamic categories from database
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setCategories(data.data);
        }
      })
      .catch(err => console.error('Error loading navbar categories:', err));
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

  const handleNavClick = (categorySlug) => {
    onSelectCategory(categorySlug);
    setMobileMenuOpen(false);
    const catalogElem = document.getElementById('catalog');
    if (catalogElem) {
      catalogElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentBrand = BRAND_NAMES[currentBrandIndex];

  // Strictly order categories: Produce & Oils, Machinery, Pure Dairy, Organic Manure, Desi Sweets
  const orderedCategories = [...categories].sort((a, b) => {
    const idxA = PREFERRED_CATEGORY_ORDER.indexOf(a.slug);
    const idxB = PREFERRED_CATEGORY_ORDER.indexOf(b.slug);
    if (idxA === -1 && idxB === -1) return a.name.localeCompare(b.name);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  return (
    <>
      <header className="navbar">
        <div className="nav-container">
          {/* Top-Left: Brand Emblem & Name */}
          <a
            href="/"
            className="nav-logo-group"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('/');
              else window.scrollTo({ top: 0, behavior: 'smooth' });
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

          {/* Middle: Centered Desktop Navigation (All Products, Produce & Oils, Machinery, Pure Dairy, Organic Manure, Desi Sweets, Our Story) */}
          <nav className="desktop-nav">
            <ul className="nav-links">
              <li>
                <a
                  href="#catalog"
                  className="nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick('all');
                  }}
                >
                  All Products
                </a>
              </li>

              {orderedCategories.map((cat) => (
                <li key={cat.id || cat.slug}>
                  <a
                    href={`#catalog?category=${cat.slug}`}
                    className="nav-link"
                    title={cat.name}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(cat.slug);
                    }}
                  >
                    {formatNavCategory(cat.name)}
                  </a>
                </li>
              ))}

              <li>
                <a
                  href="/story"
                  className={`nav-link ${currentPath === '/story' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('/story');
                  }}
                >
                  Our Story
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
              <div className="mobile-nav-sub">Pure Farm Direct</div>
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
          <div className="mobile-nav-section-title">Store Catalog</div>
          <ul className="mobile-nav-list">
            <li>
              <button onClick={() => handleNavClick('all')} className="mobile-nav-item">
                <span>🌾 All Farm Products</span>
                <ChevronRight size={16} color="#7A8B80" />
              </button>
            </li>

            {orderedCategories.map((cat) => (
              <li key={cat.id}>
                <button onClick={() => handleNavClick(cat.slug)} className="mobile-nav-item">
                  <span>🌿 {cat.name}</span>
                  <ChevronRight size={16} color="#7A8B80" />
                </button>
              </li>
            ))}

            <li>
              <button
                className={`mobile-nav-item ${currentPath === '/story' ? 'active' : ''}`}
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onNavigate) onNavigate('/story');
                }}
              >
                <span>📖 Our Heritage & Story</span>
                <ChevronRight size={16} color="#7A8B80" />
              </button>
            </li>
          </ul>

          <div className="mobile-nav-section-title" style={{ marginTop: '20px' }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTracker();
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
          <div style={{ color: '#0A3E22', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', marginBottom: '4px' }}>
            SachiKheti by LFPC
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7A8B80', textAlign: 'center' }}>
            LFPC Ltd. • Fatehabad, Haryana
          </div>
        </div>
      </aside>
    </>
  );
}
