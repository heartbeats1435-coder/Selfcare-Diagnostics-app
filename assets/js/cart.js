/* file: assets/js/cart.js */
/**
 * Selfcare Diagnostics - Slide-by-Slide Wizard Engine v7.4.0
 * Features:
 * 1. 3-Part Fixed Control Bar: [Left: Back / Exit] | [Center: Highlighted Grand Total] | [Right: Next / Confirm]
 * 2. Add-on Mode: Directly lands on Slide 3 (Payment & Offers). Slides 1 & 2 are strictly blocked!
 * 3. Left button displays '✕ Exit' in Add-on Mode, and '← Back' in normal mode (from Slide 2 onwards).
 * 4. High-End 3D Animated UPI Modal with glowing pulsing ring.
 */

const CartPage = {
  currentSlide: 1,
  totalSlides: 4,
  cart: [],
  familyMembers: [],
  selectedPatientId: 'SELF',
  selectedPatientName: 'Self',
  selectedPatientPhone: '',
  selectedPatientEmail: '',
  selectedPatientRelation: 'Self',
  selectedPatientAge: '',
  selectedPatientGender: '',
  selectedSlotDay: 'Today',
  selectedTimeSlot: '',

  selectedPaymentMode: null, // Strictly null by default
  collectionType: null, // Strictly null by default
  appliedCoupon: null,
  couponDiscountAmount: 0,
  onlineDiscountAmount: 0,
  doorstepCharge: 100,

  currentPickupAddress: 'Chennai, Tamil Nadu',
  currentPickupLocation: 'Not set',

  // Add-on Engine State
  isAddonMode: false,
  addonBookingId: null,
  addonBooking: null,
  existingBookingItems: [],

  // Direct UPI Intent State
  isProcessingCheckout: false,
  currentPendingBooking: null,
  intentLaunchTime: 0,
  fallbackTimerId: null,

  adminCoupons: [
    {
      code: 'SELFCARE10',
      title: 'Flat 10% Laboratory Discount',
      discountPercent: 10,
      validUntil: '2026-12-31',
      description: 'Valid on all preventive panels and blood tests'
    },
    {
      code: 'HEALTH2026',
      title: 'New Year Health Saver',
      discountPercent: 10,
      validUntil: '2026-10-31',
      description: 'Special seasonal checkup savings'
    }
  ],

  async init() {
    try {
      this.detectAddonBookingMode();
      this.loadCartData();
      this.loadPatientAndAddressData();
      this.checkAutoAppliedCoupon();
      this.populateTimeSlotsDropdown();
      this.renderCartUI();
      this.updateCartBadgeUI();
      this.setupUPIAppReturnListeners();

      const urlParams = (typeof window !== 'undefined') ? new URLSearchParams(window.location.search) : null;
      const requestedSlide = urlParams ? parseInt(urlParams.get('slide'), 10) : null;

      if (this.isAddonMode) {
        // Direct land on Slide 3 (Payment & Offers) for Add-on test flows
        this.goToSlide(3, true);
        this.updateAddonStepperUI();
      } else if (requestedSlide && requestedSlide >= 1 && requestedSlide <= 4) {
        this.goToSlide(requestedSlide, true);
      } else {
        this.goToSlide(1);
      }
    } catch (err) {
      console.error('CartPage init error:', err);
    }
  },

  // ==========================================================
  // SLIDE-BY-SLIDE WIZARD NAVIGATION WITH ADD-ON LOCKOUT
  // ==========================================================
  goToSlide(slideIndex, force = false) {
    if (slideIndex < 1 || slideIndex > this.totalSlides) return;

    // RULE 1: In Add-on mode, Slides 1 & 2 are STRICTLY LOCKED OUT
    if (this.isAddonMode && slideIndex < 3) {
      Utils.showToast('Patient details and collection mode are locked to this booking', 'info');
      return;
    }

    // Normal Flow Validations
    if (!force && !this.isAddonMode) {
      if (slideIndex > 1 && !this.collectionType) {
        Utils.showToast('Please select Home Pickup or Lab Walk-in to continue', 'error');
        return;
      }
      if (slideIndex > 2) {
        if (!this.selectedPatientPhone || this.selectedPatientPhone.length !== 10) {
          Utils.showToast(`Please enter a valid 10-digit mobile number for ${this.selectedPatientName}`, 'error');
          return;
        }
        if (this.collectionType === 'home' && (!this.currentPickupAddress || !this.currentPickupAddress.trim())) {
          Utils.showToast('Please provide a valid doorstep pickup address', 'error');
          return;
        }
        if (!this.selectedTimeSlot) {
          Utils.showToast('Please select a 30-minute collection time slot', 'error');
          return;
        }
      }
      if (slideIndex > 3 && !this.selectedPaymentMode) {
        Utils.showToast('Please select a payment method (UPI or Cash) to proceed', 'error');
        return;
      }
    }

    // Add-on mode: Moving from Slide 3 to 4 requires payment mode selection
    if (this.isAddonMode && slideIndex === 4 && !this.selectedPaymentMode) {
      Utils.showToast('Please select a payment method (UPI or Cash) to view summary', 'error');
      return;
    }

    this.currentSlide = slideIndex;

    // Slide visibility & Stepper nodes toggle
    for (let i = 1; i <= this.totalSlides; i++) {
      const slideEl = document.getElementById(`cart-slide-${i}`);
      const stepNode = document.getElementById(`step-node-${i}`);
      const connector = document.getElementById(`connector-${i}`);

      if (slideEl) slideEl.classList.toggle('active', i === slideIndex);
      if (stepNode) {
        stepNode.classList.toggle('active', i === slideIndex);
        stepNode.classList.toggle('completed', i < slideIndex);
      }
      if (connector) connector.classList.toggle('filled', i < slideIndex);
    }

    this.updateBottomControlBarUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  tryJumpToSlide(targetSlide) {
    if (this.isAddonMode && targetSlide < 3) {
      Utils.showToast('Collection type & Patient details are locked for this booking', 'info');
      return;
    }
    this.goToSlide(targetSlide);
  },

  updateAddonStepperUI() {
    const node1 = document.getElementById('step-node-1');
    const node2 = document.getElementById('step-node-2');
    const conn1 = document.getElementById('connector-1');
    const conn2 = document.getElementById('connector-2');

    if (node1) {
      node1.classList.add('locked', 'completed');
      node1.style.pointerEvents = 'none';
      node1.title = 'Locked with booking';
    }
    if (node2) {
      node2.classList.add('locked', 'completed');
      node2.style.pointerEvents = 'none';
      node2.title = 'Locked with booking';
    }
    if (conn1) conn1.classList.add('filled');
    if (conn2) conn2.classList.add('filled');
  },

  // ==========================================================
  // UNIFIED 3-COLUMN BOTTOM CONTROL BAR LOGIC
  // ==========================================================
  updateBottomControlBarUI() {
    const backBtn = document.getElementById('bar-back-btn');
    const nextBtn = document.getElementById('floating-action-btn');

    if (!backBtn || !nextBtn) return;

    // 1. LEFT BUTTON LOGIC:
    if (this.currentSlide === 1) {
      // Slide 1: No back button
      backBtn.style.visibility = 'hidden';
      backBtn.classList.remove('exit-bar-btn');
    } else if (this.isAddonMode && this.currentSlide === 3) {
      // Add-on mode on Slide 3: Shows '✕ Exit'
      backBtn.style.visibility = 'visible';
      backBtn.textContent = '✕ Exit';
      backBtn.classList.add('exit-bar-btn');
    } else {
      // Normal back button from Slide 2, 3, 4
      backBtn.style.visibility = 'visible';
      backBtn.textContent = '← Back';
      backBtn.classList.remove('exit-bar-btn');
    }

    // 2. RIGHT BUTTON LOGIC:
    if (this.currentSlide === 1) {
      nextBtn.textContent = 'Select Patient ➔';
      nextBtn.disabled = !this.collectionType;
    } else if (this.currentSlide === 2) {
      nextBtn.textContent = 'Payment & Offers ➔';
      nextBtn.disabled = false;
    } else if (this.currentSlide === 3) {
      nextBtn.textContent = 'Review Order ➔';
      nextBtn.disabled = false;
    } else if (this.currentSlide === 4) {
      nextBtn.textContent = this.isAddonMode ? 'Pay & Add Tests ➔' : 'Confirm Booking ➔';
      nextBtn.disabled = false;
    }
  },

  handleBarBack() {
    if (this.isAddonMode && this.currentSlide === 3) {
      // Trigger Exit Addon mode
      this.exitAddonMode();
      return;
    }

    if (this.currentSlide > 1) {
      this.goToSlide(this.currentSlide - 1);
    }
  },

  handleFloatingActionButton() {
    if (this.currentSlide === 1) {
      if (!this.collectionType) {
        Utils.showToast('Please select Home Pickup or Lab Walk-in', 'error');
        return;
      }
      this.goToSlide(2);
    } else if (this.currentSlide === 2) {
      this.goToSlide(3);
    } else if (this.currentSlide === 3) {
      if (!this.selectedPaymentMode) {
        Utils.showToast('Please select payment method (UPI or Cash)', 'error');
        return;
      }
      this.goToSlide(4);
    } else if (this.currentSlide === 4) {
      this.openPatientConfirmModal();
    }
  },

  // ==========================================================
  // SLIDE 1: COLLECTION TYPE LOGIC
  // ==========================================================
  selectCollectionType(type) {
    if (this.isAddonMode) {
      Utils.showToast('Collection mode is locked to existing booking appointment', 'info');
      return;
    }

    this.collectionType = type;

    const homeCard = document.getElementById('card-mode-home');
    const labCard = document.getElementById('card-mode-lab');
    const addrRow = document.getElementById('patient-display-address-row');
    const locRow = document.getElementById('patient-display-location-row');
    const editBtn = document.getElementById('edit-address-btn');
    const cashLabel = document.getElementById('cash-payment-label-text');
    const cashSub = document.getElementById('cash-payment-sub-text');

    if (homeCard) homeCard.classList.toggle('active', type === 'home');
    if (labCard) labCard.classList.toggle('active', type === 'lab');

    if (type === 'home') {
      if (addrRow) addrRow.style.display = 'flex';
      if (locRow) locRow.style.display = 'flex';
      if (editBtn) editBtn.style.display = 'inline-block';
      if (cashLabel) cashLabel.textContent = 'Cash on Collection';
      if (cashSub) cashSub.textContent = 'Pay phlebotomist directly at doorstep during sample pickup';
    } else {
      if (addrRow) addrRow.style.display = 'none';
      if (locRow) locRow.style.display = 'none';
      if (editBtn) editBtn.style.display = 'none';
      if (cashLabel) cashLabel.textContent = 'Pay Cash at Lab Counter';
      if (cashSub) cashSub.textContent = 'Pay directly at diagnostic center cash counter during sample visit';
    }

    this.calculateBillSummary();
    this.renderSelectedPatientCard();
    this.updateBottomControlBarUI();
  },

  calculateDoorstepCharge() {
    if (this.isAddonMode) return 0;
    if (this.collectionType === 'lab') return 0;
    if (!this.collectionType) return 0;
    if (this.cart.length === 0) return 0;

    const isPPBSTest = (item) => {
      const name = (item.name || item.TestName || '').toUpperCase();
      const code = (item.code || item.TestCode || '').toUpperCase();
      return name.includes('PPBS') || name.includes('POST PRANDIAL') || code === 'T0009' || code === 'SCDT0009';
    };

    const ppbsItems = this.cart.filter(isPPBSTest);
    const otherItems = this.cart.filter(i => !isPPBSTest(i));

    if (ppbsItems.length > 0 && otherItems.length > 0) return 150;
    return 100;
  },

  calculateBillSummary() {
    let totalMrp = 0;
    let subtotalNewTests = 0;
    let existingPaidAmount = 0;

    this.cart.forEach(item => {
      if (item.isExistingBookingItem) {
        existingPaidAmount += Number(item.originalPrice || 0);
      } else {
        const offer = Number(item.price || item.OfferPrice || 0);
        const mrp = Number(item.mrp || item.MRP || offer);
        subtotalNewTests += offer;
        totalMrp += mrp;
      }
    });

    const labSavings = Math.max(0, totalMrp - subtotalNewTests);

    let couponDiscount = 0;
    let couponTitle = '';

    if (this.appliedCoupon && subtotalNewTests > 0) {
      const clean = String(this.appliedCoupon).trim();
      if (clean.toLowerCase().startsWith('selfcare10%')) {
        const friend = clean.substring(12);
        couponDiscount = Math.round(subtotalNewTests * 0.10);
        couponTitle = `Referral Discount (10% - Referred by ${friend.toUpperCase()}):`;
      } else {
        couponDiscount = Math.round(subtotalNewTests * 0.10);
        couponTitle = `Coupon Discount (${clean}):`;
      }
    }
    this.couponDiscountAmount = couponDiscount;

    let onlineDiscount = 0;
    if (this.selectedPaymentMode === 'online' && subtotalNewTests > 0) {
      onlineDiscount = Math.round(subtotalNewTests * 0.10);
    }
    this.onlineDiscountAmount = onlineDiscount;

    this.doorstepCharge = this.calculateDoorstepCharge();
    const finalPayable = Math.max(0, subtotalNewTests - couponDiscount - onlineDiscount + this.doorstepCharge);

    // Update Centered Highlighted Grand Total
    const stickyPayableEl = document.getElementById('sticky-payable-amount');
    if (stickyPayableEl) stickyPayableEl.textContent = Utils.formatCurrency(finalPayable);

    // Update Slide 4 Order Summary
    const totalMrpEl = document.getElementById('bill-total-mrp');
    const subtotalPriceEl = document.getElementById('bill-subtotal-price');
    const labSavingsEl = document.getElementById('bill-lab-savings');
    const couponRow = document.getElementById('bill-coupon-row');
    const couponLabel = document.getElementById('bill-coupon-label');
    const couponAmtEl = document.getElementById('bill-coupon-amount');
    const onlineRow = document.getElementById('bill-online-pay-row');
    const onlineAmtEl = document.getElementById('bill-online-pay-discount');
    const chargeLabel = document.getElementById('bill-collection-charge-label');
    const chargeVal = document.getElementById('bill-collection-charge-val');
    const finalPayableEl = document.getElementById('bill-final-payable');

    if (totalMrpEl) totalMrpEl.textContent = Utils.formatCurrency(totalMrp);
    if (subtotalPriceEl) subtotalPriceEl.textContent = Utils.formatCurrency(subtotalNewTests);
    if (labSavingsEl) labSavingsEl.textContent = `- ${Utils.formatCurrency(labSavings)}`;

    if (couponDiscount > 0 && couponRow) {
      couponRow.style.display = 'flex';
      if (couponLabel) couponLabel.textContent = couponTitle;
      if (couponAmtEl) couponAmtEl.textContent = `- ${Utils.formatCurrency(couponDiscount)}`;
    } else if (couponRow) {
      couponRow.style.display = 'none';
    }

    if (onlineRow) {
      if (this.selectedPaymentMode === 'online' && subtotalNewTests > 0) {
        onlineRow.style.display = 'flex';
        if (onlineAmtEl) onlineAmtEl.textContent = `- ${Utils.formatCurrency(onlineDiscount)}`;
      } else {
        onlineRow.style.display = 'none';
      }
    }

    if (chargeVal) {
      if (this.isAddonMode) {
        chargeVal.textContent = 'FREE (₹0 - Clubbed)';
        chargeVal.classList.add('green-val');
        if (chargeLabel) chargeLabel.textContent = 'Doorstep Sample Collection:';
      } else if (this.collectionType === 'lab') {
        chargeVal.textContent = 'FREE (₹0)';
        chargeVal.classList.add('green-val');
        if (chargeLabel) chargeLabel.textContent = 'Direct Lab Visit Fee:';
      } else if (this.collectionType === 'home') {
        chargeVal.classList.remove('green-val');
        chargeVal.textContent = Utils.formatCurrency(this.doorstepCharge);
        if (chargeLabel) {
          chargeLabel.textContent = this.doorstepCharge === 150 
            ? 'Doorstep Collection (₹150 - Dual visit for PPBS):' 
            : 'Doorstep Sample Collection:';
        }
      } else {
        chargeVal.textContent = 'Select in Step 1';
      }
    }

    if (finalPayableEl) finalPayableEl.textContent = Utils.formatCurrency(finalPayable);
    this.updateCouponBannerUI();
  },

  // ==========================================================
  // SLIDE 2: PATIENT DETAILS CARD DISPLAY
  // ==========================================================
  renderSelectedPatientCard() {
    const nameEl = document.getElementById('disp-patient-name');
    const relEl = document.getElementById('disp-patient-relation');
    const phoneEl = document.getElementById('disp-patient-phone');
    const addrEl = document.getElementById('cart-display-address');
    const locEl = document.getElementById('cart-display-location');

    if (nameEl) nameEl.textContent = this.selectedPatientName || 'Self';
    if (relEl) relEl.textContent = this.selectedPatientRelation || 'Self';
    if (phoneEl) phoneEl.textContent = this.selectedPatientPhone ? `+91 ${this.selectedPatientPhone}` : 'Not set';
    if (addrEl) addrEl.textContent = this.currentPickupAddress || 'Chennai, Tamil Nadu';
    if (locEl) locEl.textContent = this.currentPickupLocation || 'Not set';
  },

  selectPatient(id) {
    if (this.isAddonMode) {
      Utils.showToast('Patient is fixed to the existing booking', 'info');
      return;
    }

    const target = this.familyMembers.find(p => p.id === id);
    if (!target) return;

    this.selectedPatientId = target.id;
    this.selectedPatientName = target.name;
    this.selectedPatientPhone = target.mobile;
    this.selectedPatientEmail = target.email || '';
    this.selectedPatientRelation = target.relation || 'Member';
    this.selectedPatientAge = target.age || '';
    this.selectedPatientGender = target.gender || '';

    if (target.id !== 'SELF' && target.address && target.address.trim()) {
      this.currentPickupAddress = target.address;
      if (target.location) this.currentPickupLocation = target.location;
    }

    this.renderPatientChips();
    this.renderSelectedPatientCard();
  },

  renderPatientChips() {
    const container = document.getElementById('patient-selection-list');
    if (!container) return;

    if (this.isAddonMode) {
      container.innerHTML = `
        <div class="patient-chip active" style="cursor: default;">
          <span class="chip-name">${Utils.escapeHtml(this.selectedPatientName)}</span>
          <span class="chip-relation-tag">${Utils.escapeHtml(this.selectedPatientRelation)} (Locked)</span>
        </div>
      `;
      return;
    }

    container.innerHTML = this.familyMembers.map(p => {
      const isSelected = p.id === this.selectedPatientId;
      return `
        <div class="patient-chip ${isSelected ? 'active' : ''}" onclick="CartPage.selectPatient('${p.id}')">
          <span class="chip-name">${Utils.escapeHtml(p.name)}</span>
          <span class="chip-relation-tag">${Utils.escapeHtml(p.relation || 'Member')}</span>
        </div>
      `;
    }).join('');
  },

  // ==========================================================
  // SLIDE 3: PAYMENT MODE & COUPONS
  // ==========================================================
  selectPaymentMode(mode) {
    this.selectedPaymentMode = mode;
    const cardOnline = document.getElementById('pay-card-online');
    const cardCash = document.getElementById('pay-card-cash');
    if (cardOnline) cardOnline.classList.toggle('active', mode === 'online');
    if (cardCash) cardCash.classList.toggle('active', mode === 'cash');

    const radioOnline = document.querySelector('input[name="payment_mode"][value="online"]');
    const radioCash = document.querySelector('input[name="payment_mode"][value="cash"]');
    if (mode === 'online' && radioOnline) radioOnline.checked = true;
    if (mode === 'cash' && radioCash) radioCash.checked = true;

    this.calculateBillSummary();
    this.updateBottomControlBarUI();
  },

  // ==========================================================
  // SLIDE 4: CART ITEMS RENDERING
  // ==========================================================
  renderItemsList() {
    const container = document.getElementById('cart-items-list');
    const countBadge = document.getElementById('cart-items-count-badge');
    if (!container) return;

    if (countBadge) countBadge.textContent = `${this.cart.length} Items`;

    container.innerHTML = this.cart.map((item, index) => {
      const isPaidItem = Boolean(item.isExistingBookingItem);
      const isPackage = item.type === 'package' || String(item.PackageID || item.PackageCode || '').startsWith('PKG');
      const name = item.name || item.TestName || item.PackageName || 'Diagnostic Item';
      const code = item.code || item.TestCode || item.PackageCode || (isPackage ? 'PACKAGE' : 'TEST');
      const offerPrice = isPaidItem ? 0 : Number(item.price || item.OfferPrice || 0);
      const mrp = isPaidItem ? Number(item.originalPrice || 0) : Number(item.mrp || item.MRP || offerPrice);

      return `
        <div class="cart-item-card glass-panel-3d" style="padding:12px; margin-bottom:10px; ${isPaidItem ? 'background: #F9FAFB; border-color: #A7F3D0;' : ''}">
          <div class="item-main-details">
            <div style="display:flex; gap:6px; margin-bottom:4px;">
              <span class="type-badge ${isPackage ? 'package-type' : 'test-type'}" style="font-size:9.5px; font-weight:800; padding:2px 6px; border-radius:4px; background:#E0F2FE; color:#0369A1;">
                ${isPackage ? '📦 PACKAGE' : '🧪 TEST'}
              </span>
              <span style="font-size:9.5px; font-weight:700; color:#64748B;">${Utils.escapeHtml(code)}</span>
              ${isPaidItem ? `<span style="font-size: 9px; font-weight: 800; background: #D1FAE5; color: #065F46; padding: 2px 6px; border-radius: 4px;">ALREADY BOOKED</span>` : ''}
            </div>
            <h4 style="font-size:13.5px; font-weight:800; color:#1E293B; margin:0 0 4px 0;">${Utils.escapeHtml(name)}</h4>
            <div style="font-size:13px; font-weight:800; color:#078866;">
              ${mrp > offerPrice ? `<span style="text-decoration:line-through; color:#94A3B8; font-size:11px; margin-right:6px;">${Utils.formatCurrency(mrp)}</span>` : ''}
              <span>${Utils.formatCurrency(offerPrice)}</span>
              ${isPaidItem ? `<span style="font-size: 10.5px; font-weight: 700; color: #536E66; margin-left:6px;">(Paid: ${Utils.formatCurrency(item.originalPrice || 0)})</span>` : ''}
            </div>
          </div>
          <div style="margin-top:8px; text-align:right;">
            ${isPaidItem ? `
              <span style="font-size: 11px; font-weight: 800; color: #047857; background: #ECFDF5; padding: 6px 10px; border-radius: 8px; border: 1px solid #A7F3D0;">✓ Paid</span>
            ` : `
              <button type="button" onclick="CartPage.removeItem(${index})" style="background:none; border:none; cursor:pointer; font-size:14px;" title="Remove">🗑️</button>
            `}
          </div>
        </div>
      `;
    }).join('');
  },

  // ==========================================================
  // CORE HELPER INITIALIZERS & DATA LOADING
  // ==========================================================
  detectAddonBookingMode() {
    const urlParams = (typeof window !== 'undefined') ? new URLSearchParams(window.location.search) : null;
    const urlAddonId = urlParams ? urlParams.get('addonBookingId') : null;
    const storedAddonId = localStorage.getItem('selfcare_active_addon_booking_id');
    const targetAddonId = urlAddonId || storedAddonId;

    if (targetAddonId) {
      let bData = null;
      try {
        const raw = sessionStorage.getItem('selfcare_addon_booking') || localStorage.getItem('selfcare_active_addon_booking_data');
        if (raw) bData = JSON.parse(raw);
      } catch (e) {}

      if (!bData) {
        try {
          const recents = JSON.parse(localStorage.getItem('selfcare_recent_bookings') || '[]');
          bData = recents.find(b => (b.bookingId || '').toUpperCase() === targetAddonId.toUpperCase());
        } catch (e) {}
      }

      if (bData && bData.bookingId) {
        this.isAddonMode = true;
        this.addonBookingId = bData.bookingId;
        this.addonBooking = bData;
        this.collectionType = bData.collectionType || 'home';
        localStorage.setItem('selfcare_active_addon_booking_id', bData.bookingId);
        localStorage.setItem('selfcare_active_addon_booking_data', JSON.stringify(bData));
        return;
      }
    }

    this.isAddonMode = false;
    this.addonBookingId = null;
    this.addonBooking = null;
    this.existingBookingItems = [];
  },

  loadCartData() {
    if (this.isAddonMode && this.addonBooking) {
      let rawBookingItems = this.addonBooking.items;
      if (typeof rawBookingItems === 'string') {
        try { rawBookingItems = JSON.parse(rawBookingItems); } catch (e) { rawBookingItems = []; }
      }
      if (!Array.isArray(rawBookingItems)) rawBookingItems = [];

      const existingMarked = rawBookingItems.map((item, idx) => ({
        id: item.id || item.TestID || item.PackageID || `PAID_${idx}`,
        name: item.name || item.TestName || item.PackageName || 'Diagnostic Test',
        code: item.code || item.TestCode || item.PackageCode || 'PAID',
        price: 0,
        originalPrice: Number(item.price || item.OfferPrice || 0),
        mrp: Number(item.mrp || item.MRP || item.price || 0),
        type: item.type || 'test',
        isExistingBookingItem: true
      }));

      this.existingBookingItems = existingMarked;

      let newAddedItems = [];
      try {
        const activeUser = localStorage.getItem('selfcare_active_user');
        let rawCart = activeUser ? localStorage.getItem(`selfcare_cart_${activeUser}`) : localStorage.getItem('selfcare_cart');
        if (rawCart) {
          const parsed = JSON.parse(rawCart);
          if (Array.isArray(parsed)) {
            newAddedItems = parsed.filter(i => !i.isExistingBookingItem);
          }
        }
      } catch (e) {}

      this.cart = [...existingMarked, ...newAddedItems];
      return;
    }

    try {
      let localCart = null;
      if (typeof localStorage !== 'undefined') {
        const activeUser = localStorage.getItem('selfcare_active_user');
        let raw = activeUser ? localStorage.getItem(`selfcare_cart_${activeUser}`) : (localStorage.getItem('selfcare_cart') ?? localStorage.getItem('cart'));
        if (raw !== null) {
          try { localCart = JSON.parse(raw); } catch (e) {}
        }
      }
      this.cart = Array.isArray(localCart) ? localCart : [];
    } catch (e) {
      this.cart = [];
    }
  },

  loadPatientAndAddressData() {
    const user = (typeof Auth !== 'undefined' && Auth.getUser && Auth.getUser()) || {};
    const primaryMobile = user.mobile || localStorage.getItem('selfcare_active_user') || '7010174890';
    const primaryName = user.name || 'Valued Customer';
    const primaryEmail = user.email || '';

    const selfPatient = {
      id: 'SELF',
      name: primaryName,
      relation: 'Self',
      mobile: primaryMobile,
      email: primaryEmail,
      age: user.age || '28',
      gender: user.gender || 'Male',
      address: user.address || 'Chennai, Tamil Nadu',
      location: user.location || 'Not set'
    };

    let famList = [];
    try {
      let rawFam = localStorage.getItem(`selfcare_family_${primaryMobile}`) || localStorage.getItem('selfcare_family_members');
      if (rawFam) famList = JSON.parse(rawFam);
    } catch (e) {}

    this.familyMembers = [
      selfPatient,
      ...famList.map(m => ({
        id: m.id || `FAM_${Date.now()}`,
        name: m.name || 'Member',
        relation: m.relation || 'Family',
        mobile: m.mobile || '',
        email: m.email || '',
        age: m.age || '',
        gender: m.gender || '',
        address: m.address || '',
        location: m.location || ''
      }))
    ];

    if (this.isAddonMode && this.addonBooking) {
      const b = this.addonBooking;
      this.selectedPatientName = b.patientName || selfPatient.name;
      this.selectedPatientPhone = b.patientPhone || selfPatient.mobile;
      this.selectedPatientEmail = b.patientEmail || '';
      this.selectedPatientRelation = b.relation || 'Self';
      this.selectedPatientId = b.patientId || 'SELF';
      this.currentPickupAddress = b.address || selfPatient.address;
      this.currentPickupLocation = b.location?.link || b.location || 'Not set';
      this.collectionType = b.collectionType || 'home';
    } else {
      this.selectedPatientId = 'SELF';
      this.selectedPatientName = selfPatient.name;
      this.selectedPatientPhone = selfPatient.mobile;
      this.selectedPatientEmail = selfPatient.email;
      this.selectedPatientRelation = 'Self';
      this.selectedPatientAge = selfPatient.age;
      this.selectedPatientGender = selfPatient.gender;
      this.currentPickupAddress = user.address || 'Chennai, Tamil Nadu';
      this.currentPickupLocation = user.location || 'Not set';
    }

    this.renderSelectedPatientCard();
  },

  checkAutoAppliedCoupon() {
    const savedCoupon = localStorage.getItem('selfcare_applied_coupon');
    if (savedCoupon && savedCoupon.trim()) {
      this.appliedCoupon = savedCoupon.trim();
    }
  },

  populateTimeSlotsDropdown() {
    const select = document.getElementById('cart-slot-select');
    if (!select) return;

    if (this.isAddonMode && this.addonBooking) {
      select.innerHTML = `<option value="${this.addonBooking.timeSlot || 'Original Slot'}" selected>✅ Locked with Booking (${this.addonBooking.collectionDate || 'Scheduled'} • ${this.addonBooking.timeSlot || ''})</option>`;
      select.disabled = true;
      this.selectedTimeSlot = this.addonBooking.timeSlot;
      return;
    }

    select.disabled = false;
    select.innerHTML = '';
    const now = new Date();
    const isToday = this.selectedSlotDay === 'Today';
    const bufferTime = new Date(now.getTime() + 60 * 60 * 1000);

    let bookedSlots = [];
    try {
      const storedBookings = localStorage.getItem('selfcare_booked_slots');
      bookedSlots = storedBookings ? JSON.parse(storedBookings) : [];
    } catch (e) {
      bookedSlots = [];
    }

    const targetDate = new Date();
    if (!isToday) targetDate.setDate(targetDate.getDate() + 1);
    const dateKey = targetDate.toISOString().split('T')[0];

    let firstSelectableSlot = '';

    for (let h = 6; h < 20; h++) {
      for (let m = 0; m < 60; m += 30) {
        const startHour = h;
        const startMin = m;
        let endHour = h;
        let endMin = m + 30;
        if (endMin >= 60) { endHour++; endMin = 0; }

        const formatTime = (hour, min) => {
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayH = hour % 12 === 0 ? 12 : hour % 12;
          const displayM = min === 0 ? '00' : String(min).padStart(2, '0');
          return `${String(displayH).padStart(2, '0')}:${displayM} ${ampm}`;
        };

        const slotLabel = `${formatTime(startHour, startMin)} - ${formatTime(endHour, endMin)}`;
        const slotDateKey = `${dateKey}_${slotLabel}`;

        let isPassed = false;
        if (isToday) {
          const slotStartTime = new Date();
          slotStartTime.setHours(startHour, startMin, 0, 0);
          if (slotStartTime < bufferTime) isPassed = true;
        }

        const isBooked = bookedSlots.includes(slotDateKey);
        const opt = document.createElement('option');
        opt.value = slotLabel;

        if (isBooked) {
          opt.textContent = `❌ ${slotLabel} [Already Booked]`;
          opt.disabled = true;
        } else if (isPassed) {
          opt.textContent = `⏳ ${slotLabel} (Passed)`;
          opt.disabled = true;
        } else {
          opt.textContent = `✅ ${slotLabel}`;
          if (!firstSelectableSlot) firstSelectableSlot = slotLabel;
        }

        select.appendChild(opt);
      }
    }

    if (firstSelectableSlot) {
      select.value = firstSelectableSlot;
      this.selectedTimeSlot = firstSelectableSlot;
    } else {
      this.selectedTimeSlot = '';
      const noOpt = document.createElement('option');
      noOpt.textContent = 'No slots available for Today. Please choose Tomorrow.';
      noOpt.disabled = true;
      noOpt.selected = true;
      select.appendChild(noOpt);
    }
  },

  selectSlotDay(day) {
    if (this.isAddonMode) {
      Utils.showToast('Schedule day is locked to existing booking appointment', 'info');
      return;
    }

    this.selectedSlotDay = day;
    document.getElementById('slot-day-today').classList.toggle('active', day === 'Today');
    document.getElementById('slot-day-tomorrow').classList.toggle('active', day === 'Tomorrow');
    this.populateTimeSlotsDropdown();
  },

  handleSlotSelect(val) {
    this.selectedTimeSlot = val;
  },

  updateCouponBannerUI() {
    const banner = document.getElementById('applied-coupon-banner');
    const inputBox = document.getElementById('coupon-input-box');
    const codeText = document.getElementById('applied-coupon-code-text');

    if (this.appliedCoupon) {
      if (banner) banner.style.display = 'flex';
      if (inputBox) inputBox.style.display = 'none';
      if (codeText) codeText.textContent = this.appliedCoupon;
    } else {
      if (banner) banner.style.display = 'none';
      if (inputBox) inputBox.style.display = 'flex';
    }
  },

  renderCartUI() {
    const emptySec = document.getElementById('empty-cart-section');
    const activeSec = document.getElementById('active-cart-section');
    const clearBtn = document.getElementById('clear-cart-btn');

    if (!this.cart || this.cart.length === 0) {
      if (emptySec) emptySec.style.display = 'flex';
      if (activeSec) activeSec.style.display = 'none';
      if (clearBtn) clearBtn.style.display = 'none';
      return;
    }

    if (emptySec) emptySec.style.display = 'none';
    if (activeSec) activeSec.style.display = 'block';
    if (clearBtn) clearBtn.style.display = 'block';

    this.renderAddonBannerHeader();
    this.renderItemsList();
    this.renderPatientChips();
    this.calculateBillSummary();
  },

  renderAddonBannerHeader() {
    const banner = document.getElementById('addon-booking-banner');
    if (!banner) return;

    if (this.isAddonMode && this.addonBooking) {
      banner.style.display = 'flex';
      banner.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:#ECFDF5; border:1.5px solid #078866; border-radius:12px; padding:10px 14px; margin-bottom:12px;';
      banner.innerHTML = `
        <div>
          <span style="font-size:12px; font-weight:800; color:#045D49; display:block;">
            ➕ Adding Tests to Booking: <strong>${this.addonBooking.bookingId}</strong>
          </span>
          <span style="font-size:10px; color:#078866; font-weight:700;">
            Patient: ${this.selectedPatientName} • Visit Charge: ₹0 FREE
          </span>
        </div>
        <button type="button" onclick="CartPage.exitAddonMode()" style="background:#ffffff; border:1px solid #DC2626; color:#DC2626; font-size:10px; font-weight:800; padding:4px 8px; border-radius:6px; cursor:pointer;">
          Exit ✕
        </button>
      `;
    } else {
      banner.style.display = 'none';
    }
  },

  // ==========================================================
  // PATIENT VERIFICATION CHECKPOINT POPUP FLOW
  // ==========================================================
  openPatientConfirmModal() {
    if (!navigator.onLine) {
      Utils.showToast('Internet connection required to proceed with booking.', 'error');
      return;
    }

    if (!this.collectionType) {
      Utils.showToast('Please select collection mode first', 'error');
      this.goToSlide(1);
      return;
    }

    if (!this.cart || this.cart.length === 0) {
      Utils.showToast('Your cart is empty', 'error');
      return;
    }

    const newTestsCount = this.cart.filter(i => !i.isExistingBookingItem).length;
    if (this.isAddonMode && newTestsCount === 0) {
      Utils.showToast('Please add new tests or packages to this booking first', 'info');
      window.location.href = 'tests.html';
      return;
    }

    if (!this.selectedPatientId || !this.selectedPatientName) {
      Utils.showToast('Please select a patient for sample pickup', 'error');
      if (!this.isAddonMode) this.goToSlide(2);
      return;
    }

    if (!this.selectedPatientPhone || this.selectedPatientPhone.length !== 10) {
      Utils.showToast(`Please enter a valid 10-digit mobile number for ${this.selectedPatientName}`, 'error');
      if (!this.isAddonMode) this.goToSlide(2);
      return;
    }

    if (this.collectionType === 'home' && (!this.currentPickupAddress || this.currentPickupAddress.trim() === '')) {
      Utils.showToast('Please provide a valid doorstep pickup address', 'error');
      if (!this.isAddonMode) this.goToSlide(2);
      return;
    }

    if (!this.selectedTimeSlot) {
      Utils.showToast('Please select a valid 30-minute collection slot', 'error');
      if (!this.isAddonMode) this.goToSlide(2);
      return;
    }

    const nameEl = document.getElementById('verify-patient-name');
    const relationEl = document.getElementById('verify-patient-relation');
    const mobileEl = document.getElementById('verify-patient-mobile');
    const ageGenderEl = document.getElementById('verify-patient-age-gender');
    const collectionEl = document.getElementById('verify-patient-collection');
    const slotEl = document.getElementById('verify-patient-slot');
    const totalEl = document.getElementById('verify-total-amount');

    const totalPayableEl = document.getElementById('bill-final-payable');
    const currentPayable = totalPayableEl ? totalPayableEl.textContent : '₹0';

    if (nameEl) nameEl.textContent = this.selectedPatientName;
    if (relationEl) {
      relationEl.textContent = this.isAddonMode ? `Add-on: ${this.addonBooking.bookingId}` : (this.selectedPatientRelation || 'Self');
    }
    if (mobileEl) mobileEl.textContent = `+91 ${this.selectedPatientPhone}`;
    if (ageGenderEl) ageGenderEl.textContent = `${this.selectedPatientAge ? this.selectedPatientAge + ' Yrs' : 'Age not set'} • ${this.selectedPatientGender || 'Not set'}`;
    if (collectionEl) {
      collectionEl.textContent = this.isAddonMode ? 'Doorstep Pickup (Clubbed ₹0)' : (this.collectionType === 'lab' ? 'Direct Lab Walk-in (₹0)' : 'Doorstep Pickup (Home)');
    }
    if (slotEl) slotEl.textContent = `${this.selectedSlotDay} (${this.selectedTimeSlot})`;
    if (totalEl) totalEl.textContent = currentPayable;

    this.openModal('modal-confirm-patient');
  },

  confirmPatientAndProceed() {
    this.closeModal('modal-confirm-patient');
    this.handleProceedToCheckout();
  },

  // ==========================================================
  // DIRECT UPI INTENT / CASH CHECKOUT ORCHESTRATION
  // ==========================================================
  async handleProceedToCheckout() {
    if (this.isProcessingCheckout) return;
    this.isProcessingCheckout = true;

    const confirmBtn = document.getElementById('floating-action-btn');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = this.selectedPaymentMode === 'online' ? 'Opening UPI...' : 'Confirming...';
    }

    const newItems = this.cart.filter(i => !i.isExistingBookingItem);
    let subtotalNew = 0;
    newItems.forEach(item => {
      subtotalNew += Number(item.price || item.OfferPrice || 0);
    });

    const couponDiscount = this.couponDiscountAmount;
    const onlineDiscount = this.selectedPaymentMode === 'online' ? this.onlineDiscountAmount : 0;
    const doorstepCharge = this.isAddonMode ? 0 : this.doorstepCharge;
    const finalPayable = Math.max(0, subtotalNew - couponDiscount - onlineDiscount + doorstepCharge);

    const targetDate = new Date();
    if (this.selectedSlotDay === 'Tomorrow') targetDate.setDate(targetDate.getDate() + 1);
    const collectionDateStr = this.isAddonMode ? this.addonBooking.collectionDate : targetDate.toISOString().split('T')[0];

    const finalAddress = this.collectionType === 'lab' ? 'Direct Lab Visit (Selfcare Diagnostics, Chennai)' : this.currentPickupAddress;
    const finalLocation = this.collectionType === 'lab' ? 'Lab Center' : this.currentPickupLocation;

    const bookingPayload = {
      patientId: this.selectedPatientId,
      patientName: this.selectedPatientName,
      patientPhone: this.selectedPatientPhone,
      patientEmail: this.selectedPatientEmail || '',
      relation: this.selectedPatientRelation || 'Self',
      isAddon: this.isAddonMode,
      targetBookingId: this.addonBookingId || null,
      items: newItems.map(i => ({
        id: i.id || i.TestID || i.PackageID || '',
        name: i.name || i.TestName || i.PackageName || '',
        code: i.code || i.TestCode || i.PackageCode || '',
        price: Number(i.price || i.OfferPrice || 0)
      })),
      collectionType: this.collectionType,
      address: finalAddress,
      location: { link: finalLocation },
      collectionDate: collectionDateStr,
      timeSlot: this.selectedTimeSlot,
      subtotal: subtotalNew,
      couponDiscount: couponDiscount,
      onlineDiscount: onlineDiscount,
      doorstepCharge: doorstepCharge,
      finalAmount: finalPayable,
      couponCode: this.appliedCoupon || ''
    };

    // PATHWAY A: CASH ON VISIT
    if (this.selectedPaymentMode === 'cash') {
      try {
        let bookingRes = null;
        if (typeof Api !== 'undefined' && Api.createBooking) {
          bookingRes = await Api.createBooking(bookingPayload);
        }

        const bookingId = this.isAddonMode ? this.addonBookingId : ((bookingRes && bookingRes.bookingId) || `SCDBOOK${Math.floor(100000 + Math.random() * 900000)}`);

        this.finalizeConfirmedBooking(bookingId, finalPayable, 'Cash on Sample Collection', newItems);
        Utils.showToast(this.isAddonMode ? `Tests added to Booking ${bookingId}!` : `Booking ${bookingId} confirmed!`, 'success');
      } catch (err) {
        console.error('Cash booking creation failed:', err);
        Utils.showToast(err.message || 'Failed to confirm booking. Please try again.', 'error');
      } finally {
        this.resetCheckoutButtonState();
      }
      return;
    }

    // PATHWAY B: DIRECT UPI INTENT
    try {
      if (typeof Api === 'undefined' || !Api.createPendingUPIBooking) {
        throw new Error('API client method createPendingUPIBooking is not available.');
      }

      const pendingRes = await Api.createPendingUPIBooking(bookingPayload);

      if (!pendingRes || !pendingRes.bookingId || !pendingRes.paymentReference) {
        throw new Error('Unable to initialize booking session with server.');
      }

      this.currentPendingBooking = {
        bookingId: pendingRes.bookingId,
        paymentReference: pendingRes.paymentReference,
        finalAmount: pendingRes.finalAmount || finalPayable,
        patientName: this.selectedPatientName,
        patientPhone: this.selectedPatientPhone,
        patientEmail: this.selectedPatientEmail,
        patientRelation: this.selectedPatientRelation,
        collectionDate: collectionDateStr,
        timeSlot: this.selectedTimeSlot,
        dateKey: `${collectionDateStr}_${this.selectedTimeSlot}`,
        collectionType: this.collectionType,
        address: finalAddress,
        location: finalLocation,
        isAddon: this.isAddonMode,
        addonBookingId: this.addonBookingId,
        newItems: newItems
      };

      sessionStorage.setItem('selfcare_active_upi_txn', JSON.stringify(this.currentPendingBooking));

      const upiConfig = (typeof Config !== 'undefined' && Config.UPI) ? Config.UPI : {
        MERCHANT_VPA: '0798545a0252206.bqr@kotak',
        MERCHANT_NAME: 'Selfcare Diagnostics',
        CURRENCY: 'INR',
        MCC: '8099'
      };

      const pa = upiConfig.MERCHANT_VPA;
      const pn = encodeURIComponent(upiConfig.MERCHANT_NAME);
      const am = Number(this.currentPendingBooking.finalAmount).toFixed(2);
      const cu = upiConfig.CURRENCY || 'INR';
      const tr = this.currentPendingBooking.paymentReference;
      const tn = encodeURIComponent(`Selfcare-${this.currentPendingBooking.bookingId}`);
      const mc = upiConfig.MCC || '8099';

      const upiUri = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=${cu}&tr=${tr}&tn=${tn}&mc=${mc}`;

      this.openModal('upi-payment-modal');
      const bookRefEl = document.getElementById('upi-modal-book-ref');
      const amountEl = document.getElementById('upi-modal-amount');
      const fallbackBtn = document.getElementById('upi-direct-manual-link');
      const fallbackContainer = document.getElementById('upi-fallback-container');

      if (bookRefEl) bookRefEl.textContent = this.currentPendingBooking.bookingId;
      if (amountEl) amountEl.textContent = Utils.formatCurrency(this.currentPendingBooking.finalAmount);
      if (fallbackBtn) fallbackBtn.href = upiUri;
      if (fallbackContainer) fallbackContainer.style.display = 'none';

      this.intentLaunchTime = Date.now();
      if (this.fallbackTimerId) clearTimeout(this.fallbackTimerId);
      this.fallbackTimerId = setTimeout(() => {
        if (fallbackContainer) fallbackContainer.style.display = 'block';
      }, 3500);

      window.location.href = upiUri;

    } catch (err) {
      console.error('Direct UPI Intent failure:', err);
      Utils.showToast(err.message || 'Error opening UPI payment. Please try again.', 'error');
      this.resetCheckoutButtonState();
    }
  },

  setupUPIAppReturnListeners() {
    const handleAppFocusOrVisibility = () => {
      if (!this.currentPendingBooking) {
        const saved = sessionStorage.getItem('selfcare_active_upi_txn');
        if (saved) {
          try { this.currentPendingBooking = JSON.parse(saved); } catch (e) {}
        }
      }

      if (!this.currentPendingBooking) return;

      const modal = document.getElementById('upi-payment-modal');
      if (modal && modal.style.display === 'flex') {
        const timeElapsed = Date.now() - this.intentLaunchTime;
        if (timeElapsed > 2500) {
          this.handleReturnFromUPI();
        }
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleAppFocusOrVisibility();
    });

    window.addEventListener('focus', handleAppFocusOrVisibility);
  },

  handleReturnFromUPI() {
    if (!this.currentPendingBooking) {
      const saved = sessionStorage.getItem('selfcare_active_upi_txn');
      if (saved) {
        try { this.currentPendingBooking = JSON.parse(saved); } catch (e) {}
      }
    }

    if (!this.currentPendingBooking) return;

    this.closeModal('upi-payment-modal');

    const amtEl = document.getElementById('upi-confirm-amt-text');
    const bookIdEl = document.getElementById('upi-confirm-book-id');
    const payRefEl = document.getElementById('upi-confirm-pay-ref');

    if (amtEl) amtEl.textContent = Utils.formatCurrency(this.currentPendingBooking.finalAmount);
    if (bookIdEl) bookIdEl.textContent = this.currentPendingBooking.bookingId;
    if (payRefEl) payRefEl.textContent = this.currentPendingBooking.paymentReference;

    this.openModal('upi-confirm-modal');
  },

  confirmUserPaymentSuccess() {
    if (!this.currentPendingBooking) return;

    const yesBtn = document.querySelector('#upi-confirm-modal .modal-action-btn');
    if (yesBtn) {
      yesBtn.innerHTML = '⏳ Opening WhatsApp...';
      yesBtn.style.pointerEvents = 'none';
      yesBtn.style.opacity = '0.85';
    }

    const booking = this.currentPendingBooking;
    const finalId = booking.isAddon ? booking.addonBookingId : booking.bookingId;

    try {
      if (typeof Api !== 'undefined' && Api.updateUPIPaymentStatus) {
        Api.updateUPIPaymentStatus({
          bookingId: finalId,
          paymentReference: booking.paymentReference,
          paymentStatus: 'PAYMENT_SUCCESS',
          bookingStatus: 'CONFIRMED',
          transactionId: 'USER_CONFIRMED_UPI',
          rawResponse: 'Customer confirmed payment completion inside UPI app'
        }).catch(() => {});
      }
    } catch (err) {}

    this.finalizeConfirmedBooking(finalId, booking.finalAmount, 'Online UPI (10% Discount)', booking.newItems);
    this.closeModal('upi-confirm-modal');
    this.resetCheckoutButtonState();
  },

  finalizeConfirmedBooking(bookingId, payableAmount, payModeTitle, newItems) {
    const isLab = this.collectionType === 'lab';
    const typeLabel = isLab ? 'Direct Lab Walk-in (FREE ₹0)' : `Doorstep Home Pickup (₹${this.doorstepCharge})`;
    const addressDetails = isLab 
      ? `🏢 *Visit Center:* Selfcare Diagnostics Lab, Chennai` 
      : `🏠 *Address:* ${this.currentPickupAddress}\n📍 *Location Link:* ${this.currentPickupLocation}`;

    if (this.isAddonMode && this.addonBooking) {
      let originalItems = this.addonBooking.items;
      if (typeof originalItems === 'string') {
        try { originalItems = JSON.parse(originalItems); } catch (e) { originalItems = []; }
      }
      if (!Array.isArray(originalItems)) originalItems = [];

      const mergedItems = [...originalItems, ...newItems.map(i => ({ name: i.name, price: Number(i.price || 0) }))];

      const mergedBooking = {
        ...this.addonBooking,
        items: mergedItems,
        finalAmount: (Number(this.addonBooking.finalAmount) || 0) + Number(payableAmount || 0),
        updatedAt: new Date().toISOString()
      };

      this.persistConfirmedBookingLocally(mergedBooking);

      const waMessage = 
`*ADD-ON TESTS ADDED TO EXISTING BOOKING* 🧪
━━━━━━━━━━━━━━━━━━━━
✅ *Payment:* SUCCESSFUL (${payModeTitle})
📋 *Booking ID:* ${bookingId}
👤 *Patient:* ${this.selectedPatientName} (${this.selectedPatientRelation || 'Self'})
📞 *Contact:* +91 ${this.selectedPatientPhone}
🏥 *Collection Mode:* ${typeLabel}
${addressDetails}
⏱️ *Scheduled Slot:* ${this.addonBooking.collectionDate} (${this.addonBooking.timeSlot})
━━━━━━━━━━━━━━━━━━━━
➕ *Newly Added Tests:*
${newItems.map((item, i) => `${i + 1}. ${item.name} (₹${item.price})`).join('\n')}
━━━━━━━━━━━━━━━━━━━━
💰 *Additional Amount Paid:* ${Utils.formatCurrency(payableAmount)}
━━━━━━━━━━━━━━━━━━━━
_Please include these additional test tubes in the phlebotomist sample collection kit._`;

      this.exitAddonMode();
      this.cart = [];
      this.saveCartState();
      this.renderCartUI();
      this.updateCartBadgeUI();

      const waUrl = `https://wa.me/917010174890?text=${encodeURIComponent(waMessage)}`;
      window.location.href = waUrl;
      return;
    }

    const itemsList = this.cart.map((item, i) => `${i + 1}. ${item.name || item.TestName || item.PackageName} (₹${item.price || item.OfferPrice})`).join('\n');

    this.persistConfirmedBookingLocally({
      bookingId: bookingId,
      patientId: this.selectedPatientId,
      patientName: this.selectedPatientName,
      patientPhone: this.selectedPatientPhone,
      patientEmail: this.selectedPatientEmail,
      relation: this.selectedPatientRelation || 'Self',
      collectionType: this.collectionType,
      collectionDate: this.selectedSlotDay === 'Today' ? 'Today' : this.selectedSlotDay,
      timeSlot: this.selectedTimeSlot,
      paymentStatus: payModeTitle.includes('Online') ? 'PAYMENT_SUCCESS' : 'PENDING_COLLECTION',
      bookingStatus: 'CONFIRMED',
      finalAmount: payableAmount,
      address: this.currentPickupAddress,
      currentStage: 1,
      items: this.cart.map(i => ({ name: i.name || i.TestName || i.PackageName, price: Number(i.price || i.OfferPrice || 0) }))
    });

    const waMessage = 
`*NEW TEST BOOKING - SELFCARE DIAGNOSTICS* 🧪
━━━━━━━━━━━━━━━━━━━━
📋 *Booking ID:* ${bookingId}
👤 *Patient:* ${this.selectedPatientName} (${this.selectedPatientRelation || 'Self'})
📞 *Patient Contact:* +91 ${this.selectedPatientPhone}
🏥 *Collection Mode:* ${typeLabel}
${addressDetails}
⏱️ *Appointment Slot:* ${this.selectedSlotDay} (${this.selectedTimeSlot})
━━━━━━━━━━━━━━━━━━━━
🧪 *Booked Items:*
${itemsList}
━━━━━━━━━━━━━━━━━━━━
🏷️ *Coupon:* ${this.appliedCoupon || 'None'}
💳 *Payment Mode:* ${payModeTitle}
💰 *Total Payable:* ${Utils.formatCurrency(payableAmount)}
━━━━━━━━━━━━━━━━━━━━
_${isLab ? 'Direct walk-in counter booking.' : 'Please assign phlebotomist for doorstep sample collection.'}_`;

    this.cart = [];
    this.saveCartState();
    this.renderCartUI();
    this.updateCartBadgeUI();

    const waUrl = `https://wa.me/917010174890?text=${encodeURIComponent(waMessage)}`;
    window.location.href = waUrl;
  },

  confirmUserPaymentFailed() {
    if (!this.currentPendingBooking) {
      this.closeModal('upi-confirm-modal');
      return;
    }

    const booking = this.currentPendingBooking;
    try {
      if (typeof Api !== 'undefined' && Api.updateUPIPaymentStatus) {
        Api.updateUPIPaymentStatus({
          bookingId: booking.bookingId,
          paymentReference: booking.paymentReference,
          paymentStatus: 'PAYMENT_CANCELLED',
          bookingStatus: 'PAYMENT_CANCELLED',
          transactionId: '',
          rawResponse: 'Customer clicked payment failed/cancelled'
        }).catch(() => {});
      }
    } catch (err) {}

    this.closeModal('upi-confirm-modal');
    sessionStorage.removeItem('selfcare_active_upi_txn');
    this.resetCheckoutButtonState();

    Utils.showToast('Payment was not completed. You can retry UPI or choose Cash.', 'info');
  },

  resetCheckoutButtonState() {
    this.isProcessingCheckout = false;
    this.updateBottomControlBarUI();
  },

  saveBookedSlot(dateStr, slotLabel) {
    try {
      const stored = localStorage.getItem('selfcare_booked_slots');
      const booked = stored ? JSON.parse(stored) : [];
      const key = `${dateStr}_${slotLabel}`;
      if (!booked.includes(key)) {
        booked.push(key);
        localStorage.setItem('selfcare_booked_slots', JSON.stringify(booked));
      }
    } catch (e) {}
  },

  removeItem(index) {
    if (index >= 0 && index < this.cart.length) {
      const item = this.cart[index];
      if (item.isExistingBookingItem) {
        Utils.showToast('Already booked tests cannot be removed from this visit', 'info');
        return;
      }

      const removed = this.cart.splice(index, 1);
      this.saveCartState();
      this.renderCartUI();
      this.updateCartBadgeUI();
      if (removed && removed[0]) {
        Utils.showToast(`${removed[0].name || 'Item'} removed`, 'info');
      }
    }
  },

  exitAddonMode() {
    this.isAddonMode = false;
    this.addonBookingId = null;
    this.addonBooking = null;
    this.existingBookingItems = [];
    localStorage.removeItem('selfcare_active_addon_booking_id');
    localStorage.removeItem('selfcare_active_addon_booking_data');
    sessionStorage.removeItem('selfcare_addon_booking');

    this.cart = this.cart.filter(i => !i.isExistingBookingItem);
    this.saveCartState();

    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    window.location.reload();
  },

  clearAllCartItems() {
    if (this.isAddonMode) {
      if (confirm('Remove all newly added tests and exit Add-on Mode?')) {
        this.exitAddonMode();
      }
      return;
    }

    if (confirm('Clear all items from your cart?')) {
      this.cart = [];
      this.saveCartState();
      this.renderCartUI();
      this.updateCartBadgeUI();
    }
  },

  saveCartState() {
    const cartStr = JSON.stringify(this.cart);
    localStorage.setItem('cart', cartStr);
    localStorage.setItem('selfcare_cart', cartStr);

    const activeUser = localStorage.getItem('selfcare_active_user');
    if (activeUser) {
      localStorage.setItem(`selfcare_cart_${activeUser}`, cartStr);
    }

    if (typeof App !== 'undefined') {
      App.cart = this.cart;
      if (typeof App.updateCartBadge === 'function') App.updateCartBadge();
    }

    if (typeof OfflineDB !== 'undefined' && typeof OfflineDB.saveCart === 'function') {
      OfflineDB.saveCart(this.cart).catch(() => {});
    }
  },

  persistConfirmedBookingLocally(bookingRecord) {
    try {
      const stored = localStorage.getItem('selfcare_recent_bookings');
      let list = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(list)) list = [];

      list = list.filter(b => b.bookingId !== bookingRecord.bookingId);
      list.unshift(bookingRecord);
      localStorage.setItem('selfcare_recent_bookings', JSON.stringify(list));
    } catch (e) {}
  },

  openAvailableCouponsModal() {
    const container = document.getElementById('available-coupons-list');
    if (!container) return;

    const todayStr = new Date().toISOString().split('T')[0];
    let allCoupons = [...this.adminCoupons];

    try {
      const savedRef = localStorage.getItem('selfcare_referral_coupons');
      if (savedRef) {
        const refs = JSON.parse(savedRef);
        refs.forEach(r => {
          allCoupons.unshift({
            code: r.code,
            title: `Referral Reward: ${r.friendName}`,
            discountPercent: 10,
            validUntil: '2026-12-31',
            description: `Earned via friend ${r.friendName}'s booking`
          });
        });
      }
    } catch (e) {}

    container.innerHTML = allCoupons.map(c => {
      const isExpired = c.validUntil < todayStr;
      return `
        <div class="coupon-item-card ${isExpired ? 'expired' : ''}">
          <div class="coupon-meta">
            <h5>🏷️ ${Utils.escapeHtml(c.code)}</h5>
            <p>${Utils.escapeHtml(c.description)}</p>
            <div class="coupon-expiry">
              ${isExpired ? '❌ Expired' : `⏳ Valid till: ${c.validUntil}`}
            </div>
          </div>
          <button type="button" class="apply-modal-coupon-btn" 
            ${isExpired ? 'disabled' : ''} 
            onclick="CartPage.applyCouponCode('${Utils.escapeHtml(c.code)}')">
            ${isExpired ? 'Expired' : 'Apply'}
          </button>
        </div>
      `;
    }).join('');

    this.openModal('available-coupons-modal');
  },

  applyCouponCode(code) {
    this.appliedCoupon = code;
    localStorage.setItem('selfcare_applied_coupon', code);
    this.calculateBillSummary();
    this.closeModal('available-coupons-modal');
    Utils.showToast(`Coupon "${code}" applied successfully!`, 'success');
  },

  applyCouponManually() {
    const input = document.getElementById('coupon-code-input');
    const val = input ? input.value.trim() : '';

    if (!val) {
      Utils.showToast('Please enter coupon code', 'error');
      return;
    }

    this.applyCouponCode(val);
    if (input) input.value = '';
  },

  removeCoupon() {
    this.appliedCoupon = null;
    this.couponDiscountAmount = 0;
    localStorage.removeItem('selfcare_applied_coupon');
    this.calculateBillSummary();
    Utils.showToast('Coupon removed', 'info');
  },

  openEditAddressModal() {
    document.getElementById('cart-edit-address-input').value = this.currentPickupAddress || '';
    document.getElementById('cart-edit-location-input').value = this.currentPickupLocation !== 'Not set' ? this.currentPickupLocation : '';
    this.openModal('edit-address-modal');
  },

  saveUpdatedAddressLocation() {
    const addr = document.getElementById('cart-edit-address-input').value.trim();
    const loc = document.getElementById('cart-edit-location-input').value.trim();

    if (!addr) {
      Utils.showToast('Please enter pickup address', 'error');
      return;
    }

    this.currentPickupAddress = addr;
    this.currentPickupLocation = loc || 'Not set';

    this.renderSelectedPatientCard();

    const user = (typeof Auth !== 'undefined' && Auth.getUser && Auth.getUser()) || {};
    user.address = this.currentPickupAddress;
    user.location = this.currentPickupLocation;
    if (typeof Auth !== 'undefined' && Auth.savePermanentSession) {
      Auth.savePermanentSession(user);
    }

    this.closeModal('edit-address-modal');
    Utils.showToast('Pickup address & location updated ✓', 'success');
  },

  detectGpsLocation(targetId) {
    if (!navigator.geolocation) {
      Utils.showToast('GPS not supported on this browser', 'error');
      return;
    }
    Utils.showToast('Detecting current GPS location...', 'info');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const url = `https://maps.google.com/?q=${lat},${lng}`;
        const input = document.getElementById(targetId);
        if (input) input.value = url;
        Utils.showToast('GPS Location fetched successfully!', 'success');
      },
      () => {
        Utils.showToast('Could not fetch GPS. Please turn on location.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  },

  openModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  },

  updateCartBadgeUI() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = this.cart.length;
    badges.forEach(b => {
      if (count > 0) {
        b.textContent = count;
        b.style.display = 'inline-block';
      } else {
        b.textContent = '0';
        b.style.display = 'none';
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  CartPage.init();
});

if (typeof window !== 'undefined') {
  window.CartPage = CartPage;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CartPage;
}
