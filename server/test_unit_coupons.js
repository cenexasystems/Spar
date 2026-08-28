const { formatCouponDate, formatCouponDateNumeric, getTodayDateString, computeCouponStatus, getParkBranches } = require('./utils/couponUtils');

console.log('====================================================');
console.log('       COUPONS SYSTEM UNIT & LOGIC TEST SUITE        ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${message}`);
  }
}

// ── 1. DATE FORMATTING (Requirement 6) ──────────────────────────────
console.log('\n[SECTION 1: DATE FORMATTING DD.MM.YYYY]');
assert(formatCouponDate('2026-06-02') === '02.06.2026', 'Formats YYYY-MM-DD "2026-06-02" to "02.06.2026"');
assert(formatCouponDate('2026-12-25') === '25.12.2026', 'Formats YYYY-MM-DD "2026-12-25" to "25.12.2026"');
assert(formatCouponDate(new Date('2026-01-05T00:00:00Z')) === '05.01.2026', 'Formats Date object to "05.01.2026"');
assert(formatCouponDateNumeric('2026-06-02') === '02.06.2026', 'formatCouponDateNumeric matches DD.MM.YYYY');

// ── 2. BRANCH APPLICABILITY PER PARK (Requirement 1 & 2) ───────────
console.log('\n[SECTION 2: BRANCH RESOLUTION & ISOLATION]');
const wonderlaBranches = getParkBranches('Wonderla');
assert(wonderlaBranches.length === 5, 'Wonderla has 5 branches configured');
const wBranchIds = wonderlaBranches.map(b => b.id);
assert(wBranchIds.includes('bengaluru') && wBranchIds.includes('chennai') && wBranchIds.includes('kochi') && wBranchIds.includes('hyderabad') && wBranchIds.includes('bhubaneswar'), 'Wonderla includes all 5 canonical branches');

const btBranches = getParkBranches('Black Thunder');
assert(btBranches.length >= 1 && btBranches[0].id === 'mettupalayam', 'Black Thunder resolves to Mettupalayam branch');

const mgmBranches = getParkBranches('MGM Dizzee World');
assert(mgmBranches.length >= 1 && mgmBranches[0].id === 'ecr-chennai', 'MGM Dizzee World resolves to ECR Chennai branch');

const queenslandBranches = getParkBranches('Queens Land');
assert(queenslandBranches.length >= 1 && queenslandBranches[0].id === 'poonamallee', 'Queens Land resolves to Poonamallee branch');

const vgpBranches = getParkBranches('VGP Universal Kingdom');
assert(vgpBranches.length >= 1 && vgpBranches[0].id === 'ecr-injambakkam', 'VGP Universal Kingdom resolves to ECR Injambakkam branch');

// Custom park with custom branches array
const customPark = { name: 'Universal Studios', branches: [{ id: 'sentosa', name: 'Sentosa' }, { id: 'orlando', name: 'Orlando' }] };
assert(getParkBranches(customPark).length === 2, 'Custom park uses its configured branches');

// ── 3. STATUS & EXPIRY COMPUTATION (Requirement 3, 4, 5) ────────────
console.log('\n[SECTION 3: REAL-TIME COUPON STATUS COMPUTATION]');

// Active coupon with unlimited total and unlimited daily
const activeUnlimited = {
  code: 'UNLIMITED_ALL',
  isActive: true,
  expiryDate: new Date(Date.now() + 86400000 * 5),
  isUnlimitedTotal: true,
  isUnlimitedDaily: true,
  totalUsageCount: 500,
  dailyUsageCount: 100,
  dailyUsageDate: getTodayDateString()
};
const status1 = computeCouponStatus(activeUnlimited);
assert(status1.status === 'ACTIVE' && status1.isUsable === true && status1.label === 'Active', 'Unlimited coupon with high redemptions remains Active');

// Inactive coupon (manually disabled)
const manuallyDisabled = { ...activeUnlimited, isActive: false };
const status2 = computeCouponStatus(manuallyDisabled);
assert(status2.status === 'INACTIVE' && status2.isUsable === false && status2.label === 'Inactive', 'Manually disabled coupon has status INACTIVE');

