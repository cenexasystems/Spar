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

const QUICK_REPLIES = [
  { label: '🪙 SPAR Coins', query: 'spar coins' },
  { label: '🎟️ Free Pass', query: 'free ticket' },
  { label: '💸 Discounts', query: 'discount' },
  { label: '🎫 Book Ticket', query: 'book' },
  { label: '📞 Support', query: 'human' },
];

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

  const handleSendMessage = (directText) => {
    const text = typeof directText === 'string' ? directText : inputValue.trim();
    if (!text) return;

    const userMsg = { id: Date.now(), text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setInputValue('');

    setTimeout(() => {
      const lower = text.toLowerCase();
      let reply = '';

      if (/^(hi|hello|hey)$/.test(lower) || lower.includes('how are you')) {
        reply = "Hello there! 👋 I'm Buzz Lightyear, your Park Assistant. I can help you with SPAR Coins, Ticket Discounts, the FlappyBuzz Game, or general booking support. What would you like to know?";
      }
      else if (lower.includes('discount') || lower.includes('claim') || lower.includes('redeem')) {
        const newBotMessage = {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Here are all the ways you can get discounts at SPAR Amusements! 🎟️',
          cards: [
            {
              icon: '🪙',
              title: 'SPAR COINS',
              badge: 'COINS',
              badgeColor: '#C7FF00',
              desc: 'Every 10,000 SPAR Coins = 10% discount (up to 90%).',
              sub: 'Earn coins daily via the Spin Wheel!'
            },
            {
              icon: '🕹️',
              title: 'SPACE RANGER FLIGHT',
              badge: 'GAME',
              badgeColor: '#BF00FF',
              desc: 'Score 100 points to win a 100% FREE pass instantly!',
              sub: 'Play 3 times daily.'
            },
            {
              icon: '🎟️',
              title: 'PROMO COUPONS',
              badge: 'COUPON',
              badgeColor: '#00D1FF',
              desc: 'Have a promo code? Enter it at checkout for instant savings.',
              sub: 'Follow our socials for drops!'
            },
            {
              icon: '⚠️',
              title: 'IMPORTANT RULE',
              badge: 'NOTE',
              badgeColor: '#FF6B00',
              desc: 'All discounts apply to EXACTLY 1 TICKET ONLY.',
              sub: 'Even for large groups, only one ticket is discounted.'
            }
          ]
        };
        setMessages(prev => [...prev, newBotMessage]);
        setIsTyping(false);
        return;
      }
      else if (lower.includes('coin') || lower.includes('spar coin') || lower.includes('earn')) {
        const newBotMessage = {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'SPAR Coins are our loyalty currency! Here is how they work: 💰',
          cards: [
            {
              icon: '🪙',
              title: 'EARN & REDEEM',
              badge: 'COINS',
              badgeColor: '#C7FF00',
              desc: 'Earn daily on the Spin Wheel. Every 10,000 Coins = 10% discount on a ticket.',
              sub: 'Discounts cap at 90% off.'
            },
            {
              icon: '⚠️',
              title: 'IMPORTANT RULE',
              badge: 'NOTE',
              badgeColor: '#FF6B00',
              desc: 'Coin discounts apply to EXACTLY 1 TICKET ONLY.',
              sub: 'The remaining tickets in a group booking are charged full price.'
            }
          ]
        };
        setMessages(prev => [...prev, newBotMessage]);
        setIsTyping(false);
        return;
      }
      else if (lower.includes('game') || lower.includes('space') || lower.includes('free ticket') || lower.includes('flappy') || lower.includes('play')) {
        const newBotMessage = {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Get ready for Space Ranger Flight! 🚀 Here is how to play and win:',
          cards: [
            {
              icon: '🕹️',
              title: 'HOW TO WIN',
              badge: 'GAME',
              badgeColor: '#BF00FF',
              desc: 'Score exactly 100 points by dodging obstacles to win a FREE PASS.',
              sub: 'Difficulty increases wildly every 10 points.'
            },
            {
              icon: '⏰',
              title: 'DAILY LIMITS',
              badge: 'INFO',
              badgeColor: '#00D1FF',
              desc: 'You get 3 attempts per day to beat the high score.',
              sub: 'Attempts reset at midnight.'
            },
            {
              icon: '⚠️',
              title: 'IMPORTANT RULE',
              badge: 'NOTE',
              badgeColor: '#FF6B00',
              desc: 'The Free Pass applies to EXACTLY 1 TICKET ONLY.',
              sub: 'Cannot be combined with other discounts.'
            }
          ]
        };
        setMessages(prev => [...prev, newBotMessage]);
        setIsTyping(false);
        return;
      }
      else if (lower.includes('book') || lower.includes('pay') || lower.includes('ticket') || lower.includes('qr') || lower.includes('upi')) {
        reply = "Booking a ticket is super fast:\n1. Choose your park & date.\n2. Review your bill & add SPAR Coin/Coupon discounts.\n3. Scan the secure GPay/UPI QR code & pay.\n4. Enter the 12-digit UTR.\n\nYour confirmed ticket will be sent securely via WhatsApp!";
      }
      else if (lower.includes('support') || lower.includes('whatsapp') || lower.includes('human') || lower.includes('agent') || lower.includes('failed') || lower.includes('issue')) {
         reply = "Need help? Securely message our dedicated WhatsApp Customer Support: +91 9876543210 📱 They can help you with failed payments, booking issues, and more!";
      }
      else {
        reply = "I'm just a space ranger and that query is a little too complex for me! 😅 For account issues or advanced questions, please contact our human team directly via WhatsApp support at +91 9876543210.";
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
                  {msg.cards && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                      {msg.cards.map((card, idx) => (
                        <div key={idx} style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px'
                        }}>
                          <span style={{ fontSize: '20px', lineHeight: 1, flexShrink: 0, marginTop: '2px' }}>{card.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 900, color: '#fff', letterSpacing: '0.5px' }}>{card.title}</span>
                              <span style={{
                                fontSize: '9px', fontWeight: 800, padding: '1px 5px',
                                borderRadius: '4px', background: card.badgeColor,
                                color: card.badgeColor === '#C7FF00' ? '#0f172a' : '#fff',
                                letterSpacing: '0.5px', flexShrink: 0
                              }}>{card.badge}</span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', margin: '0 0 2px', fontWeight: 600 }}>{card.desc}</p>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{card.sub}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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

          {/* Quick-reply suggestion chips — always visible before typing */}
          {!isTyping && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '8px',
              padding: '10px 12px 0',
              background: 'rgba(0,0,0,0.3)'
            }}>
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr.label}
                  onClick={() => handleSendMessage(qr.query)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid rgba(199,255,0,0.4)',
                    background: 'rgba(199,255,0,0.08)',
                    color: '#C7FF00',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    letterSpacing: '0.3px',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(199,255,0,0.2)'; e.currentTarget.style.borderColor = '#C7FF00'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(199,255,0,0.08)'; e.currentTarget.style.borderColor = 'rgba(199,255,0,0.4)'; }}
                >
                  {qr.label}
                </button>
              ))}
            </div>
          )}

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
