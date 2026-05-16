import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Gift, Calendar, Clock, Ticket as TicketIcon, MapPin, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './FlappyBuzz.css';
import heroVideo from '../assets/hero-video.mp4';

// Simple Web Audio Synthesizer for retro games
const playTone = (freq, type, duration, vol = 0.1, delay = 0) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
    
    // Envelope
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + delay + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start(audioCtx.currentTime + delay);
    oscillator.stop(audioCtx.currentTime + delay + duration);
  } catch (e) {
    // Audio Context not allowed yet
  }
};

const playFlap = () => playTone(300, 'sine', 0.2, 0.1);
const playScore = () => {
  playTone(800, 'triangle', 0.1, 0.1);
  playTone(1200, 'triangle', 0.2, 0.1, 0.1);
};
const playWin = () => {
  const notes = [440, 554, 659, 880]; // A major arpeggio
  notes.forEach((freq, i) => playTone(freq, 'square', 0.2, 0.1, i * 0.15));
  playTone(1108, 'square', 0.6, 0.1, notes.length * 0.15); // High finish
};

const parks = [
  'Wonderla',
  'Black Thunder',
  'MGM',
  'VGP Universal Kingdom',
  'Queens Land'
];

const generateTicketId = () => {
  return 'SPAR-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + new Date().getFullYear();
};

