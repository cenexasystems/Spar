import React, { useState, useEffect } from 'react';
import { Menu, X, Ticket, RefreshCw, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = ({ onOpenSupport, onOpenProfile, onOpenGame, isAdmin }) => {
  const { user, logout, interceptAuth } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar-container ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner max-width-wrapper">
        <div className="navbar-logo">
          <a href="/">
            <div className="logo-text-stack">
              <div className="logo-wrapper">
                <span className="logo-spark-top">SPAR</span>
              </div>
              <span className="logo-amuse text-white-shimmer-rtl">Amusements</span>
            </div>
            <div className="logo-icon-wrapper">
              <svg viewBox="0 0 100 100" className="custom-ferris-wheel">
                {/* Static Base */}
                <path d="M50 50 L35 90 M50 50 L65 90 M30 90 L70 90" stroke="white" strokeWidth="3" fill="none" />
                {/* Rotating Wheel Group */}
                <g className="wheel-rotate">
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
            </div>
          </a>
        </div>

        <div className="nav-menu desktop-only">
          {!isAdmin ? (
            <>
              <a href="#home">HOME</a>
              <a href="#parks">PARKS</a>
              <a href="#experiences">EXPERIENCES</a>
              <a href="#support" onClick={(e) => { e.preventDefault(); onOpenSupport(); }}>SUPPORT</a>
            </>
          ) : (
            <div className="admin-breadcrumb-text">
              ADMIN PANEL / <span className="highlight-text-lime">OPERATIONS CENTER</span>
            </div>
          )}
        </div>

        <div className="nav-actions desktop-only">
          {isAdmin ? (
            <div className="commander-profile glass-morphism">
              <div className="commander-avatar-wrap">
                <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Admin" alt="Admin" />
              </div>
              <div className="commander-stats">
                <span className="rank-label">ADMIN</span>
                <span className="status-badge"><span className="pulse-indicator"></span> ONLINE</span>
              </div>
            </div>
          ) : (
            <>
              <button className="btn-refresh" onClick={onOpenGame}>
                <svg viewBox="0 0 100 100" className="mini-ferris-wheel">
                  <path d="M50 50 L35 90 M50 50 L65 90 M30 90 L70 90" stroke="currentColor" strokeWidth="4" fill="none" />
                  <g className="wheel-spin-fast">
                    <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="3" fill="none" />
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                      const x = 50 + 35 * Math.cos((angle * Math.PI) / 180);
                      const y = 50 + 35 * Math.sin((angle * Math.PI) / 180);
                      const colors = ['#C7FF00', '#BF00FF', '#00D1FF', '#FF0055'];
                      return (
                        <g key={i}>
                          <line x1="50" y1="50" x2={x} y2={y} stroke="currentColor" strokeWidth="2" opacity="0.6" />
                          <circle cx={x} cy={y} r="8" fill={colors[i % 4]} />
                        </g>
                      );
                    })}
                    <circle cx="50" cy="50" r="6" fill="#fff" />
                  </g>
                </svg>
                <div className="flex-col leading-tight" style={{textAlign: 'left'}}>
                  <span style={{ fontSize: '0.55rem', color: '#fff', opacity: 0.8 }}>SPAR WHEEL</span>
                  <span>SPAR AMUSEMENTS</span>
                </div>
              </button>
              
              {user ? (
                <div className="user-profile-pill cursor-pointer" style={{ cursor: 'pointer', margin: 0 }} onClick={onOpenProfile}>
                  <img src={user.avatar} alt="Avatar" className="user-avatar" />
                  <span className="user-name" title={user.name}>{user.name}</span>
                </div>
              ) : (
                <button className="btn-book" onClick={() => interceptAuth(() => {})}>
                  <UserIcon size={16} />
                  <span>LOG IN / SIGN UP</span>
                </button>
              )}
            </>
          )}
        </div>

        <div className="mobile-menu-toggle mobile-only" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <a href="#home" onClick={() => setIsMobileMenuOpen(false)}>HOME</a>
          <a href="#parks" onClick={() => setIsMobileMenuOpen(false)}>PARKS</a>
          <a href="#experiences" onClick={() => setIsMobileMenuOpen(false)}>EXPERIENCES</a>
          <a href="#support" onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); onOpenSupport(); }}>SUPPORT</a>
          <button className="btn-refresh w-full flex-center mb-2" style={{ justifyContent: 'center' }} onClick={() => { setIsMobileMenuOpen(false); onOpenGame(); }}>
             <svg viewBox="0 0 100 100" className="mini-ferris-wheel" style={{ marginRight: '8px' }}>
              <path d="M50 50 L35 90 M50 50 L65 90 M30 90 L70 90" stroke="currentColor" strokeWidth="4" fill="none" />
              <g className="wheel-spin-fast">
                <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="3" fill="none" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                  const x = 50 + 35 * Math.cos((angle * Math.PI) / 180);
                  const y = 50 + 35 * Math.sin((angle * Math.PI) / 180);
                  const colors = ['#C7FF00', '#BF00FF', '#00D1FF', '#FF0055'];
                  return (
                    <g key={i}>
                      <line x1="50" y1="50" x2={x} y2={y} stroke="currentColor" strokeWidth="2" opacity="0.6" />
                      <circle cx={x} cy={y} r="8" fill={colors[i % 4]} />
                    </g>
                  );
                })}
                <circle cx="50" cy="50" r="6" fill="#fff" />
              </g>
            </svg>
             <div className="flex-col leading-tight" style={{textAlign: 'left'}}>
               <span style={{ fontSize: '0.55rem', color: '#fff', opacity: 0.8 }}>SPAR WHEEL</span>
               <span>SPAR AMUSEMENTS</span>
             </div>
          </button>
          <button className="btn-primary w-full flex-center" onClick={() => { setIsMobileMenuOpen(false); user ? onOpenProfile() : interceptAuth(() => {}); }}>
            <UserIcon size={18} style={{ marginRight: '8px' }} />
            {user ? 'PROFILE' : 'LOG IN / SIGN UP'}
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
