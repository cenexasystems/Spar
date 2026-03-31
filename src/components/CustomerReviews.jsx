import React, { useState } from 'react';
import { Star, Send, User as UserIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './CustomerReviews.css';

const INITIAL_REVIEWS = [
  {
    id: 1,
    name: "Aryan S.",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aryan&skinColor=c29068&hair=short02",
    rating: 5,
    text: "The Flappy Buzz game is insanely addictive, and winning a free pass was the highlight of my week! VGP was amazing.",
    date: "2 Days Ago"
  },
  {
    id: 2,
    name: "Priya M.",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Priya&skinColor=9a583e&hair=long01",
    rating: 4,
    text: "Booking through the SPAR ChatBot was so quick! MGM Dizzee World was fantastic, especially the water rides.",
    date: "1 Week Ago"
  },
  {
    id: 3,
    name: "Vikram R.",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Vikram&skinColor=7b4b3a&hair=short05",
    rating: 5,
    text: "The whole seamless digital ticket wallet is incredible. Didn't need to print anything out. Black Thunder rocks!",
    date: "2 Weeks Ago"
  }
];

const CustomerReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const nextReviews = () => {
    if (reviews.length <= 3) return;
    setStartIndex((prev) => (prev + 1) % (reviews.length - 2));
  };

  const prevReviews = () => {
    if (reviews.length <= 3) return;
    setStartIndex((prev) => (prev - 1 + (reviews.length - 2)) % (reviews.length - 2));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newRating) return alert("Please select a star rating!");
    if (!newComment.trim()) return alert("Please write a small review!");

    setIsSubmitting(true);
    
    // Simulate API delay
    setTimeout(() => {
      const reviewObj = {
        id: Date.now(),
        name: user ? user.name : "Guest Cadet",
        avatar: user ? user.avatar : `https://api.dicebear.com/7.x/adventurer/svg?seed=${Date.now()}`,
        rating: newRating,
        text: newComment,
        date: "Just Now"
      };

      setReviews([reviewObj, ...reviews]);
      setNewComment('');
      setNewRating(0);
      setHoverRating(0);
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <section className="reviews-section" id="reviews">
      <div className="max-width-wrapper">
        <div className="section-header">
          <p className="section-indicator">RANGER LOGS</p>
          <h2 className="text-white-shimmer-rtl">CADET REVIEWS</h2>
          <p className="section-subtitle">See what other space rangers are saying about their missions.</p>
        </div>

        <div className="reviews-container">
          <div className="review-composer glass-morphism">
            <h3 className="composer-title text-white-shimmer-rtl">FILE YOUR MISSION REPORT</h3>
            <p className="composer-subtitle">Tell us about your latest amusement park adventure!</p>

            <form onSubmit={handleSubmit} className="review-form">
              <div className="star-rating-selector">
                <span className="rating-label">YOUR RATING:</span>
                <div className="stars-interactive">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star} 
                      size={28} 
                      className={`interactive-star ${star <= (hoverRating || newRating) ? 'active' : ''}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setNewRating(star)}
                    />
                  ))}
                </div>
              </div>

              <textarea 
                className="review-textarea" 
                placeholder="How was the ride? Did you score a digital pass?"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
              />

              <button type="submit" className="ranger-primary-btn" disabled={isSubmitting}>
                {isSubmitting ? <div className="spinner"></div> : <><Send size={16}/> SUBMIT</>}
              </button>
            </form>
          </div>

          <div className="reviews-list-wrapper">
            <div className="reviews-grid">
              <AnimatePresence mode="popLayout">
                {reviews.slice(startIndex, startIndex + 3).map((review, idx) => (
                  <motion.div 
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    className="review-card glass-morphism"
                  >
                    <div className="review-card-header">
                      <img src={review.avatar} alt={review.name} className="review-avatar" />
                      <div className="review-meta">
                        <h4 className="reviewer-name">{review.name}</h4>
                        <span className="review-date">{review.date}</span>
                      </div>
                      <div className="review-stars-display">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            size={14} 
                            fill={star <= review.rating ? "#C7FF00" : "transparent"} 
                            color={star <= review.rating ? "#C7FF00" : "#4B5563"} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="review-text">"{review.text}"</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {reviews.length > 3 && (
              <div className="reviews-navigation">
                <button className="nav-arrow up" onClick={prevReviews} disabled={startIndex === 0}>
                  <ChevronUp size={24} />
                </button>
                <div className="nav-dots">
                  {Array.from({ length: Math.max(0, reviews.length - 2) }).map((_, i) => (
                    <div key={i} className={`nav-dot ${i === startIndex ? 'active' : ''}`}></div>
                  ))}
                </div>
                <button className="nav-arrow down" onClick={nextReviews} disabled={startIndex >= reviews.length - 3}>
                  <ChevronDown size={24} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;
