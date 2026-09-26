const { test } = require('node:test');
const assert = require('node:assert/strict');
const { transactionIsActive, cachedEntitlementIsActive, planFromProduct } = require('../src/club-policy.cjs');

const ids = ['piko_club'];

test('Android grants Club only for an acknowledged completed subscription', () => {
  assert.equal(transactionIsActive({ productIdentifier: 'piko_club', purchaseState: '1', isAcknowledged: true }, 'android', ids), true);
  assert.equal(transactionIsActive({ productIdentifier: 'piko_club', purchaseState: '0', isAcknowledged: true }, 'android', ids), false);
  assert.equal(transactionIsActive({ productIdentifier: 'piko_club', purchaseState: '1', isAcknowledged: false }, 'android', ids), false);
  assert.equal(transactionIsActive({ productIdentifier: 'another_product', purchaseState: '1', isAcknowledged: true }, 'android', ids), false);
});

test('iOS rejects expired and revoked subscriptions', () => {
  const iosIds = ['pl.niekazmuliczyc.piko.club.monthly'];
  assert.equal(transactionIsActive({ productIdentifier: iosIds[0], isActive: true }, 'ios', iosIds), true);
  assert.equal(transactionIsActive({ productIdentifier: iosIds[0], subscriptionState: 'expired', isActive: true }, 'ios', iosIds), false);
  assert.equal(transactionIsActive({ productIdentifier: iosIds[0], revocationDate: '2026-01-01', isActive: true }, 'ios', iosIds), false);
  assert.equal(transactionIsActive({ productIdentifier: iosIds[0], expirationDate: '2026-09-21T00:00:00Z' }, 'ios', iosIds, Date.parse('2026-09-20T00:00:00Z')), true);
});

test('store products map to monthly and yearly plans on both platforms', () => {
  assert.equal(planFromProduct({ identifier: 'monthly' }, 'android'), 'monthly');
  assert.equal(planFromProduct({ identifier: 'yearly' }, 'android'), 'yearly');
  assert.equal(planFromProduct({ identifier: 'pl.niekazmuliczyc.piko.club.monthly' }, 'ios'), 'monthly');
  assert.equal(planFromProduct({ identifier: 'pl.niekazmuliczyc.piko.club.yearly' }, 'ios'), 'yearly');
});

test('offline Club cache expires after a short grace period', () => {
  const now = Date.parse('2026-09-26T12:00:00Z');
  const grace = 72 * 60 * 60 * 1000;
  assert.equal(cachedEntitlementIsActive({ active: true, checkedAt: now - grace }, now, grace), true);
  assert.equal(cachedEntitlementIsActive({ active: true, checkedAt: now - grace - 1 }, now, grace), false);
  assert.equal(cachedEntitlementIsActive({ active: false, checkedAt: now }, now, grace), false);
  assert.equal(cachedEntitlementIsActive({ active: true }, now, grace), false);
  assert.equal(cachedEntitlementIsActive({ active: true, checkedAt: now + 1 }, now, grace), false);
});
