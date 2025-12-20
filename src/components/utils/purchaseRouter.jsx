import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { logger } from '@/components/utils/logger';

// ----------------------------------------------------------------------
// DIAGNOSTICS (MASTER INSTRUCTION)
// ----------------------------------------------------------------------
if (typeof window !== 'undefined') {
    window.__PURCHASE_ROUTER_LOADED__ = true;
    window.__PURCHASE_STATUS__ = 'Ready';

    // 4. Add high-signal debug logging
    window.__SB_DEBUG_PURCHASES = () => {
        const bridgeData = getPurchasesBridge();
        const bridge = bridgeData.bridge;
        
        const debugInfo = {
            userAgent: navigator.userAgent,
            isNativeEnvironment: /Natively|BuildNatively/i.test(navigator.userAgent) || window.__NATIVELY__ === true,
            bridgeSource: bridgeData.source,
            bridgeExists: !!bridge,
            bridgeKeys: bridge ? Object.keys(bridge) : [],
            bridgePrototype: bridge ? Object.getOwnPropertyNames(Object.getPrototypeOf(bridge)) : [],
            purchaseStatus: window.__PURCHASE_STATUS__
        };
        
        console.log('[SB_DEBUG_PURCHASES]', debugInfo);

        return debugInfo;
    };
}

// ----------------------------------------------------------------------
// 1. ROBUST BRIDGE DETECTION
// ----------------------------------------------------------------------

const getPurchasesBridge = () => {
    if (typeof window === 'undefined') return { bridge: null, source: 'none' };

    // 1. window.natively?.purchases (Modern SDK - Prioritized per prompt)
    if (window.natively && window.natively.purchases) {
        return { bridge: window.natively.purchases, source: 'natively.purchases' };
    }

    // 2. window.NativelyPurchases (Legacy Global Constructor)
    if (window.NativelyPurchases) {
        if (typeof window.NativelyPurchases === 'function') {
            try {
                return { bridge: new window.NativelyPurchases(), source: 'NativelyPurchases(ctor)' };
            } catch (e) {
                console.error('[PurchaseRouter] Error instantiating NativelyPurchases', e);
            }
        }
        if (typeof window.NativelyPurchases === 'object') {
            return { bridge: window.NativelyPurchases, source: 'NativelyPurchases(obj)' };
        }
    }

    // 3. window.nativelyPurchases (Lowercase fallback per prompt)
    if (window.nativelyPurchases) {
        return { bridge: window.nativelyPurchases, source: 'nativelyPurchases' };
    }

    // 4. window.Purchases (Generic fallback)
    if (window.Purchases) {
        return { bridge: window.Purchases, source: 'Purchases' };
    }

    return { bridge: null, source: 'none' };
};

const isBridgeValid = (bridge) => {
    if (!bridge) return false;
    // Check for ANY purchase method
    return typeof bridge.purchasePackage === 'function' || 
           typeof bridge.purchaseProduct === 'function' || 
           typeof bridge.purchase === 'function';
};

// ----------------------------------------------------------------------
// 2. PUBLIC API
// ----------------------------------------------------------------------

