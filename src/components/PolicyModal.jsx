import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import './PolicyModal.css';

const policyData = {
  ticket: {
    title: 'TICKET POLICIES',
    subtitle: '"Everything you need to know before you book."',
    sections: [
      {
        label: 'BOOKING & PAYMENT',
        content: [
          'All ticket bookings on SPAR Amusements are subject to availability and confirmation by our team.',
          'Payment must be completed via UPI (Google Pay, PhonePe, Paytm, or any UPI-enabled app) using the QR code provided during checkout.',
          'A payment proof (screenshot) must be uploaded to complete your booking request.',
          'Your booking is NOT confirmed until our team verifies your payment proof and sends your digital ticket via WhatsApp.',
          'Digital tickets are typically delivered within 2–4 hours of payment verification during business hours (9 AM – 8 PM).',
          'SPAR Amusements acts as an authorised ticketing agent for all listed parks.'
        ]
      },
      {
        label: 'CANCELLATION & REFUNDS',
        content: [
          'All ticket sales are FINAL. Tickets once booked cannot be cancelled, modified, or refunded under any circumstances.',
          'In the rare event that a park is closed on your visit date due to government orders or natural calamity, we will assist you in rescheduling your visit subject to park policies.',
          'If your payment is made but your booking is rejected by our team (e.g. invalid payment proof), a full refund will be processed to your original UPI account within 5–7 business days.'
        ]
      },
      {
        label: 'TICKET VALIDITY & USAGE',
        content: [
          'Each ticket is valid only for the date selected at the time of booking.',
          'Tickets are non-transferable and can only be used by the visitor named on the booking.',
          'Digital tickets must be presented at the park entrance (via WhatsApp or screenshot). Printed copies are also accepted.',
          'SPAR Amusements is not responsible for lost or forwarded tickets used by unauthorised persons.',
          'One digital ticket covers one visitor for unlimited rides on the date of visit (as per park policy — some parks may have per-ride charges for specific attractions).'
        ]
      },
      {
        label: 'PARK ENTRY RULES',
        content: [
          'Entry rules, height restrictions, age limits, and dress codes vary by park. Please review the "About This Park" section on each park card before booking.',
          'Common rules across all parks:',
          '- Children below minimum height may be denied entry to certain rides for safety reasons',
          '- Outside food and beverages are generally not permitted (MGM Dizzee World is an exception)',
          '- Proper swimwear is mandatory for water rides at all parks',
          '- Photography on rides is prohibited at all parks',
          'SPAR Amusements is not liable for any denial of entry or ride restrictions enforced by the park.'
        ]
      },
      {
        label: 'COUPONS & OFFERS',
        content: [
          'Coupon codes are issued by SPAR Amusements and are subject to validity dates and usage limits.',
          'Only one coupon may be applied per booking. Coupons cannot be combined with other offers.',
          'Coupons apply to the ticket subtotal only — not to GST or platform convenience fees.',
          'Expired or inactive coupons will be automatically rejected at checkout.',
          'SPAR Coins rewards are subject to separate terms and cannot be combined with coupon discounts.'
        ]
      }
    ]
  },
  privacy: {
    title: 'PRIVACY POLICY',
    subtitle: '"Last updated: May 2026"',
    sections: [
      {
        label: 'WHO WE ARE',
        content: [
          'SPAR Amusements is an online ticket reselling platform operated in Chennai, Tamil Nadu, India. We facilitate ticket bookings for amusement parks on behalf of customers and deliver digital tickets via WhatsApp.',
          'This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website or services.'
        ]
      },
      {
        label: 'INFORMATION WE COLLECT',
        content: [
          'When you register or book a ticket, we collect:',
          '- Full name\n- Email address\n- Phone number\n- WhatsApp number\n- Visit date and park preference\n- UPI payment screenshot (for verification purposes only)\n- Device information and browser type (automatically collected)',
          'We do NOT collect:\n- Credit/debit card numbers\n- Bank account details\n- Government ID numbers'
        ]
      },
      {
        label: 'HOW WE USE YOUR INFORMATION',
        content: [
          'We use your information to:',
          '- Process and verify your ticket booking\n- Deliver your digital ticket via WhatsApp\n- Send booking confirmation and updates\n- Respond to your support queries\n- Send occasional offers and updates (only if you subscribed via our newsletter — you can unsubscribe at any time)\n- Improve our platform and services\n- Comply with applicable legal obligations',
          'We do NOT sell, rent, or share your personal data with third parties for marketing purposes.'
        ]
      },
      {
        label: 'PAYMENT PROOF & DATA',
        content: [
          'Payment proof screenshots are collected solely for the purpose of verifying your booking.',
          'Screenshots are stored securely and are only accessible to our internal admin team.',
          'Payment screenshots are not shared with any third party, including the parks themselves.',
          'We do not process or store any UPI credentials or banking information.'
        ]
      },
      {
        label: 'DATA STORAGE & SECURITY',
        content: [
          'Your data is stored on secure cloud servers with encryption.',
          'We use industry-standard security measures to protect your data from unauthorised access.',
          'Access to customer data is restricted to authorised personnel only (our admin team).',
          'In the event of a data breach, we will notify affected users within 72 hours as required by applicable law.'
        ]
      },
      {
        label: 'COOKIES',
        content: [
          'Our website may use cookies to:\n- Remember your login session\n- Improve website performance\n- Analyse anonymous usage patterns',
          'You can disable cookies in your browser settings. Disabling cookies may affect some features of the site.'
        ]
      },
      {
        label: 'YOUR RIGHTS',
        content: [
          'You have the right to:\n- Access the personal data we hold about you\n- Request correction of inaccurate data\n- Request deletion of your account and associated data\n- Opt out of marketing communications at any time',
          'To exercise these rights, contact us at support@sparamusements.in'
        ]
      },
      {
        label: "CHILDREN'S PRIVACY",
        content: [
          'Our platform is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.'
        ]
      },
      {
        label: 'CHANGES TO THIS POLICY',
        content: [
          'We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated date. Continued use of our platform after changes constitutes acceptance of the updated policy.'
        ]
      }
    ]
  },
  terms: {
    title: 'TERMS OF USE',
    subtitle: '"Last updated: May 2026. Please read these terms carefully before using SPAR Amusements."',
    sections: [
      {
        label: 'ACCEPTANCE OF TERMS',
        content: [
          'By accessing or using the SPAR Amusements website and services, you agree to be bound by these Terms of Use. If you do not agree, please do not use our platform.'
        ]
      },
      {
        label: 'ABOUT OUR SERVICE',
        content: [
          'SPAR Amusements is an authorised ticketing agent that resells theme park tickets for amusement parks in Tamil Nadu. We are not directly affiliated with or employees of any of the listed parks. We earn a commission on each ticket sold.'
        ]
      },
      {
        label: 'USER ACCOUNTS',
        content: [
          'You must provide accurate and complete information when creating an account.',
          'You are responsible for maintaining the confidentiality of your login credentials.',
          'You must be at least 18 years old to create an account and make purchases. Users under 18 may use the platform under parental supervision.',
          'We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.'
        ]
      },
      {
        label: 'BOOKINGS & PAYMENTS',
        content: [
          'By completing a booking, you confirm that the payment screenshot uploaded is genuine and corresponds to your booking.',
          'Submitting a false or manipulated payment screenshot is considered fraud and may result in account termination and legal action.',
          'SPAR Amusements reserves the right to cancel any booking suspected of fraudulent activity without refund.',
          'Ticket prices displayed on our platform may differ slightly from the park\'s direct prices due to our platform convenience fee.'
        ]
      },
      {
        label: 'INTELLECTUAL PROPERTY',
        content: [
          'All content on SPAR Amusements — including the logo, design, text, graphics, and code — is the intellectual property of SPAR Amusements.',
          'Park names, logos, and images used on this platform belong to their respective owners and are used for informational and reselling purposes only.',
          'You may not copy, reproduce, or redistribute any content from this platform without written permission.'
        ]
      },
      {
        label: 'LIMITATION OF LIABILITY',
        content: [
          'SPAR Amusements acts as a ticketing intermediary. We are not responsible for:\n- Park closures, ride shutdowns, or operational changes\n- Denial of entry due to height, age, health, or dress code violations\n- Injuries or incidents occurring inside the park premises\n- Loss or theft of personal belongings at the park',
          'Our maximum liability to you in any dispute shall not exceed the ticket amount paid for the specific booking in question.'
        ]
      },
      {
        label: 'PROHIBITED CONDUCT',
        content: [
          'You agree NOT to:\n- Submit false payment proofs\n- Use another person\'s identity to make a booking\n- Attempt to hack, scrape, or disrupt our platform\n- Resell tickets obtained through SPAR Amusements to third parties\n- Use abusive or threatening language toward our support team\n- Create multiple accounts to abuse coupon or reward systems',
          'Violation of any of the above may result in immediate account termination and legal action where applicable.'
        ]
      },
      {
        label: 'GOVERNING LAW',
        content: [
          'These Terms of Use are governed by the laws of India. Any disputes arising from your use of SPAR Amusements shall be subject to the exclusive jurisdiction of the courts in Chennai, Tamil Nadu.'
        ]
      }
    ]
  }
};

const PolicyModal = ({ activePolicy, onClose }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (activePolicy) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [activePolicy]);

  if (!activePolicy || !policyData[activePolicy]) return null;

  const data = policyData[activePolicy];

  return (
    <div className="policy-modal-overlay">
      <div className="policy-modal-content">
        <div className="policy-modal-header">
          <button className="policy-back-btn" onClick={onClose}>
            <ArrowLeft size={18} /> BACK
          </button>
        </div>
        <div className="policy-modal-body">
          <h1 className="policy-title">{data.title}</h1>
          <p className="policy-subtitle">{data.subtitle}</p>
          
          <div className="policy-sections">
            {data.sections.map((sec, idx) => (
              <div key={idx} className="policy-section">
                <h3 className="policy-section-label">{sec.label}</h3>
                {sec.content.map((p, pIdx) => (
                  <p key={pIdx} className="policy-body-text">{p}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyModal;
