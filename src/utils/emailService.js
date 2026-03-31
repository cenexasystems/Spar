import emailjs from '@emailjs/browser';

// ============================================================
// EmailJS Configuration
// ============================================================
// To enable real email sending, set up these environment variables
// in a .env file at the project root:
//
//   VITE_EMAILJS_SERVICE_ID=your_service_id
//   VITE_EMAILJS_TEMPLATE_ID=your_template_id
//   VITE_EMAILJS_PUBLIC_KEY=your_public_key
//
// Setup steps:
// 1. Go to https://www.emailjs.com/ and create a free account
// 2. Add an Email Service (Gmail recommended) → copy Service ID
// 3. Create an Email Template with these variables:
//      {{to_name}}, {{to_email}}, {{park_name}}, {{park_location}},
//      {{num_tickets}}, {{total_amount}}, {{payment_method}},
//      {{booking_date}}, {{booking_id}}
// 4. Copy the Template ID and your Public Key from Account settings
// ============================================================

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

/**
 * Send a ticket confirmation email via EmailJS
 * @param {Object} bookingData - The booking details
 * @returns {Promise<boolean>} - Whether the email was sent successfully
 */
export const sendTicketEmail = async (bookingData) => {
  const { name, email, parkName, parkLocation, tickets, totalAmount, paymentMethod } = bookingData;

  const bookingId = 'SPAR-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const bookingDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const templateParams = {
    to_name: name,
    to_email: email,
    park_name: parkName,
    park_location: parkLocation,
    num_tickets: tickets,
    total_amount: `₹${totalAmount}`,
    payment_method: paymentMethod === 'gpay' ? 'Google Pay' : 'Credit Card',
    booking_date: bookingDate,
    booking_id: bookingId
  };

  // If EmailJS isn't configured, log a friendly message and return the booking ID
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.log(
      '%c📧 EmailJS not configured — skipping real email. Ticket details:',
      'color: #C7FF00; font-weight: bold;',
      templateParams
    );
    console.log(
      '%c💡 To send real emails, add VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY to your .env file.',
      'color: #00D1FF;'
    );
    return { success: true, bookingId, simulated: true };
  }

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, { publicKey: PUBLIC_KEY });
    console.log('%c✅ Ticket email sent successfully!', 'color: #C7FF00; font-weight: bold;');
    return { success: true, bookingId, simulated: false };
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return { success: false, bookingId, simulated: false, error };
  }
};
