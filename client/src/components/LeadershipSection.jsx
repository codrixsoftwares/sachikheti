import React from 'react';
import { ArrowRight } from 'lucide-react';

export const DIRECTORS = [
  {
    id: 1,
    name: 'PARAMJIT SINGH',
    titleCase: 'Paramjit Singh',
    designation: 'MANAGING DIRECTOR',
    displayRole: 'Managing Director',
    image: '/assets/directors/paramjit-singh.jpg',
    badge: 'Executive Leadership',
    description: 'Spearheading farmer producer governance, strategic operations, and visionary leadership for LFPC.',
  },
  {
    id: 2,
    name: 'VIRPAL KAUR',
    titleCase: 'Virpal Kaur',
    designation: 'HEAD OF OPERATIONS',
    displayRole: 'Head of Operations',
    image: '/assets/directors/virpal-kaur.jpg',
    badge: 'Operations & Quality',
    description: 'Directing authentic Vedic Bilona processing, cold-press oil extraction, and strict batch hygiene standards.',
  },
  {
    id: 3,
    name: 'MALKIT SINGH',
    titleCase: 'Malkit Singh',
    designation: 'PROCUREMENT HEAD',
    displayRole: 'Procurement Head',
    image: '/assets/directors/malkit-singh.jpg',
    badge: 'Farm-Gate Sourcing',
    description: 'Leading grassroots farm-gate procurement, fair farmer compensations, and pure organic crop aggregation.',
  },
  {
    id: 4,
    name: 'HARINDER SINGH DHILLON',
    titleCase: 'Harinder Singh Dhillon',
    designation: 'HEAD OF MARKETING & SALES',
    displayRole: 'Head of Marketing & Sales',
    image: '/assets/directors/harinder-singh-dhillon.jpg',
    badge: 'Marketing & Reach',
    description: 'Expanding direct farm-to-consumer reach, modern digital channels, and transparent marketplace trust.',
  },
  {
    id: 5,
    name: 'KAMALJEET KAUR DHILLON',
    titleCase: 'Kamaljeet Kaur Dhillon',
    designation: 'DIRECTOR',
    displayRole: 'Director',
    image: '/assets/directors/kamaljeet-kaur-dhillon.jpg',
    badge: 'Board Director',
    description: 'Championing rural women farmer entrepreneurship, sustainable farming practices, and community welfare.',
  },
];

export default function LeadershipSection({
  showHeader = true,
  className = '',
  limit = null,
  onNavigateLeaders,
}) {
  const displayedDirectors = limit ? DIRECTORS.slice(0, limit) : DIRECTORS;
  const isLimited = limit && limit < DIRECTORS.length;

  const renderDirectorCard = (director) => (
    <div key={director.id} className="director-card">
      <img
        src={director.image}
        alt={`${director.titleCase} - ${director.displayRole}`}
        className="director-bg-img"
        loading="lazy"
      />
      <div className="director-card-overlay" />
      <div className="director-card-body">
        <span className="director-designation">{director.designation}</span>
        <h3 className="director-name">{director.titleCase}</h3>
        <div className="director-company">Lamma Farmer Producer Co. Ltd.</div>
        <p className="director-desc">{director.description}</p>
      </div>
    </div>
  );

  return (
    <section id="leadership" className={`leadership-section ${className}`}>
      <div className="container">
        {showHeader && (
          <div className="leadership-header">
            <h2 className="leadership-h2">
              {isLimited ? 'Company Executive Leadership' : 'Board of Directors & Management'}
            </h2>
            <p className="leadership-subtitle">
              Officially incorporated under <strong>Lamma Farmer Producer Company Limited (LFPC)</strong>.
              Guided by dedicated agricultural producers ensuring 100% farm-gate honesty and purity.
            </p>
          </div>
        )}

        {limit === 2 ? (
          <div className="directors-grid directors-2col">
            {displayedDirectors.map(renderDirectorCard)}
          </div>
        ) : (
          <div className="directors-tiered-wrapper">
            <div className="directors-row directors-row-top">
              {displayedDirectors.slice(0, 3).map(renderDirectorCard)}
            </div>
            <div className="directors-row directors-row-bottom">
              {displayedDirectors.slice(3, 5).map(renderDirectorCard)}
            </div>
          </div>
        )}

        {isLimited && (
          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <button
              onClick={() => {
                if (onNavigateLeaders) onNavigateLeaders();
                else window.location.href = '/leaders';
              }}
              className="btn btn-secondary btn-md"
            >
              <span>View All 5 Board Directors & Governance</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
