import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './SupportModal.css';

const SupportModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { role: 'bot', text: `Hi ${user?.name ? user.name.split(' ')[0] : 'there'}! I'm your SPAR Assistant. 🤖\n\nI can help you with:\n• How SPAR Coins work\n• Claiming Ticket Discounts\n• Winning the Free Pass\n• Ticket Booking Info\n\nHow can I help you today?` }
      ]);
    }
  }, [isOpen, user, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = userMsg.toLowerCase();
      let reply = '';

      if (lower.includes('coin') || lower.includes('spar coin')) {
        reply = "SPAR Coins are our park's loyalty currency! 💰\n\nYou earn 1000 Coins simply by returning a plastic water bottle to our Reverse Vending Machines located throughout the park. You can use these coins to get massive discounts on tickets.";
      } 
      else if (lower.includes('claim') || lower.includes('discount') || lower.includes('redeem')) {
        reply = "You can claim your SPAR Coins exactly when you book your ticket online!\n\nAt the 'Review & Pay' step (Step 2), you'll see a 'SPAR COINS REWARDS' panel. You can select discounts from 10% up to 90% off, depending on your coin balance. (Applied to one ticket per booking).";
      }
      else if (lower.includes('free ticket') || lower.includes('game') || lower.includes('flappy') || lower.includes('space ranger')) {
        reply = "There are two ways to get a FREE pass! 🎟️\n\n1. Play the 'SPACE RANGER FLIGHT' arcade game. If you manage to survive and score 100 points, you get an instant Free Pass! (You get 3 attempts per day).\n2. If you accumulate 100,000 SPAR Coins, you can purchase the Free Pass directly during checkout.";
      }
      else if (lower.includes('book') || lower.includes('pay') || lower.includes('booking') || lower.includes('qr') || lower.includes('upi')) {
        reply = "Booking a ticket is super fast:\n1. Enter your details.\n2. Review your bill & add any SPAR Coin discounts.\n3. A specific Google Pay/UPI QR code is generated for your total.\n4. Scan the QR code, pay, and enter the 12-digit UTR number.\n\nYour confirmed ticket will be sent securely via WhatsApp!";
      }
      else if (lower.includes('whatsapp') || lower.includes('human') || lower.includes('agent') || lower.includes('support')) {
         reply = "For account specific issues, failed payments, or speaking to a human agent, please message our dedicated WhatsApp Customer Support: +91 9876543210 (or click the WhatsApp bubble on our site).";
      }
      else {
        reply = "I'm a simple support bot and that query is a little too complex for me! 😅\n\nFor account issues, failed payments, or advanced questions, please contact our human team directly via WhatsApp support.";
      }

      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
      setIsTyping(false);
    }, 800);
  };

  const floatingElements = [
    { id: 1, type: 'rocket', x: '10%', y: '20%', size: 40, delay: '0s', duration: '15s' },
    { id: 2, type: 'alien', x: '85%', y: '15%', size: 50, delay: '2s', duration: '18s' },
    { id: 3, type: 'star', x: '20%', y: '70%', size: 20, delay: '1s', duration: '12s' },
    { id: 4, type: 'star', x: '75%', y: '75%', size: 25, delay: '4s', duration: '14s' }
  ];

  return (
    <div className="support-modal-overlay">
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
                <path d="m21 3-9 9" stroke="#00D1FF" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {el.type === 'alien' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a5 5 0 0 1 5 5v2a7 7 0 0 1-14 0V7a5 5 0 0 1 5-5z" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.3"/>
                <path d="M6 13a4 4 0 0 0 4 4" strokeLinecap="round" strokeLinejoin="round"/>
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

      <div className="support-modal glass-morphism pop-in flex flex-col pt-6 pb-6">
        <button className="support-close-btn" onClick={onClose}>
          <X size={24} color="#fff" />
        </button>

        <div className="support-header text-center mb-4">
           <h2 className="text-white-shimmer-rtl" style={{ fontSize: '2rem' }}>SPAR ASSISTANT</h2>
           <p className="text-muted text-xs mt-1">Smart answers to your questions!</p>
        </div>

        <div className="chatbot-messages custom-scrollbar flex-1 overflow-y-auto w-full mb-4 px-2" style={{ maxHeight: '350px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((msg, index) => (
            <div key={index} className={`chat-bubble-container flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'bot' && (
                <div className="bot-avatar mr-2 flex-shrink-0 bg-[#1e293b] p-2 rounded-full border border-[rgba(0,209,255,0.3)] h-[36px] w-[36px] flex items-center justify-center">
                  <Bot size={18} color="#00D1FF" />
                </div>
              )}
              <div 
                className={`chat-bubble px-4 py-3 text-sm whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-[#C7FF00] text-black font-bold rounded-tl-xl rounded-tr-xl rounded-bl-xl border-2 border-black' 
                    : 'bg-[rgba(255,255,255,0.05)] text-white border border-[rgba(255,255,255,0.1)] rounded-tr-xl rounded-bl-xl rounded-br-xl'
                }`}
                style={{ maxWidth: '85%' }}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="chat-bubble-container flex justify-start">
              <div className="bot-avatar mr-2 flex-shrink-0 bg-[#1e293b] p-2 rounded-full border border-[rgba(0,209,255,0.3)] h-[36px] w-[36px] flex items-center justify-center">
                <Bot size={18} color="#00D1FF" />
              </div>
              <div className="chat-bubble px-4 py-3 bg-[rgba(255,255,255,0.05)] text-white border border-[rgba(255,255,255,0.1)] rounded-tr-xl rounded-bl-xl rounded-br-xl flex items-center gap-1">
                <div className="typing-dot" style={{ animationDelay: '0s' }}></div>
                <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chatbot-input-form relative w-full mt-2" onSubmit={handleSend}>
           <input 
             type="text" 
             className="modern-input pr-12 w-full py-3 bg-[rgba(0,0,0,0.4)] text-white border border-[rgba(0,209,255,0.3)] rounded-xl focus:border-[#C7FF00] outline-none px-4 text-sm transition-all" 
             placeholder="Ask about coins, booking, or games..."
             value={inputText}
             onChange={(e) => setInputText(e.target.value)}
           />
           <button 
             type="submit" 
             className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#00D1FF] hover:bg-[#C7FF00] text-black h-[32px] w-[32px] flex items-center justify-center rounded-lg transition-colors cursor-pointer"
             disabled={!inputText.trim()}
           >
             <Send size={16} />
           </button>
        </form>
      </div>
    </div>
  );
};

export default SupportModal;
