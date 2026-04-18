import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, Coins, Calendar, MapPin, CheckCircle, Ticket, PartyPopper } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import './SpinWheel.css';

const parks = [
  { id: 1, name: "VGP UNIVERSAL KINGDOM", location: "Chennai, Tamil Nadu" },
  { id: 2, name: "MGM DIZZEE WORLD", location: "Chennai, Tamil Nadu" },
  { id: 3, name: "QUEENS LAND", location: "Poonamallee, Chennai" },
  { id: 4, name: "BLACK THUNDER", location: "Mettupalayam, Coimbatore" },
  { id: 5, name: "WONDERLA", location: "Bengaluru, Karnataka" }
];

const SECTIONS = [
  { label: 'TRY AGAIN', color: '#1e293b', value: 0, type: 'miss' },
  { label: '10', color: '#FF00E6', value: 10, type: 'coins' },
  { label: '20', color: '#00D1FF', value: 20, type: 'coins' },
  { label: 'TRY AGAIN', color: '#1e293b', value: 0, type: 'miss' },
  { label: '30', color: '#FFB600', value: 30, type: 'coins' },
  { label: '40', color: '#00FF88', value: 40, type: 'coins' },
  { label: 'TRY AGAIN', color: '#1e293b', value: 0, type: 'miss' },
  { label: '50', color: '#C7FF00', value: 50, type: 'coins' },
];

