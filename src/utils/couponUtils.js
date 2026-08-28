/**
 * Universal Coupon & Date Utility
 * Ensures consistent DD.MM.YYYY date formatting,
 * unlimited and daily usage limit evaluation, and dynamic coupon status calculation across the application.
 */

/**
 * Format a Date or date string to strict "DD.MM.YYYY" (e.g. "02.06.2026")
 * @param {string|Date} dateInput 
 * @returns {string} e.g. "02.06.2026"
 */
export const formatCouponDate = (dateInput) => {
  if (!dateInput) return 'N/A';

  // If it's a "YYYY-MM-DD" string, parse components directly to prevent timezone shift
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

export const formatCouponDateNumeric = formatCouponDate;

/**
 * Returns current calendar date string as YYYY-MM-DD in local time
 */
export const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parses any date input to end-of-day Date instance for fair expiry comparisons.
 * A coupon expiring on 2026-06-02 remains valid through 23:59:59.999 of June 2, 2026.
 * @param {string|Date} dateInput 
 * @returns {Date}
 */
export const getEndOfDayExpiry = (dateInput) => {
  if (!dateInput) return new Date(0);

  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    const [yearStr, monthStr, dayStr] = dateInput.trim().split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);
    return new Date(year, monthIndex, day, 23, 59, 59, 999);
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return new Date(0);

  // If time is midnight 00:00:00, extend to end of that calendar day
  if (d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0) {
    d.setHours(23, 59, 59, 999);
  }
  return d;
};

/**
 * Dynamically computes the coupon status following strict priority:
 * 1. Manually disabled -> INACTIVE
 * 2. Past expiry date  -> EXPIRED
 * 3. Total or daily usage limit reached -> EXHAUSTED / LIMIT REACHED
 * 4. Otherwise         -> ACTIVE
 * 
 * @param {Object} coupon
 * @returns {{ status: 'ACTIVE'|'EXPIRED'|'EXHAUSTED'|'INACTIVE', label: string, color: string, bg: string, border: string, isUsable: boolean }}
 */
export const getCouponStatus = (coupon) => {
  if (!coupon) {
    return {
      status: 'INACTIVE',
      label: 'Inactive',
      color: '#9CA3AF',
      bg: 'rgba(156, 163, 175, 0.15)',
      border: 'rgba(156, 163, 175, 0.35)',
      isUsable: false
    };
  }

  // Priority 1: Manually disabled
  if (coupon.isActive === false) {
    return {
      status: 'INACTIVE',
      label: 'Inactive',
      color: '#9CA3AF',
      bg: 'rgba(156, 163, 175, 0.15)',
      border: 'rgba(156, 163, 175, 0.35)',
      isUsable: false
    };
  }

  // Priority 2: Expiry date evaluation
  if (coupon.expiryDate) {
    const expiryEndOfDay = getEndOfDayExpiry(coupon.expiryDate);
    const now = new Date();
    if (now.getTime() > expiryEndOfDay.getTime()) {
      return {
        status: 'EXPIRED',
        label: 'Expired',
        color: '#FF9100',
        bg: 'rgba(255, 145, 0, 0.15)',
        border: 'rgba(255, 145, 0, 0.4)',
        isUsable: false
      };
    }
  }

  // Priority 3: Total usage limit evaluation
  const isUnlimitedTotal = coupon.isUnlimitedTotal === true;
  const totalCount = Number(coupon.totalUsageCount ?? coupon.usedCount ?? 0);
  const totalLimit = coupon.totalUsageLimit !== null && coupon.totalUsageLimit !== undefined
    ? Number(coupon.totalUsageLimit)
    : (coupon.usageLimit !== undefined ? Number(coupon.usageLimit) : null);

  if (!isUnlimitedTotal && totalLimit !== null && totalLimit > 0 && totalCount >= totalLimit) {
    return {
      status: 'EXHAUSTED',
      label: 'Usage Limit Reached',
      color: '#FF4D4F',
      bg: 'rgba(255, 77, 79, 0.15)',
      border: 'rgba(255, 77, 79, 0.4)',
      isUsable: false
    };
  }

  // Priority 4: Daily usage limit evaluation
  const isUnlimitedDaily = coupon.isUnlimitedDaily !== false;
  if (!isUnlimitedDaily && coupon.dailyUsageLimit !== null && coupon.dailyUsageLimit !== undefined) {
    const dailyLimit = Number(coupon.dailyUsageLimit);
    const todayStr = getTodayDateString();
    const currentDailyCount = coupon.dailyUsageDate === todayStr ? Number(coupon.dailyUsageCount || 0) : 0;
    if (dailyLimit > 0 && currentDailyCount >= dailyLimit) {
      return {
        status: 'EXHAUSTED',
        label: 'Usage Limit Reached',
        color: '#FF4D4F',
        bg: 'rgba(255, 77, 79, 0.15)',
        border: 'rgba(255, 77, 79, 0.4)',
        isUsable: false
      };
    }
  }

  // Priority 5: Active and usable
  return {
    status: 'ACTIVE',
    label: 'Active',
    color: '#00E676',
    bg: 'rgba(0, 230, 118, 0.12)',
    border: 'rgba(0, 230, 118, 0.35)',
    isUsable: true
  };
};

/**
 * Standard list of branches for canonical amusement parks
 */
export const STANDARD_PARK_BRANCHES = {
  wonderla: [
    { id: 'bengaluru', name: 'Bengaluru', desc: 'Mysore Road, 28 km from the city' },
    { id: 'kochi', name: 'Kochi', desc: 'Pallikkara, 12 km from city center' },
    { id: 'hyderabad', name: 'Hyderabad', desc: 'Raviryal' },
    { id: 'bhubaneswar', name: 'Bhubaneswar', desc: '28 km from the city' },
    { id: 'chennai', name: 'Chennai', desc: 'OMR / Thiruporur' }
  ],
  blackthunder: [
    { id: 'mettupalayam', name: 'Mettupalayam (Main Park)', desc: 'Coimbatore Foothills' }
  ],
  mgm: [
    { id: 'ecr-chennai', name: 'MGM Dizzee World (ECR)', desc: 'East Coast Road, Chennai' }
  ],
  queensland: [
    { id: 'poonamallee', name: 'Queens Land (Poonamallee)', desc: 'Bangalore Trunk Road, Chennai' }
  ],
  vgp: [
    { id: 'ecr-injambakkam', name: 'VGP Universal Kingdom (ECR)', desc: 'Injambakkam, Chennai' }
  ]
};

export const getParkBranches = (parkOrName) => {
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

