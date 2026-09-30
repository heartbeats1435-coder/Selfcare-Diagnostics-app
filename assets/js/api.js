/* file: assets/js/api.js */
/**
 * Selfcare Diagnostics - API Gateway v4.2.0
 * Handles all network requests to Google Apps Script backend with request deduplication,
 * caching timeout handling, and robust error management.
 */

const Api = {
  activeRequests: new Map(),

  /**
   * Core fetch wrapper with deduplication and error handling
   * @param {string} action - API action name
   * @param {Object} params - Request payload/parameters
   * @param {boolean} useCache - Whether to allow deduplication cache
   * @returns {Promise<any>}
   */
  async request(action, params = {}, useCache = true) {
    const requestKey = `${action}_${JSON.stringify(params)}`;

    if (useCache && this.activeRequests.has(requestKey)) {
      return this.activeRequests.get(requestKey);
    }

    const promise = (async () => {
      try {
        if (!navigator.onLine) {
          throw new Error('No internet connection. Operating in offline mode.');
        }

        const baseUrl = (typeof Config !== 'undefined' && Config.GAS_WEB_APP_URL) ? Config.GAS_WEB_APP_URL : '';
        if (!baseUrl) {
          throw new Error('GAS_WEB_APP_URL is not configured in config.js');
        }

        const url = new URL(baseUrl);
        url.searchParams.append('action', action);

        // Action safety: Body-layum action serthu anuppugirom (GAS redirect loss-ai thadukka)
        const payloadData = {
          action: action,
          ...params
        };

        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8', // Avoid CORS preflight issues with GAS
          },
          body: JSON.stringify(payloadData)
        };

        const controller = new AbortController();
        // 90s timeout for mobile networks and server writes
        const timeoutId = setTimeout(() => controller.abort(), 90000);
        options.signal = controller.signal;

        const response = await fetch(url.toString(), options);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.status === 'error') {
          throw new Error(data.message || 'Unknown server error');
        }

        return data.data !== undefined ? data.data : data;
      } catch (error) {
        console.error(`API Error [${action}]:`, error);
        throw error;
      } finally {
        this.activeRequests.delete(requestKey);
      }
    })();

    if (useCache) {
      this.activeRequests.set(requestKey, promise);
    }

    return promise;
  },

  // ==========================================================
  // AUTHENTICATION & PROFILE APIS
  // ==========================================================

  async requestOtp(mobile) {
    return this.request('requestOtp', { mobile }, false);
  },

  async verifyOtp(mobile, otp) {
    return this.request('verifyOtp', { mobile, otp }, false);
  },

  async staffLogin(id, password) {
    return this.request('staffLogin', { id, password }, false);
  },

  async getProfile(userId) {
    return this.request('getProfile', { userId }, false);
  },

  async updateProfile(profileData) {
    return this.request('updateProfile', profileData, false);
  },

  // ==========================================================
  // CATALOGUE APIS
  // ==========================================================

  async getTests() {
    return this.request('getTests', {}, false);
  },

  async getTestById(testId) {
    return this.request('getTestById', { testId }, false);
  },

  async searchTests(query) {
    return this.request('searchTests', { query }, false);
  },

  async getPackages() {
    return this.request('getPackages', {}, false);
  },

  async getPackageById(packageId) {
    return this.request('getPackageById', { packageId }, false);
  },

  async searchPackages(query) {
    return this.request('searchPackages', { query }, false);
  },

  // ==========================================================
  // PRESCRIPTION & OCR APIS (IMAGES ONLY)
  // ==========================================================

  async uploadPrescription(payload) {
    return this.request('uploadPrescription', payload, false);
  },

  async processPrescriptionOCR(base64Data, mimeType, optionalParams = {}) {
    return this.request('processPrescriptionOCR', { base64Data, mimeType, ...optionalParams }, false);
  },

  async matchPrescriptionTests(ocrText) {
    return this.request('matchPrescriptionTests', { ocrText }, false);
  },

  async getPrescriptionMatches(prescriptionId) {
    return this.request('getPrescriptionMatches', { prescriptionId }, false);
  },

  async confirmPrescriptionTests(prescriptionId, confirmedTestIds) {
    return this.request('confirmPrescriptionTests', { prescriptionId, confirmedTestIds }, false);
  },

  async aiSearch(query) {
    return this.request('aiSearch', { query }, false);
  },

  // ==========================================================
  // BOOKINGS & LIVE SAMPLE TRACKING APIS
  // ==========================================================

  async createBooking(bookingData) {
    return this.request('createBooking', bookingData, false);
  },

  async getBookingDetails(bookingId) {
    return this.request('getBookingDetails', { bookingId }, false);
  },

  async getBookingsByPatient(patientPhone) {
    return this.request('getBookingsByPatient', { patientPhone }, false);
  },

  // ==========================================================
  // DIRECT UPI INTENT APIS
  // ==========================================================

  async createPendingUPIBooking(pendingPayload) {
    return this.request('createPendingUPIBooking', pendingPayload, false);
  },

  async updateUPIPaymentStatus(updatePayload) {
    return this.request('updateUPIPaymentStatus', updatePayload, false);
  },

  async getPaymentStatus(bookingId, paymentReference) {
    return this.request('getPaymentStatus', { bookingId, paymentReference }, false);
  }
};

// Global scope exposure
if (typeof window !== 'undefined') {
  window.Api = Api;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Api;
}
