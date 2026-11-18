import React from 'react';
import { Phone, Mail, MapPin, MessageCircle, ArrowRight, ShieldCheck, Heart } from 'lucide-react';

export default function Footer({ onNavigate, onSelectCategory }) {
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

            <a
              href="https://wa.me/918295886832"
              target="_blank"
              rel="noreferrer"
              className="btn btn-whatsapp btn-sm footer-whatsapp-btn"
            >
              <MessageCircle size={15} />
              <span>Connect on WhatsApp</span>
            </a>
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
                <span>1st Floor, Aggerwal Colony, Fatehabad, Haryana, India - 125050</span>
              </div>
              <div className="footer-contact-item">
                <Phone size={18} color="#FBBF24" className="footer-contact-icon" />
                <a href="tel:+918295886832" className="footer-link-active">+91-8295886832</a>
              </div>
              <div className="footer-contact-item">
                <Mail size={18} color="#FBBF24" className="footer-contact-icon" />
                <a href="mailto:codeverse114@gmail.com" className="footer-link-active">codeverse114@gmail.com</a>
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
