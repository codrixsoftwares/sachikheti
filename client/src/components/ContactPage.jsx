import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, MessageCircle, Send, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = encodeURIComponent(
      `Hello SachiKheti (LFPC) Team!\n\n*Direct Inquiry Form Submission:*\n- *Name:* ${formData.name}\n- *Phone:* ${formData.phone}\n- *Email:* ${formData.email || 'N/A'}\n- *Subject:* ${formData.subject}\n- *Message:* ${formData.message}`
    );
    window.open(`https://wa.me/918360253372?text=${msg}`, '_blank');
    setSubmitted(true);
  };

  return (
    <div className="contact-page-wrapper">
      {/* Hero Header */}
      <section className="contact-hero-section">
        <div className="container">
          <div className="contact-hero-content">
            <h1 className="contact-page-h1">
              Contact SachiKheti (LFPC Ltd.)
            </h1>
            <p className="contact-page-sub">
              Have questions about our pure Vedic Bilona cow ghee, bulk vermicompost orders, tractor machinery, or farmer partnership? 
              Our cooperative team is here to assist you directly.
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid: Info Cards + Interactive Form */}
      <section className="contact-content-section">
        <div className="container">
          <div className="contact-grid">
            {/* Left: Contact Info Cards */}
            <div className="contact-info-col">
              <div className="card-glass contact-info-card">
                <div className="contact-info-header">
                  <div className="contact-icon-bubble green">
                    <MapPin size={22} color="#15733E" />
                  </div>
                  <div>
                    <h3 className="contact-card-title">Registered Office & Depot</h3>
                    <p className="contact-card-sub">Lamma Farmer Producer Company Limited</p>
                  </div>
                </div>
                <p className="contact-card-body">
                  1st Floor, Aggerwal Colony, Fatehabad, Haryana, India — 125050
                </p>
                <div className="contact-badge-seal">
                  <ShieldCheck size={14} color="#15733E" />
                  <span>MCA Registered FPC (Govt. of India)</span>
                </div>
              </div>

              <div className="card-glass contact-info-card">
                <div className="contact-info-header">
                  <div className="contact-icon-bubble gold">
                    <Phone size={22} color="#B46F00" />
                  </div>
                  <div>
                    <h3 className="contact-card-title">Direct Farmer Helpline</h3>
                    <p className="contact-card-sub">Fast response via call or WhatsApp</p>
                  </div>
                </div>
                <p className="contact-card-body">
                  <a href="tel:+918360253372" className="contact-link">+91-8360253372</a>
                </p>
                <a
                  href="https://wa.me/918360253372?text=Hello%20SachiKheti!%20I%20have%20an%20inquiry%20regarding%20your%20products."
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-whatsapp btn-sm contact-whatsapp-btn"
                >
                  <MessageCircle size={15} />
                  <span>Chat on WhatsApp Hotline</span>
                </a>
              </div>

              <div className="card-glass contact-info-card">
                <div className="contact-info-header">
                  <div className="contact-icon-bubble green">
                    <Mail size={22} color="#15733E" />
                  </div>
                  <div>
                    <h3 className="contact-card-title">Official Email</h3>
                    <p className="contact-card-sub">For partnership & bulk orders</p>
                  </div>
                </div>
                <p className="contact-card-body">
                  <a href="mailto:codeverse114@gmail.com" className="contact-link">codeverse114@gmail.com</a>
                </p>
              </div>

              <div className="card-glass contact-info-card">
                <div className="contact-info-header">
                  <div className="contact-icon-bubble gold">
                    <Clock size={22} color="#B46F00" />
                  </div>
                  <div>
                    <h3 className="contact-card-title">Operating Hours</h3>
                    <p className="contact-card-sub">Farm dispatch and customer service</p>
                  </div>
                </div>
                <p className="contact-card-body">
                  Monday to Saturday: 8:00 AM – 7:30 PM (IST)<br />
                  Sunday: 9:00 AM – 2:00 PM (IST)
                </p>
              </div>
            </div>

            {/* Right: Message / Inquiry Form */}
            <div className="contact-form-col">
              <div className="card-glass contact-form-card">
                <h2 className="contact-form-title">Send a Direct Message</h2>
                <p className="contact-form-desc">
                  Fill out this quick form to connect directly with LFPC administration. 
                  Submitting will also open an instant WhatsApp chat with our team.
                </p>

                {submitted ? (
                  <div className="contact-success-state">
                    <div className="contact-success-icon">
                      <CheckCircle2 size={42} color="#15733E" />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', color: '#0A3E22', marginBottom: '8px' }}>
                      Message Prepared Successfully!
                    </h3>
                    <p style={{ color: '#4A5D50', fontSize: '0.9rem', marginBottom: '20px' }}>
                      Your message has been formatted. If your WhatsApp did not open automatically, tap the button below.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      Send Another Inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="contact-form">
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Gurpreet Singh"
                        className="form-input"
                      />
                    </div>

                    <div className="form-row-2col">
                      <div className="form-group">
                        <label className="form-label">Phone / WhatsApp Number *</label>
                        <input
                          type="tel"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="e.g. 9876543210"
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Email Address (Optional)</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="e.g. customer@gmail.com"
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Subject / Interest *</label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="form-input"
                      >
                        <option value="General Inquiry">General Product Inquiry</option>
                        <option value="Bilona Cow Ghee Order">Pure Vedic Bilona Cow Ghee Order</option>
                        <option value="Organic Manure / Bulk Vermicompost">Organic Manure & Bio-Fertilizer Bulk Order</option>
                        <option value="Machinery & Tractor Attachments">Farming Machinery / Tractor Tools</option>
                        <option value="Farmer Partnership (Join LFPC)">Farmer Producer Partnership (Join LFPC)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Your Message or Requirements *</label>
                      <textarea
                        name="message"
                        required
                        rows="4"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us about your order quantity, delivery address, or questions..."
                        className="form-input"
                        style={{ resize: 'vertical' }}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg contact-submit-btn">
                      <Send size={18} />
                      <span>Send Message & Connect on WhatsApp</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
