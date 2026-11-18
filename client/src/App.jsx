import React, { useState, useEffect } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import AnnouncementBar from './components/AnnouncementBar';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StoryPage from './components/StoryPage';
import StorySection from './components/StorySection';
import ProductCatalog from './components/ProductCatalog';
import ProductsPage from './components/ProductsPage';
import LeadersPage from './components/LeadersPage';
import BlogsPage from './components/BlogsPage';
import ContactPage from './components/ContactPage';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderTrackModal from './components/OrderTrackModal';
import AdminPortalPage from './components/AdminPortalPage';
import Footer from './components/Footer';

function MainApp() {
  const { isCheckoutOpen, setIsCheckoutOpen } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeProductDetail, setActiveProductDetail] = useState(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  // Client-side URL route state for '/', '/products', '/story', '/leaders', '/blogs', '/contact', and '/adminlog'
  const getInitialPath = () => {
    if (typeof window === 'undefined') return '/';
    const p = window.location.pathname.toLowerCase();
    if (p === '/adminlog') return '/adminlog';
    if (p === '/products' || p === '/catalog' || p === '/all-products') return '/products';
    if (p === '/story' || p === '/our-story') return '/story';
    if (p === '/leaders' || p === '/leadership' || p === '/directors') return '/leaders';
    if (p === '/blogs' || p === '/blog' || p === '/articles') return '/blogs';
    if (p === '/contact' || p === '/contact-us') return '/contact';
    return '/';
  };

  const [currentPath, setCurrentPath] = useState(getInitialPath);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(getInitialPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (cat, forceProductsPage = false) => {
    setSelectedCategory(cat);
    if (forceProductsPage || (currentPath !== '/' && currentPath !== '/products')) {
      navigateTo('/products');
    } else if (currentPath === '/') {
      const catalogElem = document.getElementById('catalog');
      if (catalogElem) {
        catalogElem.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // If on /adminlog, render the dedicated Admin Portal App exclusively
  if (currentPath === '/adminlog') {
    return (
      <AdminPortalPage
        onNavigateHome={() => navigateTo('/')}
      />
    );
  }

  // Public E-Commerce Store
  return (
    <div className="app-root">
      {/* Top Promotional Announcement Ribbon */}
      <AnnouncementBar />

      {/* Main Glass Navigation Header */}
      <Navbar
        currentPath={currentPath}
        selectedCategory={selectedCategory}
        onNavigate={navigateTo}
        onOpenTracker={() => setIsTrackerOpen(true)}
        onSelectCategory={handleSelectCategory}
      />

      {/* Dedicated Page Routing */}
      {currentPath === '/products' ? (
        <ProductsPage
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          onOpenProductDetail={(prod) => setActiveProductDetail(prod)}
          onNavigateHome={() => navigateTo('/')}
        />
      ) : currentPath === '/story' ? (
        <StoryPage onExploreClick={() => navigateTo('/products')} />
      ) : currentPath === '/leaders' ? (
        <LeadersPage onExploreClick={() => navigateTo('/products')} />
      ) : currentPath === '/blogs' ? (
        <BlogsPage onExploreClick={() => navigateTo('/products')} />
      ) : currentPath === '/contact' ? (
        <ContactPage />
      ) : (
        <>
          {/* Home Showcase */}
          <Hero
            onExploreClick={() => navigateTo('/products')}
            onNavigateStory={() => navigateTo('/story')}
          />

          {/* Dynamic Product Catalog across Agricultural Categories (Top 3 on Home) */}
          <ProductCatalog
            isHome={true}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            onOpenProductDetail={(prod) => setActiveProductDetail(prod)}
            onNavigateProducts={() => navigateTo('/products')}
          />

          {/* SachiKheti LFPC Cooperative Story, Pillars & Board of Directors */}
          <StorySection onExploreClick={() => navigateTo('/products')} />
        </>
      )}

      {/* Footer */}
      <Footer
        onNavigate={navigateTo}
        onSelectCategory={(cat) => handleSelectCategory(cat, true)}
      />

      {/* Modals & Drawers */}
      <CartDrawer />

      {isCheckoutOpen && (
        <CheckoutModal onClose={() => setIsCheckoutOpen(false)} />
      )}

      {activeProductDetail && (
        <ProductDetailModal
          product={activeProductDetail}
          onClose={() => setActiveProductDetail(null)}
        />
      )}

      {isTrackerOpen && (
        <OrderTrackModal onClose={() => setIsTrackerOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <MainApp />
    </CartProvider>
  );
}
