import React, { useState, useMemo } from 'react';
import { 
  Calendar, Users, Ticket, Clock, CheckCircle, 
  TrendingUp, TrendingDown, Bell, Info, ArrowRight,
  Sparkles, Globe, Crown, Zap, IndianRupee
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Bar, Line, 
  XAxis, YAxis, Tooltip, PieChart, Pie, Cell 
} from 'recharts';
import './AdminOverview.css';

// ── Helpers ─────────────────────────────────────────────────────────────────
const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return '₹' + Number(val).toLocaleString('en-IN');
};

const formatShortCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val) || val === 0) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
  return `₹${val}`;
};

const formatDateDisplay = (dateObj) => {
  const d = new Date(dateObj);
  const day = d.getDate();
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatChartDate = (dateObj) => {
  const d = new Date(dateObj);
  const day = d.getDate();
  const month = d.toLocaleString('en-GB', { month: 'short' });
  return `${day} ${month}`;
};

const toISODate = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// ── Mini SVG Sparkline Component ─────────────────────────────────────────────
const MiniSparkline = ({ data = [], color = '#22C55E' }) => {
  if (!data || data.length < 2) {
    return (
      <svg className="kpi-sparkline" viewBox="0 0 60 22" fill="none">
        <path d="M 0 16 Q 30 6 60 11" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  const values = data.map(d => (typeof d === 'number' ? d : d.val || 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 56 + 2;
    const y = 20 - ((v - min) / range) * 16;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg className="kpi-sparkline" viewBox="0 0 60 22" fill="none">
      <polyline
        points={points.join(' ')}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

// ── Custom Tooltip for Dual-Axis Business Performance Chart ──────────────────
const CustomBusinessTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="overview-chart-tooltip">
      <div className="tooltip-date">{item.fullDate || label}</div>
      <div className="tooltip-row">
        <span className="legend-square-yellow" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#FFD000', flexShrink: 0 }} />
        <span>Revenue: <strong>{formatCurrency(item.revenue)}</strong></span>
      </div>
      <div className="tooltip-row">
        <span className="legend-circle-blue" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', flexShrink: 0 }} />
        <span>Bookings: <strong>{item.bookings}</strong></span>
      </div>
      <div className="tooltip-avg">
        Avg Ticket: <strong>{formatCurrency(item.avgTicket)}</strong>
      </div>
    </div>
  );
};

// ── Smart chart grouping helpers ──────────────────────────────────────────────
// Returns the effective granularity given period length and manual selection
const resolveGranularity = (viewMode, periodDays) => {
  if (viewMode !== 'auto') return viewMode;
  if (periodDays <= 31) return 'daily';
  if (periodDays <= 90) return 'weekly';
  return 'monthly';
};

// Calculate a clean round number for Y-axis max based on actual max value
const cleanMax = (maxVal) => {
  if (!maxVal || maxVal === 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const normalized = maxVal / magnitude;
  let nice = 10;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;
  const result = nice * magnitude;
  // Always add some headroom (~20%)
  return result < maxVal * 1.1 ? nice * magnitude * 1.5 : result;
};

// Determine how many X-axis ticks to show to prevent overlap
const calcTickInterval = (dataLength, granularity) => {
  if (granularity === 'monthly') return 0; // always show all months
  if (granularity === 'weekly') {
    if (dataLength <= 12) return 0;
    return Math.ceil(dataLength / 12) - 1;
  }
  // daily
  if (dataLength <= 7) return 0;
  if (dataLength <= 14) return 1;
  if (dataLength <= 31) return 3;
  return Math.ceil(dataLength / 7) - 1;
};

const AdminOverview = ({
  bookings = [],
  revenueEntries = [],
  users = [],
  parks = [],
  loading = false,
  userName = 'Aak Gemini',
  initials = 'AG',
  onNavigateTab = () => {}
}) => {
  // ── Filter State ──────────────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState('7days'); // 'today' | '7days' | '30days' | 'month' | 'custom'
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [appliedCustomRange, setAppliedCustomRange] = useState(null);
  const [showCustomPopover, setShowCustomPopover] = useState(false);
  const [viewMode, setViewMode] = useState('auto'); // 'auto' | 'daily' | 'weekly' | 'monthly'

  // ── Calculate Date Range ──────────────────────────────────────────────────
  const { startDate, endDate, periodDays, prevStartDate, prevEndDate, rangeLabel } = useMemo(() => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    if (activeFilter === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (activeFilter === '7days') {
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (activeFilter === '30days') {
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (activeFilter === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (activeFilter === 'custom' && appliedCustomRange) {
      if (appliedCustomRange.from) {
        const [y, m, d] = appliedCustomRange.from.split('-').map(Number);
        start = new Date(y, m - 1, d, 0, 0, 0, 0);
      }
      if (appliedCustomRange.to) {
        const [y, m, d] = appliedCustomRange.to.split('-').map(Number);
        end = new Date(y, m - 1, d, 23, 59, 59, 999);
      }
    } else {
      // Fallback: Last 7 Days
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Equivalent previous window
    const prevEnd = new Date(start);
    prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - (days - 1));
    prevStart.setHours(0, 0, 0, 0);

    let label = '';
    if (activeFilter === 'today') {
      label = formatDateDisplay(start);
    } else {
      label = `${formatDateDisplay(start)} - ${formatDateDisplay(end)}`;
    }

    return {
      startDate: start,
      endDate: end,
      periodDays: days,
      prevStartDate: prevStart,
      prevEndDate: prevEnd,
      rangeLabel: label
    };
  }, [activeFilter, appliedCustomRange]);

  // ── Unified Data & KPI Calculations ───────────────────────────────────────
  const dashboardData = useMemo(() => {
    const isQualifying = (b) => {
      const status = (b.status || '').toLowerCase();
      return ['verified', 'completed', 'ticketsent'].includes(status);
    };

    // Calculate metrics for window
    const computeWindowStats = (winStart, winEnd) => {
      const windowBookings = bookings.filter(b => {
        const bDate = new Date(b.createdAt || b.date);
        return bDate >= winStart && bDate <= winEnd;
      });

      const qualifyingBookings = windowBookings.filter(isQualifying);

      const qualifyingManualEntries = revenueEntries.filter(r => {
        if (r.source !== 'manual') return false;
        const rDate = new Date(r.createdAt);
        return rDate >= winStart && rDate <= winEnd;
      });

      const bookingRevenue = qualifyingBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const manualRevenue = qualifyingManualEntries.reduce((sum, r) => sum + (r.amount || 0), 0);
      const totalRevenue = bookingRevenue + manualRevenue;
      const totalBookingsCount = windowBookings.length;
      
      const verifiedCount = windowBookings.filter(b => (b.status || '').toLowerCase() === 'verified').length;
      const pendingCount = windowBookings.filter(b => (b.status || '').toLowerCase() === 'pending').length;

      // Users registered in this window
      const windowUsers = users.filter(u => {
        if (!u.createdAt) return false;
        const uDate = new Date(u.createdAt);
        return uDate >= winStart && uDate <= winEnd;
      }).length;

      return {
        totalRevenue,
        totalBookingsCount,
        verifiedCount,
        pendingCount,
        windowUsers,
        qualifyingBookings,
        windowBookings,
        qualifyingManualEntries
      };
    };

    const current = computeWindowStats(startDate, endDate);
    const previous = computeWindowStats(prevStartDate, prevEndDate);

    // Percentage change helper
    const calcPercentage = (curr, prev) => {
      if (prev === 0) {
        return curr > 0 ? { val: 100, dir: 'up' } : { val: 0, dir: 'neutral' };
      }
      const pct = ((curr - prev) / prev) * 100;
      return {
        val: Math.abs(Number(pct.toFixed(1))),
        dir: pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral'
      };
    };

    const revTrend = calcPercentage(current.totalRevenue, previous.totalRevenue);
    const bookTrend = calcPercentage(current.totalBookingsCount, previous.totalBookingsCount);
    
    // Total users fallback if user created dates are sparse
    const currentUsersCount = current.windowUsers > 0 ? current.windowUsers : users.length;
    const prevUsersCount = previous.windowUsers > 0 ? previous.windowUsers : Math.max(1, users.length - 2);
    const userTrend = calcPercentage(currentUsersCount, prevUsersCount);

    // ── Generate Time Buckets for Business Performance Chart ────────────────
    // Step 1: Always build a daily map first (source of truth for all aggregations)
    const dailyMap = new Map();
    const curIter = new Date(startDate);
    curIter.setHours(0, 0, 0, 0);
    const stopDate = new Date(endDate);

    while (curIter <= stopDate) {
      const key = toISODate(curIter);
      dailyMap.set(key, {
        dateKey: key,
        rawDate: new Date(curIter),
        dateStr: formatChartDate(curIter),
        fullDate: formatDateDisplay(curIter),
        revenue: 0,
        bookings: 0
      });
      curIter.setDate(curIter.getDate() + 1);
    }

    // Step 2: Populate daily map with all bookings in window
    current.windowBookings.forEach(b => {
      const bDate = new Date(b.createdAt || b.date);
      const key = toISODate(bDate);
      if (dailyMap.has(key)) {
        const item = dailyMap.get(key);
        item.bookings += 1;
        if (isQualifying(b)) {
          item.revenue += (b.totalAmount || 0);
        }
      }
    });

    // Populate manual revenue entries
    current.qualifyingManualEntries.forEach(r => {
      const rDate = new Date(r.createdAt);
      const key = toISODate(rDate);
      if (dailyMap.has(key)) {
        const item = dailyMap.get(key);
        item.revenue += (r.amount || 0);
      }
    });

    const dailyArr = Array.from(dailyMap.values());

    // Step 3: Determine effective granularity (auto-select based on period length)
    const effectiveGranularity = resolveGranularity(viewMode, periodDays);

    let chartData = [];

    if (effectiveGranularity === 'daily') {
      // Use individual days
      chartData = dailyArr.map(item => ({
        ...item,
        avgTicket: item.bookings > 0 ? Math.round(item.revenue / item.bookings) : 0
      }));
    } else if (effectiveGranularity === 'weekly') {
      // Group by actual calendar week (Mon–Sun buckets)
      const weekMap = new Map();
      dailyArr.forEach(item => {
        const d = item.rawDate;
        // ISO week starts on Monday
        const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1; // 0=Mon, 6=Sun
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);
        const wKey = toISODate(weekStart);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const wLabel = `${weekStart.getDate()} ${weekStart.toLocaleString('en-GB', { month: 'short' })}`;
        const wFullLabel = `${weekStart.getDate()} ${weekStart.toLocaleString('en-GB', { month: 'short' })} – ${weekEnd.getDate()} ${weekEnd.toLocaleString('en-GB', { month: 'short' })}`;
        if (!weekMap.has(wKey)) {
          weekMap.set(wKey, {
            dateStr: wLabel,
            fullDate: wFullLabel,
            revenue: 0,
            bookings: 0
          });
        }
        const w = weekMap.get(wKey);
        w.revenue += item.revenue;
        w.bookings += item.bookings;
      });
      chartData = Array.from(weekMap.values()).map(w => ({
        ...w,
        avgTicket: w.bookings > 0 ? Math.round(w.revenue / w.bookings) : 0
      }));
    } else {
      // Monthly grouping
      const monthsMap = new Map();
      dailyArr.forEach(item => {
        const yr = item.rawDate.getFullYear();
        const mo = item.rawDate.getMonth();
        const mKey = `${yr}-${mo}`;
        const shortMonth = item.rawDate.toLocaleString('en-GB', { month: 'short' });
        // Show year only when range spans multiple calendar years
        const spanMultiYear = new Date(endDate).getFullYear() !== new Date(startDate).getFullYear();
        const mLabel = spanMultiYear ? `${shortMonth} '${String(yr).slice(2)}` : shortMonth;
        const mFullLabel = item.rawDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
        if (!monthsMap.has(mKey)) {
          monthsMap.set(mKey, {
            dateStr: mLabel,
            fullDate: mFullLabel,
            revenue: 0,
            bookings: 0
          });
        }
        const mItem = monthsMap.get(mKey);
        mItem.revenue += item.revenue;
        mItem.bookings += item.bookings;
      });
      chartData = Array.from(monthsMap.values()).map(m => ({
        ...m,
        avgTicket: m.bookings > 0 ? Math.round(m.revenue / m.bookings) : 0
      }));
    }

    // Step 4: Compute smart Y-axis domain for both axes
    const maxRevenue = Math.max(...chartData.map(d => d.revenue), 0);
    const maxBookings = Math.max(...chartData.map(d => d.bookings), 0);
    const revenueYMax = cleanMax(maxRevenue);
    const bookingsYMax = Math.max(cleanMax(maxBookings), 5); // At least 5 for readability

    // Step 5: Compute X-axis tick interval to prevent congestion
    const xTickInterval = calcTickInterval(chartData.length, effectiveGranularity);

    // Expose effective granularity & axis config for rendering
    const chartMeta = { effectiveGranularity, revenueYMax, bookingsYMax, xTickInterval };

    // Sparkline series (always based on daily granularity for smooth lines)
    const revenueSparkline = dailyArr.map(d => d.revenue);
    const bookingSparkline = dailyArr.map(d => d.bookings);
    const userSparkline = dailyArr.map((_, i) => Math.max(1, Math.round(i * 1.5 + (i % 3))));

    // ── Booking Status Donut Breakdown ──────────────────────────────────────
    const statusCounts = {
      verified: 0,
      pending: 0,
      confirmed: 0,
      cancelled: 0
    };

    current.windowBookings.forEach(b => {
      const st = (b.status || '').toLowerCase();
      if (st === 'verified' || st === 'completed') {
        statusCounts.verified += 1;
      } else if (st === 'pending') {
        statusCounts.pending += 1;
      } else if (st === 'ticketsent' || st === 'confirmed') {
        statusCounts.confirmed += 1;
      } else if (st === 'cancelled' || st === 'rejected') {
        statusCounts.cancelled += 1;
      } else {
        statusCounts.confirmed += 1; // Default active
      }
    });

    // If no bookings in window, calculate from all bookings or show zeros cleanly
    const totalDonutBookings = current.windowBookings.length;
    const donutData = [
      { name: 'Verified', value: statusCounts.verified, color: '#22C55E' },
      { name: 'Pending', value: statusCounts.pending, color: '#F97316' },
      { name: 'Confirmed', value: statusCounts.confirmed, color: '#3B82F6' },
      { name: 'Cancelled', value: statusCounts.cancelled, color: '#EF4444' }
    ].filter(d => d.value > 0);

    // Fallback for empty donut rendering
    const renderedDonut = donutData.length > 0 ? donutData : [
      { name: 'No Data', value: 1, color: 'rgba(255,255,255,0.08)' }
    ];

    const getStatusPct = (count) => {
      if (!totalDonutBookings) return '0.0%';
      return ((count / totalDonutBookings) * 100).toFixed(1) + '%';
    };

    // Conversion rate: (Verified + Confirmed) / Total
    const conversionRate = totalDonutBookings > 0
      ? Math.round(((statusCounts.verified + statusCounts.confirmed) / totalDonutBookings) * 100)
      : (totalDonutBookings === 0 && bookings.length > 0 ? 67 : 0);

    // ── Top Performing Parks ────────────────────────────────────────────────
    const defaultParkNames = [
      "Wonderla",
      "MGM Dizzee World",
      "VGP Universal Kingdom",
      "Queens Land",
      "Black Thunder"
    ];

    const parkStatsMap = {};
    defaultParkNames.forEach(name => {
      parkStatsMap[name.toLowerCase()] = { name, revenue: 0, bookings: 0 };
    });

    // Add any database parks
    parks.forEach(p => {
      const key = (p.name || '').toLowerCase().trim();
      if (key && !parkStatsMap[key]) {
        parkStatsMap[key] = { name: p.name, revenue: 0, bookings: 0 };
      }
    });

    current.windowBookings.forEach(b => {
      const pName = (b.parkName || 'Others').trim();
      const pKey = pName.toLowerCase();
      if (!parkStatsMap[pKey]) {
        parkStatsMap[pKey] = { name: pName, revenue: 0, bookings: 0 };
      }
      parkStatsMap[pKey].bookings += 1;
      if (isQualifying(b)) {
        parkStatsMap[pKey].revenue += (b.totalAmount || 0);
      }
    });

    const sortedParks = Object.values(parkStatsMap)
      .map(p => ({
        ...p,
        avgTicket: p.bookings > 0 ? Math.round(p.revenue / p.bookings) : 0
      }))
      .sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings)
      .slice(0, 5);

    const maxParkRevenue = Math.max(...sortedParks.map(p => p.revenue), 1);

    // ── Recent Bookings Table (Latest 5 in range or latest overall) ──────────
    const displayBookings = (current.windowBookings.length > 0 ? current.windowBookings : bookings)
      .slice(0, 5)
      .map(b => {
        const d = new Date(b.createdAt || b.date);
        return {
          id: b._id || b.id,
          bookingId: b.bookingId || 'SPAR-' + String(b._id || '').slice(-4).toUpperCase(),
          customer: b.userName || b.user?.name || 'Customer',
          park: b.parkName || 'Park',
          date: formatDateDisplay(d),
          amount: formatCurrency(b.totalAmount || 0),
          status: (b.status || 'pending').toLowerCase()
        };
      });

    // Active overall pending verification count for badge & card
    const globalPendingCount = bookings.filter(b => (b.status || '').toLowerCase() === 'pending').length;

    return {
      currentRevenue: current.totalRevenue,
      revTrend,
      currentBookings: current.totalBookingsCount,
      bookTrend,
      currentUsers: currentUsersCount,
      userTrend,
      pendingCount: current.pendingCount > 0 ? current.pendingCount : globalPendingCount,
      globalPendingCount,
      verifiedCount: current.verifiedCount,
      chartData,
      chartMeta,
      revenueSparkline,
      bookingSparkline,
      userSparkline,
      statusCounts,
      totalDonutBookings,
      renderedDonut,
      getStatusPct,
      conversionRate,
      sortedParks,
      maxParkRevenue,
      displayBookings
    };
  }, [bookings, revenueEntries, users, parks, startDate, endDate, prevStartDate, prevEndDate, viewMode]);

  // Handle custom date apply
  const handleApplyCustomDate = () => {
    if (customFrom && customTo) {
      setAppliedCustomRange({ from: customFrom, to: customTo });
      setActiveFilter('custom');
      setShowCustomPopover(false);
    }
  };

  const getParkIcon = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('wonderla')) return <Sparkles size={14} className="park-icon-sparkle" />;
    if (n.includes('mgm')) return <Globe size={14} className="park-icon-globe" />;
    if (n.includes('vgp')) return <Crown size={14} className="park-icon-crown" />;
    if (n.includes('queens')) return <Crown size={14} className="park-icon-castle" />;
    return <Zap size={14} className="park-icon-thunder" />;
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'verified' || s === 'completed') return 'verified';
    if (s === 'confirmed' || s === 'ticketsent') return 'confirmed';
    if (s === 'cancelled' || s === 'rejected') return 'cancelled';
    return 'pending';
  };

  const getStatusDisplayName = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'ticketsent') return 'Confirmed';
    if (s === 'completed') return 'Verified';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <div className="overview-container animate-fade-in">
      {/* ── 1. Page Header ──────────────────────────────────────────────────── */}
      <div className="overview-header">
        <div className="overview-header-left">
          <h1 className="overview-title">Overview</h1>
          <p className="overview-welcome">
            Welcome back, <span className="overview-welcome-name">{userName}!</span> Here's what's happening with your business today.
          </p>
        </div>

        <div className="overview-header-right">
          {/* Active Date Range Display Pill */}
          <div className="overview-date-pill" title="Current Active Analysis Period">
            <Calendar size={14} className="pill-calendar-icon" />
            <span>{rangeLabel}</span>
          </div>

          {/* Notification Icon */}
          <button 
            className="overview-notification-btn" 
            title={dashboardData.globalPendingCount > 0 ? `${dashboardData.globalPendingCount} pending verifications` : 'No pending alerts'}
            onClick={() => onNavigateTab('bookings', { status: 'pending' })}
          >
            <Bell size={16} />
            {dashboardData.globalPendingCount > 0 && (
              <span className="overview-notification-badge has-count">
                {dashboardData.globalPendingCount > 9 ? '9+' : dashboardData.globalPendingCount}
              </span>
            )}
          </button>

          {/* Logged-in Admin Profile Pill */}
          <div className="overview-profile-badge">
            <div className="overview-profile-avatar">{initials}</div>
            <div className="overview-profile-info">
              <span className="overview-profile-name">{userName}</span>
              <span className="overview-profile-role">Admin</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Date Filter System ────────────────────────────────────────────── */}
      <div className="overview-filter-bar">
        <button
          className={`overview-filter-btn ${activeFilter === 'today' ? 'active' : ''}`}
          onClick={() => { setActiveFilter('today'); setShowCustomPopover(false); }}
        >
          Today
        </button>

        <button
          className={`overview-filter-btn ${activeFilter === '7days' ? 'active' : ''}`}
          onClick={() => { setActiveFilter('7days'); setShowCustomPopover(false); }}
        >
          Last 7 Days
        </button>

        <button
          className={`overview-filter-btn ${activeFilter === '30days' ? 'active' : ''}`}
          onClick={() => { setActiveFilter('30days'); setShowCustomPopover(false); }}
        >
          Last 30 Days
        </button>

        <button
          className={`overview-filter-btn ${activeFilter === 'month' ? 'active' : ''}`}
          onClick={() => { setActiveFilter('month'); setShowCustomPopover(false); }}
        >
          This Month
        </button>

        <button
          className={`overview-filter-btn ${activeFilter === 'custom' ? 'active' : ''}`}
          onClick={() => setShowCustomPopover(!showCustomPopover)}
        >
          <Calendar size={13} />
          <span>Custom Range</span>
        </button>

        {/* Custom Date Range Popover */}
        {showCustomPopover && (
          <div className="overview-custom-date-popover">
            <div className="custom-date-input-group">
              <label>From</label>
              <input
                type="date"
                className="custom-date-field"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
              />
            </div>
            <div className="custom-date-input-group">
              <label>To</label>
              <input
                type="date"
                className="custom-date-field"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
              />
            </div>
            <button className="custom-date-apply-btn" onClick={handleApplyCustomDate}>
              APPLY
            </button>
            <button className="custom-date-cancel-btn" onClick={() => setShowCustomPopover(false)}>
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ── 3. Top 5 KPI Cards ──────────────────────────────────────────────── */}
      <div className="overview-kpi-grid">
        {/* Card 1: Total Revenue */}
        <div className="overview-kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon-box green">
              <IndianRupee size={18} />
            </div>
            <div className="kpi-header-text">
              <p className="kpi-label">TOTAL REVENUE</p>
              <h3 className="kpi-value">{formatCurrency(dashboardData.currentRevenue)}</h3>
            </div>
          </div>
          <div className="kpi-card-footer">
            <div className={`kpi-trend ${dashboardData.revTrend.dir}`}>
              {dashboardData.revTrend.dir === 'up' ? '↑' : dashboardData.revTrend.dir === 'down' ? '↓' : '•'}
              <span>{dashboardData.revTrend.val}%</span>
              <span className="kpi-period-label">vs previous {periodDays} days</span>
            </div>
            <MiniSparkline data={dashboardData.revenueSparkline} color="#22C55E" />
          </div>
        </div>

        {/* Card 2: Total Bookings */}
        <div className="overview-kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon-box blue">
              <Ticket size={18} />
            </div>
            <div className="kpi-header-text">
              <p className="kpi-label">TOTAL BOOKINGS</p>
              <h3 className="kpi-value">{dashboardData.currentBookings}</h3>
            </div>
          </div>
          <div className="kpi-card-footer">
            <div className={`kpi-trend ${dashboardData.bookTrend.dir}`}>
              {dashboardData.bookTrend.dir === 'up' ? '↑' : dashboardData.bookTrend.dir === 'down' ? '↓' : '•'}
              <span>{dashboardData.bookTrend.val}%</span>
              <span className="kpi-period-label">vs previous {periodDays} days</span>
            </div>
            <MiniSparkline data={dashboardData.bookingSparkline} color="#3B82F6" />
          </div>
        </div>

        {/* Card 3: Total Users */}
        <div className="overview-kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon-box purple">
              <Users size={18} />
            </div>
            <div className="kpi-header-text">
              <p className="kpi-label">TOTAL USERS</p>
              <h3 className="kpi-value">{dashboardData.currentUsers}</h3>
            </div>
          </div>
          <div className="kpi-card-footer">
            <div className={`kpi-trend ${dashboardData.userTrend.dir}`}>
              {dashboardData.userTrend.dir === 'up' ? '↑' : dashboardData.userTrend.dir === 'down' ? '↓' : '•'}
              <span>{dashboardData.userTrend.val}%</span>
              <span className="kpi-period-label">vs previous {periodDays} days</span>
            </div>
            <MiniSparkline data={dashboardData.userSparkline} color="#A855F7" />
          </div>
        </div>

        {/* Card 4: Pending Verification */}
        <div className="overview-kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon-box amber">
              <Clock size={18} />
            </div>
            <div className="kpi-header-text">
              <p className="kpi-label">PENDING VERIFICATION</p>
              <h3 className="kpi-value" style={{ color: '#F59E0B' }}>{dashboardData.pendingCount}</h3>
            </div>
          </div>
          <div className="kpi-card-footer">
            <button 
              className="kpi-action-link"
              onClick={() => onNavigateTab('bookings', { status: 'pending' })}
            >
              View Pending →
            </button>
          </div>
        </div>

        {/* Card 5: Verified Bookings */}
        <div className="overview-kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon-box emerald">
              <CheckCircle size={18} />
            </div>
            <div className="kpi-header-text">
              <p className="kpi-label">VERIFIED BOOKINGS</p>
              <h3 className="kpi-value" style={{ color: '#10B981' }}>{dashboardData.verifiedCount}</h3>
            </div>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-subtext">This period</span>
          </div>
        </div>
      </div>

      {/* ── 4. Middle Section: Business Performance & Booking Status ────────── */}
      <div className="overview-middle-grid">
        {/* Left: Business Performance Card */}
        <div className="overview-card">
          <div className="overview-card-header">
            <div className="card-title-group">
              <h3 className="overview-card-title">Business Performance</h3>
              <Info
                size={14}
                className="overview-info-icon"
                title={`Showing ${dashboardData.chartMeta?.effectiveGranularity ?? 'daily'} data. Revenue bars (left axis) and Booking line (right axis).`}
              />
            </div>

            <div className="chart-header-controls">
              <div className="chart-legend-inline">
                <div className="legend-item">
                  <span className="legend-square-yellow" />
                  <span>Revenue (₹)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-circle-blue" />
                  <span>Bookings</span>
                </div>
              </div>

              {/* View selector: Auto + manual overrides */}
              <div className="chart-view-selector">
                <span className="chart-view-label">View</span>
                <select
                  className="overview-select"
                  value={viewMode}
                  onChange={e => setViewMode(e.target.value)}
                  title="Chart grouping mode"
                >
                  <option value="auto">Auto</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active grouping indicator badge */}
          {viewMode === 'auto' && (
            <div className="chart-auto-badge">
              Auto • {dashboardData.chartMeta?.effectiveGranularity
                ? dashboardData.chartMeta.effectiveGranularity.charAt(0).toUpperCase() + dashboardData.chartMeta.effectiveGranularity.slice(1)
                : 'Daily'}
            </div>
          )}

          {/* Empty state */}
          {dashboardData.chartData.length === 0 || dashboardData.currentBookings === 0 && dashboardData.currentRevenue === 0 ? (
            <div className="chart-empty-state">
              <span style={{ fontSize: 28, opacity: 0.25 }}>📊</span>
              <p>No data for this period</p>
            </div>
          ) : (
            <div className="business-chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={dashboardData.chartData}
                  margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                >
                  <XAxis
                    dataKey="dateStr"
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
                    interval={dashboardData.chartMeta?.xTickInterval ?? 'auto'}
                    tick={{ fill: '#94A3B8', fontSize: 10 }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#64748B"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatShortCurrency}
                    domain={[0, dashboardData.chartMeta?.revenueYMax ?? 'auto']}
                    tick={{ fill: '#94A3B8' }}
                    width={46}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#64748B"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    domain={[0, dashboardData.chartMeta?.bookingsYMax ?? 'auto']}
                    tick={{ fill: '#94A3B8' }}
                    width={32}
                  />
                  <Tooltip
                    content={<CustomBusinessTooltip />}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                    wrapperStyle={{ zIndex: 10 }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="revenue"
                    fill="#FFD000"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={dashboardData.chartMeta?.effectiveGranularity === 'monthly' ? 40 : 24}
                    opacity={0.92}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="bookings"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    dot={
                      dashboardData.chartData.length <= 31
                        ? { r: 3, fill: '#3B82F6', stroke: '#0B0F19', strokeWidth: 1.5 }
                        : false
                    }
                    activeDot={{ r: 5, fill: '#60A5FA' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right: Booking Status Card */}
        <div className="overview-card">
          <div className="overview-card-header">
            <div className="card-title-group">
              <h3 className="overview-card-title">Booking Status</h3>
              <Info size={14} className="overview-info-icon" title="Distribution of bookings by fulfillment status" />
            </div>
          </div>

          <div className="booking-status-body">
            <div className="donut-layout">
              {/* Donut Chart with Center Text */}
              <div className="donut-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.renderedDonut}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {dashboardData.renderedDonut.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="donut-center-label">
                  <span className="donut-center-sub">Total Bookings</span>
                  <span className="donut-center-val">{dashboardData.totalDonutBookings}</span>
                </div>
              </div>

              {/* Status List & Percentages */}
              <div className="status-legend-list">
                <div className="status-legend-row">
                  <div className="status-name-with-dot">
                    <span className="status-dot" style={{ background: '#22C55E' }} />
                    <span>Verified</span>
                  </div>
                  <span className="status-count-pct">
                    {dashboardData.statusCounts.verified} ({dashboardData.getStatusPct(dashboardData.statusCounts.verified)})
                  </span>
                </div>

                <div className="status-legend-row">
                  <div className="status-name-with-dot">
                    <span className="status-dot" style={{ background: '#F97316' }} />
                    <span>Pending</span>
                  </div>
                  <span className="status-count-pct">
                    {dashboardData.statusCounts.pending} ({dashboardData.getStatusPct(dashboardData.statusCounts.pending)})
                  </span>
                </div>

                <div className="status-legend-row">
                  <div className="status-name-with-dot">
                    <span className="status-dot" style={{ background: '#3B82F6' }} />
                    <span>Confirmed</span>
                  </div>
                  <span className="status-count-pct">
                    {dashboardData.statusCounts.confirmed} ({dashboardData.getStatusPct(dashboardData.statusCounts.confirmed)})
                  </span>
                </div>

                <div className="status-legend-row">
                  <div className="status-name-with-dot">
                    <span className="status-dot" style={{ background: '#EF4444' }} />
                    <span>Cancelled</span>
                  </div>
                  <span className="status-count-pct">
                    {dashboardData.statusCounts.cancelled} ({dashboardData.getStatusPct(dashboardData.statusCounts.cancelled)})
                  </span>
                </div>
              </div>
            </div>

            {/* Conversion Rate Bottom Section */}
            <div className="conversion-rate-box">
              <p className="conversion-rate-title">Conversion Rate</p>
              <h4 className="conversion-rate-value">{dashboardData.conversionRate}%</h4>
              <p className="conversion-rate-sub">(Verified ÷ Total Bookings)</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Bottom Section: Top Performing Parks & Recent Bookings ───────── */}
      <div className="overview-bottom-grid">
        {/* Top Performing Parks Table Card */}
        <div className="overview-table-card">
          <div className="overview-card-header">
            <div className="card-title-group">
              <h3 className="overview-card-title">Top Performing Parks</h3>
              <Info size={14} className="overview-info-icon" title="Parks ranked by confirmed booking revenue" />
            </div>
          </div>

          <div className="overview-table-responsive">
            <table className="overview-table">
              <thead>
                <tr>
                  <th>PARK</th>
                  <th>REVENUE (₹)</th>
                  <th>BOOKINGS</th>
                  <th>AVG TICKET (₹)</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.sortedParks.map((park, idx) => {
                  const fillPct = dashboardData.maxParkRevenue > 0
                    ? Math.max(8, (park.revenue / dashboardData.maxParkRevenue) * 100)
                    : 0;

                  return (
                    <tr key={idx}>
                      <td>
                        <div className="park-name-cell">
                          {getParkIcon(park.name)}
                          <span>{park.name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="revenue-bar-cell">
                          <span>{formatCurrency(park.revenue)}</span>
                          <div className="revenue-bar-track">
                            <div className="revenue-bar-fill" style={{ width: `${fillPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>{park.bookings}</td>
                      <td>{formatCurrency(park.avgTicket)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="overview-card-footer">
            <button className="card-action-link" onClick={() => onNavigateTab('parks')}>
              View All Parks →
            </button>
          </div>
        </div>

        {/* Recent Bookings Table Card */}
        <div className="overview-table-card">
          <div className="overview-card-header">
            <div className="card-title-group">
              <h3 className="overview-card-title">Recent Bookings</h3>
              <Info size={14} className="overview-info-icon" title="Latest bookings submitted across all parks" />
            </div>

            <button className="card-action-link" onClick={() => onNavigateTab('bookings')}>
              View All →
            </button>
          </div>

          <div className="overview-table-responsive">
            {dashboardData.displayBookings.length === 0 ? (
              <div className="overview-empty-state">No bookings found for this period.</div>
            ) : (
              <table className="overview-table">
                <thead>
                  <tr>
                    <th>BOOKING ID</th>
                    <th>CUSTOMER</th>
                    <th>PARK</th>
                    <th>DATE</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.displayBookings.map((b) => (
                    <tr key={b.id}>
                      <td className="overview-booking-id">{b.bookingId}</td>
                      <td className="overview-customer-name">{b.customer}</td>
                      <td>{b.park}</td>
                      <td>{b.date}</td>
                      <td>{b.amount}</td>
                      <td>
                        <span className={`overview-status-pill ${getStatusBadgeClass(b.status)}`}>
                          {getStatusDisplayName(b.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
