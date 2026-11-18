import React, { useEffect } from 'react';
import { ShieldCheck, Award, Users, CheckCircle2, Building, Scale, ArrowRight, MessageCircle } from 'lucide-react';
import LeadershipSection from './LeadershipSection';

export default function LeadersPage({ onExploreClick }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="leaders-page-wrapper">
      {/* Page Hero Header */}
      <section className="leaders-hero-section">
        <div className="container">
          <div className="leaders-hero-content">
            <span className="badge badge-gold" style={{ marginBottom: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} /> Official Governance & Management
            </span>
            <h1 className="leaders-page-h1">
              Board of Directors & Company Leadership
            </h1>
            <div className="font-gurmukhi leaders-quote">
              "ਚੰਗੀ ਸੋਚ ਸਖ਼ਤ ਮਿਹਨਤ, ਫਿਰ ਹੁੰਦੀ ਰੱਬ ਦੀ ਰਹਿਮਤ"
            </div>
            <p className="leaders-page-sub">
              Officially incorporated under the Ministry of Corporate Affairs (MCA) as <strong>Lamma Farmer Producer Company Limited (LFPC)</strong>.
              Meet the experienced agricultural producers, operations leaders, and visionary directors leading our cooperative forward.
            </p>
          </div>
        </div>
      </section>

      {/* Official 5 Directors Card Section */}
      <LeadershipSection showHeader={false} className="leaders-page-directors" />

      {/* Governance & FPC Principles Section */}
      <section className="leaders-governance-section">
        <div className="container">
          <div className="governance-grid">
            <div className="card-glass governance-card">
              <div className="governance-icon">
                <Building size={26} color="#15733E" />
              </div>
              <h3 className="governance-title">Farmer Producer Company (FPC) Structure</h3>
              <p className="governance-desc">
                Operating strictly under Part IXA of the Companies Act, LFPC is 100% owned and directed by farming producers. 
                Profits and value increments flow directly back to rural grower families.
              </p>
            </div>

            <div className="card-glass governance-card">
              <div className="governance-icon">
                <Scale size={26} color="#B46F00" />
              </div>
              <h3 className="governance-title">Transparent Farm-Gate Pricing</h3>
              <p className="governance-desc">
                Our Board of Directors sets transparent, equitable crop and dairy procurement benchmarks, eliminating exploitative 
                wholesalers and ensuring farmers receive guaranteed ethical compensation.
              </p>
            </div>

            <div className="card-glass governance-card">
              <div className="governance-icon">
                <CheckCircle2 size={26} color="#15733E" />
              </div>
              <h3 className="governance-title">Uncompromising Quality Auditing</h3>
              <p className="governance-desc">
                Every batch of Vedic Bilona cow ghee, wood-pressed oil, and vermicompost undergoes rigorous laboratory audits supervised 
                by our Head of Operations before direct doorstep delivery.
              </p>
            </div>
          </div>

          {/* Connect / Inquire CTA */}
          <div className="leaders-cta-banner">
            <div>
              <h3 className="leaders-cta-title">Connect with LFPC Management</h3>
              <p className="leaders-cta-sub">
                Are you a farmer looking to join LFPC or an enterprise interested in bulk organic farm procurement?
              </p>
            </div>
            <div className="leaders-cta-actions">
              <a
                href="https://wa.me/918295886832?text=Hello%20LFPC%20Directors!%20I%20would%20like%20to%20connect%20regarding%20Lamma%20Farmer%20Producer%20Co.%20Ltd."
                target="_blank"
                rel="noreferrer"
                className="btn btn-whatsapp btn-md"
              >
                <MessageCircle size={17} />
                <span>Message Directors on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
