import React from 'react';
import { X, Calendar, MapPin, Hash, User as UserIcon, Mail, Phone, Coins, Orbit, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './ProfileModal.css';

const ProfileModal = ({ isOpen, onClose, onOpenClaim }) => {
  const { user, logout } = useAuth();

  if (!isOpen || !user) return null;

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal glass-morphism pop-in">
        <button className="close-btn profile-close" onClick={onClose}>
          <X size={24} color="#fff" />
        </button>

        <div className="profile-header text-center">
           <div className="profile-avatar-container">
             <img src={user.avatar} alt="Profile" className="profile-avatar-img" />
             <div className="status-indicator"></div>
           </div>
           <h2 className="profile-name-text text-white-shimmer-rtl">{user.name}</h2>
           <p className="profile-role-text">SPAR ID: <span style={{ color: "var(--primary-light-green)", fontWeight: "bold" }}>{user.sparId || 'PENDING'}</span></p>
        </div>

        <div className="profile-details-grid">
          <div className="detail-card glass-morphism">
             <div className="detail-card-inner">
               <Mail size={18} color="#00D1FF" className="detail-icon" />
               <div className="detail-text-col">
                 <span className="detail-label">Email Address</span>
                 <span className="detail-value">{user.email}</span>
               </div>
             </div>
          </div>
          <div className="detail-card glass-morphism">
             <div className="detail-card-inner">
               <Phone size={18} color="#C7FF00" className="detail-icon" />
               <div className="detail-text-col">
                 <span className="detail-label">Phone Number</span>
                 <span className="detail-value">{user.phone || 'N/A'}</span>
               </div>
             </div>
          </div>
          <div className="detail-card glass-morphism coin-meter-card">
             <div className="detail-card-inner">
               <Coins size={18} color="#FFD700" className="detail-icon" />
               <div className="detail-text-col">
                 <span className="detail-label">Spar Coins</span>
                 <span className="detail-value coin-count-text">{user.sparCoins?.toLocaleString() || 0}</span>
               </div>
             </div>
          </div>
        </div>

        {user.sparCoins >= 100000 && (
          <div className="profile-claim-banner pop-in">
            <div className="flex items-center gap-3">
              <Orbit className="animate-pulse text-[#C7FF00]" />
              <div>
                <h4 className="m-0 text-[#C7FF00] font-bold">MILESTONE ACHIEVED!</h4>
                <p className="m-0 text-xs opacity-80">100,000 Coins collected. Claim your free ticket.</p>
              </div>
            </div>
            <button className="claim-redeem-btn" onClick={() => { onClose(); onOpenClaim(); }}>
              REDEEM NOW
            </button>
          </div>
        )}

        <div className="profile-ledger custom-scrollbar">
          <h3 className="profile-ledger-title">
            <span>YOUR DIGITAL PASSES</span>
            <span className="passes-count-badge">{user.bookings?.length || 0}</span>
          </h3>

          {!user.bookings || user.bookings.length === 0 ? (
            <div className="empty-ledger glass-morphism">
               <p>No bookings yet. Grab a ticket and join the action!</p>
            </div>
          ) : (
            <div className="tickets-grid">
              {[...user.bookings].reverse().map((ticket, idx) => (
                <div key={idx} className="digital-wallet-ticket glass-morphism">
                  <div className="wallet-ticket-header">
                     <span className="park-badge">{ticket.parkName || ticket.park || 'SPAR PARK'}</span>
                     {ticket.paymentMethod === 'FREE' || ticket.payment === 'FREE' || !(ticket.totalAmount || ticket.totalPrice) ? (
                       <span className="price-badge free">FREE TICKET 🎉</span>
                     ) : (
                       <span className="price-badge">₹{ticket.totalAmount || ticket.totalPrice}</span>
                     )}
                  </div>
                  
                  <div className="wallet-ticket-body">
                     <div className="ticket-meta-row">
                       <Calendar size={14} color="#00D1FF" />
                       {ticket.date || new Date(ticket.createdAt || ticket.timestamp || Date.now()).toLocaleDateString()}
                     </div>
                     <div className="ticket-meta-row">
                       <MapPin size={14} color="#00D1FF" />
                       {ticket.timeSlot || (ticket.tickets || 1) + ' Visitors'}
                     </div>
                  </div>

                  <div className="wallet-ticket-footer">
                     <div className="barcode-sim"></div>
                     <span className="ticket-id-tag">
                       <Hash size={12}/> {ticket.bookingId || ticket.id || ('TNX-' + Math.floor(Math.random() * 100000))}
                     </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          className="btn-primary profile-logout-btn"
          onClick={() => {
            onClose();
            logout();
          }}
        >
          LOG OUT
        </button>
      </div>
    </div>
  );
};

export default ProfileModal;
