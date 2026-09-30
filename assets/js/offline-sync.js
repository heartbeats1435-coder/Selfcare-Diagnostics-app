/* file: assets/js/offline-sync.js */
/**
 * Selfcare Diagnostics - Offline Synchronization v4.0.0
 * Smart 15-minute throttling prevents constant GAS network delays on page or app switching.
 * Automatically clears stale deleted items when fresh data arrives.
 */

const OfflineSync = {
  /**
   * Check if sync is required based on 15-minute time threshold
   * @param {string} storeName 
   * @param {number} maxAgeMinutes 
   * @returns {Promise<boolean>}
   */
  async shouldSync(storeName, maxAgeMinutes = 15) {
    try {
      const lastSync = await OfflineDB.getMetadata(`${storeName}LastSync`);
      if (!lastSync) return true;
      const diffMinutes = (new Date() - new Date(lastSync)) / (1000 * 60);
      return diffMinutes > maxAgeMinutes; // 15 mins varaikkum network delay illama local cache use aagum
    } catch (e) {
      return true;
    }
  },

  /**
   * Synchronize tests catalogue into IndexedDB.
   */
  async syncTests(force = false) {
    try {
      if (!force) {
        const needSync = await this.shouldSync('tests', 15);
        if (!needSync) return null;
      }

      const tests = await Api.getTests();
      if (tests && Array.isArray(tests) && tests.length > 0) {
        await OfflineDB.putAll('tests', tests, true);
        await OfflineDB.setMetadata('testsLastSync', new Date().toISOString());
        return tests;
      }
    } catch (error) {
      console.warn('Sync tests failed (offline or network error):', error);
    }
    return null;
  },

  /**
   * Synchronize packages catalogue into IndexedDB
   */
  async syncPackages(force = false) {
    try {
      if (!force) {
        const needSync = await this.shouldSync('packages', 15);
        if (!needSync) return null;
      }

      const packages = await Api.getPackages();
      if (packages && Array.isArray(packages) && packages.length > 0) {
        await OfflineDB.putAll('packages', packages, true);
        await OfflineDB.setMetadata('packagesLastSync', new Date().toISOString());
        return packages;
      }
    } catch (error) {
      console.warn('Sync packages failed (offline or network error):', error);
    }
    return null;
  },

  /**
   * Check for updates in background
   */
  async checkForUpdates(force = false) {
    if (!navigator.onLine) return;

    try {
      await Promise.all([
        this.syncTests(force),
        this.syncPackages(force)
      ]);
      console.log('Background catalogue sync complete.');
    } catch (error) {
      console.error('Background update check error:', error);
    }
  },

  /**
   * Bootstrap local storage on app startup without blocking UI
   */
  async bootstrap() {
    try {
      const localTests = await OfflineDB.getAll('tests');
      
      if (localTests.length === 0 && navigator.onLine) {
        await this.checkForUpdates(true);
      } else {
        setTimeout(() => this.checkForUpdates(false), 2500);
      }
    } catch (error) {
      console.error('OfflineSync bootstrap error:', error);
    }
  }
};

// Global Window Exposure for seamless access across all app pages
if (typeof window !== 'undefined') {
  window.OfflineSync = OfflineSync;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = OfflineSync;
}
