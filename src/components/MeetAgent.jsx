import React from 'react';
import managerImg from '../assets/manager.jpg';
import { Phone, Mail, MessageCircle } from 'lucide-react';
import './MeetAgent.css';

const MeetAgent = () => {
  return (
    <section className="meet-agent-section">
      <div className="max-width-wrapper meet-agent-container">
        <div className="agent-photo-col">
          <div className="agent-image-wrapper">
            <img src={managerImg} alt="SPAR Amusements Agent" />
          </div>
          <div className="agent-trust-badges">
            <span className="trust-badge">✅ Founder & Owner</span>
            <span className="trust-badge">🎟️ Official Park Partner</span>
          </div>
        </div>
        
        <div className="agent-details-col">
          <span className="agent-label">FOUNDER & OWNER</span>
          <h2 className="agent-name">SPAR Amusements</h2>
          
          <p className="agent-bio">
            Founded and operated by a passionate entrepreneur based in Chennai, SPAR Amusements is your trusted gateway to Tamil Nadu's best amusement parks. We bring you verified digital tickets, exclusive deals, and seamless WhatsApp delivery — all backed by years of experience in the ticketing industry.
          </p>

          <div className="agent-stats">
            <div className="stat-card">
              <div className="stat-value">500+</div>
              <div className="stat-label">Happy Customers</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">5</div>
              <div className="stat-label">Parks Partnered</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">2–4 hrs</div>
              <div className="stat-label">Avg. Ticket Delivery</div>
            </div>
          </div>

          <div className="agent-contact-row">
            <a href="tel:+919585964848" className="agent-contact-link">
              <Phone size={14} color="#00D1FF" /> +91 95859 64848
            </a>
            <a href="mailto:sparamusements@gmail.com" className="agent-contact-link">
              <Mail size={14} color="#00D1FF" /> sparamusements@gmail.com
            </a>
          </div>

          <a href="https://wa.me/919585964848" target="_blank" rel="noopener noreferrer" className="agent-wa-btn">
            <MessageCircle size={16} /> CHAT WITH US ON WHATSAPP
          </a>
        </div>
      </div>
    </section>
  );
};

export default MeetAgent;
