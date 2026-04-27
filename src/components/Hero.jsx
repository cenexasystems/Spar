import React, { useState, useRef } from 'react';
import { ChevronDown, Rocket, Volume2, VolumeX } from 'lucide-react';
import './Hero.css';
import heroVideo from '../assets/hero-video.mp4';

const Hero = () => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section className="hero-container" id="home">
      <div className="hero-video-wrapper">
        <video 
          ref={videoRef}
          autoPlay 
          muted 
          loop 
          playsInline 
          className="hero-video"
        >
          <source src={heroVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="hero-overlay"></div>
        <button className="video-sound-toggle" onClick={toggleMute}>
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      <div className="hero-content max-width-wrapper">
        <div className="hero-text-block">
          <h1 className="hero-title text-white-shimmer-rtl">
            Spar Amusements:<br />
            Let the Fun Begin!
          </h1>
          <p className="hero-description">
            The ultimate playground for kids and families! Catch your tickets 
            for the coolest theme parks and dive into the fun!
          </p>
          
          <div className="hero-cta-group">
            <button className="btn-primary btn-large kids-floating">
              <Rocket size={20} style={{ marginRight: '10px' }} />
              START THE ADVENTURE
            </button>
            <button className="btn-outline btn-large flex-center">
              WATCH THE FUN!
            </button>
          </div>
        </div>
      </div>

      <div className="hero-scroll-indicator">
        <div className="mouse-icon">
          <div className="mouse-wheel"></div>
        </div>
        <p>SLIDE DOWN FOR FUN!</p>
        <ChevronDown size={28} className="bounce-animation" color="var(--primary-light-green)" />
      </div>
    </section>
  );
};

export default Hero;
