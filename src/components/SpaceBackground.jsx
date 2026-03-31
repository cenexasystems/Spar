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

      {/* Space Battle and roaming characters */}
      <div className="bg-rocket-battle">
        <div className="mini-rocket">
          <div className="mini-rocket-window">
            <div className="mini-window-battle">
              <span className="mini-buzz">🧑‍🚀</span>
              <span className="mini-vs">⚡</span>
              <span className="mini-enemy">👾</span>
            </div>
          </div>
          <div className="mini-rocket-flame">🔥</div>
        </div>

        {/* Roaming mini characters */}
        <div className="mini-roamer r-buzz">🧑‍🚀</div>
        <div className="mini-roamer r-alien-1">👽</div>
        <div className="mini-roamer r-alien-2">👾</div>
        <div className="mini-roamer r-ufo">🛸</div>
        <div className="mini-roamer r-star-1">⭐</div>
        <div className="mini-roamer r-star-2">🌟</div>
        <div className="mini-roamer r-star-3">✨</div>
        <div className="mini-roamer r-rocket">🚀</div>
      </div>

      {/* Shooting stars and extra stars */}
      <div className="page-shooting-star shooting-star-1"></div>
      <div className="page-shooting-star shooting-star-2"></div>
      {[...Array(30)].map((_, i) => (
        <div key={`bg-s-${i}`} className={`bg-page-star star-${i}`}></div>
      ))}
    </div>
  );
};

export default SpaceBackground;
