import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ArrowRight, User, Tag, CheckCircle2, X } from 'lucide-react';

const BLOG_POSTS = [
  {
    id: 1,
    title: 'The Vedic Bilona Ghee Method: Why Ancestral Curd-Churning Outperforms Industrial Butter Oil',
    slug: 'vedic-bilona-ghee-method',
    category: 'Vedic Dairy',
    author: 'Paramjit Singh (Managing Director)',
    date: 'November 15, 2026',
    readTime: '5 min read',
    summary: 'Discover how slow curd-to-butter churning preserves fat-soluble vitamins (A, D, E, K), CLA, and short-chain butyric acid while industrial cream heating destroys vital micronutrients.',
    image: '/assets/brand/sachi-kheti-logo-full.jpg',
    content: `
      <h3>The Heritage of True Vedic Bilona Churning</h3>
      <p>In modern supermarket dairy aisles, over 95% of commercial "desi ghee" is actually factory-processed butter oil manufactured by boiling leftover dairy cream at high temperatures using chemical emulsifiers and artificial flavor enhancers. This shortcut destroys delicate conjugated linoleic acid (CLA) and enzymes.</p>
      
      <h4>The 5 Sacred Steps of LFPC Bilona Ghee:</h4>
      <ul>
        <li><strong>Step 1: Grass-Fed Desi Cow Milk:</strong> Sourced only from ethically treated, indigenous pasture-grazed cattle.</li>
        <li><strong>Step 2: Clay Pot Simmering:</strong> Fresh milk is boiled over slow, natural cow dung embers in earthenware.</li>
        <li><strong>Step 3: Overnight Curd Formation:</strong> Naturally cultured with ancestral microbial curd starters.</li>
        <li><strong>Step 4: Bi-directional Wooden Bilona Churn:</strong> Hand-churned clockwise and counter-clockwise to gently separate pure makkhan (butter) without friction heat.</li>
        <li><strong>Step 5: Golden Clarification:</strong> Slow-simmered until golden amber droplets emerge with natural nutty granulated texture.</li>
      </ul>
      <p>The result is a sacred superfood that nourishes gut flora, supports cognitive health, and balances digestion with absolute purity.</p>
    `,
  },
  {
    id: 2,
    title: 'Regenerative Agriculture: How High-Potency Vermicompost Restores Depleted Farmlands',
    slug: 'regenerative-agriculture-vermicompost',
    category: 'Organic Soil Health',
    author: 'Virpal Kaur (Head of Operations)',
    date: 'November 10, 2026',
    readTime: '4 min read',
    summary: 'Decades of synthetic urea and chemical pesticides have hardened North Indian soils. Learn how Eisenia fetida vermicompost revitalizes microbial biodiversity and moisture retention.',
    image: '/assets/brand/sachi-kheti-emblem.jpg',
    content: `
      <h3>Reviving India's Soil from the Root Up</h3>
      <p>Continuous overuse of NPK chemical fertilizers has lowered soil organic carbon (SOC) levels in Punjab and Haryana to dangerous lows under 0.4%. Soil that cannot breathe cannot support nutrient-dense crops.</p>
      
      <h4>Why LFPC Organic Vermicompost Makes the Difference:</h4>
      <ul>
        <li><strong>Eisenia Fetida Earthworm Bio-digestion:</strong> Cow manure enriched with agricultural crop residues digested slowly for 60 days.</li>
        <li><strong>Multiplied Humic & Fulvic Acids:</strong> Naturally unlocks phosphorus and trace minerals locked in the soil crust.</li>
        <li><strong>300% Higher Water Retention:</strong> Reduces irrigation frequency and shields crops against seasonal heat stress.</li>
        <li><strong>100% Free of Weed Seeds and Heavy Metals:</strong> Fully cured, pre-screened, and lab-certified for organic growers.</li>
      </ul>
    `,
  },
  {
    id: 3,
    title: 'Direct-to-Farmer Prosperity: The Lamma Farmer Producer Company Story',
    slug: 'direct-to-farmer-prosperity-lfpc',
    category: 'Cooperative Movement',
    author: 'Harinder Singh Dhillon (Marketing & Sales)',
    date: 'November 04, 2026',
    readTime: '6 min read',
    summary: 'How collective aggregation, cold-chain infrastructure, and digital consumer distribution liberated over 400 smallholder farming families from local middleman debt cycles.',
    image: '/assets/brand/sachi-kheti-logo-full.jpg',
    content: `
      <h3>Breaking the Cycle of Middleman Exploitation</h3>
      <p>Historically, an Indian farmer receives barely 25 to 30 paise out of every rupee spent by urban households on dairy and produce. The rest is captured by layers of commission agents, storage speculators, and branding conglomerates.</p>
      
      <p>By registering under <strong>Lamma Farmer Producer Company Limited (LFPC)</strong>, our rural member farmers pooled their acreage, established centralized cold-pressed oil extraction units, and launched <strong>SachiKheti</strong>. Today, 100% of purchase proceeds flow straight into verified farmer bank accounts, funding seed purchases, modern farm equipment, and children's education.</p>
    `,
  },
  {
    id: 4,
    title: 'Cold-Pressed Wooden Kolhu Mustard Oil vs. Solvent-Extracted Refined Oils',
    slug: 'cold-pressed-mustard-oil-benefits',
    category: 'Healthy Fats',
    author: 'Malkit Singh (Procurement Head)',
    date: 'October 28, 2026',
    readTime: '4 min read',
    summary: 'Industrial refined oils use hexane solvents and 200°C bleaching that destroy cardiac health. Why traditional slow wooden-press kachi ghani oil is India’s healthiest cooking medium.',
    image: '/assets/brand/sachi-kheti-emblem.jpg',
    content: `
      <h3>The Truth About Industrial Solvent Extraction</h3>
      <p>Refined cooking oils are produced through petroleum-based hexane chemical baths, followed by high-heat deodorization and chemical degumming that strips all natural nutrients and introduces trans-fats.</p>
      
      <h4>The Wooden Kolhu Advantage:</h4>
      <ul>
        <li><strong>Cold-Temperature Extraction (&lt; 40°C):</strong> Squeezed gently in wooden expellers without chemical solvents or thermal degradation.</li>
        <li><strong>Natural Allyl Isothiocyanate:</strong> Retains the authentic pungent aroma that shields against microbial spoilage.</li>
        <li><strong>Optimal 1:1 Omega-3 to Omega-6 Ratio:</strong> Supports cardiovascular wellness and natural joint lubrication.</li>
      </ul>
    `,
  },
];

