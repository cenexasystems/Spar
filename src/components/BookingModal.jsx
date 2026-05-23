import React, { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Phone, Ticket, Search, Smartphone, CheckCircle, ArrowRight, ArrowLeft, PartyPopper, MapPin, Calendar, Upload, Image, Copy } from 'lucide-react';
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

const WONDERLA_PRICES = {
  normal: {
    adult: 1489,
    child: 1191,
    senior: 946,
    infant: 0
  },
  fasttrack: {
    adult: 2019,
    child: 1615,
    senior: 0,
    infant: 0
  }
};

const BookingModal = ({ isOpen, onClose, selectedPark }) => {
  const { user, deductCoinsRequest } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', adultTickets: 1, kidsTickets: 0, referral: 'friends', visitDate: '', wonderlaLocation: 'bengaluru',
    whatsapp: '', ticketType: 'normal', adultCount: 1, childCount: 0, seniorCount: 0, infantCount: 0, buffetSelected: false, lockerSelected: false, termsAccepted: false
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [rewardSelection, setRewardSelection] = useState({ type: 'none', coins: 0, benefit: 0 });
  const [bookingResult, setBookingResult] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [screenshotUploaded, setScreenshotUploaded] = useState(false);
  
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [copied, setCopied] = useState(false);

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
      setCouponInput('');
      setAppliedCoupon(null);
      setCouponError('');
      setCopied(false);
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

  const getWonderlaSubtotal = () => {
    const prices = WONDERLA_PRICES[formData.ticketType || 'normal'];
    const adultSub = (formData.adultCount || 0) * prices.adult;
    const childSub = (formData.childCount || 0) * prices.child;
    const seniorSub = formData.ticketType === 'normal' ? (formData.seniorCount || 0) * prices.senior : 0;
    return adultSub + childSub + seniorSub;
  };

  const getWonderlaTotals = () => {
    const prices = WONDERLA_PRICES[formData.ticketType || 'normal'];
    const adultPriceVal = prices.adult;
    const childPriceVal = prices.child;
    const seniorPriceVal = formData.ticketType === 'normal' ? prices.senior : 0;

    const adultTickets = formData.adultCount || 0;
    const childTickets = formData.childCount || 0;
    const seniorTickets = formData.ticketType === 'normal' ? (formData.seniorCount || 0) : 0;

    let baseAmount = (adultTickets * adultPriceVal) + (childTickets * childPriceVal) + (seniorTickets * seniorPriceVal);
    
    let coinsDiscount = 0;
    if (rewardSelection.type === 'discount') {
      coinsDiscount = Math.round((adultPriceVal * rewardSelection.benefit) / 100);
    } else if (rewardSelection.type === 'free') {
      coinsDiscount = adultPriceVal;
    }
    
    const ticketSubtotal = Math.max(0, baseAmount - coinsDiscount);
    
    const buffetCount = formData.buffetSelected ? (adultTickets + childTickets + seniorTickets) : 0;
    const buffetTotal = buffetCount * 470;
    const lockerTotal = formData.lockerSelected ? 100 : 0;
    
    const subtotal = ticketSubtotal + buffetTotal + lockerTotal;
    
    let couponDiscount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percent') {
        couponDiscount = Math.round(subtotal * (appliedCoupon.value / 100));
      } else if (appliedCoupon.type === 'flat') {
        couponDiscount = Math.min(appliedCoupon.value, subtotal);
      }
    }
    
    const convenienceFee = 99;
    const finalTotal = Math.max(0, subtotal - couponDiscount + convenienceFee);
    
    return {
      adultPrice: adultPriceVal,
      childPrice: childPriceVal,
      seniorPrice: seniorPriceVal,
      adultTickets,
      childTickets,
      seniorTickets,
      buffetCount,
      buffetTotal,
      lockerTotal,
      subtotal,
      coinsDiscount,
      couponDiscount,
      convenienceFee,
      finalTotal
    };
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    setCouponError('');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${API_URL}/coupons/validate`, {
        code,
        parkId: selectedPark?.name || 'all'
      });
      
      const { valid, discountType, discountValue } = response.data;
      if (valid) {
        setAppliedCoupon({ 
          code, 
          type: discountType === 'percentage' ? 'percent' : 'flat', 
          value: discountValue 
        });
        setCouponError('');
      }
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || 'Invalid coupon');
    }
  };

  const currentTotal = isWonderla ? getWonderlaTotals().finalTotal : totalAmount;

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  // Validate Step 1
  const validateStep1 = (e) => {
    e.preventDefault();
    if (isWonderla) {
      if (!formData.whatsapp) {
        alert('Please enter a WhatsApp number');
        return;
      }
      if (!formData.wonderlaLocation) {
        alert('Please select a Wonderla location');
        return;
      }
      if (formData.adultCount === 0 && formData.childCount === 0) {
        alert('Please select at least 1 adult or child visitor');
        return;
      }
      if (!formData.termsAccepted) {
        alert('Please agree to the cancellation policy');
        return;
      }
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
      const prefix = isWonderla ? 'WDL' : selectedPark.name.split(' ')[0].substring(0, 3).toUpperCase();
      const { data: order } = await axios.post(`${API_URL}/payment/create-order`, {
        parkName: selectedPark.name, parkId: selectedPark._id || selectedPark.id,
        tickets: isWonderla ? (formData.adultCount + formData.childCount + formData.seniorCount) : (formData.adultTickets + formData.kidsTickets),
        adultTickets: isWonderla ? formData.adultCount : formData.adultTickets,
        childTickets: isWonderla ? formData.childCount : formData.kidsTickets,
        totalAmount: currentTotal, paymentMethod: 'gpay', parkPrefix: prefix,
        wonderlaLocation: formData.wonderlaLocation, visitDate: formData.visitDate,
        userEmail: formData.email, userPhone: formData.phone,
        whatsapp: formData.whatsapp,
        ticketType: formData.ticketType,
        seniorTickets: isWonderla ? formData.seniorCount : 0,
        buffetCount: isWonderla && formData.buffetSelected ? (formData.adultCount + formData.childCount + formData.seniorCount) : 0,
        lockerSelected: isWonderla && formData.lockerSelected ? true : false,
        couponApplied: appliedCoupon ? appliedCoupon.code : '',
        discountAmount: isWonderla ? getWonderlaTotals().couponDiscount : 0
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
            {[1,2,3,4,5].map(s => (
              <React.Fragment key={s}>
                <div className={`progress-dot ${step >= s ? 'active' : ''}`}><span>{s}</span></div>
                {s < 5 && <div className={`progress-line ${step > s ? 'filled' : ''}`}></div>}
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

              {/* Wonderla Specific WhatsApp Number Field */}
              {isWonderla && (
                <div className="form-group-row" style={{ marginTop: '4px' }}>
                  <div className="form-input-wrapper">
                    <label>📱 WHATSAPP NUMBER</label>
                    <input type="tel" value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} placeholder="Enter WhatsApp number" required />
                    <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Your ticket will be delivered to this number</span>
                  </div>
                </div>
              )}

              {/* Wonderla Specific Ticket Type Selector */}
              {isWonderla && (
                <div className="wonderla-location-section" style={{ marginTop: '14px' }}>
                  <label className="wonderla-loc-label">🎟️ SELECT TICKET TYPE</label>
                  <div className="wonderla-locations-grid">
                    <button type="button"
                      className={`wonderla-loc-card ${formData.ticketType === 'normal' ? 'selected' : ''}`}
                      onClick={() => setFormData({...formData, ticketType: 'normal'})}
                    >
                      <span className="loc-name">NORMAL ENTRY</span>
                      <span className="loc-desc">Access to all rides | 11AM–6PM</span>
                      <span className="loc-desc" style={{ color: '#00D1FF', fontWeight: 'bold', marginTop: '4px' }}>
                        Adult ₹1,489 | Child ₹1,191 | Senior ₹946
                      </span>
                    </button>
                    <button type="button"
                      className={`wonderla-loc-card ${formData.ticketType === 'fasttrack' ? 'selected' : ''}`}
                      onClick={() => setFormData({...formData, ticketType: 'fasttrack', seniorCount: 0})}
                    >
                      <span className="loc-name">FAST TRACK</span>
                      <span className="loc-desc">Skip the queues | Priority access</span>
                      <span className="loc-desc" style={{ color: '#00D1FF', fontWeight: 'bold', marginTop: '4px' }}>
                        Adult ₹2,019 | Child ₹1,615
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Wonderla Specific Visitor Steppers */}
              {isWonderla && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="wonderla-loc-label">👥 NUMBER OF VISITORS</label>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    
                    {/* Row 1: Adults */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>Adults (above 140cm)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '11px', color: '#00D1FF', fontWeight: 700 }}>@ ₹{formData.ticketType === 'fasttrack' ? '2,019' : '1,489'} each</span>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#090B11', borderRadius: '8px', padding: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, adultCount: Math.max(0, prev.adultCount - 1) }))} style={{ background: 'none', border: 'none', color: '#C7FF00', fontWeight: 'bold', fontSize: '16px', padding: '0 8px', cursor: 'pointer' }}>−</button>
                          <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{formData.adultCount}</span>
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, adultCount: prev.adultCount + 1 }))} style={{ background: 'none', border: 'none', color: '#C7FF00', fontWeight: 'bold', fontSize: '16px', padding: '0 8px', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Children */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: formData.ticketType === 'normal' ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>Children (85cm–140cm)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '11px', color: '#00D1FF', fontWeight: 700 }}>@ ₹{formData.ticketType === 'fasttrack' ? '1,615' : '1,191'} each</span>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#090B11', borderRadius: '8px', padding: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, childCount: Math.max(0, prev.childCount - 1) }))} style={{ background: 'none', border: 'none', color: '#C7FF00', fontWeight: 'bold', fontSize: '16px', padding: '0 8px', cursor: 'pointer' }}>−</button>
                          <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{formData.childCount}</span>
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, childCount: prev.childCount + 1 }))} style={{ background: 'none', border: 'none', color: '#C7FF00', fontWeight: 'bold', fontSize: '16px', padding: '0 8px', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Senior Citizens */}
                    {formData.ticketType === 'normal' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>Senior Citizens (60+)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '11px', color: '#00D1FF', fontWeight: 700 }}>@ ₹946 each</span>
                          <div style={{ display: 'flex', alignItems: 'center', background: '#090B11', borderRadius: '8px', padding: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, seniorCount: Math.max(0, prev.seniorCount - 1) }))} style={{ background: 'none', border: 'none', color: '#C7FF00', fontWeight: 'bold', fontSize: '16px', padding: '0 8px', cursor: 'pointer' }}>−</button>
                            <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{formData.seniorCount}</span>
                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, seniorCount: prev.seniorCount + 1 }))} style={{ background: 'none', border: 'none', color: '#C7FF00', fontWeight: 'bold', fontSize: '16px', padding: '0 8px', cursor: 'pointer' }}>+</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Row 4: Children Free */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>Children (below 85cm)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '11px', color: '#6BCB77', fontWeight: 700 }}>FREE — no ticket needed</span>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#090B11', borderRadius: '8px', padding: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, infantCount: Math.max(0, prev.infantCount - 1) }))} style={{ background: 'none', border: 'none', color: '#C7FF00', fontWeight: 'bold', fontSize: '16px', padding: '0 8px', cursor: 'pointer' }}>−</button>
                          <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{formData.infantCount}</span>
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, infantCount: prev.infantCount + 1 }))} style={{ background: 'none', border: 'none', color: '#C7FF00', fontWeight: 'bold', fontSize: '16px', padding: '0 8px', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Running Total display */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#94A3B8', letterSpacing: '1px' }}>TOTAL TICKETS AMOUNT</span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: '#C7FF00' }}>₹{getWonderlaSubtotal().toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

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

              {/* Standard visitor counters (only for non-Wonderla) */}
              {!isWonderla && (
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
              )}

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

              {/* Wonderla Cancellation Policy terms */}
              {isWonderla && (
                <div className="terms-checkbox-container" style={{ margin: '15px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <input type="checkbox" id="terms" checked={formData.termsAccepted} onChange={(e) => setFormData({...formData, termsAccepted: e.target.checked})} style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#C7FF00' }} />
                  <label htmlFor="terms" style={{ fontSize: '11px', color: '#94A3B8', cursor: 'pointer', lineHeight: '1.4' }}>
                    I agree to the cancellation policy — tickets once booked are non-refundable
                  </label>
                </div>
              )}

              <button type="submit" className="btn-primary next-btn" disabled={isWonderla && (!formData.termsAccepted || (formData.adultCount === 0 && formData.childCount === 0))}>
                REVIEW ORDER <ArrowRight size={20}/>
              </button>
            </form>
          </div>
        )}

        {/* ── Step 2: Review & Confirm ── */}
        {step === 2 && (() => {
          const totals = getWonderlaTotals();
          return (
            <div className="booking-step-content animate-fade-in consolidated-step">
              <h2 className="step-title">REVIEW & PAY 📱</h2>
              <p className="step-subtitle text-xs">Verify your booking details then proceed to payment.</p>

              {/* Wonderla Optional Add-ons section in Step 2 */}
              {isWonderla && (
                <div className="addons-section mb-4" style={{ borderRadius: '12px', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 900, color: '#C7FF00', letterSpacing: '1.5px', marginBottom: '10px' }}>⚡ CHOOSE OPTIONAL ADD-ONS</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button type="button"
                      className={`wonderla-loc-card ${formData.buffetSelected ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, buffetSelected: !prev.buffetSelected }))}
                      style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer', border: formData.buffetSelected ? '1.5px solid #C7FF00' : '1.5px solid rgba(255,255,255,0.1)', background: formData.buffetSelected ? 'rgba(199,255,0,0.1)' : 'rgba(0,0,0,0.3)', borderRadius: '8px' }}
                    >
                      <span className="loc-name" style={{ fontSize: '12px', fontWeight: '800', color: '#fff' }}>🍔 Buffet Combo</span>
                      <span className="loc-desc" style={{ fontSize: '10px', color: '#94A3B8' }}>₹470 per person</span>
                    </button>
                    <button type="button"
                      className={`wonderla-loc-card ${formData.lockerSelected ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, lockerSelected: !prev.lockerSelected }))}
                      style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer', border: formData.lockerSelected ? '1.5px solid #C7FF00' : '1.5px solid rgba(255,255,255,0.1)', background: formData.lockerSelected ? 'rgba(199,255,0,0.1)' : 'rgba(0,0,0,0.3)', borderRadius: '8px' }}
                    >
                      <span className="loc-name" style={{ fontSize: '12px', fontWeight: '800', color: '#fff' }}>🔑 Locker Rental</span>
                      <span className="loc-desc" style={{ fontSize: '10px', color: '#94A3B8' }}>₹100 flat rate</span>
                    </button>
                  </div>
                </div>
              )}

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
                  
                  {isWonderla ? (
                    <>
                      <div className="bill-row"><span className="bill-label">🎟️ TICKET TYPE</span><span className="bill-value" style={{ color: '#00D1FF', fontWeight: 'bold' }}>{formData.ticketType === 'fasttrack' ? 'Fast Track' : 'Normal'}</span></div>
                      {totals.adultTickets > 0 && <div className="bill-row"><span className="bill-label">Adults</span><span className="bill-value">{totals.adultTickets} × ₹{totals.adultPrice} = ₹{totals.adultTickets * totals.adultPrice}</span></div>}
                      {totals.childTickets > 0 && <div className="bill-row"><span className="bill-label">Children</span><span className="bill-value">{totals.childTickets} × ₹{totals.childPrice} = ₹{totals.childTickets * totals.childPrice}</span></div>}
                      {totals.seniorTickets > 0 && <div className="bill-row"><span className="bill-label">Sr.Citizens</span><span className="bill-value">{totals.seniorTickets} × ₹{totals.seniorPrice} = ₹{totals.seniorTickets * totals.seniorPrice}</span></div>}
                      {formData.infantCount > 0 && <div className="bill-row"><span className="bill-label">Infants (&lt;85cm)</span><span className="bill-value">{formData.infantCount} × FREE</span></div>}
                      {totals.buffetCount > 0 && <div className="bill-row"><span className="bill-label">🍔 Buffet Combo</span><span className="bill-value">{totals.buffetCount} × ₹470 = ₹{totals.buffetTotal}</span></div>}
                      {formData.lockerSelected && <div className="bill-row"><span className="bill-label">🔑 Locker Rental</span><span className="bill-value">₹100</span></div>}
                      {totals.coinsDiscount > 0 && <div className="bill-row"><span className="bill-label" style={{ color: '#C7FF00' }}>✨ Spar Coins Discount</span><span className="bill-value" style={{ color: '#C7FF00' }}>-₹{totals.coinsDiscount}</span></div>}
                      {totals.couponDiscount > 0 && <div className="bill-row"><span className="bill-label" style={{ color: '#6BCB77' }}>🏷️ Coupon Discount ({appliedCoupon.code})</span><span className="bill-value" style={{ color: '#6BCB77' }}>-₹{totals.couponDiscount}</span></div>}
                      
                      <div style={{ margin: '8px 0', borderTop: '1px dashed rgba(255,255,255,0.1)' }}></div>
                      <div className="bill-row"><span className="bill-label">Subtotal</span><span className="bill-value">₹{totals.subtotal}</span></div>
                      <div className="bill-row"><span className="bill-label">Convience fee</span><span className="bill-value">₹{totals.convenienceFee}</span></div>
                      <div className="bill-row total mt-2"><span className="text-xs font-black">TOTAL</span><span className="text-lg font-black" style={{ color: '#C7FF00', fontSize: '1.4rem' }}>₹{totals.finalTotal}</span></div>
                    </>
                  ) : (
                    <>
                      <div className="bill-row"><span className="bill-label">🎟️ adults</span><span className="bill-value">{formData.adultTickets} × ₹{adultPrice}</span></div>
                      {formData.kidsTickets > 0 && <div className="bill-row"><span className="bill-label">👶 kids</span><span className="bill-value">{formData.kidsTickets} × ₹{kidsPrice}</span></div>}
                      <div className="bill-row total mt-2"><span className="text-xs font-black">TOTAL</span><span className="text-lg font-black text-lime-400">₹{totalAmount}</span></div>
                    </>
                  )}
                </div>
              </div>

              {/* Wonderla Coupon Code Section */}
              {isWonderla && (
                <div className="coupon-code-section glass-morphism p-3 mb-4 border border-[#00D1FF]/20" style={{ borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <label style={{ fontSize: '11px', fontWeight: 900, color: '#00D1FF', letterSpacing: '1.5px', display: 'block', marginBottom: '8px' }}>
                    🏷️ HAVE A COUPON CODE?
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value);
                        setCouponError('');
                      }}
                      placeholder="Enter coupon code (e.g. SPAR20, WDL10)"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1.5px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      style={{
                        padding: '8px 16px',
                        background: '#00D1FF',
                        color: '#000',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.2s'
                      }}
                    >
                      APPLY
                    </button>
                  </div>
                  {appliedCoupon && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                      <p style={{ color: '#6BCB77', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ✅ {appliedCoupon.code} applied! You save ₹{totals.couponDiscount}
                      </p>
                      <button onClick={() => { setAppliedCoupon(null); setCouponInput(''); }} style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                        ✕ Remove
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p style={{ color: '#FF6B6B', fontSize: '12px', fontWeight: 'bold', marginTop: '8px' }}>
                      ❌ {couponError}
                    </p>
                  )}
                </div>
              )}

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
                  {isProcessing ? <><div className="spinner"></div> PROCESSING...</> : <>PROCEED TO PAY ₹{currentTotal} <ArrowRight size={16}/></>}
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── Step 3: Show QR + Pay ── */}
        {step === 3 && (
          <div className="booking-step-content animate-fade-in">
            <h2 className="step-title">SCAN & PAY 📲</h2>
            <p className="step-subtitle text-xs">Scan the QR code using <strong>Google Pay</strong> or any UPI app to pay <strong>₹{orderData?.amount}</strong></p>

            {/* Wonderla Monospace Order ID Banner */}
            {isWonderla && orderData?.bookingId && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px', background: 'rgba(0,209,255,0.06)', border: '1px solid rgba(0,209,255,0.15)', padding: '10px 16px', borderRadius: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>Order ID:</span>
                <span style={{ fontFamily: 'Courier New, monospace', fontSize: '15px', fontWeight: 'bold', color: '#00D1FF', letterSpacing: '1px' }}>
                  {orderData.bookingId}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(orderData.bookingId);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{ background: 'none', border: 'none', color: '#00D1FF', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                  title="Copy Order ID"
                >
                  <Copy size={16} />
                </button>
                {copied && <span style={{ fontSize: '11px', color: '#6BCB77', fontWeight: 'bold' }}>Copied!</span>}
              </div>
            )}

            <div className="qr-display-container">
              <img src="/gpay_qr.jpg" alt="GPay QR Code" className="gpay-qr-image" />
              <p className="qr-upi-text">UPI ID: {orderData?.upiId}</p>
              <p className="qr-amount-text">Amount: ₹{orderData?.amount}</p>
              {appliedCoupon && (
                <p style={{ fontSize: '11px', color: '#6BCB77', marginTop: '4px', fontWeight: 'bold' }}>
                  (incl. {appliedCoupon.code} discount)
                </p>
              )}
            </div>

            {orderData?.upiString && (
              <a href={orderData.upiString} className="gpay-deeplink-btn">📱 Open Google Pay App</a>
            )}

            {/* WhatsApp Delivery Message */}
            {isWonderla && (
              <p style={{ textAlign: 'center', fontSize: '12px', color: '#94A3B8', margin: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', lineHeight: '1.4' }}>
                ⏱️ Your ticket will be sent to your WhatsApp within 2–4 hours after payment verification.
              </p>
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
            <p className="step-subtitle text-xs">
              {isWonderla ? "Upload your UPI payment screenshot. Accepted: GPay, PhonePe, Paytm, any UPI app." : "Upload a screenshot of your GPay payment confirmation."}
            </p>

            {/* Wonderla Monospace Booking ID Banner */}
            {isWonderla && orderData?.bookingId && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px', background: 'rgba(0,209,255,0.06)', border: '1px solid rgba(0,209,255,0.15)', padding: '10px 16px', borderRadius: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>Booking ID:</span>
                <span style={{ fontFamily: 'Courier New, monospace', fontSize: '15px', fontWeight: 'bold', color: '#00D1FF', letterSpacing: '1px' }}>
                  {orderData.bookingId}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(orderData.bookingId);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{ background: 'none', border: 'none', color: '#00D1FF', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                  title="Copy Booking ID"
                >
                  <Copy size={16} />
                </button>
                {copied && <span style={{ fontSize: '11px', color: '#6BCB77', fontWeight: 'bold' }}>Copied!</span>}
              </div>
            )}

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

            {/* Wonderla Specific File Validation Note */}
            {isWonderla && (
              <p style={{ textAlign: 'center', fontSize: '11px', color: '#94A3B8', marginTop: '4px', marginBottom: '12px' }}>
                JPG, PNG, WebP • Max 5MB • Payment must match Booking ID: <strong style={{ color: '#00D1FF' }}>{orderData?.bookingId}</strong>
              </p>
            )}

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
        {step === 5 && (() => {
          const getMembersString = () => {
            if (isWonderla) {
              const parts = [];
              if (formData.adultCount > 0) parts.push(`${formData.adultCount} Adult(s)`);
              if (formData.childCount > 0) parts.push(`${formData.childCount} Child(ren)`);
              if (formData.seniorCount > 0) parts.push(`${formData.seniorCount} Senior(s)`);
              if (formData.infantCount > 0) parts.push(`${formData.infantCount} Infant(s)`);
              return parts.join(', ');
            } else {
              return `${formData.adultTickets} Adults${formData.kidsTickets > 0 ? `, ${formData.kidsTickets} Kids` : ''}`;
            }
          };

          return (
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
                    <p>{isWonderla && formData.wonderlaLocation ? WONDERLA_LOCATIONS.find(l => l.value === formData.wonderlaLocation)?.label + ' — ' + WONDERLA_LOCATIONS.find(l => l.value === formData.wonderlaLocation)?.desc : selectedPark.location}</p>
                  </div>
                </div>
                <div className="ticket-divider"><div className="ticket-notch left"></div><div className="ticket-dash"></div><div className="ticket-notch right"></div></div>
                <div className="ticket-details-grid">
                  <div className="ticket-detail"><span className="detail-label">Name</span><span className="detail-value">{formData.name}</span></div>
                  <div className="ticket-detail"><span className="detail-label">Visit Date</span><span className="detail-value">{new Date(formData.visitDate).toLocaleDateString('en-IN')}</span></div>
                  <div className="ticket-detail"><span className="detail-label">Members</span><span className="detail-value">{getMembersString()}</span></div>
                  {appliedCoupon && (
                    <div className="ticket-detail" style={{ gridColumn: '1 / -1', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                      <span className="detail-label">COUPON APPLIED</span>
                      <span className="detail-value" style={{ color: '#6BCB77' }}>{appliedCoupon.code} (−₹{getWonderlaTotals().couponDiscount})</span>
                    </div>
                  )}
                  <div className="ticket-detail"><span className="detail-label">Amount</span><span className="detail-value highlight">₹{currentTotal}</span></div>
                  {isWonderla && formData.whatsapp && (
                    <div className="ticket-detail" style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '4px' }}>
                      <span className="detail-label">WHATSAPP</span>
                      <span className="detail-value" style={{ color: '#00D1FF' }}>{formData.whatsapp}</span>
                    </div>
                  )}
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
                <p>
                  {isWonderla 
                    ? "Your booking is confirmed with us! Our team will verify your payment proof and send your digital ticket to your WhatsApp number within 2–4 hours. For support: WhatsApp us at +91 98887 XXXXX" 
                    : "Your booking has been submitted. Our team will verify the payment and send your ticket via WhatsApp. 🚀"}
                </p>
              </div>
              <button className="btn-primary celebration-btn" onClick={onClose}><PartyPopper size={20} /> AWESOME, GOT IT! 🚀</button>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default BookingModal;
