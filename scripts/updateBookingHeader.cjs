const fs = require('fs');

let content = fs.readFileSync('src/pages/BookingPage.jsx', 'utf8');

// Replace the close button with the Back button and Park Header
content = content.replace(
  '<button className="close-btn" onClick={onClose} aria-label="Close"><X size={24} /></button>',
  `
      <button 
        onClick={onClose} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#00D1FF', cursor: 'pointer', marginBottom: '24px', fontSize: '14px', fontWeight: 'bold' }}
      >
        <ArrowLeft size={16} /> Back to Parks
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <img src={selectedPark.image} alt={selectedPark.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
        <div>
          <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 900, color: '#fff', letterSpacing: '1px' }}>{selectedPark.name}</h2>
          <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#94A3B8' }}>{selectedPark.location}</p>
        </div>
      </div>
  `
);

// add ArrowLeft import if missing
if (!content.includes('ArrowLeft')) {
  content = content.replace("import { X, User,", "import { X, ArrowLeft, User,");
}

fs.writeFileSync('src/pages/BookingPage.jsx', content);
