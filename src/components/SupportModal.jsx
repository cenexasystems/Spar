import React, { useState } from 'react';
import { X, Send, User, Mail, Phone, MessageSquare } from 'lucide-react';
import './SupportModal.css';

const SupportModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', issue: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API submission delay
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Auto close after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({ name: '', email: '', phone: '', issue: '' });
        onClose();
      }, 3000);
    }, 1500);
  };

  const floatingElements = [
    { id: 1, type: 'rocket', x: '10%', y: '20%', size: 40, delay: '0s', duration: '15s' },
    { id: 2, type: 'alien', x: '85%', y: '15%', size: 50, delay: '2s', duration: '18s' },
    { id: 3, type: 'star', x: '20%', y: '70%', size: 20, delay: '1s', duration: '12s' },
    { id: 4, type: 'star', x: '75%', y: '75%', size: 25, delay: '4s', duration: '14s' },
    { id: 5, type: 'rocket', x: '80%', y: '60%', size: 35, delay: '5s', duration: '20s' },
    { id: 6, type: 'alien', x: '15%', y: '40%', size: 45, delay: '3s', duration: '16s' },
    { id: 7, type: 'star', x: '50%', y: '10%', size: 15, delay: '6s', duration: '10s' },
    { id: 8, type: 'star', x: '40%', y: '90%', size: 22, delay: '0s', duration: '13s' },
  ];

  return (
    <div className="support-modal-overlay">
      {/* Floating Space Background Elements */}
      <div className="space-background-container">
        {floatingElements.map(el => (
          <div 
            key={el.id} 
            className={`floating-element ${el.type}`}
            style={{ 
              left: el.x, 
              top: el.y, 
              '--duration': el.duration, 
              '--delay': el.delay,
              width: el.size,
              height: el.size
            }}
          >
            {el.type === 'rocket' && (
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 85, 0, 0.6))' }}>
                <path d="M4.5 16.5c-1.5 1.25-2 4.5-2 4.5s3.25-.5 4.5-2" stroke="#FF5500" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 7s-1.414-1.414-2-2c-2.314-2.314-5.5-2.5-5.5-2.5s.186 3.186 2.5 5.5c.586.586 2 2 2 2" stroke="#E2E8F0" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 15s-1.414-1.414-2-2c-2.314-2.314-5.5-2.5-5.5-2.5s.186 3.186 2.5 5.5c.586.586 2 2 2 2" stroke="#E2E8F0" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="m11 13 4 4" stroke="#FFD700" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="m13 11 4 4" stroke="#FFD700" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="m21 3-9 9" stroke="#00D1FF" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {el.type === 'alien' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a5 5 0 0 1 5 5v2a7 7 0 0 1-14 0V7a5 5 0 0 1 5-5z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 13a4 4 0 0 0 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 13a4 4 0 0 1-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
                <circle cx="15" cy="9" r="1.5" fill="currentColor"/>
              </svg>
            )}
            {el.type === 'star' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
            )}
          </div>
        ))}
      </div>

      <div className="support-modal glass-morphism pop-in flex flex-col">
        <button className="support-close-btn" onClick={onClose}>
          <X size={24} color="#fff" />
        </button>

        <div className="support-header text-center mb-6">
           <h2 className="text-white-shimmer-rtl">PARK SUPPORT</h2>
           <p className="text-muted text-sm mt-2">Need assistance? The Rangers are here to help!</p>
        </div>

        {isSuccess ? (
           <div className="support-success text-center py-10 scale-in flex flex-col items-center">
             <div className="success-icon-wrapper mb-4 text-[#C7FF00]">
               <Send size={60} />
             </div>
             <h3 className="text-white text-xl font-bold mb-2 font-['Outfit']">Transmission Received! 🚀</h3>
             <p className="text-gray-400">We will get back to you shortly.</p>
           </div>
        ) : (
           <form className="support-form fade-in" onSubmit={handleSubmit}>
              <div className="support-input-group">
                <User size={18} className="support-icon" color="#94A3B8" />
                <input 
                  type="text" 
                  className="modern-input support-input" 
                  placeholder="Full Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="support-input-group">
                <Mail size={18} className="support-icon" color="#94A3B8" />
                <input 
                  type="email" 
                  className="modern-input support-input" 
                  placeholder="Email Address"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="support-input-group">
                <Phone size={18} className="support-icon" color="#94A3B8" />
                <input 
                  type="tel" 
                  className="modern-input support-input" 
                  placeholder="Phone Number"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="support-input-group textarea-group">
                <MessageSquare size={18} className="support-icon area-icon" color="#94A3B8" />
                <textarea 
                  className="modern-input support-input textarea" 
                  placeholder="Please describe your issue or question in detail..."
                  rows={4}
                  required
                  value={formData.issue}
                  onChange={(e) => setFormData({...formData, issue: e.target.value})}
                ></textarea>
              </div>

              <button type="submit" className="neon-btn support-submit mt-6 w-full py-3 flex justify-center items-center gap-2" disabled={isSubmitting}>
                {isSubmitting ? <div className="spinner"></div> : 
                  <><Send size={18}/> SUBMIT</>
                }
              </button>
           </form>
        )}
      </div>
    </div>
  );
};

export default SupportModal;
