import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ParkGrid from './components/ParkGrid';
import ChatBot from './components/ChatBot';
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
import PolicyModal from './components/PolicyModal';
import MeetAgent from './components/MeetAgent';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './index.css';

function App() {
  const { shouldOpenProfile, setShouldOpenProfile, interceptAuth, verifyToken, setVerifyToken, verifyEmailRequest } = useAuth();
  const [isRewardModalOpen, setIsRewardModalOpen] = React.useState(false);
  const [isPageLoaded, setIsPageLoaded] = React.useState(false);
  const [isSupportOpen, setIsSupportOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [isSpinWheelOpen, setIsSpinWheelOpen] = React.useState(false);
  const [selectedPark, setSelectedPark] = React.useState(null);
  const [activePolicy, setActivePolicy] = React.useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleOpenBooking = (park) => {
    interceptAuth(() => {
      setSelectedPark(park);
      setIsBookingOpen(true);
    });
  };
  
  React.useEffect(() => {
    if (shouldOpenProfile) {
      setIsProfileOpen(true);
      setShouldOpenProfile(false); // Reset flag
    }
  }, [shouldOpenProfile, setShouldOpenProfile]);

  React.useEffect(() => {
    if (verifyToken) {
      verifyEmailRequest(verifyToken).then((res) => {
        alert(res.message);
      }).catch((err) => {
        alert(err.message);
      }).finally(() => {
        setVerifyToken(null);
      });
    }
  }, [verifyToken, verifyEmailRequest, setVerifyToken]);

  return (
      <div className="app-container">
        <SpaceBackground />


        <AuthModal />
        <PolicyModal activePolicy={activePolicy} onClose={() => setActivePolicy(null)} />
        <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
        <ProfileModal 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
          onOpenClaim={() => setIsSpinWheelOpen(true)}
        />
        <SpinWheel isOpen={isSpinWheelOpen} onClose={() => setIsSpinWheelOpen(false)} />
        {!isPageLoaded && <PageLoader onComplete={() => setIsPageLoaded(true)} />}
        <Navbar 
          onOpenSupport={() => setIsSupportOpen(true)} 
          onOpenProfile={() => setIsProfileOpen(true)} 
          onOpenGame={() => setIsSpinWheelOpen(true)}
          isAdmin={isAdminRoute}
        />
        
        <Routes>
          <Route path="/admin/*" element={<AdminDashboard onBack={() => navigate('/')} />} />
          <Route path="/*" element={
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
            
            <MeetAgent />

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
                  </div>
    
                  <div className="footer-links-col">
                    <h4 className="text-white-shimmer-rtl">Explore</h4>
                    <ul>
                      <li><a href="#home">Home</a></li>
                      <li><a href="#parks">Our Parks</a></li>
                    </ul>
                  </div>

                  <div className="footer-links-col">
                    <h4 className="text-white-shimmer-rtl">Support</h4>
                    <ul>
                      <li><a href="#" onClick={(e) => { e.preventDefault(); setIsSupportOpen(true); }}>Help Center</a></li>
                      <li><a href="#" onClick={(e) => { e.preventDefault(); setActivePolicy('ticket'); }}>Ticket Policies</a></li>
                    </ul>
                  </div>

                  <div className="footer-contact-col">
                    <h4 className="text-white-shimmer-rtl" style={{ textTransform: 'uppercase' }}>Get in Touch</h4>
                    
                    <div className="footer-contact-details">
                      <a href="tel:+919585964848" className="footer-contact-row">
                        <span className="footer-contact-icon"><Phone size={14} color="#00D1FF" /></span>
                        <span className="footer-contact-text">+91 95859 64848</span>
                      </a>
                      <a href="mailto:sparamusements@gmail.com" className="footer-contact-row">
                        <span className="footer-contact-icon"><Mail size={14} color="#00D1FF" /></span>
                        <span className="footer-contact-text">sparamusements@gmail.com</span>
                      </a>
                      <div className="footer-contact-row footer-address-row">
                        <span className="footer-contact-icon"><MapPin size={14} color="#00D1FF" /></span>
                        <span className="footer-contact-text">
                          Raksha Tower, F2-B 600/601,<br/>
                          P.H. Road, Arumbakkam,<br/>
                          Chennai – 600 106.<br/>
                          Tamil Nadu, India.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="footer-bottom" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%' }}>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ margin: 0 }}>© {new Date().getFullYear()} SPAR Amusements. All rights reserved.</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '400', opacity: 0.8, margin: 0 }}>
                      Powered by <a href="https://cenexasystems.com" target="_blank" rel="noopener noreferrer" style={{ color: '#C7FF00', fontWeight: '800', letterSpacing: '0.5px', textDecoration: 'none' }}>Cenexa Systems</a> © 2026
                    </p>
                  </div>
                  <div className="footer-legal" style={{ justifyContent: 'flex-end' }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActivePolicy('privacy'); }}>Privacy Policy</a>
                    <span className="divider">•</span>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActivePolicy('terms'); }}>Terms of Use</a>
                  </div>
                </div>
              </div>
            </footer>
          </main>
          } />
        </Routes>
        
        {!isAdminRoute && <ChatBot />}
      </div>
  );
}

export default App;
