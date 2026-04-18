import React from 'react';
import { X, Gift, CheckCircle } from 'lucide-react';

const ClaimTicketModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container mission-success-modal">
        <button className="close-btn" onClick={onClose}><X size={24} /></button>
        
        <div className="modal-header">
          <div className="success-icon-wrapper">
            <Gift size={48} color="var(--primary-light-green)" />
          </div>
          <h2>BOOKING SUCCESSFUL! 🚀</h2>
          <p>You've scored 10 points! You've won a FREE amusement park ticket.</p>
        </div>

        <form className="claim-form">
          <div className="form-group">
            <label>RANGER NAME</label>
            <input type="text" placeholder="Enter your name" required />
          </div>
          
          <div className="form-group">
            <label>VISIT DATE</label>
            <input type="date" required />
          </div>

          <div className="form-group">
            <label>TARGET THEME PARK</label>
            <select required>
              <option value="">Select a Park...</option>
              <option value="vgp">VGP Universal Kingdom</option>
              <option value="mgm">MGM Dizzee World</option>
              <option value="queensland">Queens Land</option>
              <option value="blackthunder">Black Thunder</option>
              <option value="wonderla">Wonderla</option>
            </select>
          </div>

          <button type="button" className="btn-primary claim-btn" onClick={onClose}>
            <CheckCircle size={20} style={{ marginRight: '10px' }} />
            CLAIM FREE TICKET
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClaimTicketModal;