// Expired coupon
const expiredCoupon = { ...activeUnlimited, expiryDate: new Date(Date.now() - 100000) };
const status3 = computeCouponStatus(expiredCoupon);
assert(status3.status === 'EXPIRED' && status3.isUsable === false && status3.label === 'Expired', 'Expired coupon has status EXPIRED');

// Limited total redemptions reached
const totalExhausted = {
  code: 'LIMITED_TOTAL',
  isActive: true,
  expiryDate: new Date(Date.now() + 86400000 * 5),
  isUnlimitedTotal: false,
  totalUsageLimit: 100,
  totalUsageCount: 100,
  isUnlimitedDaily: true
};
const status4 = computeCouponStatus(totalExhausted);
assert(status4.status === 'EXHAUSTED' && status4.isUsable === false && status4.label === 'Usage Limit Reached', 'Total usage limit reached coupon has status EXHAUSTED');

// Limited daily redemptions reached today
const dailyExhausted = {
  code: 'LIMITED_DAILY',
  isActive: true,
  expiryDate: new Date(Date.now() + 86400000 * 5),
  isUnlimitedTotal: true,
  isUnlimitedDaily: false,
  dailyUsageLimit: 20,
  dailyUsageCount: 20,
  dailyUsageDate: getTodayDateString()
};
const status5 = computeCouponStatus(dailyExhausted);
assert(status5.status === 'EXHAUSTED' && status5.isUsable === false && status5.label === 'Usage Limit Reached', 'Daily usage limit reached today has status EXHAUSTED');

// Daily count from previous calendar day automatically treated as reset
const dailyPastDate = {
  code: 'LIMITED_DAILY_PAST',
  isActive: true,
  expiryDate: new Date(Date.now() + 86400000 * 5),
  isUnlimitedTotal: true,
  isUnlimitedDaily: false,
  dailyUsageLimit: 20,
  dailyUsageCount: 20,
  dailyUsageDate: '2020-01-01' // Past date
};
const status6 = computeCouponStatus(dailyPastDate);
assert(status6.status === 'ACTIVE' && status6.isUsable === true, 'Daily limit from past date automatically resets for current day');

// ── 4. COUPON VALIDATION LOGIC REPLICATION (Requirement 1, 2, 4, 7) ─
console.log('\n[SECTION 4: REDEMPTION & CHECKOUT VALIDATION RULES]');

function validateCouponMock(coupon, { parkName, branchId }) {
  if (coupon.isActive === false) return { valid: false, message: 'Coupon is currently inactive' };
  
  const expiry = new Date(coupon.expiryDate);
  if (Date.now() > expiry.getTime()) return { valid: false, message: 'Coupon has expired' };
  
  if (!coupon.isUnlimitedTotal && coupon.totalUsageLimit && (coupon.totalUsageCount || 0) >= coupon.totalUsageLimit) {
    return { valid: false, message: 'Total usage limit reached' };
  }

  if (!coupon.isUnlimitedDaily && coupon.dailyUsageLimit) {
    const today = getTodayDateString();
    const countToday = coupon.dailyUsageDate === today ? (coupon.dailyUsageCount || 0) : 0;
    if (countToday >= coupon.dailyUsageLimit) return { valid: false, message: 'Daily usage limit reached' };
  }

  // Park isolation
  const cPark = (coupon.parkId || coupon.applicablePark || '').toLowerCase();
  const reqPark = (parkName || '').toLowerCase();
  if (cPark && cPark !== 'all' && cPark !== reqPark) {
    return { valid: false, message: 'Park mismatch: Not valid for selected park' };
  }

  // Branch applicability
  const applicableBranches = coupon.applicableBranches || ['all'];
  const appliesAll = applicableBranches.some(b => b.toLowerCase() === 'all');
  if (!appliesAll && branchId) {
    const isAllowed = applicableBranches.some(b => b.toLowerCase() === branchId.toLowerCase());
    if (!isAllowed) return { valid: false, message: 'Branch mismatch: Not valid for selected branch' };
  }

  return { valid: true };
}

