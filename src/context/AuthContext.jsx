import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [shouldOpenProfile, setShouldOpenProfile] = useState(false);

  useEffect(() => {
    // Check local storage for active session on boot
    try {
      const storedUser = localStorage.getItem('spar_session');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error("Failed to parse session:", err);
      localStorage.removeItem('spar_session');
    }
    
    // Initialize DB if it doesn't exist
    try {
      if (!localStorage.getItem('spar_db_users')) {
        localStorage.setItem('spar_db_users', JSON.stringify([]));
      }
    } catch (err) {
      console.error("Local Storage is inaccessible:", err);
    }
  }, []);

  const getUsersDB = () => {
    try {
      return JSON.parse(localStorage.getItem('spar_db_users') || '[]');
    } catch (err) {
      return [];
    }
  };
  
  const setUsersDB = (db) => {
    try {
      localStorage.setItem('spar_db_users', JSON.stringify(db));
    } catch (err) {
      console.error("Failed to save users DB:", err);
    }
  };

  // Register a new user
  const registerUser = (firstName, email, phone, password, avatarUrl) => {
    const db = getUsersDB();
    if (db.find(u => u.email === email)) {
      throw new Error("An account with this email already exists!");
    }
    
    const newUser = {
      id: Date.now().toString(),
      name: firstName,
      email: email,
      phone: phone,
      password: password, // In a real app this would be hashed
      avatar: avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg?seed=" + email,
      bookings: [], // Initialize empty booking history
      sparCoins: 0  // Initialize with 0 coins
    };
    
    db.push(newUser);
    setUsersDB(db);
    return _finalizeLogin(newUser);
  };

  // Login existing user
  const loginUser = (email, password) => {
    const db = getUsersDB();
    const foundUser = db.find(u => u.email === email && u.password === password);
    
    if (!foundUser) {
      throw new Error("Invalid email or password.");
    }
    
    return _finalizeLogin(foundUser);
  };

  const loginGoogleMock = () => {
    const mockUser = {
      id: "google_cadet",
      name: "Google Cadet",
      email: "google@example.com",
      phone: "Not Provided",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Google",
      bookings: [],
      sparCoins: 0
    };
    return _finalizeLogin(mockUser);
  };

  const _finalizeLogin = (userData) => {
    // Strip password from active session
    const safeUser = { ...userData };
    delete safeUser.password;
    
    setUser(safeUser);
    localStorage.setItem('spar_session', JSON.stringify(safeUser));
    setIsAuthModalOpen(false);
    
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    return safeUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('spar_session');
  };

  // --- Supabase Persistence Logic ---
  const addBooking = async (ticketData) => {
    if (!user) return; // Must be logged in
    
    // 1. Update session memory locally for smoothness
    const updatedUser = { ...user };
    if (!updatedUser.bookings) updatedUser.bookings = [];
    const newBooking = { ...ticketData, timestamp: new Date().toISOString() };
    updatedUser.bookings.push(newBooking);
    setUser(updatedUser);
    localStorage.setItem('spar_session', JSON.stringify(updatedUser));
    
    // 2. Persist to Supabase for Admin visibility (only if configured)
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('bookings')
          .insert([{
            cadet_name: user.name,
            cadet_email: user.email,
            park_name: ticketData.parkName,
            tickets: ticketData.tickets,
            total_amount: ticketData.total,
            payment_method: ticketData.payment,
            park_id: ticketData.parkId,
            created_at: new Date().toISOString()
          }]);
        if (error) throw error;
      } catch (err) {
        console.error("Supabase booking sync failed:", err);
      }
    } else {
      console.log("Supabase not configured: Booking saved locally only.");
    }
  };

  const addCoins = async (amount) => {
    if (!user) return;
    
    const updatedUser = { ...user };
    updatedUser.sparCoins = (updatedUser.sparCoins || 0) + amount;
    
    setUser(updatedUser);
    localStorage.setItem('spar_session', JSON.stringify(updatedUser));
    
    // Update Supabase (only if configured)
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('users')
          .upsert({ 
            email: user.email, 
            name: user.name, 
            spar_coins: updatedUser.sparCoins,
            phone: user.phone || 'N/A'
          }, { onConflict: 'email' });
        if (error) throw error;
      } catch (err) {
        console.error("Supabase coin sync failed:", err);
      }
    }
  };

  const interceptAuth = (actionCallback) => {
    if (user) {
      actionCallback();
    } else {
      setPendingAction(() => actionCallback);
      setIsAuthModalOpen(true);
    }
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setPendingAction(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthModalOpen, 
      setIsAuthModalOpen, 
      loginUser, 
      registerUser, 
      loginGoogleMock, 
      logout, 
      interceptAuth, 
      closeAuthModal,
      addBooking,
      addCoins,
      shouldOpenProfile,
      setShouldOpenProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
