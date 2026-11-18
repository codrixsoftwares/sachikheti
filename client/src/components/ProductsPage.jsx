import React, { useEffect } from 'react';
import ProductCatalog from './ProductCatalog';
import { Sparkles, ArrowLeft } from 'lucide-react';

export default function ProductsPage({ selectedCategory, onSelectCategory, onOpenProductDetail, onNavigateHome }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="products-page-wrapper">
      {/* Page Hero Header */}
      <section className="products-hero-section">
        <div className="container">
          <div className="products-hero-content">
            <span className="badge badge-gold" style={{ marginBottom: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} /> LFPC Complete Farm Catalog
            </span>
            <h1 className="products-page-h1">
              Farm-Direct Agricultural Marketplace
            </h1>
            <p className="products-page-sub">
              Explore 100% pure Vedic Bilona cow ghee, wood-churned cold-pressed oils, handmade desi sweets, 
              nutrient-rich vermicompost, and heavy-duty farm machinery — delivered straight from registered LFPC growers.
            </p>
          </div>
        </div>
      </section>

      {/* Main Dynamic Product Catalog with Category Tabs and Search */}
      <ProductCatalog
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        onOpenProductDetail={onOpenProductDetail}
      />
    </div>
  );
}
