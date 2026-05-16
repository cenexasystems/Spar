import React, { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Phone, Ticket, Search, Smartphone, CheckCircle, ArrowRight, ArrowLeft, PartyPopper, MapPin, Calendar, Upload, Image } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import axios from 'axios';
import './BookingModal.css';

const WONDERLA_LOCATIONS = [
  { value: 'bengaluru', label: 'Bengaluru', desc: 'Mysore Road, 28 km from the city' },
  { value: 'kochi', label: 'Kochi', desc: 'Pallikkara, 12 km from the city center' },
  { value: 'hyderabad', label: 'Hyderabad', desc: 'Raviryal' },
  { value: 'bhubaneswar', label: 'Bhubaneswar', desc: '28 km from the city' },
  { value: 'chennai', label: 'Chennai', desc: 'No 45/1 F, Illalur Village, Thiruporur, OMR' },
];

const BookingModal = ({ isOpen, onClose, selectedPark }) => {
  const { user, deductCoinsRequest } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', adultTickets: 1, kidsTickets: 0, referral: '', visitDate: '', wonderlaLocation: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [rewardSelection, setRewardSelection] = useState({ type: 'none', coins: 0, benefit: 0 });
  const [bookingResult, setBookingResult] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [screenshotUploaded, setScreenshotUploaded] = useState(false);
  const fileInputRef = useRef(null);
  const successRef = useRef(null);

  const isWonderla = selectedPark?.name?.toLowerCase().includes('wonderla');

  useEffect(() => {
    if (user && isOpen) {
      setFormData(prev => ({ ...prev, name: user.name || '', email: user.email || '', phone: user.phone || '' }));
    }
    if (!isOpen) {
      setStep(1);
      setBookingResult(null);
      setOrderData(null);
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setScreenshotUploaded(false);
      setUploadProgress(false);
      setRewardSelection({ type: 'none', coins: 0, benefit: 0 });
    }
  }, [user, isOpen]);

  useEffect(() => { if (step === 5) fireConfetti(); }, [step]);

  const fireConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#C7FF00','#BF00FF','#00D1FF','#FF6B6B','#FFD93D','#6BCB77'], zIndex: 10001 });
    const end = Date.now() + 3000;
    const iv = setInterval(() => {
      if (Date.now() > end) return clearInterval(iv);
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#C7FF00','#BF00FF'], zIndex: 10001 });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#FF6B6B','#FFD93D'], zIndex: 10001 });
    }, 150);
    setTimeout(() => confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ['#C7FF00','#BF00FF','#00D1FF'], zIndex: 10001 }), 1500);
  };

  if (!isOpen || !selectedPark) return null;

  const adultPrice = selectedPark.adultPrice || parseInt(selectedPark.price);
  const kidsPrice = selectedPark.kidsPrice || parseInt(selectedPark.price) * 0.75;
  let totalAmount = (adultPrice * formData.adultTickets) + (kidsPrice * formData.kidsTickets);
  let rewardMessage = "";
  if (rewardSelection.type === 'discount') {
    totalAmount -= (adultPrice * rewardSelection.benefit) / 100;
    rewardMessage = `${rewardSelection.benefit}% Discount Applied to 1 Adult Ticket!`;
  } else if (rewardSelection.type === 'free') {
    totalAmount -= adultPrice;
    rewardMessage = `1 FREE Adult Ticket Applied!`;
  }

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  // Validate Step 1
  const validateStep1 = (e) => {
    e.preventDefault();
    if (isWonderla && !formData.wonderlaLocation) {
      alert('Please select a Wonderla location');
      return;
    }
    if (!formData.visitDate) {
      alert('Please select a visit date');
      return;
    }
    handleNext();
  };

  // Step 2 → 3: Create order
  const handleCreateOrder = async () => {
    setIsProcessing(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
      if (rewardSelection.coins > 0) await deductCoinsRequest(rewardSelection.coins);
      const prefix = selectedPark.name.split(' ')[0].substring(0, 3).toUpperCase();
      const { data: order } = await axios.post(`${API_URL}/payment/create-order`, {
        parkName: selectedPark.name, parkId: selectedPark._id || selectedPark.id,
        tickets: formData.adultTickets + formData.kidsTickets,
        adultTickets: formData.adultTickets, childTickets: formData.kidsTickets,
        totalAmount, paymentMethod: 'gpay', parkPrefix: prefix,
        wonderlaLocation: formData.wonderlaLocation, visitDate: formData.visitDate,
        userEmail: formData.email, userPhone: formData.phone,
      });
      setOrderData(order);
      setStep(3);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create order. Try again.');
    } finally { setIsProcessing(false); }
  };

  // Handle screenshot selection
  const handleScreenshotSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File too large. Max 5MB.'); return; }
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setScreenshotPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Upload screenshot
  const handleUploadScreenshot = async () => {
    if (!screenshotFile || !orderData) return;
    setUploadProgress(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
      const fd = new FormData();
      fd.append('paymentScreenshot', screenshotFile);
      fd.append('mongoBookingId', orderData.mongoBookingId);
      await axios.post(`${API_URL}/payment/upload-screenshot`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setScreenshotUploaded(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed. Try again.');
    } finally { setUploadProgress(false); }
  };

  // Step 4 → 5: Confirm booking
  const handleConfirmBooking = async () => {
    setIsProcessing(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
      await axios.post(`${API_URL}/payment/confirm-booking`, {
        mongoBookingId: orderData.mongoBookingId, bookingId: orderData.bookingId,
      });
      setBookingResult({ bookingId: orderData.bookingId, ticketId: orderData.ticketId });
      setStep(5);
    } catch (err) {
      alert(err.response?.data?.message || 'Confirmation failed.');
    } finally { setIsProcessing(false); }
  };

  return (
    <div className="modal-overlay booking-overlay">
      <div className="modal-container booking-modal-flow glass-morphism solid-dark-bg">
        <button className="close-btn" onClick={onClose} aria-label="Close"><X size={24} /></button>

        {/* Progress: 5 steps */}
        {step < 5 && (
          <div className="booking-progress">
            {[1,2,3,4].map(s => (
              <React.Fragment key={s}>
                <div className={`progress-dot ${step >= s ? 'active' : ''}`}><span>{s}</span></div>
                {s < 4 && <div className={`progress-line ${step > s ? 'filled' : ''}`}></div>}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* ── Step 1: Visitor Info + Wonderla Location + Date ── */}
        {step === 1 && (
          <div className="booking-step-content animate-fade-in">
            <h2 className="step-title">VISITOR REGISTRATION</h2>
            <p className="step-subtitle">Fill in your details to book tickets at <strong>{selectedPark.name}</strong>.</p>
            <form className="booking-form" onSubmit={validateStep1}>
              <div className="form-group-row">
                <div className="form-input-wrapper">
                  <label><User size={14}/> YOUR NAME</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Enter your name" required />
                </div>
                <div className="form-input-wrapper">
                  <label><Mail size={14}/> EMAIL ID</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="you@gmail.com" required />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-input-wrapper">
                  <label><Phone size={14}/> PHONE NUMBER</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+91 9876543210" required />
                </div>
                <div className="form-input-wrapper">
                  <label><Calendar size={14}/> VISIT DATE</label>
                  <input type="date" value={formData.visitDate} onChange={(e) => setFormData({...formData, visitDate: e.target.value})} min={new Date().toISOString().split('T')[0]} required />
                </div>
              </div>

              {/* Wonderla Location Selection */}
              {isWonderla && (
                <div className="wonderla-location-section">
                  <label className="wonderla-loc-label"><MapPin size={14}/> SELECT WONDERLA LOCATION</label>
                  <div className="wonderla-locations-grid">
                    {WONDERLA_LOCATIONS.map(loc => (
                      <button key={loc.value} type="button"
                        className={`wonderla-loc-card ${formData.wonderlaLocation === loc.value ? 'selected' : ''}`}
                        onClick={() => setFormData({...formData, wonderlaLocation: loc.value})}
                      >
                        <span className="loc-name">{loc.label}</span>
                        <span className="loc-desc">{loc.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group-row">
                <div className="form-input-wrapper">
                  <label><Ticket size={14}/> NO. OF ADULTS</label>
                  <input type="number" min="1" max="20" value={formData.adultTickets} onChange={(e) => setFormData({...formData, adultTickets: parseInt(e.target.value) || 1})} required />
                </div>
                <div className="form-input-wrapper">
                  <label><Ticket size={14}/> NO. OF KIDS</label>
                  <input type="number" min="0" max="20" value={formData.kidsTickets} onChange={(e) => setFormData({...formData, kidsTickets: parseInt(e.target.value) || 0})} />
                </div>
              </div>

              <div className="form-group-row" style={{ marginTop: '16px' }}>
                <div className="form-input-wrapper" style={{ gridColumn: '1 / -1' }}>
                  <label><Search size={14}/> HOW'D YOU KNOW ABOUT US?</label>
                  <select value={formData.referral} onChange={(e) => setFormData({...formData, referral: e.target.value})} required>
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

              <button type="submit" className="btn-primary next-btn">REVIEW ORDER <ArrowRight size={20}/></button>
            </form>
          </div>
        )}

        {/* ── Step 2: Review & Confirm ── */}
        {step === 2 && (
          <div className="booking-step-content animate-fade-in consolidated-step">
            <h2 className="step-title">REVIEW & PAY 📱</h2>
            <p className="step-subtitle text-xs">Verify your booking details then proceed to payment.</p>

            <div className="cart-summary-card compact-summary glass-morphism mb-4">
              <div className="summary-park-info py-2">
                <img src={selectedPark.image} alt={selectedPark.name} className="summary-park-img small-thumb" />
                <div className="summary-park-text">
                  <h3 className="text-base">{selectedPark.name}</h3>
                  <p className="text-xs">{isWonderla && formData.wonderlaLocation ? WONDERLA_LOCATIONS.find(l => l.value === formData.wonderlaLocation)?.label + ' — ' + WONDERLA_LOCATIONS.find(l => l.value === formData.wonderlaLocation)?.desc : selectedPark.location}</p>
                </div>
              </div>
              <div className="bill-details compact-details py-2">
                <div className="bill-row"><span className="bill-label">👤 visitor</span><span className="bill-value">{formData.name}</span></div>
                <div className="bill-row"><span className="bill-label">📅 visit date</span><span className="bill-value">{new Date(formData.visitDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                <div className="bill-row"><span className="bill-label">🎟️ adults</span><span className="bill-value">{formData.adultTickets} × ₹{adultPrice}</span></div>
                {formData.kidsTickets > 0 && <div className="bill-row"><span className="bill-label">👶 kids</span><span className="bill-value">{formData.kidsTickets} × ₹{kidsPrice}</span></div>}
                <div className="bill-row total mt-2"><span className="text-xs font-black">TOTAL</span><span className="text-lg font-black text-lime-400">₹{totalAmount}</span></div>
              </div>
            </div>

            {/* SPAR COINS */}
            {user && (
              <div className="spar-coins-redemption glass-morphism p-3 mb-4 border border-[#C7FF00]/20">
                <div className="flex items-center justify-between mb-2">
                  <h4 style={{ fontSize: '13px', fontWeight: 900, color: '#C7FF00', letterSpacing: '0.1em' }}>SPAR COINS REWARDS</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1e293b', padding: '4px 10px', borderRadius: '50px' }}>
                    <span style={{ fontSize: '12px', color: '#fff', fontWeight: 700 }}>💰 {user.sparCoins?.toLocaleString()} Available</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="reward-group">
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px', letterSpacing: '0.5px' }}>DISCOUNTS</p>
                    <div className="custom-scrollbar" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '100px', overflowY: 'auto', padding: '4px' }}>
                      {[10,20,30,40,50,60,70,80,90].map(pct => {
                        const cost = pct * 1000;
                        const ok = user.sparCoins >= cost;
                        const sel = rewardSelection.type === 'discount' && rewardSelection.benefit === pct;
                        return (<button key={pct} disabled={!ok} onClick={() => setRewardSelection(sel ? {type:'none',coins:0,benefit:0} : {type:'discount',coins:cost,benefit:pct})}
                          style={{ fontSize:'12px',padding:'8px',borderRadius:'6px',border:sel?'1px solid #C7FF00':ok?'1px solid #4b5563':'1px solid #374151',background:sel?'#C7FF00':ok?'#1e293b':'#1f2937',color:sel?'#000':ok?'#fff':'#6b7280',fontWeight:sel?900:600,opacity:ok?1:0.4,cursor:ok?'pointer':'not-allowed',transition:'all 0.2s'}}
                        >{pct}% ({cost/1000}K)</button>);
                      })}
                    </div>
                  </div>
                  <div className="reward-group">
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px', letterSpacing: '0.5px' }}>FREE PASS</p>
                    <button disabled={user.sparCoins < 100000} onClick={() => setRewardSelection(rewardSelection.type === 'free' ? {type:'none',coins:0,benefit:0} : {type:'free',coins:100000,benefit:100})}
                      style={{ width:'100%',padding:'12px 8px',fontSize:'13px',fontWeight:800,borderRadius:'6px',border:rewardSelection.type==='free'?'1px solid #BF00FF':user.sparCoins>=100000?'1px solid #4b5563':'1px solid #374151',background:rewardSelection.type==='free'?'#BF00FF':'transparent',color:rewardSelection.type==='free'?'#fff':user.sparCoins>=100000?'#fff':'#6b7280',cursor:user.sparCoins>=100000?'pointer':'not-allowed',transition:'all 0.2s'}}>GET FREE PASS</button>
                  </div>
                </div>
                {rewardMessage && <p style={{ fontSize: '12px', color: '#C7FF00', marginTop: '12px', fontWeight: 800 }} className="animate-pulse">✨ {rewardMessage}</p>}
              </div>
            )}

            <div className="payment-options mini-options mb-4" style={{ justifyContent: 'center' }}>
              <div className="payment-card mini-card glass-morphism selected" style={{ cursor: 'default' }}>
                <Smartphone size={24} className="mb-1" /><span className="text-xs">GOOGLE PAY QR</span>
                <div className="check-badge"><CheckCircle size={14} /></div>
              </div>
            </div>

            <div className="step-actions">
              <button className="btn-secondary py-3" onClick={handleBack} disabled={isProcessing}><ArrowLeft size={16}/> BACK</button>
              <button className="btn-primary py-3" onClick={handleCreateOrder} disabled={isProcessing}>
                {isProcessing ? <><div className="spinner"></div> PROCESSING...</> : <>PROCEED TO PAY ₹{totalAmount} <ArrowRight size={16}/></>}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Show QR + Pay ── */}
        {step === 3 && (
          <div className="booking-step-content animate-fade-in">
            <h2 className="step-title">SCAN & PAY 📲</h2>
            <p className="step-subtitle text-xs">Scan the QR code using <strong>Google Pay</strong> or any UPI app to pay <strong>₹{orderData?.amount}</strong></p>

            <div className="qr-display-container">
              <img src="/gpay_qr.jpg" alt="GPay QR Code" className="gpay-qr-image" />
              <p className="qr-upi-text">UPI ID: {orderData?.upiId}</p>
              <p className="qr-amount-text">Amount: ₹{orderData?.amount}</p>
            </div>

            {orderData?.upiString && (
              <a href={orderData.upiString} className="gpay-deeplink-btn">📱 Open Google Pay App</a>
            )}

            <div className="step-actions" style={{ marginTop: '16px' }}>
              <button className="btn-secondary py-3" onClick={() => setStep(2)} disabled={isProcessing}><ArrowLeft size={16}/> BACK</button>
              <button className="btn-primary py-3" onClick={() => setStep(4)}>I'VE PAID — UPLOAD PROOF <ArrowRight size={16}/></button>
            </div>
          </div>
        )}

        {/* ── Step 4: Upload Screenshot ── */}
        {step === 4 && (
          <div className="booking-step-content animate-fade-in">
            <h2 className="step-title">UPLOAD PAYMENT PROOF 📸</h2>
            <p className="step-subtitle text-xs">Upload a screenshot of your GPay payment confirmation.</p>

            <div className="screenshot-upload-area" onClick={() => !screenshotUploaded && fileInputRef.current?.click()}>
              {screenshotPreview ? (
                <div className="screenshot-preview-wrap">
                  <img src={screenshotPreview} alt="Payment screenshot" className="screenshot-preview-img" />
                  {screenshotUploaded && <div className="upload-success-badge"><CheckCircle size={20}/> Uploaded</div>}
                </div>
              ) : (
                <div className="upload-placeholder">
                  <Upload size={40} strokeWidth={1.5} />
                  <p>Tap to upload screenshot</p>
                  <span>JPG, PNG, WebP • Max 5MB</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleScreenshotSelect} style={{ display: 'none' }} />
            </div>

            {screenshotFile && !screenshotUploaded && (
              <button className="btn-upload-screenshot" onClick={handleUploadScreenshot} disabled={uploadProgress}>
                {uploadProgress ? <><div className="spinner"></div> UPLOADING...</> : <><Upload size={16}/> UPLOAD SCREENSHOT</>}
              </button>
            )}

            <div className="step-actions" style={{ marginTop: '16px' }}>
              <button className="btn-secondary py-3" onClick={() => setStep(3)}><ArrowLeft size={16}/> BACK</button>
              <button className="btn-primary py-3" onClick={handleConfirmBooking} disabled={isProcessing || !screenshotUploaded}>
                {isProcessing ? <><div className="spinner"></div> CONFIRMING...</> : <>CONFIRM BOOKING <ArrowRight size={16}/></>}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Success ── */}
        {step === 5 && (
          <div className="booking-step-content success-step animate-bounce-in" ref={successRef}>
            <div className="success-roamers">
              <div className="s-roamer s-star-1">⭐</div><div className="s-roamer s-star-2">🌟</div>
              <div className="s-roamer s-alien-1">👽</div><div className="s-roamer s-alien-2">👾</div>
              <div className="s-roamer s-rocket">🚀</div><div className="s-roamer s-ufo">🛸</div>
            </div>
            <div className="success-icon-container">
              <div className="success-ring"></div><div className="success-ring ring-2"></div>
              <PartyPopper size={70} color="#C7FF00" className="success-party-icon" />
            </div>
            <h2 className="step-title celebration-title"><span className="celebrate-emoji">🎉</span>BOOKING SUBMITTED!<span className="celebrate-emoji">🎊</span></h2>
            <p className="step-subtitle">Your payment is being verified. You'll be notified once confirmed!</p>

            <div className="success-ticket-card glass-morphism">
              <div className="ticket-header">
                <div className="ticket-park-badge"><img src={selectedPark.image} alt={selectedPark.name} className="ticket-park-thumb" /></div>
                <div className="ticket-park-info">
                  <h3>{selectedPark.name}</h3>
                  <p>{isWonderla && formData.wonderlaLocation ? WONDERLA_LOCATIONS.find(l => l.value === formData.wonderlaLocation)?.label : selectedPark.location}</p>
                </div>
              </div>
              <div className="ticket-divider"><div className="ticket-notch left"></div><div className="ticket-dash"></div><div className="ticket-notch right"></div></div>
              <div className="ticket-details-grid">
                <div className="ticket-detail"><span className="detail-label">Name</span><span className="detail-value">{formData.name}</span></div>
                <div className="ticket-detail"><span className="detail-label">Visit Date</span><span className="detail-value">{new Date(formData.visitDate).toLocaleDateString('en-IN')}</span></div>
                <div className="ticket-detail"><span className="detail-label">Members</span><span className="detail-value">{formData.adultTickets} Adults{formData.kidsTickets > 0 ? `, ${formData.kidsTickets} Kids` : ''}</span></div>
                <div className="ticket-detail"><span className="detail-label">Amount</span><span className="detail-value highlight">₹{totalAmount}</span></div>
              </div>
              <div className="booking-status-strip pending-strip">
                <span>⏳ STATUS: PENDING VERIFICATION</span>
              </div>
              {bookingResult && (
                <div className="booking-id-strip"><span>Booking ID: <strong>{bookingResult.bookingId}</strong></span></div>
              )}
            </div>

            <div className="email-confirmation-box">
              <Smartphone size={20} />
              <p>Your booking has been submitted. Our team will verify the payment and send your ticket via WhatsApp. 🚀</p>
            </div>
            <button className="btn-primary celebration-btn" onClick={onClose}><PartyPopper size={20} /> AWESOME, GOT IT! 🚀</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
