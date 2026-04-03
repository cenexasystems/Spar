import React from 'react';
import './SpaceBackground.css';

const SpaceBackground = () => {
  return (
    <div className="dynamic-bg">
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>
      <div className="glow-orb orb-3"></div>
      <div className="glow-orb orb-4"></div>
      <div className="bg-grid-overlay"></div>

      {/* 3 Shooting Stars (rendered behind content) */}
      <div className="page-shooting-star shooting-star-1"></div>
      <div className="page-shooting-star shooting-star-2"></div>
      <div className="page-shooting-star shooting-star-3"></div>
      
      {/* Core background texture */}
    </div>
  );
};

export default SpaceBackground;