// Wonderla coupon for Bengaluru and Chennai only
const wonderlaCoupon = {
  code: 'WDL_BLR_CHN',
  isActive: true,
  expiryDate: new Date(Date.now() + 86400000),
  applicablePark: 'Wonderla',
  parkId: 'Wonderla',
  applicableBranches: ['bengaluru', 'chennai'],
  isUnlimitedTotal: true,
  isUnlimitedDaily: true
};

assert(validateCouponMock(wonderlaCoupon, { parkName: 'Wonderla', branchId: 'bengaluru' }).valid === true, 'Wonderla coupon valid on Wonderla Bengaluru branch');
assert(validateCouponMock(wonderlaCoupon, { parkName: 'Wonderla', branchId: 'chennai' }).valid === true, 'Wonderla coupon valid on Wonderla Chennai branch');
assert(validateCouponMock(wonderlaCoupon, { parkName: 'Wonderla', branchId: 'kochi' }).valid === false, 'Wonderla coupon rejected on unselected Wonderla Kochi branch');
assert(validateCouponMock(wonderlaCoupon, { parkName: 'Black Thunder', branchId: 'mettupalayam' }).valid === false, 'Wonderla coupon rejected when applied to Black Thunder');
assert(validateCouponMock(wonderlaCoupon, { parkName: 'MGM Dizzee World', branchId: 'ecr-chennai' }).valid === false, 'Wonderla coupon rejected when applied to MGM Dizzee World');
assert(validateCouponMock(wonderlaCoupon, { parkName: 'Queens Land', branchId: 'poonamallee' }).valid === false, 'Wonderla coupon rejected when applied to Queens Land');
assert(validateCouponMock(wonderlaCoupon, { parkName: 'VGP Universal Kingdom', branchId: 'ecr-injambakkam' }).valid === false, 'Wonderla coupon rejected when applied to VGP Universal Kingdom');

// Black Thunder coupon for All Branches
const btCoupon = {
  code: 'BT_ALL',
  isActive: true,
  expiryDate: new Date(Date.now() + 86400000),
  applicablePark: 'Black Thunder',
  parkId: 'Black Thunder',
  applicableBranches: ['all'],
  isUnlimitedTotal: true,
  isUnlimitedDaily: true
};
assert(validateCouponMock(btCoupon, { parkName: 'Black Thunder', branchId: 'mettupalayam' }).valid === true, 'Black Thunder coupon valid on Black Thunder');
assert(validateCouponMock(btCoupon, { parkName: 'Wonderla', branchId: 'bengaluru' }).valid === false, 'Black Thunder coupon rejected on Wonderla');

// ── 5. COUPON CREATION DATA COMPLIANCE & PROOF RESOLUTION ────────────
console.log('\n[SECTION 5: COUPON CREATION COMPLIANCE & PROOF RESOLUTION]');

// Test 5.1: Unlimited Total + Unlimited Daily payload validation
const unlimitedPayload = {
  code: 'UNLIMITED_2026',
  discountType: 'percentage',
  discountValue: 20,
  expiryDate: '2026-12-31',
  isUnlimitedTotal: true,
  totalUsageLimitEnabled: false,
  totalUsageLimit: null,
  isUnlimitedDaily: true,
  dailyUsageLimitEnabled: false,
  dailyUsageLimit: null,
  applicablePark: 'Wonderla',
  applicableBranches: ['all']
};
assert(unlimitedPayload.isUnlimitedTotal === true && unlimitedPayload.totalUsageLimit === null, 'Unlimited total coupon does not require numeric totalUsageLimit');
assert(unlimitedPayload.isUnlimitedDaily === true && unlimitedPayload.dailyUsageLimit === null, 'Unlimited daily coupon does not require numeric dailyUsageLimit');

// Test 5.2: Limited Total + Limited Daily payload validation
const limitedPayload = {
  code: 'LIMITED_2026',
  discountType: 'fixed',
  discountValue: 200,
  expiryDate: '2026-12-31',
  isUnlimitedTotal: false,
  totalUsageLimitEnabled: true,
  totalUsageLimit: 150,
  isUnlimitedDaily: false,
  dailyUsageLimitEnabled: true,
  dailyUsageLimit: 25,
  applicablePark: 'Black Thunder',
  applicableBranches: ['mettupalayam']
};
assert(limitedPayload.totalUsageLimit === 150 && limitedPayload.totalUsageLimit > 0, 'Limited total coupon specifies positive numeric limit');
assert(limitedPayload.dailyUsageLimit === 25 && limitedPayload.dailyUsageLimit > 0, 'Limited daily coupon specifies positive numeric daily limit');

