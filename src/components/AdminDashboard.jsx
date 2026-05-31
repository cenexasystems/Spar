import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Users, BarChart3, Ticket, MapPin, Edit3, TrendingUp, ArrowLeft, Search, Save, RotateCcw, Trash2, CheckCircle, Clock, DollarSign, XCircle, Plus, Image, Download, Filter, Tag, Phone } from 'lucide-react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import './AdminDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SERVER_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const fallbackParks = [
  { id: '1', name: "Wonderla", location: "Chennai, Tamil Nadu", price: 1489, childPrice: 1191, status: 'active', bookings: 12, image: '/wonderla_final.jpg' },
  { id: '2', name: "VGP Universal Kingdom", location: "Chennai, Tamil Nadu", price: 829, childPrice: 649, status: 'active', bookings: 8, image: '/vgp-image.jpg' },
  { id: '3', name: "MGM Dizzee World", location: "Chennai, Tamil Nadu", price: 1179, childPrice: 825, status: 'active', bookings: 5, image: '/mgm-image.jpg' },
  { id: '4', name: "Queens Land", location: "Poonamallee, Chennai", price: 1299, childPrice: 999, status: 'active', bookings: 15, image: '/queensland_final.png' },
  { id: '5', name: "Black Thunder", location: "Mettupalayam, Coimbatore", price: 1090, childPrice: 850, status: 'active', bookings: 4, image: '/black_thunder_final.jpg' }
];

