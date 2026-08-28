import React, { useState, useMemo } from 'react';
import { 
  Wallet, Calendar, TrendingUp, Tag, Star, 
  Download, ArrowUpRight, ArrowDownRight,
  ChevronDown, ArrowUpDown, ChevronRight, X
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Bar, Line, 
  XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import * as XLSX from 'xlsx';
import './RevenueAnalytics.css';

// ── Helpers ───────────────────────────────────────────────────────────────
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

// ── Custom Tooltip for Dual-Axis Chart ──────────────────────────────────────
const CustomChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  
  const dataItem = payload[0]?.payload;
  if (!dataItem) return null;

  return (
    <div className="ra-custom-tooltip">
      <div className="ra-tooltip-date">{dataItem.fullDate || label}</div>
      <div className="ra-tooltip-row">
        <span className="ra-legend-dot-yellow" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2 }} />
        <span>Revenue: <strong>{formatCurrency(dataItem.revenue)}</strong></span>
      </div>
      <div className="ra-tooltip-row">
        <span className="ra-legend-dot-blue" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%' }} />
        <span>Bookings: <strong>{dataItem.bookings}</strong></span>
      </div>
      <div className="ra-tooltip-sub">
        Avg Booking: <strong>{formatCurrency(dataItem.avgBooking)}</strong>
      </div>
    </div>
  );
};

