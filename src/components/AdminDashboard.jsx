import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BarChart3, Ticket, MapPin, Edit3, TrendingUp, ArrowLeft, Search, Save, RotateCcw, Trash2, Eye, CheckCircle, Clock, DollarSign, XCircle, Plus, Image } from 'lucide-react';
import axios from 'axios';
import './AdminDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SERVER_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

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
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingPark, setEditingPark] = useState(null);
  const [isAddingPark, setIsAddingPark] = useState(false);
  const [isAddingRevenue, setIsAddingRevenue] = useState(false);
  const [manualRevenue, setManualRevenue] = useState({ amount: '', description: '', parkName: '' });
  const [newPark, setNewPark] = useState({ name: '', location: '', price: '1000', image: '', desc: '', rating: 4.5, tickets_available: 100 });
  const [statusFilter, setStatusFilter] = useState('all');

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
      setParks(data.parks?.length > 0 ? data.parks : []);
      setRevenueEntries(data.revenueEntries || []);
      setTotalRevenue(data.totalRevenue || 0);
    } catch (err) { console.error("Fetch Error:", err); }
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
      if (selectedBooking?._id === bookingId) {
        const { data } = await axios.get(`${API_URL}/admin/bookings/${bookingId}`, { headers: { Authorization: `Bearer ${token}` } });
        setSelectedBooking(data);
      }
    } catch (err) { alert("Status update failed: " + (err.response?.data?.message || err.message)); }
  };

  const handleAddRevenue = async (e) => {
    e.preventDefault();
    const token = getToken();
    try {
      await axios.post(`${API_URL}/admin/revenue`, { amount: Number(manualRevenue.amount), description: manualRevenue.description, parkName: manualRevenue.parkName }, { headers: { Authorization: `Bearer ${token}` } });
      setIsAddingRevenue(false);
      setManualRevenue({ amount: '', description: '', parkName: '' });
      fetchData();
    } catch (err) { alert("Failed: " + (err.response?.data?.message || err.message)); }
  };

  const handleAddPark = async (e) => {
    e.preventDefault();
    const token = getToken();
    try {
      await axios.post(`${API_URL}/admin/parks`, newPark, { headers: { Authorization: `Bearer ${token}` } });
      setIsAddingPark(false);
      setNewPark({ name: '', location: '', price: '1000', image: '', desc: '', rating: 4.5, tickets_available: 100 });
      fetchData();
    } catch (err) { alert("Failed: " + (err.response?.data?.message || err.message)); }
  };

  const handleUpdatePark = async (e) => {
    e.preventDefault();
    if (!editingPark) return;
    const token = getToken();
    try {
      await axios.put(`${API_URL}/admin/parks/${editingPark._id || editingPark.id}`, editingPark, { headers: { Authorization: `Bearer ${token}` } });
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

  const getStatusColor = (s) => ({ pending: '#FFC107', verified: '#00D1FF', completed: '#C7FF00', cancelled: '#FF6B6B' }[s] || '#94A3B8');
  const getStatusIcon = (s) => ({ pending: <Clock size={14}/>, verified: <CheckCircle size={14}/>, completed: <CheckCircle size={14}/>, cancelled: <XCircle size={14}/> }[s]);
  const filteredBookings = statusFilter === 'all' ? bookings : bookings.filter(b => b.status === statusFilter);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const verifiedCount = bookings.filter(b => b.status === 'verified').length;

  if (!isAuthenticated) {
    return (
      <div className="admin-login-overlay">
        <motion.div className="admin-login-card glass-morphism animate-fade-in" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="login-icon-wrap"><RotateCcw className="spinning-icon" size={40} /></div>
          <h2>ADMIN LOGIN</h2>
          <p>Enter your authorization code to access the admin panel.</p>
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
        <button className="back-btn-neon" onClick={onBack}><ArrowLeft size={18} /> BACK TO HOME</button>
        <div className="admin-title-wrap">
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
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}><Users size={16} /> USERS</button>
        <button className={`tab-btn ${activeTab === 'parks' ? 'active' : ''}`} onClick={() => setActiveTab('parks')}><MapPin size={16} /> PARKS</button>
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
        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div className="stats-grid">
            <div className="stat-card revenue-glow"><BarChart3 className="stat-icon" /><div className="stat-info"><p>TOTAL REVENUE</p><h3>₹{totalRevenue.toLocaleString()}</h3></div></div>
            <div className="stat-card users-glow"><Users className="stat-icon" /><div className="stat-info"><p>TOTAL USERS</p><h3>{users.length}</h3></div></div>
            <div className="stat-card flight-glow"><Ticket className="stat-icon" /><div className="stat-info"><p>TOTAL BOOKINGS</p><h3>{bookings.length}</h3></div></div>
            <div className="stat-card" style={{ borderColor: 'rgba(255,193,7,0.3)' }}><Clock className="stat-icon" style={{ color: '#FFC107' }} /><div className="stat-info"><p>PENDING VERIFICATION</p><h3 style={{ color: '#FFC107' }}>{pendingCount}</h3></div></div>
            <div className="stat-card" style={{ borderColor: 'rgba(0,209,255,0.3)' }}><CheckCircle className="stat-icon" style={{ color: '#00D1FF' }} /><div className="stat-info"><p>VERIFIED</p><h3 style={{ color: '#00D1FF' }}>{verifiedCount}</h3></div></div>
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div>
            <div className="booking-filters">
              {['all','pending','verified','completed','cancelled'].map(f => (
                <button key={f} className={`filter-chip ${statusFilter === f ? 'active' : ''}`} onClick={() => setStatusFilter(f)}
                  style={statusFilter === f ? { borderColor: getStatusColor(f === 'all' ? 'verified' : f), color: getStatusColor(f === 'all' ? 'verified' : f) } : {}}>
                  {f.toUpperCase()} {f !== 'all' && <span>({bookings.filter(b => b.status === f).length})</span>}
                </button>
              ))}
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead><tr><th>DATE</th><th>BOOKING ID</th><th>USER</th><th>PARK</th><th>TICKETS</th><th>AMOUNT</th><th>STATUS</th><th>SCREENSHOT</th><th>ACTIONS</th></tr></thead>
                <tbody>
                  {(searchResults || filteredBookings).map(b => (
                    <tr key={b._id || b.id}>
                      <td className="text-xs">{new Date(b.createdAt || b.date).toLocaleDateString()}</td>
                      <td><span className="booking-id-cell">{b.bookingId}</span></td>
                      <td>{b.userName || 'Unknown'}</td>
                      <td><span className="park-tag">{b.parkName}</span></td>
                      <td>{b.tickets}</td>
                      <td className="amount-text">₹{b.totalAmount}</td>
                      <td><span className="status-badge" style={{ color: getStatusColor(b.status), borderColor: getStatusColor(b.status) }}>{getStatusIcon(b.status)} {b.status}</span></td>
                      <td>{b.paymentScreenshot ? <button className="screenshot-view-btn" onClick={() => window.open(`${SERVER_URL}${b.paymentScreenshot}`, '_blank')}><Image size={14}/> View</button> : <span className="text-xs" style={{color:'#64748b'}}>None</span>}</td>
                      <td>
                        <div className="action-btns-row">
                          {b.status === 'pending' && <button className="status-action-btn verify-btn" onClick={() => handleStatusUpdate(b._id, 'verified')}>✓ Verify</button>}
                          {b.status === 'verified' && <button className="status-action-btn complete-btn" onClick={() => handleStatusUpdate(b._id, 'completed')}>✓ Complete</button>}
                          {b.status !== 'cancelled' && b.status !== 'completed' && <button className="status-action-btn cancel-btn" onClick={() => handleStatusUpdate(b._id, 'cancelled')}>✕</button>}
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
              <div className="revenue-total-card glass-morphism"><p>TOTAL REVENUE</p><h2>₹{totalRevenue.toLocaleString()}</h2></div>
              <button className="btn-add-mission" onClick={() => setIsAddingRevenue(true)}><Plus size={18} /> ADD MANUAL ENTRY</button>
            </div>
            <div className="admin-table-wrapper" style={{marginTop:'20px'}}>
              <table className="admin-table">
                <thead><tr><th>DATE</th><th>ENTRY ID</th><th>SOURCE</th><th>DESCRIPTION</th><th>PARK</th><th>AMOUNT</th><th>ADDED BY</th></tr></thead>
                <tbody>
                  {revenueEntries.map(r => (
                    <tr key={r._id}>
                      <td className="text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td><span className="booking-id-cell">{r.entryId}</span></td>
                      <td><span className={`source-badge ${r.source}`}>{r.source}</span></td>
                      <td className="text-xs">{r.description}</td>
                      <td><span className="park-tag">{r.parkName || '—'}</span></td>
                      <td className="amount-text">₹{r.amount?.toLocaleString()}</td>
                      <td className="text-xs">{r.addedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead><tr><th>USER NAME</th><th>EMAIL</th><th>PHONE</th><th>SPAR ID</th><th>SPAR COINS</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id || u.id}>
                    <td className="cadet-name-cell"><img src={u.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + u.email} alt="avatar" />{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || 'N/A'}</td>
                    <td className="text-xs">{u.sparId || '—'}</td>
                    <td className="coin-text">{u.sparCoins || 0} SC</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PARKS TAB */}
        {activeTab === 'parks' && (
          <div className="park-mgmt-wrap animate-fade-in">
            <div className="park-mgmt-header mb-8 flex justify-between items-center">
              <div className="mgmt-title-block"><h3 className="text-xl font-bold text-white-shimmer-rtl">PARK OPERATIONS</h3><p className="text-xs text-slate-400 mt-1">Manage active amusement park offers and pricing.</p></div>
              <button className="btn-add-mission" onClick={() => setIsAddingPark(true)}><Save size={18} /> ADD NEW PARK</button>
            </div>
            <div className="parks-list-grid">
              {parks.map(p => (
                <div key={p._id || p.id} className="park-mgmt-card">
                  <img src={p.image} alt={p.name} className="park-thumb" />
                  <div className="park-details"><h4>{p.name}</h4><p><MapPin size={12} /> {p.location}</p><p className="price-tag">₹{p.price}</p></div>
                  <div style={{ display: 'flex', gap: '8px', position: 'absolute', top: '15px', right: '15px' }}>
                    <button className="action-icon-btn edit-btn" onClick={() => setEditingPark(p)}><Edit3 size={18} /></button>
                    <button className="action-icon-btn delete-btn" onClick={() => handleDeletePark(p._id || p.id)}><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Park Modal */}
            {editingPark && (
              <div className="edit-modal-overlay">
                <div className="edit-panel glass-morphism">
                  <h3>EDIT PARK</h3>
                  <form onSubmit={handleUpdatePark}>
                    <div className="input-group"><label>NAME</label><input type="text" value={editingPark.name} onChange={(e) => setEditingPark({...editingPark, name: e.target.value})} /></div>
                    <div className="input-group"><label>LOCATION</label><input type="text" value={editingPark.location} onChange={(e) => setEditingPark({...editingPark, location: e.target.value})} /></div>
                    <div className="input-group"><label>PRICE (₹)</label><input type="number" value={editingPark.price} onChange={(e) => setEditingPark({...editingPark, price: e.target.value})} /></div>
                    <div className="input-group"><label>TICKETS</label><input type="number" value={editingPark.tickets_available || 100} onChange={(e) => setEditingPark({...editingPark, tickets_available: e.target.value})} /></div>
                    <div className="input-group"><label>DESCRIPTION</label><input type="text" value={editingPark.desc} onChange={(e) => setEditingPark({...editingPark, desc: e.target.value})} /></div>
                    <div className="input-group"><label>IMAGE URL</label><input type="text" value={editingPark.image} onChange={(e) => setEditingPark({...editingPark, image: e.target.value})} /></div>
                    <div className="edit-actions"><button type="button" className="btn-cancel" onClick={() => setEditingPark(null)}>CANCEL</button><button type="submit" className="btn-save"><Save size={16} /> SAVE</button></div>
                  </form>
                </div>
              </div>
            )}

            {/* Add Park Modal */}
            {isAddingPark && (
              <div className="edit-modal-overlay">
                <div className="edit-panel glass-morphism">
                  <h3>ADD NEW PARK</h3>
                  <form onSubmit={handleAddPark}>
                    <div className="input-group"><label>NAME</label><input type="text" value={newPark.name} onChange={(e) => setNewPark({...newPark, name: e.target.value})} required /></div>
                    <div className="input-group"><label>LOCATION</label><input type="text" value={newPark.location} onChange={(e) => setNewPark({...newPark, location: e.target.value})} required /></div>
                    <div className="input-group"><label>PRICE (₹)</label><input type="number" value={newPark.price} onChange={(e) => setNewPark({...newPark, price: e.target.value})} required /></div>
                    <div className="input-group"><label>DESCRIPTION</label><input type="text" value={newPark.desc} onChange={(e) => setNewPark({...newPark, desc: e.target.value})} /></div>
                    <div className="input-group"><label>IMAGE URL</label><input type="text" value={newPark.image} onChange={(e) => setNewPark({...newPark, image: e.target.value})} /></div>
                    <div className="edit-actions"><button type="button" className="btn-cancel" onClick={() => setIsAddingPark(false)}>CANCEL</button><button type="submit" className="btn-save"><Save size={16} /> PUBLISH</button></div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Revenue Modal */}
      {isAddingRevenue && (
        <div className="edit-modal-overlay">
          <div className="edit-panel glass-morphism">
            <h3>ADD REVENUE ENTRY</h3>
            <form onSubmit={handleAddRevenue}>
              <div className="input-group"><label>AMOUNT (₹)</label><input type="number" value={manualRevenue.amount} onChange={(e) => setManualRevenue({...manualRevenue, amount: e.target.value})} required min="1" /></div>
              <div className="input-group"><label>DESCRIPTION</label><input type="text" placeholder="e.g. Cash payment at gate" value={manualRevenue.description} onChange={(e) => setManualRevenue({...manualRevenue, description: e.target.value})} /></div>
              <div className="input-group"><label>PARK NAME (optional)</label><input type="text" value={manualRevenue.parkName} onChange={(e) => setManualRevenue({...manualRevenue, parkName: e.target.value})} /></div>
              <div className="edit-actions"><button type="button" className="btn-cancel" onClick={() => setIsAddingRevenue(false)}>CANCEL</button><button type="submit" className="btn-save"><Plus size={16} /> ADD ENTRY</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