const FlappyBuzz = () => {
  // State from previous setup: 'LOADING', 'START', 'INTRO', 'COUNTDOWN', 'PLAYING', 'GAME_OVER'
  // Added new states: 'WIN_CELEBRATION', 'TICKET_FORM', 'TICKET_CARD'
  const [gameStatus, setGameStatus] = useState('LOADING'); 
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [birdPos, setBirdPos] = useState(250);
  const [tilt, setTilt] = useState(0);
  const [pipes, setPipes] = useState([]);
  const [isInitialWait, setIsInitialWait] = useState(true);
  const [ticketClaimed, setTicketClaimed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [attempStatus, setAttemptStatus] = useState(null); // { attempts: 0, lastPlayed: Date }
  const [attemptsToday, setAttemptsToday] = useState(0);

  const { user, interceptAuth, addBooking, recordGameScoreRequest, syncUser } = useAuth();

  const getAttemptsToday = useCallback(() => {
    const userId = user?.email || 'guest';
    const data = localStorage.getItem(`flappyBuzzAttempts_${userId}`);
    if (!data) return 0;
    try {
      const parsed = JSON.parse(data);
      if (parsed.date === new Date().toDateString()) {
        return parsed.attempts;
      }
    } catch (e) {}
    return 0;
  }, [user?.email]);

  const incrementAttempts = useCallback(() => {
    const userId = user?.email || 'guest';
    const attempts = getAttemptsToday();
    const newAttempts = attempts + 1;
    localStorage.setItem(`flappyBuzzAttempts_${userId}`, JSON.stringify({
      date: new Date().toDateString(),
      attempts: newAttempts
    }));
    setAttemptsToday(newAttempts);
  }, [user?.email, getAttemptsToday]);
  
  // Player state
  const [formData, setFormData] = useState({
    park: 'Wonderla',
    date: '',
    timeSlot: 'Morning (10AM - 2PM)'
  });

  const [finalTicket, setFinalTicket] = useState(null);
  const [gameReward, setGameReward] = useState(null);

  const birdPosRef = useRef(250);
  const velocityRef = useRef(0);
  const pipesRef = useRef([]);
  const requestRef = useRef();
  const gameStatusRef = useRef('START');
  const introTimeout = useRef(null);
  
  const GRAVITY = 0.5; // Slightly smoother gravity
  const JUMP_FORCE = -7.5; // Smooth jump
  const PIPE_SPEED = 4;
  const PIPE_GAP = 180; // slightly wider than 160 for mobile 
  // Base fixed resolution logic
  const GAME_HEIGHT = 450;
  const GAME_WIDTH = 800;
  const WINNING_SCORE = 100;

  // Difficulty Scaling Logic
  const getDifficulty = (s) => {
    if (s >= 99) {
       return { gap: 0, speed: 10, spawnRate: 100 }; // STRICTLY IMPOSSIBLE
    }
    const level = Math.floor(s / 10);
    return {
      gap: Math.max(180 - (level * 18), 75), // Extremely narrow gap at high scores
      speed: 4 + (level * 1.5), // Rapidly increasing speed
      spawnRate: Math.max(250 - (level * 20), 100) // Pipes spawn very close
    };
  };

  useEffect(() => {
    // Check if user already won in this session
    if (sessionStorage.getItem('floppyBirdTicket')) {
      setTicketClaimed(true);
    }
    setAttemptsToday(getAttemptsToday());
  }, [getAttemptsToday]);

  useEffect(() => {
    if (gameStatus === 'LOADING') {
      const loader = setTimeout(() => {
        setGameStatus('START');
        gameStatusRef.current = 'START';
      }, 2500);
      return () => clearTimeout(loader);
    }
  }, [gameStatus]);

  useEffect(() => {
    gameStatusRef.current = gameStatus;
  }, [gameStatus]);

  const updateGame = () => {
    if (gameStatusRef.current !== 'PLAYING') return;

    // Physics
    velocityRef.current += GRAVITY;
    birdPosRef.current += velocityRef.current;
    
    // Tilt Calculation
    const newTilt = Math.min(Math.max(velocityRef.current * 4, -20), 90);
    setTilt(newTilt);

    // Floor/Ceiling Collision
    if (birdPosRef.current >= GAME_HEIGHT || birdPosRef.current <= 0) {
      endGame(false);
      return;
    }

    setBirdPos(birdPosRef.current);

    // Difficulty
    const diff = getDifficulty(score);

    // Pipes Movement & Spawning
    if (pipesRef.current.length === 0 || pipesRef.current[pipesRef.current.length - 1].x < GAME_WIDTH - diff.spawnRate) {
      const newPipe = {
        x: GAME_WIDTH,
        height: Math.floor(Math.random() * (GAME_HEIGHT - diff.gap - 100)) + 50,
        gap: diff.gap,
        passed: false
      };
      pipesRef.current.push(newPipe);
    }

    pipesRef.current = pipesRef.current
      .map(p => ({ ...p, x: p.x - diff.speed }))
      .filter(p => p.x > -100);

    // Collision Detection
    const hasCollided = pipesRef.current.some(p => 
      p.x < 100 && p.x > 40 && // Ship x area
      (birdPosRef.current < p.height || birdPosRef.current + 30 > p.height + p.gap)
    );

    if (hasCollided) {
      endGame(false);
      return;
    }

    // Score Tracking
    let scoreIncreased = false;
    pipesRef.current.forEach(p => {
      if (!p.passed && p.x < 50) {
        p.passed = true;
        setScore(s => s + 1);
        scoreIncreased = true;
      }
    });

    if (scoreIncreased) playScore();

    setPipes([...pipesRef.current]);
    requestRef.current = requestAnimationFrame(updateGame);
  };

  useEffect(() => {
    if (gameStatus === 'PLAYING') {
      requestRef.current = requestAnimationFrame(updateGame);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameStatus, isInitialWait]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Win Condition
    if (score >= WINNING_SCORE && gameStatus === 'PLAYING') {
      endGame(true);
    }
  }, [score, gameStatus]);

  const jump = () => {
    if (gameStatus === 'START') {
      if (attemptsToday >= 3) {
        setGameStatus('GAME_OVER');
        gameStatusRef.current = 'GAME_OVER';
        setErrorMsg('Daily attempt limit (3/3) reached. Come back tomorrow!');
        return;
      }
      
      incrementAttempts();

      if (introTimeout.current) clearTimeout(introTimeout.current);
      
      setGameStatus('COUNTDOWN');
      gameStatusRef.current = 'COUNTDOWN';
      setCountdown(3);
      
      // Step 2: 3, 2, 1, GO sequence
      setTimeout(() => setCountdown(2), 800);
      setTimeout(() => setCountdown(1), 1600);
      setTimeout(() => setCountdown('GO!'), 2400);
      
      // Step 3: Start PLAYING
      setTimeout(() => {
        birdPosRef.current = 200;
        velocityRef.current = 0;
        pipesRef.current = [];
        setBirdPos(200);
        setPipes([]);
        setIsInitialWait(true); // Wait for first tap
        setGameStatus('PLAYING');
        gameStatusRef.current = 'PLAYING';
      }, 3200);      
    } else if (gameStatus === 'PLAYING') {
      if (isInitialWait) setIsInitialWait(false);
      velocityRef.current = JUMP_FORCE;
      playFlap();
    }
  };

  const endGame = (isWin) => {
    cancelAnimationFrame(requestRef.current);
    if (isWin) {
      playWin();
      setGameStatus('WIN_CELEBRATION');
      gameStatusRef.current = 'WIN_CELEBRATION';
      
      if (!ticketClaimed) {
        // Form will be shown integrated into WIN_CELEBRATION
      }
    } else {
      setGameStatus('GAME_OVER');
      gameStatusRef.current = 'GAME_OVER';
      
      // Record Score to track attempts and potentially award the IMPOSSIBLE REWARD
      interceptAuth(async () => {
        try {
          const data = await recordGameScoreRequest(score);
          if (data.reward === 'FREE_TICKET') setGameReward('FREE_TICKET');
          syncUser(data.updatedUser);
        } catch (err) {
          setErrorMsg(err.message);
        }
      });
    }
  };

  const restart = () => {
    if (introTimeout.current) clearTimeout(introTimeout.current);
    setScore(0);
    setBirdPos(200);
    setPipes([]);
    birdPosRef.current = 200;
    velocityRef.current = 0;
    pipesRef.current = [];
    setIsInitialWait(true);
    setErrorMsg('');
    setAttemptsToday(getAttemptsToday());
    setGameStatus('START');
    gameStatusRef.current = 'START';
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.date) return;
    
    // Require authentication before generating the ticket
    interceptAuth(() => {
      const newTicket = {
        ...formData,
        id: generateTicketId(),
        payment: 'FREE',
        totalPrice: 0,
        tickets: 1
      };
      
      addBooking(newTicket);
      
      setFinalTicket(newTicket);
      setGameStatus('TICKET_CARD');
      gameStatusRef.current = 'TICKET_CARD';
      
      sessionStorage.setItem('floppyBirdTicket', true);
      setTicketClaimed(true);
    });
  };

  return (
    <section className="flappy-game-section" id="experiences">
      <div className="section-header">
        <p className="section-indicator">CHALLENGE</p>
        <h2 className="section-title text-white-shimmer-rtl flex items-center justify-center gap-3">
          SPACE RANGER FLIGHT! 
          <span className="inline-block" style={{ width: '40px', height: '40px', filter: 'drop-shadow(0 0 8px rgba(255, 85, 0, 0.6))' }}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <path d="M4.5 16.5c-1.5 1.25-2 4.5-2 4.5s3.25-.5 4.5-2" stroke="#FF5500" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 7s-1.414-1.414-2-2c-2.314-2.314-5.5-2.5-5.5-2.5s.186 3.186 2.5 5.5c.586.586 2 2 2 2" stroke="#E2E8F0" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 15s-1.414-1.414-2-2c-2.314-2.314-5.5-2.5-5.5-2.5s.186 3.186 2.5 5.5c.586.586 2 2 2 2" stroke="#E2E8F0" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="m11 13 4 4" stroke="#FFD700" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="m13 11 4 4" stroke="#FFD700" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="m21 3-9 9" stroke="#00D1FF" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </h2>
        <p className="section-subtitle mt-2">
          GOAL: REACH 100 POINTS TO UNLOCK A FREE TICKET REWARD!
        </p>
        {ticketClaimed && (
           <div className="ticket-claimed-badge" style={{color: 'var(--primary-light-green)', fontSize: '0.8rem', marginTop:'10px', fontWeight: 'bold'}}>
             <CheckCircle size={14} style={{display:'inline', verticalAlign: 'middle'}}/> You've claimed your ticket for this session!
           </div>
        )}
      </div>

      {/* Responsive Game Wrapper enforces aspect ratio on mobile */}
      <div className="game-wrapper">
        <div className={`game-container ${gameStatus.toLowerCase()}`} onClick={jump}>
          {/* Amusement Park Background Layers */}
          <div className="parallax-bg layer-sky"></div>
          <div className="parallax-bg layer-clouds"></div>
          <div className="parallax-bg layer-rides"></div>
          <div className="parallax-bg layer-ground"></div>

          {['PLAYING', 'GAME_OVER', 'WIN_CELEBRATION'].includes(gameStatus) && (
            <div className="score-display">
              <span className="score-label">SCORE:</span>
              <span className="score-value">{score}</span>
              <span className="score-target">/ {WINNING_SCORE}</span>
            </div>
          )}
          
          {/* 3D Cute Bird Entity */}
          {['START', 'PLAYING', 'GAME_OVER', 'WIN_CELEBRATION'].includes(gameStatus) && (
              <div 
                className={`floppy-bird ${gameStatus === 'GAME_OVER' ? 'dead' : ''}`} 
                style={{ 
                  transform: `translateY(${birdPos}px) rotate(${tilt}deg)`
                }}
              >
                <div className="bird-body">
                  <div className="bird-eye"></div>
                  <div className="bird-wing"></div>
                </div>
              </div>
           )}

          {/* Pipes -> Energy Gates (GPU Optimized) */}
          {pipes.map((pipe, i) => (
            <React.Fragment key={i}>
              <div 
                className="carnival-pillar top" 
                style={{ 
                  transform: `translateX(${pipe.x}px)`, 
                  height: pipe.height, 
                  width: 70 
                }}
              >
                <div className="pillar-cap top"></div>
              </div>
              <div 
                className="carnival-pillar bottom" 
                style={{ 
                  transform: `translateX(${pipe.x}px)`, 
                  top: pipe.height + pipe.gap, 
                  height: GAME_HEIGHT - pipe.height - pipe.gap, 
                  width: 70 
                }}
              >
                <div className="pillar-cap bottom"></div>
              </div>
            </React.Fragment>
          ))}

          {/* 0. LOADING SCREEN (Giant Wheel) */}
          {gameStatus === 'LOADING' && (
            <div className="game-overlay start-screen backdrop-blur" style={{background: 'linear-gradient(to top, #1e3a8a, #0f172a)'}}>
              <div className="giant-wheel-loader relative w-24 h-24 mb-6">
                 <div className="wheel-rim w-full h-full border-4 border-dashed border-amber-400 rounded-full animate-spin-slow absolute top-0 left-0"></div>
                 <div className="wheel-center w-4 h-4 bg-red-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                 <div className="wheel-stand w-1 h-12 bg-gray-400 absolute bottom-[-40px] left-1/2 transform -translate-x-1/2 origin-top" style={{clipPath: 'polygon(50% 0, 100% 100%, 0 100%)', width: '20px', bottom: '-40px'}}></div>
              </div>
              <h2 className="pulse-text mt-8 text-white font-bold tracking-widest text-xl uppercase">Calibrating Engines...</h2>
            </div>
          )}

          {/* 1. START SCREEN */}
          {gameStatus === 'START' && (
            <div className="game-overlay start-screen backdrop-blur overflow-hidden">
              {/* Dynamic Roaming Elements */}
              <div className="space-background-container" style={{ opacity: 0.8 }}>
                {[
                  { id: 1, type: 'buzz', x: '20%', y: '30%', size: 80, delay: '0s', duration: '20s' },
                  { id: 2, type: 'alien', x: '80%', y: '20%', size: 50, delay: '2s', duration: '18s' },
                  { id: 3, type: 'star', x: '10%', y: '70%', size: 20, delay: '1s', duration: '12s' },
                  { id: 4, type: 'star', x: '90%', y: '80%', size: 25, delay: '4s', duration: '14s' },
                  { id: 5, type: 'star', x: '50%', y: '15%', size: 15, delay: '6s', duration: '10s' },
                  { id: 6, type: 'alien', x: '15%', y: '10%', size: 45, delay: '3s', duration: '16s' },
                  { id: 7, type: 'star', x: '40%', y: '90%', size: 22, delay: '0s', duration: '13s' },
                ].map(el => (
                  <div 
                    key={el.id} 
                    className={`floating-element ${el.type}`}
                    style={{ 
                      left: el.x, 
                      top: el.y, 
                      '--duration': el.duration, 
                      '--delay': el.delay,
                      width: el.size,
                      height: el.size,
                      zIndex: 1
                    }}
                  >
                    {el.type === 'buzz' && (
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 10px rgba(199, 255, 0, 0.6))' }}>
                        {/* Simplified Buzz-like Astronaut */}
                        <path d="M12 2a5 5 0 0 1 5 5v3a7 7 0 0 1-14 0V7a5 5 0 0 1 5-5z" fill="#E2E8F0" />
                        <path d="M12 4a3 3 0 0 1 3 3v2a6 6 0 0 1-12 0V7a3 3 0 0 1 3-3z" fill="#00D1FF" opacity="0.4" />
                        <path d="M7 14h10l1 4-6 2-6-2 1-4z" fill="#C7FF00" />
                        <path d="M3 13l4-2M21 13l-4-2" stroke="#BF00FF" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="9" cy="7" r="0.5" fill="white" />
                        <circle cx="15" cy="7" r="0.5" fill="white" />
                      </svg>
                    )}
                    {el.type === 'alien' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2a5 5 0 0 1 5 5v2a7 7 0 0 1-14 0V7a5 5 0 0 1 5-5z" strokeLinecap="round" strokeLinejoin="round" fill="var(--primary-light-green)" fillOpacity="0.2"/>
                        <path d="M6 13a4 4 0 0 0 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
                        <circle cx="15" cy="9" r="1.5" fill="currentColor"/>
                        <path d="M12 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" fill="currentColor"/>
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

              <div className="bounce-container relative z-10 flex flex-col items-center justify-center gap-6 w-full mt-8">
                <h2 className="text-white-shimmer-navy-ltr" style={{fontSize: '2.8rem', textAlign: 'center', lineHeight: '1.1'}}>ENGAGE ENGINES!</h2>
                {attemptsToday >= 3 ? (
                  <div className="start-hint highlight-box" style={{backgroundColor: '#e11d48', color: '#fff', border: 'none', fontSize: '0.9rem'}}>DAILY LIMIT REACHED. COME BACK TOMORROW!</div>
                ) : (
                  <div className="flex gap-4 items-center justify-center flex-wrap">
                    <div className="start-hint highlight-box" style={{margin: 0, fontSize: '0.85rem'}}>REACH {WINNING_SCORE} POINTS FOR FREE REWARD!</div>
                    <div className="text-white font-bold" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)', fontSize: '0.85rem', background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.2)', margin: 0}}>
                       ATTEMPTS LEFT TODAY: <span style={{color: '#C7FF00'}}>{3 - attemptsToday}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}



          {/* 3. COUNTDOWN */}
          {gameStatus === 'COUNTDOWN' && (
            <div className="game-overlay countdown-screen">
              <h1 className="countdown-text" key={countdown}>{countdown}</h1>
            </div>
          )}

          {/* 4. GAME OVER */}
          {gameStatus === 'GAME_OVER' && (
            <div className="game-overlay glass-panel failure">
              <h2 className="shake-text glitch-red">CRASHED!</h2>
              {gameReward === 'FREE_TICKET' && (
                <div className="victory-popup pop-in bg-[#FFD700] text-black px-4 py-2 rounded-full font-black text-sm mt-4">
                  🏆 UNBELIEVABLE! YOU WON A FREE TICKET!
                </div>
              )}
              {errorMsg && <p className="text-red-500 text-xs mt-2">{errorMsg}</p>}
              <p style={{color:'#fff', marginTop: '10px'}}>The ride doesn't stop here. Get back up!</p>
              <button onClick={(e) => { e.stopPropagation(); restart(); }} className="btn-primary mt-4">
                TRY AGAIN
              </button>
            </div>
          )}

          {/* 5. WIN CELEBRATION */}
          {gameStatus === 'WIN_CELEBRATION' && (
            <div className="game-overlay glass-panel win-screen" onClick={(e) => e.stopPropagation()}>
               <div className="victory-glow"></div>
               <div className="poppers-overlay">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`popper-icon p${i+1}`}>🎉</div>
                  ))}
               </div>
               
               <div className="win-content-card pop-in">
                 <h1 className="win-title gold-text">MISSION ACCOMPLISHED!</h1>
                 <h2 className="win-bold-statement">YOU HAVE WON A FREE TICKET FOR AN AMUSEMENT PARK! 🎉</h2>
                 
                 {!ticketClaimed ? (
                   <div className="integrated-booking mt-6 px-4">
                     <p className="integrated-subtitle text-sm mb-4 opacity-70">SELECT YOUR TICKET DETAILS BELOW:</p>
                     <form onSubmit={handleFormSubmit} className="reward-form text-left space-y-4">
                        <div className="form-group">
                           <label className="text-xs font-bold mb-1 block"><MapPin size={14} className="inline mr-1"/> Select Park</label>
                           <select value={formData.park} onChange={(e) => setFormData({...formData, park: e.target.value})} className="modern-input w-full py-2 text-sm">
                             {parks.map(p => <option key={p} value={p}>{p}</option>)}
                           </select>
                        </div>
                        <div className="flex gap-4">
                           <div className="form-group flex-1">
                              <label className="text-xs font-bold mb-1 block"><Calendar size={14} className="inline mr-1"/> Date</label>
                              <input type="date" required value={formData.date} min={new Date().toISOString().split('T')[0]} onChange={(e) => setFormData({...formData, date: e.target.value})} className="modern-input w-full py-2 text-sm" />
                           </div>
                           <div className="form-group flex-1">
                              <label className="text-xs font-bold mb-1 block"><Clock size={14} className="inline mr-1"/> Time</label>
                              <select value={formData.timeSlot} onChange={(e) => setFormData({...formData, timeSlot: e.target.value})} className="modern-input w-full py-2 text-sm">
                                <option>Morning (10AM - 1PM)</option>
                                <option>Afternoon (1PM - 4PM)</option>
                                <option>Evening (4PM - 7PM)</option>
                              </select>
                           </div>
                        </div>
                        <button type="submit" className="btn-primary w-full mt-4 py-3 submit-pulse flex items-center justify-center gap-2">
                           <TicketIcon size={20}/> CONFIRM FREE PASS
                        </button>
                     </form>
                   </div>
                 ) : (
                   <p className="win-subtitle-alt">Ticket Claimed! Ready for another flight?</p>
                 )}
               </div>

               {ticketClaimed && (
                 <button onClick={(e) => { e.stopPropagation(); restart(); }} className="btn-primary mt-6">
                   PLAY AGAIN FOR FUN
                 </button>
               )}
            </div>
          )}

          {/* 6. TICKET BOOKING FORM UI */}
          {gameStatus === 'TICKET_FORM' && (
            <div className="game-overlay glass-panel form-screen" onClick={(e) => e.stopPropagation()}>
               <div className="booking-form-card pop-in">
                 <h2 className="form-title text-black">CLAIM YOUR REWARD</h2>
                 <p className="form-subtitle text-black opacity-70 mb-4 text-sm">Select when and where you want to go!</p>
                 
                 <form onSubmit={handleFormSubmit} className="reward-form text-left">
                   <div className="form-group mb-4">
                     <label className="text-black font-bold text-sm mb-1 block"><MapPin size={14} className="inline mr-1"/> Select Park</label>
                     <select value={formData.park} onChange={(e) => setFormData({...formData, park: e.target.value})} className="modern-input w-full">
                       {parks.map(p => <option key={p} value={p}>{p}</option>)}
                     </select>
                   </div>
                   
                   <div className="form-row flex gap-4 mb-4">
                     <div className="form-group flex-1">
                       <label className="text-black font-bold text-sm mb-1 block"><Calendar size={14} className="inline mr-1"/> Date</label>
                       <input type="date" required value={formData.date} min={new Date().toISOString().split('T')[0]} onChange={(e) => setFormData({...formData, date: e.target.value})} className="modern-input w-full" />
                     </div>
                     <div className="form-group flex-1">
                       <label className="text-black font-bold text-sm mb-1 block"><Clock size={14} className="inline mr-1"/> Time</label>
                       <select value={formData.timeSlot} onChange={(e) => setFormData({...formData, timeSlot: e.target.value})} className="modern-input w-full">
                         <option>Morning (10AM - 1PM)</option>
                         <option>Afternoon (1PM - 4PM)</option>
                         <option>Evening (4PM - 7PM)</option>
                       </select>
                     </div>
                   </div>

                   <button type="submit" className="btn-primary w-full mt-2 submit-pulse flex items-center justify-center gap-2">
                     <Ticket size={20}/> CONFIRM TICKET
                   </button>
                 </form>
               </div>
            </div>
          )}

          {/* 7. DIGITAL TICKET CARD */}
          {gameStatus === 'TICKET_CARD' && finalTicket && (
            <div className="game-overlay ticket-screen glass-panel" onClick={(e) => e.stopPropagation()}>
              <h2 className="success-badge scale-in flex items-center justify-center gap-2 text-white font-bold text-xl mb-4">
                <CheckCircle size={28} color="var(--primary-light-green)"/> Ticket Claimed!
              </h2>
              
              <div className="digital-ticket-container flip-in">
                 <div className="ticket-body">
                    <div className="ticket-brand tracking-widest text-xs font-bold opacity-60">SPAR AMUSEMENTS</div>
                    <div className="ticket-park font-black text-2xl mt-1 text-black">{finalTicket.park.toUpperCase()}</div>
                    
                    <div className="ticket-details mt-5 flex justify-between text-black">
                      <div className="detail-col text-left">
                        <span className="label block text-[10px] font-bold opacity-50 tracking-wider">DATE</span>
                        <span className="value font-bold text-sm">{new Date(finalTicket.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="detail-col text-left">
                        <span className="label block text-[10px] font-bold opacity-50 tracking-wider">SLOT</span>
                        <span className="value font-bold text-sm">{finalTicket.timeSlot.split(' ')[0]}</span>
                      </div>
                      <div className="detail-col text-right">
                        <span className="label block text-[10px] font-bold opacity-50 tracking-wider">GUEST</span>
                        <span className="value font-bold text-sm">1 VIP PASS</span>
                      </div>
                    </div>
                 </div>
                 
                 <div className="ticket-divider"></div>
                 
                 <div className="ticket-stub text-center p-4">
                    <div className="qr-code-mock mx-auto bg-black p-1 rounded-md">
                      {/* Fake CSS QR Code Grid */}
                      <div className="grid grid-cols-4 grid-rows-4 gap-1 w-full h-full opacity-80">
                         {/* Generate some random blocks for aesthetic */}
                         {[...Array(16)].map((_, i) => <div key={i} className={`bg-white rounded-[1px] ${Math.random() > 0.3 ? 'opacity-100' : 'opacity-0'}`}></div>)}
                      </div>
                    </div>
                    <div className="ticket-id tracking-widest font-mono text-xs mt-3 text-black font-bold">{finalTicket.id}</div>
                 </div>
              </div>
              
              <p className="text-white text-xs mt-6 opacity-80 info-disclaimer">Take a screenshot of your ticket! It will be verified at the entrance.</p>
              
              <button onClick={(e) => { e.stopPropagation(); restart(); }} className="btn-outline mt-5">
                Return to Arcade
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FlappyBuzz;
