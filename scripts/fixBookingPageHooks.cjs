const fs = require('fs');

let content = fs.readFileSync('src/pages/BookingPage.jsx', 'utf8');

// Fix CSS path
content = content.replace("import './BookingModal.css';", "import '../components/BookingModal.css';");

// Remove early returns from the top
const earlyReturn1 = `  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner"></div></div>;`;
const earlyReturn2 = `  if (!selectedPark) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Park not found.</div>;`;

content = content.replace(earlyReturn1 + '\n', '');
content = content.replace(earlyReturn2 + '\n', '');

// Replace the lower early return with all three
const newReturns = `${earlyReturn1}
${earlyReturn2}
  if (!isOpen) return null;`;

content = content.replace("  if (!isOpen || !selectedPark) return null;", newReturns);

fs.writeFileSync('src/pages/BookingPage.jsx', content);
