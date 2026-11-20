import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getSocket } from '../lib/socket';

export default function AnnouncementBar() {
  const [banner, setBanner] = useState({
    title: '🌾 SachiKheti Festive Harvest Offer',
    message: 'Get 10% off on Pure Desi Ghee & Pinnis using code SACHI10! WhatsApp Direct Delivery available.',
  });
  const [visible, setVisible] = useState(true);

  const fetchBanner = () => {
    fetch('/api/banners')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          setBanner(data.data[0]);
          setVisible(Boolean(data.data[0].isActive !== false));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchBanner();

    const socket = getSocket();
    if (!socket) return;

    socket.on('banners:updated', fetchBanner);

    return () => {
      socket.off('banners:updated', fetchBanner);
    };
  }, []);

  if (!visible) return null;

  return (
    <aside className="announcement-bar" role="banner" aria-label="Festive Announcement">
      <div className="announcement-content">
        {/* Full text for Desktop & Tablet */}
        <span className="announcement-text-desktop">
          <strong>{banner.title}:</strong> {banner.message}
        </span>

        {/* Compact Single-line text for Mobile screens */}
        <span className="announcement-text-mobile">
          🌾 <strong>10% OFF:</strong> Use code <span className="announcement-code">SACHI10</span> • Pure Ghee & Sweets!
        </span>
      </div>

      <button
        onClick={() => setVisible(false)}
        className="announcement-close-btn"
        aria-label="Dismiss announcement banner"
      >
        <X size={13} />
      </button>
    </aside>
  );
}