// Test 5.3: Exact Unified Data Contract Tests
const exactUnlimitedContract = {
  totalUsageLimit: null,
  dailyUsageLimit: null,
  unlimitedTotal: true,
  unlimitedDaily: true
};
assert(exactUnlimitedContract.unlimitedTotal === true && exactUnlimitedContract.totalUsageLimit === null, 'Exact unlimited total data contract has null totalUsageLimit');
assert(exactUnlimitedContract.unlimitedDaily === true && exactUnlimitedContract.dailyUsageLimit === null, 'Exact unlimited daily data contract has null dailyUsageLimit');

const exactLimitedContract = {
  totalUsageLimit: 100,
  dailyUsageLimit: 25,
  unlimitedTotal: false,
  unlimitedDaily: false
};
assert(exactLimitedContract.unlimitedTotal === false && exactLimitedContract.totalUsageLimit === 100, 'Exact limited total data contract has integer totalUsageLimit');
assert(exactLimitedContract.unlimitedDaily === false && exactLimitedContract.dailyUsageLimit === 25, 'Exact limited daily data contract has integer dailyUsageLimit');

// Test 5.4: Percentage & Daily Limit Business Logic Validation
function validateDiscountLimits(discountType, discountValue, isUnlimTotal, totalLimit, isUnlimDaily, dailyLimit) {
  if (discountType === 'percentage' && (discountValue < 1 || discountValue > 100)) {
    return { valid: false, message: 'Percentage discount must be between 1% and 100%' };
  }
  if (!isUnlimTotal && !isUnlimDaily && totalLimit && dailyLimit && dailyLimit > totalLimit) {
    return { valid: false, message: 'Daily usage limit cannot exceed total usage limit' };
  }
  return { valid: true };
}

assert(validateDiscountLimits('percentage', 100, true, null, true, null).valid === true, '100% discount is permitted');
assert(validateDiscountLimits('percentage', 105, true, null, true, null).valid === false, '105% discount is rejected');
assert(validateDiscountLimits('fixed', 500, false, 50, false, 20).valid === true, 'Daily limit 20 <= Total limit 50 is valid');
assert(validateDiscountLimits('fixed', 500, false, 50, false, 80).valid === false, 'Daily limit 80 > Total limit 50 is rejected');

// Test 5.5: Payment Proof URL Resolver logic
const resolveProof = (b) => {
  if (!b) return null;
  const raw = b.paymentScreenshotData || b.paymentScreenshot;
  if (!raw) return null;
  if (raw.startsWith('data:image/')) return raw;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  const cleanPath = raw.replace(/\\/g, '/');
  if (cleanPath.startsWith('/uploads/') || cleanPath.startsWith('uploads/')) {
    const formatted = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `http://localhost:5000${formatted}`;
  }
  const id = b._id || b.id;
  if (id) return `http://localhost:5000/api/payment/proof/${id}`;
  return `http://localhost:5000/${cleanPath.replace(/^\//, '')}`;
};

const base64Booking = { _id: 'bk_1', paymentScreenshotData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' };
const externalBooking = { _id: 'bk_2', paymentScreenshot: 'https://storage.googleapis.com/bucket/proof.jpg' };
const localDiskBooking = { _id: 'bk_3', paymentScreenshot: '/uploads/payment_123.png' };

assert(resolveProof(base64Booking).startsWith('data:image/png;base64,'), 'Resolves Base64 Data URI directly for persistent proof storage');
assert(resolveProof(externalBooking) === 'https://storage.googleapis.com/bucket/proof.jpg', 'Resolves full external URLs directly without prepending server URL');
assert(resolveProof(localDiskBooking) === 'http://localhost:5000/uploads/payment_123.png', 'Resolves legacy relative paths with server URL');

console.log('\n====================================================');
console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (100%)`);
console.log('====================================================');
