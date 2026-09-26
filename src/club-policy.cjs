function transactionIsActive(transaction, platform, productIds, now = Date.now()) {
  if (!transaction || !productIds.includes(transaction.productIdentifier)) return false;
  if (platform === 'android') {
    return String(transaction.purchaseState) === '1' && transaction.isAcknowledged === true;
  }
  if (transaction.revocationDate || transaction.subscriptionState === 'expired' || transaction.subscriptionState === 'revoked') return false;
  if (transaction.isActive === true) return true;
  return !!transaction.expirationDate && new Date(transaction.expirationDate).getTime() > now;
}

function cachedEntitlementIsActive(saved, now = Date.now(), graceMs = 72 * 60 * 60 * 1000) {
  if (saved?.active !== true) return false;
  const checkedAt = Number(saved.checkedAt);
  return Number.isFinite(checkedAt) && checkedAt <= now && now - checkedAt <= graceMs;
}

function planFromProduct(product, platform) {
  if (!product) return null;
  if (platform === 'android') return ['monthly', 'yearly'].includes(product.identifier) ? product.identifier : null;
  if (product.identifier.endsWith('.monthly')) return 'monthly';
  if (product.identifier.endsWith('.yearly')) return 'yearly';
  return null;
}

module.exports = { transactionIsActive, cachedEntitlementIsActive, planFromProduct };
