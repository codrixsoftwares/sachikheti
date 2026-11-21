import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, MessageCircle, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { getSocket } from '../lib/socket';

export default function Footer({ onNavigate, onSelectCategory }) {
  const [contact, setContact] = useState({
    phone: '8360253372',
    displayPhone: '+91 8360253372',
    whatsappNumber: '8360253372',
    email: 'codeverse114@gmail.com',
    address: '1st Floor, Aggerwal Colony, Fatehabad, Haryana, India - 125050',
    facebookUrl: 'https://www.facebook.com/share/1XymBg6n78/?mibextid=wwXIfr',
    instagramUrl: 'https://www.instagram.com/sachi_kheti?evlk=MWJuaXc1MGk4NGo3aw%3D%3D&utm_source=qr',
  });

  useEffect(() => {
    fetch('/api/settings/contact')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setContact((prev) => ({ ...prev, ...data.data }));
        }
      })
      .catch(() => {});

    const socket = getSocket();
    if (socket) {
      const handleContactUpdate = (updated) => {
        if (updated) {
          setContact((prev) => ({ ...prev, ...updated }));
        }
      };
      socket.on('settings:contact-updated', handleContactUpdate);
      return () => {
        socket.off('settings:contact-updated', handleContactUpdate);
      };
    }
  }, []);

  const handleNav = (e, path) => {
    e.preventDefault();
    if (onNavigate) onNavigate(path);
  };

  const handleCategory = (e, slug) => {
    e.preventDefault();
    if (onSelectCategory) onSelectCategory(slug);
  };

  return (
    <footer className="footer-section">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-col">
            <div className="footer-brand-header">
              <img
                src="/assets/brand/sachi-kheti-emblem.jpg"
                alt="SachiKheti"
                className="footer-brand-logo"
              />
              <div>
                <div className="font-gurmukhi footer-brand-name">
                  ਸੱਚੀ ਖੇਤੀ
                </div>
                <div className="footer-brand-sub">
                  by LFPC (Lamma Farmer Producer Co. Ltd.)
                </div>
              </div>
            </div>

            <p className="font-gurmukhi footer-slogan">
              "ਚੰਗੀ ਸੋਚ ਸਖ਼ਤ ਮਿਹਨਤ, ਫਿਰ ਹੁੰਦੀ ਰੱਬ ਦੀ ਰਹਿਮਤ"
            </p>

            <p className="footer-desc">
              An authentic agricultural producer cooperative initiative empowering 400+ farming families to deliver
              chemical-free Vedic Bilona cow ghee, wood-pressed oils, organic vermicompost, and certified farming tools.
            </p>

            <div style={{ marginTop: '14px' }}>
              <a
                href={`https://wa.me/91${contact.whatsappNumber || contact.phone || '8360253372'}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-whatsapp btn-sm footer-whatsapp-btn"
                style={{ width: 'fit-content' }}
              >
                <MessageCircle size={15} />
                <span>Connect on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Catalog Categories */}
          <div className="footer-col">
            <h4 className="footer-col-title">
              Farm Marketplace
            </h4>
            <ul className="footer-links-list">
              <li>
                <a
                  href="/products"
                  onClick={(e) => handleNav(e, '/products')}
                  className="footer-link"
                  style={{ fontWeight: 700, color: '#FBBF24' }}
                >
                  🌾 All Farm Products
                </a>
              </li>
              <li>
                <a href="/products?category=dairy" onClick={(e) => handleCategory(e, 'dairy')} className="footer-link">
                  🥛 Pure Cow Ghee & A2 Dairy
                </a>
              </li>
              <li>
                <a href="/products?category=produce" onClick={(e) => handleCategory(e, 'produce')} className="footer-link">
                  🌻 Cold-Pressed Oils & Forest Honey
                </a>
              </li>
              <li>
                <a href="/products?category=manure" onClick={(e) => handleCategory(e, 'manure')} className="footer-link">
                  🌱 Organic Vermicompost & Fertilizers
                </a>
              </li>
              <li>
                <a href="/products?category=machinery" onClick={(e) => handleCategory(e, 'machinery')} className="footer-link">
                  🚜 Tractor Implements & Machinery
                </a>
              </li>
              <li>
                <a href="/products?category=sweets" onClick={(e) => handleCategory(e, 'sweets')} className="footer-link">
                  🍯 Desi Ghee Atta Pinnis & Sweets
                </a>
              </li>
            </ul>
          </div>

          {/* Explore & Company */}
          <div className="footer-col">
            <h4 className="footer-col-title">
              Explore & Leadership
            </h4>
            <ul className="footer-links-list">
              <li>
                <a
                  href="/story"
                  onClick={(e) => handleNav(e, '/story')}
                  className="footer-link"
                >
                  📖 Our Heritage & Story
                </a>
              </li>
              <li>
                <a
                  href="/leaders"
                  onClick={(e) => handleNav(e, '/leaders')}
                  className="footer-link"
                >
                  👥 Board of Directors & Leadership
                </a>
              </li>
              <li>
                <a
                  href="/blogs"
                  onClick={(e) => handleNav(e, '/blogs')}
                  className="footer-link"
                >
                  📝 Farming & Vedic Health Blogs
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => handleNav(e, '/contact')}
                  className="footer-link"
                >
                  📞 Contact Us & Producer Office
                </a>
              </li>
              <li>
                <a
                  href="/adminlog"
                  onClick={(e) => handleNav(e, '/adminlog')}
                  className="footer-link"
                  style={{ opacity: 0.6 }}
                >
                  🔒 Admin Portal
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="footer-col">
            <h4 className="footer-col-title">
              Farmer Producer Office
            </h4>
            <div className="footer-contact-list">
              <div className="footer-contact-item">
                <MapPin size={18} color="#FBBF24" className="footer-contact-icon" />
                <span>{contact.address || '1st Floor, Aggerwal Colony, Fatehabad, Haryana, India - 125050'}</span>
              </div>
              <div className="footer-contact-item">
                <Phone size={18} color="#FBBF24" className="footer-contact-icon" />
                <a href={`tel:+91${contact.phone || '8360253372'}`} className="footer-link-active">
                  +91-{contact.phone || '8360253372'}
                </a>
              </div>
              <div className="footer-contact-item">
                <Mail size={18} color="#FBBF24" className="footer-contact-icon" />
                <a href={`mailto:${contact.email || 'codeverse114@gmail.com'}`} className="footer-link-active">
                  {contact.email || 'codeverse114@gmail.com'}
                </a>
              </div>
            </div>

            {/* Official Social Media Channels in Farmer Producer Office */}
            <div style={{ marginTop: '22px' }}>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: '#FDE68A',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '10px',
                }}
              >
                OFFICIAL SOCIAL CHANNELS:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Real Instagram Logo & Link */}
                <a
                  href={contact.instagramUrl || 'https://www.instagram.com/sachi_kheti?evlk=MWJuaXc1MGk4NGo3aw%3D%3D&utm_source=qr'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-btn"
                  title="Follow SachiKheti on Instagram"
                  aria-label="Instagram"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    boxShadow: '0 4px 14px rgba(220, 39, 67, 0.45)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 18px rgba(220, 39, 67, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(220, 39, 67, 0.45)';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                    <path
                      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                      fill="#FFFFFF"
                    />
                  </svg>
                  <span>Instagram</span>
                </a>

                {/* Real Facebook Logo & Link */}
                <a
                  href={contact.facebookUrl || 'https://www.facebook.com/share/1XymBg6n78/?mibextid=wwXIfr'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-btn"
                  title="Follow SachiKheti on Facebook"
                  aria-label="Facebook"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #1877F2 0%, #0D65D9 100%)',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    boxShadow: '0 4px 14px rgba(24, 119, 242, 0.45)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 18px rgba(24, 119, 242, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(24, 119, 242, 0.45)';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                    <path
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                      fill="#FFFFFF"
                    />
                  </svg>
                  <span>Facebook</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div>
            © {new Date().getFullYear()} SachiKheti (LFPC Ltd.). All rights reserved.
          </div>
          <div className="footer-bottom-links">
            <span style={{ color: '#FBBF24' }}>100% Direct Farmer Produce</span>
            <span>•</span>
            <span>MCA Registered Producer Co.</span>
            <span>•</span>
            <span>FSSAI Certified Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
