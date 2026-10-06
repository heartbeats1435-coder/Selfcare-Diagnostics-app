/* file: assets/js/bookings.js */
/**
 * Selfcare Diagnostics - Direct Family & Patient Booking Tracker Engine v5.0.0
 * Features:
 * 1. Add-on Tests to Existing Booking trigger -> Direct transfer to Cart Slide 3 (Payment & Offers).
 * 2. Live Google Sheets Backend Sync via Api.getBookingsByPatient.
 * 3. Multi-Patient Support with Family Vault Awareness (selfcare_family_${mobile}).
 * 4. Production-safe: Strictly blocks fake mock bookings when user is authenticated.
 * 5. Full safe fallbacks for Utils and zero UI glitch rendering.
 */

const BookingsPage = {
  patientsList: [],
  allBookings: [],
  selectedPatientId: null,
  currentActiveBooking: null,

  async init() {
    try {
      this.loadPatientsAndBookings();
      this.renderPatientChips();
      await this.autoSelectInitialPatientOrUrlTarget();
      this.syncLiveCloudBookings();
    } catch (err) {
      console.error('[Bookings] Init error:', err);
    }
  },

  safeEscape(str) {
    if (typeof Utils !== 'undefined' && Utils.escapeHtml) {
      return Utils.escapeHtml(str);
    }
    return String(str || '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
  },

  safeFormatCurrency(amt) {
    if (typeof Utils !== 'undefined' && Utils.formatCurrency) {
      return Utils.formatCurrency(amt);
    }
    return '₹' + Math.round(Number(amt) || 0).toLocaleString('en-IN');
  },

  safeShowToast(msg, type = 'info') {
    if (typeof Utils !== 'undefined' && Utils.showToast) {
      Utils.showToast(msg, type);
    } else {
      alert(msg);
    }
  },

  loadPatientsAndBookings(skipMockSeeding = false) {
    let savedPatients = [];
    let savedBookings = [];

    let selfName = 'Customer (Self)';
    let currentMobile = '';

    const storedUser = (typeof Auth !== 'undefined' && Auth.getUser && Auth.getUser()) || null;
    if (storedUser) {
      if (storedUser.name) selfName = storedUser.name;
      currentMobile = storedUser.mobile || storedUser.phone || '';
    } else {
      try {
        const selfProfile = localStorage.getItem('selfcare_customer_profile');
        if (selfProfile) {
          const parsed = JSON.parse(selfProfile);
          if (parsed && (parsed.name || parsed.FullName)) {
            selfName = parsed.name || parsed.FullName;
          }
          if (parsed && (parsed.mobile || parsed.phone)) {
            currentMobile = parsed.mobile || parsed.phone;
          }
        }
      } catch (e) {}
    }

    if (!currentMobile) {
      currentMobile = localStorage.getItem('selfcare_active_user') || '';
    }

    let familyMembers = [];
    try {
      let famStored = null;
      if (currentMobile) {
        famStored = localStorage.getItem(`selfcare_family_${currentMobile}`);
      }
      if (!famStored) {
        famStored = localStorage.getItem('selfcare_family_members');
      }
      if (famStored) {
        const parsedFam = JSON.parse(famStored);
        if (Array.isArray(parsedFam) && parsedFam.length > 0) {
          familyMembers = parsedFam;
        }
      }
    } catch (e) {}

    try {
      const storedBookings = localStorage.getItem('selfcare_recent_bookings') || localStorage.getItem('selfcare_all_bookings');
      if (storedBookings) {
        const parsed = JSON.parse(storedBookings);
        if (Array.isArray(parsed) && parsed.length > 0) {
          savedBookings = parsed;
        }
      }
    } catch (e) {}

    // PRODUCTION GUARD: Authenticated users must NEVER be polluted with dummy/mock bookings
    const isLoggedIn = typeof Auth !== 'undefined' && Auth.isLoggedIn && Auth.isLoggedIn();
    const shouldSkipMock = skipMockSeeding || isLoggedIn;

    if (savedBookings.length === 0 && !shouldSkipMock) {
      // Mock data seeded ONLY for unauthenticated first-time preview visitors
      savedPatients = [
        {
          id: 'patient_self',
          name: selfName !== 'Customer (Self)' ? selfName : 'Valued Customer',
          relation: 'Self'
        },
        {
          id: 'patient_spouse',
          name: familyMembers[0]?.name || 'Family Member 1',
          relation: familyMembers[0]?.relation || 'Spouse'
        },
        {
          id: 'patient_father',
          name: familyMembers[1]?.name || 'Family Member 2',
          relation: familyMembers[1]?.relation || 'Father'
        }
      ];

      savedBookings = [
        {
          bookingId: 'SCDBOOK000214',
          patientId: 'patient_self',
          patientName: savedPatients[0].name,
          relation: 'Self',
          collectionType: 'home',
          collectionDate: 'Today',
          timeSlot: '07:30 AM - 08:00 AM',
          paymentStatus: 'PAYMENT_SUCCESS',
          bookingStatus: 'TECHNICIAN_ASSIGNED',
          finalAmount: 1799,
          address: 'Doorstep pickup registered, Chennai',
          currentStage: 2,
          items: [
            { name: 'Selfcare Elite Health Panel (85+ Tests)', price: 1799 }
          ]
        }
      ];

      localStorage.setItem('selfcare_recent_bookings', JSON.stringify(savedBookings));
    } else {
      const patientMap = new Map();
      patientMap.set('self', { id: 'self', name: selfName, relation: 'Self' });

      familyMembers.forEach((fm, idx) => {
        const key = fm.id || fm.name || `fam_${idx}`;
        patientMap.set(key, {
          id: key,
          name: fm.name || `Member ${idx + 1}`,
          relation: fm.relation || 'Family'
        });
      });

      savedBookings.forEach(b => {
        const pName = b.patientName || selfName;
        const pKey = b.patientId || pName;
        if (!patientMap.has(pKey)) {
          patientMap.set(pKey, {
            id: pKey,
            name: pName,
            relation: b.relation || 'Member'
          });
        }
      });

      savedPatients = Array.from(patientMap.values());
    }

    this.patientsList = savedPatients;
    this.allBookings = savedBookings;
  },

  async syncLiveCloudBookings() {
    if (!navigator.onLine || typeof Api === 'undefined') return;
    const user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
    const mobile = user ? (user.mobile || user.phone) : (localStorage.getItem('selfcare_active_user') || null);
    if (!mobile) return;

    try {
      let liveBookings = null;
      if (typeof Api.getBookingsByPatient === 'function') {
        liveBookings = await Api.getBookingsByPatient(mobile);
      } else if (typeof Api.request === 'function') {
        liveBookings = await Api.request('getBookingsByPatient', { patientPhone: mobile }, false);
      }

      if (Array.isArray(liveBookings) && liveBookings.length > 0) {
        const isMock = (id) => ['SCDBOOK000214', 'SCDBOOK000198', 'SCDBOOK000185'].includes(id);
        const existing = this.allBookings.filter(b => !isMock(b.bookingId));

        const bookingMap = new Map();
        liveBookings.forEach(b => bookingMap.set(b.bookingId, b));
        existing.forEach(b => {
          if (!bookingMap.has(b.bookingId)) bookingMap.set(b.bookingId, b);
        });

        this.allBookings = Array.from(bookingMap.values());
        localStorage.setItem('selfcare_recent_bookings', JSON.stringify(this.allBookings));

        this.loadPatientsAndBookings(true);
        this.renderPatientChips();
        this.autoSelectInitialPatientOrUrlTarget();
      }
    } catch (err) {
      console.warn('[Bookings] Live cloud sync notice:', err);
    }
  },

  renderPatientChips() {
    const container = document.getElementById('patient-chips-list');
    if (!container) return;

    if (!this.patientsList || this.patientsList.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = this.patientsList.map((p, idx) => {
      const initial = (p.name || 'U').charAt(0).toUpperCase();
      return `
        <div class="patient-chip ${idx === 0 ? 'active' : ''}" 
             id="chip-${idx}" 
             onclick="BookingsPage.selectPatientByIndex(${idx})">
          <div class="chip-avatar">${initial}</div>
          <div class="chip-info">
            <span class="chip-name">${this.safeEscape(p.name)}</span>
            <span class="chip-relation">${this.safeEscape(p.relation)}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  async autoSelectInitialPatientOrUrlTarget() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetBookingId = urlParams.get('id') || urlParams.get('bookingId');
    const targetPatient = urlParams.get('patient');

    if (targetBookingId) {
      const cleanBId = targetBookingId.trim().toUpperCase();
      let match = this.allBookings.find(b => (b.bookingId || '').toUpperCase() === cleanBId);

      if (!match && navigator.onLine && typeof Api !== 'undefined' && typeof Api.getBookingDetails === 'function') {
        try {
          const fetched = await Api.getBookingDetails(cleanBId);
          if (fetched && fetched.bookingId) {
            match = fetched;
            this.allBookings.unshift(fetched);
            this.loadPatientsAndBookings(true);
            this.renderPatientChips();
          }
        } catch (e) {
          console.warn('[Bookings] URL booking fetch notice:', e);
        }
      }

      if (match) {
        const pIdx = this.patientsList.findIndex(p => 
          (match.patientId && p.id === match.patientId) ||
          p.name.toLowerCase() === (match.patientName || '').toLowerCase()
        );
        this.selectPatientByIndex(pIdx >= 0 ? pIdx : 0, match.bookingId);
        return;
      }
    }

    if (targetPatient) {
      const pIdx = this.patientsList.findIndex(p => p.name.toLowerCase().includes(targetPatient.toLowerCase()));
      if (pIdx >= 0) {
        this.selectPatientByIndex(pIdx);
        return;
      }
    }

    this.selectPatientByIndex(0);
  },

  selectPatientByIndex(idx, preferredBookingId = null) {
    const patient = this.patientsList[idx];
    if (!patient) return;

    this.selectedPatientId = patient.id;

    document.querySelectorAll('.patient-chip').forEach((chip, i) => {
      chip.classList.toggle('active', i === idx);
    });

    const patientBookings = this.allBookings.filter(b => {
      if (b.patientId && patient.id && patient.id !== 'self') {
        return b.patientId === patient.id || (b.patientName || '').toLowerCase() === patient.name.toLowerCase();
      }
      return (b.patientName || '').toLowerCase() === patient.name.toLowerCase();
    });

    const activeView = document.getElementById('active-track-view');
    const emptyView = document.getElementById('patient-empty-state');
    const subnav = document.getElementById('patient-bookings-subnav');

    if (patientBookings.length === 0) {
      if (activeView) activeView.style.display = 'none';
      if (subnav) subnav.style.display = 'none';
      if (emptyView) {
        emptyView.style.display = 'flex';
        const titleEl = document.getElementById('empty-patient-title');
        const descEl = document.getElementById('empty-patient-desc');
        if (titleEl) titleEl.textContent = `No Bookings for ${patient.name}`;
        if (descEl) descEl.textContent = `There are no scheduled tests for ${patient.name} (${patient.relation}) currently.`;
      }
      return;
    }

    if (emptyView) emptyView.style.display = 'none';
    if (activeView) activeView.style.display = 'block';

    if (patientBookings.length > 1) {
      if (subnav) {
        subnav.style.display = 'flex';
        let selectedBId = preferredBookingId || patientBookings[0].bookingId;

        subnav.innerHTML = patientBookings.map(b => `
          <button type="button" class="booking-subtab ${b.bookingId === selectedBId ? 'active' : ''}" 
                  onclick="BookingsPage.selectSpecificBooking('${b.bookingId}')">
            ${this.safeEscape(b.bookingId)} (${this.safeEscape(b.collectionDate || 'Recent')})
          </button>
        `).join('');

        const activeBooking = patientBookings.find(b => b.bookingId === selectedBId) || patientBookings[0];
        this.renderBookingDetails(activeBooking);
      }
    } else {
      if (subnav) subnav.style.display = 'none';
      this.renderBookingDetails(patientBookings[0]);
    }
  },

  selectSpecificBooking(bookingId) {
    const booking = this.allBookings.find(b => b.bookingId === bookingId);
    if (!booking) return;

    document.querySelectorAll('.booking-subtab').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.includes(bookingId));
    });

    this.renderBookingDetails(booking);
  },

  getBookingStage(booking) {
    if (booking.currentStage) return Number(booking.currentStage);
    const bStatus = String(booking.bookingStatus || '').toUpperCase();

    if (bStatus.includes('REPORT') || bStatus.includes('COMPLETED')) return 5;
    if (bStatus.includes('TRANSIT') || bStatus.includes('IN_LAB')) return 4;
    if (bStatus.includes('SAMPLE_COLLECTED') || bStatus.includes('DRAWN')) return 3;
    if (bStatus.includes('ASSIGNED') || bStatus.includes('IN_PROGRESS')) return 2;
    return 1;
  },

  renderBookingDetails(booking) {
    this.currentActiveBooking = booking;

    const idEl = document.getElementById('disp-booking-id');
    const modeEl = document.getElementById('disp-collection-mode');
    const patientEl = document.getElementById('disp-patient-name');
    const slotEl = document.getElementById('disp-time-slot');
    const paymentEl = document.getElementById('disp-payment-status');
    const amtEl = document.getElementById('disp-amount-val');
    const locBox = document.getElementById('disp-location-box');
    const locIcon = document.getElementById('disp-location-icon');
    const locText = document.getElementById('disp-location-text');

    const isLab = booking.collectionType === 'lab' || String(booking.address || '').includes('Direct Lab');

    if (idEl) idEl.textContent = booking.bookingId;
    if (modeEl) {
      modeEl.textContent = isLab ? '🔬 Lab Walk-in' : '🏠 Home Pickup';
      modeEl.className = `meta-mode-badge ${isLab ? 'lab-mode' : 'home-mode'}`;
    }

    if (patientEl) {
      patientEl.textContent = `${booking.patientName || 'Patient'} (${booking.relation || 'Self'})`;
    }

    if (slotEl) {
      slotEl.textContent = `${booking.collectionDate || 'Today'} • ${booking.timeSlot || '07:30 AM - 08:00 AM'}`;
    }

    if (paymentEl) {
      const isPaid = (booking.paymentStatus || '').includes('SUCCESS');
      paymentEl.textContent = isPaid ? '✅ Paid Online' : '💵 Cash on Visit';
      paymentEl.style.color = isPaid ? '#059669' : '#D97706';
    }

    if (amtEl) amtEl.textContent = this.safeFormatCurrency(booking.finalAmount || 0);

    if (locBox && locText && locIcon) {
      if (isLab) {
        locIcon.textContent = '🏢';
        locText.textContent = 'Selfcare Diagnostics Central Laboratory, Chennai';
      } else {
        locIcon.textContent = '🏠';
        locText.textContent = booking.address || 'Doorstep sample pickup registered';
      }
    }

    this.renderTimelineStepper(booking);
    this.renderBookedTests(booking);
  },

  renderTimelineStepper(booking) {
    const container = document.getElementById('tracking-stepper-list');
    if (!container) return;

    const isLab = booking.collectionType === 'lab' || String(booking.address || '').includes('Direct Lab');
    const stage = this.getBookingStage(booking);

    const homeSteps = [
      {
        num: 1,
        title: 'Order Confirmed',
        desc: 'Doorstep pickup appointment confirmed in our system.',
        time: 'Booking Confirmed'
      },
      {
        num: 2,
        title: 'Phlebotomist Assigned',
        desc: 'Field technician assigned with sterile barcoded vacutainers.',
        time: stage === 2 ? 'In Progress' : (stage > 2 ? 'Completed' : 'Pending')
      },
      {
        num: 3,
        title: 'Doorstep Sample Collection',
        desc: 'Technician will visit your address at scheduled 30-min window.',
        time: stage === 3 ? 'Arriving Soon' : (stage > 3 ? 'Done' : 'Upcoming')
      },
      {
        num: 4,
        title: 'Cold-Chain Transport to Lab',
        desc: 'Barcoded samples transported safely under 2°C-8°C ice-box.',
        time: stage === 4 ? 'In Transit' : (stage > 4 ? 'Done' : 'Upcoming')
      },
      {
        num: 5,
        title: 'Certified NABL Report Ready',
        desc: 'Signed laboratory report delivered to WhatsApp & app.',
        time: stage === 5 ? 'Report Ready' : 'Same Day'
      }
    ];

    const labSteps = [
      {
        num: 1,
        title: 'Appointment Confirmed',
        desc: 'Lab appointment slot confirmed and registered in lab queue.',
        time: 'Confirmed'
      },
      {
        num: 2,
        title: 'Arrive at Diagnostic Center',
        desc: 'Please visit lab counter at your scheduled time slot.',
        time: stage === 2 ? 'Next Action' : (stage > 2 ? 'Done' : 'Pending')
      },
      {
        num: 3,
        title: 'Sample Collection at Lab',
        desc: 'Certified phlebotomist will draw blood / urine sample.',
        time: stage === 3 ? 'Sampling Now' : (stage > 3 ? 'Done' : 'Pending')
      },
      {
        num: 4,
        title: 'Clinical Barcoded Testing',
        desc: 'Sample undergoing certified NABL quality analyzer tests.',
        time: stage === 4 ? 'In Testing' : (stage > 4 ? 'Done' : 'Pending')
      },
      {
        num: 5,
        title: 'Reports Verified & Ready',
        desc: 'Official digital report available via WhatsApp & Reports tab.',
        time: stage === 5 ? 'Ready' : 'Within 6-12 Hrs'
      }
    ];

    const steps = isLab ? labSteps : homeSteps;

    container.innerHTML = steps.map(s => {
      let statusClass = 'pending';
      let icon = '○';

      if (s.num < stage) {
        statusClass = 'completed';
        icon = '✓';
      } else if (s.num === stage) {
        statusClass = 'active';
        icon = '●';
      }

      return `
        <div class="step-item ${statusClass}">
          <div class="step-node">${icon}</div>
          <div class="step-content">
            <strong>${this.safeEscape(s.title)}</strong>
            <p>${this.safeEscape(s.desc)}</p>
            <span class="step-time-badge">${this.safeEscape(s.time)}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  renderBookedTests(booking) {
    const container = document.getElementById('disp-tests-list');
    if (!container) return;

    let items = booking.items;
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch (e) { items = []; }
    }
    items = Array.isArray(items) && items.length > 0 ? items : [
      { name: 'Complete Blood Count (CBC)', price: 250 }
    ];

    const stage = this.getBookingStage(booking);
    const canAddTests = stage <= 2;

    let html = items.map(item => `
      <div class="test-summary-row">
        <span>🧪 ${this.safeEscape(item.name || item.TestName || 'Diagnostic Checkup')}</span>
        <strong>${this.safeFormatCurrency(item.price || item.OfferPrice || 0)}</strong>
      </div>
    `).join('');

    if (canAddTests) {
      html += `
        <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed rgba(7, 136, 102, 0.25); display: flex; justify-content: space-between; align-items: center; background: #F0FDF9; padding: 10px 12px; border-radius: 10px;">
          <div>
            <strong style="font-size: 12px; color: #045D49; display: block;">Want to add more tests to this visit?</strong>
            <span style="font-size: 10px; color: #536E66;">Home collection fee ₹0 FREE (Clubbed)</span>
          </div>
          <button type="button" class="add-tests-action-btn" onclick="BookingsPage.goToAddTests('${booking.bookingId}')" style="background: linear-gradient(135deg, #078866, #045D49); color: #ffffff; border: none; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 5px; box-shadow: 0 3px 10px rgba(7, 136, 102, 0.25); white-space: nowrap;">
            <span>➕</span> Add Tests
          </button>
        </div>
      `;
    }

    container.innerHTML = html;
  },

  /**
   * Direct Transition to Cart Slide 3 (Payment & Offers)
   */
  goToAddTests(bookingId) {
    const booking = bookingId ? this.allBookings.find(b => b.bookingId === bookingId) : this.currentActiveBooking;
    if (!booking) {
      this.safeShowToast('Could not load booking details', 'error');
      return;
    }

    sessionStorage.setItem('selfcare_addon_booking', JSON.stringify(booking));
    localStorage.setItem('selfcare_active_addon_booking_id', booking.bookingId);
    localStorage.setItem('selfcare_active_addon_booking_data', JSON.stringify(booking));

    // Direct redirect to Slide 3 in Cart Page
    window.location.href = `cart.html?addonBookingId=${encodeURIComponent(booking.bookingId)}&slide=3`;
  },

  openWhatsAppSupport() {
    const booking = this.currentActiveBooking || {};
    const bId = booking.bookingId || 'My Booking';
    const patient = booking.patientName || 'Self';
    const slot = booking.timeSlot || 'Scheduled Slot';

    const msg = `Hello Selfcare Diagnostics, I need an update regarding sample collection for Booking ID: *${bId}* (Patient: ${patient}, Slot: ${slot}). Please assist.`;
    window.location.href = `https://wa.me/917010174890?text=${encodeURIComponent(msg)}`;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  BookingsPage.init();
});

if (typeof window !== 'undefined') {
  window.BookingsPage = BookingsPage;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BookingsPage;
}
