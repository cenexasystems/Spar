import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [shouldOpenProfile, setShouldOpenProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [user]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const storedUser = localStorage.getItem('spar_session');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          const { data } = await axios.get(`${API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${parsedUser.token}` }
          });

          const bookingsRes = await axios.get(`${API_URL}/bookings`, {
            headers: { Authorization: `Bearer ${parsedUser.token}` }
          });
          data.bookings = bookingsRes.data;

          setUser({ ...data, token: parsedUser.token });
          localStorage.setItem('spar_session', JSON.stringify({ ...data, token: parsedUser.token }));
        }
      } catch (err) {
        console.error("Session fetch failed:", err);
        localStorage.removeItem('spar_session');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, []);

  const _finalizeAuth = (userData) => {
    setUser(userData);
    localStorage.setItem('spar_session', JSON.stringify(userData));
    setIsAuthModalOpen(false);

    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const registerUser = async (firstName, email, phone, password, avatarUrl) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/register`, {
        name: firstName,
        email,
        phone,
        password,
        avatar: avatarUrl
      });
      data.bookings = [];
      _finalizeAuth(data);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const loginUser = async (email, password) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
      const bookingsRes = await axios.get(`${API_URL}/bookings`, {
        headers: { Authorization: `Bearer ${data.token}` }
      });
      data.bookings = bookingsRes.data;
      _finalizeAuth(data);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const loginGoogle = async (access_token) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/google`, { access_token });
      if (data.isNewUser) {
        data.bookings = [];
        // Temporarily store authenticated state so the next step works, but don't finalize full Auth Modal yet
        setUser(data);
        localStorage.setItem('spar_session', JSON.stringify(data));
      } else {
        const bookingsRes = await axios.get(`${API_URL}/bookings`, {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        data.bookings = bookingsRes.data;
        _finalizeAuth(data);
      }
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Google Auth failed');
    }
  };

  const updateAvatar = async (avatarUrl, phoneInput) => {
    try {
      const { data } = await axios.put(`${API_URL}/auth/avatar`,
        { avatar: avatarUrl, phone: phoneInput }
      );
      _finalizeAuth(data);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update avatar');
    }
  };

  const syncUser = (userData) => {
    setUser(userData);
    localStorage.setItem('spar_session', JSON.stringify(userData));
  };

  const spinWheelRequest = async () => {
    if (!user) throw new Error("Not logged in");
    try {
      const { data } = await axios.post(`${API_URL}/auth/spin`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Spin failed');
    }
  };

  const recordGameScoreRequest = async (score) => {
    if (!user) throw new Error("Not logged in");
    try {
      const { data } = await axios.post(`${API_URL}/auth/game-score`, { score });
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Score recording failed');
    }
  };

  const deductCoinsRequest = async (amount) => {
    if (!user) throw new Error("Not logged in");
    try {
      const { data } = await axios.post(`${API_URL}/auth/deduct-coins`, { amount });
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Coin deduction failed');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('spar_session');
  };

  const addBooking = async (ticketData) => {
    if (!user) return;

    try {
      const { data } = await axios.post(`${API_URL}/bookings`, ticketData);

      const updatedUser = { ...user };
      if (!updatedUser.bookings) updatedUser.bookings = [];
      updatedUser.bookings.unshift(data);

      setUser(updatedUser);
      localStorage.setItem('spar_session', JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Booking sync failed:", error);
    }
  };

  const addCoins = async (amount) => {
    if (!user) return;
    const newCoins = (user.sparCoins || 0) + amount;
    setUser({ ...user, sparCoins: newCoins });
    localStorage.setItem('spar_session', JSON.stringify({ ...user, sparCoins: newCoins }));
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
      isLoading,
      isAuthModalOpen,
      setIsAuthModalOpen,
      loginUser,
      registerUser,
      updateAvatar,
      loginGoogle,
      logout,
      interceptAuth,
      closeAuthModal,
      addBooking,
      addCoins,
      syncUser,
      spinWheelRequest,
      recordGameScoreRequest,
      deductCoinsRequest,
      shouldOpenProfile,
      setShouldOpenProfile
    }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
