const fs = require('fs');

let c = fs.readFileSync('src/pages/BookingPage.jsx', 'utf8');

// Insert CSS import
if (!c.includes("import './BookingPage.css'")) {
  c = c.replace("import '../components/BookingModal.css';", "import '../components/BookingModal.css';\nimport './BookingPage.css';");
}

// Find the return block start
const returnStartStr = `  return (
    <div style={{ minHeight: '100vh', paddingTop: '100px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 32px' }}>
        
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
  

        {/* Progress: 5 steps */}
        {step < 5 && (
          <div className="booking-progress">`;

const newStartStr = `  return (
    <div className="booking-page-wrapper">
      <div className="booking-summary-bar">
        <div className="booking-summary-left">
          <button 
            onClick={onClose} 
            style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '8px 12px 8px 0', marginRight: '8px' }}
          >
            <ArrowLeft size={18} />
          </button>
          <img src={selectedPark.image} alt={selectedPark.name} className="booking-summary-img" />
          <div>
            <p className="booking-summary-name">{selectedPark.name}</p>
            <p className="booking-summary-loc">{isWonderla && formData.wonderlaLocation ? WONDERLA_LOCATIONS.find(l => l.value === formData.wonderlaLocation)?.label + ' — ' + WONDERLA_LOCATIONS.find(l => l.value === formData.wonderlaLocation)?.desc : selectedPark.location}</p>
          </div>
        </div>
        <div className="booking-summary-price">
          Tickets from ₹{isWonderla ? WONDERLA_PRICES.normal.adult : (selectedPark.adultPrice || parseInt(selectedPark.price))}
        </div>
      </div>

      <div className="booking-form-container">
  

        {/* Progress: 5 steps */}
        {step < 5 && (
          <div className="booking-progress booking-step-indicator">`;

c = c.replace(returnStartStr, newStartStr);

fs.writeFileSync('src/pages/BookingPage.jsx', c);
console.log('BookingPage.jsx updated');