export const PurchaseRouter = {

    isNativeBilling: () => {
        if (typeof window === 'undefined') return false;
        const ua = navigator.userAgent || '';
        const looksNative = /Natively|BuildNatively/i.test(ua) || window.__NATIVELY__ === true;
        if (!looksNative) return false;
        const { bridge } = getPurchasesBridge();
        return isBridgeValid(bridge);
    },
    
    isNativeBillingReady: function() {
        return this.isNativeBilling();
    },

    waitForNativeBridge: async (timeoutMs = 3000) => {
        if (typeof window === 'undefined') return false;
        const ua = navigator.userAgent || '';
        const looksNative = /Natively|BuildNatively/i.test(ua) || window.__NATIVELY__ === true;
        if (!looksNative) return false;
        if (PurchaseRouter.isNativeBilling()) return true;
        
        return new Promise((resolve) => {
            const start = Date.now();
            const interval = setInterval(() => {
                if (PurchaseRouter.isNativeBilling()) {
                    clearInterval(interval);
                    resolve(true);
                }
                if (Date.now() - start > timeoutMs) {
                    clearInterval(interval);
                    resolve(false);
                }
            }, 100);
        });
    },

    getDisplayPrices: async () => {
        const defaults = {
            monthly: '$4.99 USD / month',
            yearly: '$39.99 USD / year',
            disclaimer: 'Prices shown in USD. In-app purchases are charged in your local currency.'
        };

        if (!PurchaseRouter.isNativeBilling()) return defaults;

        try {
            const { bridge } = getPurchasesBridge();
            if (!bridge) return defaults;

            const fetchPrice = (id) => new Promise((resolve) => {
                // Try packagePrice first (for $rc_ IDs)
                if (typeof bridge.packagePrice === 'function') {
                    bridge.packagePrice(id, (err, price) => resolve(err ? null : price));
                    return;
                }
                // Fallback
                if (typeof bridge.getPackagePrice === 'function') {
                    try {
                        const res = bridge.getPackagePrice(id);
                        if (res instanceof Promise) res.then(resolve).catch(() => resolve(null));
                        else resolve(res);
                    } catch { resolve(null); }
                    return;
                }
                resolve(null);
            });

            // Use NEW Identifiers for price fetching
            const [monthly, yearly] = await Promise.all([
                fetchPrice('$rc_monthly'),
                fetchPrice('$rc_annual')
            ]);

            if (monthly || yearly) {
                return {
                    monthly: monthly || defaults.monthly,
                    yearly: yearly || defaults.yearly,
                    disclaimer: null // Native handles currency display
                };
            }
        } catch (e) {
            console.error('[PurchaseRouter] Error fetching native prices', e);
        }

        return defaults;
    },

    startUpgrade: async (plan, userId) => {
        if (!PurchaseRouter.isNativeBilling()) {
            return { ok: false, error: 'Web flow required' };
        }

        const { bridge, source } = getPurchasesBridge();
        
        if (!bridge) {
            // Requirement: User-facing error if bridge missing
            const msg = "In-app purchases not available in this build (bridge missing). Please update the app.";
            window.__PURCHASE_STATUS__ = 'Err: NoBridge';
            return { ok: false, error: msg };
        }

        window.__PURCHASE_STATUS__ = `Start via ${source}`;
        
        try {
            // Identify User
            if (typeof bridge.setCustomerUserId === 'function') bridge.setCustomerUserId(userId);
            else if (typeof bridge.setAppUserId === 'function') bridge.setAppUserId(userId);
            else if (typeof bridge.identify === 'function') bridge.identify(userId);
            else if (typeof bridge.login === 'function') {
                bridge.login(userId, () => {}); 
            }

            // Requirement: Use RevenueCat PACKAGE identifiers
            const rcPackageId = plan === 'monthly' ? '$rc_monthly' : '$rc_annual';
            window.__PURCHASE_STATUS__ = `Buying ${rcPackageId}...`;
            
            // TIMEOUT WRAPPER
            const purchasePromise = new Promise((resolve, reject) => {
                const cb = (err) => {
                    if (err) {
                        const message = typeof err === 'string' ? err : (err?.message || err?.code || JSON.stringify(err));
                        const lower = (message || '').toString().toLowerCase();
                        window.__PURCHASE_STATUS__ = `Err: ${lower.substring(0, 10)}`;
                        if (lower.includes('cancel')) reject(new Error('User cancelled'));
                        else reject(new Error(message));
                    } else {
                        window.__PURCHASE_STATUS__ = 'SuccessCB';
                        resolve();
                    }
                };

                try {
                    // Requirement: Prefer purchasePackage() over purchaseProduct()
                    // 2. If bridge.purchasePackage exists, call it
                    const wrapMaybePromise = (ret) => {
                        if (ret && typeof ret.then === 'function') {
                            ret.then(() => cb(null)).catch((err) => cb(err));
                        }
                    };

                    if (typeof bridge.purchasePackage === 'function') {
                        window.__PURCHASE_STATUS__ = `Call: purchasePackage`;
                        const ret = bridge.purchasePackage(rcPackageId, cb);
                        wrapMaybePromise(ret);
                    }
                    // 3. Else if bridge.purchaseProduct exists AND we have a real store product id
                    // We don't have real Store product IDs here; prefer generic purchase if available
                    else if (typeof bridge.purchaseProduct === 'function') {
                        if (typeof bridge.purchase === 'function') {
                            window.__PURCHASE_STATUS__ = `Call: purchase`;
                            const ret = bridge.purchase(rcPackageId, cb);
                            wrapMaybePromise(ret);
                        } else {
                            window.__PURCHASE_STATUS__ = 'No Pkg Method';
                            reject(new Error(`Native SDK missing purchasePackage method`));
                        }
                    }
                    else if (typeof bridge.purchase === 'function') {
                        window.__PURCHASE_STATUS__ = `Call: purchase`;
                        const ret = bridge.purchase(rcPackageId, cb);
                        wrapMaybePromise(ret);
                    }
                    else {
                        window.__PURCHASE_STATUS__ = 'No Method';
                        reject(new Error(`No purchase method found on bridge (${source})`));
                    }
                } catch (err) {
                    window.__PURCHASE_STATUS__ = `Ex: ${err.message}`;
                    throw err;
                }
            });

            // Extended Timeout (TestFlight may be slow)
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Bridge Timeout')), 60000)
            );

            await Promise.race([purchasePromise, timeoutPromise]);

            // Requirement: Entitlement sync after successful purchase
            window.__PURCHASE_STATUS__ = 'Syncing...';
            await base44.functions.invoke('syncRevenueCatEntitlements', { userId });
            window.__PURCHASE_STATUS__ = 'Done';
            return { ok: true };

        } catch (e) {
            console.error('[PurchaseRouter] Upgrade error:', e);
            if (!window.__PURCHASE_STATUS__.startsWith('Err') && !window.__PURCHASE_STATUS__.startsWith('Ex')) {
                window.__PURCHASE_STATUS__ = `Catch:${e.message.substring(0, 8)}`;
            }
            if (e.message === 'User cancelled') return { ok: false, userCancelled: true };
            return { ok: false, error: e.message || 'Purchase failed' };
        }
    },

    restore: async (userId) => {
        if (!PurchaseRouter.isNativeBilling()) return { ok: false, error: 'Not supported on Web' };
        
        const { bridge } = getPurchasesBridge();
        if (!bridge) return { ok: false, error: 'Native bridge not found' };

        try {
            // Requirement: reliable restore and log results
            window.__PURCHASE_STATUS__ = 'Restoring...';
            
            await new Promise((resolve, reject) => {
               const cb = (err) => err ? reject(err) : resolve();
               
               if (typeof bridge.restorePurchases === 'function') bridge.restorePurchases(cb);
               else if (typeof bridge.restore === 'function') bridge.restore(cb);
               else reject(new Error('No restore method found'));
            });
            
            window.__PURCHASE_STATUS__ = 'Restore Sync...';
            await base44.functions.invoke('syncRevenueCatEntitlements', { userId });
            window.__PURCHASE_STATUS__ = 'Restore Done';
            return { ok: true };
        } catch (e) {
            console.error('[PurchaseRouter] Restore error:', e);
            window.__PURCHASE_STATUS__ = `RestErr: ${e.message}`;
            return { ok: false, error: e.message || 'Restore failed' };
        }
    }
};

// Also export named for compatibility if needed
export const isNativeBillingReady = () => PurchaseRouter.isNativeBillingReady();

export default PurchaseRouter;