const RevenueAnalytics = ({ 
  bookings = [], 
  revenueEntries = [], 
  parks = [],
  loading = false,
  onRefresh
}) => {
  // ── Mobile detection ──────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Quick Filter State ──────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState('30days'); // 'today' | 'yesterday' | '7days' | '30days' | 'month' | 'custom'
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [appliedCustomRange, setAppliedCustomRange] = useState(null);
  const [timeframe, setTimeframe] = useState('daily'); // 'daily' | 'weekly'

  // Table sorting state
  const [sortField, setSortField] = useState('date');
  const [sortAsc, setSortAsc] = useState(false);

  // ── Calculate Date Range ────────────────────────────────────────────────
  const { startDate, endDate, periodDays, prevStartDate, prevEndDate, rangeLabel } = useMemo(() => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    if (activeFilter === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (activeFilter === 'yesterday') {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
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
      // Default: Last 30 Days
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Comparison period of equal duration immediately preceding
    const prevEnd = new Date(start);
    prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - (days - 1));
    prevStart.setHours(0, 0, 0, 0);

    const label = `${formatDateDisplay(start)} - ${formatDateDisplay(end)}`;

    return {
      startDate: start,
      endDate: end,
      periodDays: days,
      prevStartDate: prevStart,
      prevEndDate: prevEnd,
      rangeLabel: label
    };
  }, [activeFilter, appliedCustomRange]);

  // ── Unified Qualifying Data Filter & Calculation ─────────────────────────
  const analyticsData = useMemo(() => {
    // Determine qualifying bookings
    // Statuses 'cancelled' & 'rejected' are excluded.
    // 'verified', 'completed', 'ticketsent' are valid confirmed revenue.
    // 'pending' bookings are excluded from confirmed revenue to ensure absolute accuracy.
    const isQualifyingBooking = (b) => {
      const status = (b.status || '').toLowerCase();
      return ['verified', 'completed', 'ticketsent'].includes(status);
    };

    // Calculate metrics for any arbitrary date window [winStart, winEnd]
    const computeWindowMetrics = (winStart, winEnd) => {
      const qualifyingBookings = bookings.filter(b => {
        if (!isQualifyingBooking(b)) return false;
        const bDate = new Date(b.createdAt || b.date || b.verifiedAt);
        return bDate >= winStart && bDate <= winEnd;
      });

      const qualifyingManualEntries = revenueEntries.filter(r => {
        if (r.source !== 'manual') return false; // avoid double counting booking source entries
        const rDate = new Date(r.createdAt);
        return rDate >= winStart && rDate <= winEnd;
      });

      const netBookingRevenue = qualifyingBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const manualRevenue = qualifyingManualEntries.reduce((sum, r) => sum + (r.amount || 0), 0);
      const netRevenue = netBookingRevenue + manualRevenue;
      const totalBookings = qualifyingBookings.length;
      const totalDiscounts = qualifyingBookings.reduce((sum, b) => sum + (b.discountAmount || 0), 0);
      const grossRevenue = netRevenue + totalDiscounts;
      const avgBookingValue = totalBookings > 0 ? Math.round(netRevenue / totalBookings) : 0;

      return {
        netRevenue,
        grossRevenue,
        totalBookings,
        totalDiscounts,
        avgBookingValue,
        qualifyingBookings,
        qualifyingManualEntries
      };
    };

    // Current window metrics
    const current = computeWindowMetrics(startDate, endDate);

    // Previous window metrics for comparison
    const previous = computeWindowMetrics(prevStartDate, prevEndDate);

    // Percentage Changes
    const calcPct = (curr, prev) => {
      if (prev === 0) {
        return curr > 0 ? { val: 100, isNew: true, dir: 'up' } : { val: 0, dir: 'neutral' };
      }
      const pct = ((curr - prev) / prev) * 100;
      return {
        val: Math.abs(Number(pct.toFixed(1))),
        dir: pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral'
      };
    };

    const revenueTrend = calcPct(current.netRevenue, previous.netRevenue);
    const bookingsTrend = calcPct(current.totalBookings, previous.totalBookings);
    const avgBookingTrend = calcPct(current.avgBookingValue, previous.avgBookingValue);
    const discountsTrend = calcPct(current.totalDiscounts, previous.totalDiscounts);

    // ── Generate Daily Buckets across entire range ───────────────────────────
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
        bookings: 0,
        discounts: 0,
        avgBooking: 0
      });
      curIter.setDate(curIter.getDate() + 1);
    }

    // Populate daily map with qualifying bookings
    current.qualifyingBookings.forEach(b => {
      const bDate = new Date(b.createdAt || b.date || b.verifiedAt);
      const key = toISODate(bDate);
      if (dailyMap.has(key)) {
        const item = dailyMap.get(key);
        item.revenue += (b.totalAmount || 0);
        item.bookings += 1;
        item.discounts += (b.discountAmount || 0);
      }
    });

    // Populate daily map with manual entries
    current.qualifyingManualEntries.forEach(r => {
      const rDate = new Date(r.createdAt);
      const key = toISODate(rDate);
      if (dailyMap.has(key)) {
        const item = dailyMap.get(key);
        item.revenue += (r.amount || 0);
      }
    });

    // Compute average booking for each day
    const dailyData = Array.from(dailyMap.values()).map(item => ({
      ...item,
      avgBooking: item.bookings > 0 ? Math.round(item.revenue / item.bookings) : 0
    }));

    // ── Revenue by Park Aggregation ─────────────────────────────────────────
    // Exactly the 5 canonical parks required
    const CANONICAL_PARKS = [
      'Wonderla',
      'Black Thunder',
      'MGM Dizzee World',
      'Queens Land',
      'VGP Universal Kingdom'
    ];

    // Build a map seeded with all 5 canonical parks at ₹0
    const parkMap = new Map();
    CANONICAL_PARKS.forEach(name => {
      parkMap.set(name.toLowerCase(), { name, revenue: 0, bookings: 0 });
    });

    // Also seed from DB parks (in case names differ slightly)
    parks.forEach(p => {
      const name = (p.name || '').trim();
      if (name) {
        const key = name.toLowerCase();
        if (!parkMap.has(key)) {
          parkMap.set(key, { name, revenue: 0, bookings: 0 });
        }
      }
    });

    current.qualifyingBookings.forEach(b => {
      const pName = (b.parkName || '').trim();
      const pKey = pName.toLowerCase();
      if (parkMap.has(pKey)) {
        const parkItem = parkMap.get(pKey);
        parkItem.revenue += (b.totalAmount || 0);
        parkItem.bookings += 1;
      } else if (pName) {
        // Unknown park — still track in allParks breakdown
        parkMap.set(pKey, { name: pName, revenue: b.totalAmount || 0, bookings: 1 });
      }
    });

    // If manual entries have a park name, credit them
    current.qualifyingManualEntries.forEach(r => {
      if (r.parkName) {
        const pName = r.parkName.trim();
        const pKey = pName.toLowerCase();
        if (parkMap.has(pKey)) {
          parkMap.get(pKey).revenue += (r.amount || 0);
        } else {
          parkMap.set(pKey, { name: pName, revenue: r.amount || 0, bookings: 0 });
        }
      }
    });

    // Sort ALL parks by revenue desc → bookings desc → alphabetical
    const allParks = Array.from(parkMap.values())
      .sort((a, b) => {
        if (b.revenue !== a.revenue) return b.revenue - a.revenue;
        if (b.bookings !== a.bookings) return b.bookings - a.bookings;
        return a.name.localeCompare(b.name);
      });

    // Exactly the 5 canonical parks displayed in the card, ordered by revenue desc -> bookings desc -> canonical index
    const displayedParks = CANONICAL_PARKS.map(cName => {
      const item = parkMap.get(cName.toLowerCase());
      return item ? { ...item, name: cName } : { name: cName, revenue: 0, bookings: 0 };
    }).sort((a, b) => {
      if (b.revenue !== a.revenue) return b.revenue - a.revenue;
      if (b.bookings !== a.bookings) return b.bookings - a.bookings;
      return CANONICAL_PARKS.indexOf(a.name) - CANONICAL_PARKS.indexOf(b.name);
    });

    // Top Performing Park
    const topPark = displayedParks.length > 0
      ? displayedParks[0]
      : (allParks.length > 0 ? allParks[0] : { name: 'None', revenue: 0, bookings: 0 });

    // Max park revenue for scaling the horizontal bars (use only canonical 5)
    const maxParkRevenue = displayedParks.reduce((max, p) => Math.max(max, p.revenue), 0) || 1;

    return {
      current,
      previous,
      revenueTrend,
      bookingsTrend,
      avgBookingTrend,
      discountsTrend,
      dailyData,
      allParks,
      displayedParks,
      topPark,
      maxParkRevenue
    };
  }, [bookings, revenueEntries, parks, startDate, endDate, prevStartDate, prevEndDate]);

  // ── Chart Display Data (Daily vs Weekly) ──────────────────────────────────
  const chartDisplayData = useMemo(() => {
    if (timeframe === 'weekly') {
      const weeklyData = [];
      const chunk = 7;
      for (let i = 0; i < analyticsData.dailyData.length; i += chunk) {
        const slice = analyticsData.dailyData.slice(i, i + chunk);
        const rev = slice.reduce((sum, d) => sum + d.revenue, 0);
        const bks = slice.reduce((sum, d) => sum + d.bookings, 0);
        const startStr = slice[0].dateStr;
        const endStr = slice[slice.length - 1].dateStr;
        weeklyData.push({
          dateStr: `${startStr}-${endStr}`,
          fullDate: `${slice[0].fullDate} - ${slice[slice.length - 1].fullDate}`,
          revenue: rev,
          bookings: bks,
          avgBooking: bks > 0 ? Math.round(rev / bks) : 0
        });
      }
      return weeklyData.length > 0 ? weeklyData : analyticsData.dailyData;
    }
    return analyticsData.dailyData;
  }, [analyticsData.dailyData, timeframe]);

  // ── Left Revenue Y-Axis Scale (Fixed 0 to ₹10k in ₹2k steps, dynamic if >10k) ──
  const { revenueMax, revenueTicks } = useMemo(() => {
    const maxVal = Math.max(...chartDisplayData.map(d => d.revenue || 0), 0);
    if (maxVal <= 10000) {
      return {
        revenueMax: 10000,
        revenueTicks: [0, 2000, 4000, 6000, 8000, 10000]
      };
    }
    // Dynamic calculation exceeding 10,000 with 5 clean intervals
    const roughStep = maxVal / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalized = roughStep / magnitude;
    let stepMultiplier;
    if (normalized <= 1) stepMultiplier = 1;
    else if (normalized <= 2) stepMultiplier = 2;
    else if (normalized <= 2.5) stepMultiplier = 2.5;
    else if (normalized <= 5) stepMultiplier = 5;
    else stepMultiplier = 10;
    
    const step = stepMultiplier * magnitude;
    const top = step * 5;
    const ticks = [0, step, step * 2, step * 3, step * 4, top];
    return {
      revenueMax: top,
      revenueTicks: ticks
    };
  }, [chartDisplayData]);

  // ── Right Booking Y-Axis Scale (0 to 5 or dynamic integer steps matching grid) ──
  const { bookingMax, bookingTicks } = useMemo(() => {
    const maxVal = Math.max(...chartDisplayData.map(d => d.bookings || 0), 0);
    const top = maxVal <= 4 ? 5 : (Math.ceil(maxVal / 5) * 5 || 5);
    const step = top / 5;
    const ticks = [0, step, step * 2, step * 3, step * 4, top];
    return {
      bookingMax: top,
      bookingTicks: ticks
    };
  }, [chartDisplayData]);

  // ── Sorted Daily Summary Table Data ──────────────────────────────────────
  const sortedDailyData = useMemo(() => {
    const list = [...analyticsData.dailyData];
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (sortField === 'date') {
        valA = a.rawDate.getTime();
        valB = b.rawDate.getTime();
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [analyticsData.dailyData, sortField, sortAsc]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // Default descending for new field
    }
  };

  // ── Quick Filter Click Handler ──────────────────────────────────────────
  const handleQuickFilterClick = (filterKey) => {
    setActiveFilter(filterKey);
    if (filterKey !== 'custom') {
      setAppliedCustomRange(null);
    }
  };

  const handleApplyCustomFilter = () => {
    if (!customFrom && !customTo) {
      alert('Please select at least a From or To date.');
      return;
    }
    if (customFrom && customTo && new Date(customFrom) > new Date(customTo)) {
      alert("Validation Error: 'From' date cannot be after 'To' date.");
      return;
    }
    setActiveFilter('custom');
    setAppliedCustomRange({ from: customFrom, to: customTo });
  };

  const handleResetFilter = () => {
    setActiveFilter('30days');
    setCustomFrom('');
    setCustomTo('');
    setAppliedCustomRange(null);
  };

  // ── Excel Export System ──────────────────────────────────────────────────
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Daily Revenue Summary
    const dailyRows = analyticsData.dailyData.map(d => ({
      'Date': d.fullDate,
      'Net Revenue (₹)': d.revenue,
      'Bookings Count': d.bookings,
      'Average Booking (₹)': d.avgBooking,
      'Discounts (₹)': d.discounts
    }));
    const wsDaily = XLSX.utils.json_to_sheet(dailyRows);
    XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily Summary');

    // Sheet 2: Revenue by Park
    const parkRows = analyticsData.allParks.map(p => ({
      'Park Name': p.name,
      'Net Revenue (₹)': p.revenue,
      'Bookings Count': p.bookings,
      'Average per Booking (₹)': p.bookings > 0 ? Math.round(p.revenue / p.bookings) : 0
    }));
    const wsParks = XLSX.utils.json_to_sheet(parkRows);
    XLSX.utils.book_append_sheet(wb, wsParks, 'Revenue by Park');

    // Sheet 3: KPI Overview
    const kpiRows = [
      { 'Metric': 'Date Range', 'Value': rangeLabel },
      { 'Metric': 'Net Revenue (₹)', 'Value': analyticsData.current.netRevenue },
      { 'Metric': 'Gross Revenue (₹)', 'Value': analyticsData.current.grossRevenue },
      { 'Metric': 'Total Bookings', 'Value': analyticsData.current.totalBookings },
      { 'Metric': 'Average Booking Value (₹)', 'Value': analyticsData.current.avgBookingValue },
      { 'Metric': 'Total Discounts (₹)', 'Value': analyticsData.current.totalDiscounts },
      { 'Metric': 'Top Performing Park', 'Value': `${analyticsData.topPark.name} (${formatCurrency(analyticsData.topPark.revenue)} - ${analyticsData.topPark.bookings} bookings)` }
    ];
    const wsKPI = XLSX.utils.json_to_sheet(kpiRows);
    XLSX.utils.book_append_sheet(wb, wsKPI, 'Overview KPIs');

    const fileName = `SPAR_Revenue_Report_${toISODate(startDate)}_to_${toISODate(endDate)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="revenue-analytics-page">
      {/* ── 1. Top Header ───────────────────────────────────────────────── */}
      <div className="ra-header">
        <div className="ra-header-left">
          <div className="ra-admin-breadcrumb">
            🎡 ADMIN PANEL / <span className="highlight-text-lime">OPERATIONS CENTER</span>
          </div>
          <h1>Revenue Analytics</h1>
          <p>Track your revenue performance and insights</p>
        </div>
        <button className="ra-download-report-btn" onClick={handleExportExcel} title="Export full report to Excel">
          <Download size={15} />
          <span>Download Report</span>
        </button>
      </div>

      {/* ── 2. Filter Controls ─────────────────────────────────────────── */}
      <div className="ra-filters-row">
        {/* Quick Filter Pills */}
        <div className="ra-quick-filters">
          <button 
            className={`ra-pill-btn ${activeFilter === 'today' ? 'active' : ''}`}
            onClick={() => handleQuickFilterClick('today')}
          >
            Today
          </button>
          <button 
            className={`ra-pill-btn ${activeFilter === 'yesterday' ? 'active' : ''}`}
            onClick={() => handleQuickFilterClick('yesterday')}
          >
            Yesterday
          </button>
          <button 
            className={`ra-pill-btn ${activeFilter === '7days' ? 'active' : ''}`}
            onClick={() => handleQuickFilterClick('7days')}
          >
            Last 7 Days
          </button>
          <button 
            className={`ra-pill-btn ${activeFilter === '30days' ? 'active' : ''}`}
            onClick={() => handleQuickFilterClick('30days')}
          >
            Last 30 Days
          </button>
          <button 
            className={`ra-pill-btn ${activeFilter === 'month' ? 'active' : ''}`}
            onClick={() => handleQuickFilterClick('month')}
          >
            This Month
          </button>
          <button 
            className={`ra-pill-btn ${activeFilter === 'custom' ? 'active' : ''}`}
            onClick={() => handleQuickFilterClick('custom')}
          >
            <Calendar size={13} />
            <span>Custom Range</span>
          </button>
        </div>

        {/* Date Selection Box, Apply & Reset */}
        <div className="ra-date-controls">
          {activeFilter === 'custom' ? (
            <div className="ra-custom-inputs">
              <input 
                type="date" 
                className="ra-date-input"
                value={customFrom} 
                onChange={(e) => setCustomFrom(e.target.value)} 
                placeholder="From Date"
              />
              <span style={{ color: '#64748B', fontSize: 12 }}>to</span>
              <input 
                type="date" 
                className="ra-date-input"
                value={customTo} 
                onChange={(e) => setCustomTo(e.target.value)} 
                placeholder="To Date"
              />
              <button className="ra-apply-btn" onClick={handleApplyCustomFilter}>
                Apply Filter
              </button>
            </div>
          ) : (
            <>
              <div className="ra-date-range-badge">
                <Calendar size={13} style={{ color: '#94A3B8' }} />
                <span>{rangeLabel}</span>
              </div>
              <button className="ra-apply-btn" onClick={() => handleQuickFilterClick(activeFilter)}>
                Apply Filter
              </button>
            </>
          )}

          <button className="ra-reset-btn" onClick={handleResetFilter}>
            Reset
          </button>
        </div>
      </div>

      {/* ── 3. Five Professional KPI Cards ──────────────────────────────── */}
      <div className="ra-kpi-grid">
        {/* Card 1: NET REVENUE */}
        <div className="ra-kpi-card">
          <div className="ra-kpi-top">
            <div className="ra-kpi-label-wrap">
              <span className="ra-kpi-label">NET REVENUE</span>
            </div>
            <div className="ra-kpi-icon-box ra-icon-yellow">
              <Wallet size={18} />
            </div>
          </div>
          <h2 className="ra-kpi-value ra-val-yellow">{formatCurrency(analyticsData.current.netRevenue)}</h2>
          <div className="ra-kpi-bottom">
            <span className={`ra-trend-badge ${analyticsData.revenueTrend.dir === 'up' ? 'ra-trend-up' : analyticsData.revenueTrend.dir === 'down' ? 'ra-trend-down' : 'ra-trend-neutral'}`}>
              {analyticsData.revenueTrend.dir === 'up' && <ArrowUpRight size={14} />}
              {analyticsData.revenueTrend.dir === 'down' && <ArrowDownRight size={14} />}
              {analyticsData.revenueTrend.isNew ? 'New' : `${analyticsData.revenueTrend.val}%`}
            </span>
            <span className="ra-trend-period">vs previous {periodDays} days</span>
          </div>
        </div>

        {/* Card 2: TOTAL BOOKINGS */}
        <div className="ra-kpi-card">
          <div className="ra-kpi-top">
            <div className="ra-kpi-label-wrap">
              <span className="ra-kpi-label">TOTAL BOOKINGS</span>
            </div>
            <div className="ra-kpi-icon-box ra-icon-blue">
              <Calendar size={18} />
            </div>
          </div>
          <h2 className="ra-kpi-value ra-val-blue">{analyticsData.current.totalBookings}</h2>
          <div className="ra-kpi-bottom">
            <span className={`ra-trend-badge ${analyticsData.bookingsTrend.dir === 'up' ? 'ra-trend-up' : analyticsData.bookingsTrend.dir === 'down' ? 'ra-trend-down' : 'ra-trend-neutral'}`}>
              {analyticsData.bookingsTrend.dir === 'up' && <ArrowUpRight size={14} />}
              {analyticsData.bookingsTrend.dir === 'down' && <ArrowDownRight size={14} />}
              {analyticsData.bookingsTrend.isNew ? 'New' : `${analyticsData.bookingsTrend.val}%`}
            </span>
            <span className="ra-trend-period">vs previous {periodDays} days</span>
          </div>
        </div>

        {/* Card 3: AVG BOOKING VALUE */}
        <div className="ra-kpi-card">
          <div className="ra-kpi-top">
            <div className="ra-kpi-label-wrap">
              <span className="ra-kpi-label">AVG BOOKING VALUE</span>
            </div>
            <div className="ra-kpi-icon-box ra-icon-purple">
              <TrendingUp size={18} />
            </div>
          </div>
          <h2 className="ra-kpi-value ra-val-purple">{formatCurrency(analyticsData.current.avgBookingValue)}</h2>
          <div className="ra-kpi-bottom">
            <span className={`ra-trend-badge ${analyticsData.avgBookingTrend.dir === 'up' ? 'ra-trend-up' : analyticsData.avgBookingTrend.dir === 'down' ? 'ra-trend-down' : 'ra-trend-neutral'}`}>
              {analyticsData.avgBookingTrend.dir === 'up' && <ArrowUpRight size={14} />}
              {analyticsData.avgBookingTrend.dir === 'down' && <ArrowDownRight size={14} />}
              {analyticsData.avgBookingTrend.isNew ? 'New' : `${analyticsData.avgBookingTrend.val}%`}
            </span>
            <span className="ra-trend-period">vs previous {periodDays} days</span>
          </div>
        </div>

        {/* Card 4: TOTAL DISCOUNTS */}
        <div className="ra-kpi-card">
          <div className="ra-kpi-top">
            <div className="ra-kpi-label-wrap">
              <span className="ra-kpi-label">TOTAL DISCOUNTS</span>
            </div>
            <div className="ra-kpi-icon-box ra-icon-green">
              <Tag size={18} />
            </div>
          </div>
          <h2 className="ra-kpi-value ra-val-green">{formatCurrency(analyticsData.current.totalDiscounts)}</h2>
          <div className="ra-kpi-bottom">
            <span className={`ra-trend-badge ${analyticsData.discountsTrend.dir === 'up' ? 'ra-trend-up' : analyticsData.discountsTrend.dir === 'down' ? 'ra-trend-down' : 'ra-trend-neutral'}`}>
              {analyticsData.discountsTrend.dir === 'up' && <ArrowUpRight size={14} />}
              {analyticsData.discountsTrend.dir === 'down' && <ArrowDownRight size={14} />}
              {analyticsData.discountsTrend.isNew ? 'New' : `${analyticsData.discountsTrend.val}%`}
            </span>
            <span className="ra-trend-period">vs previous {periodDays} days</span>
          </div>
        </div>

        {/* Card 5: TOP PERFORMING PARK */}
        <div className="ra-kpi-card">
          <div className="ra-kpi-top">
            <div className="ra-kpi-label-wrap">
              <span className="ra-kpi-label">TOP PERFORMING PARK</span>
            </div>
            <div className="ra-kpi-icon-box ra-icon-gold">
              <Star size={18} />
            </div>
          </div>
          <h2 className="ra-kpi-value ra-val-gold" style={{ fontSize: analyticsData.topPark.name.length > 14 ? '18px' : '22px', textTransform: 'uppercase' }}>
            {analyticsData.topPark.name}
          </h2>
          <div className="ra-kpi-bottom">
            <span className="ra-top-park-sub">
              {formatCurrency(analyticsData.topPark.revenue)} ({analyticsData.topPark.bookings} bookings)
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. Charts Row (58% / 42%) ────────────────────────────────────── */}
      <div className="ra-charts-row">
        {/* Left Chart: Revenue Over Time */}
        <div className="ra-chart-card">
          <div>
            <div className="ra-card-header">
              <div className="ra-card-title-wrap">
                <h3 className="ra-card-title">REVENUE OVER TIME</h3>
                <span className="ra-info-icon" title="Daily revenue and booking breakdown">ⓘ</span>
              </div>
              <select 
                className="ra-timeframe-select" 
                value={timeframe} 
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            {/* Horizontal Legend Line */}
            <div className="ra-legend-row">
              <div className="ra-legend-item">
                <span className="ra-legend-dot-yellow" />
                <span>Revenue (₹)</span>
              </div>
              <div className="ra-legend-item">
                <span className="ra-legend-dot-blue" />
                <span>Bookings</span>
              </div>
            </div>

            <div className="ra-chart-container">
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 230}>
                <ComposedChart data={chartDisplayData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis 
                    dataKey="dateStr" 
                    stroke="rgba(255,255,255,0.1)" 
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    tickLine={false}
                    interval={isMobile ? Math.max(1, Math.ceil(chartDisplayData.length / 5) - 1) : Math.max(0, Math.ceil(chartDisplayData.length / 10) - 1)}
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="transparent" 
                    tick={{ fill: '#64748B', fontSize: 10 }} 
                    tickFormatter={formatShortCurrency}
                    domain={[0, revenueMax]}
                    ticks={revenueTicks}
                    interval={0}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="transparent" 
                    tick={{ fill: '#64748B', fontSize: 10 }} 
                    allowDecimals={false}
                    domain={[0, bookingMax]}
                    ticks={bookingTicks}
                    interval={0}
                  />
                  <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar 
                    yAxisId="left" 
                    dataKey="revenue" 
                    fill="#C7FF00" 
                    radius={[3, 3, 0, 0]} 
                    maxBarSize={22}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="bookings" 
                    stroke="#38BDF8" 
                    strokeWidth={2.5} 
                    dot={{ r: 3, fill: '#38BDF8', stroke: '#0f131f', strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: '#38BDF8', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Card Summary */}
          <div className="ra-chart-bottom-summary">
            <div className="ra-summary-item">
              <p>Total Revenue</p>
              <h4>{formatCurrency(analyticsData.current.netRevenue)}</h4>
            </div>
            <div className="ra-summary-item">
              <p>Total Bookings</p>
              <h4>{analyticsData.current.totalBookings}</h4>
            </div>
          </div>
        </div>

        {/* Right Chart: Revenue by Park */}
        <div className="ra-chart-card ra-park-chart-card">
          <div className="ra-park-card-inner">
            <div className="ra-card-header">
              <div className="ra-card-title-wrap">
                <h3 className="ra-card-title">REVENUE BY PARK</h3>
              </div>
              <div className="ra-legend-row" style={{ margin: 0 }}>
                <div className="ra-legend-item">
                  <span className="ra-legend-dot-yellow" />
                  <span>Revenue (₹)</span>
                </div>
              </div>
            </div>

            {/* Column Header Row */}
            <div className="ra-hbc-header">
              <span className="ra-hbc-col-park">PARK</span>
              <span className="ra-hbc-col-bar">REVENUE VISUAL</span>
              <span className="ra-hbc-col-rev">REVENUE (₹)</span>
              <span className="ra-hbc-col-bk">BOOKINGS</span>
            </div>

            {/* Park Rows + Bars (Exactly the 5 Canonical Parks) */}
            <div className="ra-hbc-chart-area">
              {analyticsData.displayedParks.map((p, idx) => {
                const maxRev = analyticsData.maxParkRevenue;
                const barPct = maxRev > 0 && p.revenue > 0 ? Math.min(100, Math.max(4, (p.revenue / maxRev) * 100)) : 0;
                return (
                  <div className="ra-hbc-row" key={p.name || idx}>
                    <span className="ra-hbc-park-name" title={p.name}>{p.name}</span>
                    <div className="ra-hbc-bar-zone">
                      {barPct > 0 ? (
                        <div
                          className="ra-hbc-bar"
                          style={{ width: `${barPct}%` }}
                        />
                      ) : (
                        <div className="ra-hbc-bar-zero" />
                      )}
                    </div>
                    <span className="ra-hbc-rev-val">{formatCurrency(p.revenue)}</span>
                    <span className="ra-hbc-bk-val">{p.bookings}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Daily Revenue Summary Table ───────────────────────────────── */}
      <div className="ra-table-card">
        <div className="ra-table-header-row">
          <div className="ra-card-title-wrap">
            <h3 className="ra-card-title">Daily Revenue Summary</h3>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="ra-table-wrapper desktop-only-table">
          <table className="ra-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('date')}>
                  DATE {sortField === 'date' ? (sortAsc ? '↑' : '↓') : '⇅'}
                </th>
                <th onClick={() => handleSort('revenue')} style={{ textAlign: 'right' }}>
                  REVENUE (₹) {sortField === 'revenue' ? (sortAsc ? '↑' : '↓') : '⇅'}
                </th>
                <th onClick={() => handleSort('bookings')} style={{ textAlign: 'center' }}>
                  BOOKINGS {sortField === 'bookings' ? (sortAsc ? '↑' : '↓') : '⇅'}
                </th>
                <th onClick={() => handleSort('avgBooking')} style={{ textAlign: 'right' }}>
                  AVG BOOKING (₹) {sortField === 'avgBooking' ? (sortAsc ? '↑' : '↓') : '⇅'}
                </th>
                <th onClick={() => handleSort('discounts')} style={{ textAlign: 'right' }}>
                  DISCOUNTS (₹) {sortField === 'discounts' ? (sortAsc ? '↑' : '↓') : '⇅'}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDailyData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="ra-empty-state">
                    No records found for the selected period.
                  </td>
                </tr>
              ) : (
                sortedDailyData.map((d, i) => (
                  <tr key={i}>
                    <td className="ra-td-date">{d.fullDate}</td>
                    <td className="ra-td-revenue" style={{ textAlign: 'right' }}>{formatCurrency(d.revenue)}</td>
                    <td style={{ textAlign: 'center', color: d.bookings > 0 ? '#FFFFFF' : '#64748B' }}>{d.bookings}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(d.avgBooking)}</td>
                    <td className="ra-td-discounts" style={{ textAlign: 'right' }}>{formatCurrency(d.discounts)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Daily Cards */}
        <div className="mobile-only-card-list ra-mobile-daily-list">
          {sortedDailyData.length === 0 ? (
            <div className="ra-empty-state">No records found for the selected period.</div>
          ) : (
            sortedDailyData.map((d, i) => (
              <div key={i} className="ra-mobile-daily-card">
                <div className="ra-mobile-daily-top">
                  <span className="ra-mobile-daily-date">{d.fullDate}</span>
                  <span className="ra-mobile-daily-rev">{formatCurrency(d.revenue)}</span>
                </div>
                <div className="ra-mobile-daily-stats">
                  <span>Bookings: <strong>{d.bookings}</strong></span>
                  <span>Avg: <strong>{formatCurrency(d.avgBooking)}</strong></span>
                  {d.discounts > 0 && <span style={{ color: '#F87171' }}>Disc: -{formatCurrency(d.discounts)}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalytics;
