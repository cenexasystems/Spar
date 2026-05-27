const fs = require('fs');

let c = fs.readFileSync('src/pages/AboutParkPage.jsx', 'utf8');

const returnStart = c.indexOf('  return (\n    <div className="about-page-wrapper">');
if (returnStart === -1) {
  console.log("Could not find return statement");
  process.exit(1);
}

const oldReturn = c.slice(returnStart);

const newReturn = `  return (
    <div className="about-page-wrapper">
      <div className="about-banner">
        <div className="about-banner-inner">
          <button 
            onClick={() => window.history.length > 1 ? window.history.back() : navigate('/#parks')} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', marginBottom: '16px', fontSize: '13px', fontWeight: 'bold' }}
          >
            <ArrowLeft size={14} /> Back to Parks
          </button>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 className="about-park-name">{park.name}</h1>
            {park.rating && (
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', color: '#FCD34D', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ⭐ {park.rating}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', color: '#00D1FF', marginTop: '4px', fontSize: '14px', fontWeight: 600 }}>
            <MapPin size={16} style={{ marginRight: '6px' }} />
            {park.location}
          </div>
        </div>
      </div>

      <div className="about-content-area">
        <div className="about-left-col">
          {renderDetailedContent()}
        </div>

        <div className="about-right-col">
          <div className="sticky-booking-card">
            <p style={{ fontSize: '11px', color: '#888', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 4px' }}>TICKETS FROM</p>
            <div style={{ margin: '0 0 4px' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#CCFF00' }}>₹{price}</span>
              <span style={{ fontSize: '12px', color: '#888', verticalAlign: 'middle', marginLeft: '6px' }}>/ADULT</span>
            </div>

            <div style={{ marginTop: '20px', marginBottom: '8px' }}>
              <p style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#888', textTransform: 'uppercase' }}>Visit Date</p>
              <input type="date" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} min={new Date().toISOString().split('T')[0]} defaultValue={new Date().toISOString().split('T')[0]} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '16px' }}>
              {[
                { label: 'Adults', val: adults, setter: setAdults, min: 1 },
                { label: 'Children', val: children, setter: setChildren, min: 0 },
                { label: 'Sr. Citizen', val: seniors, setter: setSeniors, min: 0 },
                { label: 'Students', val: students, setter: setStudents, min: 0 }
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #1a1a2a' }}>
                  <span style={{ fontSize: '13px', color: '#ccc' }}>{row.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => row.setter(Math.max(row.min, row.val - 1))} style={{ width: '28px', height: '28px', background: '#1a1a2a', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', minWidth: '16px', textAlign: 'center' }}>{row.val}</span>
                    <button onClick={() => row.setter(row.val + 1)} style={{ width: '28px', height: '28px', background: '#1a1a2a', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', color: '#fff', fontWeight: 700 }}>Total:</span>
              <span style={{ fontSize: '16px', color: '#CCFF00', fontWeight: 700 }}>₹{total.toLocaleString()}</span>
            </div>

            <button 
              onClick={() => navigate('/book/' + slug)}
              style={{ marginTop: '16px', width: '100%', height: '48px', background: '#CCFF00', color: '#0a0a14', fontWeight: 800, fontSize: '14px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
            >
              BOOK NOW →
            </button>

            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', color: '#666' }}>✅ WhatsApp ticket delivery</div>
              <div style={{ fontSize: '11px', color: '#666' }}>✅ Verified booking</div>
              <div style={{ fontSize: '11px', color: '#666' }}>✅ 2–4 hr delivery</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Bottom Bar */}
      <div className="mobile-bottom-bar">
        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>From <span style={{ color: '#CCFF00' }}>₹{price}</span></span>
        <button 
          onClick={() => navigate('/book/' + slug)}
          style={{ background: '#CCFF00', color: '#0a0a14', fontWeight: 800, fontSize: '14px', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}
        >
          BOOK NOW →
        </button>
      </div>
    </div>
  );
};

export default AboutParkPage;
`;

c = c.replace(oldReturn, newReturn);
fs.writeFileSync('src/pages/AboutParkPage.jsx', c);
console.log('AboutParkPage.jsx modified successfully.');
