/**
 * Server-Side Coupon & Date Utility
 * Ensures consistent date parsing, standard DD.MM.YYYY formatting,
 * unlimited and daily usage limit validation, and robust dynamic coupon status calculation.
 */

/**
 * Format a Date to numeric "DD.MM.YYYY" (e.g. "02.06.2026")
 * @param {string|Date} dateInput
 * @returns {string} e.g. "02.06.2026"
 */
const formatCouponDate = (dateInput) => {
  if (!dateInput) return 'N/A';

  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    const [yearStr, monthStr, dayStr] = dateInput.trim().split('-');
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const formattedDay = day < 10 ? `0${day}` : `${day}`;
    const formattedMonth = month < 10 ? `0${month}` : `${month}`;
    return `${formattedDay}.${formattedMonth}.${yearStr}`;
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Invalid Date';

  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const formattedDay = day < 10 ? `0${day}` : `${day}`;
  const formattedMonth = month < 10 ? `0${month}` : `${month}`;

  return `${formattedDay}.${formattedMonth}.${year}`;
};

const formatCouponDateNumeric = formatCouponDate;

/**
 * Returns current calendar date formatted as YYYY-MM-DD
 */
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Normalizes input date into end-of-day Date instance (23:59:59.999)
 * for fair coupon expiration across all time zones.
 */
const parseEndOfDayExpiry = (dateInput) => {
  if (!dateInput) return new Date(0);

  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    const [yearStr, monthStr, dayStr] = dateInput.trim().split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);
    return new Date(Date.UTC(year, monthIndex, day, 23, 59, 59, 999));
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return new Date(0);

  // Extend to end of day if midnight or not specified
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
    d.setUTCHours(23, 59, 59, 999);
  }
  return d;
};

/**
 * Calculate dynamic status for a coupon document/object
 * Priority:
 * 1. INACTIVE: Manually disabled (isActive === false)
 * 2. EXPIRED: Current time > expiry date
 * 3. EXHAUSTED: Total limit reached (unless unlimited) OR daily limit reached for today (unless unlimited)
 * 4. ACTIVE: Usable
 */
const computeCouponStatus = (coupon) => {
  if (!coupon) return { status: 'INACTIVE', label: 'Inactive', isUsable: false };

  // 1. Manually disabled
  if (coupon.isActive === false) {
    return { status: 'INACTIVE', label: 'Inactive', isUsable: false };
  }

  // 2. Expiry date
  if (coupon.expiryDate) {
    const expiry = parseEndOfDayExpiry(coupon.expiryDate);
    const now = new Date();
    if (now.getTime() > expiry.getTime()) {
      return { status: 'EXPIRED', label: 'Expired', isUsable: false };
    }
  }

  // 3. Total usage limit
  const isUnlimitedTotal = coupon.isUnlimitedTotal === true;
  const totalCount = Number(coupon.totalUsageCount ?? coupon.usedCount ?? 0);
  const totalLimit = coupon.totalUsageLimit !== null && coupon.totalUsageLimit !== undefined 
    ? Number(coupon.totalUsageLimit) 
    : (coupon.usageLimit !== undefined ? Number(coupon.usageLimit) : null);

  if (!isUnlimitedTotal && totalLimit !== null && totalLimit > 0 && totalCount >= totalLimit) {
    return { status: 'EXHAUSTED', label: 'Usage Limit Reached', isUsable: false };
  }

  // 4. Daily usage limit
  const isUnlimitedDaily = coupon.isUnlimitedDaily !== false; // Default is unlimited unless explicitly false
  if (!isUnlimitedDaily && coupon.dailyUsageLimit !== null && coupon.dailyUsageLimit !== undefined) {
    const dailyLimit = Number(coupon.dailyUsageLimit);
    const todayStr = getTodayDateString();
    const currentDailyCount = coupon.dailyUsageDate === todayStr ? Number(coupon.dailyUsageCount || 0) : 0;
    if (dailyLimit > 0 && currentDailyCount >= dailyLimit) {
      return { status: 'EXHAUSTED', label: 'Usage Limit Reached', isUsable: false };
    }
  }

  // 5. Active
  return { status: 'ACTIVE', label: 'Active', isUsable: true };
};

/**
 * Standard list of branches for canonical amusement parks
 */
const STANDARD_PARK_BRANCHES = {
  wonderla: [
    { id: 'bengaluru', name: 'Bengaluru', desc: 'Mysore Road' },
    { id: 'kochi', name: 'Kochi', desc: 'Pallikkara' },
    { id: 'hyderabad', name: 'Hyderabad', desc: 'Raviryal' },
    { id: 'bhubaneswar', name: 'Bhubaneswar', desc: '28 km from city' },
    { id: 'chennai', name: 'Chennai', desc: 'OMR / Thiruporur' }
  ],
  blackthunder: [
    { id: 'mettupalayam', name: 'Mettupalayam (Main Park)', desc: 'Coimbatore Foothills' }
  ],
  mgm: [
    { id: 'ecr-chennai', name: 'MGM Dizzee World (ECR Chennai)', desc: 'East Coast Road, Muttukadu' }
  ],
  queensland: [
    { id: 'poonamallee', name: 'Queens Land (Poonamallee)', desc: 'Bangalore Trunk Road, Chennai' }
  ],
  vgp: [
    { id: 'ecr-injambakkam', name: 'VGP Universal Kingdom (ECR)', desc: 'Injambakkam, Chennai' }
  ]
};

const getParkBranches = (parkOrName) => {
  if (!parkOrName) return [{ id: 'all', name: 'All Branches' }];
  
  if (typeof parkOrName === 'object' && Array.isArray(parkOrName.branches) && parkOrName.branches.length > 0) {
    return parkOrName.branches;
  }

  const name = (typeof parkOrName === 'string' ? parkOrName : (parkOrName.name || '')).toLowerCase();

  if (name.includes('wonderla')) return STANDARD_PARK_BRANCHES.wonderla;
  if (name.includes('black thunder') || name.includes('blackthunder')) return STANDARD_PARK_BRANCHES.blackthunder;
  if (name.includes('mgm') || name.includes('dizzee')) return STANDARD_PARK_BRANCHES.mgm;
  if (name.includes('queen') || name.includes('queensland')) return STANDARD_PARK_BRANCHES.queensland;
  if (name.includes('vgp')) return STANDARD_PARK_BRANCHES.vgp;

  const loc = typeof parkOrName === 'object' ? (parkOrName.location || parkOrName.name || 'Main Branch') : parkOrName;
  return [{ id: 'main', name: loc, desc: '' }];
};

module.exports = {
  formatCouponDate,
  formatCouponDateNumeric,
  getTodayDateString,
  parseEndOfDayExpiry,
  computeCouponStatus,
  STANDARD_PARK_BRANCHES,
  getParkBranches
};