export default function BlogsPage({ onExploreClick }) {
  const [activeArticle, setActiveArticle] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="blogs-page-wrapper">
      {/* Hero Header */}
      <section className="blogs-hero-section">
        <div className="container">
          <div className="blogs-hero-content">
            <h1 className="blogs-page-h1">
              Field Notes, Vedic Heritage & Farming Wisdom
            </h1>
            <p className="blogs-page-sub">
              Deep dives into ancient Vedic Bilona science, chemical-free regenerative agriculture, 
              and the real stories of rural farming families behind SachiKheti.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Cards Grid */}
      <section className="blogs-content-section">
        <div className="container">
          <div className="blogs-grid">
            {BLOG_POSTS.map((post) => (
              <article key={post.id} className="card-glass blog-card">
                <div className="blog-card-header">
                  <span className="blog-category-badge">{post.category}</span>
                  <div className="blog-meta-time">
                    <Clock size={13} />
                    <span>{post.readTime}</span>
                  </div>
                </div>

                <h2 className="blog-card-title">{post.title}</h2>
                <p className="blog-card-summary">{post.summary}</p>

                <div className="blog-card-footer">
                  <div className="blog-author-info">
                    <User size={14} color="#15733E" />
                    <span>{post.author}</span>
                  </div>
                  <div className="blog-date-info">
                    <Calendar size={13} color="#7A8B80" />
                    <span>{post.date}</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveArticle(post)}
                  className="btn btn-secondary btn-sm blog-read-btn"
                >
                  <span>Read Full Article</span>
                  <ArrowRight size={15} />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Full Article Modal */}
      {activeArticle && (
        <div className="modal-backdrop" onClick={() => setActiveArticle(null)}>
          <div className="modal-content blog-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="blog-category-badge">{activeArticle.category}</span>
              <button
                onClick={() => setActiveArticle(null)}
                className="modal-close-btn"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <h2 className="blog-modal-title">{activeArticle.title}</h2>

            <div className="blog-modal-meta">
              <span>By {activeArticle.author}</span>
              <span>•</span>
              <span>{activeArticle.date}</span>
              <span>•</span>
              <span>{activeArticle.readTime}</span>
            </div>

            <div
              className="blog-modal-body"
              dangerouslySetInnerHTML={{ __html: activeArticle.content }}
            />

            <div className="blog-modal-footer">
              <button
                onClick={() => setActiveArticle(null)}
                className="btn btn-secondary"
              >
                Close Article
              </button>
              <button
                onClick={() => {
                  setActiveArticle(null);
                  if (onExploreClick) onExploreClick();
                }}
                className="btn btn-primary"
              >
                <span>Shop Pure Farm Produce</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
