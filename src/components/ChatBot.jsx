import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './ChatBot.css';

const chatbotKnowledge = {
  greetings: ['Hello!', 'Hi there!', 'Welcome to SPAR Amusements! How can I help you today?'],
  parks: {
    vgp: 'VGP Universal Kingdom is open from 11:00 AM to 7:30 PM. Tickets are ₹1200 for adults.',
    mgm: 'MGM Dizzee World is famous for its "Dizzee" rides. Opens at 10:30 AM. Tickets are ₹1000.',
    queensland: 'Queens Land has 51 rides! It\'s open from 10:00 AM to 6:30 PM. Tickets are ₹850.',
    wonderla: 'Wonderla Bangalore is a top-rated park. Opens at 11:00 AM. Tickets start at ₹1500.',
    blackthunder: 'Black Thunder is the premier water park in Mettupalayam. Opens at 10:00 AM. Tickets are ₹950.'
  },
  pricing: 'Ticket prices range from ₹850 to ₹1500 depending on the park. We offer group discounts for 15+ members.',
  timings: 'Most parks open around 10:30 AM and close by 7:30 PM. Specific timings are available on each park\'s card.',
  default: 'I\'m not sure about that. Would you like to know about our park timings, ticket prices, or specific parks like VGP, MGM, or Wonderla?'
};