const SpinWheel = ({ isOpen, onClose }) => {
  const { user, interceptAuth, spinWheelRequest, syncUser } = useAuth();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [step, setStep] = useState('spin'); // spin, select-park, select-date, success
  const [selectedPark, setSelectedPark] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  
  if (!isOpen) return null;

  const handleSpin = () => {
    if (isSpinning) return;
    
    interceptAuth(async () => {
      try {
        setIsSpinning(true);
        setPrize(null);
        setErrorMsg('');
        
        const { prizeCoins, updatedUser } = await spinWheelRequest();
        
        const possibleIndices = SECTIONS.map((s, i) => s.value === prizeCoins ? i : -1).filter(i => i !== -1);
        const targetIndex = possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
        
        const degreesPerSection = 360 / SECTIONS.length;
        const targetMod = 360 - (targetIndex * degreesPerSection);
        const offset = (Math.random() * 0.6 - 0.3) * degreesPerSection;
        
        const currentMod = rotation % 360;
        let diff = targetMod - currentMod + offset;
        if (diff < 0) diff += 360;
        
        const extraSpins = 5 + Math.floor(Math.random() * 3);
        const totalRotation = rotation + (360 * extraSpins) + diff;
        
        setRotation(totalRotation);
        
        setTimeout(() => {
          setIsSpinning(false);
          setPrize(SECTIONS[targetIndex]);
          syncUser(updatedUser);
          
          if (prizeCoins > 0) {
            confetti({
              particleCount: 200,
              spread: 100,
              colors: ['#C7FF00', '#BF00FF', '#00D1FF', '#FF0055']
            });
          }
        }, 5000);
      } catch (err) {
        setIsSpinning(false);
        setErrorMsg(err.message);
      }
    });
  };

  const resetWheel = () => {
    setPrize(null);
    setIsSpinning(false);
    setStep('spin');
    setSelectedPark(null);
    setSelectedDate('');
  };

  const handleClaim = () => {
    setStep('select-park');
  };

  const handleIssueTicket = () => {
    if (!selectedPark || !selectedDate) return;
    
    // Deduct coins if it's a milestone claim (not a golden ticket)
    if (prize?.type !== 'ticket') {
      addCoins(-100000);
    }
    
    // Add booking to context
    addBooking({
      parkId: selectedPark.id,
      parkName: selectedPark.name,
      date: selectedDate,
      tickets: 1,
      total: 0,
      payment: 'SPAR COINS',
      isFree: true
    });
    
    // Fire celebration
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#C7FF00', '#BF00FF', '#00D1FF', '#FF0055']
    });
    
    setStep('success');
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
    <div className="spin-wheel-overlay">
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

      <div className={`spin-wheel-modal glass-morphism compact-mode ${step === 'success' ? 'pop-in' : ''}`}>
        <button className="spin-wheel-close" onClick={onClose}>
          <X size={28} />
        </button>

        {step === 'spin' && (
          <>
            <div className="spin-wheel-header">
              <h2 className="text-white-shimmer-rtl">SPAR WHEEL</h2>
              <p>Test your luck Ranger! Earn coins for free tickets.</p>
            </div>

            <div className="wheel-container">
              <div className="wheel-indicator">
                <svg viewBox="0 0 40 40">
                  <path d="M20 40 L5 10 L35 10 Z" fill="#C7FF00" />
                </svg>
              </div>
              <div 
                className="wheel-main" 
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                {SECTIONS.map((section, i) => (
                  <div 
                    key={i} 
                    className="wheel-segment" 
                    style={{ 
                      '--rotate': `${i * (360 / SECTIONS.length)}deg`,
                      '--bg': section.color
                    }}
                  >
                    <div className="segment-label">{section.label}</div>
                  </div>
                ))}
              </div>
              <div className="wheel-center">
                <Trophy size={30} color="#1e293b" />
              </div>

              {prize !== null && (
                <div id="win-announcement">
                  <div className="win-text">
                    {prize.value > 0 ? `+${prize.value} COINS!` : 'BETTER LUCK NEXT TIME!'}
                  </div>
                  {prize.value > 0 && <div className="win-subtext" style={{color: 'white', fontWeight: 900, textShadow: '0 2px 4px black', fontSize: '1.2rem', marginTop: '10px'}}>COLLECT 10K COINS FOR 10% DISCOUNT!</div>}
                </div>
              )}
            </div>

            {errorMsg && <p className="text-[#FF0055] font-bold text-center mb-4">{errorMsg}</p>}

            <div className="spin-wheel-controls">
              <div className="spar-coins-display">
                <Coins size={24} color="#C7FF00" />
                <span className="coins-count">{user?.sparCoins || 0}</span>
                <span className="coins-label">SPAR COINS</span>
              </div>

              <button 
                className="btn-spin-start" 
                onClick={handleSpin}
                disabled={isSpinning || prize !== null}
              >
                {isSpinning ? 'SPINNING...' : prize ? 'COME BACK TOMORROW!' : 'TAP TO SPIN'}
              </button>
            </div>
          </>
        )}

        {step === 'select-park' && (
          <div className="selection-step pop-in">
            <h3>SELECT PARK SITE</h3>
            <div className="park-select-grid">
              {parks.map(park => (
                <div 
                  key={park.id}
                  className={`park-select-item ${selectedPark?.id === park.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPark(park)}
                >
                  <MapPin size={20} className={selectedPark?.id === park.id ? 'text-[#C7FF00]' : 'text-gray-500'} />
                  <p className="mt-2 text-white font-bold text-xs">{park.name}</p>
                  <span>{park.location}</span>
                </div>
              ))}
            </div>
            <button 
              className="btn-spin-start mt-4" 
              disabled={!selectedPark}
              onClick={() => setStep('select-date')}
            >
              NEXT STEP
            </button>
          </div>
        )}

        {step === 'select-date' && (
          <div className="selection-step pop-in">
            <h3>PICK YOUR VISIT DATE</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-white mb-2">
                <Calendar size={20} color="#C7FF00" />
                <span>Choose when you want to explore <strong>{selectedPark.name}</strong>:</span>
              </div>
              <input 
                type="date" 
                className="date-select-input" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <button 
              className="btn-spin-start mt-8" 
              disabled={!selectedDate}
              onClick={handleIssueTicket}
            >
              FINALIZE TICKET
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="victory-screen pop-in">
            <div className="victory-glow"></div>
            
            <div className="poppers-overlay">
              <PartyPopper className="popper-icon p1" size={40} color="#BF00FF" />
              <PartyPopper className="popper-icon p2" size={40} color="#00D1FF" />
              <PartyPopper className="popper-icon p3" size={40} color="#C7FF00" />
            </div>

            <div className="mission-pass-card">
              <div className="card-header">
                <Ticket size={40} color="#C7FF00" className="ticket-badge-icon" />
              </div>
              <div className="card-body">
                <h2 className="victory-title text-white-shimmer-rtl">TICKET READY!</h2>
                <div className="victory-divider"></div>
                <div className="mission-info">
                   <div className="info-row">
                     <MapPin size={16} />
                     <span>{selectedPark.name}</span>
                   </div>
                   <div className="info-row">
                     <Calendar size={16} />
                     <span>{selectedDate}</span>
                   </div>
                </div>
              </div>
              <div className="card-footer">
                <div className="barcode-victory"></div>
              </div>
            </div>

            <p className="victory-text">
              Congratulations Ranger! Your digital pass has been uploaded to your profile logs. 
              Prepare for departure!
            </p>
            
            <div className="victory-coins-summary">
              <Coins size={20} color="#FFD700" />
              <span className="current-balance">{user?.sparCoins?.toLocaleString()}</span>
              <span className="balance-label">SPAR COINS REMAINING</span>
            </div>

            <button className="btn-primary victory-loop-btn" onClick={resetWheel}>
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpinWheel;
