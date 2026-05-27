const fs = require('fs');

let content = fs.readFileSync('src/pages/AboutParkPage.jsx', 'utf8');

// Insert import for CSS
if (!content.includes('import "./AboutParkPage.css"')) {
  content = content.replace("import '../components/ParkGrid.css';", "import '../components/ParkGrid.css';\nimport './AboutParkPage.css';");
}

// Extract everything up to the return statement
const returnIndex = content.lastIndexOf('return (');
const topPart = content.slice(0, returnIndex);

// Add the counter state inside the component before the return
let stateHooks = `
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [seniors, setSeniors] = useState(0);
  const [students, setStudents] = useState(0);

  const price = park.adultPrice || parseInt(park.price) || 1489;
  const childPrice = park.kidsPrice || parseInt(park.price * 0.75) || 1191;
  const total = (adults * price) + (children * childPrice) + (seniors * 946) + (students * price * 0.8);

`;

// Assemble the new return statement
const newReturn = `
  return (
    <div className="about-page-wrapper">
      <div className="about-banner">
        <div className="about-banner-inner">
          <button 
            onClick={() => window.history.length > 1 ? window.history.back() : navigate('/#parks')} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', marginBottom: '16px', fontSize: '13px', fontWeight: 'bold' }}
          >
            <ArrowLeft size={14} /> Back to Parks
          </button>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="about-park-name">{park.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', color: '#00D1FF', marginTop: '12px', fontSize: '14px', fontWeight: 600 }}>
                <MapPin size={16} style={{ marginRight: '6px' }} />
                {park.location}
              </div>
            </div>
            {park.rating && (
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', color: '#FCD34D', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ⭐ {park.rating}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="about-content-area">
        <div className="about-left-col">
          {renderDetailedContent()}
        </div>

        <div className="about-right-col">
          <div className="sticky-booking-card">
            <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, letterSpacing: '1px', margin: '0 0 4px' }}>TICKETS FROM</p>
            <h3 style={{ fontSize: '28px', fontWeight: 900, color: '#C7FF00', margin: '0 0 24px' }}>₹{price} <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 600 }}>/ adult</span></h3>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}>Visit Date</p>
              <input type="date" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} min={new Date().toISOString().split('T')[0]} defaultValue={new Date().toISOString().split('T')[0]} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#E2E8F0', fontWeight: 600 }}>Adults</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '4px 8px' }}>
                  <button onClick={() => setAdults(Math.max(1, adults - 1))} style={{ background: 'none', border: 'none', color: '#C7FF00', fontWeight: 'bold', cursor: 'pointer' }}>−</button>
                  <span style={{ color: '#fff', width: '20px', textAlign: 'center', fontWeight: 'bold' }}>{adults}</span>
                  <button onClick={() => setAdults(adults + 1)} style={{ background: 'none', border: 'none', color: '#C7FF00', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#E2E8F0', fontWeight: 600 }}>Children</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '4px 8px' }}>
                  <button onClick={() => setChildren(Math.max(0, children - 1))} style={{ background: 'none', border: 'none', color: '#C7FF00', fontWeight: 'bold', cursor: 'pointer' }}>−</button>
                  <span style={{ color: '#fff', width: '20px', textAlign: 'center', fontWeight: 'bold' }}>{children}</span>
                  <button onClick={() => setChildren(children + 1)} style={{ background: 'none', border: 'none', color: '#C7FF00', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#E2E8F0', fontWeight: 600 }}>Sr. Citizen</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '4px 8px' }}>
                  <button onClick={() => setSeniors(Math.max(0, seniors - 1))} style={{ background: 'none', border: 'none', color: '#C7FF00', fontWeight: 'bold', cursor: 'pointer' }}>−</button>
                  <span style={{ color: '#fff', width: '20px', textAlign: 'center', fontWeight: 'bold' }}>{seniors}</span>
                  <button onClick={() => setSeniors(seniors + 1)} style={{ background: 'none', border: 'none', color: '#C7FF00', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#E2E8F0', fontWeight: 600 }}>Students</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '4px 8px' }}>
                  <button onClick={() => setStudents(Math.max(0, students - 1))} style={{ background: 'none', border: 'none', color: '#C7FF00', fontWeight: 'bold', cursor: 'pointer' }}>−</button>
                  <span style={{ color: '#fff', width: '20px', textAlign: 'center', fontWeight: 'bold' }}>{students}</span>
                  <button onClick={() => setStudents(students + 1)} style={{ background: 'none', border: 'none', color: '#C7FF00', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #333', paddingTop: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', color: '#fff', fontWeight: 'bold' }}>Total:</span>
              <span style={{ fontSize: '20px', color: '#C7FF00', fontWeight: 900 }}>₹{total.toLocaleString()}</span>
            </div>

            <button 
              onClick={() => navigate('/book/' + slug)}
              style={{ width: '100%', height: '48px', background: '#6BCB77', color: '#000', fontWeight: 800, fontSize: '15px', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '16px' }}
            >
              BOOK NOW →
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#888', fontWeight: 600 }}>✅ WhatsApp ticket delivery</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#888', fontWeight: 600 }}>✅ Verified booking</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#888', fontWeight: 600 }}>✅ 2–4 hr delivery</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Bottom Bar */}
      <div className="mobile-bottom-bar">
        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>From <span style={{ color: '#C7FF00' }}>₹{price}</span></span>
        <button 
          onClick={() => navigate('/book/' + slug)}
          style={{ background: '#6BCB77', color: '#000', fontWeight: 800, fontSize: '14px', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}
        >
          BOOK NOW →
        </button>
      </div>
    </div>
  );
};

export default AboutParkPage;
`;

const finalCode = topPart + stateHooks + newReturn;
fs.writeFileSync('src/pages/AboutParkPage.jsx', finalCode);
console.log('AboutParkPage.jsx updated');
