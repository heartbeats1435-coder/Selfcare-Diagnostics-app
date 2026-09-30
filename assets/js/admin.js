/* file: assets/js/admin.js */
/**
 * Selfcare Diagnostics - Admin OS Engine v8.0.0
 * Features:
 * 1. Financial Profit Ledger: MRP vs Retail vs B2B Lab Cost = Net Profit.
 * 2. Guaranteed Frontend Privacy: B2B Cost is stripped before writing to customer cache.
 * 3. Cart Bookings Queue: Captures bookings confirmed via cart.js and synchronizes state.
 * 4. Two-Way Backend Sync: Syncs with Google Apps Script (Api.request) with offline resilience.
 * 5. Technician Dispatch: Particular Technician vs All Nearby Broadcast 📡.
 */

const AdminApp = {
  currentAssignBookingId: null,
  editingTestId: null,
  editingPackageId: null,
  currentFinancialPeriod: 'month', // 'month' or 'all'

  async init() {
    this.seedDefaultDataIfEmpty();
    await this.loadAllBookings();
    this.renderFinancialLedger();
    this.renderBookingsTable();
    this.renderTechnicians();
    this.renderTests();
    this.renderPackages();
    this.renderCarousel();
    this.populateReportBookingSelect();
  },

  switchTab(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));

    const targetTab = document.getElementById(tabId);
    const targetNav = document.querySelector(`[data-tab="${tabId}"]`);

    if (targetTab) targetTab.classList.add('active');
    if (targetNav) targetNav.classList.add('active');

    if (tabId === 'tab-finance') {
      this.renderFinancialLedger();
    }
  },

  /* =========================================================
     SEED INITIAL MOCK DATA (WITH B2B LAB COST COLUMNS)
     ========================================================= */
  seedDefaultDataIfEmpty() {
    // Tests (15 Backend Columns + B2BCost)
    if (!localStorage.getItem('selfcare_tests_admin_db')) {
      const initialTests = [
        {
          TestID: "SCDT0001",
          TestCode: "T0001",
          TestName: "Complete Blood Count (CBC with ESR)",
          Category: "Hematology",
          SampleType: "EDTA Blood",
          FastingRequired: "No",
          Preparation: "Water intake permitted",
          Parameters: "24 Vital Parameters",
          TAT: "6 Hours",
          MRP: 450,
          OfferPrice: 250,
          B2BCost: 90, // Lab Outsourcing / Processing Cost
          Status: "Active",
          WhyDone: "Screen for anemia, leukemia, platelet disorders",
          SearchKeywords: "cbc, blood, infection, hemoglobin",
          UpdatedAt: new Date().toISOString()
        },
        {
          TestID: "SCDT0012",
          TestCode: "T0012",
          TestName: "Lipid Profile Comprehensive",
          Category: "Biochemistry",
          SampleType: "Serum",
          FastingRequired: "Yes (10-12 Hours)",
          Preparation: "12 Hours overnight fasting mandatory",
          Parameters: "8 Parameters (Cholesterol, Triglycerides, HDL, LDL)",
          TAT: "8 Hours",
          MRP: 600,
          OfferPrice: 299,
          B2BCost: 110,
          Status: "Active",
          WhyDone: "Evaluate heart and cardiovascular disease risk",
          SearchKeywords: "lipid, cholesterol, heart, cardiac",
          UpdatedAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('selfcare_tests_admin_db', JSON.stringify(initialTests));
      this.syncPublicTestsCache(initialTests);
    }

    // Packages (15 Backend Columns + B2BCost)
    if (!localStorage.getItem('selfcare_packages_admin_db')) {
      const initialPackages = [
        {
          PackageID: "PKG001",
          PackageCode: "PKG001",
          PackageName: "Selfcare Basic Health Panel",
          Category: "Preventive Health",
          Description: "Essential screening covering CBC, Fasting Blood Sugar, Lipid Profile, and Urine Routine.",
          TestIDs: "SCDT0001, SCDT0008, SCDT0012, SCDT0046",
          Parameters: "CBC, FBS, Lipid Profile, Urine Routine (48 Parameters)",
          Preparation: "10-12 hours overnight fasting mandatory.",
          FastingRequired: "Yes (10-12 Hours Fasting)",
          SampleType: "Blood & Urine",
          TAT: "24 Hours",
          MRP: 4000,
          OfferPrice: 1299,
          B2BCost: 450, // Outsourced lab cost
          Status: "Active",
          Featured: "TRUE"
        },
        {
          PackageID: "PKG003",
          PackageCode: "PKG003",
          PackageName: "Selfcare Elite Master Health Package",
          Category: "Executive Wellness",
          Description: "Comprehensive full body checkup panel including vitamins, cardiac markers, and organ profiles.",
          TestIDs: "SCDT0001, SCDT0012, SCDT0013, SCDT0014, SCDT0034, SCDT0035, SCDT0040",
          Parameters: "Complete Hemogram, Vitamin D3, B12, HbA1c, LFT, KFT (85+ Tests)",
          Preparation: "12 hours overnight fasting required.",
          FastingRequired: "Yes (10-12 Hours Fasting)",
          SampleType: "Blood & Urine",
          TAT: "24 Hours",
          MRP: 9000,
          OfferPrice: 2999,
          B2BCost: 1100,
          Status: "Active",
          Featured: "TRUE"
        }
      ];
      localStorage.setItem('selfcare_packages_admin_db', JSON.stringify(initialPackages));
      this.syncPublicPackagesCache(initialPackages);
    }

    // Technicians
    if (!localStorage.getItem('selfcare_technicians')) {
      const initialTechs = [
        { id: "TECH_101", name: "Ramesh Phlebotomist", phone: "9840123456", zone: "T. Nagar, Kodambakkam, Nungambakkam", pass: "tech@123", status: "Active" },
        { id: "TECH_102", name: "Suresh Phlebotomist", phone: "9840987654", zone: "Anna Nagar, Kilpauk, Shenoy Nagar", pass: "tech@123", status: "Active" },
        { id: "TECH_103", name: "Kavitha Phlebotomist", phone: "9840333222", zone: "Adyar, Velachery, Thiruvanmiyur", pass: "tech@123", status: "Active" }
      ];
      localStorage.setItem('selfcare_technicians', JSON.stringify(initialTechs));
    }

    // Banners
    if (!localStorage.getItem('selfcare_carousel_db')) {
      const initialBanners = [
        {
          id: "BAN_1",
          title: "Full Body Master Checkup (82 Parameters)",
          subtitle: "Now at ₹1,299 with Free Doorstep Collection",
          image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=60",
          link: "packages.html",
          status: "Active"
        }
      ];
      localStorage.setItem('selfcare_carousel_db', JSON.stringify(initialBanners));
    }
  },

  /* =========================================================
     TWO-WAY SYNC GUARDS (PREVENT B2B LEAK TO CUSTOMER)
     ========================================================= */
  syncPublicTestsCache(adminTests) {
    // CRITICAL: Strip B2BCost so frontend inspect tool cannot see it
    const publicTests = adminTests.map(t => {
      const { B2BCost, ...publicFields } = t;
      return publicFields;
    });

    localStorage.setItem('cache_tests', JSON.stringify(publicTests));
    localStorage.setItem('selfcare_tests_db', JSON.stringify(publicTests));

    if (typeof OfflineDB !== 'undefined' && OfflineDB.putAll) {
      OfflineDB.putAll('tests', publicTests, true).catch(() => {});
      OfflineDB.setMetadata('testsLastSync', new Date().toISOString()).catch(() => {});
    }
  },

  syncPublicPackagesCache(adminPackages) {
    // CRITICAL: Strip B2BCost so frontend inspect tool cannot see it
    const publicPackages = adminPackages.map(p => {
      const { B2BCost, ...publicFields } = p;
      return publicFields;
    });

    localStorage.setItem('cache_packages', JSON.stringify(publicPackages));
    localStorage.setItem('selfcare_packages_db', JSON.stringify(publicPackages));

    if (typeof OfflineDB !== 'undefined' && OfflineDB.putAll) {
      OfflineDB.putAll('packages', publicPackages, true).catch(() => {});
      OfflineDB.setMetadata('packagesLastSync', new Date().toISOString()).catch(() => {});
    }
  },

  /* =========================================================
     1. BOOKINGS PIPELINE (CART -> BACKEND -> ADMIN)
     ========================================================= */
  async loadAllBookings() {
    let allBookings = [];

    // 1. Fetch from Google Apps Script Backend (if online)
    if (navigator.onLine && typeof Api !== 'undefined' && Api.request) {
      try {
        const cloudBookings = await Api.request('getAllBookings', {}, false);
        if (Array.isArray(cloudBookings) && cloudBookings.length > 0) {
          allBookings = cloudBookings;
        }
      } catch (err) {
        console.warn('[Admin] Cloud bookings fetch deferred:', err);
      }
    }

    // 2. Merge with Local Cart confirmed vaults
    try {
      const cartRecents = JSON.parse(localStorage.getItem('selfcare_recent_bookings') || '[]');
      const adminStored = JSON.parse(localStorage.getItem('selfcare_bookings_db') || '[]');

      const mergedMap = new Map();
      allBookings.forEach(b => mergedMap.set(b.bookingId || b.id, b));
      adminStored.forEach(b => mergedMap.set(b.bookingId || b.id, b));
      cartRecents.forEach(b => {
        const id = b.bookingId || b.id;
        if (!mergedMap.has(id)) {
          mergedMap.set(id, {
            id: id,
            bookingId: id,
            patientName: b.patientName || 'Customer',
            patientPhone: b.patientPhone || '-',
            location: b.address || 'Chennai',
            zone: 'Chennai Central',
            mode: b.collectionType === 'lab' ? 'Direct Lab Walk-in' : 'Home Sample Pickup',
            slot: `${b.collectionDate || 'Today'} (${b.timeSlot || 'Window'})`,
            totalAmount: Number(b.finalAmount || 0),
            techStatus: b.bookingStatus === 'CONFIRMED' ? 'Unassigned' : (b.bookingStatus || 'Unassigned'),
            reportStatus: 'Pending',
            items: b.items || [],
            date: b.updatedAt || new Date().toISOString()
          });
        }
      });

      allBookings = Array.from(mergedMap.values());
      localStorage.setItem('selfcare_bookings_db', JSON.stringify(allBookings));
    } catch (e) {
      console.error('Error merging cart bookings:', e);
    }

    return allBookings;
  },

  renderBookingsTable() {
    const tableBody = document.getElementById('bookings-table-body');
    const bookings = JSON.parse(localStorage.getItem('selfcare_bookings_db') || '[]');

    if (bookings.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#64748B;">No cart bookings received yet. Confirmed bookings will appear here instantly.</td></tr>`;
      return;
    }

    tableBody.innerHTML = bookings.map(b => {
      const bId = b.id || b.bookingId;
      const statusText = b.techStatus || 'Unassigned';
      let statusClass = 'status-pending';
      if (statusText.includes('Broadcasted')) statusClass = 'status-broadcast';
      if (statusText.includes('Assigned to')) statusClass = 'status-assigned';

      return `
        <tr>
          <td><strong>${bId}</strong></td>
          <td>
            <strong>${b.patientName}</strong><br>
            <span style="font-size:11px; color:#536E66;">${b.patientPhone}</span>
          </td>
          <td>${b.location || b.address || 'Chennai'}</td>
          <td><span style="font-size:11.5px; font-weight:700;">${b.slot || b.timeSlot}</span></td>
          <td>
            <strong style="color:#078866; font-size:13.5px;">₹${b.totalAmount || b.finalAmount || 0}</strong><br>
            <span style="font-size:10px; color:#64748B;">${b.paymentStatus || 'Confirmed'}</span>
          </td>
          <td><span class="status-pill ${statusClass}">${statusText}</span></td>
          <td>
            ${b.reportUrl ? `<a href="${b.reportUrl}" target="_blank" style="color:#078866; font-weight:800; text-decoration:none;">📄 View PDF</a>` : `<span style="color:#94A3B8; font-size:11px;">Pending</span>`}
          </td>
          <td>
            <button class="btn-emerald-solid" style="padding:6px 12px; font-size:11.5px;" onclick="AdminApp.openAssignModal('${bId}')">
              📍 Assign Phlebo
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  /* =========================================================
     2. FINANCIAL PROFIT LEDGER (B2B VS RETAIL SEPARATION)
     ========================================================= */
  setFinancialPeriod(period) {
    this.currentFinancialPeriod = period;
    document.getElementById('btn-period-month').classList.toggle('active', period === 'month');
    document.getElementById('btn-period-all').classList.toggle('active', period === 'all');
    document.getElementById('fin-profit-period-label').textContent = period === 'month' ? '(This Month)' : '(All Time)';
    this.renderFinancialLedger();
  },

  renderFinancialLedger() {
    const bookings = JSON.parse(localStorage.getItem('selfcare_bookings_db') || '[]');
    const adminTests = JSON.parse(localStorage.getItem('selfcare_tests_admin_db') || '[]');
    const adminPackages = JSON.parse(localStorage.getItem('selfcare_packages_admin_db') || '[]');

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let totalMrp = 0;
    let totalRevenue = 0;
    let totalB2bCost = 0;

    const ledgerRows = [];

    bookings.forEach(b => {
      const bookingDate = new Date(b.date || Date.now());
      if (this.currentFinancialPeriod === 'month') {
        if (bookingDate.getFullYear() !== currentYear || bookingDate.getMonth() !== currentMonth) {
          return;
        }
      }

      let orderMrp = 0;
      let orderRevenue = Number(b.totalAmount || b.finalAmount || 0);
      let orderB2b = 0;

      let items = b.items;
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch (e) { items = []; }
      }
      if (!Array.isArray(items)) items = [];

      items.forEach(item => {
        const itemName = (item.name || item.TestName || item.PackageName || '').toLowerCase();
        const matchedTest = adminTests.find(t => t.TestName.toLowerCase() === itemName || t.TestID === item.id);
        const matchedPkg = adminPackages.find(p => p.PackageName.toLowerCase() === itemName || p.PackageID === item.id);

        if (matchedTest) {
          orderMrp += Number(matchedTest.MRP || 0);
          orderB2b += Number(matchedTest.B2BCost || Math.round(matchedTest.OfferPrice * 0.38));
        } else if (matchedPkg) {
          orderMrp += Number(matchedPkg.MRP || 0);
          orderB2b += Number(matchedPkg.B2BCost || Math.round(matchedPkg.OfferPrice * 0.35));
        } else {
          orderMrp += Number(item.price || 0) * 1.5;
          orderB2b += Math.round(Number(item.price || 0) * 0.36);
        }
      });

      if (orderMrp < orderRevenue) orderMrp = Math.round(orderRevenue * 1.4);
      if (orderB2b === 0) orderB2b = Math.round(orderRevenue * 0.35);

      const netProfit = Math.max(0, orderRevenue - orderB2b);

      totalMrp += orderMrp;
      totalRevenue += orderRevenue;
      totalB2bCost += orderB2b;

      ledgerRows.push({
        id: b.id || b.bookingId,
        date: bookingDate.toLocaleDateString('en-GB'),
        patient: b.patientName,
        itemCount: `${items.length || 1} Tests`,
        mrp: orderMrp,
        revenue: orderRevenue,
        b2b: orderB2b,
        profit: netProfit,
        status: b.techStatus || 'Confirmed'
      });
    });

    const actualProfit = Math.max(0, totalRevenue - totalB2bCost);
    const profitMargin = totalRevenue > 0 ? ((actualProfit / totalRevenue) * 100).toFixed(1) : 0;

    // Update Top 4 Metric Cards
    document.getElementById('fin-total-mrp').textContent = `₹${totalMrp.toLocaleString('en-IN')}`;
    document.getElementById('fin-total-revenue').textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
    document.getElementById('fin-total-b2b').textContent = `₹${totalB2bCost.toLocaleString('en-IN')}`;
    document.getElementById('fin-actual-profit').textContent = `₹${actualProfit.toLocaleString('en-IN')}`;
    document.getElementById('fin-margin-percentage').textContent = `Actual Margin: ${profitMargin}% of Revenue`;

    // Render Ledger Rows
    const tbody = document.getElementById('finance-ledger-table-body');
    if (ledgerRows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px; color:#64748B;">No financial transactions recorded for this period.</td></tr>`;
      return;
    }

    tbody.innerHTML = ledgerRows.map(r => `
      <tr>
        <td>${r.date}</td>
        <td><strong>${r.id}</strong></td>
        <td>${r.patient}</td>
        <td><span class="status-pill status-assigned">${r.itemCount}</span></td>
        <td class="strikethrough">₹${r.mrp.toLocaleString('en-IN')}</td>
        <td><strong class="green-text">₹${r.revenue.toLocaleString('en-IN')}</strong></td>
        <td><span class="b2b-cell-text">₹${r.b2b.toLocaleString('en-IN')}</span></td>
        <td><strong style="color:#045D49; font-size:13px;">+ ₹${r.profit.toLocaleString('en-IN')}</strong></td>
        <td><span class="status-pill status-assigned">${r.status}</span></td>
      </tr>
    `).join('');
  },

  /* =========================================================
     3. TECHNICIAN DISPATCH (PARTICULAR VS ALL NEARBY)
     ========================================================= */
  openAssignModal(bookingId) {
    this.currentAssignBookingId = bookingId;
    const bookings = JSON.parse(localStorage.getItem('selfcare_bookings_db') || '[]');
    const b = bookings.find(item => (item.id === bookingId || item.bookingId === bookingId));
    if (!b) return;

    document.getElementById('assign-booking-details').innerHTML = `
      <strong>Booking ID: ${b.id || b.bookingId}</strong> | Patient: <strong>${b.patientName}</strong> (${b.patientPhone})<br>
      📍 Address: ${b.location || b.address} | Slot: ${b.slot || b.timeSlot}
    `;

    const techs = JSON.parse(localStorage.getItem('selfcare_technicians') || '[]');
    const select = document.getElementById('modal-select-particular-tech');
    select.innerHTML = techs.map(t => `<option value="${t.id}">${t.name} (${t.zone}) - [${t.status}]</option>`).join('');

    this.toggleAssignMode('particular');
    document.querySelector('input[name="assign_type"][value="particular"]').checked = true;
    document.getElementById('assign-tech-modal').style.display = 'flex';
  },

  toggleAssignMode(mode) {
    const particularWrap = document.getElementById('particular-tech-select-wrap');
    const broadcastNotice = document.getElementById('nearby-broadcast-notice');

    if (mode === 'particular') {
      particularWrap.style.display = 'block';
      broadcastNotice.style.display = 'none';
    } else {
      particularWrap.style.display = 'none';
      broadcastNotice.style.display = 'flex';
    }
  },

  async executeTechnicianAssignment() {
    const mode = document.querySelector('input[name="assign_type"]:checked').value;
    let bookings = JSON.parse(localStorage.getItem('selfcare_bookings_db') || '[]');
    const idx = bookings.findIndex(b => (b.id === this.currentAssignBookingId || b.bookingId === this.currentAssignBookingId));
    if (idx === -1) return;

    let payload = {};

    if (mode === 'particular') {
      const techId = document.getElementById('modal-select-particular-tech').value;
      const techs = JSON.parse(localStorage.getItem('selfcare_technicians') || '[]');
      const tech = techs.find(t => t.id === techId);

      bookings[idx].techStatus = `Assigned to ${tech ? tech.name : techId}`;
      bookings[idx].assignedTechId = techId;
      payload = { bookingId: this.currentAssignBookingId, type: 'particular', techId: techId, techName: tech?.name };
      alert(`Booking ${this.currentAssignBookingId} assigned to technician: ${tech?.name}`);
    } else {
      bookings[idx].techStatus = `Broadcasted to All Nearby Technicians 📡`;
      bookings[idx].assignedTechId = 'BROADCAST_ALL';
      payload = { bookingId: this.currentAssignBookingId, type: 'broadcast', zone: bookings[idx].zone || 'All' };
      alert(`Booking ${this.currentAssignBookingId} broadcasted to all nearby on-duty technicians!`);
    }

    // Two-Way Sync to Backend
    if (navigator.onLine && typeof Api !== 'undefined' && Api.request) {
      Api.request('assignTechnician', payload, false).catch(err => console.warn('Assign sync to backend deferred:', err));
    }

    localStorage.setItem('selfcare_bookings_db', JSON.stringify(bookings));

    // Also update customer recent bookings so customer tracker reflects immediately
    try {
      const custBookings = JSON.parse(localStorage.getItem('selfcare_recent_bookings') || '[]');
      const cIdx = custBookings.findIndex(b => b.bookingId === this.currentAssignBookingId);
      if (cIdx !== -1) {
        custBookings[cIdx].bookingStatus = bookings[idx].techStatus;
        custBookings[cIdx].currentStage = 2; // Moves stepper to stage 2
        localStorage.setItem('selfcare_recent_bookings', JSON.stringify(custBookings));
      }
    } catch (e) {}

    this.closeModal('assign-tech-modal');
    this.renderBookingsTable();
    this.renderFinancialLedger();
  },

  /* =========================================================
     4. TECHNICIAN DIRECTORY CREATION
     ========================================================= */
  renderTechnicians() {
    const container = document.getElementById('technicians-card-container');
    const techs = JSON.parse(localStorage.getItem('selfcare_technicians') || '[]');

    if (techs.length === 0) {
      container.innerHTML = '<p style="font-size:12px; color:#64748B;">No technicians created yet.</p>';
      return;
    }

    container.innerHTML = techs.map((t, idx) => `
      <div class="tech-row-item">
        <div>
          <strong>${t.name} <span class="status-pill status-assigned" style="font-size:9.5px;">${t.status}</span></strong>
          <span>ID: <code>${t.id}</code> | Contact: ${t.phone}</span><br>
          <span style="color:#078866; font-weight:700;">📍 Coverage: ${t.zone}</span>
        </div>
        <button class="btn-cancel" style="padding:4px 10px; font-size:11px; color:#DC2626;" onclick="AdminApp.deleteTechnician(${idx})">Delete ✕</button>
      </div>
    `).join('');
  },

  handleCreateTechnician(e) {
    e.preventDefault();
    const id = document.getElementById('tech-id-input').value.trim();
    const name = document.getElementById('tech-name-input').value.trim();
    const phone = document.getElementById('tech-phone-input').value.trim();
    const zone = document.getElementById('tech-zone-input').value.trim();
    const pass = document.getElementById('tech-pass-input').value.trim();
    const status = document.getElementById('tech-status-select').value;

    let techs = JSON.parse(localStorage.getItem('selfcare_technicians') || '[]');
    if (techs.some(t => t.id.toLowerCase() === id.toLowerCase())) {
      alert('Technician ID already exists! Please use a unique ID.');
      return;
    }

    const techObj = { id, name, phone, zone, pass, status };
    techs.push(techObj);
    localStorage.setItem('selfcare_technicians', JSON.stringify(techs));

    // Two-Way Sync to Backend
    if (navigator.onLine && typeof Api !== 'undefined' && Api.request) {
      Api.request('saveTechnician', techObj, false).catch(err => console.warn('Tech sync to backend deferred:', err));
    }

    document.getElementById('tech-create-form').reset();
    alert(`Technician login for ${name} (${id}) created successfully!`);
    this.renderTechnicians();
  },

  deleteTechnician(idx) {
    if (!confirm('Remove this technician?')) return;
    let techs = JSON.parse(localStorage.getItem('selfcare_technicians') || '[]');
    const removed = techs.splice(idx, 1);
    localStorage.setItem('selfcare_technicians', JSON.stringify(techs));

    if (removed[0] && navigator.onLine && typeof Api !== 'undefined' && Api.request) {
      Api.request('deleteTechnician', { id: removed[0].id }, false).catch(() => {});
    }

    this.renderTechnicians();
  },

  /* =========================================================
     5. TESTS CRUD (15 BACKEND COLUMNS + B2B COST)
     ========================================================= */
  renderTests() {
    const tbody = document.getElementById('tests-table-body');
    const tests = JSON.parse(localStorage.getItem('selfcare_tests_admin_db') || '[]');

    tbody.innerHTML = tests.map(t => {
      const profit = Math.max(0, Number(t.OfferPrice || 0) - Number(t.B2BCost || 0));
      return `
        <tr>
          <td><strong>${t.TestID}</strong></td>
          <td><code>${t.TestCode}</code></td>
          <td><strong>${t.TestName}</strong></td>
          <td>${t.Category || '-'}</td>
          <td>${t.SampleType || '-'}</td>
          <td>${t.FastingRequired || '-'}</td>
          <td class="strikethrough">₹${t.MRP}</td>
          <td><strong class="green-text">₹${t.OfferPrice}</strong></td>
          <td><span class="b2b-cell-text">₹${t.B2BCost || 0}</span></td>
          <td><strong style="color:#045D49;">₹${profit}</strong></td>
          <td><span class="status-pill status-assigned">${t.Status}</span></td>
          <td>
            <button class="btn-cancel" style="padding:4px 8px; font-size:11px;" onclick="AdminApp.openTestModal('edit', '${t.TestID}')">Edit</button>
            <button class="btn-cancel" style="padding:4px 8px; font-size:11px; color:#DC2626;" onclick="AdminApp.deleteTest('${t.TestID}')">Del</button>
          </td>
        </tr>
      `;
    }).join('');
  },

  openTestModal(action, testId = null) {
    const modal = document.getElementById('test-edit-modal');
    document.getElementById('test-backend-form').reset();

    if (action === 'add') {
      this.editingTestId = null;
      document.getElementById('test-modal-title').innerText = '+ Add New Diagnostic Test';
      document.getElementById('t-TestID').value = 'SCDT_' + Date.now().toString().slice(-4);
      document.getElementById('t-TestID').readOnly = false;
    } else {
      this.editingTestId = testId;
      document.getElementById('test-modal-title').innerText = '✏️ Edit Test: ' + testId;
      const tests = JSON.parse(localStorage.getItem('selfcare_tests_admin_db') || '[]');
      const t = tests.find(item => item.TestID === testId);
      if (!t) return;

      document.getElementById('t-TestID').value = t.TestID;
      document.getElementById('t-TestID').readOnly = true;
      document.getElementById('t-TestCode').value = t.TestCode || '';
      document.getElementById('t-TestName').value = t.TestName || '';
      document.getElementById('t-Category').value = t.Category || '';
      document.getElementById('t-SampleType').value = t.SampleType || '';
      document.getElementById('t-FastingRequired').value = t.FastingRequired || 'No';
      document.getElementById('t-Preparation').value = t.Preparation || '';
      document.getElementById('t-Parameters').value = t.Parameters || '';
      document.getElementById('t-TAT').value = t.TAT || '';
      document.getElementById('t-MRP').value = t.MRP || 0;
      document.getElementById('t-OfferPrice').value = t.OfferPrice || 0;
      document.getElementById('t-B2BCost').value = t.B2BCost || 0;
      document.getElementById('t-Status').value = t.Status || 'Active';
      document.getElementById('t-WhyDone').value = t.WhyDone || '';
      document.getElementById('t-SearchKeywords').value = t.SearchKeywords || '';
    }

    modal.style.display = 'flex';
  },

  async saveTestRecord(e) {
    e.preventDefault();
    let tests = JSON.parse(localStorage.getItem('selfcare_tests_admin_db') || '[]');

    const record = {
      TestID: document.getElementById('t-TestID').value.trim(),
      TestCode: document.getElementById('t-TestCode').value.trim(),
      TestName: document.getElementById('t-TestName').value.trim(),
      Category: document.getElementById('t-Category').value.trim(),
      SampleType: document.getElementById('t-SampleType').value.trim(),
      FastingRequired: document.getElementById('t-FastingRequired').value,
      Preparation: document.getElementById('t-Preparation').value.trim(),
      Parameters: document.getElementById('t-Parameters').value.trim(),
      TAT: document.getElementById('t-TAT').value.trim(),
      MRP: Number(document.getElementById('t-MRP').value),
      OfferPrice: Number(document.getElementById('t-OfferPrice').value),
      B2BCost: Number(document.getElementById('t-B2BCost').value),
      Status: document.getElementById('t-Status').value,
      WhyDone: document.getElementById('t-WhyDone').value.trim(),
      SearchKeywords: document.getElementById('t-SearchKeywords').value.trim(),
      UpdatedAt: new Date().toISOString()
    };

    if (this.editingTestId) {
      const idx = tests.findIndex(t => t.TestID === this.editingTestId);
      if (idx !== -1) tests[idx] = record;
    } else {
      tests.unshift(record);
    }

    localStorage.setItem('selfcare_tests_admin_db', JSON.stringify(tests));

    // 1. Immediately reflect on Frontend (without B2BCost)
    this.syncPublicTestsCache(tests);

    // 2. Reflect on Google Apps Script Backend
    if (navigator.onLine && typeof Api !== 'undefined' && Api.request) {
      Api.request('saveTest', record, false).catch(err => console.warn('Test backend write deferred:', err));
    }

    this.closeModal('test-edit-modal');
    this.renderTests();
    this.renderFinancialLedger();
    alert(`Test "${record.TestName}" saved! Updated live in customer catalogue.`);
  },

  deleteTest(testId) {
    if (!confirm(`Delete test ${testId}?`)) return;
    let tests = JSON.parse(localStorage.getItem('selfcare_tests_admin_db') || '[]');
    tests = tests.filter(t => t.TestID !== testId);
    localStorage.setItem('selfcare_tests_admin_db', JSON.stringify(tests));

    this.syncPublicTestsCache(tests);

    if (navigator.onLine && typeof Api !== 'undefined' && Api.request) {
      Api.request('deleteTest', { testId }, false).catch(() => {});
    }

    this.renderTests();
    this.renderFinancialLedger();
  },

  /* =========================================================
     6. HEALTH PACKAGES CRUD (15 BACKEND COLUMNS + B2B COST)
     ========================================================= */
  renderPackages() {
    const tbody = document.getElementById('packages-table-body');
    const packages = JSON.parse(localStorage.getItem('selfcare_packages_admin_db') || '[]');

    tbody.innerHTML = packages.map(p => {
      const profit = Math.max(0, Number(p.OfferPrice || 0) - Number(p.B2BCost || 0));
      return `
        <tr>
          <td><strong>${p.PackageID}</strong></td>
          <td><code>${p.PackageCode}</code></td>
          <td><strong>${p.PackageName}</strong></td>
          <td>${p.Category || '-'}</td>
          <td><span class="status-pill status-assigned">${p.Parameters || '-'}</span></td>
          <td class="strikethrough">₹${p.MRP}</td>
          <td><strong class="green-text">₹${p.OfferPrice}</strong></td>
          <td><span class="b2b-cell-text">₹${p.B2BCost || 0}</span></td>
          <td><strong style="color:#045D49;">₹${profit}</strong></td>
          <td><strong>${p.Featured === 'TRUE' ? '⭐ YES' : 'NO'}</strong></td>
          <td><span class="status-pill status-assigned">${p.Status}</span></td>
          <td>
            <button class="btn-cancel" style="padding:4px 8px; font-size:11px;" onclick="AdminApp.openPackageModal('edit', '${p.PackageID}')">Edit</button>
            <button class="btn-cancel" style="padding:4px 8px; font-size:11px; color:#DC2626;" onclick="AdminApp.deletePackage('${p.PackageID}')">Del</button>
          </td>
        </tr>
      `;
    }).join('');
  },

  openPackageModal(action, packageId = null) {
    const modal = document.getElementById('package-edit-modal');
    document.getElementById('package-backend-form').reset();

    if (action === 'add') {
      this.editingPackageId = null;
      document.getElementById('package-modal-title').innerText = '+ Add New Health Checkup Package';
      document.getElementById('p-PackageID').value = 'PKG_' + Date.now().toString().slice(-4);
      document.getElementById('p-PackageID').readOnly = false;
    } else {
      this.editingPackageId = packageId;
      document.getElementById('package-modal-title').innerText = '✏️ Edit Package: ' + packageId;
      const packages = JSON.parse(localStorage.getItem('selfcare_packages_admin_db') || '[]');
      const p = packages.find(item => item.PackageID === packageId);
      if (!p) return;

      document.getElementById('p-PackageID').value = p.PackageID;
      document.getElementById('p-PackageID').readOnly = true;
      document.getElementById('p-PackageCode').value = p.PackageCode || '';
      document.getElementById('p-PackageName').value = p.PackageName || '';
      document.getElementById('p-Category').value = p.Category || '';
      document.getElementById('p-Description').value = p.Description || '';
      document.getElementById('p-TestIDs').value = p.TestIDs || '';
      document.getElementById('p-Parameters').value = p.Parameters || '';
      document.getElementById('p-Preparation').value = p.Preparation || '';
      document.getElementById('p-FastingRequired').value = p.FastingRequired || 'No Fasting Required';
      document.getElementById('p-SampleType').value = p.SampleType || '';
      document.getElementById('p-TAT').value = p.TAT || '';
      document.getElementById('p-MRP').value = p.MRP || 0;
      document.getElementById('p-OfferPrice').value = p.OfferPrice || 0;
      document.getElementById('p-B2BCost').value = p.B2BCost || 0;
      document.getElementById('p-Status').value = p.Status || 'Active';
      document.getElementById('p-Featured').value = p.Featured || 'FALSE';
    }

    modal.style.display = 'flex';
  },

  async savePackageRecord(e) {
    e.preventDefault();
    let packages = JSON.parse(localStorage.getItem('selfcare_packages_admin_db') || '[]');

    const record = {
      PackageID: document.getElementById('p-PackageID').value.trim(),
      PackageCode: document.getElementById('p-PackageCode').value.trim(),
      PackageName: document.getElementById('p-PackageName').value.trim(),
      Category: document.getElementById('p-Category').value.trim(),
      Description: document.getElementById('p-Description').value.trim(),
      TestIDs: document.getElementById('p-TestIDs').value.trim(),
      Parameters: document.getElementById('p-Parameters').value.trim(),
      Preparation: document.getElementById('p-Preparation').value.trim(),
      FastingRequired: document.getElementById('p-FastingRequired').value,
      SampleType: document.getElementById('p-SampleType').value.trim(),
      TAT: document.getElementById('p-TAT').value.trim(),
      MRP: Number(document.getElementById('p-MRP').value),
      OfferPrice: Number(document.getElementById('p-OfferPrice').value),
      B2BCost: Number(document.getElementById('p-B2BCost').value),
      Status: document.getElementById('p-Status').value,
      Featured: document.getElementById('p-Featured').value
    };

    if (this.editingPackageId) {
      const idx = packages.findIndex(p => p.PackageID === this.editingPackageId);
      if (idx !== -1) packages[idx] = record;
    } else {
      packages.unshift(record);
    }

    localStorage.setItem('selfcare_packages_admin_db', JSON.stringify(packages));

    // 1. Immediately reflect on Frontend (without B2BCost)
    this.syncPublicPackagesCache(packages);

    // 2. Reflect on Google Apps Script Backend
    if (navigator.onLine && typeof Api !== 'undefined' && Api.request) {
      Api.request('savePackage', record, false).catch(err => console.warn('Package backend write deferred:', err));
    }

    this.closeModal('package-edit-modal');
    this.renderPackages();
    this.renderFinancialLedger();
    alert(`Package "${record.PackageName}" saved! Updated live in customer frontend.`);
  },

  deletePackage(packageId) {
    if (!confirm(`Delete package ${packageId}?`)) return;
    let packages = JSON.parse(localStorage.getItem('selfcare_packages_admin_db') || '[]');
    packages = packages.filter(p => p.PackageID !== packageId);
    localStorage.setItem('selfcare_packages_admin_db', JSON.stringify(packages));

    this.syncPublicPackagesCache(packages);

    if (navigator.onLine && typeof Api !== 'undefined' && Api.request) {
      Api.request('deletePackage', { packageId }, false).catch(() => {});
    }

    this.renderPackages();
    this.renderFinancialLedger();
  },

  /* =========================================================
     7. REPORT UPLOAD HUB
     ========================================================= */
  populateReportBookingSelect() {
    const select = document.getElementById('report-booking-select');
    const bookings = JSON.parse(localStorage.getItem('selfcare_bookings_db') || '[]');

    select.innerHTML = '<option value="">-- Choose Booking ID --</option>' +
      bookings.map(b => `<option value="${b.id || b.bookingId}">${b.id || b.bookingId} - ${b.patientName}</option>`).join('');
  },

  autofillReportPatient(bookingId) {
    const bookings = JSON.parse(localStorage.getItem('selfcare_bookings_db') || '[]');
    const b = bookings.find(item => (item.id === bookingId || item.bookingId === bookingId));
    if (b) {
      document.getElementById('report-patient-info').value = `${b.patientName} (${b.patientPhone})`;
    } else {
      document.getElementById('report-patient-info').value = '';
    }
  },

  previewReportFile(input) {
    if (input.files && input.files[0]) {
      document.getElementById('upload-file-label').innerHTML = `Selected File: <strong>${input.files[0].name}</strong> (${(input.files[0].size/1024).toFixed(1)} KB)`;
    }
  },

  async handleReportSubmit(e) {
    e.preventDefault();
    const bookingId = document.getElementById('report-booking-select').value;
    const fileInput = document.getElementById('report-file-input');
    const directLink = document.getElementById('report-link-input').value.trim();
    const doctor = document.getElementById('report-doctor-input').value.trim();
    const clinicalStatus = document.getElementById('report-status-input').value;

    if (!bookingId) {
      alert('Please select a Booking ID');
      return;
    }

    let reportUrl = directLink || 'assets/reports/sample_nabl_report.pdf';
    if (fileInput.files && fileInput.files[0]) {
      reportUrl = URL.createObjectURL(fileInput.files[0]);
    }

    let bookings = JSON.parse(localStorage.getItem('selfcare_bookings_db') || '[]');
    const idx = bookings.findIndex(b => (b.id === bookingId || b.bookingId === bookingId));

    if (idx !== -1) {
      bookings[idx].reportUrl = reportUrl;
      bookings[idx].reportStatus = 'Report Ready';
      bookings[idx].doctor = doctor;
      bookings[idx].clinicalStatus = clinicalStatus;
      localStorage.setItem('selfcare_bookings_db', JSON.stringify(bookings));

      // Customer app reflection
      try {
        const custBookings = JSON.parse(localStorage.getItem('selfcare_recent_bookings') || '[]');
        const cIdx = custBookings.findIndex(b => b.bookingId === bookingId);
        if (cIdx !== -1) {
          custBookings[cIdx].reportUrl = reportUrl;
          custBookings[cIdx].currentStage = 5; // Report Ready Stage
          custBookings[cIdx].bookingStatus = 'COMPLETED';
          localStorage.setItem('selfcare_recent_bookings', JSON.stringify(custBookings));
        }
      } catch (err) {}

      // Backend sync
      if (navigator.onLine && typeof Api !== 'undefined' && Api.request) {
        Api.request('uploadReport', { bookingId, reportUrl, doctor, clinicalStatus }, false).catch(() => {});
      }

      alert(`Report for Booking ${bookingId} published! Available immediately in patient Reports & Tracker tab.`);
      document.getElementById('report-upload-form').reset();
      document.getElementById('upload-file-label').innerText = 'Click to choose report PDF or drag & drop';
      this.renderBookingsTable();
    }
  },

  /* =========================================================
     8. APP CAROUSEL BANNER CONTROLS
     ========================================================= */
  renderCarousel() {
    const container = document.getElementById('carousel-cards-list');
    const banners = JSON.parse(localStorage.getItem('selfcare_carousel_db') || '[]');

    if (banners.length === 0) {
      container.innerHTML = '<p style="color:#64748B;">No banners created yet.</p>';
      return;
    }

    container.innerHTML = banners.map((b, idx) => `
      <div class="banner-admin-card">
        <img src="${b.image}" alt="Banner" class="banner-preview-img" onerror="this.src='assets/images/logo.png'">
        <div class="banner-card-info">
          <h4>${b.title}</h4>
          <p>${b.subtitle || ''}</p>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="status-pill status-assigned">${b.status}</span>
            <div>
              <button class="btn-cancel" style="padding:4px 8px; font-size:11px;" onclick="AdminApp.editCarouselBanner(${idx})">Edit</button>
              <button class="btn-cancel" style="padding:4px 8px; font-size:11px; color:#DC2626;" onclick="AdminApp.deleteCarouselBanner(${idx})">Del</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },

  openCarouselModal(action) {
    const modal = document.getElementById('carousel-edit-modal');
    document.getElementById('carousel-form').reset();
    document.getElementById('banner-id-input').value = action === 'add' ? '' : 'edit';
    modal.style.display = 'flex';
  },

  saveCarouselBanner(e) {
    e.preventDefault();
    const idVal = document.getElementById('banner-id-input').value;
    const title = document.getElementById('banner-title-input').value.trim();
    const subtitle = document.getElementById('banner-subtitle-input').value.trim();
    const image = document.getElementById('banner-img-input').value.trim();
    const link = document.getElementById('banner-link-input').value.trim();
    const status = document.getElementById('banner-status-input').value;

    let banners = JSON.parse(localStorage.getItem('selfcare_carousel_db') || '[]');

    if (idVal && !isNaN(Number(idVal))) {
      banners[Number(idVal)] = { title, subtitle, image, link, status };
    } else {
      banners.push({ id: 'BAN_' + Date.now(), title, subtitle, image, link, status });
    }

    localStorage.setItem('selfcare_carousel_db', JSON.stringify(banners));

    if (navigator.onLine && typeof Api !== 'undefined' && Api.request) {
      Api.request('saveCarousel', banners, false).catch(() => {});
    }

    this.closeModal('carousel-edit-modal');
    this.renderCarousel();
    alert('Carousel banners updated live on customer app!');
  },

  editCarouselBanner(idx) {
    const banners = JSON.parse(localStorage.getItem('selfcare_carousel_db') || '[]');
    const b = banners[idx];
    if (!b) return;

    this.openCarouselModal('edit');
    document.getElementById('banner-id-input').value = idx;
    document.getElementById('banner-title-input').value = b.title || '';
    document.getElementById('banner-subtitle-input').value = b.subtitle || '';
    document.getElementById('banner-img-input').value = b.image || '';
    document.getElementById('banner-link-input').value = b.link || '';
    document.getElementById('banner-status-input').value = b.status || 'Active';
  },

  deleteCarouselBanner(idx) {
    if (!confirm('Delete this banner?')) return;
    let banners = JSON.parse(localStorage.getItem('selfcare_carousel_db') || '[]');
    banners.splice(idx, 1);
    localStorage.setItem('selfcare_carousel_db', JSON.stringify(banners));
    this.renderCarousel();
  },

  /* FORCE FULL CLOUD SYNC */
  async forceSyncCloud() {
    alert('Syncing admin data with Google Apps Script backend...');
    await this.loadAllBookings();
    this.renderBookingsTable();
    this.renderFinancialLedger();
    alert('Synchronization complete ✓');
  },

  filterBookings() {
    const query = (document.getElementById('booking-search-input').value || '').toLowerCase();
    const rows = document.querySelectorAll('#bookings-table-body tr');
    rows.forEach(r => {
      const text = r.innerText.toLowerCase();
      r.style.display = text.includes(query) ? '' : 'none';
    });
  },

  closeModal(id) {
    document.getElementById(id).style.display = 'none';
  },

  logout() {
    if (confirm('Log out from Admin OS?')) {
      localStorage.removeItem('selfcare_active_user');
      localStorage.removeItem('selfcare_user_role');
      window.location.replace('index.html');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => AdminApp.init());
