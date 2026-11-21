import React, { useState, useEffect } from 'react';
import { X, MessageCircle, CreditCard, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { io } from 'socket.io-client';

export default function CheckoutModal({ onClose }) {
  const { cartItems, subtotal, clearCart } = useCart();

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    address: '',
    city: 'Fatehabad',
    pincode: '',
    notes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('WHATSAPP');
  const [loading, setLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [gatewayConfig, setGatewayConfig] = useState({ enabled: false, keyId: '' });

  // Fetch dynamic Razorpay Gateway settings (Admin controlled)
  useEffect(() => {
    let isMounted = true;
    const fetchGatewayConfig = async () => {
      try {
        const res = await fetch('/api/settings/payment-gateway');
        const data = await res.json();
        if (data.success && isMounted) {
          const isEnabled = Boolean(data.data?.razorpayEnabled);
          setGatewayConfig({
            enabled: isEnabled,
            keyId: data.data?.razorpayKeyId || '',
          });
          if (!isEnabled) {
            setPaymentMethod('WHATSAPP');
          }
        }
      } catch (err) {
        console.warn('Could not load payment gateway config:', err);
      }
    };

    fetchGatewayConfig();

    // Listen to real-time gateway updates
    const socket = io();
    socket.on('settings:payment-gateway-updated', (updated) => {
      if (isMounted) {
        const isEnabled = Boolean(updated?.razorpayEnabled);
        setGatewayConfig({
          enabled: isEnabled,
          keyId: updated?.razorpayKeyId || '',
        });
        if (!isEnabled) {
          setPaymentMethod('WHATSAPP');
        }
      }
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleWhatsAppCheckout = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerPhone || !formData.address) {
      setErrorMsg('Please enter your Name, Phone Number, and Delivery Address.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      // 1. Post order to backend API
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: cartItems.map(item => ({
            productId: item.id,
            title: item.title,
            titlePunjabi: item.titlePunjabi,
            price: item.price,
            quantity: item.quantity,
            unit: item.unit,
          })),
          totalAmount: subtotal,
          paymentMethod: 'WHATSAPP',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to register order');
      }

      const orderNumber = data.data.orderNumber;

      // 2. Format detailed WhatsApp message
      const itemsList = cartItems
        .map((item, idx) => `${idx + 1}. *${item.title}* (${item.titlePunjabi}) x ${item.quantity} [₹${(item.price * item.quantity).toLocaleString('en-IN')}]`)
        .join('\n');

      const message = 
`🌾 *NEW SACHIKHETI FARM ORDER*
🆔 *Order Reference:* ${orderNumber}
👤 *Customer:* ${formData.customerName}
📞 *Phone:* ${formData.customerPhone}
📍 *Address:* ${formData.address}, ${formData.city} (PIN: ${formData.pincode || 'N/A'})

🛒 *Ordered Items:*
${itemsList}

💰 *Total Amount:* ₹${subtotal.toLocaleString('en-IN')}
📝 *Notes:* ${formData.notes || 'None'}

Please confirm my order and share estimated dispatch timing. Thanks!`;

      // Open WhatsApp
      window.open(`https://wa.me/918360253372?text=${encodeURIComponent(message)}`, '_blank');

      setCompletedOrder({ ...data.data, orderNumber });
      clearCart();
    } catch (err) {
      setErrorMsg(err.message || 'Error processing order');
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayCheckout = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerPhone || !formData.address) {
      setErrorMsg('Please enter your Name, Phone Number, and Delivery Address.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      // 1. Create order on server
      const res = await fetch('/api/payment/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: subtotal,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to initialize payment gateway');
      }

      const razorpayOrder = data.order || data.data?.razorpayOrder || data.data?.order;
      const keyId = data.key || gatewayConfig.keyId || data.data?.keyId;

      // Check Razorpay loaded
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const options = {
        key: keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'ਸੱਚੀ ਖੇਤੀ | SachiKheti (LFPC)',
        description: 'Certified Pure Produce & Farm Machinery',
        image: '/assets/brand/sachi-kheti-emblem.jpg',
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            // Verify payment on backend with HMAC SHA256
            const verifyRes = await fetch('/api/payment/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyData.success || !verifyData.verified) {
              throw new Error(verifyData.message || 'Payment signature verification failed.');
            }

            // Save order to DB with 100% verified payment
            const orderRes = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...formData,
                items: cartItems.map(item => ({
                  productId: item.id,
                  title: item.title,
                  titlePunjabi: item.titlePunjabi,
                  price: item.price,
                  quantity: item.quantity,
                  unit: item.unit,
                })),
                totalAmount: subtotal,
                paymentMethod: 'RAZORPAY',
                paymentStatus: 'PAID',
                orderStatus: 'CONFIRMED',
                razorpayId: response.razorpay_payment_id,
              }),
            });
            const orderData = await orderRes.json();
            if (orderData.success) {
              setCompletedOrder(orderData.data);
              clearCart();
            } else {
              throw new Error(orderData.message || 'Error recording order after payment');
            }
          } catch (err) {
            setErrorMsg(err.message || 'Payment succeeded but order logging failed. Contact support.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: formData.customerName,
          contact: formData.customerPhone,
        },
        theme: {
          color: '#15733E',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setErrorMsg(`Payment Failed: ${response.error?.description || response.error?.reason || 'Transaction could not be completed'}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to initiate Razorpay online checkout. Please try WhatsApp / Cash on Delivery.');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content checkout-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="modal-close-btn"
          aria-label="Close modal"
        >
          <X size={22} />
        </button>

        {completedOrder ? (
          /* Success Screen */
          <div className="checkout-success-view">
            <div className="checkout-success-icon-box">
              <CheckCircle2 size={40} color="#15733E" />
            </div>
            <h3 className="checkout-success-title">
              Order Placed Successfully!
            </h3>
            <p className="font-gurmukhi checkout-success-punjabi">
              ਧੰਨਵਾਦ! ਤੁਹਾਡਾ ਆਰਡਰ ਦਰਜ ਹੋ ਗਿਆ ਹੈ।
            </p>
            <div className="checkout-order-ref-card">
              <div style={{ fontSize: '0.85rem', color: '#7A8B80' }}>Your Order Tracking Reference:</div>
              <div className="checkout-order-ref-num">
                {completedOrder.orderNumber}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#4A5B50', marginTop: '6px' }}>
                Payment Method: <strong>{completedOrder.paymentMethod}</strong>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#4A5B50', marginBottom: '24px' }}>
              Our LFPC farm representative will connect with you shortly for packaging and delivery updates.
            </p>
            <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', maxWidth: '320px', margin: '0 auto' }}>
              Return to Farm Store
            </button>
          </div>
        ) : (
          /* Checkout Form */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-green">LFPC Direct Delivery</span>
            </div>
            <h2 className="checkout-header-title">
              Complete Your Order
            </h2>
            <p className="checkout-header-sub">
              Please provide your delivery details below to confirm dispatch.
            </p>

            {errorMsg && (
              <div className="checkout-error-banner">
                {errorMsg}
              </div>
            )}

            <form onSubmit={paymentMethod === 'WHATSAPP' ? handleWhatsAppCheckout : handleRazorpayCheckout}>
              <div className="checkout-grid-2col">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    name="customerName"
                    required
                    placeholder="e.g. Jaspreet Singh"
                    value={formData.customerName}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input
                    type="tel"
                    name="customerPhone"
                    required
                    placeholder="e.g. 9876543210"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Address *</label>
                <textarea
                  name="address"
                  required
                  rows={2}
                  placeholder="House/Plot no., Street, Village/Colony"
                  value={formData.address}
                  onChange={handleChange}
                  className="form-textarea"
                />
              </div>

              <div className="checkout-grid-2col city-pin">
                <div className="form-group">
                  <label className="form-label">City / District</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    placeholder="e.g. 125050"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Order Notes / Landmark (Optional)</label>
                <input
                  type="text"
                  name="notes"
                  placeholder="e.g. Deliver before 10 AM, near Gurdwara"
                  value={formData.notes}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              {/* Payment Method Selector */}
              <div style={{ marginTop: '20px', marginBottom: '24px' }}>
                <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
                  Select Checkout Method:
                </label>
                <div className="checkout-payment-methods">
                  {/* WhatsApp Option (Always Available / Cash on Delivery) */}
                  <div
                    onClick={() => setPaymentMethod('WHATSAPP')}
                    className={`checkout-method-card ${paymentMethod === 'WHATSAPP' ? 'active-whatsapp' : ''}`}
                    style={{ flex: gatewayConfig.enabled ? '1 1 200px' : '1 1 100%' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MessageCircle size={20} color="#1EBE5D" />
                      <strong style={{ fontSize: '0.95rem' }}>WhatsApp & Cash on Delivery</strong>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#4A5B50', lineHeight: 1.3 }}>
                      1-Click direct order to LFPC team. Pay via Cash on Delivery or UPI upon receipt.
                    </span>
                  </div>

                  {/* Razorpay Online (Strictly Controlled by Admin Mood / Toggle) */}
                  {gatewayConfig.enabled && (
                    <div
                      onClick={() => setPaymentMethod('RAZORPAY')}
                      className={`checkout-method-card ${paymentMethod === 'RAZORPAY' ? 'active-razorpay' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CreditCard size={20} color="#15733E" />
                        <strong style={{ fontSize: '0.95rem' }}>Prepaid Online (Razorpay)</strong>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#4A5B50', lineHeight: 1.3 }}>
                        Instant secure checkout via UPI, Google Pay, PhonePe, Cards & NetBanking.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary & Submit Button */}
              <div className="checkout-footer-box">
                <div className="checkout-price-row">
                  <span style={{ fontSize: '0.95rem', color: '#4A5B50' }}>Total Amount:</span>
                  <span className="checkout-total-val">
                    ₹ {subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`btn ${paymentMethod === 'WHATSAPP' ? 'btn-whatsapp' : 'btn-gold'} checkout-submit-btn`}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="spin" />
                      <span>Processing...</span>
                    </>
                  ) : paymentMethod === 'WHATSAPP' ? (
                    <>
                      <MessageCircle size={18} />
                      <span>Send Order to WhatsApp (₹ {subtotal.toLocaleString('en-IN')})</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      <span>Pay Securely (₹ {subtotal.toLocaleString('en-IN')})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
