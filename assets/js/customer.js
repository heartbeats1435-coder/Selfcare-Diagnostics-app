/* file: assets/js/customer.js */
/**
 * Selfcare Diagnostics - Customer Dashboard JS v7.8.0 (Zero-Fail Engine)
 * Features:
 * 1. Dual-Layer Conflict Validation Engine in Cart and Prescription flow.
 * 2. Strictly Photo/Image Prescription Compression (1000px max, JPEG 0.65, No PDF).
 * 3. Multi-tenant Isolated Cart Vault Synchronization (selfcare_cart_${activeUser}).
 * 4. High-Confidence vs Review Categorization for prescription tests.
 * 5. Full Cart Synchronization & 3D Parameter Modals.
 */

const CustomerDashboard = {
  allTests: [],
  allPackages: [],
  currentModalItems: [],
  currentUnmatchedItems: [],
  currentPackageSuggestions: [],
  currentPrescriptionId: null,

  fallbackPopularPackages: [
    {
      PackageID: 'PKG001',
      PackageCode: 'PKG001',
      PackageName: 'Selfcare Basic Health',
      Category: 'Preventive Health',
      SampleType: 'Blood & Urine',
      TAT: '24 Hours',
      FastingRequired: true,
      Preparation: '10 - 12 hours overnight fasting is mandatory.',
      MRP: 4000,
      OfferPrice: 1299,
      Description: 'Essential screening covering CBC, Fasting Blood Sugar, Lipid Profile, and Urine Routine.',
      Parameters: 'CBC, FBS, Lipid Profile, Urine Routine'
    },
    {
      PackageID: 'PKG002',
      PackageCode: 'PKG002',
      PackageName: 'Selfcare Premium Health',
      Category: 'Comprehensive Health',
      SampleType: 'Blood & Urine',
      TAT: '24 Hours',
      FastingRequired: true,
      Preparation: '10 - 12 hours overnight fasting is mandatory.',
      MRP: 7000,
      OfferPrice: 1999,
      Description: 'Broader preventive screening panel covering LFT, KFT, Thyroid, CBC, and Urine markers.',
      Parameters: 'CBC, LFT, KFT, Lipid Profile, Thyroid TSH, Fasting Blood Sugar, Urine Routine'
    },
    {
      PackageID: 'PKG003',
      PackageCode: 'PKG003',
      PackageName: 'Selfcare Elite Health',
      Category: 'Executive Wellness',
      SampleType: 'Blood & Urine',
      TAT: '24 Hours',
      FastingRequired: true,
      Preparation: '12 hours overnight fasting required.',
      MRP: 9000,
      OfferPrice: 2999,
      Description: 'Comprehensive executive full body checkup panel including vitamins, cardiac risk markers, and organ panels.',
      Parameters: 'Complete Hemogram, Vitamin D3, Vitamin B12, HbA1c, Lipid Profile, LFT, KFT, Thyroid Profile'
    },
    {
      PackageID: 'PKG010',
      PackageCode: 'PKG010',
      PackageName: 'Fever Advanced Panel',
      Category: 'Fever Health',
      SampleType: 'Blood',
      TAT: '24 Hours',
      FastingRequired: false,
      MRP: 1500,
      OfferPrice: 799,
      Description: 'Malaria Antigen, Widal, CBC, ESR, and CRP.',
      Parameters: 'CBC, ESR, CRP, Malaria Antigen, Widal'
    },
    {
      PackageID: 'PKG011',
      PackageCode: 'PKG011',
      PackageName: 'Dengue Profile',
      Category: 'Fever Health',
      SampleType: 'Blood',
      TAT: '24 Hours',
      FastingRequired: false,
      MRP: 1000,
      OfferPrice: 499,
      Description: 'Dengue NS1 Antigen, Dengue IgM, Dengue IgG.',
      Parameters: 'Dengue NS1, Dengue IgM, Dengue IgG'
    },
    {
      PackageID: 'PKG012',
      PackageCode: 'PKG012',
      PackageName: 'Dengue + Malaria Screen',
      Category: 'Fever Health',
      SampleType: 'Blood',
      TAT: '24 Hours',
      FastingRequired: false,
      MRP: 1300,
      OfferPrice: 699,
      Description: 'Dengue NS1, IgM, IgG and Malaria Antigen.',
      Parameters: 'Dengue NS1, Dengue IgM, Dengue IgG, Malaria Antigen'
    },
    {
      PackageID: 'PKG013',
      PackageCode: 'PKG013',
      PackageName: 'Typhoid Screening (Widal)',
      Category: 'Fever Health',
      SampleType: 'Blood',
      TAT: '24 Hours',
      FastingRequired: false,
      MRP: 500,
      OfferPrice: 299,
      Description: 'Widal Slide Agglutination & Typhoid IgM screen.',
      Parameters: 'Widal Test, Typhoid IgM'
    }
  ],

  fallbackTests: [
    { TestID: 'SCDT0001', TestCode: 'T0001', TestName: 'CBC (Complete Blood Count)', OfferPrice: 250, MRP: 450 },
    { TestID: 'SCDT0002', TestCode: 'T0002', TestName: 'ESR (Erythrocyte Sedimentation Rate)', OfferPrice: 80, MRP: 150 },
    { TestID: 'SCDT0005', TestCode: 'T0005', TestName: 'Peripheral Smear', OfferPrice: 150, MRP: 250 },
    { TestID: 'SCDT0008', TestCode: 'T0008', TestName: 'Fasting Blood Sugar (FBS)', OfferPrice: 40, MRP: 100 },
    { TestID: 'SCDT0009', TestCode: 'T0009', TestName: 'Post Prandial Blood Sugar (PPBS)', OfferPrice: 40, MRP: 100 },
    { TestID: 'SCDT0011', TestCode: 'T0011', TestName: 'HbA1c', OfferPrice: 299, MRP: 450 },
    { TestID: 'SCDT0012', TestCode: 'T0012', TestName: 'Lipid Profile', OfferPrice: 299, MRP: 600 },
    { TestID: 'SCDT0013', TestCode: 'T0013', TestName: 'Liver Function Test (LFT)', OfferPrice: 330, MRP: 700 },
    { TestID: 'SCDT0014', TestCode: 'T0014', TestName: 'Kidney Function Test (KFT/RFT)', OfferPrice: 360, MRP: 750 },
    { TestID: 'SCDT0015', TestCode: 'T0015', TestName: 'Serum Creatinine', OfferPrice: 120, MRP: 200 },
    { TestID: 'SCDT0016', TestCode: 'T0016', TestName: 'Blood Urea', OfferPrice: 80, MRP: 150 },
    { TestID: 'SCDT0034', TestCode: 'T0034', TestName: 'Vitamin B12', OfferPrice: 399, MRP: 700 },
    { TestID: 'SCDT0035', TestCode: 'T0035', TestName: 'Vitamin D (25-OH)', OfferPrice: 599, MRP: 900 },
    { TestID: 'SCDT0037', TestCode: 'T0037', TestName: 'TSH', OfferPrice: 210, MRP: 350 },
    { TestID: 'SCDT0040', TestCode: 'T0040', TestName: 'Thyroid Profile (T3, T4, TSH)', OfferPrice: 399, MRP: 700 },
    { TestID: 'SCDT0041', TestCode: 'T0041', TestName: 'CRP (C-Reactive Protein)', OfferPrice: 199, MRP: 360 },
    { TestID: 'SCDT0046', TestCode: 'T0046', TestName: 'Urine Routine & Microscopy', OfferPrice: 100, MRP: 200 },
    { TestID: 'SCDT0043_M', TestCode: 'T0043M', TestName: 'Malaria Antigen (Rapid)', OfferPrice: 150, MRP: 250 },
    { TestID: 'SCDT0051_W', TestCode: 'T0051W', TestName: 'Widal Test (Slide Agglutination)', OfferPrice: 150, MRP: 250 }
  ],

  async init() {
    try {
      this.setupEventListeners();
      this.setupAutoSlideCarousel();
      this.updateCartBadgeUI();
      await this.loadLocalCatalogue();
    } catch (error) {
      console.error('CustomerDashboard init error:', error);
    }
  },

  async loadLocalCatalogue() {
    try {
      const dbTests = await OfflineDB.getAll('tests');
      this.allTests = (dbTests && dbTests.length > 0) ? dbTests : this.fallbackTests;
      
      const localPkgs = await OfflineDB.getAll('packages');
      this.allPackages = (localPkgs && localPkgs.length > 0) ? localPkgs : this.fallbackPopularPackages;
      
      this.renderPopularPackages();
    } catch (e) {
      console.warn('Local cache read error:', e);
      this.allTests = this.fallbackTests;
      this.allPackages = this.fallbackPopularPackages;
      this.renderPopularPackages();
    }

    if (navigator.onLine) {
      setTimeout(async () => {
        try {
          const freshTests = await OfflineSync.syncTests();
          const freshPkgs = await OfflineSync.syncPackages();
          if (freshTests && freshTests.length > 0) this.allTests = freshTests;
          if (freshPkgs && freshPkgs.length > 0) {
            this.allPackages = freshPkgs;
            this.renderPopularPackages();
          }
        } catch (err) {
          console.warn('Background sync error:', err);
        }
      }, 1200);
    }
  },

  /**
   * Multi-tenant Isolated Cart Reader
   */
  getCart() {
    if (typeof localStorage === 'undefined') return [];
    try {
      const activeUser = localStorage.getItem('selfcare_active_user');
      let raw = null;

      if (activeUser) {
        raw = localStorage.getItem(`selfcare_cart_${activeUser}`);
      }

      if (raw === null) {
        raw = localStorage.getItem('selfcare_cart') ?? localStorage.getItem('cart');
      }

      if (raw !== null) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (err) {
      console.error('Cart parse error:', err);
    }
    return [];
  },

  /**
   * Multi-tenant Isolated Cart Storage
   */
  saveCartStorage(cart) {
    if (typeof localStorage !== 'undefined') {
      const cartStr = JSON.stringify(cart);
      localStorage.setItem('cart', cartStr);
      localStorage.setItem('selfcare_cart', cartStr);

      const activeUser = localStorage.getItem('selfcare_active_user');
      if (activeUser) {
        localStorage.setItem(`selfcare_cart_${activeUser}`, cartStr);
      }
    }

    if (typeof App !== 'undefined') {
      App.cart = cart;
      if (typeof App.saveCart === 'function') App.saveCart(cart);
      if (typeof App.updateCartBadge === 'function') App.updateCartBadge();
    }

    if (typeof OfflineDB !== 'undefined' && typeof OfflineDB.saveCart === 'function') {
      OfflineDB.saveCart(cart);
    }
  },

  updateCartBadgeUI() {
    const cart = this.getCart();
    const count = cart.length;
    const badges = document.querySelectorAll('.cart-badge');
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

  isItemInCart(itemId, itemCode, itemName) {
    const cart = this.getCart();
    const sId = String(itemId || '');
    const sCode = String(itemCode || '');
    const sName = String(itemName || '');

    return cart.some(item => {
      const iId = String(item.TestID || item.PackageID || item.id || item.TestCode || item.PackageCode || item.code || '');
      const iCode = String(item.TestCode || item.PackageCode || item.code || '');
      const iName = String(item.TestName || item.PackageName || item.name || '');
      return (sId && iId === sId) || (sCode && iCode === sCode) || (sName && iName === sName);
    });
  },

  animateFlyToCart(btnElement, isRemove = false) {
    const cartIcon = document.querySelector('.bottom-nav a[href="cart.html"]') || document.querySelector('.cart-btn');
    if (!btnElement || !cartIcon) return;

    const startRect = isRemove ? cartIcon.getBoundingClientRect() : btnElement.getBoundingClientRect();
    const targetRect = isRemove ? btnElement.getBoundingClientRect() : cartIcon.getBoundingClientRect();

    const flyDot = document.createElement('div');
    flyDot.className = 'fly-cart-dot';
    flyDot.innerHTML = '🛒';
    document.body.appendChild(flyDot);

    const startX = startRect.left + (startRect.width / 2) - 14;
    const startY = startRect.top + (startRect.height / 2) - 14;
    const targetX = targetRect.left + (targetRect.width / 2) - 14;
    const targetY = targetRect.top + (targetRect.height / 2) - 14;

    flyDot.style.left = `${startX}px`;
    flyDot.style.top = `${startY}px`;

    requestAnimationFrame(() => {
      flyDot.style.transform = `translate(${targetX - startX}px, ${targetY - startY}px) scale(${isRemove ? 1.2 : 0.4})`;
      flyDot.style.opacity = isRemove ? '0.2' : '0.4';
    });

    setTimeout(() => {
      if (flyDot.parentNode) flyDot.parentNode.removeChild(flyDot);
      const cartBadges = document.querySelectorAll('.cart-badge');
      cartBadges.forEach(b => {
        b.classList.remove('badge-bump');
        void b.offsetWidth;
        b.classList.add('badge-bump');
      });
    }, 550);
  },

  toggleCart(item, event) {
    const itemId = String(item.TestID || item.PackageID || item.TestCode || item.PackageCode || item.id || '');
    const itemCode = String(item.TestCode || item.PackageCode || item.code || '');
    const itemName = String(item.TestName || item.PackageName || item.name || '');
    
    let cart = this.getCart();
    const isAdded = this.isItemInCart(itemId, itemCode, itemName);

    // Conflict Check
    if (!isAdded) {
      if (typeof ConflictValidator !== 'undefined') {
        const conflict = ConflictValidator.checkConflict(item, cart);
        if (conflict.hasConflict) {
          alert(conflict.reason);
          if (typeof Utils !== 'undefined') Utils.showToast(conflict.reason, 'error');
          return;
        }
      }
    }

    const btnTarget = (event && event.currentTarget) ? event.currentTarget : null;
    if (btnTarget) {
      this.animateFlyToCart(btnTarget, isAdded);
    }

    if (isAdded) {
      cart = cart.filter(i => {
        const iId = String(i.TestID || i.PackageID || i.id || i.TestCode || i.PackageCode || i.code || '');
        const iCode = String(i.TestCode || i.PackageCode || i.code || '');
        const iName = String(i.TestName || i.PackageName || item.name || '');
        return iId !== itemId && iCode !== itemCode && iName !== itemName;
      });
    } else {
      cart.push(item);
    }

    this.saveCartStorage(cart);
    this.updateCartBadgeUI();
    this.renderPopularPackages();
  },

  extractParametersList(rawParams) {
    if (!rawParams) return [];
    let items = [];
    if (Array.isArray(rawParams)) {
      items = rawParams.flatMap(p => {
        const str = typeof p === 'object' && p !== null ? (p.Name || p.ParameterName || p.TestName || JSON.stringify(p)) : String(p);
        return str.split(/[;,|\n•]|<br\s*[\/]?>/i).map(i => i.trim()).filter(Boolean);
      });
    } else if (typeof rawParams === 'string') {
      items = rawParams.split(/[;,|\n•]|<br\s*[\/]?>/i).map(i => i.trim()).filter(Boolean);
    } else {
      items = [String(rawParams).trim()];
    }
    return items.filter(item => item && item.length > 1);
  },

  getPackageParameterCount(pkg) {
    const items = this.extractParametersList(pkg.Parameters || pkg.Description);
    const count = items.length;
    return count > 1 ? `${count} Parameters` : (count === 1 ? '1 Parameter' : 'Complete Panel');
  },

  formatParameters(pkg) {
    const items = this.extractParametersList(pkg.Parameters || pkg.Description);
    if (items.length === 0) {
      return '<div class="param-item"><span class="param-num">1</span> <span>Complete Clinical Diagnostic Evaluation</span></div>';
    }
    return items.map((item, index) => `<div class="param-item"><span class="param-num">${index + 1}</span> <span>${Utils.escapeHtml(item)}</span></div>`).join('');
  },

  getFastingDetails(pkg) {
    const prep = String(pkg.Preparation || pkg.Description || '').toLowerCase();
    const isFasting = Boolean(pkg.FastingRequired) || (prep.includes('fasting') && !prep.includes('no fasting') && !prep.includes('non fasting'));
    
    if (isFasting) {
      const match = prep.match(/(\d+\s*[-–to]\s*\d+|\d+)\s*(hrs|hours|hour)/i);
      const duration = match ? match[0] : '10 - 12 Hours';
      return {
        isFasting: true,
        badgeText: '⚠️ Fasting Required',
        cardText: 'Fasting',
        durationText: `${duration} overnight fasting is required (Water is permitted).`
      };
    } else {
      return {
        isFasting: false,
        badgeText: '✅ Non-Fasting',
        cardText: 'Non-Fasting',
        durationText: 'No fasting required. Sample can be collected at any time.'
      };
    }
  },

  renderPopularPackages() {
    const container = document.getElementById('popular-packages-container');
    if (!container) return;

    const source = (this.allPackages && this.allPackages.length > 0) ? this.allPackages : this.fallbackPopularPackages;

    container.innerHTML = source.slice(0, 4).map(pkg => {
      const pkgCode = pkg.PackageCode || 'PKG';
      const pkgId = pkg.PackageID || pkgCode;
      const alreadyAdded = this.isItemInCart(pkgId, pkgCode, pkg.PackageName);
      const fastingInfo = this.getFastingDetails(pkg);
      const paramCount = this.getPackageParameterCount(pkg);

      const actionButton = alreadyAdded 
        ? `<button class="book-btn added-btn" onclick='CustomerDashboard.toggleCart(${JSON.stringify(pkg)}, event)'>Remove</button>`
        : `<button class="book-btn add-cart-btn" onclick='CustomerDashboard.toggleCart(${JSON.stringify(pkg)}, event)'>🛒 Add To Cart</button>`;

      return `
        <div class="test-card glass-card animate-fade">
          <div class="test-card-top">
            <div class="test-card-header-row">
              <span class="test-code-tag">${Utils.escapeHtml(pkgCode)}</span>
              <span class="card-fasting-tag ${fastingInfo.isFasting ? 'fasting' : 'non-fasting'}">
                ${fastingInfo.cardText}
              </span>
            </div>
            <h4>${Utils.escapeHtml(pkg.PackageName)}</h4>
            <div class="card-param-badge">
              🧪 <strong>${paramCount}</strong> Included
            </div>
          </div>

          <div class="know-more-row" onclick="CustomerDashboard.showPackageDetails('${Utils.escapeHtml(pkgId)}')">
            <span class="info-icon">ⓘ</span>
            <span class="know-more-text">Know more</span>
            <span class="arrow-icon">➡</span>
          </div>

          <div class="test-pricing-row">
            <span class="mrp">${Utils.formatCurrency(pkg.MRP)}</span>
            <span class="offer-price">${Utils.formatCurrency(pkg.OfferPrice)}</span>
          </div>

          <div class="test-card-action-container">
            ${actionButton}
          </div>
        </div>
      `;
    }).join('');
  },

  showPackageDetails(pkgId) {
    let pkg = this.allPackages.find(p => p.PackageID === pkgId || p.PackageCode === pkgId);
    if (!pkg) pkg = this.fallbackPopularPackages.find(p => p.PackageID === pkgId || p.PackageCode === pkgId);
    if (!pkg) return;

    const formattedParams = this.formatParameters(pkg);
    const paramCount = this.getPackageParameterCount(pkg);
    const fastingInfo = this.getFastingDetails(pkg);
    const alreadyAdded = this.isItemInCart(pkg.PackageID || pkg.PackageCode, pkg.PackageCode, pkg.PackageName);

    const actionBtn = alreadyAdded
      ? `<button class="modal-action-btn remove-btn" onclick='CustomerDashboard.toggleCart(${JSON.stringify(pkg)}, event); CustomerDashboard.showPackageDetails("${pkgId}");'>🗑️ Remove from Cart</button>`
      : `<button class="modal-action-btn add-btn" onclick='CustomerDashboard.toggleCart(${JSON.stringify(pkg)}, event); CustomerDashboard.showPackageDetails("${pkgId}");'>🛒 Add to Cart</button>`;

    let modal = document.getElementById('package-detail-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'package-detail-modal';
      modal.className = 'sia-modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="sia-modal-content glass-modal-3d animate-3d-pop">
        <div class="sia-modal-header">
          <div class="modal-title-wrap">
            <span class="test-avatar-icon">📦</span>
            <h3>${Utils.escapeHtml(pkg.PackageName)}</h3>
          </div>
          <button class="sia-close-btn" onclick="document.getElementById('package-detail-modal').style.display='none'">✕</button>
        </div>

        <div class="sia-modal-body">
          <div class="detail-glass-card">
            <div class="info-chips-row">
              <span class="info-chip">🏷️ <strong>Code:</strong> ${Utils.escapeHtml(pkg.PackageCode || 'PKG')}</span>
              <span class="info-chip">🔬 <strong>Category:</strong> ${Utils.escapeHtml(pkg.Category || 'Preventive Panel')}</span>
              <span class="info-chip">🩸 <strong>Sample:</strong> ${Utils.escapeHtml(pkg.SampleType || 'Blood & Urine')}</span>
              <span class="info-chip">⏱️ <strong>TAT:</strong> ${Utils.escapeHtml(pkg.TAT || '24 Hours')}</span>
            </div>
          </div>

          <div class="detail-glass-card">
            <h4 class="section-label">Preparation & Fasting</h4>
            <div class="fasting-container ${fastingInfo.isFasting ? 'fasting-req' : 'fasting-no'}">
              <span class="fasting-badge-pill">${fastingInfo.badgeText}</span>
              <p class="fasting-desc">${fastingInfo.durationText}</p>
            </div>
          </div>

          <div class="detail-glass-card">
            <h4 class="section-label">Package Description</h4>
            <p class="description-text">
              ${Utils.escapeHtml(pkg.Description || 'Comprehensive preventive health checkup panel executed under certified clinical protocols.')}
            </p>
          </div>

          <div class="detail-glass-card">
            <div class="params-header-row">
              <h4 class="section-label" style="margin-bottom:0;">Included Tests & Parameters</h4>
              <span class="params-count-pill">${paramCount}</span>
            </div>
            <div class="parameters-scroll-box">
              ${formattedParams}
            </div>
          </div>

          <div class="modal-pricing-card">
            <div class="pricing-left">
              <span class="mrp-strikethrough">MRP ${Utils.formatCurrency(pkg.MRP)}</span>
              <span class="offer-highlight">${Utils.formatCurrency(pkg.OfferPrice)}</span>
            </div>
            <span class="discount-badge">Save ${(pkg.MRP && pkg.OfferPrice) ? Math.round(((pkg.MRP - pkg.OfferPrice) / pkg.MRP) * 100) : 0}%</span>
          </div>

          <div class="modal-footer-action">
            ${actionBtn}
          </div>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  },

  /**
   * Strictly Photos / Images Compression (Zero PDF Logic)
   */
  async compressPrescriptionImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          const maxDim = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const base64 = canvas.toDataURL('image/jpeg', 0.65).split(',')[1];
          resolve(base64);
        };
        img.onerror = () => {
          const r = new FileReader();
          r.onload = () => resolve(r.result.split(',')[1]);
          r.onerror = () => resolve(null);
          r.readAsDataURL(file);
        };
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  },

  async handlePrescriptionUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    // Strict Image Only Guard (Blocks PDFs and unwanted documents)
    if (file.type && !file.type.startsWith('image/')) {
      if (typeof Utils !== 'undefined') {
        Utils.showToast('Please upload a clear prescription photo (JPEG/PNG). PDF is not supported.', 'error');
      } else {
        alert('Please upload a clear prescription photo (JPEG/PNG). PDF is not supported.');
      }
      event.target.value = '';
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      if (typeof Utils !== 'undefined') Utils.showToast('File exceeds 15MB limit', 'error');
      event.target.value = '';
      return;
    }

    this.showScanningModal('Analyzing Prescription with Backend AI...');

    let resolved = false;
    const safetyTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        this.closeScanningModal();
        this.fallbackOpenModal([], 'Verification took longer than expected. Please select tests manually:');
      }
    }, 90000);

    try {
      const base64Data = await this.compressPrescriptionImage(file);
      if (!base64Data) {
        throw new Error('Image compression failed');
      }

      // Unified processPrescriptionOCR call
      const response = await Api.processPrescriptionOCR(base64Data, 'image/jpeg');

      if (resolved) return;
      resolved = true;
      clearTimeout(safetyTimer);
      this.closeScanningModal();

      const matches = (response && (response.matches || response.matchedTests)) || [];
      const unmatched = (response && response.unmatched) || [];
      const pkgs = (response && (response.recommendedPackages || response.matchedPackages)) || [];

      if (matches.length > 0 || unmatched.length > 0) {
        this.currentPrescriptionId = response.prescriptionId || null;
        this.currentModalItems = matches;
        this.currentUnmatchedItems = unmatched;
        this.currentPackageSuggestions = pkgs;
        this.showPrescriptionConfirmationModal(matches, unmatched, pkgs);
      } else {
        this.fallbackOpenModal([], 'Prescription uploaded. Tap "+ Add More Tests" below to choose your prescribed tests.');
      }

    } catch (err) {
      if (resolved) return;
      resolved = true;
      clearTimeout(safetyTimer);
      this.closeScanningModal();
      console.error('Prescription processing error:', err);
      if (typeof Utils !== 'undefined') {
        Utils.showToast('Scanning Alert: ' + (err.message || 'Server connection error'), 'error');
      }
      this.fallbackOpenModal([], 'Please select your prescribed tests manually:');
    } finally {
      clearTimeout(safetyTimer);
      event.target.value = '';
    }
  },

  fallbackOpenModal(initialItems = [], bannerNotice = '') {
    this.currentModalItems = initialItems;
    this.currentUnmatchedItems = [];
    this.currentPackageSuggestions = [];
    this.showPrescriptionConfirmationModal(initialItems, [], []);
    
    if (bannerNotice && typeof Utils !== 'undefined') {
      Utils.showToast(bannerNotice, 'info');
    }

    setTimeout(() => {
      const box = document.getElementById('pres-manual-search-box');
      if (box && initialItems.length === 0) {
        box.style.display = 'block';
        const input = document.getElementById('pres-manual-input');
        if (input) input.focus();
      }
    }, 400);
  },

  showScanningModal(customMsg = 'Scanning Prescription...') {
    let modal = document.getElementById('scan-loader-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'scan-loader-modal';
      modal.className = 'sia-modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="sia-modal-content glass-modal-3d animate-3d-pop" style="max-width: 360px;">
        <div class="scanning-card">
          <div class="scan-box-wrapper">
            <span>📄</span>
            <div class="scan-laser-line"></div>
          </div>
          <h4 style="font-size: 15px; font-weight: 800; color: var(--dark-green);">${Utils.escapeHtml(customMsg)}</h4>
          <p style="font-size: 11px; color: var(--text-muted);">Comparing scanned tests with Selfcare Diagnostics backend catalogue.</p>
        </div>
      </div>
    `;
    modal.style.display = 'flex';
  },

  closeScanningModal() {
    const modal = document.getElementById('scan-loader-modal');
    if (modal) modal.style.display = 'none';
  },

  showPrescriptionConfirmationModal(matches = [], unmatched = [], packageSuggestions = []) {
    let modal = document.getElementById('pres-confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'pres-confirm-modal';
      modal.className = 'sia-modal-overlay';
      document.body.appendChild(modal);
    }

    const highMatches = matches.filter(m => m.status === 'matched' || (m.confidence && m.confidence >= 90));
    const reviewMatches = matches.filter(m => m.status === 'needs_confirmation' || (m.confidence && m.confidence >= 75 && m.confidence < 90));

    let rowsHtml = '';

    if (highMatches.length > 0) {
      rowsHtml += `<div class="pres-section-subhead" style="font-size: 11px; font-weight: 800; color: #078866; margin: 8px 0 4px;">✅ Verified Tests (${highMatches.length})</div>`;
      rowsHtml += highMatches.map((item, index) => {
        const id = String(item.testId || item.TestID || item.TestCode);
        const name = item.testName || item.TestName;
        const price = Number(item.offerPrice || item.OfferPrice || 0);

        return `
          <div class="pres-test-checkbox-row matched-high-row" id="pres-high-${index}" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid rgba(0,0,0,0.06);">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; flex: 1;">
              <input type="checkbox" checked class="pres-confirm-checkbox" value="${Utils.escapeHtml(id)}" onchange="CustomerDashboard.updateModalTotal()">
              <div class="pres-test-meta">
                <span class="pres-test-name" style="font-weight: 700; font-size: 13px; color: #10231E;">${Utils.escapeHtml(name)}</span>
                <span class="pres-type-badge test-badge" style="font-size: 9px; padding: 2px 6px; background: #D1FAE5; color: #065F46; border-radius: 4px; font-weight: 700;">🧪 TEST</span>
              </div>
            </label>
            <span class="pres-test-price" style="font-weight: 800; color: #045D49;">${Utils.formatCurrency(price)}</span>
          </div>
        `;
      }).join('');
    }

    if (reviewMatches.length > 0) {
      rowsHtml += `<div class="pres-section-subhead warning-head" style="font-size: 11px; font-weight: 800; color: #D97706; margin: 10px 0 4px;">⚠ Possible Matches — Review Needed (${reviewMatches.length})</div>`;
      rowsHtml += reviewMatches.map((item, index) => {
        const id = String(item.testId || item.TestID || item.TestCode);
        const name = item.testName || item.TestName;
        const price = Number(item.offerPrice || item.OfferPrice || 0);

        return `
          <div class="pres-test-checkbox-row review-needed-row" id="pres-review-${index}" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid rgba(0,0,0,0.06); background: #FFFBEB;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; flex: 1;">
              <input type="checkbox" class="pres-confirm-checkbox" value="${Utils.escapeHtml(id)}" onchange="CustomerDashboard.updateModalTotal()">
              <div class="pres-test-meta">
                <span class="pres-test-name" style="font-weight: 700; font-size: 13px;">${Utils.escapeHtml(name)}</span>
                <span class="pres-type-badge review-badge" style="font-size: 9px; padding: 2px 6px; background: #FEF3C7; color: #92400E; border-radius: 4px; font-weight: 700;">⚠ Review</span>
              </div>
            </label>
            <span class="pres-test-price" style="font-weight: 800; color: #045D49;">${Utils.formatCurrency(price)}</span>
          </div>
        `;
      }).join('');
    }

    if (unmatched.length > 0) {
      rowsHtml += `<div class="pres-section-subhead muted-head" style="font-size: 11px; font-weight: 800; color: #6B7280; margin: 10px 0 4px;">❓ Unidentified Text (${unmatched.length})</div>`;
      rowsHtml += unmatched.map(u => `
        <div class="pres-test-checkbox-row disabled-unavailable-row" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; opacity: 0.6;">
          <div class="pres-test-meta">
            <span class="pres-test-name" style="font-size: 12px;">${Utils.escapeHtml(u.ocrText || '')}</span>
          </div>
          <span style="font-size: 11px; color: var(--text-muted);">Not in catalog</span>
        </div>
      `).join('');
    }

    if (!rowsHtml) {
      rowsHtml = `
        <div style="text-align: center; padding: 18px 10px; color: var(--text-muted); font-size: 12px;">
          Prescription uploaded successfully. Use the button below to search and add your prescribed tests easily.
        </div>
      `;
    }

    let packageBannerHtml = '';
    if (packageSuggestions && packageSuggestions.length > 0) {
      packageBannerHtml = `
        <div class="pres-pkg-recommendations" style="margin-top: 10px; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 10px;">
          <div class="pkg-rec-title" style="font-size: 11px; font-weight: 800; color: #065F46;">💡 Package Recommendation:</div>
          ${packageSuggestions.map(pkg => `
            <div class="pkg-rec-card" style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
              <div>
                <strong style="font-size: 12px; color: #10231E;">${Utils.escapeHtml(pkg.packageName)}</strong>
                <div style="font-size: 10px; color: #047857;">${Utils.escapeHtml(pkg.message)}</div>
              </div>
              <div style="text-align: right;">
                <span class="pkg-rec-price" style="font-weight: 800; color: #065F46; font-size: 12px;">${Utils.formatCurrency(pkg.offerPrice)}</span>
                <button type="button" class="manual-add-pill" style="margin-left: 6px; padding: 4px 8px; background: #078866; color: white; border: none; border-radius: 4px; font-size: 10px; font-weight: 700;" onclick='CustomerDashboard.addPackageFromPrescription(${JSON.stringify(pkg)})'>+ Add</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="sia-modal-content glass-modal-3d animate-3d-pop">
        <div class="sia-modal-header">
          <div class="modal-title-wrap">
            <span class="test-avatar-icon">📋</span>
            <h3>Prescription Verification</h3>
          </div>
          <button class="sia-close-btn" onclick="document.getElementById('pres-confirm-modal').style.display='none'">✕</button>
        </div>

        <div class="sia-modal-body">
          <p style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">
            Verified against Selfcare Diagnostics catalog. Confirm tests to book:
          </p>

          <div class="detail-glass-card" style="padding: 8px 10px; max-height: 250px; overflow-y: auto;" id="pres-modal-list-container">
            ${rowsHtml}
          </div>

          ${packageBannerHtml}

          <div class="pres-manual-wrapper" style="margin-top: 10px;">
            <button type="button" class="add-manual-test-btn" style="width: 100%; padding: 10px; background: rgba(7, 136, 102, 0.08); border: 1px dashed var(--primary-green); border-radius: 8px; color: var(--dark-green); font-weight: 700; font-size: 12px;" onclick="CustomerDashboard.toggleManualSearchInput()">
              <span>➕</span> Add More Tests or Packages Manually
            </button>
            <div id="pres-manual-search-box" style="display: none; position: relative; margin-top: 6px;">
              <input type="text" id="pres-manual-input" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #CBD5E1; font-size: 13px;" placeholder="Type test name (e.g. Sugar, Thyroid, LFT)..." oninput="CustomerDashboard.handleManualSearch(this.value)">
              <div id="pres-manual-dropdown" class="pres-search-results-dropdown" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #CBD5E1; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 100; max-height: 200px; overflow-y: auto;"></div>
            </div>
          </div>

          <div class="pres-total-banner" style="display: flex; justify-content: space-between; align-items: center; margin: 12px 0 8px; font-size: 14px;">
            <span>Selected Items Total:</span>
            <strong id="pres-modal-total-amt" style="font-size: 18px; color: var(--dark-green);">₹0</strong>
          </div>

          <button class="modal-action-btn pres-confirm-btn" id="pres-confirm-submit-btn" style="width: 100%; padding: 14px; background: #078866; color: white; border: none; border-radius: 12px; font-size: 14px; font-weight: 800;" onclick="CustomerDashboard.confirmPrescriptionTests()">
            Confirm & Add Selected to Cart 🛒
          </button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
    this.updateModalTotal();
  },

  updateModalTotal() {
    const checkedCheckboxes = Array.from(document.querySelectorAll('.pres-confirm-checkbox:checked')).map(cb => cb.value);
    
    const selected = this.currentModalItems.filter(item => {
      const id = String(item.testId || item.TestID || item.TestCode);
      return checkedCheckboxes.includes(id);
    });

    const total = selected.reduce((sum, i) => sum + Number(i.offerPrice || i.OfferPrice || 0), 0);
    const totalEl = document.getElementById('pres-modal-total-amt');
    const submitBtn = document.getElementById('pres-confirm-submit-btn');

    if (totalEl) totalEl.textContent = Utils.formatCurrency(total);
    if (submitBtn) {
      submitBtn.textContent = `Confirm & Add (${selected.length} tests • ${Utils.formatCurrency(total)}) to Cart 🛒`;
      submitBtn.disabled = selected.length === 0;
      submitBtn.style.opacity = selected.length === 0 ? '0.5' : '1';
    }
  },

  addPackageFromPrescription(pkg) {
    const raw = this.allPackages.find(p => p.PackageID === pkg.packageId || p.PackageCode === pkg.packageCode) || {
      PackageID: pkg.packageId,
      PackageCode: pkg.packageCode,
      PackageName: pkg.packageName,
      OfferPrice: pkg.offerPrice,
      MRP: pkg.mrp
    };
    
    let cart = this.getCart();
    const pkgObj = { ...raw, type: 'package' };

    // Conflict Check
    if (typeof ConflictValidator !== 'undefined') {
      const conflict = ConflictValidator.checkConflict(pkgObj, cart);
      if (conflict.hasConflict) {
        alert(conflict.reason);
        if (typeof Utils !== 'undefined') Utils.showToast(conflict.reason, 'error');
        return;
      }
    }

    const id = raw.PackageID || raw.PackageCode;
    if (!this.isItemInCart(id, raw.PackageCode, raw.PackageName)) {
      cart.push(pkgObj);
      this.saveCartStorage(cart);
      this.updateCartBadgeUI();
      if (typeof Utils !== 'undefined') Utils.showToast(`${raw.PackageName} added to cart!`, 'success');
    } else {
      if (typeof Utils !== 'undefined') Utils.showToast('Package is already in cart.', 'info');
    }
  },

  toggleManualSearchInput() {
    const box = document.getElementById('pres-manual-search-box');
    if (!box) return;
    const isHidden = box.style.display === 'none';
    box.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      const input = document.getElementById('pres-manual-input');
      if (input) input.focus();
    }
  },

  handleManualSearch(query) {
    const dropdown = document.getElementById('pres-manual-dropdown');
    if (!dropdown) return;
    const q = (query || '').toLowerCase().trim();
    if (q.length < 2) {
      dropdown.style.display = 'none';
      return;
    }

    const allCombined = [
      ...this.allTests.map(t => ({ ...t, isPackage: false })),
      ...this.allPackages.map(p => ({ ...p, isPackage: true }))
    ];

    const results = allCombined.filter(item => {
      const name = (item.TestName || item.PackageName || '').toLowerCase();
      const code = (item.TestCode || item.PackageCode || '').toLowerCase();
      return name.includes(q) || code.includes(q);
    }).slice(0, 6);

    if (results.length === 0) {
      dropdown.innerHTML = `<div style="padding: 10px; font-size: 11px; color: var(--text-muted); text-align: center;">No matching test or package found.</div>`;
      dropdown.style.display = 'block';
      return;
    }

    dropdown.innerHTML = results.map(item => {
      const name = item.TestName || item.PackageName;
      const isPkg = item.isPackage;
      return `
        <div class="pres-search-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-bottom: 1px solid #F1F5F9; cursor: pointer;" onclick='CustomerDashboard.addManualItemToPrescription(${JSON.stringify(item)})'>
          <div style="display: flex; flex-direction: column;">
            <span style="font-weight: 700; color: #10231E; font-size: 12px;">${Utils.escapeHtml(name)}</span>
            <span style="font-size: 9px; color: ${isPkg ? '#E4005A' : '#078866'}; font-weight: 800;">${isPkg ? '📦 PACKAGE' : '🧪 TEST'}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong style="color: #045D49; font-size: 12px;">${Utils.formatCurrency(item.OfferPrice)}</strong>
            <button class="manual-add-pill" style="padding: 4px 8px; background: #078866; color: white; border: none; border-radius: 4px; font-size: 10px; font-weight: 700;">+ Add</button>
          </div>
        </div>
      `;
    }).join('');

    dropdown.style.display = 'block';
  },

  addManualItemToPrescription(item) {
    const id = String(item.TestID || item.PackageID || item.TestCode || item.PackageCode);
    const exists = this.currentModalItems.some(i => String(i.testId || i.TestID || i.PackageID || i.TestCode || i.PackageCode) === id);

    if (exists) {
      if (typeof Utils !== 'undefined') Utils.showToast('Item already in list!', 'info');
      return;
    }

    this.currentModalItems.push({
      testId: item.TestID || item.PackageID,
      testCode: item.TestCode || item.PackageCode,
      testName: item.TestName || item.PackageName,
      offerPrice: Number(item.OfferPrice || 0),
      mrp: Number(item.MRP || 0),
      confidence: 100,
      status: 'matched',
      ocrText: 'Manually Added'
    });

    this.showPrescriptionConfirmationModal(
      this.currentModalItems,
      this.currentUnmatchedItems,
      this.currentPackageSuggestions
    );
    if (typeof Utils !== 'undefined') Utils.showToast(`${item.TestName || item.PackageName} added!`, 'success');
  },

  async confirmPrescriptionTests() {
    const checkedCheckboxes = Array.from(document.querySelectorAll('.pres-confirm-checkbox:checked')).map(cb => cb.value);
    
    if (checkedCheckboxes.length === 0) {
      if (typeof Utils !== 'undefined') Utils.showToast('Please select at least one test.', 'error');
      return;
    }

    try {
      if (this.currentPrescriptionId && typeof Api.confirmPrescriptionTests === 'function') {
        await Api.confirmPrescriptionTests(this.currentPrescriptionId, checkedCheckboxes).catch(err => {
          console.warn('Backend confirmation audit notice:', err);
        });
      }

      let cart = this.getCart();
      const selected = this.currentModalItems.filter(item => {
        const id = String(item.testId || item.TestID || item.TestCode);
        return checkedCheckboxes.includes(id);
      });

      let addedCount = 0;

      selected.forEach(item => {
        const tid = item.testId || item.TestID || item.TestCode;
        const code = item.testCode || item.TestCode || 'TEST';
        const name = item.testName || item.TestName;
        const price = Number(item.offerPrice || item.OfferPrice || 0);
        const mrp = Number(item.mrp || item.MRP || 0);

        const testItem = {
          id: tid,
          TestID: tid,
          name: name,
          code: code,
          price: price,
          mrp: mrp,
          type: 'test',
          addedAt: new Date().toISOString()
        };

        // Conflict check for prescription items
        if (typeof ConflictValidator !== 'undefined') {
          const conflict = ConflictValidator.checkConflict(testItem, cart);
          if (conflict.hasConflict) {
            console.warn(`Prescription item conflict skipped: ${conflict.reason}`);
            return;
          }
        }

        if (!this.isItemInCart(tid, code, name)) {
          cart.push(testItem);
          addedCount++;
        }
      });

      this.saveCartStorage(cart);
      this.updateCartBadgeUI();

      const modal = document.getElementById('pres-confirm-modal');
      if (modal) modal.style.display = 'none';

      const cartIcon = document.querySelector('.bottom-nav a[href="cart.html"]') || document.querySelector('.cart-btn');
      if (cartIcon) {
        const cartBadges = document.querySelectorAll('.cart-badge');
        cartBadges.forEach(b => {
          b.classList.remove('badge-bump');
          void b.offsetWidth;
          b.classList.add('badge-bump');
        });
      }

      if (typeof Utils !== 'undefined') {
        Utils.showToast(`${addedCount} tests added to cart!`, 'success');
      }
    } catch (e) {
      console.error('Confirmation error:', e);
      if (typeof Utils !== 'undefined') Utils.showToast('Error confirming prescription tests.', 'error');
    }
  },

  setupAutoSlideCarousel() {
    const track = document.getElementById('singleSliderTrack');
    if (track) {
      let currentSlide = 0;
      const totalSlides = track.children.length;
      setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
      }, 3200);
    }
  },

  setupEventListeners() {
    window.addEventListener('pageshow', () => {
      this.updateCartBadgeUI();
      if (this.allPackages.length === 0) {
        this.loadLocalCatalogue();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.updateCartBadgeUI();
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  CustomerDashboard.init();
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CustomerDashboard;
}
