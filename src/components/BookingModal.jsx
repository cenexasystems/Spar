import React, { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Ticket, Search, CreditCard, Smartphone, CheckCircle, ArrowRight, ArrowLeft, PartyPopper, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendTicketEmail } from '../utils/emailService';
import confetti from 'canvas-confetti';
import './BookingModal.css';

const BookingModal = ({ isOpen, onClose, selectedPark }) => {
  const { user, addBooking } = useAuth();
  const [step, setStep] = useState(1); // 1: Info, 2: Cart, 3: Payment, 4: Success
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    tickets: 1,
    referral: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const successRef = useRef(null);

  // Pre-fill data if user is logged in
  useEffect(() => {
    if (user && isOpen) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
    if (!isOpen) {
      setStep(1);
      setPaymentMethod('');
      setBookingResult(null);
    }
  }, [user, isOpen]);

  // Fire confetti when reaching success step
  useEffect(() => {
    if (step === 3) {
      fireConfetti();
    }
  }, [step]);

  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    // Initial big burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6, x: 0.5 },
      colors: ['#C7FF00', '#BF00FF', '#00D1FF', '#FF6B6B', '#FFD93D', '#6BCB77'],
      zIndex: 10001,
    });

    // Continuous sparkle effect
    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#C7FF00', '#BF00FF', '#00D1FF'],
        zIndex: 10001,
      });

      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FF6B6B', '#FFD93D', '#6BCB77'],
        zIndex: 10001,
      });
    }, 150);

    // Grand finale
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#C7FF00', '#BF00FF', '#00D1FF', '#FF6B6B', '#FFD93D'],
        zIndex: 10001,
      });
    }, 1500);
  };

  if (!isOpen || !selectedPark) return null;

  const totalAmount = parseInt(selectedPark.price) * formData.tickets;

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleProcessPayment = async () => {
    if (!paymentMethod) return alert("Please select a payment method!");

    setIsProcessing(true);

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsProcessing(false);
    
    // Push mission data to Supabase
    const bookingId = "SPAR-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    await addBooking({
      parkName: selectedPark.name,
      parkId: selectedPark.id,
      tickets: formData.tickets,
      total: totalAmount,
      payment: paymentMethod,
      bookingId: bookingId
    });

    setBookingResult({ bookingId });
    setStep(3); 
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="modal-overlay booking-overlay">
      <div className="modal-container booking-modal-flow glass-morphism solid-dark-bg">
        {/* --- Space Background Inside Modal --- */}
        <div className="modal-space-backdrop">
           <div className="modal-mini-roamer mini-buzz-roamer">🧑‍🚀</div>
           <div className="modal-mini-roamer mini-alien-roamer-1">👾</div>
           <div className="modal-mini-roamer mini-alien-roamer-2">👾</div>
           <div className="modal-mini-roamer mini-star-roamer-1">⭐</div>
           <div className="modal-mini-roamer mini-star-roamer-2">🌟</div>
           <div className="modal-mini-roamer mini-rocket-roamer">🚀</div>
        </div>

        <button className="close-btn" onClick={handleClose} aria-label="Close">
          <X size={24} />
        </button>

        {/* --- Progress Indicator --- */}
        {step < 3 && (
          <div className="booking-progress">
            <div className={`progress-dot ${step >= 1 ? 'active' : ''}`}><span>1</span></div>
            <div className={`progress-line ${step >= 2 ? 'filled' : ''}`}></div>
            <div className={`progress-dot ${step >= 2 ? 'active' : ''}`}><span>2</span></div>
          </div>
        )}

        {/* --- Step 1: Cadet Info --- */}
        {step === 1 && (
          <div className="booking-step-content animate-fade-in">
            <h2 className="step-title">CADET REGISTRATION</h2>
            <p className="step-subtitle">Fill in your details to book tickets at <strong>{selectedPark.name}</strong>.</p>

            <form className="booking-form" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
              <div className="form-group-row">
                <div className="form-input-wrapper">
                  <label><User size={14}/> YOUR NAME</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div className="form-input-wrapper">
                  <label><Mail size={14}/> EMAIL ID</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="you@gmail.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-input-wrapper">
                  <label><Ticket size={14}/> NO. OF MEMBERS</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.tickets}
                    onChange={(e) => setFormData({...formData, tickets: parseInt(e.target.value) || 1})}
                    required
                  />
                </div>
                <div className="form-input-wrapper">
                  <label><Search size={14}/> HOW'D YOU KNOW ABOUT US?</label>
                  <select
                    value={formData.referral}
                    onChange={(e) => setFormData({...formData, referral: e.target.value})}
                    required
                  >
                    <option value="">Select one...</option>
                    <option value="friends">Friends / Family</option>
                    <option value="social">Social Media</option>
                    <option value="google">Google Search</option>
                    <option value="ads">Advertisement</option>
                    <option value="youtube">YouTube</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary next-btn">
                REVIEW ORDER <ArrowRight size={20}/>
              </button>
            </form>
          </div>
        )}

        {/* --- Step 2: Consolidated Bill & Payment --- */}
        {step === 2 && (
          <div className="booking-step-content animate-fade-in consolidated-step">
            <h2 className="step-title">REVIEW & PAY 💳</h2>
            <p className="step-subtitle text-xs">Verify your booking and select payment method.</p>

            <div className="cart-summary-card compact-summary glass-morphism mb-4">
              <div className="summary-park-info py-2">
                <img src={selectedPark.image} alt={selectedPark.name} className="summary-park-img small-thumb" />
                <div className="summary-park-text">
                  <h3 className="text-base">{selectedPark.name}</h3>
                  <p className="text-xs">{selectedPark.location}</p>
                </div>
              </div>

              <div className="bill-details compact-details py-2">
                <div className="bill-row"><span className="bill-label">👤 cadet</span><span className="bill-value">{formData.name}</span></div>
                <div className="bill-row"><span className="bill-label">🎟️ members</span><span className="bill-value">{formData.tickets}</span></div>
                <div className="bill-row total mt-2"><span className="text-xs font-black">TOTAL</span><span className="text-lg font-black text-lime-400">₹{totalAmount}</span></div>
              </div>
            </div>

            <div className="payment-options mini-options mb-6">
              <div className={`payment-card mini-card glass-morphism ${paymentMethod === 'gpay' ? 'selected' : ''}`} onClick={() => setPaymentMethod('gpay')}>
                <Smartphone size={24} className="mb-1" /><span className="text-xs">GOOGLE PAY</span>
                {paymentMethod === 'gpay' && <div className="check-badge"><CheckCircle size={14} /></div>}
              </div>
              <div className={`payment-card mini-card glass-morphism ${paymentMethod === 'card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('card')}>
                <CreditCard size={24} className="mb-1" /><span className="text-xs">CREDIT CARD</span>
                {paymentMethod === 'card' && <div className="check-badge"><CheckCircle size={14} /></div>}
              </div>
            </div>

            <div className="step-actions">
              <button className="btn-secondary py-3" onClick={handleBack} disabled={isProcessing}><ArrowLeft size={16}/> BACK</button>
              <button className="btn-primary py-3" onClick={handleProcessPayment} disabled={isProcessing || !paymentMethod}>
                {isProcessing ? <><div className="spinner"></div> PROCESSING...</> : <>PAY ₹{totalAmount} <ArrowRight size={16}/></>}
              </button>
            </div>
          </div>
        )}

        {/* --- Step 3: Celebration / Success --- */}
        {step === 3 && (
          <div className="booking-step-content success-step animate-bounce-in" ref={successRef}>
            <div className="success-icon-container">
              <div className="success-ring"></div>
              <div className="success-ring ring-2"></div>
              <PartyPopper size={70} color="#C7FF00" className="success-party-icon" />
            </div>

            <h2 className="step-title celebration-title">
              <span className="celebrate-emoji">🎉</span>
              BOOKING CONFIRMED!
              <span className="celebrate-emoji">🎊</span>
            </h2>
            <p className="step-subtitle">Woohoo! Your adventure awaits!</p>

            <div className="success-ticket-card glass-morphism">
              <div className="ticket-header">
                <div className="ticket-park-badge">
                  <img src={selectedPark.image} alt={selectedPark.name} className="ticket-park-thumb" />
                </div>
                <div className="ticket-park-info">
                  <h3>{selectedPark.name}</h3>
                  <p>{selectedPark.location}</p>
                </div>
              </div>

              <div className="ticket-divider">
                <div className="ticket-notch left"></div>
                <div className="ticket-dash"></div>
                <div className="ticket-notch right"></div>
              </div>

              <div className="ticket-details-grid">
                <div className="ticket-detail">
                  <span className="detail-label">Name</span>
                  <span className="detail-value">{formData.name}</span>
                </div>
                <div className="ticket-detail">
                  <span className="detail-label">Members</span>
                  <span className="detail-value">{formData.tickets}</span>
                </div>
                <div className="ticket-detail">
                  <span className="detail-label">Amount Paid</span>
                  <span className="detail-value highlight">₹{totalAmount}</span>
                </div>
                <div className="ticket-detail">
                  <span className="detail-label">Payment</span>
                  <span className="detail-value">{paymentMethod === 'gpay' ? 'GPay' : 'Card'}</span>
                </div>
              </div>

              {bookingResult && (
                <div className="booking-id-strip">
                  <span>Booking ID: <strong>{bookingResult.bookingId}</strong></span>
                </div>
              )}
            </div>

            <div className="email-confirmation-box">
              <Mail size={20} />
              <p>
                {bookingResult?.simulated
                  ? <>Your ticket details will be sent to <strong>{formData.email}</strong> once EmailJS is configured.</>
                  : <>A confirmation ticket has been sent to <strong>{formData.email}</strong>! Check your inbox. 📬</>
                }
              </p>
            </div>

            <button className="btn-primary celebration-btn" onClick={handleClose}>
              <PartyPopper size={20} /> AWESOME, LET'S GO! 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
