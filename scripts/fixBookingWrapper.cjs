const fs = require('fs');
let c = fs.readFileSync('src/pages/BookingPage.jsx', 'utf8');

// Fix the outer container - remove modal classes and add proper page spacing
const oldWrapper = `<div className="booking-modal-flow glass-morphism solid-dark-bg" style={{ maxWidth: "680px", margin: "0 auto", padding: "100px 24px 60px", position: "relative", background: "transparent", boxShadow: "none" }}>`;
const newWrapper = `<div style={{ minHeight: "100vh", paddingTop: "100px", paddingBottom: "80px" }}><div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 32px" }}>`;

c = c.replace(oldWrapper, newWrapper);

// Fix the closing - add one more closing div
const oldClose = `      </div>\n    \n  );`;
const newClose = `      </div>\n    </div>\n  );`;
c = c.replace(oldClose, newClose);

fs.writeFileSync('src/pages/BookingPage.jsx', c);
console.log('Done. Contains new wrapper:', c.includes('paddingTop: "100px"'));
