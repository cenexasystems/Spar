import React, { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Ticket, Search, CreditCard, Smartphone, CheckCircle, ArrowRight, ArrowLeft, PartyPopper, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendTicketEmail } from '../utils/emailService';
import confetti from 'canvas-confetti';
import axios from 'axios';
import './BookingModal.css';

const BookingModal = ({ isOpen, onClose, selectedPark }) => {
  const { user, addBooking, deductCoinsRequest } = useAuth();
  const [step, setStep] = useState(1); // 1:Info  2:Review  3:QR+UTR  4:Success
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    adultTickets: 1,
    kidsTickets: 0,
    referral: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('gpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [rewardSelection, setRewardSelection] = useState({ type: 'none', coins: 0, benefit: 0 });
  const [bookingResult, setBookingResult] = useState(null);
  const [qrCode, setQrCode] = useState(null);       // base64 QR PNG from backend
  const [orderData, setOrderData] = useState(null); // { bookingId, mongoBookingId, upiId, amount }
  const [utrNumber, setUtrNumber] = useState('');   // user-entered UTR/Ref after paying
  const [utrError, setUtrError] = useState('');
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
      setPaymentMethod('gpay');
      setBookingResult(null);
      setQrCode(null);
      setOrderData(null);
      setUtrNumber('');
      setUtrError('');
    }
  }, [user, isOpen]);

  // Fire confetti when reaching success step
  useEffect(() => {
    if (step === 4) {
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

  const adultPrice = selectedPark.adultPrice || parseInt(selectedPark.price);
  const kidsPrice = selectedPark.kidsPrice || parseInt(selectedPark.price) * 0.75;
  let totalAmount = (adultPrice * formData.adultTickets) + (kidsPrice * formData.kidsTickets);
  let rewardMessage = "";

  if (rewardSelection.type === 'discount') {
    const discountAmount = (adultPrice * rewardSelection.benefit) / 100;
    totalAmount -= discountAmount;
    rewardMessage = `${rewardSelection.benefit}% Discount Applied to 1 Adult Ticket!`;
  } else if (rewardSelection.type === 'free') {
    totalAmount -= adultPrice;
    rewardMessage = `1 FREE Adult Ticket Applied!`;
  }

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  // ── Step 2 → 3: Generate QR code and create pending booking ────────────
  const handleGenerateQR = async () => {
    setIsProcessing(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      // Deduct coins if a reward is being used
      if (rewardSelection.coins > 0) {
        await deductCoinsRequest(rewardSelection.coins);
      }

      const prefix = selectedPark.name.split(' ')[0].substring(0, 3).toUpperCase();

      const { data: order } = await axios.post(`${API_URL}/payment/create-order`, {
        parkName: selectedPark.name,
        parkId: selectedPark._id || selectedPark.id,
        tickets: formData.adultTickets + formData.kidsTickets,
        adultTickets: formData.adultTickets,
        childTickets: formData.kidsTickets,
        totalAmount,
        paymentMethod: 'gpay',
        parkPrefix: prefix,
      });

      setOrderData(order);
      setQrCode(order.qrCodeDataUrl);
      setStep(3); // go to QR scan step
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to generate QR. Try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Step 3 → 4: User submits UTR, backend confirms booking ──────────────
  const handleConfirmPayment = async () => {
    setUtrError('');
    const trimmed = utrNumber.trim();
    if (!trimmed) {
      setUtrError('Please enter the Transaction ID from your GPay receipt.');
      return;
    }
    if (trimmed.length < 10) {
      setUtrError('Transaction ID looks too short. Please double-check your GPay receipt.');
      return;
    }

    setIsProcessing(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      await axios.post(`${API_URL}/payment/verify`, {
        mongoBookingId: orderData.mongoBookingId,
        bookingId: orderData.bookingId,
        utrNumber: trimmed,
      });

      setBookingResult({ bookingId: orderData.bookingId });
      setStep(4);
    } catch (err) {
      setUtrError(err.response?.data?.message || 'Verification failed. Contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="modal-overlay booking-overlay">
      <div className="modal-container booking-modal-flow glass-morphism solid-dark-bg">
        <button className="close-btn" onClick={handleClose} aria-label="Close">
          <X size={24} />
        </button>

        {/* --- Progress Indicator (steps 1-3) --- */}
        {step < 4 && (
          <div className="booking-progress">
            <div className={`progress-dot ${step >= 1 ? 'active' : ''}`}><span>1</span></div>
            <div className={`progress-line ${step >= 2 ? 'filled' : ''}`}></div>
            <div className={`progress-dot ${step >= 2 ? 'active' : ''}`}><span>2</span></div>
            <div className={`progress-line ${step >= 3 ? 'filled' : ''}`}></div>
            <div className={`progress-dot ${step >= 3 ? 'active' : ''}`}><span>3</span></div>
          </div>
        )}

        {/* --- Step 1: Cadet Info --- */}
        {step === 1 && (
          <div className="booking-step-content animate-fade-in">
            <h2 className="step-title">VISITOR REGISTRATION</h2>
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
                  <label><Ticket size={14}/> NO. OF ADULTS</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.adultTickets}
                    onChange={(e) => setFormData({...formData, adultTickets: parseInt(e.target.value) || 1})}
                    required
                  />
                </div>
                <div className="form-input-wrapper">
                  <label><Ticket size={14}/> NO. OF KIDS</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={formData.kidsTickets}
                    onChange={(e) => setFormData({...formData, kidsTickets: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="form-group-row" style={{ marginTop: '16px' }}>
                <div className="form-input-wrapper" style={{ gridColumn: '1 / -1' }}>
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

        {/* --- Step 2: Review & Confirm → shows bill + SPAR coins, then generate QR --- */}
        {step === 2 && (
          <div className="booking-step-content animate-fade-in consolidated-step">
            <h2 className="step-title">REVIEW &amp; PAY 📱</h2>
            <p className="step-subtitle text-xs">Verify your booking details then scan the GPay QR to pay.</p>

            <div className="cart-summary-card compact-summary glass-morphism mb-4">
              <div className="summary-park-info py-2">
                <img src={selectedPark.image} alt={selectedPark.name} className="summary-park-img small-thumb" />
                <div className="summary-park-text">
                  <h3 className="text-base">{selectedPark.name}</h3>
                  <p className="text-xs">{selectedPark.location}</p>
                </div>
              </div>

              <div className="bill-details compact-details py-2">
                <div className="bill-row"><span className="bill-label">👤 visitor</span><span className="bill-value">{formData.name}</span></div>
                <div className="bill-row"><span className="bill-label">🎟️ adults</span><span className="bill-value">{formData.adultTickets} × ₹{adultPrice}</span></div>
                {formData.kidsTickets > 0 && <div className="bill-row"><span className="bill-label">👶 kids</span><span className="bill-value">{formData.kidsTickets} × ₹{kidsPrice}</span></div>}
                <div className="bill-row total mt-2"><span className="text-xs font-black">TOTAL</span><span className="text-lg font-black text-lime-400">₹{totalAmount}</span></div>
              </div>
            </div>

            {/* SPAR COINS REDEMPTION SECTION */}
            {user && (
              <div className="spar-coins-redemption glass-morphism p-3 mb-4 border border-[#C7FF00]/20">
                <div className="flex items-center justify-between mb-2">
                   <h4 style={{ fontSize: '13px', fontWeight: 900, color: '#C7FF00', letterSpacing: '0.1em' }}>SPAR COINS REWARDS</h4>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1e293b', padding: '4px 10px', borderRadius: '50px' }}>
                      <span style={{ fontSize: '12px', color: '#fff', fontWeight: 700 }}>💰 {user.sparCoins?.toLocaleString()} Available</span>
                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                   {/* DISCOUNTS */}
                   <div className="reward-group">
                      <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px', letterSpacing: '0.5px' }}>DISCOUNTS (ON YOUR TICKET)</p>
                      <div className="custom-scrollbar" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '100px', overflowY: 'auto', padding: '4px' }}>
                        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(pct => {
                          const cost = pct * 1000;
                          const isEligible = user.sparCoins >= cost;
                          const isSelected = rewardSelection.type === 'discount' && rewardSelection.benefit === pct;
                          return (
                            <button
                              key={pct}
                              disabled={!isEligible}
                              onClick={() => setRewardSelection(isSelected ? {type:'none', coins:0, benefit:0} : {type:'discount', coins:cost, benefit:pct})}
                              style={{
                                fontSize: '12px',
                                padding: '8px',
                                borderRadius: '6px',
                                border: isSelected ? '1px solid #C7FF00' : isEligible ? '1px solid #4b5563' : '1px solid #374151',
                                background: isSelected ? '#C7FF00' : isEligible ? '#1e293b' : '#1f2937',
                                color: isSelected ? '#000' : isEligible ? '#fff' : '#6b7280',
                                fontWeight: isSelected ? 900 : 600,
                                opacity: isEligible ? 1 : 0.4,
                                cursor: isEligible ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                              }}
                            >
                              {pct}% ({(cost/1000)}K)
                            </button>
                          );
                        })}
                      </div>
                   </div>

                   {/* Free Ticket Option */}
                   <div className="reward-group">
                      <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px', letterSpacing: '0.5px' }}>FREE PASS (ON YOUR TICKET)</p>
                      <button 
                         disabled={user.sparCoins < 100000}
                         onClick={() => setRewardSelection(rewardSelection.type === 'free' ? {type:'none', coins:0, benefit:0} : {type:'free', coins:100000, benefit:100})}
                         style={{
                           width: '100%',
                           padding: '12px 8px',
                           fontSize: '13px',
                           fontWeight: 800,
                           borderRadius: '6px',
                           border: rewardSelection.type === 'free' ? '1px solid #BF00FF' : user.sparCoins >= 100000 ? '1px solid #4b5563' : '1px solid #374151',
                           background: rewardSelection.type === 'free' ? '#BF00FF' : 'transparent',
                           color: rewardSelection.type === 'free' ? '#fff' : user.sparCoins >= 100000 ? '#fff' : '#6b7280',
                           cursor: user.sparCoins >= 100000 ? 'pointer' : 'not-allowed',
                           transition: 'all 0.2s',
                         }}
                      >
                         GET FREE PASS
                      </button>
                   </div>
                </div>
                {rewardMessage && <p style={{ fontSize: '12px', color: '#C7FF00', marginTop: '12px', fontWeight: 800 }} className="animate-pulse">✨ {rewardMessage}</p>}
                <p style={{ fontSize: '10px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' }}>*Applied to one ticket in the booking.</p>
              </div>
            )}

            {/* GPay badge */}
            <div className="payment-options mini-options mb-4" style={{ justifyContent: 'center' }}>
              <div className="payment-card mini-card glass-morphism selected" style={{ cursor: 'default' }}>
                <Smartphone size={24} className="mb-1" /><span className="text-xs">GOOGLE PAY QR</span>
                <div className="check-badge"><CheckCircle size={14} /></div>
              </div>
            </div>

            <div className="step-actions">
              <button className="btn-secondary py-3" onClick={handleBack} disabled={isProcessing}><ArrowLeft size={16}/> BACK</button>
              <button className="btn-primary py-3" onClick={handleGenerateQR} disabled={isProcessing}>
                {isProcessing ? <><div className="spinner"></div> GENERATING...</> : <>GENERATE QR ₹{totalAmount} <ArrowRight size={16}/></>}
              </button>
            </div>
          </div>
        )}

        {/* --- Step 3: Scan GPay QR + Enter UTR --- */}
        {step === 3 && (
          <div className="booking-step-content animate-fade-in">
            <h2 className="step-title">SCAN &amp; PAY 📲</h2>
            <p className="step-subtitle text-xs">
              Scan using <strong>Google Pay</strong>, PhonePe, or any UPI app.
            </p>

            {/* QR Code */}
            {qrCode && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: '#fff',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '16px',
                boxShadow: '0 0 24px rgba(199,255,0,0.15)',
              }}>
                <img src={qrCode} alt="GPay QR Code" style={{ width: '220px', height: '220px', display: 'block' }} />
                <p style={{ color: '#000', fontSize: '11px', marginTop: '8px', fontWeight: 700 }}>
                  Pay ₹{orderData?.amount} to {orderData?.upiId}
                </p>
                <p style={{ color: '#555', fontSize: '10px', marginTop: '2px' }}>
                  {orderData?.merchantName}
                </p>
              </div>
            )}

            {/* Mobile UPI deep-link button */}
            {orderData?.upiString && (
              <a
                href={orderData.upiString}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg,#00d37f,#00a86b)',
                  color: '#fff',
                  padding: '10px 0',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '13px',
                  marginBottom: '16px',
                  textDecoration: 'none',
                  letterSpacing: '0.05em',
                }}
              >
                📱 Open Google Pay App
              </a>
            )}

            {/* UTR / Transaction Reference Input */}
            <div className="form-input-wrapper" style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '11px', color: '#C7FF00', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                🔢 Enter Transaction ID (from GPay receipt)
              </label>
              <input
                type="text"
                value={utrNumber}
                onChange={e => { setUtrNumber(e.target.value); setUtrError(''); }}
                placeholder="e.g. 412345678901"
                style={{
                  background: '#0d1117',
                  border: `1px solid ${utrError ? '#ff4444' : '#334155'}`,
                  color: '#fff',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  width: '100%',
                  fontSize: '14px',
                  outline: 'none',
                  letterSpacing: '0.05em',
                }}
              />
              {utrError && <p style={{ color: '#ff4444', fontSize: '10px', marginTop: '4px' }}>{utrError}</p>}
              <p style={{ color: '#64748b', fontSize: '9px', marginTop: '4px' }}>
                Open GPay → Recent Transactions → find this payment → copy the 12-digit reference number.
              </p>
            </div>

            <div className="step-actions">
              <button className="btn-secondary py-3" onClick={() => setStep(2)} disabled={isProcessing}><ArrowLeft size={16}/> BACK</button>
              <button className="btn-primary py-3" onClick={handleConfirmPayment} disabled={isProcessing || !utrNumber.trim()}>
                {isProcessing ? <><div className="spinner"></div> CONFIRMING...</> : <>CONFIRM PAYMENT <ArrowRight size={16}/></>}
              </button>
            </div>
          </div>
        )}

        {/* --- Step 4: Celebration / Success --- */}
        {step === 4 && (
          <div className="booking-step-content success-step animate-bounce-in" ref={successRef}>
            <div className="success-roamers">
              <div className="s-roamer s-star-1">⭐</div>
              <div className="s-roamer s-star-2">🌟</div>
              <div className="s-roamer s-alien-1">👽</div>
              <div className="s-roamer s-alien-2">👾</div>
              <div className="s-roamer s-rocket">🚀</div>
              <div className="s-roamer s-ufo">🛸</div>
            </div>
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
                  <span className="detail-value">{formData.adultTickets} Adults{formData.kidsTickets > 0 ? `, ${formData.kidsTickets} Kids` : ''}</span>
                </div>
                <div className="ticket-detail">
                  <span className="detail-label">Amount Paid</span>
                  <span className="detail-value highlight">₹{totalAmount}</span>
                </div>
                <div className="ticket-detail">
                  <span className="detail-label">Payment</span>
                  <span className="detail-value">GPay {rewardSelection.type !== 'none' ? '+ REWARD' : ''}</span>
                </div>
              </div>

              {rewardSelection.type !== 'none' && (
                <div className="reward-badge-strip bg-[#C7FF00]/10 border-t border-[#C7FF00]/20 p-2 text-center">
                  <span className="text-[10px] font-black text-[#C7FF00] tracking-widest uppercase">✨ {rewardSelection.type.toUpperCase()} APPLIED</span>
                </div>
              )}

              {bookingResult && (
                <div className="booking-id-strip">
                  <span>Booking ID: <strong>{bookingResult.bookingId}</strong></span>
                </div>
              )}
            </div>

            <div className="email-confirmation-box">
              <Smartphone size={20} />
              <p>
                Confirmation sent to WhatsApp. Show your Booking ID at the entrance. Enjoy! 🚀
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
