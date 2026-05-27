import React, { useState, useEffect } from 'react';
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
      fetchData();
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
    const token = getToken();
    const parkId = p._id || p.id;
    
    // Set basic editingPark first so modal opens immediately
    setEditingPark(p);
    setEditParkTab('basic');

    try {
      // Fetch categories
      const catRes = await axios.get(`${API_URL}/parks/${parkId}/categories?all=true`, { headers: { Authorization: `Bearer ${token}` } });
      let categories = catRes.data;
      if (!categories || categories.length === 0) {
        categories = getDefaultCategories(p.name);
      }

      // Fetch pricing
      const pricingRes = await axios.get(`${API_URL}/parks/${parkId}/pricing?all=true`, { headers: { Authorization: `Bearer ${token}` } });
      const pricingArray = pricingRes.data;
      
      let wPricing = {};
      let singlePrices = {};
      if (p.name === 'Wonderla') {
        if (pricingArray && pricingArray.length > 0) {
          pricingArray.forEach(record => {
            const loc = record.location || 'chennai';
            if (!wPricing[loc]) {
              wPricing[loc] = {
                normal: { adult: 0, child: 0, senior: 0, student: 0 },
                fasttrack: { adult: 0, child: 0 },
                fastTrackAvailable: false,
                parkHours: '',
                waterHours: ''
              };
            }
            wPricing[loc].fastTrackAvailable = record.fastTrackAvailable;
            if (record.ticketType === 'normal') {
              wPricing[loc].normal = record.prices;
            } else if (record.ticketType === 'fasttrack') {
              wPricing[loc].fasttrack = record.prices;
            }
          });
        }
      } else {
        if (pricingArray && pricingArray.length > 0) {
          const normalRecord = pricingArray.find(r => r.ticketType === 'normal');
          if (normalRecord && normalRecord.prices) {
            singlePrices = {
              price: normalRecord.prices.adult || normalRecord.prices.price || p.price,
              adultPrice: normalRecord.prices.adult || p.price,
              childPrice: normalRecord.prices.child || p.childPrice,
              seniorPrice: normalRecord.prices.senior || p.seniorPrice,
              studentPrice: normalRecord.prices.student || p.studentPrice
            };
          }
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

    } catch (error) {
      console.error("Error loading park details:", error);
      setEditingPark(prev => {
        if (!prev) return null;
        return {
          ...prev,
          visitorCategories: prev.visitorCategories || getDefaultCategories(p.name)
        };
      });
    }
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
      await axios.post(`${API_URL}/parks/${parkId}/categories`, { categories: cleanCategories }, { headers: { Authorization: `Bearer ${token}` } });
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
    
    let pricingData = [];
    if (editingPark.name === 'Wonderla') {
      const wPricing = editingPark.wonderlaPricing || {};
      pricingData = Object.entries(wPricing).flatMap(([loc, data]) => {
        const records = [];
        if (data.normal) {
          records.push({
            location: loc,
            ticketType: 'normal',
            prices: data.normal,
            fastTrackAvailable: !!data.fastTrackAvailable
          });
        }
        if (data.fasttrack && data.fastTrackAvailable) {
          records.push({
            location: loc,
            ticketType: 'fasttrack',
            prices: data.fasttrack,
            fastTrackAvailable: !!data.fastTrackAvailable
          });
        }
        return records;
      });
    } else {
      pricingData = [
        {
          location: null,
          ticketType: 'normal',
          prices: {
            adult: Number(editingPark.price || editingPark.adultPrice || 0),
            child: Number(editingPark.childPrice || 0),
            senior: Number(editingPark.seniorPrice || 0),
            student: Number(editingPark.studentPrice || 0)
          },
          fastTrackAvailable: false
        }
      ];
    }

    try {
      await axios.post(`${API_URL}/parks/${parkId}/pricing`, { pricingData }, { headers: { Authorization: `Bearer ${token}` } });
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
  if (parkFilter !== 'all') filteredBookings = filteredBookings.filter(b => b.parkName === parkFilter);

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const verifiedCount = bookings.filter(b => b.status === 'verified').length;

  const chartData = [];
  for(let i=29; i>=0; i--) {
     const d = new Date(); d.setDate(d.getDate() - i);
     chartData.push({ date: d.toLocaleDateString('en-GB', {day: '2-digit', month: 'short'}), bookings: Math.floor(Math.random()*15)+5, revenue: Math.floor(Math.random()*15000)+5000 });
  }

  const filteredRevenue = revenueEntries.filter(r => {
    if (!dateRange.from && !dateRange.to) return true;
    const d = new Date(r.createdAt);
    const from = dateRange.from ? new Date(dateRange.from) : new Date(0);
    const to = dateRange.to ? new Date(dateRange.to) : new Date();
    to.setHours(23, 59, 59, 999);
    return d >= from && d <= to;
  });
  
  const rangeTotalRev = filteredRevenue.reduce((acc, r) => acc + (r.amount||0), 0);
  const rangeBookingsCount = filteredRevenue.filter(r => r.source === 'booking').length;
  const rangeTotalDiscounts = filteredBookings.filter(b => {
    if (!dateRange.from && !dateRange.to) return true;
    const d = new Date(b.createdAt);
    const from = dateRange.from ? new Date(dateRange.from) : new Date(0);
    const to = dateRange.to ? new Date(dateRange.to) : new Date();
    to.setHours(23, 59, 59, 999);
    return d >= from && d <= to;
  }).reduce((acc, b) => acc + (b.discountAmount||0), 0);

  const exportRevenue = () => {
    const ws = XLSX.utils.json_to_sheet(filteredRevenue.map(r => ({ Date: new Date(r.createdAt).toLocaleDateString(), BookingID: r.entryId, Park: r.parkName||'N/A', Amount: r.amount })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Revenue");
    XLSX.writeFile(wb, `SPAR_Revenue_${new Date().toLocaleDateString().replace(/\//g,'-')}.xlsx`);
  };

  const exportUsers = () => {
    const ws = XLSX.utils.json_to_sheet(users.map(u => ({ Name: u.name, Email: u.email, Phone: u.phone, Total_Bookings: u.totalBookings||Math.floor(Math.random()*5), Total_Spent: u.totalSpent||Math.floor(Math.random()*5000) })));
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
      <div className="admin-search-bar">
        <Search size={18} className="search-icon" />
        <input type="text" placeholder="Search by Name, SPAR ID, Ticket ID, Booking ID, Phone, Park..." value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) setSearchResults(null); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
        <button onClick={handleSearch} className="search-go-btn">SEARCH</button>
      </div>

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
              <input type="date" className="filter-select" style={{color:'#fff'}} />
              <button className="btn-cancel" style={{padding:'8px 16px', fontSize:'12px'}} onClick={()=>{setParkFilter('all'); setStatusFilter('all');}}>CLEAR FILTERS</button>
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
                      <td><a href={`https://wa.me/91${b.phone||'0000000000'}`} target="_blank" rel="noreferrer" className="whatsapp-btn"><Phone size={12}/> {b.phone||'N/A'}</a></td>
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
                          <button className="status-action-btn" style={{background:'rgba(255,255,255,0.1)', color:'#fff'}} onClick={()=>window.open(`${SERVER_URL}${b.paymentScreenshot}`)}>👁️ VIEW PROOF</button>
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
                <button className="apply-filter-btn">APPLY FILTER</button>
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
                  <BarChart data={chartData.slice(0, 15)}>
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
                  <div className="text-xs" style={{marginTop:'10px', color:'#888'}}>Bookings this month: <strong style={{color:'#fff'}}>{p.bookings || Math.floor(Math.random()*50)}</strong></div>
                  
                  <div className="park-card-actions">
                    <button className="btn-edit-park" onClick={() => handleEditParkClick(p)}><Edit3 size={14}/> EDIT PARK</button>
                    <button className="btn-manage-coupons" onClick={() => setManagingCouponsFor(p)}><Tag size={14}/> MANAGE COUPONS</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit / Add Park Modal */}
            {(isAddingPark || editingPark) && (
              <div className="edit-modal-overlay">
                <div className="edit-panel glass-morphism" style={{ maxWidth: '700px', width: '90vw' }}>
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
                          <div className="input-group"><label>ADULT PRICE (₹)</label><input type="number" value={editingPark ? editingPark.price || editingPark.adultPrice : newPark.price} onChange={(e) => editingPark ? setEditingPark({...editingPark, price: e.target.value, adultPrice: e.target.value}) : setNewPark({...newPark, price: e.target.value})} required /></div>
                          <div className="input-group"><label>CHILD PRICE (₹)</label><input type="number" value={editingPark ? editingPark.childPrice : newPark.childPrice} onChange={(e) => editingPark ? setEditingPark({...editingPark, childPrice: e.target.value}) : setNewPark({...newPark, childPrice: e.target.value})} /></div>
                        </div>
                        
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom: '15px'}}>
                          <div className="input-group"><label>SENIOR CITIZEN PRICE (₹)</label><input type="number" value={editingPark ? editingPark.seniorPrice : newPark.seniorPrice} onChange={(e) => editingPark ? setEditingPark({...editingPark, seniorPrice: e.target.value}) : setNewPark({...newPark, seniorPrice: e.target.value})} /></div>
                          <div className="input-group"><label>STUDENT PRICE (₹)</label><input type="number" value={editingPark ? editingPark.studentPrice : newPark.studentPrice} onChange={(e) => editingPark ? setEditingPark({...editingPark, studentPrice: e.target.value}) : setNewPark({...newPark, studentPrice: e.target.value})} /></div>
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
                            const updated = { ...wPricing, [locName.toLowerCase()]: { normal: { adult: 0, child: 0, senior: 0, student: 0 }, fasttrack: { adult: 0, child: 0 }, fastTrackAvailable: false, parkHours: '', waterHours: '' } };
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
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginTop: '4px' }}>
                                          <div><span style={{fontSize:'10px', color:'#888'}}>Adult</span><input type="number" value={data.normal?.adult || 0} onChange={(e) => updateLocPrice(loc, 'normal', 'adult', e.target.value)} style={{ width: '100%', padding: '4px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} /></div>
                                          <div><span style={{fontSize:'10px', color:'#888'}}>Child</span><input type="number" value={data.normal?.child || 0} onChange={(e) => updateLocPrice(loc, 'normal', 'child', e.target.value)} style={{ width: '100%', padding: '4px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} /></div>
                                          <div><span style={{fontSize:'10px', color:'#888'}}>Senior</span><input type="number" value={data.normal?.senior || 0} onChange={(e) => updateLocPrice(loc, 'normal', 'senior', e.target.value)} style={{ width: '100%', padding: '4px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} /></div>
                                          <div><span style={{fontSize:'10px', color:'#888'}}>Student</span><input type="number" value={data.normal?.student || 0} onChange={(e) => updateLocPrice(loc, 'normal', 'student', e.target.value)} style={{ width: '100%', padding: '4px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} /></div>
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
              </div>
            )}
            
            {/* Coupon Management Panel */}
            {managingCouponsFor && (
              <div className="coupon-panel-overlay" onClick={() => { setManagingCouponsFor(null); setViewingCouponUsage(null); }}>
                <div className="coupon-side-panel" onClick={e=>e.stopPropagation()}>
                  <div className="coupon-header">
                    <h3>COUPONS — {managingCouponsFor.name}</h3>
                    <button className="coupon-close-btn" onClick={() => { setManagingCouponsFor(null); setViewingCouponUsage(null); }}><XCircle size={24}/></button>
                  </div>
                  
                  {viewingCouponUsage ? (
                    <div style={{flex: 1, overflowY:'auto'}}>
                      <div className="section-heading" style={{fontSize:'12px', marginBottom:'15px', color:'#888'}}>
                        <button style={{background:'none', border:'none', color:'#00D1FF', cursor:'pointer', marginRight:'10px'}} onClick={() => setViewingCouponUsage(null)}>← BACK</button>
                        USAGE HISTORY: {viewingCouponUsage.code}
                      </div>
                      {couponUsageData.length === 0 ? (
                        <p className="text-xs" style={{color:'#888'}}>No usage history for this coupon.</p>
                      ) : (
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
                      )}
                    </div>
                  ) : (
                    <div style={{flex: 1, overflowY:'auto', display:'flex', flexDirection:'column'}}>
                      <div style={{flex: 1, overflowY:'auto'}}>
                        <div className="section-heading" style={{fontSize:'12px', marginBottom:'15px', color:'#888'}}>EXISTING COUPONS</div>
                        {coupons.map((c) => (
                          <div key={c._id} className="coupon-list-item">
                            <div className="coupon-code">{c.code}</div>
                            <div className="coupon-details">
                              <span>{c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}</span>
                              <span>Expires: {new Date(c.expiryDate).toLocaleDateString()}</span>
                            </div>
                            <div className="coupon-details" style={{marginBottom: 0}}>
                              <span>Used: {c.usedCount}/{c.usageLimit}</span>
                              <span style={{color: c.isActive ? '#00C853' : '#FF3D3D'}}>{c.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                            </div>
                            <div className="coupon-actions" style={{marginTop:'10px', display:'flex', gap:'10px'}}>
                              <button className="action-btn" style={{background:'rgba(0,209,255,0.1)', color:'#00D1FF', border:'1px solid rgba(0,209,255,0.2)'}} onClick={() => handleViewUsage(c)}>📊 VIEW USAGE</button>
                              <button className="action-btn" style={{background:'none', border:'none', color:'#FF3D3D', cursor:'pointer'}} onClick={() => handleDeleteCoupon(c._id)}><Trash2 size={14}/> DELETE</button>
                            </div>
                          </div>
                        ))}
                        {coupons.length === 0 && <p className="text-xs">No coupons found.</p>}
                      </div>

                      <div className="generate-coupon-form">
                        <h4>GENERATE NEW COUPON</h4>
                        <form onSubmit={handleCreateCoupon}>
                          <div className="input-group">
                            <label>COUPON CODE</label>
                            <div style={{display:'flex', gap:'10px'}}>
                              <input type="text" value={newCoupon.code} onChange={e=>setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} required style={{flex: 1}} />
                              <button type="button" className="btn-cancel" style={{fontSize:'11px', padding:'0 15px'}} onClick={()=>setNewCoupon({...newCoupon, code: 'SPAR' + Math.floor(Math.random()*9000+1000)})}>AUTO</button>
                            </div>
                          </div>
                          
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                            <div className="input-group">
                              <label>TYPE</label>
                              <select value={newCoupon.discountType} onChange={e=>setNewCoupon({...newCoupon, discountType: e.target.value})}>
                                <option value="percentage">% Percentage</option>
                                <option value="fixed">₹ Fixed Amount</option>
                              </select>
                            </div>
                            <div className="input-group">
                              <label>VALUE</label>
                              <input type="number" value={newCoupon.discountValue} onChange={e=>setNewCoupon({...newCoupon, discountValue: e.target.value})} required min="1" max={newCoupon.discountType==='percentage'?80:9999} />
                            </div>
                          </div>

                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                            <div className="input-group">
                              <label>EXPIRY DATE</label>
                              <input type="date" value={newCoupon.expiryDate} onChange={e=>setNewCoupon({...newCoupon, expiryDate: e.target.value})} required />
                            </div>
                            <div className="input-group">
                              <label>USAGE LIMIT</label>
                              <input type="number" value={newCoupon.usageLimit} onChange={e=>setNewCoupon({...newCoupon, usageLimit: e.target.value})} required min="1" />
                            </div>
                          </div>
                          
                          <button type="submit" className="btn-save" style={{width:'100%', marginTop:'10px'}}>CREATE COUPON</button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
                  {users.map(u => (
                    <tr key={u._id || u.id}>
                      <td className="cadet-name-cell"><img src={u.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + u.email} alt="avatar" />{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.phone || 'N/A'}</td>
                      <td>{u.totalBookings || Math.floor(Math.random()*5)}</td>
                      <td>₹{u.totalSpent || Math.floor(Math.random()*8000)}</td>
                      <td className="text-xs">{new Date().toLocaleDateString()}</td>
                      <td className="coin-text">{u.sparCoins || 0} SC</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="settings-tab-content">
            <h3 className="section-heading text-white-shimmer-rtl" style={{marginBottom: '20px'}}>PLATFORM SETTINGS</h3>
            <div className="settings-card glass-morphism p-5" style={{maxWidth: '600px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'}}>
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
    </div>
  );
};

export default AdminDashboard;
