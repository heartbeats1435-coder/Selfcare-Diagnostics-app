/* file: assets/js/offline-db.js */
/**
 * Selfcare Diagnostics - Offline Database (IndexedDB) v4.0.0
 * Hardened against mobile backgrounding deadlocks, multiple-tab lockouts,
 * with 800ms auto-timeout safeguard, LocalStorage instant fallback,
 * and Multi-tenant Cart Vault synchronization.
 */

const OfflineDB = {
  db: null,

  async init() {
    // Check if existing database connection is active and valid
    if (this.db) {
      try {
        this.db.transaction('tests', 'readonly');
        return this.db;
      } catch (e) {
        this.db = null; // Connection expired or closed by OS
      }
    }

    return new Promise((resolve) => {
      const dbName = (typeof Config !== 'undefined' && Config.DB_NAME) ? Config.DB_NAME : 'selfcare_db';
      const dbVersion = (typeof Config !== 'undefined' && Config.DB_VERSION) ? Config.DB_VERSION : 1;

      // 1.2s Timeout Safeguard: Database open aagalaati hang aaga vidaama resolve pannidum
      const timer = setTimeout(() => {
        console.warn('IndexedDB open timeout - falling back to memory/local');
        resolve(null);
      }, 1200);

      try {
        const request = indexedDB.open(dbName, dbVersion);

        // When another page/tab is locking the DB
        request.onblocked = () => {
          clearTimeout(timer);
          console.warn('IndexedDB blocked by active connection');
          resolve(null);
        };

        request.onerror = (event) => {
          clearTimeout(timer);
          console.error('IndexedDB open error:', event.target.error);
          resolve(null);
        };

        request.onsuccess = (event) => {
          clearTimeout(timer);
          this.db = event.target.result;

          this.db.onversionchange = () => {
            if (this.db) this.db.close();
            this.db = null;
          };

          this.db.onclose = () => {
            this.db = null;
          };

          resolve(this.db);
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          const stores = ['tests', 'packages', 'packageTests', 'offers', 'cart', 'appState', 'metadata'];

          stores.forEach(storeName => {
            if (!db.objectStoreNames.contains(storeName)) {
              if (storeName === 'metadata' || storeName === 'appState') {
                db.createObjectStore(storeName);
              } else if (storeName === 'tests') {
                db.createObjectStore(storeName, { keyPath: 'TestID' });
              } else if (storeName === 'packages') {
                db.createObjectStore(storeName, { keyPath: 'PackageID' });
              } else {
                db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
              }
            }
          });
        };
      } catch (err) {
        clearTimeout(timer);
        resolve(null);
      }
    });
  },

  /**
   * Safe getAll with 800ms race-timeout and LocalStorage backup
   */
  async getAll(storeName) {
    return new Promise(async (resolve) => {
      const timeout = setTimeout(() => {
        console.warn(`Timeout reading ${storeName}, using localStorage backup`);
        try {
          const backup = localStorage.getItem(`cache_${storeName}`);
          resolve(backup ? JSON.parse(backup) : []);
        } catch (e) {
          resolve([]);
        }
      }, 800);

      try {
        const db = await this.init();
        if (!db) {
          clearTimeout(timeout);
          const backup = localStorage.getItem(`cache_${storeName}`);
          return resolve(backup ? JSON.parse(backup) : []);
        }

        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          clearTimeout(timeout);
          const result = request.result || [];
          if (result.length > 0) {
            try {
              localStorage.setItem(`cache_${storeName}`, JSON.stringify(result));
            } catch (e) {}
          }
          resolve(result);
        };

        request.onerror = () => {
          clearTimeout(timeout);
          const backup = localStorage.getItem(`cache_${storeName}`);
          resolve(backup ? JSON.parse(backup) : []);
        };
      } catch (err) {
        clearTimeout(timeout);
        const backup = localStorage.getItem(`cache_${storeName}`);
        resolve(backup ? JSON.parse(backup) : []);
      }
    });
  },

  async putAll(storeName, items, clearFirst = true) {
    // Also save in localStorage backup immediately
    if (Array.isArray(items) && items.length > 0) {
      try {
        localStorage.setItem(`cache_${storeName}`, JSON.stringify(items));
      } catch (e) {}
    }

    return new Promise(async (resolve) => {
      const timeout = setTimeout(() => {
        resolve(true); // Don't hang UI even if transaction is slow
      }, 1500);

      try {
        const db = await this.init();
        if (!db) {
          clearTimeout(timeout);
          return resolve(true);
        }

        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        transaction.oncomplete = () => {
          clearTimeout(timeout);
          resolve(true);
        };

        transaction.onerror = () => {
          clearTimeout(timeout);
          resolve(true);
        };

        if (clearFirst) {
          store.clear();
        }

        if (Array.isArray(items)) {
          items.forEach(item => store.put(item));
        }
      } catch (err) {
        clearTimeout(timeout);
        resolve(true);
      }
    });
  },

  async getById(storeName, key) {
    try {
      const all = await this.getAll(storeName);
      return all.find(item => (item.TestID === key || item.PackageID === key || item.id === key)) || null;
    } catch (e) {
      return null;
    }
  },

  async clear(storeName) {
    try {
      localStorage.removeItem(`cache_${storeName}`);
      const db = await this.init();
      if (!db) return true;
      return new Promise((resolve) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        store.clear();
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => resolve(true);
      });
    } catch (e) {
      return true;
    }
  },

  async setMetadata(key, value) {
    try {
      localStorage.setItem(`meta_${key}`, JSON.stringify(value));
      const db = await this.init();
      if (!db) return true;
      const transaction = db.transaction('metadata', 'readwrite');
      transaction.objectStore('metadata').put(value, key);
      return true;
    } catch (e) {
      return true;
    }
  },

  async getMetadata(key) {
    try {
      const localVal = localStorage.getItem(`meta_${key}`);
      if (localVal) return JSON.parse(localVal);
      const db = await this.init();
      if (!db) return null;
      return new Promise((resolve) => {
        const req = db.transaction('metadata', 'readonly').objectStore('metadata').get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  },

  /**
   * Universal Vault-Aware Cart Saver
   */
  async saveCart(cartItems) {
    try {
      const cartStr = JSON.stringify(cartItems || []);
      localStorage.setItem('cart', cartStr);
      localStorage.setItem('selfcare_cart', cartStr);

      // Multi-tenant isolation: Guaranteed update into active user's dedicated vault
      const activeUser = localStorage.getItem('selfcare_active_user');
      if (activeUser) {
        localStorage.setItem(`selfcare_cart_${activeUser}`, cartStr);
      }

      const db = await this.init();
      if (!db) return true;
      const transaction = db.transaction('cart', 'readwrite');
      const store = transaction.objectStore('cart');
      store.clear();
      if (Array.isArray(cartItems)) {
        cartItems.forEach(item => store.put(item));
      }
      return true;
    } catch (e) {
      return true;
    }
  },

  /**
   * Universal Vault-Aware Cart Reader
   */
  async getCart() {
    try {
      const activeUser = localStorage.getItem('selfcare_active_user');
      let raw = null;

      if (activeUser) {
        raw = localStorage.getItem(`selfcare_cart_${activeUser}`);
      }

      if (raw === null) {
        raw = localStorage.getItem('selfcare_cart') || localStorage.getItem('cart');
      }

      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
};

// Global Window Exposure for seamless cross-module access
if (typeof window !== 'undefined') {
  window.OfflineDB = OfflineDB;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = OfflineDB;
}
