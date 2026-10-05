/* file: assets/js/app.js */
/**
 * Selfcare Diagnostics - Main Application Controller (app.js) v3.3.0 (Zero-Lag Engine)
 * Manages core initialization, instant local-first session restoration,
 * multi-tenant cart state synchronization, ConflictValidator integration,
 * background IndexedDB, and smart dev Service Worker updates.
 */

const App = {
  cart: [],

  async init() {
    try {
      console.log('[Selfcare App] Initializing v3.3.0 (Instant 0ms Mode)...');
      
      // 1. Instant Synchronous User Session Check (No network call, 0ms lag)
      if (typeof Auth !== 'undefined' && Auth.getUser) {
        const currentUser = Auth.getUser();
        if (currentUser) {
          console.log('[Selfcare App] Permanent Active User detected:', currentUser.mobile);
        }
      }

      // 2. Synchronous & Direct Cart Restoration (Vault-aware instant load)
      this.loadCartDirect();

      // 3. Non-blocking Background IndexedDB Initialization
      if (typeof OfflineDB !== 'undefined' && OfflineDB.init) {
        OfflineDB.init().catch(err => console.warn('[Selfcare App] OfflineDB init background notice:', err));
      }

      // 4. Smart Service Worker registration (Dev mode bypass / Production cache)
      this.handleServiceWorker();

      // 5. Non-blocking Background catalogue synchronization
      if (navigator.onLine && typeof OfflineSync !== 'undefined' && OfflineSync.bootstrap) {
        setTimeout(() => {
          OfflineSync.bootstrap().catch(e => console.warn('[Selfcare App] Sync bootstrap notice:', e));
        }, 2000);
      }

      // 6. Navigation listeners (Back button cart sync)
      this.setupNavigationListeners();

      console.log('[Selfcare App] Instant initialization complete.');
    } catch (error) {
      console.error('[Selfcare App] Initialization error:', error);
    }
  },

  /**
   * Instant Synchronous Cart Load:
   * Checks active user vault first to guarantee absolute user isolation.
   */
  loadCartDirect() {
    try {
      let localCart = null;
      if (typeof localStorage !== 'undefined') {
        const activeUser = localStorage.getItem('selfcare_active_user');
        let raw = null;

        if (activeUser) {
          raw = localStorage.getItem(`selfcare_cart_${activeUser}`);
        }

        if (raw === null) {
          raw = localStorage.getItem('selfcare_cart') ?? localStorage.getItem('cart');
        }

        if (raw !== null) {
          try {
            localCart = JSON.parse(raw);
          } catch (e) {}
        }
      }

      if (Array.isArray(localCart)) {
        this.cart = localCart;
      } else {
        this.cart = [];
      }

      this.updateCartUI();
    } catch (e) {
      console.error('[Selfcare App] Direct cart read error:', e);
      this.cart = [];
      this.updateCartUI();
    }
  },

  /**
   * Backward compatible async loadCart
   */
  async loadCart() {
    this.loadCartDirect();
    if (this.cart.length === 0 && typeof OfflineDB !== 'undefined' && OfflineDB.getAll) {
      try {
        const dbCart = await OfflineDB.getAll('cart');
        if (Array.isArray(dbCart) && dbCart.length > 0) {
          this.cart = dbCart;
          this.updateCartUI();
        }
      } catch (e) {}
    }
  },

  /**
   * SMART SERVICE WORKER HANDLER:
   * Acode preview / localhost-il cache lock aagaamal unregister seithu preview tharum.
   */
  handleServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    const isLocalhost = Boolean(
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '' ||
      window.location.port !== '' ||
      window.location.protocol === 'file:'
    );

    if (isLocalhost) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
          registration.unregister().then(() => {
            console.log('[Selfcare App] Localhost dev mode: Unregistered old Service Worker.');
          });
        }
      }).catch(err => console.warn('[Selfcare App] SW unregister notice:', err));

      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      return;
    }

    navigator.serviceWorker.register('service-worker.js').then((registration) => {
      registration.update();
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[Selfcare App] New service worker version available.');
            }
          });
        }
      });
    }).catch((err) => {
      console.warn('[Selfcare App] Service Worker registration failed:', err);
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  },

  /**
   * Universal Save Cart - Syncs memory, localStorage, multi-tenant vault, and background IndexedDB
   */
  async saveCart(newCart) {
    try {
      if (Array.isArray(newCart)) {
        this.cart = newCart;
      }
      const cartStr = JSON.stringify(this.cart);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('cart', cartStr);
        localStorage.setItem('selfcare_cart', cartStr);

        // Multi-tenant isolation: Always save into active user's dedicated vault
        const activeUser = localStorage.getItem('selfcare_active_user');
        if (activeUser) {
          localStorage.setItem(`selfcare_cart_${activeUser}`, cartStr);
        }
      }
      this.updateCartUI();

      // Background IndexedDB write without blocking thread
      if (typeof OfflineDB !== 'undefined' && OfflineDB.saveCart) {
        OfflineDB.saveCart(this.cart).catch(() => {});
      }
    } catch (e) {
      console.error('[Selfcare App] Error saving cart:', e);
    }
  },

  /**
   * Safe Add to Cart with Dynamic ConflictValidator & Parameter Preservation
   */
  async addToCart(item) {
    try {
      if (!item) return;

      const itemId = String(item.TestID || item.PackageID || item.id || '');
      const itemName = item.TestName || item.PackageName || item.name || '';

      // 1. Conflict Check: Validate dynamic backend parameters
      if (typeof ConflictValidator !== 'undefined' && typeof ConflictValidator.checkConflict === 'function') {
        const conflict = ConflictValidator.checkConflict(item, this.cart);
        if (conflict && conflict.hasConflict) {
          if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast(conflict.reason, 'error');
          } else {
            alert(conflict.reason);
          }
          return;
        }
      }
      
      const exists = this.cart.find(c => {
        const cId = String(c.TestID || c.PackageID || c.id || '');
        return cId === itemId;
      });

      if (exists) {
        if (typeof Utils !== 'undefined' && Utils.showToast) {
          Utils.showToast(`${itemName} is already in your cart`, 'info');
        }
        return;
      }

      // Preserves all backend fields (Parameters, TestIDs, Fasting) for downstream validation
      const cartItem = {
        ...item,
        id: itemId,
        TestID: item.TestID || null,
        PackageID: item.PackageID || null,
        name: itemName,
        code: item.TestCode || item.PackageCode || item.code || 'ITEM',
        price: Number(item.OfferPrice || item.price || item.MRP || 0),
        mrp: Number(item.MRP || item.mrp || 0),
        type: item.TestID ? 'test' : (item.PackageID ? 'package' : (item.type || 'item')),
        addedAt: new Date().toISOString()
      };

      this.cart.push(cartItem);
      await this.saveCart(this.cart);

      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast(`${itemName} added to cart`, 'success');
      }
    } catch (e) {
      console.error('[Selfcare App] Error adding to cart:', e);
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('Could not add item to cart', 'error');
      }
    }
  },

  async removeFromCart(itemId) {
    try {
      const sId = String(itemId);
      this.cart = this.cart.filter(c => {
        const cId = String(c.id || c.TestID || c.PackageID || '');
        return cId !== sId;
      });
      await this.saveCart(this.cart);

      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('Item removed from cart', 'info');
      }
    } catch (e) {
      console.error('[Selfcare App] Error removing from cart:', e);
    }
  },

  updateCartBadge() {
    this.updateCartUI();
  },

  updateCartUI() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = this.cart.length;
    badges.forEach(badge => {
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
      } else {
        badge.textContent = '0';
        badge.style.display = 'none';
      }
    });
  },

  setupNavigationListeners() {
    window.addEventListener('pageshow', () => {
      this.loadCartDirect();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.loadCartDirect();
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// Global window exposure
if (typeof window !== 'undefined') {
  window.App = App;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}