const parkRates = {
  vgp: 1200,
  mgm: 1000,
  queensland: 850,
  blackthunder: 950,
  wonderla: 1500
};

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showShoutout, setShowShoutout] = useState(true);
  const [step, setStep] = useState('NAME'); // Workflow step: NAME, EMAIL, PHONE, PARK, TICKETS, READY_PAY, PAYMENT, COMPLETE
  const [rangerData, setRangerData] = useState({ name: '', email: '', phone: '', park: '', tickets: 1, totalPrice: 0, payment: '' });
  const [messages, setMessages] = useState([
    { id: 1, text: "Greetings Cadet! 🚀 I'm Buzz Lightyear, your Space Ranger assistant. To start your mission, what is your NAME?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isCelebration, setIsCelebration] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasSpokenGreeting, setHasSpokenGreeting] = useState(false);
  const messagesEndRef = useRef(null);
  const { interceptAuth, addBooking } = useAuth();

  const buzzAvatar = "/buzz1.jfif"; // Custom Buzz avatar from your desktop

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      const preferredVoices = voices.filter(v => v.lang.includes('en') && (v.name.includes('Google UK English Male') || v.name.includes('Microsoft Mark') || v.name.includes('David') || v.name.includes('Guy')));
      if (preferredVoices.length > 0) {
        utterance.voice = preferredVoices[0];
      }
      utterance.pitch = 0.85; // Deeper voice fit for a Space Ranger
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !hasSpokenGreeting && messages.length > 0) {
      speakText(messages[0].text);
      setHasSpokenGreeting(true);
    }
  }, [isOpen, hasSpokenGreeting, messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMsg = { id: messages.length + 1, text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Process Workflow Steps
    setTimeout(() => {
      let botResponse = "";
      let nextStep = step;

      switch (step) {
        case 'NAME':
          setRangerData(prev => ({ ...prev, name: inputValue }));
          botResponse = `Roger that, Ranger ${inputValue}! 🎖️ Now, what is your EMAIL for mission updates?`;
          nextStep = 'EMAIL';
          break;
        case 'EMAIL':
          setRangerData(prev => ({ ...prev, email: inputValue }));
          botResponse = "Mission frequency locked! 📶 And what is your CONTACT NUMBER for backup?";
          nextStep = 'PHONE';
          break;
        case 'PHONE':
          setRangerData(prev => ({ ...prev, phone: inputValue }));
          botResponse = "Communication lines established! 📡 Which THEME PARK would you like to visit? (VGP, MGM, Queens Land, Black Thunder, or Wonderla)";
          nextStep = 'PARK';
          break;
        case 'PARK':
          const inputPark = inputValue.toLowerCase().replace(/\s/g, '');
          const parkKey = Object.keys(parkRates).find(k => inputPark.includes(k)) || 'vgp';
          setRangerData(prev => ({ ...prev, park: parkKey }));
          botResponse = `Target acquired: ${parkKey.toUpperCase()}! 🛰️ How many CADETS (tickets) are joining this mission?`;
          nextStep = 'TICKETS';
          break;
        case 'TICKETS':
          const count = parseInt(inputValue) || 1;
          const total = count * parkRates[rangerData.park || 'vgp'];
          setRangerData(prev => ({ ...prev, tickets: count, totalPrice: total }));
          botResponse = `Mission cost calculated! 💰 Total price for ${count} tickets is ₹${total}. Ready to proceed with payment? GPAY or CARD?`;
          nextStep = 'PAYMENT';
          break;
        case 'PAYMENT':
          const payType = inputValue.toUpperCase().includes('GPAY') ? 'GPAY' : 'CARD';
          interceptAuth(() => {
            setRangerData(prev => ({ ...prev, payment: payType }));
            const ticketCount = parseInt(rangerData.tickets, 10) || 1;
            
            // Record Booking into DB
            addBooking({
              id: `SPAR-${Math.floor(Math.random() * 90000) + 10000}`,
              park: 'SPAR Amusements HQ',
              payment: payType,
              totalPrice: ticketCount * 1200, // Roughly 1200 INR per ticket assumed
              tickets: ticketCount,
              date: new Date().toLocaleDateString()
            });

            setStep('COMPLETE');
            setIsCelebration(true);
            setTimeout(() => setIsCelebration(false), 5000);
            const paymentMsg = `PAYMENT COMPLETED! 💳 Energy credits received via ${payType}. Your mission is a GO! 🎆`;
            setMessages(prev => [...prev, { id: Date.now(), text: paymentMsg, sender: 'bot' }]);
            speakText(paymentMsg);
            setIsTyping(false);
            setInputValue('');
          });
          return; // Exit normal flow to let interceptAuth handle execution timing
        default:
          botResponse = "Mission status: ACTIVE! 🚀 To Infinity and Beyond!";
      }

      setStep(nextStep);
      const newBotMessage = { id: messages.length + 2, text: botResponse, sender: 'bot' };
      setMessages(prev => [...prev, newBotMessage]);
      speakText(botResponse);
      setIsTyping(false);
      setInputValue('');
    }, 1000);
  };

  const handleRatingSubmit = (stars) => {
    setRating(stars);
    setHasRated(true);
    const ratingMsg = `Mission rated ${stars} Stars! Thank you for the feedback, Ranger! 🌟`;
    setMessages(prev => [...prev, { id: Date.now(), text: ratingMsg, sender: 'bot' }]);
    speakText(ratingMsg);
    setTimeout(() => {
      setStep('GREETING'); // Reset back to normal chat mode after rating
    }, 2000);
  };

  return (
    <div className={`chatbot-wrapper ${isOpen ? 'open' : ''}`}>
      {/* Celebration Overlay */}
      {isCelebration && (
        <div className="mission-celebration">
          <div className="celebration-content">
            <h1 className="mission-title">MISSION SUCCESS!</h1>
            <p className="mission-sub">Energy Credits Received. To Infinity & Beyond! 🚀</p>
            <div className="confetti-particles">
              {[...Array(20)].map((_, i) => <div key={i} className={`particle p${i}`}></div>)}
            </div>
          </div>
        </div>
      )}
      {!isOpen && (
        <div className={`chatbot-toggle-wrapper ${showShoutout && !isOpen ? 'has-shoutout' : ''}`}>
          {showShoutout && !isOpen && (
            <div className="chatbot-shoutout" onClick={() => { setIsOpen(true); setShowShoutout(false); }}>
              {/* Decorative Stars */}
              <div className="shoutout-stars">
                <Star size={8} className="s1" fill="currentColor" />
                <Star size={12} className="s2" fill="currentColor" />
                <Star size={6} className="s3" fill="currentColor" />
                <Star size={10} className="s4" fill="currentColor" />
              </div>
              <button className="shoutout-close" onClick={(e) => { e.stopPropagation(); setShowShoutout(false); }}>
                <X size={10} />
              </button>
              <div className="shoutout-sender">
                <span className="signal-dot"></span>
                <span className="shoutout-name">Buzz Lightyear</span>
              </div>
              <div className="shoutout-text">
                📞 Mission Frequency Active!<br />
                Ready to book your adventure?
              </div>
              <div className="shoutout-footer">
                <span>🟢 Online</span> · Tap to reply
              </div>
            </div>
          )}
          <button className="chatbot-toggle" onClick={() => { setIsOpen(!isOpen); setShowShoutout(false); }}>
            <img src={buzzAvatar} alt="Buzz" className="toggle-buzz-img" />
            <div className="pulse-indicator"></div>
          </button>
        </div>
      )}

      {isOpen && (
        <div className="chatbot-container glass-morphism">
          {/* Space Theme Background */}
          <div className="space-bg-elements">
            <div className="bg-star bg-star-1"></div>
            <div className="bg-star bg-star-2"></div>
            <div className="bg-star bg-star-3"></div>
            <div className="bg-star bg-star-4"></div>
            <div className="bg-star bg-star-5"></div>
            <div className="bg-rocket">🚀</div>
            <div className="shooting-star"></div>
          </div>

          <div className="chatbot-header">
            <div className="header-info">
              <div className="avatar-wrapper">
                <img src={buzzAvatar} alt="Buzz" className="buzz-avatar-img" />
                <div className="status-dot"></div>
              </div>
              <div>
                <h3>Buzz Lightyear</h3>
                <p>Space Ranger Assistant</p>
              </div>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.sender}`}>
                <div className={`message-bubble ${msg.sender === 'bot' ? 'glass-morphism' : ''}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message-row bot">
                <div className="typing-indicator glass-morphism">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{borderTop: '1px solid rgba(255,255,255,0.1)'}}>
            {step === 'COMPLETE' && !hasRated ? (
              <div style={{padding: '16px', textAlign: 'center', background: '#0F111A'}}>
                <p style={{fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', opacity: 0.8, marginBottom: '12px', letterSpacing: '1px'}}>RATE YOUR MISSION EXPERIENCE ⭐</p>
                <div style={{display: 'flex', justifyContent: 'center', gap: '8px'}}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star}
                      onClick={() => handleRatingSubmit(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{background: 'transparent', border: 'none', cursor: 'pointer', transition: 'transform 0.2s'}}
                      className="star-btn"
                    >
                      <Star 
                        size={28} 
                        fill={star <= (hoverRating || rating) ? "#C7FF00" : "transparent"} 
                        color={star <= (hoverRating || rating) ? "#C7FF00" : "rgba(255,255,255,0.3)"} 
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="chatbot-input">
                <input
                  type="text"
                  placeholder="Ask about parks, tickets..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={step === 'COMPLETE'}
                />
                <button className="send-btn" onClick={handleSendMessage} disabled={step === 'COMPLETE'}>
                  <Send size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
