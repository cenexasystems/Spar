import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Users, BarChart3, Ticket, MapPin, Edit3, TrendingUp, ArrowLeft, Search, Save, RotateCcw, Trash2, CheckCircle, Clock, DollarSign, XCircle, Plus, Image, Download, Filter, Tag, Phone, ChevronDown, Check, Building2, Globe, Infinity, ToggleLeft, ToggleRight, Sparkles, AlertCircle, Menu, X, Copy } from 'lucide-react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import RevenueAnalytics from './RevenueAnalytics';
import AdminOverview from './AdminOverview';
import { formatCouponDate, formatCouponDateNumeric, getCouponStatus, getParkBranches } from '../utils/couponUtils';
import { resolveProofImageUrl as normalizeProofUrl } from '../utils/proofUtils';
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
  const { user } = useAuth();
  const userName = user?.name || 'Aak Gemini';
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AG';

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('stats');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
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
  const [newCoupon, setNewCoupon] = useState({ 
    code: '', 
    discountType: 'percentage', 
    discountValue: '', 
    expiryDate: '', 
    isUnlimitedTotal: false,
    totalUsageLimit: 100,
    isUnlimitedDaily: true,
    dailyUsageLimit: 50,
    applicablePark: '',
    applicableBranchesType: 'all', // 'all' | 'specific'
    selectedBranches: [],
    isActive: true
  });
  const [viewingCouponUsage, setViewingCouponUsage] = useState(null);
  const [couponUsageData, setCouponUsageData] = useState([]);
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [parkFilter, setParkFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [bookingDateFilter, setBookingDateFilter] = useState('');
  const [proofImageModal, setProofImageModal] = useState(null);
  const [proofImgLoading, setProofImgLoading] = useState(false);
  const [proofImgFailed, setProofImgFailed] = useState(false);

  const resolveProofImageUrl = (b) => {
    return normalizeProofUrl(b, API_URL, SERVER_URL);
  };

  const handleOpenProofModal = (b) => {
    const raw = b.paymentScreenshotData || b.paymentScreenshot;
    if (!raw) {
      return alert('No payment proof uploaded for this booking.');
    }
    const url = resolveProofImageUrl(b);
    setProofImgLoading(true);
    setProofImgFailed(false);
    setProofImageModal({ url, bookingId: b._id || b.id });
  };

  useEffect(() => {
    if (proofImageModal) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflowY = 'scroll';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflowY = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [proofImageModal]);

  const adminPassword = "admin123";
  const getToken = () => {
    try {
      return JSON.parse(localStorage.getItem('spar_session'))?.token;
    } catch {
      return null;
    }
  };

  // Auto-authenticate if user role is admin or if session indicates admin authorization
  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('spar_session') || '{}');
      if (user?.role === 'admin' || storedUser?.role === 'admin' || sessionStorage.getItem('spar_admin_auth') === 'true') {
        setIsAuthenticated(true);
      }
    } catch {
      // ignore JSON parse error
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (password === adminPassword) {
      sessionStorage.setItem('spar_admin_auth', 'true');
      setIsAuthenticated(true);
      const token = getToken();
      if (token) {
        try {
          await axios.post(`${API_URL}/auth/promote-admin`, { code: password }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {
          console.warn("Promote admin notice:", err.message);
        }
      }
    } else { 
      alert("INCORRECT CODE! Please enter admin123"); 
    }
  };

  useEffect(() => { 
    if (isAuthenticated) {
      fetchData(); 
      const iv = setInterval(fetchData, 10000); 
      return () => clearInterval(iv); 
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    const token = getToken();
    if (!token) {
      setParks(fallbackParks);
      setLoading(false);
      return;
    }
    try {
      const { data } = await axios.get(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
      setBookings(data.bookings || []);
      setUsers(data.users || []);
      const finalParks = data.parks && data.parks.length > 0 ? data.parks : fallbackParks;
      const existingNames = new Set(finalParks.map(p => p.name.toLowerCase()));
      const missingFallbacks = fallbackParks.filter(p => !existingNames.has(p.name.toLowerCase()));
      setParks([...finalParks, ...missingFallbacks]);
      setRevenueEntries(data.revenueEntries || []);
      setTotalRevenue(data.totalRevenue || 0);

      try {
        const settingsRes = await axios.get(`${API_URL}/admin/platform-settings`, { headers: { Authorization: `Bearer ${token}` } });
        if (settingsRes.data) setPlatformSettings(settingsRes.data);
      } catch {
        // use default platform settings
      }
    } catch (err) { 
      console.warn("Backend stats fetch notice:", err.message); 
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
    setEditParkTab('basic');

    // ── Step 1: Load visitor categories ──────────────────────────────────
    let categories = (p.visitorCategories && p.visitorCategories.length > 0)
      ? p.visitorCategories
      : getDefaultCategories(p.name);

    // ── Step 2: Build customPricing map for ALL parks (universal, no name checks) ──
    // Priority: ticketPricing.normal (DB canonical) → flat fields (adultPrice etc.) → fallback
    const storedNormal = (p.ticketPricing && p.ticketPricing.normal) ? p.ticketPricing.normal : {};
    
    // Build a map from category ID to current price
    const customPricing = {};
    categories.forEach(cat => {
      const catId = cat.id || cat.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (storedNormal[catId] !== undefined) {
        // Use stored ticketPricing.normal value (most reliable)
        customPricing[catId] = storedNormal[catId];
      } else {
        // Fallback to flat schema fields by known category IDs
        const flatFallbacks = {
          adult:   p.adultPrice || p.price || 0,
          child:   p.childPrice || 0,
          senior:  p.seniorPrice || 0,
          student: p.studentPrice || 0,
          infant:  0,
          below85cm: 0
        };
        customPricing[catId] = flatFallbacks[catId] !== undefined ? flatFallbacks[catId] : 0;
      }
    });

    // ── Step 3: Set editingPark with ALL data ─────────────────────────────
    setEditingPark({
      ...p,
      visitorCategories: categories,
      customPricing,                          // <-- correct independent per-park pricing map
      wonderlaPricing: p.wonderlaPricing || {} // <-- preserve Wonderla pricing if present
    });
  };

  const handleSaveCategories = async () => {
    if (!editingPark) return;
    const token = getToken();
    let parkId = editingPark._id || editingPark.id;
    
    // Auto-create fallback park if not yet saved in MongoDB
    if (!parkId || parkId.toString().length < 24) {
      try {
        const { _id, id, ...parkData } = editingPark;
        const res = await axios.post(`${API_URL}/admin/parks`, parkData, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data && res.data._id) {
          parkId = res.data._id;
          setEditingPark(prev => ({ ...prev, _id: parkId }));
        }
      } catch (err) {
        console.error('Auto-create park for categories failed:', err);
      }
    }

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
      setEditingPark(prev => ({ ...prev, visitorCategories: cleanCategories }));
      fetchData();
    } catch (err) {
      alert("Failed to save categories: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSavePricing = async () => {
    if (!editingPark) return;
    const token = getToken();
    let parkId = editingPark._id || editingPark.id;

    // Auto-create fallback park if not yet saved in MongoDB
    if (!parkId || parkId.toString().length < 24) {
      try {
        const { _id, id, ...parkData } = editingPark;
        const res = await axios.post(`${API_URL}/admin/parks`, parkData, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data && res.data._id) {
          parkId = res.data._id;
          setEditingPark(prev => ({ ...prev, _id: parkId }));
        }
      } catch (err) {
        console.error('Auto-create park for pricing failed:', err);
      }
    }

    // ── Build the ticketPricing payload for ALL non-Wonderla parks ───────
    // Keyed by category ID from visitorCategories — completely independent per park
    const cats = editingPark.visitorCategories || [];
    const normalPrices = {};
    cats.forEach(cat => {
      const catId = cat.id || cat.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      // Skip free categories (e.g. Below 85cm) — their price is always 0
      normalPrices[catId] = cat.isFree ? 0 : Number(editingPark.customPricing?.[catId] || 0);
    });

    // ── Detect if this park uses Wonderla-style location pricing ─────────
    // Use data presence, NOT park name, so this works for any park
    const hasWonderlaPricing = editingPark.wonderlaPricing &&
      Object.keys(editingPark.wonderlaPricing).length > 0;

    const payload = {
      // Always send ticketPricing.normal for universal category pricing
      ticketPricing: { normal: normalPrices },
    };

    // Add wonderlaPricing only if this park uses it
    if (hasWonderlaPricing) {
      payload.wonderlaPricing = editingPark.wonderlaPricing;
    }

    try {
      await axios.put(`${API_URL}/admin/parks/${parkId}/pricing`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Ticket pricing saved successfully!');
      // Refresh data so the park card shows updated prices
      fetchData();
    } catch (err) {
      alert('Failed to save pricing: ' + (err.response?.data?.message || err.message));
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
    if (managingCouponsFor) {
      fetchCoupons(managingCouponsFor);
      // Pre-fill applicablePark and default branches when panel opens
      const branches = getParkBranches(managingCouponsFor);
      setNewCoupon({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        expiryDate: '',
        isUnlimitedTotal: false,
        totalUsageLimit: 100,
        isUnlimitedDaily: true,
        dailyUsageLimit: 50,
        applicablePark: managingCouponsFor.name || '',
        applicableBranchesType: 'all',
        selectedBranches: branches.map(b => b.id),
        isActive: true
      });
    }
  }, [managingCouponsFor]);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code.trim()) return alert("Please enter a coupon code");
    if (!managingCouponsFor) return alert("No park context found. Please re-open the coupon panel.");
    
    const numVal = Number(newCoupon.discountValue);
    if (isNaN(numVal) || numVal <= 0) return alert("Please enter a valid positive discount value");
    if (newCoupon.discountType === 'percentage' && (numVal < 1 || numVal > 100)) {
      return alert("Discount percentage must be between 1% and 100%");
    }
    
    let parsedTotal = null;
    if (!newCoupon.isUnlimitedTotal) {
      parsedTotal = parseInt(newCoupon.totalUsageLimit, 10);
      if (isNaN(parsedTotal) || parsedTotal < 1) return alert("Total usage limit must be at least 1");
    }

    let parsedDaily = null;
    if (!newCoupon.isUnlimitedDaily) {
      parsedDaily = parseInt(newCoupon.dailyUsageLimit, 10);
      if (isNaN(parsedDaily) || parsedDaily < 1) return alert("Daily usage limit must be at least 1");
    }

    if (!newCoupon.isUnlimitedTotal && !newCoupon.isUnlimitedDaily && parsedTotal && parsedDaily) {
      if (parsedDaily > parsedTotal) {
        return alert("Daily usage limit cannot exceed the total usage limit");
      }
    }

    if (!newCoupon.expiryDate) return alert("Please select an expiry date");
    if (new Date(newCoupon.expiryDate) <= new Date()) return alert("Expiry date must be in the future");
    
    if (newCoupon.applicableBranchesType === 'specific' && (!newCoupon.selectedBranches || newCoupon.selectedBranches.length === 0)) {
      return alert("Please select at least one applicable branch or choose 'All Branches'");
    }

    const token = getToken();
    const branchList = newCoupon.applicableBranchesType === 'all' 
      ? ['all'] 
      : newCoupon.selectedBranches;

    const couponPayload = {
      code: newCoupon.code.trim().toUpperCase(),
      discountType: newCoupon.discountType,
      discountValue: numVal,
      expiryDate: newCoupon.expiryDate,
      unlimitedTotal: newCoupon.isUnlimitedTotal,
      isUnlimitedTotal: newCoupon.isUnlimitedTotal,
      totalUsageLimitEnabled: !newCoupon.isUnlimitedTotal,
      totalUsageLimit: newCoupon.isUnlimitedTotal ? null : parsedTotal,
      unlimitedDaily: newCoupon.isUnlimitedDaily,
      isUnlimitedDaily: newCoupon.isUnlimitedDaily,
      dailyUsageLimitEnabled: !newCoupon.isUnlimitedDaily,
      dailyUsageLimit: newCoupon.isUnlimitedDaily ? null : parsedDaily,
      applicablePark: managingCouponsFor.name,
      parkId: managingCouponsFor.name,
      applicableBranches: branchList,
      isActive: newCoupon.isActive !== false
    };

    try {
      await axios.post(`${API_URL}/admin/coupons`, couponPayload, { headers: { Authorization: `Bearer ${token}` } });
      const branches = getParkBranches(managingCouponsFor);
      setNewCoupon({ 
        code: '', 
        discountType: 'percentage', 
        discountValue: '', 
        expiryDate: '', 
        isUnlimitedTotal: false,
        totalUsageLimit: 100, 
        isUnlimitedDaily: true,
        dailyUsageLimit: 50,
        applicablePark: managingCouponsFor.name,
        applicableBranchesType: 'all',
        selectedBranches: branches.map(b => b.id),
        isActive: true
      });
      fetchCoupons(managingCouponsFor);
      alert("Coupon created successfully!");
    } catch (err) {
      alert("Failed to create coupon: " + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleCouponStatus = async (id) => {
    const token = getToken();
    try {
      await axios.put(`${API_URL}/admin/coupons/${id}/toggle`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchCoupons(managingCouponsFor);
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Delete this coupon permanently?")) return;
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
    <div className="admin-saas-layout animate-fade-in">
      {/* ── Mobile Top Header (Visible on <1024px) ────────────────────── */}
      <header className="admin-mobile-topbar">
        <div className="admin-mobile-topbar-left" onClick={() => setMobileMenuOpen(true)}>
          <button className="admin-mobile-menu-btn" aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="admin-mobile-brand">
            <span className="mobile-brand-spark">SPAR</span>
            <span className="mobile-brand-ops">OPERATIONS</span>
          </div>
        </div>

        <div className="admin-mobile-topbar-right">
          <div className="admin-mobile-tab-badge">
            {activeTab.toUpperCase()}
          </div>
          {pendingCount > 0 && (
            <button 
              className="admin-mobile-pending-pill"
              onClick={() => { setActiveTab('bookings'); setStatusFilter('pending'); }}
            >
              <Ticket size={12} />
              <span>{pendingCount}</span>
            </button>
          )}
          <div className="admin-mobile-avatar" onClick={onBack} title="Exit to website">
            {initials}
          </div>
        </div>
      </header>

      {/* ── Mobile Slide-out Drawer Menu ───────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="admin-mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div className="admin-mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="admin-drawer-header">
              <div className="admin-drawer-brand">
                <span style={{ color: '#C7FF00', fontWeight: 900, fontSize: '16px' }}>SPAR</span>
                <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '14px', letterSpacing: '0.5px' }}> OPERATIONS</span>
              </div>
              <button className="admin-drawer-close-btn" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>

            <nav className="admin-drawer-nav">
              <button 
                className={`admin-drawer-item ${activeTab === 'stats' ? 'active' : ''}`}
                onClick={() => { setActiveTab('stats'); setMobileMenuOpen(false); }}
              >
                <TrendingUp size={18} />
                <span>Overview</span>
              </button>

              <button 
                className={`admin-drawer-item ${activeTab === 'bookings' ? 'active' : ''}`}
                onClick={() => { setActiveTab('bookings'); setMobileMenuOpen(false); }}
              >
                <Ticket size={18} />
                <span>Bookings</span>
                {pendingCount > 0 && <span className="admin-nav-badge">{pendingCount}</span>}
              </button>

              <button 
                className={`admin-drawer-item ${activeTab === 'revenue' ? 'active' : ''}`}
                onClick={() => { setActiveTab('revenue'); setMobileMenuOpen(false); }}
              >
                <DollarSign size={18} />
                <span>Revenue Analytics</span>
              </button>

              <button 
                className={`admin-drawer-item ${activeTab === 'parks' ? 'active' : ''}`}
                onClick={() => { setActiveTab('parks'); setMobileMenuOpen(false); }}
              >
                <MapPin size={18} />
                <span>Parks Management</span>
              </button>

              <button 
                className={`admin-drawer-item ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
              >
                <Users size={18} />
                <span>Users & Coins</span>
              </button>

              <button 
                className={`admin-drawer-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
              >
                <Clock size={18} />
                <span>Settings</span>
              </button>
            </nav>

            <div className="admin-drawer-footer">
              <button className="admin-drawer-exit-btn" onClick={onBack}>
                <ArrowLeft size={16} />
                <span>EXIT TO WEBSITE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Left Sidebar (Desktop View) ────────────────────────────────── */}
      <aside className="admin-saas-sidebar">
        <div>
          {/* Sidebar Brand Header */}
          <div className="admin-sidebar-brand" onClick={onBack} title="SPAR Operations Center">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="logo-icon-wrapper" style={{ width: '30px', height: '30px', flexShrink: 0 }}>
                <svg viewBox="0 0 100 100" className="custom-ferris-wheel" style={{ width: '30px', height: '30px' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1 }}>
                  <span className="logo-spark-top" style={{ fontSize: '0.95rem', color: '#C7FF00' }}>SPAR</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Amusements</span>
                </div>
                <div style={{ fontSize: '0.6rem', color: '#64748B', fontWeight: 700, letterSpacing: '0.08em', marginTop: '4px' }}>
                  OPERATIONS CENTER
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="admin-sidebar-nav">
            <button 
              className={`admin-nav-item ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              <TrendingUp size={16} />
              <span>Overview</span>
            </button>

            <button 
              className={`admin-nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              <Ticket size={16} />
              <span>Bookings</span>
              {pendingCount > 0 && <span className="admin-nav-badge">{pendingCount}</span>}
            </button>

            <button 
              className={`admin-nav-item ${activeTab === 'revenue' ? 'active' : ''}`}
              onClick={() => setActiveTab('revenue')}
            >
              <DollarSign size={16} />
              <span>Revenue</span>
            </button>

            <button 
              className={`admin-nav-item ${activeTab === 'parks' ? 'active' : ''}`}
              onClick={() => setActiveTab('parks')}
            >
              <MapPin size={16} />
              <span>Parks</span>
            </button>

            <button 
              className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Users size={16} />
              <span>Users</span>
            </button>

            <button 
              className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Clock size={16} />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom: Export & Admin Profile */}
        <div className="admin-sidebar-bottom">
          {activeTab !== 'revenue' && (
            <button className="admin-sidebar-excel-btn" onClick={exportRevenue} title="Download revenue excel report">
              <Download size={14} />
              <span>Download as Excel</span>
            </button>
          )}

          <div className="admin-user-card" onClick={onBack} title="Click to exit to main website">
            <div className="admin-user-avatar">{initials}</div>
            <div className="admin-user-info">
              <p className="admin-user-name">{userName}</p>
              <p className="admin-user-role">Admin</p>
            </div>
            <ChevronDown size={14} style={{ color: '#64748B' }} />
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────────────── */}
      <main className="admin-saas-main">
        {/* Top Header Bar for non-revenue and non-overview tabs */}
        {activeTab !== 'revenue' && activeTab !== 'stats' && (
          <div className="admin-header">
            <button className="back-btn-neon" onClick={onBack}><ArrowLeft size={16} /> <span style={{fontSize:'12px', fontWeight:700, letterSpacing:'0.08em'}}>BACK TO HOME</span></button>
            <div className="admin-title-wrap" style={{textAlign:'right'}}>
              <h1 className="admin-title">ADMIN DASHBOARD <span className="title-version">v3.0</span></h1>
              <p className="admin-subtitle">Booking Verification & Management Center</p>
            </div>
          </div>
        )}

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
            <AdminOverview
              bookings={bookings}
              revenueEntries={revenueEntries}
              users={users}
              parks={parks}
              loading={loading}
              userName={userName}
              initials={initials}
              onNavigateTab={(tab, filter) => {
                setActiveTab(tab);
                if (filter?.status) setStatusFilter(filter.status);
              }}
            />
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

              {/* Desktop Table View */}
              <div className="admin-table-wrapper desktop-only-table">
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
                            <button className="status-action-btn" style={{background:'rgba(255,255,255,0.1)', color:'#fff', opacity: (b.paymentScreenshotData || b.paymentScreenshot) ? 1 : 0.5}} onClick={() => handleOpenProofModal(b)}>👁️ VIEW PROOF</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Bookings Cards */}
              <div className="mobile-booking-card-list mobile-only-card-list">
                {filteredBookings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748B', fontSize: '13px' }}>
                    No bookings found.
                  </div>
                ) : (
                  filteredBookings.map(b => (
                    <div key={b._id || b.id} className="admin-mobile-booking-card">
                      <div className="mb-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="mb-card-booking-id">{b.bookingId}</span>
                          <button 
                            className="mb-card-copy-btn" 
                            title="Copy Booking ID"
                            onClick={() => {
                              navigator.clipboard.writeText(b.bookingId);
                              setCopiedId(b.bookingId);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                          >
                            <Copy size={12} />
                            {copiedId === b.bookingId && <span className="mb-copied-tag">COPIED</span>}
                          </button>
                        </div>
                        <span className={`status-badge ${getStatusClass(b.status)}`}>{b.status}</span>
                      </div>

                      <div className="mb-card-body">
                        <div className="mb-info-row">
                          <span className="mb-info-label">Customer</span>
                          <span className="mb-info-val font-semibold">{b.userName || 'Unknown'}</span>
                        </div>

                        <div className="mb-info-row">
                          <span className="mb-info-label">WhatsApp</span>
                          <a href={`https://wa.me/91${b.whatsappNumber || b.userPhone || '0000000000'}`} target="_blank" rel="noreferrer" className="whatsapp-btn" style={{ padding: '3px 8px', fontSize: '11px' }}>
                            <Phone size={11}/> {b.whatsappNumber || b.userPhone || 'N/A'}
                          </a>
                        </div>

                        <div className="mb-info-row">
                          <span className="mb-info-label">Park & Date</span>
                          <span className="mb-info-val">
                            <span className="park-tag" style={{ marginRight: '6px' }}>{b.parkName}</span>
                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>{new Date(b.createdAt || b.date).toLocaleDateString()}</span>
                          </span>
                        </div>

                        <div className="mb-info-row">
                          <span className="mb-info-label">Tickets / Total</span>
                          <span className="mb-info-val">
                            <span style={{ color: '#94A3B8', fontSize: '12px', marginRight: '8px' }}>{b.tickets} Ticket{b.tickets > 1 ? 's' : ''}</span>
                            <strong style={{ color: '#C7FF00', fontSize: '14px' }}>₹{b.totalAmount}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="mb-card-actions">
                        <button 
                          className="status-action-btn" 
                          style={{ flex: 1, background: 'rgba(255,255,255,0.08)', color: '#fff', opacity: (b.paymentScreenshotData || b.paymentScreenshot) ? 1 : 0.5 }} 
                          onClick={() => handleOpenProofModal(b)}
                        >
                          👁️ VIEW PROOF
                        </button>

                        {b.status === 'pending' && (
                          <>
                            <button className="status-action-btn verify-btn" style={{ flex: 1 }} onClick={() => handleStatusUpdate(b._id, 'verified')}>
                              ✓ VERIFY
                            </button>
                            <button className="status-action-btn reject-btn" style={{ flex: 1 }} onClick={() => handleStatusUpdate(b._id, 'rejected')}>
                              ✕ REJECT
                            </button>
                          </>
                        )}

                        {b.status === 'verified' && (
                          <button className="status-action-btn send-ticket-btn" style={{ flex: 1 }} onClick={() => handleStatusUpdate(b._id, 'ticketsent')}>
                            📱 SEND TICKET
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* REVENUE TAB */}
          {activeTab === 'revenue' && (
            <RevenueAnalytics 
              bookings={bookings} 
              revenueEntries={revenueEntries} 
              parks={parks}
              loading={loading}
              onRefresh={fetchData}
            />
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
                          <select 
                            className="park-status-select"
                            value={editingPark ? editingPark.status : newPark.status} 
                            onChange={(e) => editingPark ? setEditingPark({...editingPark, status: e.target.value}) : setNewPark({...newPark, status: e.target.value})}
                          >
                            <option value="active">✅ Active</option>
                            <option value="inactive">⛔ Inactive</option>
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

                    {editParkTab === 'pricing' && (() => {
                      const currentPark = editingPark || newPark;
                      const setPark = editingPark
                        ? (updater) => setEditingPark(prev => typeof updater === 'function' ? updater(prev) : updater)
                        : (updater) => setNewPark(prev => typeof updater === 'function' ? updater(prev) : updater);

                      const parkId = currentPark?._id || currentPark?.id || 'new';
                      const visitorCats = currentPark?.visitorCategories || [];
                      const customPricing = currentPark?.customPricing || {};
                      const wPricing = currentPark?.wonderlaPricing || {};
                      const hasWonderlaPricing = Object.keys(wPricing).length > 0;

                      const handlePriceChange = (catId, val) => {
                        setPark(prev => ({
                          ...prev,
                          customPricing: {
                            ...(prev.customPricing || {}),
                            [catId]: val === '' ? '' : Number(val)
                          }
                        }));
                      };

                      const updateLocData = (loc, field, val) => {
                        const updated = { ...wPricing, [loc]: { ...wPricing[loc], [field]: val } };
                        setPark(prev => ({ ...prev, wonderlaPricing: updated }));
                      };

                      const updateLocPrice = (loc, tier, ticket, val) => {
                        const updated = {
                          ...wPricing,
                          [loc]: {
                            ...wPricing[loc],
                            [tier]: { ...(wPricing[loc]?.[tier] || {}), [ticket]: Number(val) }
                          }
                        };
                        setPark(prev => ({ ...prev, wonderlaPricing: updated }));
                      };

                      const addLocation = () => {
                        const locName = prompt('Enter new location name (e.g. bangalore, kochi):');
                        if (!locName || wPricing[locName.toLowerCase()]) return;
                        const initialPrices = {};
                        visitorCats.forEach(c => { initialPrices[c.id] = 0; });
                        const updated = {
                          ...wPricing,
                          [locName.toLowerCase()]: {
                            normal: { ...initialPrices },
                            fasttrack: { adult: 0, child: 0 },
                            fastTrackAvailable: false,
                            parkHours: '',
                            waterHours: ''
                          }
                        };
                        setPark(prev => ({ ...prev, wonderlaPricing: updated }));
                      };

                      const removeLocation = (loc) => {
                        const updated = { ...wPricing };
                        delete updated[loc];
                        setPark(prev => ({ ...prev, wonderlaPricing: updated }));
                      };

                      return (
                        <div className="tab-content-anim">
                          <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '12px' }}>
                              TICKET PRICES PER CATEGORY
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              {visitorCats.map(cat => {
                                const catId = cat.id || cat.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                                return (
                                  <div className="input-group" key={`${parkId}-price-${catId}`}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      {cat.name.toUpperCase()} PRICE (₹)
                                      {cat.isFree && (
                                        <span style={{ fontSize: '9px', background: 'rgba(16,185,129,0.2)', color: '#10B981', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>FREE</span>
                                      )}
                                    </label>
                                    {cat.isFree ? (
                                      <input
                                        type="number"
                                        value={0}
                                        disabled
                                        style={{ opacity: 0.4, cursor: 'not-allowed' }}
                                      />
                                    ) : (
                                      <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={customPricing[catId] !== undefined ? customPricing[catId] : ''}
                                        placeholder="Enter price"
                                        onChange={(e) => handlePriceChange(catId, e.target.value)}
                                        required={catId === 'adult'}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {hasWonderlaPricing && (
                            <div className="input-group" style={{ marginTop: '20px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <div>
                                  <label style={{ color: '#00D1FF' }}>LOCATION-BASED PRICING</label>
                                  <p style={{ fontSize: '11px', color: '#888' }}>Manage pricing for each park location separately.</p>
                                </div>
                                <button type="button" onClick={addLocation} style={{ background: 'rgba(0, 209, 255, 0.1)', color: '#00D1FF', border: '1px solid rgba(0, 209, 255, 0.3)', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>+ ADD LOCATION</button>
                              </div>

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
                                        {visitorCats.map(cat => {
                                          const catId = cat.id || cat.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                                          return (
                                            <div key={`${loc}-normal-${catId}`}>
                                              <span style={{ fontSize: '10px', color: '#888', textTransform: 'capitalize' }}>{cat.name}</span>
                                              <input
                                                type="number"
                                                value={data.normal?.[catId] ?? 0}
                                                onChange={(e) => updateLocPrice(loc, 'normal', catId, e.target.value)}
                                                style={{ width: '100%', padding: '4px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
                                              />
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                      <input type="checkbox" checked={data.fastTrackAvailable || false} onChange={(e) => updateLocData(loc, 'fastTrackAvailable', e.target.checked)} />
                                      <label style={{ fontSize: '11px', color: '#BF00FF', fontWeight: 'bold' }}>FAST-TRACK TICKETS (₹)</label>
                                    </div>

                                    {data.fastTrackAvailable && (
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div><span style={{ fontSize: '10px', color: '#888' }}>Adult</span><input type="number" value={data.fasttrack?.adult || 0} onChange={(e) => updateLocPrice(loc, 'fasttrack', 'adult', e.target.value)} style={{ width: '100%', padding: '4px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} /></div>
                                        <div><span style={{ fontSize: '10px', color: '#888' }}>Child</span><input type="number" value={data.fasttrack?.child || 0} onChange={(e) => updateLocPrice(loc, 'fasttrack', 'child', e.target.value)} style={{ width: '100%', padding: '4px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} /></div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-start' }}>
                            <button type="button" onClick={handleSavePricing} className="btn-save" style={{ padding: '10px 20px', fontSize: '12px' }}>
                              <Save size={14} style={{ marginRight: '6px' }} /> SAVE PRICING
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="edit-actions" style={{marginTop: '20px'}}>
                      <button type="button" className="btn-cancel" onClick={() => { setIsAddingPark(false); setEditingPark(null); setEditParkTab('basic'); }}>CANCEL</button>
                      <button type="submit" className="btn-save"><Save size={16} /> {editingPark ? 'UPDATE PARK' : 'SAVE PARK'}</button>
                    </div>
                  </form>
                </div>
              </div>,
              document.body
            )}
            {/* Coupon Management Panel - Modern & Grouped UI */}
            {/* Coupon Management & Usage History Modal */}
            {managingCouponsFor && createPortal(
              <div
                onClick={() => { setManagingCouponsFor(null); setViewingCouponUsage(null); }}
                style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8, 10, 15, 0.85)', backdropFilter: 'blur(16px)', zIndex: 100000, cursor: 'zoom-out', padding: '16px', boxSizing: 'border-box' }}
              >
                <div 
                  onClick={(e) => e.stopPropagation()} 
                  className="coupon-modal-card"
                  style={{ 
                    position: 'relative',
                    width: '100%', 
                    maxWidth: '760px', 
                    height: '90vh', 
                    maxHeight: '850px',
                    display: 'flex', 
                    flexDirection: 'column',
                    background: 'rgba(15, 17, 26, 0.98)', 
                    borderRadius: '24px', 
                    border: '1px solid rgba(0, 209, 255, 0.3)', 
                    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9)',
                    overflow: 'hidden',
                    cursor: 'default',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Modal Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '18px 24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    flexShrink: 0
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag size={16} color="#00D1FF" />
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#00D1FF', letterSpacing: '0.05em' }}>COUPONS MANAGEMENT</h4>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} color="#C7FF00" /> <strong style={{ color: '#fff' }}>{managingCouponsFor.name}</strong> &bull; Scoped park coupons
                      </p>
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
                      aria-label="Close modal"
                    >
                      <XCircle size={20} color="#FF3D3D" />
                    </button>
                  </div>
                  
                  <div className="coupon-modal-body" style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box' }}>
                    {viewingCouponUsage ? (
                      <div className="usage-view" style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                        {/* Header Navigation & Info */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                          <button 
                            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} 
                            onClick={() => setViewingCouponUsage(null)}
                          >
                            ← BACK TO COUPONS
                          </button>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: '#C7FF00', letterSpacing: '0.05em', fontFamily: "'Courier New', monospace" }}>
                              {viewingCouponUsage.code}
                            </span>
                            <span style={{ fontSize: '11px', background: 'rgba(0, 209, 255, 0.12)', color: '#00D1FF', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(0, 209, 255, 0.25)', fontWeight: '700' }}>
                              {viewingCouponUsage.discountType === 'percentage' ? `${viewingCouponUsage.discountValue}% OFF` : `₹${viewingCouponUsage.discountValue} OFF`}
                            </span>
                          </div>
                        </div>

                        {/* Summary Metrics Row */}
                        {couponUsageData.length > 0 && (() => {
                          const totalDiscounts = couponUsageData.reduce((sum, b) => sum + (Number(b.discountAmount) || 0), 0);
                          const totalPaid = couponUsageData.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

                          return (
                            <div className="redemption-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '10px 12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>Redemptions</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', marginTop: '2px' }}>{couponUsageData.length}</div>
                              </div>
                              <div style={{ background: 'rgba(0, 230, 118, 0.04)', border: '1px solid rgba(0, 230, 118, 0.15)', borderRadius: '12px', padding: '10px 12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: '#00E676', fontWeight: '700', textTransform: 'uppercase' }}>Total Savings</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#00E676', marginTop: '2px' }}>₹{totalDiscounts.toLocaleString('en-IN')}</div>
                              </div>
                              <div style={{ background: 'rgba(199, 255, 0, 0.04)', border: '1px solid rgba(199, 255, 0, 0.15)', borderRadius: '12px', padding: '10px 12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: '#C7FF00', fontWeight: '700', textTransform: 'uppercase' }}>Revenue Generated</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#C7FF00', marginTop: '2px' }}>₹{totalPaid.toLocaleString('en-IN')}</div>
                              </div>
                            </div>
                          );
                        })()}

                        {couponUsageData.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '50px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', color: '#888' }}>
                            <Ticket size={32} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                            <p style={{ margin: 0, fontSize: '13px' }}>No usage history recorded for this coupon yet.</p>
                          </div>
                        ) : (
                          <>
                            {/* Desktop Table View (Full width, no clipped columns) */}
                            <div className="redemption-table-wrapper desktop-only-table">
                              <table className="redemption-history-table">
                                <thead>
                                  <tr>
                                    <th style={{ width: '22%' }}>BOOKING ID</th>
                                    <th style={{ width: '26%' }}>VISITOR</th>
                                    <th style={{ width: '20%' }}>DATE</th>
                                    <th style={{ width: '16%', textAlign: 'right' }}>DISCOUNT</th>
                                    <th style={{ width: '16%', textAlign: 'right' }}>PAID</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {couponUsageData.map(b => (
                                    <tr key={b._id || b.id || b.bookingId}>
                                      <td className="redemption-td-id">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span>{b.bookingId}</span>
                                          <button 
                                            className="mb-card-copy-btn" 
                                            title="Copy Booking ID"
                                            onClick={() => {
                                              navigator.clipboard.writeText(b.bookingId);
                                              setCopiedId(b.bookingId);
                                              setTimeout(() => setCopiedId(null), 2000);
                                            }}
                                          >
                                            <Copy size={11} />
                                          </button>
                                        </div>
                                      </td>
                                      <td className="redemption-td-visitor" title={b.userName || 'Unknown'}>
                                        <span className="visitor-name-truncate">{b.userName || 'Unknown'}</span>
                                      </td>
                                      <td className="redemption-td-date">{formatCouponDate(b.createdAt || b.date)}</td>
                                      <td className="redemption-td-discount">
                                        <span className="redemption-discount-val">₹{b.discountAmount || 0}</span>
                                      </td>
                                      <td className="redemption-td-paid">
                                        <span className="redemption-paid-val">₹{b.totalAmount}</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Mobile Stacked Cards View (<768px) */}
                            <div className="redemption-mobile-card-list mobile-only-card-list">
                              {couponUsageData.map(b => (
                                <div key={b._id || b.id || b.bookingId} className="redemption-mobile-card">
                                  <div className="rm-card-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span className="rm-card-id">{b.bookingId}</span>
                                      <button 
                                        className="mb-card-copy-btn" 
                                        title="Copy Booking ID"
                                        onClick={() => {
                                          navigator.clipboard.writeText(b.bookingId);
                                          setCopiedId(b.bookingId);
                                          setTimeout(() => setCopiedId(null), 2000);
                                        }}
                                      >
                                        <Copy size={11} />
                                        {copiedId === b.bookingId && <span className="mb-copied-tag">COPIED</span>}
                                      </button>
                                    </div>
                                    <span className="rm-card-date">{formatCouponDate(b.createdAt || b.date)}</span>
                                  </div>

                                  <div className="rm-card-body">
                                    <div className="rm-info-row">
                                      <span className="rm-label">Visitor:</span>
                                      <strong className="rm-val">{b.userName || 'Unknown'}</strong>
                                    </div>
                                    <div className="rm-info-row" style={{ marginTop: '4px' }}>
                                      <span className="rm-discount-tag">
                                        Discount: -₹{b.discountAmount || 0}
                                      </span>
                                      <span className="rm-paid-tag">
                                        Paid: ₹{b.totalAmount}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        
                        {/* EXISTING COUPONS SECTION */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{fontSize:'12px', fontWeight:'800', letterSpacing:'0.08em', color:'#00D1FF', display: 'flex', alignItems: 'center', gap: '6px'}}>
                              <Tag size={13} /> EXISTING PARK COUPONS ({coupons.length})
                            </div>
                            <span style={{ fontSize: '11px', color: '#888' }}>Scoped strictly to {managingCouponsFor.name}</span>
                          </div>

                          {coupons.map((c) => {
                            const statusInfo = getCouponStatus(c);
                            const branches = getParkBranches(managingCouponsFor);
                            const isAllBranches = !c.applicableBranches || c.applicableBranches.includes('all') || c.applicableBranches.length === 0;
                            
                            // Map branch slugs to names
                            const branchNames = isAllBranches 
                              ? 'All Branches' 
                              : c.applicableBranches.map(bId => {
                                  const found = branches.find(b => b.id.toLowerCase() === (bId || '').toLowerCase());
                                  return found ? found.name : bId;
                                }).join(', ');

                            const totalLimitDisplay = c.isUnlimitedTotal ? 'Unlimited' : (c.totalUsageLimit ?? c.usageLimit ?? 'Unlimited');
                            const dailyLimitDisplay = (c.isUnlimitedDaily !== false && (c.dailyUsageLimit === null || c.dailyUsageLimit === undefined)) ? 'Unlimited' : (c.dailyUsageLimit || 'Unlimited');

                            return (
                              <div key={c._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '16px 18px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '12px', transition: '0.2s' }}>
                                
                                {/* Card Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontFamily: "'Courier New', monospace", fontSize: '18px', fontWeight: '900', color: '#C7FF00', letterSpacing: '1.5px', background: 'rgba(199, 255, 0, 0.08)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(199, 255, 0, 0.2)' }}>
                                      {c.code}
                                    </span>
                                    <span style={{ fontSize: '11px', background: 'rgba(0, 209, 255, 0.1)', color: '#00D1FF', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(0, 209, 255, 0.2)', fontWeight: '700' }}>
                                      {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}`, fontWeight: '800', letterSpacing: '0.05em' }}>
                                      {statusInfo.label}
                                    </span>
                                  </div>
                                </div>

                                {/* Card Details Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', background: 'rgba(0, 0, 0, 0.25)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
                                  <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Building2 size={13} color="#00D1FF" />
                                    <span style={{ color: '#888' }}>Applicable Branches:</span>
                                    <strong style={{ color: '#fff', fontSize: '12px' }}>{branchNames}</strong>
                                  </div>

                                  <div>
                                    <span style={{ color: '#888' }}>Expiry Date:</span>{' '}
                                    <strong style={{ color: statusInfo.status === 'EXPIRED' ? '#FF9100' : '#fff' }}>
                                      {formatCouponDate(c.expiryDate)}
                                    </strong>
                                  </div>

                                  <div>
                                    <span style={{ color: '#888' }}>Total Redemptions:</span>{' '}
                                    <strong style={{ color: '#fff' }}>
                                      {c.totalUsageCount ?? c.usedCount ?? 0} / {totalLimitDisplay}
                                    </strong>
                                  </div>

                                  <div style={{ gridColumn: 'span 2' }}>
                                    <span style={{ color: '#888' }}>Daily Limit:</span>{' '}
                                    <strong style={{ color: '#fff' }}>
                                      {c.dailyUsageCount ?? 0} / {dailyLimitDisplay} {c.isUnlimitedDaily === false ? 'today' : ''}
                                    </strong>
                                  </div>
                                </div>

                                {/* Actions Bar */}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                                  <button 
                                    style={{ flex: 1.2, background: 'rgba(0,209,255,0.08)', color: '#00D1FF', border: '1px solid rgba(0,209,255,0.25)', padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', transition: '0.2s' }} 
                                    onClick={() => handleViewUsage(c)}
                                  >
                                    <TrendingUp size={12}/> USAGE HISTORY
                                  </button>

                                  <button 
                                    style={{ flex: 1, background: c.isActive !== false ? 'rgba(255,145,0,0.08)' : 'rgba(0,230,118,0.08)', color: c.isActive !== false ? '#FF9100' : '#00E676', border: `1px solid ${c.isActive !== false ? 'rgba(255,145,0,0.25)' : 'rgba(0,230,118,0.25)'}`, padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', transition: '0.2s' }} 
                                    onClick={() => handleToggleCouponStatus(c._id)}
                                  >
                                    {c.isActive !== false ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
                                    {c.isActive !== false ? 'DEACTIVATE' : 'ACTIVATE'}
                                  </button>

                                  <button 
                                    style={{ flex: 0.8, background: 'rgba(255,61,61,0.08)', color: '#FF3D3D', border: '1px solid rgba(255,61,61,0.25)', padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', transition: '0.2s' }} 
                                    onClick={() => handleDeleteCoupon(c._id)}
                                  >
                                    <Trash2 size={12}/> DELETE
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {coupons.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', color: '#888', fontSize: '13px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                              No coupons created for {managingCouponsFor.name} yet. Create one below!
                            </div>
                          )}
                        </div>

                        {/* CREATE NEW COUPON FORM */}
                        <div style={{ background: 'rgba(0, 209, 255, 0.02)', border: '1px solid rgba(0, 209, 255, 0.25)', padding: '24px', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                            <Sparkles size={16} color="#00D1FF" />
                            <h4 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', margin: 0, color: '#00D1FF', letterSpacing: '0.05em' }}>
                              CREATE NEW COUPON
                            </h4>
                          </div>

                          <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            
                            {/* 1. Coupon Information & Status */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: '#00D1FF', letterSpacing: '0.05em' }}>1. COUPON IDENTIFIER & STATUS</div>
                              
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                  <label style={{ fontSize: '11px', color: '#aaa', fontWeight: '700' }}>COUPON CODE *</label>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <input 
                                      type="text" 
                                      value={newCoupon.code} 
                                      onChange={e=>setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} 
                                      placeholder="e.g. WDL50" 
                                      required 
                                      style={{ flex: 1, fontFamily: "'Courier New', monospace", fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }} 
                                    />
                                    <button 
                                      type="button" 
                                      style={{ background: 'rgba(0, 209, 255, 0.15)', color: '#00D1FF', border: '1px solid rgba(0, 209, 255, 0.3)', padding: '0 14px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }} 
                                      onClick={() => {
                                        const prefix = (managingCouponsFor.name || 'SPAR').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
                                        setNewCoupon({...newCoupon, code: prefix + Math.floor(Math.random()*900+100)});
                                      }}
                                    >
                                      AUTO
                                    </button>
                                  </div>
                                </div>

                                <div className="input-group" style={{ marginBottom: 0 }}>
                                  <label style={{ fontSize: '11px', color: '#aaa', fontWeight: '700' }}>INITIAL STATUS</label>
                                  <select 
                                    value={newCoupon.isActive ? 'active' : 'inactive'} 
                                    onChange={e => setNewCoupon({ ...newCoupon, isActive: e.target.value === 'active' })}
                                    style={{ backgroundColor: '#161922', color: '#fff', fontWeight: '600', border: '1px solid rgba(255,255,255,0.15)' }}
                                  >
                                    <option value="active" style={{ background: '#161922', color: '#00E676' }}>Active (Usable)</option>
                                    <option value="inactive" style={{ background: '#161922', color: '#FF3D3D' }}>Inactive (Disabled)</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* 2. Applicable Park (Pre-selected) */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: '#00D1FF', letterSpacing: '0.05em' }}>2. APPLICABLE PARK (PARK ISOLATION)</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0, 209, 255, 0.05)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(0, 209, 255, 0.15)' }}>
                                <MapPin size={16} color="#00D1FF" />
                                <div>
                                  <strong style={{ color: '#fff', fontSize: '13px' }}>{managingCouponsFor.name}</strong>
                                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#888' }}>This coupon will ONLY be visible, valid, and redeemable at {managingCouponsFor.name}.</p>
                                </div>
                              </div>
                            </div>

                            {/* 3. Branch-Level Applicability */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: '#00D1FF', letterSpacing: '0.05em' }}>3. APPLICABLE BRANCHES</div>
                              
                              {/* Branch applicability mode radio */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <label 
                                  style={{ 
                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700',
                                    background: newCoupon.applicableBranchesType === 'all' ? 'rgba(0, 209, 255, 0.12)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${newCoupon.applicableBranchesType === 'all' ? '#00D1FF' : 'rgba(255,255,255,0.1)'}`,
                                    color: newCoupon.applicableBranchesType === 'all' ? '#00D1FF' : '#aaa'
                                  }}
                                >
                                  <input 
                                    type="radio" 
                                    name="branchType" 
                                    checked={newCoupon.applicableBranchesType === 'all'} 
                                    onChange={() => setNewCoupon({ ...newCoupon, applicableBranchesType: 'all' })}
                                    style={{ accentColor: '#00D1FF' }}
                                  />
                                  <Globe size={14} /> All Branches of {managingCouponsFor.name}
                                </label>

                                <label 
                                  style={{ 
                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700',
                                    background: newCoupon.applicableBranchesType === 'specific' ? 'rgba(0, 209, 255, 0.12)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${newCoupon.applicableBranchesType === 'specific' ? '#00D1FF' : 'rgba(255,255,255,0.1)'}`,
                                    color: newCoupon.applicableBranchesType === 'specific' ? '#00D1FF' : '#aaa'
                                  }}
                                >
                                  <input 
                                    type="radio" 
                                    name="branchType" 
                                    checked={newCoupon.applicableBranchesType === 'specific'} 
                                    onChange={() => setNewCoupon({ ...newCoupon, applicableBranchesType: 'specific' })}
                                    style={{ accentColor: '#00D1FF' }}
                                  />
                                  <Building2 size={14} /> Specific Branches Only
                                </label>
                              </div>

                              {/* Multi-select branch list if specific */}
                              {newCoupon.applicableBranchesType === 'specific' && (
                                <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '12px', border: '1px dashed rgba(0, 209, 255, 0.3)' }}>
                                  <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '10px', fontWeight: '600' }}>Select which branches of {managingCouponsFor.name} this coupon is valid for:</div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {getParkBranches(managingCouponsFor).map(branch => {
                                      const isChecked = newCoupon.selectedBranches.includes(branch.id);
                                      return (
                                        <label 
                                          key={branch.id} 
                                          style={{ 
                                            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
                                            background: isChecked ? 'rgba(0, 209, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${isChecked ? 'rgba(0, 209, 255, 0.4)' : 'rgba(255,255,255,0.05)'}`,
                                            color: isChecked ? '#fff' : '#888'
                                          }}
                                        >
                                          <input 
                                            type="checkbox" 
                                            checked={isChecked} 
                                            onChange={e => {
                                              if (e.target.checked) {
                                                setNewCoupon({ ...newCoupon, selectedBranches: [...newCoupon.selectedBranches, branch.id] });
                                              } else {
                                                setNewCoupon({ ...newCoupon, selectedBranches: newCoupon.selectedBranches.filter(id => id !== branch.id) });
                                              }
                                            }}
                                            style={{ accentColor: '#00D1FF' }}
                                          />
                                          <span><strong>{branch.name}</strong></span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 4. Discount Type & Value */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: '#00D1FF', letterSpacing: '0.05em' }}>4. DISCOUNT TYPE & VALUE</div>
                              
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                  <label style={{ fontSize: '11px', color: '#aaa', fontWeight: '700' }}>DISCOUNT TYPE *</label>
                                  <select 
                                    value={newCoupon.discountType} 
                                    onChange={e=>setNewCoupon({...newCoupon, discountType: e.target.value})} 
                                    style={{ backgroundColor: '#161922', color: '#fff', fontWeight: '600' }}
                                  >
                                    <option value="percentage">% Percentage (Up to 80%)</option>
                                    <option value="fixed">₹ Fixed Flat Amount</option>
                                  </select>
                                </div>

                                <div className="input-group" style={{ marginBottom: 0 }}>
                                  <label style={{ fontSize: '11px', color: '#aaa', fontWeight: '700' }}>
                                    {newCoupon.discountType === 'percentage' ? 'PERCENTAGE VALUE (%) *' : 'DISCOUNT AMOUNT (₹) *'}
                                  </label>
                                  <input 
                                    type="number" 
                                    value={newCoupon.discountValue} 
                                    onChange={e=>setNewCoupon({...newCoupon, discountValue: e.target.value})} 
                                    placeholder={newCoupon.discountType === 'percentage' ? 'e.g. 20 (Max 100%)' : 'e.g. 250'}
                                    required 
                                    min="1" 
                                    max={newCoupon.discountType==='percentage'?100:99999} 
                                  />
                                </div>
                              </div>
                            </div>

                            {/* 5. Expiry Date */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: '#00D1FF', letterSpacing: '0.05em' }}>5. EXPIRY DATE (FORMAT: DD.MM.YYYY)</div>
                              
                              <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '11px', color: '#aaa', fontWeight: '700' }}>VALID UNTIL *</label>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                  <input 
                                    type="date" 
                                    value={newCoupon.expiryDate} 
                                    onChange={e=>setNewCoupon({...newCoupon, expiryDate: e.target.value})} 
                                    min={new Date().toISOString().split('T')[0]}
                                    required 
                                    style={{ flex: 1 }}
                                  />
                                  {newCoupon.expiryDate && (
                                    <span style={{ fontSize: '12px', background: 'rgba(0, 209, 255, 0.1)', color: '#00D1FF', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0, 209, 255, 0.2)', fontWeight: '700' }}>
                                      Format: {formatCouponDate(newCoupon.expiryDate)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* 6. Usage Limit Settings (Total & Daily) */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: '#00D1FF', letterSpacing: '0.05em' }}>6. USAGE LIMIT CONTROLS</div>

                              {/* A. Total Usage Limit */}
                              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>A. Total Redemptions Limit</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                  <label 
                                    style={{ 
                                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                                      background: newCoupon.isUnlimitedTotal ? 'rgba(0, 209, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                                      border: `1px solid ${newCoupon.isUnlimitedTotal ? '#00D1FF' : 'rgba(255,255,255,0.1)'}`,
                                      color: newCoupon.isUnlimitedTotal ? '#00D1FF' : '#888'
                                    }}
                                  >
                                    <input 
                                      type="radio" 
                                      name="totalLimitType" 
                                      checked={newCoupon.isUnlimitedTotal} 
                                      onChange={() => setNewCoupon({ ...newCoupon, isUnlimitedTotal: true })}
                                      style={{ accentColor: '#00D1FF' }}
                                    />
                                    <Infinity size={13} /> Unlimited Total Redemptions
                                  </label>

                                  <label 
                                    style={{ 
                                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                                      background: !newCoupon.isUnlimitedTotal ? 'rgba(0, 209, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                                      border: `1px solid ${!newCoupon.isUnlimitedTotal ? '#00D1FF' : 'rgba(255,255,255,0.1)'}`,
                                      color: !newCoupon.isUnlimitedTotal ? '#00D1FF' : '#888'
                                    }}
                                  >
                                    <input 
                                      type="radio" 
                                      name="totalLimitType" 
                                      checked={!newCoupon.isUnlimitedTotal} 
                                      onChange={() => setNewCoupon({ ...newCoupon, isUnlimitedTotal: false })}
                                      style={{ accentColor: '#00D1FF' }}
                                    />
                                    Limited Total Redemptions
                                  </label>
                                </div>

                                {!newCoupon.isUnlimitedTotal && (
                                  <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '11px', color: '#aaa' }}>MAX TOTAL REDEMPTIONS *</label>
                                    <input 
                                      type="number" 
                                      value={newCoupon.totalUsageLimit} 
                                      onChange={e=>setNewCoupon({...newCoupon, totalUsageLimit: e.target.value})} 
                                      required 
                                      min="1" 
                                      placeholder="e.g. 100" 
                                    />
                                  </div>
                                )}
                              </div>

                              {/* B. Daily Usage Limit */}
                              <div>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>B. Daily Redemptions Limit (Per Day)</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                  <label 
                                    style={{ 
                                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                                      background: newCoupon.isUnlimitedDaily ? 'rgba(0, 209, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                                      border: `1px solid ${newCoupon.isUnlimitedDaily ? '#00D1FF' : 'rgba(255,255,255,0.1)'}`,
                                      color: newCoupon.isUnlimitedDaily ? '#00D1FF' : '#888'
                                    }}
                                  >
                                    <input 
                                      type="radio" 
                                      name="dailyLimitType" 
                                      checked={newCoupon.isUnlimitedDaily} 
                                      onChange={() => setNewCoupon({ ...newCoupon, isUnlimitedDaily: true })}
                                      style={{ accentColor: '#00D1FF' }}
                                    />
                                    <Infinity size={13} /> Unlimited Per Day
                                  </label>

                                  <label 
                                    style={{ 
                                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                                      background: !newCoupon.isUnlimitedDaily ? 'rgba(0, 209, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                                      border: `1px solid ${!newCoupon.isUnlimitedDaily ? '#00D1FF' : 'rgba(255,255,255,0.1)'}`,
                                      color: !newCoupon.isUnlimitedDaily ? '#00D1FF' : '#888'
                                    }}
                                  >
                                    <input 
                                      type="radio" 
                                      name="dailyLimitType" 
                                      checked={!newCoupon.isUnlimitedDaily} 
                                      onChange={() => setNewCoupon({ ...newCoupon, isUnlimitedDaily: false })}
                                      style={{ accentColor: '#00D1FF' }}
                                    />
                                    Limited Per Day
                                  </label>
                                </div>

                                {!newCoupon.isUnlimitedDaily && (
                                  <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '11px', color: '#aaa' }}>MAX USERS PER DAY *</label>
                                    <input 
                                      type="number" 
                                      value={newCoupon.dailyUsageLimit} 
                                      onChange={e=>setNewCoupon({...newCoupon, dailyUsageLimit: e.target.value})} 
                                      required 
                                      min="1" 
                                      placeholder="e.g. 50" 
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Submit Button */}
                            <button 
                              type="submit" 
                              style={{ background: '#00D1FF', color: '#000', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '13px', fontWeight: '900', letterSpacing: '0.06em', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 20px rgba(0, 209, 255, 0.4)' }} 
                              onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.15)'} 
                              onMouseLeave={e=>e.currentTarget.style.filter='none'}
                            >
                              CREATE & PUBLISH COUPON
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

            {/* Desktop Table */}
            <div className="admin-table-wrapper desktop-only-table">
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

            {/* Mobile User Cards */}
            <div className="mobile-user-card-list mobile-only-card-list">
              {users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748B', fontSize: '13px' }}>
                  No users found.
                </div>
              ) : (
                users.map(u => {
                  const stats = userStatsMap[u._id?.toString()] || { count: 0, spent: 0, lastDate: null };
                  return (
                    <div key={u._id || u.id} className="admin-mobile-user-card">
                      <div className="mu-card-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={u.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + u.email} alt="avatar" className="mu-avatar" />
                          <div>
                            <div className="mu-name">{u.name}</div>
                            <div className="mu-email">{u.email}</div>
                          </div>
                        </div>
                        <div className="mu-coins-badge">
                          🪙 {u.sparCoins || 0} SC
                        </div>
                      </div>

                      <div className="mu-card-body">
                        <div className="mu-info-row">
                          <span>Phone:</span>
                          <strong>{u.phone || 'N/A'}</strong>
                        </div>
                        <div className="mu-info-row">
                          <span>Bookings:</span>
                          <strong>{stats.count} booking{stats.count !== 1 ? 's' : ''}</strong>
                        </div>
                        <div className="mu-info-row">
                          <span>Total Spent:</span>
                          <strong style={{ color: '#C7FF00' }}>₹{stats.spent.toLocaleString('en-IN')}</strong>
                        </div>
                        {stats.lastDate && (
                          <div className="mu-info-row">
                            <span>Last Active:</span>
                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>{stats.lastDate.toLocaleDateString('en-IN')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
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
          onClick={() => { setProofImageModal(null); setProofImgLoading(false); setProofImgFailed(false); }}
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', 
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', cursor: 'zoom-out' 
          }}
        >
          {/* Main Modal Container */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              position: 'relative',
              width: '95%', 
              maxWidth: '560px', 
              height: '85vh', 
              maxHeight: '750px',
              display: 'flex', 
              flexDirection: 'column',
              background: '#0B0E17', 
              borderRadius: '24px', 
              border: '1px solid rgba(0, 209, 255, 0.3)', 
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9)',
              overflow: 'hidden',
              cursor: 'default'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.03)'
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#00D1FF', letterSpacing: '0.05em' }}>PAYMENT PROOF VERIFICATION</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94A3B8' }}>UPI / GPay Transaction Screenshot</p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Open in new tab button */}
                <button 
                  onClick={() => {
                    const url = typeof proofImageModal === 'object' ? proofImageModal.url : proofImageModal;
                    window.open(url, '_blank');
                  }}
                  style={{
                    background: 'rgba(0, 209, 255, 0.1)',
                    border: '1px solid rgba(0, 209, 255, 0.25)',
                    color: '#00D1FF',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: '0.2s'
                  }}
                >
                  <Download size={12} /> OPEN TAB
                </button>

                {/* Close Button */}
                <button 
                  onClick={() => { setProofImageModal(null); setProofImgLoading(false); setProofImgFailed(false); }} 
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
                >
                  <XCircle size={18} color="#FF3D3D" />
                </button>
              </div>
            </div>

            {/* Image Viewer area */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: '#07090E', overflow: 'hidden' }}>
              {proofImgLoading && !proofImgFailed && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#00D1FF' }}>
                  <RotateCcw className="spinning-icon" size={28} />
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>Loading proof screenshot...</span>
                </div>
              )}
              {proofImgFailed ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#FF4D4F' }}>
                  <AlertCircle size={36} style={{ margin: '0 auto 10px auto', display: 'block', opacity: 0.8 }} />
                  <strong style={{ fontSize: '14px', display: 'block', marginBottom: '6px' }}>IMAGE NOT AVAILABLE</strong>
                  <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                    The screenshot could not be loaded from storage.
                  </p>
                </div>
              ) : (
                <img 
                  src={typeof proofImageModal === 'object' ? proofImageModal.url : proofImageModal} 
                  alt="Payment Proof" 
                  onLoad={() => setProofImgLoading(false)}
                  onError={(e) => {
                    const bookingId = typeof proofImageModal === 'object' ? proofImageModal.bookingId : null;
                    if (bookingId && !e.target.dataset.retried) {
                      e.target.dataset.retried = 'true';
                      e.target.src = `${API_URL}/payment/proof/${bookingId}`;
                    } else {
                      setProofImgLoading(false);
                      setProofImgFailed(true);
                    }
                  }}
                  style={{ 
                    display: proofImgLoading ? 'none' : 'block',
                    maxWidth: '100%', 
                    maxHeight: '100%', 
                    objectFit: 'contain', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)' 
                  }} 
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
      </main>
    </div>
  );
};

export default AdminDashboard;
