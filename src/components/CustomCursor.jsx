import React, { useState, useEffect } from 'react';
import './CustomCursor.css';

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const dx = e.clientX - position.x;
      const dy = e.clientY - position.y;
      
      // Calculate rotation based on movement direction
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        setRotation(angle);
      }
      
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleMouseOver = (e) => {
      const target = e.target;
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [position]);

  return (
    <div 
      className={`custom-cursor-container ${isHovering ? 'hovering' : ''} ${isClicking ? 'clicking' : ''}`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <svg viewBox="0 0 100 100" className="cursor-ferris-wheel">
        {/* Static Base */}
        <path d="M50 50 L35 90 M50 50 L65 90 M30 90 L70 90" stroke="white" strokeWidth="3" fill="none" />
        {/* Rotating Wheel Group */}
        <g className="cursor-wheel-rotate">
          <circle cx="50" cy="50" r="35" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
            const x = 50 + 35 * Math.cos((angle * Math.PI) / 180);
            const y = 50 + 35 * Math.sin((angle * Math.PI) / 180);
            const colors = ['#FF00E6', '#FFB600', '#00FF88', '#00D4FF'];
            return (
              <g key={i}>
                <line x1="50" y1="50" x2={x} y2={y} stroke="white" strokeWidth="1" opacity="0.3" />
                <circle cx={x} cy={y} r="6" fill={colors[i % 4]} />
              </g>
            );
          })}
          <circle cx="50" cy="50" r="4" fill="white" />
        </g>
      </svg>
      <div className="cursor-trail">
        <div className="trail-dot dot-1"></div>
        <div className="trail-dot dot-2"></div>
        <div className="trail-dot dot-3"></div>
      </div>
    </div>
  );
};

export default CustomCursor;
