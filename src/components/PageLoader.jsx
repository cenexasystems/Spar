import React, { useEffect, useState } from 'react';
import SpaceBackground from './SpaceBackground';
import './PageLoader.css';

const PageLoader = ({ onComplete }) => {
  const [isFading, setIsFading] = useState(false);
  const isRestarting = sessionStorage.getItem('restarting') === 'true';

  useEffect(() => {
    // Determine loading time. If it's a manual restart, make it slightly longer for effect.
    const loadTime = isRestarting ? 2500 : 2000;
    
    // Voice greeting deactivated as per request

    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, loadTime);

    const completeTimer = setTimeout(() => {
      if (isRestarting) {
        sessionStorage.removeItem('restarting');
      }
      onComplete();
    }, loadTime + 500); // 500ms fade duration

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [isRestarting, onComplete]);

  return (
    <div className={`page-loader-overlay ${isFading ? 'fade-out' : ''}`}>
      <SpaceBackground />
      <div className="loader-content">
        
        {/* Giant Ferris Wheel SVG */}
        <div className="loader-wheel-container">
           <svg viewBox="0 0 100 100" className="giant-ferris-wheel">
             {/* Complex Stand */}
             <path d="M50 50 L35 95 L25 95 L50 20 Z" fill="rgba(255,255,255,0.05)" stroke="#00D1FF" strokeWidth="1" />
             <path d="M50 50 L65 95 L75 95 L50 20 Z" fill="rgba(255,255,255,0.05)" stroke="#00D1FF" strokeWidth="1" />
             <path d="M35 95 L65 95" stroke="#BF00FF" strokeWidth="4" />
             
             {/* Center Axle */}
             <circle cx="50" cy="50" r="5" fill="#C7FF00" />
             
             {/* Rotating Wheel Group */}
             <g className="wheel-spin-infinite">
               {/* Main Rims */}
               <circle cx="50" cy="50" r="40" stroke="#00D1FF" strokeWidth="2" fill="none" />
               <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
               <circle cx="50" cy="50" r="10" stroke="#BF00FF" strokeWidth="1" fill="none" />
               
               {/* Spokes and Carts */}
               {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
                 const innerX = 50 + 10 * Math.cos((angle * Math.PI) / 180);
                 const innerY = 50 + 10 * Math.sin((angle * Math.PI) / 180);
                 const outerX = 50 + 40 * Math.cos((angle * Math.PI) / 180);
                 const outerY = 50 + 40 * Math.sin((angle * Math.PI) / 180);
                 const colors = ['#C7FF00', '#BF00FF', '#00D1FF', '#FF0055'];
                 return (
                   <g key={i}>
                     {/* Spoke */}
                     <line x1={innerX} y1={innerY} x2={outerX} y2={outerY} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                     {/* Cart */}
                     <g transform={`translate(${outerX}, ${outerY})`}>
                        {/* Auto-counter-rotate cart so it stays upright (nested animation trick not fully possible purely in SVG without complex SMIL, but this looks cool as fixed angulars) */}
                        <circle cx="0" cy="0" r="4" fill={colors[i % 4]} filter="drop-shadow(0 0 5px currentColor)" />
                        <rect x="-3" y="0" width="6" height="5" rx="1" fill="white" opacity="0.8" />
                     </g>
                   </g>
                 );
               })}
             </g>
           </svg>
        </div>

        <h1 className="loader-title text-white-shimmer-rtl">
          WELCOME TO SPAR AMUSEMENTS!
        </h1>
        <div className="loader-subtitle pulse-text">Please keep your hands and feet inside the vehicle</div>
        
        {/* Simple Progress Bar */}
        <div className="loader-progress-bar">
          <div className="loader-progress-fill"></div>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
