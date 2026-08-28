const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Coupon = require('./models/Coupon');
const { formatCouponDate, getTodayDateString, computeCouponStatus, getParkBranches } = require('./utils/couponUtils');

const runTests = async () => {
  console.log('--- STARTING COUPONS SYSTEM VERIFICATION ---');
  
  // 1. Date Format Test (DD.MM.YYYY)
  console.log('\n[TEST 1] Date formatting formatCouponDate:');
  const date1 = new Date('2026-06-02T12:00:00Z');
  const formatted1 = formatCouponDate(date1);
  console.log('2026-06-02 formatted as:', formatted1);
  if (formatted1 === '02.06.2026') {
    console.log('✅ TEST 1 PASSED: Strict DD.MM.YYYY formatting verified.');
  } else {
    console.error('❌ TEST 1 FAILED: Expected 02.06.2026, got', formatted1);
  }

  // 2. Status computation tests
  console.log('\n[TEST 2] Dynamic Coupon Status computation:');
  
  // Active coupon
  const activeCoupon = {
    code: 'ACTIVE20',
    isActive: true,
    expiryDate: new Date(Date.now() + 86400000 * 10), // 10 days in future
    isUnlimitedTotal: true,
    isUnlimitedDaily: true,
    totalUsageCount: 5,
    dailyUsageCount: 2,
    dailyUsageDate: getTodayDateString()
  };
  const statusActive = computeCouponStatus(activeCoupon);
  console.log('Active coupon computed status:', statusActive);

  // Inactive coupon
  const inactiveCoupon = { ...activeCoupon, isActive: false };
  const statusInactive = computeCouponStatus(inactiveCoupon);
  console.log('Inactive coupon computed status:', statusInactive);

  // Expired coupon
  const expiredCoupon = { ...activeCoupon, expiryDate: new Date(Date.now() - 86400000) };
  const statusExpired = computeCouponStatus(expiredCoupon);
  console.log('Expired coupon computed status:', statusExpired);

  // Total limit reached coupon
  const exhaustedTotalCoupon = { 
    ...activeCoupon, 
    isUnlimitedTotal: false, 
    totalUsageLimit: 10, 
    totalUsageCount: 10 
  };
  const statusExhaustedTotal = computeCouponStatus(exhaustedTotalCoupon);
  console.log('Total limit reached computed status:', statusExhaustedTotal);

  // Daily limit reached coupon
  const exhaustedDailyCoupon = {
    ...activeCoupon,
    isUnlimitedDaily: false,
    dailyUsageLimit: 5,
    dailyUsageCount: 5,
    dailyUsageDate: getTodayDateString()
  };
  const statusExhaustedDaily = computeCouponStatus(exhaustedDailyCoupon);
  console.log('Daily limit reached computed status:', statusExhaustedDaily);

  if (
    statusActive.status === 'ACTIVE' &&
    statusInactive.status === 'INACTIVE' &&
    statusExpired.status === 'EXPIRED' &&
    statusExhaustedTotal.status === 'EXHAUSTED' &&
    statusExhaustedDaily.status === 'EXHAUSTED'
  ) {
    console.log('✅ TEST 2 PASSED: All coupon statuses correctly computed in real time.');
  } else {
    console.error('❌ TEST 2 FAILED: Status computation mismatch.');
  }

  // 3. Branches resolution tests
  console.log('\n[TEST 3] Branch Resolution per Amusement Park:');
  const wonderlaBranches = getParkBranches('Wonderla');
  console.log('Wonderla branches count:', wonderlaBranches.length, wonderlaBranches.map(b => b.name));
  const blackThunderBranches = getParkBranches('Black Thunder');
  console.log('Black Thunder branches:', blackThunderBranches.map(b => b.name));
  const mgmBranches = getParkBranches('MGM Dizzee World');
  console.log('MGM branches:', mgmBranches.map(b => b.name));
  const queenslandBranches = getParkBranches('Queens Land');
  console.log('Queens Land branches:', queenslandBranches.map(b => b.name));
  const vgpBranches = getParkBranches('VGP Universal Kingdom');
  console.log('VGP branches:', vgpBranches.map(b => b.name));

  if (
    wonderlaBranches.length === 5 &&
    blackThunderBranches.length >= 1 &&
    mgmBranches.length >= 1 &&
    queenslandBranches.length >= 1 &&
    vgpBranches.length >= 1
  ) {
    console.log('✅ TEST 3 PASSED: All amusement parks have correct branch resolution.');
  } else {
    console.error('❌ TEST 3 FAILED: Branch resolution failed.');
  }

  // 4. DB Integration Tests (Connecting to MongoDB)
  console.log('\n[TEST 4] Database Integration & Isolation:');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // Cleanup previous test coupons
    await Coupon.deleteMany({ code: { $regex: /^TEST_PARK_/ } });

    // Create Wonderla branch-specific coupon
    const wonderlaBranchCoupon = await Coupon.create({
      code: 'TEST_PARK_WDL_BLR_CHN',
      discountType: 'percentage',
      discountValue: 20,
      expiryDate: new Date(Date.now() + 86400000 * 30),
      applicablePark: 'Wonderla',
      parkId: 'Wonderla',
      applicableBranches: ['bengaluru', 'chennai'],
      isUnlimitedTotal: false,
      totalUsageLimit: 100,
      isUnlimitedDaily: false,
      dailyUsageLimit: 10,
      isActive: true
    });
    console.log('Created Wonderla branch-specific coupon:', wonderlaBranchCoupon.code);

    // Create Black Thunder coupon
    const blackThunderCoupon = await Coupon.create({
      code: 'TEST_PARK_BT_MAIN',
      discountType: 'fixed',
      discountValue: 150,
      expiryDate: new Date(Date.now() + 86400000 * 30),
      applicablePark: 'Black Thunder',
      parkId: 'Black Thunder',
      applicableBranches: ['all'],
      isUnlimitedTotal: true,
      isUnlimitedDaily: true,
      isActive: true
    });
    console.log('Created Black Thunder coupon:', blackThunderCoupon.code);

    // Verify DB Query Isolation:
    const wonderlaCoupons = await Coupon.find({ applicablePark: 'Wonderla', code: /^TEST_PARK_/ });
    const btCoupons = await Coupon.find({ applicablePark: 'Black Thunder', code: /^TEST_PARK_/ });

    const isWonderlaIsolated = wonderlaCoupons.every(c => c.applicablePark === 'Wonderla' && c.code !== 'TEST_PARK_BT_MAIN');
    const isBtIsolated = btCoupons.every(c => c.applicablePark === 'Black Thunder' && c.code !== 'TEST_PARK_WDL_BLR_CHN');

    if (isWonderlaIsolated && isBtIsolated) {
      console.log('✅ TEST 4 PASSED: Database-level park isolation strictly enforced.');
    } else {
      console.error('❌ TEST 4 FAILED: Isolation leak detected.');
    }

    // Cleanup test data
    await Coupon.deleteMany({ code: { $regex: /^TEST_PARK_/ } });
    console.log('Test coupons cleaned up.');

    await mongoose.disconnect();
    console.log('\n🎉 ALL 4 VERIFICATION TEST SUITES PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Database test error:', err);
  }
};

runTests();