const AdminDashboard = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('stats');
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [parks, setParks] = useState([]);
  const [revenueEntries, setRevenueEntries] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [platformSettings, setPlatformSettings] = useState({ convenienceFee: { enabled: true, amount: 49 } });
  
  // Modals & Forms
  const [editingPark, setEditingPark] = useState(null);
  const [editParkTab, setEditParkTab] = useState('basic');
  const [isAddingPark, setIsAddingPark] = useState(false);
  const [newPark, setNewPark] = useState({ name: '', location: '', price: '', childPrice: '', seniorPrice: '', studentPrice: '', operatingHours: '', image: '', desc: '', status: 'active', visitorCategories: [], wonderlaPricing: {} });
  const [managingCouponsFor, setManagingCouponsFor] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discountType: 'percentage', discountValue: '', expiryDate: '', usageLimit: 100, applicablePark: 'all' });
  const [viewingCouponUsage, setViewingCouponUsage] = useState(null);
  const [couponUsageData, setCouponUsageData] = useState([]);
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [parkFilter, setParkFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [bookingDateFilter, setBookingDateFilter] = useState('');
  const [proofImageModal, setProofImageModal] = useState(null);

  useEffect(() => {
    if (proofImageModal) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflowY = 'scroll';
      return () => {
        // Restore body scroll position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflowY = '';
        window.scrollTo(0, scrollY);
        if (el.parentNode) el.parentNode.removeChild(el);
        // removed setPortalRoot
      };
    }
  }, [proofImageModal]);

  const adminPassword = "admin123";
  const getToken = () => JSON.parse(localStorage.getItem('spar_session'))?.token;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (password === adminPassword) {
      const token = getToken();
      if (!token) return alert("PLEASE LOGIN AS A REGULAR USER FIRST!");
      try {
        await axios.post(`${API_URL}/auth/promote-admin`, { code: password }, { headers: { Authorization: `Bearer ${token}` } });
        setIsAuthenticated(true);
      } catch (err) { alert("AUTHORIZATION FAILED: " + (err.response?.data?.message || err.message)); }
    } else { alert("INCORRECT CODE!"); }
  };

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 10000); return () => clearInterval(iv); }, []);

  const fetchData = async () => {
    setLoading(true);
    const token = getToken();
    if (!token) return;
    try {
      const { data } = await axios.get(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
      setBookings(data.bookings || []);
      setUsers(data.users || []);
      const finalParks = data.parks || [];
      const existingNames = new Set(finalParks.map(p => p.name.toLowerCase()));
      const missingFallbacks = fallbackParks.filter(p => !existingNames.has(p.name.toLowerCase()));
      setParks([...finalParks, ...missingFallbacks]);
      setRevenueEntries(data.revenueEntries || []);
      setTotalRevenue(data.totalRevenue || 0);

      const settingsRes = await axios.get(`${API_URL}/admin/platform-settings`, { headers: { Authorization: `Bearer ${token}` } });
      setPlatformSettings(settingsRes.data);
    } catch (err) { 
      console.error("Fetch Error:", err); 
      setParks(fallbackParks); 
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const token = getToken();
    try {
      const { data } = await axios.get(`${API_URL}/admin/bookings/search?query=${encodeURIComponent(searchQuery)}`, { headers: { Authorization: `Bearer ${token}` } });
      setSearchResults(data);
    } catch (err) { console.error("Search error:", err); }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    const token = getToken();
    try {
      await axios.put(`${API_URL}/admin/bookings/${bookingId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      
      // Update local state bookings directly
      setBookings(prevBookings =>
        prevBookings.map(b => (b._id === bookingId || b.id === bookingId) ? { ...b, status: newStatus } : b)
      );
      
      // Update search results directly if search is active
      if (searchResults) {
        setSearchResults(prevResults =>
          prevResults.map(b => (b._id === bookingId || b.id === bookingId) ? { ...b, status: newStatus } : b)
        );
      }
      
      fetchData(); // Background refresh for stats
    } catch (err) { alert("Status update failed: " + (err.response?.data?.message || err.message)); }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    const token = getToken();
    try {
      await axios.post(`${API_URL}/admin/platform-settings`, platformSettings, { headers: { Authorization: `Bearer ${token}` } });
      alert('Platform settings updated successfully!');
      fetchData();
    } catch (err) {
      alert("Settings update failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAddPark = async (e) => {
    e.preventDefault();
    const token = getToken();
    try {
      await axios.post(`${API_URL}/admin/parks`, newPark, { headers: { Authorization: `Bearer ${token}` } });
      setIsAddingPark(false);
      setNewPark({ name: '', location: '', price: '', childPrice: '', seniorPrice: '', operatingHours: '', image: '', desc: '', status: 'active' });
      fetchData();
    } catch (err) { alert("Failed: " + (err.response?.data?.message || err.message)); }
  };

  const getDefaultCategories = (parkName) => {
    if (parkName.toLowerCase().includes('wonderla')) {
      return [
        { id: 'adult', name: 'Adults', condition: '>140cm', isFree: false, isActive: true, order: 1 },
        { id: 'child', name: 'Children', condition: '85–140cm', isFree: false, isActive: true, order: 2 },
        { id: 'senior', name: 'Sr. Citizen', condition: 'Age 60+', isFree: false, isActive: true, order: 3 },
        { id: 'student', name: 'Student', condition: 'College ID', isFree: false, isActive: true, order: 4 },
        { id: 'infant', name: 'Below 85cm', condition: 'FREE', isFree: true, isActive: true, order: 5 }
      ];
    } else {
      return [
        { id: 'adult', name: 'Adults', condition: 'Adults', isFree: false, isActive: true, order: 1 },
        { id: 'child', name: 'Children', condition: 'Children', isFree: false, isActive: true, order: 2 },
        { id: 'senior', name: 'Sr. Citizen', condition: 'Sr. Citizen', isFree: false, isActive: true, order: 3 },
        { id: 'student', name: 'Student', condition: 'Student', isFree: false, isActive: true, order: 4 }
      ];
    }
  };

  const handleEditParkClick = async (p) => {
    // Set basic editingPark first so modal opens immediately
    setEditingPark(p);
    setEditParkTab('basic');

    let categories = p.visitorCategories;
    if (!categories || categories.length === 0) {
      categories = getDefaultCategories(p.name);
    }

    let wPricing = {};
    let singlePrices = {};

    if (p.name === 'Wonderla') {
      wPricing = p.wonderlaPricing || {};
    } else {
      singlePrices = {
        price: p.price,
        customPricing: p.ticketPricing && p.ticketPricing.normal ? p.ticketPricing.normal : {}
      };
      // Fallback mapping
      if (p.visitorCategories) {
         p.visitorCategories.forEach(c => {
             if (p.customPricing && p.customPricing[c.id]) {
                 singlePrices.customPricing[c.id] = p.customPricing[c.id];
             }
         });
      }
    }

    setEditingPark(prev => {
      if (!prev) return null;
      return {
        ...prev,
        visitorCategories: categories,
        wonderlaPricing: p.name === 'Wonderla' ? (Object.keys(wPricing).length > 0 ? wPricing : prev.wonderlaPricing || {}) : undefined,
        ...singlePrices
      };
    });
  };

  const handleSaveCategories = async () => {
    if (!editingPark) return;
    const token = getToken();
    const parkId = editingPark._id || editingPark.id;
    const categories = editingPark.visitorCategories || [];
    
    const cleanCategories = categories.map((cat, index) => ({
      id: cat.id || cat.name.toLowerCase().replace(/[^a-z0-9]/g, '') || `cat_${index}`,
      name: cat.name,
      condition: cat.condition || '',
      isFree: !!cat.isFree,
      isActive: cat.isActive !== undefined ? !!cat.isActive : true,
      order: cat.order !== undefined ? Number(cat.order) : index + 1
    }));

    try {
      await axios.put(`${API_URL}/admin/parks/${parkId}/categories`, { categories: cleanCategories }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Visitor categories saved successfully!');
      setEditingPark({ ...editingPark, visitorCategories: cleanCategories });
    } catch (err) {
      alert("Failed to save categories: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSavePricing = async () => {
    if (!editingPark) return;
    const token = getToken();
    const parkId = editingPark._id || editingPark.id;
    
    let payload = {};
    if (editingPark.name === 'Wonderla') {
      payload.wonderlaPricing = editingPark.wonderlaPricing || {};
    } else {
      const normalPrices = {};
      const cats = editingPark.visitorCategories || [];
      cats.forEach(c => {
         normalPrices[c.id] = Number((editingPark.customPricing && editingPark.customPricing[c.id]) || 0);
      });
      // Fallback
      if (!normalPrices['adult'] && editingPark.price) normalPrices['adult'] = Number(editingPark.price);
      
      payload.ticketPricing = {
        normal: normalPrices
      };
    }

    try {
      await axios.put(`${API_URL}/admin/parks/${parkId}/pricing`, payload, { headers: { Authorization: `Bearer ${token}` } });
      alert('Ticket pricing saved successfully!');
    } catch (err) {
      alert("Failed to save pricing: " + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdatePark = async (e) => {
    e.preventDefault();
    if (!editingPark) return;
    const token = getToken();
    try {
      const parkId = editingPark._id || editingPark.id;
      // If it's a fallback park (id is short like '1' or '2'), create it instead of updating to avoid ObjectId cast errors
      if (parkId && parkId.toString().length < 24) {
        const { _id, id, ...parkData } = editingPark;
        await axios.post(`${API_URL}/admin/parks`, parkData, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.put(`${API_URL}/admin/parks/${parkId}`, editingPark, { headers: { Authorization: `Bearer ${token}` } });
      }
      setEditingPark(null);
      fetchData();
    } catch (err) { alert("Failed: " + (err.response?.data?.message || err.message)); }
  };

  const handleDeletePark = async (id) => {
    if (!window.confirm("Delete this park?")) return;
    const token = getToken();
    try {
      await axios.delete(`${API_URL}/admin/parks/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { alert("Failed: " + (err.response?.data?.message || err.message)); }
  };

  const fetchCoupons = async (park) => {
    if (!park) return;
    const token = getToken();
    try {
      const parkId = park.name || 'all';
      const { data } = await axios.get(`${API_URL}/admin/coupons/${parkId}`, { headers: { Authorization: `Bearer ${token}` } });
      setCoupons(data);
    } catch (err) { console.error("Error fetching coupons:", err); }
  };

  useEffect(() => {
    if (managingCouponsFor) fetchCoupons(managingCouponsFor);
  }, [managingCouponsFor]);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (newCoupon.discountType === 'percentage' && newCoupon.discountValue > 80) return alert("Discount % cannot exceed 80%");
    if (newCoupon.usageLimit < 1) return alert("Usage limit must be at least 1");
    if (new Date(newCoupon.expiryDate) <= new Date()) return alert("Expiry date must be in the future");
    
    const token = getToken();
    try {
      await axios.post(`${API_URL}/admin/coupons`, newCoupon, { headers: { Authorization: `Bearer ${token}` } });
      setNewCoupon({ code: '', discountType: 'percentage', discountValue: '', expiryDate: '', usageLimit: 100, applicablePark: managingCouponsFor?.name || 'all' });
      fetchCoupons(managingCouponsFor);
      alert("Created!");
    } catch (err) {
      alert("Failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    const token = getToken();
    try {
      await axios.delete(`${API_URL}/admin/coupons/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchCoupons(managingCouponsFor);
    } catch (err) {
      alert("Failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleViewUsage = async (coupon) => {
    const token = getToken();
    try {
      const { data } = await axios.get(`${API_URL}/admin/coupons/${coupon.code}/usage`, { headers: { Authorization: `Bearer ${token}` } });
      setCouponUsageData(data);
      setViewingCouponUsage(coupon);
    } catch (err) {
      alert("Failed: " + (err.response?.data?.message || err.message));
    }
  };

  const getStatusClass = (s) => 'status-' + s.replace(' ', '').toLowerCase();
  
  // Data processing
  let filteredBookings = searchResults || bookings;
  if (statusFilter !== 'all') filteredBookings = filteredBookings.filter(b => b.status === statusFilter);
  if (parkFilter !== 'all') filteredBookings = filteredBookings.filter(b => (b.parkName || '').toLowerCase().trim() === parkFilter.toLowerCase().trim());
  if (bookingDateFilter) {
    filteredBookings = filteredBookings.filter(b => {
      const bDate = new Date(b.createdAt || b.date);
      const year = bDate.getFullYear();
      const month = String(bDate.getMonth() + 1).padStart(2, '0');
      const day = String(bDate.getDate()).padStart(2, '0');
      const formattedBDate = `${year}-${month}-${day}`;
      return formattedBDate === bookingDateFilter;
    });
  }

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const verifiedCount = bookings.filter(b => b.status === 'verified').length;

  // Build real chart data from actual bookings & revenue entries
  const chartData = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dayStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
    const dayEnd   = new Date(d); dayEnd.setHours(23,59,59,999);
    const dayBookings = bookings.filter(b => {
      const c = new Date(b.createdAt);
      return c >= dayStart && c <= dayEnd;
    }).length;
    const dayRevenue = revenueEntries.filter(r => {
      const c = new Date(r.createdAt);
      return c >= dayStart && c <= dayEnd;
    }).reduce((s, r) => s + (r.amount || 0), 0);
    chartData.push({ date: dayStr, bookings: dayBookings, revenue: dayRevenue });
  }

  const filteredRevenue = revenueEntries.filter(r => {
    if (!dateRange.from && !dateRange.to) return true;
    const d = new Date(r.createdAt);
    
    // Parse 'from' date locally
    let from = new Date(0);
    if (dateRange.from) {
      const [y, m, day] = dateRange.from.split('-').map(Number);
      from = new Date(y, m - 1, day, 0, 0, 0, 0);
    }
    
    // Parse 'to' date locally
    let to = new Date();
    if (dateRange.to) {
      const [y, m, day] = dateRange.to.split('-').map(Number);
      to = new Date(y, m - 1, day, 23, 59, 59, 999);
    } else {
      to.setHours(23, 59, 59, 999);
    }
    
    return d >= from && d <= to;
  });
  
  const rangeTotalRev = filteredRevenue.reduce((acc, r) => acc + (r.amount||0), 0);
  const rangeBookingsCount = filteredRevenue.filter(r => r.source === 'booking').length;
  const rangeTotalDiscounts = bookings.filter(b => {
    if (!dateRange.from && !dateRange.to) return true;
    const d = new Date(b.createdAt);
    
    let from = new Date(0);
    if (dateRange.from) {
      const [y, m, day] = dateRange.from.split('-').map(Number);
      from = new Date(y, m - 1, day, 0, 0, 0, 0);
    }
    
    let to = new Date();
    if (dateRange.to) {
      const [y, m, day] = dateRange.to.split('-').map(Number);
      to = new Date(y, m - 1, day, 23, 59, 59, 999);
    } else {
      to.setHours(23, 59, 59, 999);
    }
    
    return d >= from && d <= to;
  }).reduce((acc, b) => acc + (b.discountAmount||0), 0);

  const exportRevenue = () => {
    const ws = XLSX.utils.json_to_sheet(filteredRevenue.map(r => ({ Date: new Date(r.createdAt).toLocaleDateString(), BookingID: r.entryId, Park: r.parkName||'N/A', Amount: r.amount })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Revenue");
    XLSX.writeFile(wb, `SPAR_Revenue_${new Date().toLocaleDateString().replace(/\//g,'-')}.xlsx`);
  };

  // Pre-compute per-user stats from real bookings
  const userStatsMap = {};
  bookings.forEach(b => {
    const uid = b.user?._id || b.user;
    if (!uid) return;
    const key = uid.toString();
    if (!userStatsMap[key]) userStatsMap[key] = { count: 0, spent: 0, lastDate: null };
    userStatsMap[key].count += 1;
    if (['verified','completed','ticketsent'].includes(b.status)) {
      userStatsMap[key].spent += (b.totalAmount || 0);
    }
    const bd = new Date(b.createdAt);
    if (!userStatsMap[key].lastDate || bd > userStatsMap[key].lastDate) {
      userStatsMap[key].lastDate = bd;
    }
  });

  const exportUsers = () => {
    const ws = XLSX.utils.json_to_sheet(users.map(u => {
      const stats = userStatsMap[u._id?.toString()] || { count: 0, spent: 0 };
      return { Name: u.name, Email: u.email, Phone: u.phone || 'N/A', Total_Bookings: stats.count, Total_Spent: stats.spent, SPAR_Coins: u.sparCoins || 0 };
    }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "SPAR_Users.xlsx");
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-overlay">
        <motion.div className="admin-login-card glass-morphism animate-fade-in" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="login-icon-wrap"><RotateCcw className="spinning-icon" size={40} /></div>
          <h2 className="admin-title">ADMIN LOGIN</h2>
          <p className="admin-subtitle" style={{marginBottom:'35px'}}>Enter your authorization code to access the admin panel.</p>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder="COMMAND CODE" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            <div className="login-actions">
              <button type="button" className="btn-cancel" onClick={onBack}>EXIT</button>
              <button type="submit" className="btn-save">AUTHORIZE</button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container animate-fade-in">
      <div className="admin-header">
        <button className="back-btn-neon" onClick={onBack}><ArrowLeft size={18} /> <span style={{fontSize:'12px', fontWeight:700, letterSpacing:'0.08em'}}>BACK TO HOME</span></button>
        <div className="admin-title-wrap" style={{textAlign:'right'}}>
          <h1 className="admin-title">ADMIN DASHBOARD <span className="title-version">v3.0</span></h1>
          <p className="admin-subtitle">Booking Verification & Revenue Center</p>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}><TrendingUp size={16} /> OVERVIEW</button>
        <button className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
          <Ticket size={16} /> BOOKINGS {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
        </button>
        <button className={`tab-btn ${activeTab === 'revenue' ? 'active' : ''}`} onClick={() => setActiveTab('revenue')}><DollarSign size={16} /> REVENUE</button>
        <button className={`tab-btn ${activeTab === 'parks' ? 'active' : ''}`} onClick={() => setActiveTab('parks')}><MapPin size={16} /> PARKS</button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}><Users size={16} /> USERS</button>
        <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><Clock size={16} /> SETTINGS</button>
      </div>

      {/* Search Bar */}
      {activeTab === 'bookings' && (
        <div className="admin-search-bar">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search by Name, SPAR ID, Ticket ID, Booking ID, Phone, Park..." value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) setSearchResults(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          <button onClick={handleSearch} className="search-go-btn">SEARCH</button>
        </div>
      )}

      <div className="admin-content">
        {/* OVERVIEW TAB */}
        {activeTab === 'stats' && (
          <div>
            <div className="stats-grid">
              <div className="stat-card revenue-glow"><BarChart3 className="stat-icon" /><div className="stat-info"><p>TOTAL REVENUE</p><h3>₹{totalRevenue.toLocaleString()}</h3></div></div>
              <div className="stat-card users-glow"><Users className="stat-icon" /><div className="stat-info"><p>TOTAL USERS</p><h3>{users.length}</h3></div></div>
              <div className="stat-card flight-glow"><Ticket className="stat-icon" /><div className="stat-info"><p>TOTAL BOOKINGS</p><h3>{bookings.length}</h3></div></div>
              <div className="stat-card" style={{ borderColor: 'rgba(255,193,7,0.3)' }}><Clock className="stat-icon" style={{ color: '#FFC107' }} /><div className="stat-info"><p>PENDING VERIFICATION</p><h3 style={{ color: '#FFC107' }}>{pendingCount}</h3></div></div>
              <div className="stat-card" style={{ borderColor: 'rgba(0,200,83,0.3)' }}><CheckCircle className="stat-icon" style={{ color: '#00C853' }} /><div className="stat-info"><p>VERIFIED</p><h3 style={{ color: '#00C853' }}>{verifiedCount}</h3></div></div>
            </div>

            {/* Row 1: Charts */}
            <div className="charts-row">
              <div className="chart-card">
                <h4 className="chart-title">BOOKINGS OVER TIME</h4>
                <div style={{height: '250px'}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{backgroundColor:'#1a1a2e', border:'none', borderRadius:'8px'}} />
                      <Line type="monotone" dataKey="bookings" stroke="#CCFF00" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="chart-card">
                <h4 className="chart-title">REVENUE OVER TIME</h4>
                <div style={{height: '250px'}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{backgroundColor:'#1a1a2e', border:'none', borderRadius:'8px'}} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                      <Bar dataKey="revenue" fill="#00e5ff" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Row 2: 3 Stat Cards */}
            <div className="stats-grid" style={{gridTemplateColumns:'1fr 1fr 1fr'}}>
              <div className="stat-card"><div className="stat-info"><p>TOP PARK THIS MONTH</p><h3>Wonderla — 42</h3></div></div>
              <div className="stat-card"><div className="stat-info"><p>AVG TICKET VALUE</p><h3>₹1,340</h3></div></div>
              <div className="stat-card"><div className="stat-info"><p>CONVERSION RATE</p><h3>67%</h3></div></div>
            </div>

            {/* Row 3: Quick Actions */}
            <div className="quick-actions-bar">
              <button className="export-btn" onClick={exportRevenue}><Download size={14}/> DOWNLOAD REVENUE — EXCEL</button>
              <button onClick={() => setActiveTab('revenue')}><Filter size={14} style={{marginRight:'8px', display:'inline'}}/> FILTER BY DATE</button>
              <button onClick={() => {setActiveTab('bookings'); setStatusFilter('pending');}}><Search size={14} style={{marginRight:'8px', display:'inline'}}/> VIEW PENDING ({pendingCount})</button>
            </div>
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div>
            <div className="booking-filters">
              <select className="filter-select" value={parkFilter} onChange={e=>setParkFilter(e.target.value)}>
                <option value="all">All Parks</option>
                {parks.map(p => <option key={p.id||p._id} value={p.name}>{p.name}</option>)}
              </select>
              <select className="filter-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="ticketsent">Ticket Sent</option>
                <option value="rejected">Rejected</option>
              </select>
              <input type="date" className="filter-select" style={{color:'#fff'}} value={bookingDateFilter} onChange={e=>setBookingDateFilter(e.target.value)} />
              <button className="btn-cancel" style={{padding:'8px 16px', fontSize:'12px'}} onClick={()=>{setParkFilter('all'); setStatusFilter('all'); setBookingDateFilter('');}}>CLEAR FILTERS</button>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead><tr><th>DATE</th><th>BOOKING ID</th><th>USER</th><th>WHATSAPP</th><th>PARK</th><th>TICKETS</th><th>AMOUNT</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
                <tbody>
                  {filteredBookings.map(b => (
                    <tr key={b._id || b.id}>
                      <td className="text-xs">{new Date(b.createdAt || b.date).toLocaleDateString()}</td>
                      <td><span className="booking-id-cell">{b.bookingId}</span></td>
                      <td>{b.userName || 'Unknown'}</td>
                      <td><a href={`https://wa.me/91${b.whatsappNumber || b.userPhone || '0000000000'}`} target="_blank" rel="noreferrer" className="whatsapp-btn"><Phone size={12}/> {b.whatsappNumber || b.userPhone || 'N/A'}</a></td>
                      <td><span className="park-tag">{b.parkName}</span></td>
                      <td>{b.tickets}</td>
                      <td className="amount-text">₹{b.totalAmount}</td>
                      <td><span className={`status-badge ${getStatusClass(b.status)}`}>{b.status}</span></td>
                      <td>
                        <div className="action-btns-row">
                          {b.status === 'pending' && <>
                            <button className="status-action-btn verify-btn" onClick={() => handleStatusUpdate(b._id, 'verified')}>✓ VERIFY</button>
                            <button className="status-action-btn reject-btn" onClick={() => handleStatusUpdate(b._id, 'rejected')}>✕ REJECT</button>
                          </>}
                          {b.status === 'verified' && <button className="status-action-btn send-ticket-btn" onClick={() => handleStatusUpdate(b._id, 'ticketsent')}>📱 SEND TICKET</button>}
                          <button className="status-action-btn" style={{background:'rgba(255,255,255,0.1)', color:'#fff', opacity: b.paymentScreenshot ? 1 : 0.5}} onClick={()=>{ if(b.paymentScreenshot) { const path = b.paymentScreenshot.replace(/\\/g, '/'); setProofImageModal(`${SERVER_URL}${path.startsWith('/') ? '' : '/'}${path}`); } else { alert('No payment proof uploaded for this booking.'); }}}>👁️ VIEW PROOF</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REVENUE TAB */}
        {activeTab === 'revenue' && (
          <div>
            <div className="revenue-header">
              <div className="date-range-selector">
                <div className="date-input-wrap"><label>FROM</label><input type="date" className="date-input" value={dateRange.from} onChange={e=>setDateRange({...dateRange, from: e.target.value})} /></div>
                <div className="date-input-wrap"><label>TO</label><input type="date" className="date-input" value={dateRange.to} onChange={e=>setDateRange({...dateRange, to: e.target.value})} /></div>
                <button 
                  className="apply-filter-btn" 
                  onClick={() => {
                    if (dateRange.from && dateRange.to) {
                      const fromDate = new Date(dateRange.from);
                      const toDate = new Date(dateRange.to);
                      if (fromDate > toDate) {
                        alert("⚠️ Validation Error: 'FROM' date cannot be after 'TO' date.");
                      } else {
                        alert("📅 Date filter applied successfully!");
                      }
                    } else if (!dateRange.from && !dateRange.to) {
                      alert("⚠️ Please select a date range first.");
                    } else {
                      alert("📅 Date filter applied successfully!");
                    }
                  }}
                >
                  APPLY FILTER
                </button>
                <button className="reset-btn" onClick={()=>setDateRange({from:'', to:''})}>RESET</button>
              </div>
              <button className="export-btn" onClick={exportRevenue}><Download size={16} /> DOWNLOAD AS EXCEL</button>
            </div>

            <div className="stats-grid" style={{gridTemplateColumns:'repeat(5, 1fr)'}}>
              <div className="stat-card"><div className="stat-info"><p>TOTAL REVENUE</p><h3 style={{color:'#C7FF00'}}>₹{rangeTotalRev.toLocaleString()}</h3></div></div>
              <div className="stat-card"><div className="stat-info"><p>BOOKINGS</p><h3>{rangeBookingsCount}</h3></div></div>
              <div className="stat-card"><div className="stat-info"><p>AVG PER BOOKING</p><h3>₹{rangeBookingsCount ? Math.floor(rangeTotalRev/rangeBookingsCount) : 0}</h3></div></div>
              <div className="stat-card"><div className="stat-info"><p>TOP PARK</p><h3>Wonderla</h3></div></div>
              <div className="stat-card" style={{ borderColor: 'rgba(107,203,119,0.3)' }}><div className="stat-info"><p>DISCOUNTS GIVEN</p><h3 style={{color:'#6BCB77'}}>₹{rangeTotalDiscounts.toLocaleString()}</h3></div></div>
            </div>

            <div className="chart-card" style={{marginTop:'20px'}}>
              <h4 className="chart-title">DAILY REVENUE</h4>
              <div style={{height: '250px'}}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.slice(-15)}>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{backgroundColor:'#1a1a2e', border:'none', borderRadius:'8px'}} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                    <Bar dataKey="revenue" fill="#CCFF00" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="admin-table-wrapper" style={{marginTop:'20px'}}>
              <table className="admin-table">
                <thead><tr><th>DATE</th><th>BOOKING ID</th><th>PARK</th><th>VISITOR</th><th>AMOUNT</th><th>COUPON</th><th>STATUS</th></tr></thead>
                <tbody>
                  {filteredRevenue.map(r => {
                    const bookingDetails = bookings.find(b => b.bookingId === r.entryId);
                    return (
                      <tr key={r._id}>
                        <td className="text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td><span className="booking-id-cell">{r.entryId || 'N/A'}</span></td>
                        <td><span className="park-tag">{r.parkName || '—'}</span></td>
                        <td>{r.userName || 'Unknown'}</td>
                        <td className="amount-text">₹{r.amount?.toLocaleString()}</td>
                        <td><span className="text-xs" style={{color: bookingDetails?.couponApplied ? '#6BCB77' : '#888'}}>{bookingDetails?.couponApplied || 'None'}</span></td>
                        <td><span className="status-badge status-verified">COMPLETED</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PARKS TAB */}
        {activeTab === 'parks' && (
          <div className="park-mgmt-wrap animate-fade-in">
            <div className="park-mgmt-header">
              <div className="mgmt-title-block"><h3 className="section-heading text-white-shimmer-rtl">PARK OPERATIONS</h3></div>
              <button className="btn-add-mission" onClick={() => setIsAddingPark(true)}><Plus size={16} /> ADD NEW PARK</button>
            </div>
            <div className="parks-list-grid">
              {parks.map(p => (
                <div key={p._id || p.id} className="park-mgmt-card">
                  <div className="park-card-header">
                    <img src={p.image} alt={p.name} className="park-thumb" />
                    <div className="park-details">
                      <h4>{p.name}</h4>
                      <p><MapPin size={12} /> {p.location}</p>
                      <div className={`park-status-toggle ${p.status === 'active' || !p.status ? 'park-status-active' : 'park-status-inactive'}`}>
                        {p.status === 'active' || !p.status ? 'ACTIVE' : 'INACTIVE'}
                      </div>
                      <div className="park-prices">
                        <span className="price-tag-admin">ADULT: ₹{p.price || p.adultPrice}</span>
                        <span className="price-tag-admin">CHILD: ₹{p.childPrice || p.price}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs" style={{marginTop:'10px', color:'#888'}}>Bookings this month: <strong style={{color:'#fff'}}>{bookings.filter(b => (b.parkName || '').trim().toLowerCase() === (p.name || '').trim().toLowerCase() && new Date(b.createdAt).getMonth() === new Date().getMonth() && new Date(b.createdAt).getFullYear() === new Date().getFullYear()).length}</strong></div>
                  
                  <div className="park-card-actions">
                      <button className="btn-edit-park" onClick={() => handleEditParkClick(p)}><Edit3 size={14}/> EDIT PARK</button>
                    <button className="btn-manage-coupons" onClick={() => setManagingCouponsFor(p)}><Tag size={14}/> MANAGE COUPONS</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit / Add Park Modal */}
            {(isAddingPark || editingPark) && createPortal(
              <div 
                className="edit-modal-overlay"
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  zIndex: 999999,
                  background: 'rgba(10, 12, 22, 0.4)',
                  backdropFilter: 'blur(15px)',
                  WebkitBackdropFilter: 'blur(15px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  overflowY: 'auto'
                }}
              >
                <div className="edit-panel glass-morphism" style={{ maxWidth: '700px', width: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3>{editingPark ? 'EDIT PARK' : 'ADD NEW PARK'}</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="button" onClick={() => setEditParkTab('basic')} style={{ background: editParkTab === 'basic' ? '#00D1FF' : 'transparent', color: editParkTab === 'basic' ? '#000' : '#fff', border: '1px solid #00D1FF', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>BASIC DETAILS</button>
                      <button type="button" onClick={() => setEditParkTab('categories')} style={{ background: editParkTab === 'categories' ? '#00D1FF' : 'transparent', color: editParkTab === 'categories' ? '#000' : '#fff', border: '1px solid #00D1FF', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>CATEGORIES</button>
                      <button type="button" onClick={() => setEditParkTab('pricing')} style={{ background: editParkTab === 'pricing' ? '#00D1FF' : 'transparent', color: editParkTab === 'pricing' ? '#000' : '#fff', border: '1px solid #00D1FF', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>PRICING</button>
                    </div>
                  </div>
                  <form onSubmit={editingPark ? handleUpdatePark : handleAddPark}>
                    {editParkTab === 'basic' && (
                      <div className="tab-content-anim">
                        <div className="input-group"><label>PARK NAME</label><input type="text" value={editingPark ? editingPark.name : newPark.name} onChange={(e) => editingPark ? setEditingPark({...editingPark, name: e.target.value}) : setNewPark({...newPark, name: e.target.value})} required /></div>
                        <div className="input-group"><label>LOCATION / ADDRESS</label><input type="text" value={editingPark ? editingPark.location : newPark.location} onChange={(e) => editingPark ? setEditingPark({...editingPark, location: e.target.value}) : setNewPark({...newPark, location: e.target.value})} required /></div>
                        
                        <div className="input-group"><label>OPERATING HOURS</label><input type="text" placeholder="e.g. 10 AM - 6 PM" value={editingPark ? editingPark.operatingHours : newPark.operatingHours} onChange={(e) => editingPark ? setEditingPark({...editingPark, operatingHours: e.target.value}) : setNewPark({...newPark, operatingHours: e.target.value})} /></div>
                        
                        <div className="input-group"><label>PARK DESCRIPTION</label><textarea rows="3" value={editingPark ? editingPark.desc : newPark.desc} onChange={(e) => editingPark ? setEditingPark({...editingPark, desc: e.target.value}) : setNewPark({...newPark, desc: e.target.value})} /></div>
                        <div className="input-group"><label>IMAGE URL</label><input type="text" value={editingPark ? editingPark.image : newPark.image} onChange={(e) => editingPark ? setEditingPark({...editingPark, image: e.target.value}) : setNewPark({...newPark, image: e.target.value})} /></div>
                        
                        <div className="input-group">
                          <label>STATUS</label>
                          <select value={editingPark ? editingPark.status : newPark.status} onChange={(e) => editingPark ? setEditingPark({...editingPark, status: e.target.value}) : setNewPark({...newPark, status: e.target.value})}>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {editParkTab === 'categories' && (() => {
                      const categories = editingPark ? (editingPark.visitorCategories || []) : (newPark.visitorCategories || []);
                      const updateCategory = (index, field, value) => {
                        const updated = [...categories];
                        updated[index] = { ...updated[index], [field]: value };
                        if (editingPark) setEditingPark({...editingPark, visitorCategories: updated});
                        else setNewPark({...newPark, visitorCategories: updated});
                      };
                      const removeCategory = (index) => {
                        const updated = categories.filter((_, i) => i !== index);
                        if (editingPark) setEditingPark({...editingPark, visitorCategories: updated});
                        else setNewPark({...newPark, visitorCategories: updated});
                      };
                      const addCategory = () => {
                        const updated = [...categories, { name: '', condition: '', isFree: false, isActive: true }];
                        if (editingPark) setEditingPark({...editingPark, visitorCategories: updated});
                        else setNewPark({...newPark, visitorCategories: updated});
                      };
                      
                      return (
                        <div className="tab-content-anim">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#888' }}>VISITOR CATEGORIES</label>
                            <button type="button" onClick={addCategory} style={{ background: 'rgba(0, 209, 255, 0.1)', color: '#00D1FF', border: '1px solid rgba(0, 209, 255, 0.3)', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>+ ADD CATEGORY</button>
                          </div>
                          
                          {categories.length === 0 ? (
                            <p style={{ fontSize: '12px', color: '#666', textAlign: 'center', padding: '20px 0' }}>No categories defined. Add one above.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {categories.map((cat, idx) => (
                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr auto auto auto', gap: '10px', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                  <input type="text" placeholder="Name (e.g. Adults)" value={cat.name} onChange={(e) => updateCategory(idx, 'name', e.target.value)} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', fontSize: '12px', width: '100%' }} />
                                  <input type="text" placeholder="Condition (e.g. >140cm)" value={cat.condition} onChange={(e) => updateCategory(idx, 'condition', e.target.value)} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', fontSize: '12px', width: '100%' }} />
                                  
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#ccc', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={cat.isFree} onChange={(e) => updateCategory(idx, 'isFree', e.target.checked)} />
                                    Free
                                  </label>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#ccc', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={cat.isActive} onChange={(e) => updateCategory(idx, 'isActive', e.target.checked)} />
                                    Active
                                  </label>
                                  
                                  <button type="button" onClick={() => removeCategory(idx)} style={{ background: 'none', border: 'none', color: '#FF3D3D', cursor: 'pointer', padding: '4px' }} title="Remove Category">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-start' }}>
                            <button type="button" onClick={handleSaveCategories} className="btn-save" style={{ padding: '8px 16px', fontSize: '12px' }}>
                              <Save size={14} style={{ marginRight: '6px' }} /> SAVE CATEGORIES
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {editParkTab === 'pricing' && (
                      <div className="tab-content-anim">
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom: '15px'}}>
                          {(editingPark ? editingPark.visitorCategories : newPark.visitorCategories)?.map(cat => (
                            <div className="input-group" key={cat.id}>
                              <label>{cat.name.toUpperCase()} PRICE (₹)</label>
                              <input 
                                type="number" 
                                value={(editingPark ? editingPark.customPricing?.[cat.id] : newPark.customPricing?.[cat.id]) || ''} 
                                onChange={(e) => {
                                  if (editingPark) {
                                    setEditingPark({...editingPark, customPricing: {...(editingPark.customPricing || {}), [cat.id]: e.target.value}});
                                  } else {
                                    setNewPark({...newPark, customPricing: {...(newPark.customPricing || {}), [cat.id]: e.target.value}});
                                  }
                                }} 
                                required={cat.id === 'adult'}
                              />
                            </div>
                          ))}
                        </div>

                        {(editingPark?.name === 'Wonderla' || newPark?.name === 'Wonderla') && (() => {
                          const wPricing = editingPark ? (editingPark.wonderlaPricing || {}) : (newPark.wonderlaPricing || {});
                          
                          const updateLocData = (loc, field, val) => {
                            const updated = { ...wPricing, [loc]: { ...wPricing[loc], [field]: val } };
                            if (editingPark) setEditingPark({...editingPark, wonderlaPricing: updated});
                            else setNewPark({...newPark, wonderlaPricing: updated});
                          };

                          const updateLocPrice = (loc, tier, ticket, val) => {
                            const updated = { ...wPricing };
                            if (!updated[loc][tier]) updated[loc][tier] = {};
                            updated[loc][tier][ticket] = Number(val);
                            if (editingPark) setEditingPark({...editingPark, wonderlaPricing: updated});
                            else setNewPark({...newPark, wonderlaPricing: updated});
                          };

                          const addLocation = () => {
                            const locName = prompt("Enter new location name (e.g. bangalore, kochi):");
                            if (!locName || wPricing[locName]) return;
                            const initialPrices = {};
                            (editingPark ? editingPark.visitorCategories : newPark.visitorCategories)?.forEach(c => initialPrices[c.id] = 0);
                            const updated = { ...wPricing, [locName.toLowerCase()]: { normal: { ...initialPrices }, fasttrack: { adult: 0, child: 0 }, fastTrackAvailable: false, parkHours: '', waterHours: '' } };
                            if (editingPark) setEditingPark({...editingPark, wonderlaPricing: updated});
                            else setNewPark({...newPark, wonderlaPricing: updated});
                          };

                          const removeLocation = (loc) => {
                            const updated = { ...wPricing };
                            delete updated[loc];
                            if (editingPark) setEditingPark({...editingPark, wonderlaPricing: updated});
                            else setNewPark({...newPark, wonderlaPricing: updated});
                          };

                          return (
                            <div className="input-group" style={{ marginTop: '20px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <div>
                                  <label style={{ color: '#00D1FF' }}>WONDERLA LOCATIONS PRICING</label>
                                  <p style={{fontSize: '11px', color: '#888'}}>Manage pricing for specific Wonderla locations.</p>
                                </div>
                                <button type="button" onClick={addLocation} style={{ background: 'rgba(0, 209, 255, 0.1)', color: '#00D1FF', border: '1px solid rgba(0, 209, 255, 0.3)', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>+ ADD LOCATION</button>
                              </div>

                              {Object.keys(wPricing).length === 0 ? (
                                <p style={{ fontSize: '12px', color: '#666', textAlign: 'center', padding: '10px 0' }}>No locations added.</p>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                  {Object.entries(wPricing).map(([loc, data]) => (
                                    <div key={loc} style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(0,209,255,0.2)' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <h4 style={{ margin: 0, color: '#fff', textTransform: 'uppercase', fontSize: '14px', letterSpacing: '1px' }}>📍 {loc}</h4>
                                        <button type="button" onClick={() => removeLocation(loc)} style={{ background: 'none', border: 'none', color: '#FF3D3D', cursor: 'pointer' }}><Trash2 size={14}/></button>
                                      </div>

                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                        <div><label style={{ fontSize: '10px', color: '#888' }}>PARK HOURS</label><input type="text" value={data.parkHours || ''} onChange={(e) => updateLocData(loc, 'parkHours', e.target.value)} style={{ padding: '6px', fontSize: '12px', width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }} placeholder="e.g. 11AM–7PM" /></div>
                                        <div><label style={{ fontSize: '10px', color: '#888' }}>WATER HOURS</label><input type="text" value={data.waterHours || ''} onChange={(e) => updateLocData(loc, 'waterHours', e.target.value)} style={{ padding: '6px', fontSize: '12px', width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }} placeholder="e.g. 12PM–6PM" /></div>
                                      </div>

                                      <div style={{ marginBottom: '10px' }}>
                                        <label style={{ fontSize: '11px', color: '#C7FF00', fontWeight: 'bold' }}>NORMAL TICKETS (₹)</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px', marginTop: '4px' }}>
                                          {(editingPark ? editingPark.visitorCategories : newPark.visitorCategories)?.map(cat => (
                                            <div key={cat.id}>
                                              <span style={{fontSize:'10px', color:'#888', textTransform:'capitalize'}}>{cat.name}</span>
                                              <input type="number" value={data.normal?.[cat.id] || 0} onChange={(e) => updateLocPrice(loc, 'normal', cat.id, e.target.value)} style={{ width: '100%', padding: '4px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }} />
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <input type="checkbox" checked={data.fastTrackAvailable || false} onChange={(e) => updateLocData(loc, 'fastTrackAvailable', e.target.checked)} />
                                        <label style={{ fontSize: '11px', color: '#BF00FF', fontWeight: 'bold' }}>FAST-TRACK TICKETS (₹)</label>
                                      </div>
                                      
                                      {data.fastTrackAvailable && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                          <div><span style={{fontSize:'10px', color:'#888'}}>Adult</span><input type="number" value={data.fasttrack?.adult || 0} onChange={(e) => updateLocPrice(loc, 'fasttrack', 'adult', e.target.value)} style={{ width: '100%', padding: '4px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} /></div>
                                          <div><span style={{fontSize:'10px', color:'#888'}}>Child</span><input type="number" value={data.fasttrack?.child || 0} onChange={(e) => updateLocPrice(loc, 'fasttrack', 'child', e.target.value)} style={{ width: '100%', padding: '4px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} /></div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-start' }}>
                            <button type="button" onClick={handleSavePricing} className="btn-save" style={{ padding: '8px 16px', fontSize: '12px' }}>
                              <Save size={14} style={{ marginRight: '6px' }} /> SAVE PRICING
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                    <div className="edit-actions" style={{marginTop: '20px'}}>
                      <button type="button" className="btn-cancel" onClick={() => { setIsAddingPark(false); setEditingPark(null); setEditParkTab('basic'); }}>CANCEL</button>
                      <button type="submit" className="btn-save"><Save size={16} /> {editingPark ? 'UPDATE PARK' : 'SAVE PARK'}</button>
                    </div>
                  </form>
                </div>
              </div>,
              document.body
            )}
            {/* Coupon Management Panel - Clean UI Match */}
            {managingCouponsFor && createPortal(
              <div
                onClick={() => { setManagingCouponsFor(null); setViewingCouponUsage(null); }}
                style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8, 10, 15, 0.85)', backdropFilter: 'blur(16px)', zIndex: 100000, cursor: 'zoom-out' }}
              >
                <div 
                  onClick={(e) => e.stopPropagation()} 
                  style={{ 
                    position: 'relative',
                    width: '95%', 
                    maxWidth: '550px', 
                    height: '85vh', 
                    maxHeight: '750px',
                    display: 'flex', 
                    flexDirection: 'column',
                    background: 'rgba(15, 17, 26, 0.95)', 
                    borderRadius: '24px', 
                    border: '1px solid rgba(0, 209, 255, 0.3)', 
                    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
                    overflow: 'hidden',
                    cursor: 'default'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: 'rgba(255, 255, 255, 0.02)'
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#00D1FF', letterSpacing: '0.05em' }}>COUPONS</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>{managingCouponsFor.name}</p>
                    </div>
                    <button 
                      onClick={() => { setManagingCouponsFor(null); setViewingCouponUsage(null); }} 
                      style={{ 
                        cursor: 'pointer', padding: '6px', borderRadius: '50%', background: 'rgba(255, 61, 61, 0.15)', border: '1px solid rgba(255, 61, 61, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255, 61, 61, 0.4)'; e.currentTarget.style.borderColor = 'rgba(255, 61, 61, 0.8)'; e.currentTarget.style.transform = 'scale(1.15)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255, 61, 61, 0.15)'; e.currentTarget.style.borderColor = 'rgba(255, 61, 61, 0.3)'; e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <XCircle size={20} color="#FF3D3D" />
                    </button>
                  </div>
                  
                  <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                    {viewingCouponUsage ? (
                      <div className="usage-view">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                          <button style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'6px 12px', borderRadius:'8px', fontSize:'11px', fontWeight:'600', cursor:'pointer'}} onClick={() => setViewingCouponUsage(null)}>← BACK</button>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#C7FF00', letterSpacing: '0.05em' }}>USAGE: {viewingCouponUsage.code}</span>
                        </div>
                        {couponUsageData.length === 0 ? (
                          <p className="text-xs" style={{color:'#888', textAlign: 'center', marginTop: '40px'}}>No usage history for this coupon.</p>
                        ) : (
                          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <table className="admin-table" style={{marginTop:0}}>
                              <thead><tr><th>BOOKING ID</th><th>VISITOR</th><th>DATE</th><th>DISCOUNT</th><th>PAID</th></tr></thead>
                              <tbody>
                                {couponUsageData.map(b => (
                                  <tr key={b._id}>
                                    <td>{b.bookingId}</td>
                                    <td>{b.userName || 'Unknown'}</td>
                                    <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                                    <td style={{color:'#6BCB77'}}>₹{b.discountAmount || 0}</td>
                                    <td>₹{b.totalAmount}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <div>
                          <div style={{fontSize:'11px', fontWeight:'700', letterSpacing:'0.1em', marginBottom:'15px', color:'#888'}}>EXISTING COUPONS</div>
                          {coupons.map((c) => (
                            <div key={c._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontFamily: "'Courier New', monospace", fontSize: '20px', fontWeight: '800', color: '#C7FF00', letterSpacing: '2px' }}>{c.code}</div>
                                <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: c.isActive ? 'rgba(0, 200, 83, 0.1)' : 'rgba(255, 61, 61, 0.1)', color: c.isActive ? '#00C853' : '#FF3D3D', fontWeight: 'bold' }}>{c.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#aaa' }}>
                                <div><span style={{ color: '#888' }}>Value:</span> {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}</div>
                                <div><span style={{ color: '#888' }}>Expires:</span> {new Date(c.expiryDate).toLocaleDateString()}</div>
                                <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#888' }}>Used:</span> {c.usedCount} / {c.usageLimit}</div>
                              </div>
                              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                <button style={{ flex: 1, background: 'rgba(0,209,255,0.1)', color: '#00D1FF', border: '1px solid rgba(0,209,255,0.2)', padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }} onClick={() => handleViewUsage(c)}><TrendingUp size={12}/> USAGE</button>
                                <button style={{ flex: 1, background: 'rgba(255,61,61,0.1)', color: '#FF3D3D', border: '1px solid rgba(255,61,61,0.2)', padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }} onClick={() => handleDeleteCoupon(c._id)}><Trash2 size={12}/> DELETE</button>
                              </div>
                            </div>
                          ))}
                          {coupons.length === 0 && <div style={{ textAlign: 'center', padding: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', color: '#888', fontSize: '13px' }}>No active coupons found for this park.</div>}
                        </div>

                        <div style={{ background: 'rgba(0, 209, 255, 0.03)', border: '1px dashed rgba(0, 209, 255, 0.2)', padding: '24px', borderRadius: '20px' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '20px', color: '#00D1FF', letterSpacing: '0.05em' }}><Plus size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }}/> GENERATE NEW COUPON</h4>
                          <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                              <label>COUPON CODE</label>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <input type="text" value={newCoupon.code} onChange={e=>setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} required style={{ flex: 1 }} />
                                <button type="button" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '0 16px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }} onClick={()=>setNewCoupon({...newCoupon, code: 'SPAR' + Math.floor(Math.random()*9000+1000)})}>AUTO</button>
                              </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>TYPE</label>
                                <select value={newCoupon.discountType} onChange={e=>setNewCoupon({...newCoupon, discountType: e.target.value})} style={{ backgroundColor: '#1a1a2e' }}>
                                  <option value="percentage">% Percentage</option>
                                  <option value="fixed">₹ Fixed Amount</option>
                                </select>
                              </div>
                              <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>VALUE</label>
                                <input type="number" value={newCoupon.discountValue} onChange={e=>setNewCoupon({...newCoupon, discountValue: e.target.value})} required min="1" max={newCoupon.discountType==='percentage'?80:9999} />
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>EXPIRY DATE</label>
                                <input type="date" value={newCoupon.expiryDate} onChange={e=>setNewCoupon({...newCoupon, expiryDate: e.target.value})} required />
                              </div>
                              <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>USAGE LIMIT</label>
                                <input type="number" value={newCoupon.usageLimit} onChange={e=>setNewCoupon({...newCoupon, usageLimit: e.target.value})} required min="1" />
                              </div>
                            </div>
                            
                            <button type="submit" style={{ background: '#00D1FF', color: '#000', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', letterSpacing: '0.05em', cursor: 'pointer', marginTop: '10px', transition: '0.2s' }} onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.1)'} onMouseLeave={e=>e.currentTarget.style.filter='none'}>
                              CREATE COUPON
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div>
            <div className="quick-actions-bar" style={{justifyContent:'flex-end'}}>
              <button className="export-btn" onClick={exportUsers}><Download size={14}/> DOWNLOAD USERS — EXCEL</button>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead><tr><th>USER NAME</th><th>EMAIL</th><th>PHONE</th><th>TOTAL BOOKINGS</th><th>AMOUNT SPENT</th><th>LAST BOOKING</th><th>SPAR COINS</th></tr></thead>
                <tbody>
                  {users.map(u => {
                    const stats = userStatsMap[u._id?.toString()] || { count: 0, spent: 0, lastDate: null };
                    return (
                      <tr key={u._id || u.id}>
                        <td className="cadet-name-cell"><img src={u.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + u.email} alt="avatar" />{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.phone || 'N/A'}</td>
                        <td>{stats.count}</td>
                        <td>₹{stats.spent.toLocaleString('en-IN')}</td>
                        <td className="text-xs">{stats.lastDate ? stats.lastDate.toLocaleDateString('en-IN') : '—'}</td>
                        <td className="coin-text">{u.sparCoins || 0} SC</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="settings-tab-content">
            <h3 className="section-heading text-white-shimmer-rtl" style={{marginBottom: '20px'}}>PLATFORM SETTINGS</h3>
            <div className="settings-card glass-morphism" style={{maxWidth: '600px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', padding: '24px'}}>
              <form onSubmit={handleUpdateSettings}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'}}>
                  <div>
                    <h4 style={{fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '4px'}}>Convenience Fee</h4>
                    <p style={{fontSize: '12px', color: '#888'}}>Apply a global convenience fee to all bookings.</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={platformSettings.convenienceFee?.enabled || false} onChange={e => setPlatformSettings({...platformSettings, convenienceFee: {...platformSettings.convenienceFee, enabled: e.target.checked}})} />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                {platformSettings.convenienceFee?.enabled && (
                  <div className="input-group" style={{marginBottom: '20px'}}>
                    <label>FEE AMOUNT (₹)</label>
                    <input type="number" value={platformSettings.convenienceFee?.amount || 0} onChange={e => setPlatformSettings({...platformSettings, convenienceFee: {...platformSettings.convenienceFee, amount: Number(e.target.value)}})} required style={{width: '150px'}} />
                  </div>
                )}

                <div className="edit-actions" style={{marginTop: '30px', justifyContent: 'flex-start'}}>
                  <button type="submit" className="btn-save"><Save size={16} /> SAVE SETTINGS</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {proofImageModal && createPortal(
        <div
          onClick={() => setProofImageModal(null)}
          style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
        >
          {/* Main Modal Container */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              position: 'relative',
              width: '95%', 
              maxWidth: '550px', 
              height: '85vh', 
              maxHeight: '750px',
              display: 'flex', 
              flexDirection: 'column',
              background: 'rgba(15, 17, 26, 0.95)', 
              borderRadius: '24px', 
              border: '1px solid rgba(199, 255, 0, 0.2)', 
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
              overflow: 'hidden',
              cursor: 'default'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#00D1FF', letterSpacing: '0.05em' }}>PAYMENT PROOF VERIFICATION</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#888' }}>Verify GPay / Transaction screenshot</p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Open in new tab button */}
                <button 
                  onClick={() => window.open(proofImageModal, '_blank')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: '0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <Download size={12} /> OPEN ORIGINAL
                </button>

                {/* Close Button */}
                <button 
                  onClick={() => setProofImageModal(null)} 
                  style={{ 
                    cursor: 'pointer', 
                    padding: '6px', 
                    borderRadius: '50%', 
                    background: 'rgba(255, 61, 61, 0.15)', 
                    border: '1px solid rgba(255, 61, 61, 0.3)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255, 61, 61, 0.4)';
                    e.currentTarget.style.borderColor = 'rgba(255, 61, 61, 0.8)';
                    e.currentTarget.style.transform = 'scale(1.15)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 61, 61, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(255, 61, 61, 0.3)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <XCircle size={20} color="#FF3D3D" />
                </button>
              </div>
            </div>

            {/* Image Viewer area */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0a0b10', overflow: 'hidden' }}>
              <img 
                src={proofImageModal} 
                alt="Payment Proof" 
                onError={(e) => { 
                  e.target.onerror = null; 
                  e.target.style.display = 'none';
                  e.target.parentNode.insertAdjacentHTML('beforeend', '<div style="color: #FF3D3D; font-weight: bold; font-size: 18px; text-align: center; text-shadow: 0 4px 20px rgba(0,0,0,0.8);">⚠️ IMAGE NOT FOUND<br/><span style="font-size: 13px; color: rgba(255,255,255,0.6); font-weight: normal; margin-top: 8px; display: block;">The file might have been deleted or not uploaded properly.</span></div>');
                }}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)' }} 
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminDashboard;
