import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  BarChart3, 
  Ticket, 
  MapPin, 
  Edit3, 
  TrendingUp, 
  ArrowLeft,
  Search,
  Save,
  RotateCcw,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import './AdminDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminDashboard = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('stats');
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPark, setEditingPark] = useState(null);
  const [isAddingPark, setIsAddingPark] = useState(false);
  const [newPark, setNewPark] = useState({
    name: '',
    location: '',
    price: '1000',
    image: 'https://images.unsplash.com/photo-1513889959010-65a4ec810ebb?q=80&w=1080',
    desc: '',
    rating: 4.5,
    tickets_available: 100
  });

  const adminPassword = "admin123"; // Simple command code

  const handleLogin = async (e) => {
    e.preventDefault();
    if (password === adminPassword) {
      const storedUser = localStorage.getItem('spar_session');
      if (!storedUser) return alert("PLEASE LOGIN AS A REGULAR USER FIRST!");
      
      const token = JSON.parse(storedUser).token;
      
      try {
        await axios.post(`${API_URL}/auth/promote-admin`, { code: password }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsAuthenticated(true);
      } catch (err) {
        alert("BACKEND AUTHORIZATION FAILED: " + (err.response?.data?.message || err.message));
      }
    } else {
      alert("INCORRECT COMMAND CODE! ACCESS DENIED.");
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 10000); // Poll every 10 seconds for real-time updates
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const storedUser = localStorage.getItem('spar_session');
    if (!storedUser) return;
    const token = JSON.parse(storedUser).token;

    try {
      const { data } = await axios.get(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBookings(data.bookings || []);
      setUsers(data.users || []);
      
      // Filter for active missions only if needed, otherwise use preset if empty
      setParks(data.parks && data.parks.length > 0 ? data.parks : [
        { id: 1, name: "VGP UNIVERSAL KINGDOM", location: "Chennai, Tamil Nadu", price: "1200", image: "/vgp-image.jpg", desc: "India's first and largest amusement park with over 45 thrilling rides and a private beach." },
        { id: 2, name: "MGM DIZZEE WORLD", location: "Chennai, Tamil Nadu", price: "1000", image: "/mgm-image.jpg", desc: "The Pioneer of entertainment, offering world-class rides and a unique forest-themed water park." },
        { id: 3, name: "QUEENS LAND", location: "Poonamallee, Chennai", price: "850", image: "/queensland_final.png", desc: "An expansive theme park featuring 51 rides, including an enormous cable car and wave pool." },
        { id: 4, name: "BLACK THUNDER", location: "Mettupalayam, Coimbatore", price: "950", image: "/black_thunder_final.jpg", desc: "Asia's No.1 water theme park with the majestic Nilgiris as a backdrop and extreme water slides." },
        { id: 5, name: "WONDERLA", location: "Chennai, Tamil Nadu", price: "1500", image: "/wonderla_final.jpg", desc: "The most popular theme park in India featuring world-class high-thrill rides and huge water parks." }
      ]);
    } catch (err) {
      console.error("Data Fetch Error:", err);
    }
    setLoading(false);
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.totalAmount) || Number(b.total_amount) || 0), 0);

  const handleAddPark = async (e) => {
    e.preventDefault();
    const token = JSON.parse(localStorage.getItem('spar_session')).token;
    try {
      await axios.post(`${API_URL}/admin/parks`, newPark, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsAddingPark(false);
      setNewPark({
        name: '',
        location: '',
        price: '1000',
        image: 'https://images.unsplash.com/photo-1513889959010-65a4ec810ebb?q=80&w=1080',
        desc: '',
        rating: 4.5,
        tickets_available: 100
      });
      fetchData();
    } catch (err) {
      alert("Addition Failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdatePark = async (e) => {
    e.preventDefault();
    if (!editingPark) return;
    
    const token = JSON.parse(localStorage.getItem('spar_session')).token;
    try {
      await axios.put(`${API_URL}/admin/parks/${editingPark._id || editingPark.id}`, editingPark, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingPark(null);
      fetchData();
    } catch (err) {
      alert("Update Failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeletePark = async (id) => {
    if (!window.confirm("Are you sure you want to delete this park?")) return;
    const token = JSON.parse(localStorage.getItem('spar_session')).token;
    try {
      await axios.delete(`${API_URL}/admin/parks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      alert("Delete Failed: " + (err.response?.data?.message || err.message));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-overlay">
        <motion.div 
          className="admin-login-card glass-morphism animate-fade-in"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="login-icon-wrap">
            <RotateCcw className="spinning-icon" size={40} />
          </div>
          <h2>ADMIN LOGIN</h2>
          <p>Enter your authorization code to access the admin panel.</p>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              placeholder="COMMAND CODE"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
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
        <button className="back-btn-neon" onClick={onBack}>
          <ArrowLeft size={18} /> BACK TO HOME
        </button>
        <div className="admin-title-wrap">
          <h1 className="admin-title">ADMIN DASHBOARD <span className="title-version">v2.0</span></h1>
          <p className="admin-subtitle">Park Oversight & Operations Center</p>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
          <TrendingUp size={16} /> STATISTICS
        </button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={16} /> USERS
        </button>
        <button className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
          <Ticket size={16} /> BOOKING LOGS
        </button>
        <button className={`tab-btn ${activeTab === 'parks' ? 'active' : ''}`} onClick={() => setActiveTab('parks')}>
          <MapPin size={16} /> PARK MANAGEMENT
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'stats' && (
          <div className="stats-grid">
            <div className="stat-card revenue-glow">
              <BarChart3 className="stat-icon" />
              <div className="stat-info">
                <p>TOTAL REVENUE</p>
                <h3>₹{totalRevenue.toLocaleString()}</h3>
              </div>
            </div>
            <div className="stat-card users-glow">
              <Users className="stat-icon" />
              <div className="stat-info">
                <p>TOTAL USERS</p>
                <h3>{users.length}</h3>
              </div>
            </div>
            <div className="stat-card flight-glow">
              <Ticket className="stat-icon" />
              <div className="stat-info">
                <p>BOOKINGS COMPLETED</p>
                <h3>{bookings.length}</h3>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>USER NAME</th>
                  <th>EMAIL</th>
                  <th>PHONE</th>
                  <th>SPAR COINS</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id || u.id}>
                    <td className="cadet-name-cell">
                      <img src={u.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + u.email} alt="avatar" />
                      {u.name}
                    </td>
                    <td>{u.email}</td>
                    <td>{u.phone || 'N/A'}</td>
                    <td className="coin-text">{u.sparCoins || u.spar_coins || 0} SC</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>USER</th>
                  <th>PARK</th>
                  <th>TICKETS</th>
                  <th>AMOUNT</th>
                  <th>METHOD</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b._id || b.id}>
                    <td className="text-xs">{new Date(b.createdAt || b.created_at || b.date).toLocaleDateString()}</td>
                    <td>{b.userName || (b.user && b.user.name) || b.cadet_name || 'Unknown'}</td>
                    <td><span className="park-tag">{b.parkName || b.park_name}</span></td>
                    <td>{b.tickets}</td>
                    <td className="amount-text">₹{b.totalAmount || b.total_amount}</td>
                    <td>{b.paymentMethod || b.payment_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'parks' && (
          <div className="park-mgmt-wrap animate-fade-in">
            <div className="park-mgmt-header mb-8 flex justify-between items-center">
              <div className="mgmt-title-block">
                <h3 className="text-xl font-bold text-white-shimmer-rtl">PARK OPERATIONS</h3>
                <p className="text-xs text-slate-400 mt-1">Manage active amusement park offers and pricing.</p>
              </div>
              <button className="btn-add-mission" onClick={() => setIsAddingPark(true)}>
                <Save size={18} /> ADD NEW PARK
              </button>
            </div>

            <div className="parks-list-grid">
              {parks.map(p => (
                <div key={p._id || p.id} className="park-mgmt-card">
                  <img src={p.image} alt={p.name} className="park-thumb" />
                  <div className="park-details">
                    <h4>{p.name}</h4>
                    <p><MapPin size={12} /> {p.location}</p>
                    <p className="price-tag">₹{p.price}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', position: 'absolute', top: '15px', right: '15px' }}>
                    <button className="action-icon-btn edit-btn" onClick={() => setEditingPark(p)}>
                      <Edit3 size={18} />
                    </button>
                    <button className="action-icon-btn delete-btn" onClick={() => handleDeletePark(p._id || p.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {editingPark && (
              <div className="edit-modal-overlay">
                <div className="edit-panel glass-morphism">
                  <h3>EDIT PARK OFFER</h3>
                  <form onSubmit={handleUpdatePark}>
                    <div className="input-group">
                      <label>PARK NAME</label>
                      <input 
                        type="text" 
                        value={editingPark.name} 
                        onChange={(e) => setEditingPark({...editingPark, name: e.target.value})} 
                      />
                    </div>
                    <div className="input-group">
                      <label>LOCATION</label>
                      <input 
                        type="text" 
                        value={editingPark.location} 
                        onChange={(e) => setEditingPark({...editingPark, location: e.target.value})} 
                      />
                    </div>
                    <div className="input-group">
                      <label>PRICE (₹)</label>
                      <input 
                        type="number" 
                        value={editingPark.price} 
                        onChange={(e) => setEditingPark({...editingPark, price: e.target.value})} 
                      />
                    </div>
                    <div className="input-group">
                      <label>AVAILABLE TICKETS</label>
                      <input 
                        type="number" 
                        value={editingPark.tickets_available || 100} 
                        onChange={(e) => setEditingPark({...editingPark, tickets_available: e.target.value})} 
                      />
                    </div>
                    <div className="input-group">
                      <label>DESCRIPTION</label>
                      <input 
                        type="text" 
                        value={editingPark.desc} 
                        onChange={(e) => setEditingPark({...editingPark, desc: e.target.value})} 
                      />
                    </div>
                    <div className="input-group">
                      <label>IMAGE URL</label>
                      <input 
                        type="text" 
                        value={editingPark.image} 
                        onChange={(e) => setEditingPark({...editingPark, image: e.target.value})} 
                      />
                    </div>
                    <div className="edit-actions">
                      <button type="button" className="btn-cancel" onClick={() => setEditingPark(null)}>CANCEL</button>
                      <button type="submit" className="btn-save"><Save size={16} /> SAVE CHANGES</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {isAddingPark && (
              <div className="edit-modal-overlay">
                <div className="edit-panel glass-morphism">
                  <h3>ADD NEW PARK</h3>
                  <form onSubmit={handleAddPark}>
                    <div className="input-group">
                      <label>PARK NAME</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Universal Studios"
                        value={newPark.name} 
                        onChange={(e) => setNewPark({...newPark, name: e.target.value})} 
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label>LOCATION</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Florida, USA"
                        value={newPark.location} 
                        onChange={(e) => setNewPark({...newPark, location: e.target.value})} 
                        required
                      />
                    </div>
                    <div className="input-group-row grid grid-cols-2 gap-4">
                      <div className="input-group">
                        <label>PRICE (₹)</label>
                        <input 
                          type="number" 
                          value={newPark.price} 
                          onChange={(e) => setNewPark({...newPark, price: e.target.value})} 
                          required
                        />
                      </div>
                      <div className="input-group">
                        <label>TICKETS</label>
                        <input 
                          type="number" 
                          value={newPark.tickets_available} 
                          onChange={(e) => setNewPark({...newPark, tickets_available: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>DESCRIPTION</label>
                      <input 
                        type="text" 
                        placeholder="Short tagline for the park..."
                        value={newPark.desc} 
                        onChange={(e) => setNewPark({...newPark, desc: e.target.value})} 
                      />
                    </div>
                    <div className="input-group">
                      <label>IMAGE URL</label>
                      <input 
                        type="text" 
                        placeholder="https://images.unsplash..."
                        value={newPark.image} 
                        onChange={(e) => setNewPark({...newPark, image: e.target.value})} 
                      />
                    </div>
                    <div className="edit-actions">
                      <button type="button" className="btn-cancel" onClick={() => setIsAddingPark(false)}>CANCEL</button>
                      <button type="submit" className="btn-save"><Save size={16} /> PUBLISH PARK</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
