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
    wonderla: 'Wonderla Chennai is a top-rated park. Opens at 11:00 AM. Tickets start at ₹1500.',
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
  const { user, interceptAuth, addBooking } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showShoutout, setShowShoutout] = useState(true);
  const [step, setStep] = useState('CHAT'); // We only need conversational step now unless rating
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasSpokenGreeting, setHasSpokenGreeting] = useState(false);
  const messagesEndRef = useRef(null);

  const buzzAvatar = "/buzz1.jfif";

  // Initialize messages with user's name
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { id: 1, text: `Hi ${user?.name ? user.name.split(' ')[0] : 'there'}! 👋 I'm Buzz Lightyear, your Park Assistant. I can help with SPAR Coins, Ticket Discounts, the FlappyBuzz Game, or general booking support. How can I help you?`, sender: 'bot' }
      ]);
    }
  }, [user, messages.length]);

  const speakText = (text) => {
    // Voice mode disabled as per request
    return;
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

    const userMsg = { id: Date.now(), text: inputValue.trim(), sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    const inputForBot = inputValue;
    setInputValue('');

    setTimeout(() => {
      const lower = inputForBot.toLowerCase();
      let reply = '';

      if (/^(hi|hello|hey)$/.test(lower) || lower.includes('how are you')) {
        reply = "Hello there! 👋 I'm Buzz Lightyear, your Park Assistant. I can help you with SPAR Coins, Ticket Discounts, the FlappyBuzz Game, or general booking support. What would you like to know?";
      }
      else if (lower.includes('coin') || lower.includes('spar coin') || lower.includes('earn')) {
        reply = "SPAR Coins are our park's loyalty currency! 💰 You can earn them by playing our Spin Wheel on the website. Your coins accumulate directly in your account and you can save them up for huge discounts!";
      } 
      else if (lower.includes('claim') || lower.includes('discount') || lower.includes('redeem')) {
        reply = "You can redeem your SPAR Coins during online booking! Every 10,000 coins gives you a 10% discount (up to 90%). ❗ Important Rule: The discount applies to ONLY ONE ticket in your entire booking. The remaining tickets are charged at full price.";
      }
      else if (lower.includes('free ticket') || lower.includes('game') || lower.includes('flappy') || lower.includes('play')) {
        reply = "There are two ways to get a FREE pass! 🎟️\n\n1. Play 'SPACE RANGER FLIGHT'. Score 100 points to win instantly! (You get 3 attempts per day, and difficulty scales wildly every 10 points!).\n2. Redeem 100,000 SPAR Coins at checkout. ❗ Remember: The free pass applies to exactly 1 ticket, even if you are booking for a large group.";
      }
      else if (lower.includes('book') || lower.includes('pay') || lower.includes('ticket') || lower.includes('qr') || lower.includes('upi')) {
        reply = "Booking a ticket is super fast:\n1. Choose your park & date.\n2. Review your bill & add SPAR Coin discounts.\n3. Scan the secure GPay/UPI QR code & pay.\n4. Enter the 12-digit UTR.\n\nYour confirmed ticket will be sent securely via WhatsApp!";
      }
      else if (lower.includes('whatsapp') || lower.includes('human') || lower.includes('agent') || lower.includes('failed') || lower.includes('issue')) {
         reply = "For account specific issues, failed payments, or speaking to a human agent, please securely message our dedicated WhatsApp Customer Support: +91 9876543210. They can resolve complex issues instantly!";
      }
      else {
        reply = "I'm just a space ranger and that query is a little too complex for me! 😅 For account issues or advanced questions, please contact our human team directly via WhatsApp support.";
      }

      const newBotMessage = { id: Date.now() + 1, text: reply, sender: 'bot' };
      setMessages(prev => [...prev, newBotMessage]);
      speakText(reply);
      setIsTyping(false);
    }, 800);
  };

  const handleRatingSubmit = (stars) => {
    setRating(stars);
    setHasRated(true);
    const ratingMsg = `Experience rated ${stars} Stars! Thank you for the feedback! 🌟`;
    setMessages(prev => [...prev, { id: Date.now(), text: ratingMsg, sender: 'bot' }]);
    speakText(ratingMsg);
  };

  return (
    <div className={`chatbot-wrapper ${isOpen ? 'open' : ''}`}>

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
                👋 Need help with SPAR Coins?<br />
                Ask me about games & discounts!
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
                <p>Park Assistant</p>
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
                <p style={{fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', opacity: 0.8, marginBottom: '12px', letterSpacing: '1px'}}>RATE YOUR EXPERIENCE ⭐</p>
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
