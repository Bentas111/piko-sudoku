import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import { Preferences } from '@capacitor/preferences';
import config from './club-config.json';
import policy from './club-policy.cjs';

const CACHE_KEY = 'piko-club-entitlement-v1';
const OFFLINE_GRACE_MS = 72 * 60 * 60 * 1000;

export async function installClub(platform) {
  if (!['android', 'ios'].includes(platform)) return;
  const iosIds = [config.iosMonthlyProductId, config.iosYearlyProductId];
  const productIds = platform === 'android' ? [config.androidProductId] : iosIds;
  const state = { active: false, loading: true, supported: true, products: {}, error: '' };
  const announce = () => window.dispatchEvent(new CustomEvent('piko:club', { detail: { ...state } }));
  const cache = async active => {
    state.active = !!active;
    await Preferences.set({ key: CACHE_KEY, value: JSON.stringify({ active: state.active, checkedAt: Date.now() }) });
    announce();
  };
  const readCache = async () => {
    try {
      const saved = JSON.parse((await Preferences.get({ key: CACHE_KEY })).value || 'null');
      state.active = policy.cachedEntitlementIsActive(saved, Date.now(), OFFLINE_GRACE_MS);
    } catch { /* A store refresh below is authoritative when available. */ }
  };
  const refresh = async () => {
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.SUBS, onlyCurrentEntitlements: true });
    await cache(purchases.some(p => policy.transactionIsActive(p, platform, productIds)));
    return state.active;
  };
  const loadProducts = async () => {
    const result = await NativePurchases.getProducts({ productIdentifiers: productIds, productType: PURCHASE_TYPE.SUBS });
    state.products = {};
    for (const product of result.products || []) {
      const plan = policy.planFromProduct(product, platform);
      if (plan && !product.offerId) state.products[plan] = product;
      else if (plan && !state.products[plan]) state.products[plan] = product;
    }
  };
  const api = {
    get active() { return state.active; },
    get state() { return { ...state, products: { ...state.products } }; },
    async purchase(plan) {
      if (!['monthly', 'yearly'].includes(plan) || state.loading) return;
      state.loading = true; state.error = ''; announce();
      try {
        const product = state.products[plan];
        if (!product) throw new Error('product-unavailable');
        const productIdentifier = platform === 'android' ? config.androidProductId : product.identifier;
        const options = { productIdentifier, productType: PURCHASE_TYPE.SUBS, quantity: 1 };
        if (platform === 'android') {
          options.planIdentifier = plan;
          if (product.offerToken) options.offerToken = product.offerToken;
        }
        const transaction = await NativePurchases.purchaseProduct(options);
        if (!policy.transactionIsActive(transaction, platform, productIds)) throw new Error('purchase-pending');
        await cache(true);
        window.PikoAds?.hide();
      } catch (error) {
        state.error = /cancel/i.test(String(error?.message || error)) ? 'cancelled' : String(error?.message || error || 'purchase-failed');
      } finally { state.loading = false; announce(); }
    },
    async restore() {
      if (state.loading) return;
      state.loading = true; state.error = ''; announce();
      try { await NativePurchases.restorePurchases(); await refresh(); }
      catch (error) { state.error = String(error?.message || error || 'restore-failed'); }
      finally { state.loading = false; announce(); }
    },
    async manage() {
      try { await NativePurchases.manageSubscriptions(); }
      catch (error) { state.error = String(error?.message || error || 'manage-failed'); announce(); }
    },
    refresh
  };
  window.PikoClub = api;
  await readCache(); announce();
  (async () => {
    try {
      const support = await NativePurchases.isBillingSupported();
      state.supported = support.isBillingSupported !== false;
      if (state.supported) {
        await refresh();
        await loadProducts();
      }
    } catch (error) {
      state.error = 'store-unavailable';
    } finally { state.loading = false; announce(); }
  })();
}
