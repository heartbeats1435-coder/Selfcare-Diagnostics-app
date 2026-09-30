/* file: assets/js/packages.js */
/**
 * Selfcare Diagnostics - Health Packages Page JS (Zero-Fail Edition) v4.2.0
 * Features:
 * 1. Dual-Layer Conflict Validation Engine check before adding packages to cart.
 * 2. Multi-tenant Vault-Aware Cart Isolation (selfcare_cart_${activeUser}).
 * 3. Dedicated Category Switcher (selectCategory).
 * 4. Parameters Count Badge on card box (`🧪 X Parameters Included`).
 * 5. Native Web Speech Recognition.
 * 6. Natural Language Symptom Search Engine.
 * 7. Fly-to-Cart Animation & 3D Parameter Details Modal.
 */

const PackagesPage = {
  allPackages: [],
  currentCategory: 'All',
  speechRecognitionInstance: null,

  fallbackPackages: [
    {
      PackageID: 'PKG001',
      PackageCode: 'PKG001',
      PackageName: 'Selfcare Basic Health Panel',
      Category: 'Preventive Health',
      SampleType: 'Blood & Urine',
      TAT: '24 Hours',
      FastingRequired: true,
      Preparation: '10 - 12 hours overnight fasting is mandatory.',
      MRP: 4000,
      OfferPrice: 1299,
      Description: 'Essential screening covering CBC, Fasting Blood Sugar, Lipid Profile, and Urine Routine.',
      Parameters: 'CBC, Fasting Blood Sugar, Lipid Profile, Urine Routine & Microscopy'
    },
    {
      PackageID: 'PKG002',
      PackageCode: 'PKG002',
      PackageName: 'Selfcare Premium Health Panel',
      Category: 'Comprehensive Health',
      SampleType: 'Blood & Urine',
      TAT: '24 Hours',
      FastingRequired: true,
      Preparation: '10 - 12 hours overnight fasting is mandatory.',
      MRP: 7000,
      OfferPrice: 1999,
      Description: 'Broader preventive screening panel covering LFT, KFT, Thyroid TSH, CBC, Lipid Profile, and Urine markers.',
      Parameters: 'CBC, Liver Function Test (LFT), Kidney Function Test (KFT), Lipid Profile, Thyroid TSH, Fasting Blood Sugar, Urine Routine'
    },
    {
      PackageID: 'PKG003',
      PackageCode: 'PKG003',
      PackageName: 'Selfcare Elite Health Panel',
      Category: 'Executive Wellness',
      SampleType: 'Blood & Urine',
      TAT: '24 Hours',
      FastingRequired: true,
      Preparation: '12 hours overnight fasting required.',
      MRP: 9000,
      OfferPrice: 2999,
      Description: 'Comprehensive executive full body checkup panel including vitamins, cardiac risk markers, and organ panels.',
      Parameters: 'Complete Hemogram, Vitamin D3, Vitamin B12, HbA1c, Lipid Profile, LFT, KFT, Thyroid Profile (T3, T4, TSH)'
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
      Description: 'Complete diagnostic screen for acute fever covering Malaria Antigen, Widal, CBC, ESR, and CRP.',
      Parameters: 'CBC, ESR, CRP, Malaria Antigen (Rapid), Widal Slide Test'
    },
    {
      PackageID: 'PKG011',
      PackageCode: 'PKG011',
      PackageName: 'Dengue Complete Profile',
      Category: 'Fever Health',
      SampleType: 'Blood',
      TAT: '24 Hours',
      FastingRequired: false,
      MRP: 1000,
      OfferPrice: 499,
      Description: 'Confirmatory viral dengue screen with NS1 antigen and antibody markers.',
      Parameters: 'Dengue NS1 Antigen, Dengue IgM Antibody, Dengue IgG Antibody'
    },
    {
      PackageID: 'PKG012',
      PackageCode: 'PKG012',
      PackageName: 'Dengue + Malaria Combined Screen',
      Category: 'Fever Health',
      SampleType: 'Blood',
      TAT: '24 Hours',
      FastingRequired: false,
      MRP: 1300,
      OfferPrice: 699,
      Description: 'Rapid dual screening for monsoon seasonal fevers.',
      Parameters: 'Dengue NS1, Dengue IgM, Dengue IgG, Malaria Rapid Antigen, Peripheral Smear'
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
      Description: 'Widal Slide Agglutination & Typhoid IgM screen for enteric fever diagnosis.',
      Parameters: 'Widal Slide Test, Typhoid IgM'
    }
  ],

  symptomDictionary: {
    'fever': ['fever', 'cbc', 'esr', 'crp', 'malaria', 'widal', 'dengue', 'typhoid', 'temperature', 'pkg010', 'pkg011', 'pkg012', 'pkg013'],
    'temperature': ['fever', 'cbc', 'esr', 'crp', 'malaria', 'widal', 'dengue', 'typhoid'],
    'kaichal': ['fever', 'cbc', 'esr', 'crp', 'malaria', 'widal', 'dengue', 'typhoid'],
    'chills': ['malaria', 'dengue', 'widal', 'fever', 'cbc'],
    'cold': ['fever', 'cbc', 'crp'],
    'joint pain': ['vitamin', 'calcium', 'uric acid', 'arthritis', 'elite', 'premium', 'pkg002', 'pkg003'],
    'knee pain': ['vitamin', 'calcium', 'uric acid', 'elite', 'premium'],
    'muttu vali': ['vitamin', 'calcium', 'uric acid', 'elite', 'premium'],
    'arthritis': ['vitamin', 'calcium', 'uric acid', 'elite'],
    'chest pain': ['cardiac', 'heart', 'lipid profile', 'cholesterol', 'elite', 'premium', 'pkg002', 'pkg003'],
    'nenju vali': ['cardiac', 'heart', 'lipid profile', 'cholesterol', 'elite', 'premium'],
    'heart': ['cardiac', 'heart', 'lipid profile', 'cholesterol', 'elite'],
    'tired': ['vitamin', 'b12', 'vitamin d', 'basic', 'premium', 'elite', 'sugar', 'hba1c', 'pkg001', 'pkg002', 'pkg003'],
    'fatigue': ['vitamin', 'b12', 'vitamin d', 'basic', 'premium', 'elite', 'sugar', 'hba1c'],
    'weakness': ['vitamin', 'b12', 'vitamin d', 'basic', 'premium', 'elite'],
    'asathi': ['vitamin', 'b12', 'vitamin d', 'basic', 'premium', 'elite'],
    'sugar': ['sugar', 'glucose', 'diabetes', 'fbs', 'hba1c', 'basic', 'premium', 'elite', 'pkg001', 'pkg002', 'pkg003'],
    'diabetes': ['sugar', 'glucose', 'diabetes', 'fbs', 'hba1c', 'basic', 'premium', 'elite'],
    'sakkarai': ['sugar', 'glucose', 'diabetes', 'fbs', 'hba1c'],
    'thyroid': ['thyroid', 'tsh', 'premium', 'elite', 'pkg002', 'pkg003'],
    'full body': ['basic', 'premium', 'elite', 'preventive', 'wellness', 'pkg001', 'pkg002', 'pkg003'],
    'master health': ['elite', 'premium', 'pkg002', 'pkg003'],
    'body checkup': ['basic', 'premium', 'elite', 'pkg001', 'pkg002', 'pkg003'],
    'liver': ['lft', 'liver', 'premium', 'elite', 'pkg002', 'pkg003'],
    'kidney': ['kft', 'kidney', 'creatinine', 'premium', 'elite', 'pkg002', 'pkg003'],
    'jaundice': ['lft', 'liver', 'bilirubin', 'premium', 'elite'],
    'dengue': ['dengue', 'ns1', 'platelet', 'fever', 'pkg011', 'pkg012'],
    'malaria': ['malaria', 'smear', 'fever', 'pkg010', 'pkg012'],
    'typhoid': ['typhoid', 'widal', 'fever', 'pkg010', 'pkg013']
  },

  stopWords: [
    'i', 'have', 'had', 'am', 'having', 'feeling', 'got', 'last', 'past', 'days',
    'day', 'severe', 'mild', 'acute', 'chronic', 'pain', 'since', 'weeks', 'week',
    'from', 'suffering', 'my', 'the', 'a', 'an', 'and', 'for', 'with', 'in', 'of',
    'to', 'me', 'please', 'suggest', 'package', 'packages', 'check', 'any'
  ],

  async init() {
    try {
      this.setupEventListeners();
      this.setupAutoSlideCarousel();
      this.updateCartBadgeUI();
      await this.loadPackagesCatalogue();
      this.checkUrlForPackageDetail();
    } catch (error) {
      console.error('PackagesPage init error:', error);
    }
  },

  async loadPackagesCatalogue() {
    const container = document.getElementById('packages-catalogue-container');
    if (!container) return;

    if (this.allPackages && this.allPackages.length > 0) {
      this.renderPackages(this.allPackages);
    }

    try {
      const cached = await OfflineDB.getAll('packages');
      if (cached && cached.length > 0) {
        this.allPackages = cached;
        this.filterAndRender();
      } else {
        this.allPackages = this.fallbackPackages;
        this.renderPackages(this.allPackages);
      }
    } catch (e) {
      console.warn('Cache load error:', e);
      this.allPackages = this.fallbackPackages;
      this.renderPackages(this.allPackages);
    }

    if (navigator.onLine && typeof OfflineSync !== 'undefined') {
      setTimeout(async () => {
        try {
          const fresh = await OfflineSync.syncPackages();
          if (fresh && fresh.length > 0) {
            this.allPackages = fresh;
            this.filterAndRender();
          }
        } catch (err) {
          console.warn('Silent sync error:', err);
        }
      }, 1000);
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

  updateCartBadgeUI() {
    const cart = this.getCart();
    const count = cart.length;
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(b => {
      if (count > 0) {
        b.textContent = count;
        b.style.display = 'inline-block';
      } else {
        b.textContent = '0';
        b.style.display = 'none';
      }
    });
  },

  isItemInCart(packageId, packageCode, packageName) {
    const cart = this.getCart();
    const sId = String(packageId || '');
    const sCode = String(packageCode || '');
    const sName = String(packageName || '');

    return cart.some(item => {
      const iId = String(item.PackageID || item.id || item.TestID || item.PackageCode || item.code || '');
      const iCode = String(item.PackageCode || item.code || item.TestCode || '');
      const iName = String(item.PackageName || item.name || item.TestName || '');
      return (sId && iId === sId) || (sCode && iCode === sCode) || (sName && iName === sName);
    });
  },

  animateFlyToCart(btnElement, isRemove = false) {
    const cartIcon = document.querySelector('.bottom-nav a[href="cart.html"]') || document.querySelector('.cart-badge');
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
      const cartBadge = document.querySelector('.cart-badge');
      if (cartBadge) {
        cartBadge.classList.remove('badge-bump');
        void cartBadge.offsetWidth;
        cartBadge.classList.add('badge-bump');
      }
    }, 550);
  },

  /**
   * Multi-tenant Isolated Toggle Cart Action
   */
  toggleCart(pkg, event) {
    const packageCode = pkg.PackageCode || 'PKG';
    const packageId = pkg.PackageID || packageCode;
    const packageName = pkg.PackageName || '';
    
    let cart = this.getCart();
    const isAdded = this.isItemInCart(packageId, packageCode, packageName);

    // Conflict Check: Cart-il illadha Package add seiyumbothu validate seigirom
    if (!isAdded) {
      const pkgWithMeta = { ...pkg, type: 'package' };
      if (typeof ConflictValidator !== 'undefined') {
        const conflict = ConflictValidator.checkConflict(pkgWithMeta, cart);
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
        const iId = String(i.PackageID || i.id || i.TestID || i.PackageCode || i.code || '');
        const iCode = String(i.PackageCode || i.code || i.TestCode || '');
        const iName = String(i.PackageName || i.name || i.TestName || '');
        return iId !== packageId && iCode !== packageCode && iName !== packageName;
      });
    } else {
      cart.push({ ...pkg, type: 'package' });
    }

    const cartStr = JSON.stringify(cart);
    localStorage.setItem('cart', cartStr);
    localStorage.setItem('selfcare_cart', cartStr);

    // Multi-tenant user isolation key
    const activeUser = localStorage.getItem('selfcare_active_user');
    if (activeUser) {
      localStorage.setItem(`selfcare_cart_${activeUser}`, cartStr);
    }

    if (typeof App !== 'undefined') {
      App.cart = cart;
      if (typeof App.saveCart === 'function') App.saveCart(cart);
      if (typeof App.updateCartBadge === 'function') App.updateCartBadge();
    }
    if (typeof OfflineDB !== 'undefined' && typeof OfflineDB.saveCart === 'function') {
      OfflineDB.saveCart(cart);
    }

    this.updateCartBadgeUI();
    this.filterAndRender();
  },

  /**
   * Category Filter Handler for UI Pills / Chips
   */
  selectCategory(category) {
    this.currentCategory = category || 'All';

    document.querySelectorAll('.cat-pill, .filter-chip').forEach(el => {
      const match = el.textContent.trim().toLowerCase() === this.currentCategory.toLowerCase();
      el.classList.toggle('active', match);
    });

    this.filterAndRender();
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

  renderPackages(packages) {
    const container = document.getElementById('packages-catalogue-container');
    if (!container) return;

    if (!packages || packages.length === 0) {
      container.innerHTML = '<p class="empty-msg">No health packages found matching your symptoms or query.</p>';
      return;
    }

    container.innerHTML = packages.map(pkg => {
      const packageCode = pkg.PackageCode || 'PKG';
      const packageId = pkg.PackageID || packageCode;
      const alreadyAdded = this.isItemInCart(packageId, packageCode, pkg.PackageName);
      const fastingInfo = this.getFastingDetails(pkg);
      const paramCount = this.getPackageParameterCount(pkg);

      const actionButton = alreadyAdded 
        ? `<button class="book-btn added-btn" onclick='PackagesPage.toggleCart(${JSON.stringify(pkg)}, event)'>Remove</button>`
        : `<button class="book-btn add-cart-btn" onclick='PackagesPage.toggleCart(${JSON.stringify(pkg)}, event)'>🛒 Add To Cart</button>`;

      return `
        <div class="package-card glass-card animate-fade">
          <div class="package-card-top">
            <div class="package-card-header-row">
              <span class="package-code-tag">${Utils.escapeHtml(packageCode)}</span>
              <span class="card-fasting-tag ${fastingInfo.isFasting ? 'fasting' : 'non-fasting'}">
                ${fastingInfo.cardText}
              </span>
            </div>
            <h4>${Utils.escapeHtml(pkg.PackageName)}</h4>
            <div class="card-param-badge">
              🧪 <strong>${paramCount}</strong> Included
            </div>
          </div>

          <div class="know-more-row" onclick="PackagesPage.showPackageDetails('${Utils.escapeHtml(packageId)}')">
            <span class="info-icon">ⓘ</span>
            <span class="know-more-text">Know more</span>
            <span class="arrow-icon">➡</span>
          </div>

          <div class="package-pricing-row">
            <span class="mrp">${Utils.formatCurrency(pkg.MRP)}</span>
            <span class="offer-price">${Utils.formatCurrency(pkg.OfferPrice)}</span>
          </div>

          <div class="package-card-action-container">
            ${actionButton}
          </div>
        </div>
      `;
    }).join('');
  },

  filterPackagesByQuery(query) {
    if (!query) return this.allPackages;
    const cleanQuery = query.toLowerCase().trim();

    let symptomMatchedTargetTerms = [];
    Object.keys(this.symptomDictionary).forEach(symptomKey => {
      if (cleanQuery.includes(symptomKey)) {
        symptomMatchedTargetTerms.push(...this.symptomDictionary[symptomKey]);
      }
    });

    const words = cleanQuery
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !this.stopWords.includes(w));

    return this.allPackages.filter(pkg => {
      const name = String(pkg.PackageName || '').toLowerCase();
      const code = String(pkg.PackageCode || '').toLowerCase();
      const category = String(pkg.Category || '').toLowerCase();
      const desc = String(pkg.Description || '').toLowerCase();
      const params = String(pkg.Parameters || '').toLowerCase();
      const prep = String(pkg.Preparation || '').toLowerCase();
      const testIds = String(pkg.TestIDs || '').toLowerCase();

      const combinedMeta = `${name} ${code} ${category} ${desc} ${params} ${prep} ${testIds}`;

      if (combinedMeta.includes(cleanQuery)) {
        return true;
      }

      if (symptomMatchedTargetTerms.length > 0) {
        const matchesSymptom = symptomMatchedTargetTerms.some(term => {
          return code === term || name.includes(term) || desc.includes(term) || params.includes(term) || category.includes(term);
        });
        if (matchesSymptom) return true;
      }

      if (words.length > 0) {
        return words.some(word => combinedMeta.includes(word));
      }

      return false;
    });
  },

  startVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (typeof Utils !== 'undefined') {
        Utils.showToast('Voice Search is not supported on this browser. Please use Chrome.', 'error');
      } else {
        alert('Voice Search is not supported on this browser. Please use Chrome.');
      }
      return;
    }

    const voiceBtn = document.getElementById('voice-search-btn') || document.querySelector('.voice-search-btn');
    const searchInput = document.getElementById('packages-search-input');

    if (this.speechRecognitionInstance) {
      try {
        this.speechRecognitionInstance.stop();
      } catch (e) {}
      this.speechRecognitionInstance = null;
      if (voiceBtn) {
        voiceBtn.classList.remove('listening');
        voiceBtn.innerHTML = '🎙️';
      }
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      this.speechRecognitionInstance = recognition;
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (voiceBtn) {
          voiceBtn.classList.add('listening');
          voiceBtn.innerHTML = '🔴';
        }
        if (typeof Utils !== 'undefined') {
          Utils.showToast('🎙️ Listening... Speak health package or symptoms now', 'info');
        }
      };

      recognition.onresult = (event) => {
        const transcript = event.results && event.results[0] && event.results[0][0] ? event.results[0][0].transcript : '';
        if (transcript) {
          if (searchInput) {
            searchInput.value = transcript;
          }
          const filtered = this.filterPackagesByQuery(transcript);
          this.renderPackages(filtered);
          if (typeof Utils !== 'undefined') {
            Utils.showToast(`Search: "${transcript}"`, 'success');
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (typeof Utils !== 'undefined') {
          if (event.error === 'not-allowed') {
            Utils.showToast('Microphone access denied. Please allow microphone in browser.', 'error');
          } else if (event.error === 'no-speech') {
            Utils.showToast('No speech detected. Please tap mic and speak clearly.', 'info');
          } else {
            Utils.showToast(`Voice Search: ${event.error}`, 'error');
          }
        }
      };

      recognition.onend = () => {
        this.speechRecognitionInstance = null;
        if (voiceBtn) {
          voiceBtn.classList.remove('listening');
          voiceBtn.innerHTML = '🎙️';
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition exception:', err);
      this.speechRecognitionInstance = null;
      if (voiceBtn) {
        voiceBtn.classList.remove('listening');
        voiceBtn.innerHTML = '🎙️';
      }
    }
  },

  filterByKeyword(keyword) {
    const searchInput = document.getElementById('packages-search-input');
    if (searchInput) searchInput.value = keyword;
    const filtered = this.filterPackagesByQuery(keyword);
    this.renderPackages(filtered);
  },

  setupEventListeners() {
    const searchInput = document.getElementById('packages-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        const query = e.target.value;
        const filtered = this.filterPackagesByQuery(query);
        this.renderPackages(filtered);
      }, 250));
    }

    window.addEventListener('pageshow', () => {
      this.updateCartBadgeUI();
      if (this.allPackages.length === 0) {
        this.loadPackagesCatalogue();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.updateCartBadgeUI();
      }
    });
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

  filterAndRender() {
    let filtered = this.allPackages;
    if (this.currentCategory && this.currentCategory !== 'All') {
      filtered = filtered.filter(pkg => pkg.Category && pkg.Category.toLowerCase() === this.currentCategory.toLowerCase());
    }
    this.renderPackages(filtered);
  },

  async showPackageDetails(packageId) {
    let pkg = this.allPackages.find(p => p.PackageID === packageId || p.PackageCode === packageId);
    if (!pkg && typeof OfflineDB !== 'undefined') {
      pkg = await OfflineDB.getById('packages', packageId);
    }
    if (!pkg) pkg = this.fallbackPackages.find(p => p.PackageID === packageId || p.PackageCode === packageId);
    if (!pkg) return;

    const formattedParams = this.formatParameters(pkg);
    const paramCount = this.getPackageParameterCount(pkg);
    const fastingInfo = this.getFastingDetails(pkg);
    const alreadyAdded = this.isItemInCart(pkg.PackageID || pkg.PackageCode, pkg.PackageCode, pkg.PackageName);

    const actionBtn = alreadyAdded
      ? `<button class="modal-action-btn remove-btn" onclick='PackagesPage.toggleCart(${JSON.stringify(pkg)}, event); PackagesPage.showPackageDetails("${packageId}");'>🗑️ Remove from Cart</button>`
      : `<button class="modal-action-btn add-btn" onclick='PackagesPage.toggleCart(${JSON.stringify(pkg)}, event); PackagesPage.showPackageDetails("${packageId}");'>🛒 Add to Cart</button>`;

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
            <span class="package-avatar-icon">📦</span>
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

  async checkUrlForPackageDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const packageId = urlParams.get('id');
    if (packageId) {
      setTimeout(() => this.showPackageDetails(packageId), 500);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  PackagesPage.init();
});

// Global Window Exposure
if (typeof window !== 'undefined') {
  window.PackagesPage = PackagesPage;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PackagesPage;
}
