import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ParkGrid from './components/ParkGrid';
import ChatBot from './components/ChatBot';
import CustomCursor from './components/CustomCursor';
import FlappyBuzz from './components/FlappyBuzz';
import ClaimTicketModal from './components/ClaimTicketModal';
import PageLoader from './components/PageLoader';
import { useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import SupportModal from './components/SupportModal';
import ProfileModal from './components/ProfileModal';
import CustomerReviews from './components/CustomerReviews';
import BookingModal from './components/BookingModal';
import SpinWheel from './components/SpinWheel';
import SpaceBackground from './components/SpaceBackground';
import AdminDashboard from './components/AdminDashboard';
import './index.css';

function App() {
  const { shouldOpenProfile, setShouldOpenProfile } = useAuth();
  const [isRewardModalOpen, setIsRewardModalOpen] = React.useState(false);
  const [isPageLoaded, setIsPageLoaded] = React.useState(false);
  const [isSupportOpen, setIsSupportOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [isSpinWheelOpen, setIsSpinWheelOpen] = React.useState(false);
  const [selectedPark, setSelectedPark] = React.useState(null);
  const [view, setView] = React.useState('home'); // 'home' or 'admin'

  const handleOpenBooking = (park) => {
    setSelectedPark(park);
    setIsBookingOpen(true);
  };
  
  React.useEffect(() => {
    if (shouldOpenProfile) {
      setIsProfileOpen(true);
      setShouldOpenProfile(false); // Reset flag
    }
  }, [shouldOpenProfile, setShouldOpenProfile]);

  return (
      <div className="app-container">
        <SpaceBackground />


        <AuthModal />
        <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
        <ProfileModal 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
          onOpenClaim={() => setIsSpinWheelOpen(true)}
        />
        <SpinWheel isOpen={isSpinWheelOpen} onClose={() => setIsSpinWheelOpen(false)} />
        {!isPageLoaded && <PageLoader onComplete={() => setIsPageLoaded(true)} />}
        <CustomCursor />
        <Navbar 
          onOpenSupport={() => setIsSupportOpen(true)} 
          onOpenProfile={() => setIsProfileOpen(true)} 
          onOpenGame={() => setIsSpinWheelOpen(true)}
          isAdmin={view === 'admin'}
        />
        
        {view === 'admin' ? (
          <AdminDashboard onBack={() => setView('home')} />
        ) : (
          <main>
            <Hero />
            <ParkGrid onBook={handleOpenBooking} />
            <FlappyBuzz onWin={() => setIsRewardModalOpen(true)} />
            <CustomerReviews />
            <BookingModal 
              isOpen={isBookingOpen} 
              onClose={() => setIsBookingOpen(false)} 
              selectedPark={selectedPark} 
            />
            
            <footer className="main-footer">
              <div className="max-width-wrapper">
                <div className="footer-grid">
                  <div className="footer-brand-col">
                    <div className="footer-logo">
                      <span className="logo-spark">SPAR</span> Amusements
                    </div>
                    <p className="footer-description">
                      The ultimate destination for thrill-seekers and families. Experience world-class rollercoasters, digital arcade rewards, and unforgettable memories!
                    </p>
                    <div className="social-links-styled">
                      <a href="#" className="social-icon" title="Instagram">IG</a>
                      <a href="#" className="social-icon" title="Twitter">TW</a>
                      <a href="#" className="social-icon" title="Facebook">FB</a>
                      <a href="#" className="social-icon" title="YouTube">YT</a>
                    </div>
                  </div>
    
                  <div className="footer-links-col">
                    <h4 className="text-white-shimmer-rtl">Explore</h4>
                    <ul>
                      <li><a href="#home">Home</a></li>
                      <li><a href="#parks">Our Parks</a></li>
                      <li><a href="#" onClick={(e) => { e.preventDefault(); setView('admin'); }} className="admin-link text-lime-400 font-bold">🚀 MISSION CONTROL (ADMIN)</a></li>
                    </ul>
                  </div>

                  <div className="footer-links-col">
                    <h4 className="text-white-shimmer-rtl">Support</h4>
                    <ul>
                      <li><a href="#" onClick={(e) => { e.preventDefault(); setIsSupportOpen(true); }}>Help Center</a></li>
                      <li><a href="#">Ticket Policies</a></li>
                      <li><a href="#">Park Accessibility</a></li>
                      <li><a href="#" onClick={(e) => { e.preventDefault(); setIsSupportOpen(true); }}>Contact Us</a></li>
                    </ul>
                  </div>

                  <div className="footer-newsletter-col">
                    <h4 className="text-white-shimmer-rtl">Stay in the Loop! 🎢</h4>
                    <p>Get exclusive ticket drops and ride updates.</p>
                    <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                      <input type="email" placeholder="Enter your email" required />
                      <button type="submit" className="neon-btn">SUBSCRIBE</button>
                    </form>
                  </div>
                </div>
                
                <div className="footer-bottom">
                  <p>© {new Date().getFullYear()} SPAR Amusements. All rights reserved. Built for Thrill Seekers.</p>
                  <div className="footer-legal">
                    <a href="#">Privacy Policy</a>
                    <span className="divider">•</span>
                    <a href="#">Terms of Service</a>
                  </div>
                </div>
              </div>
            </footer>
          </main>
        )}
        
        <ChatBot />
      </div>
  );
}

export default App;
