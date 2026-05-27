const { execSync } = require('child_process');
const fs = require('fs');

const originalGrid = execSync('git show HEAD:src/components/ParkGrid.jsx').toString();

// Extract renderDetailedContent
const startIndex = originalGrid.indexOf('const renderDetailedContent = () => {');
const endMarker = 'return (\n          <div className="about-modal-overlay animate-fade-in"';
let endIndex = originalGrid.indexOf(endMarker);
if (endIndex === -1) {
  endIndex = originalGrid.indexOf('<div className="about-modal-overlay');
  endIndex = originalGrid.lastIndexOf('return', endIndex);
}

const renderDetailedContent = originalGrid.substring(startIndex, endIndex);

const pageCode = `import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { fallbackParks, getSlug } from '../utils/parksData';
import '../components/ParkGrid.css';

const AboutParkPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [park, setPark] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParks = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/parks');
        if (data && data.length > 0) {
          const found = data.find(p => getSlug(p.name) === slug);
          if (found) {
            setPark(found);
            setLoading(false);
            return;
          }
        }
      } catch (err) {}
      
      const fallback = fallbackParks.find(p => getSlug(p.name) === slug);
      setPark(fallback);
      setLoading(false);
    };
    fetchParks();
  }, [slug]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner"></div></div>;
  }

  if (!park) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Park not found.</div>;
  }

  const parkName = park.name?.toLowerCase() || '';
  const isWonderla = parkName.includes('wonderla');
  const isVGP = parkName.includes('vgp');
  const isMGM = parkName.includes('mgm');
  const isQueensLand = parkName.includes('queens');
  const isBlackThunder = parkName.includes('black thunder');
  const isDetailed = isWonderla || isVGP || isMGM || isQueensLand || isBlackThunder;

  // Re-enable this by injecting selectedAboutPark as park to make the old code work
  const selectedAboutPark = park;

${renderDetailedContent}

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '100px 24px 60px' }}>
      <button 
        onClick={() => window.history.length > 1 ? window.history.back() : navigate('/#parks')} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#00D1FF', cursor: 'pointer', marginBottom: '24px', fontSize: '14px', fontWeight: 'bold' }}
      >
        <ArrowLeft size={16} /> Back to Parks
      </button>

      <div className={"about-modal-content glass-morphism " + (isDetailed ? 'wonderla-modal-wide' : '')} style={{ position: 'relative', width: '100%', maxHeight: 'none', overflow: 'visible' }}>
        <div className="about-modal-header">
          <h2 className="text-white-shimmer-rtl">{park.name}</h2>
          <div className="park-location" style={{ marginTop: '5px' }}>
            <MapPin size={14} style={{ marginRight: '6px' }} />
            {park.location}
          </div>
        </div>

        <div className="about-modal-body" style={{ paddingBottom: '20px' }}>
          {isDetailed ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {renderDetailedContent()}
              </div>
              <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
                <button className="sticky-book-btn" style={{ width: '100%', position: 'static', boxShadow: '0 8px 32px rgba(199, 255, 0, 0.15)' }} onClick={() => navigate('/book/' + slug)}>
                  BOOK TICKETS →
                </button>
              </div>
            </>
          ) : (
            <>
              <section className="about-section">
                <h4 className="section-label">ABOUT</h4>
                <p className="about-text">{park.about || park.desc}</p>
              </section>
              <section className="about-features-section">
                <h4 className="section-label">RIDES & FEATURES</h4>
                <div className="features-badges">
                  {(park.features || []).map((feature, i) => (
                    <span key={i} className="feature-badge">{feature}</span>
                  ))}
                </div>
              </section>
              <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
                <button className="sticky-book-btn" style={{ width: '100%', position: 'static', boxShadow: '0 8px 32px rgba(199, 255, 0, 0.15)' }} onClick={() => navigate('/book/' + slug)}>
                  BOOK TICKETS →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutParkPage;
`;

fs.writeFileSync('src/pages/AboutParkPage.jsx', pageCode);
