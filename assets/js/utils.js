/* file: assets/js/utils.js */
/**
 * Selfcare Diagnostics - Utilities & Advanced Multi-Tier Conflict Validation Engine v6.5.0
 * Features:
 * 1. Rupee currency formatting, XSS sanitization, debouncing, online check, and toast notifications.
 * 2. Strict Bi-directional Conflict Validation Engine:
 *    - Rule 1: Package vs Individual Test / Panel.
 *    - Rule 2: Individual Test / Panel vs Package.
 *    - Rule 3: Parent Panel vs Sub-parameter (e.g. CBC vs Hb, KFT vs Creatinine).
 *    - Rule 4: PACKAGE vs PACKAGE Deep Overlap (Blocks adding 2 packages with common panels/tests/parameters).
 */

const Utils = {
  /**
   * Format number to Indian Rupee currency string
   * @param {number} amount 
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount) {
    if (isNaN(amount) || amount === null) return '₹0';
    return '₹' + Number(amount).toLocaleString('en-IN');
  },

  /**
   * Debounce function to limit rapid execution
   * @param {Function} func 
   * @param {number} wait 
   * @returns {Function} Debounced function
   */
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Escape HTML to prevent XSS
   * @param {string} str 
   * @returns {string} Sanitized string
   */
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Display a floating toast notification
   * @param {string} message 
   * @param {string} type - 'success', 'error', 'info'
   */
  showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none; width: 90%; max-width: 400px; align-items: center;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgColors = {
      success: '#078866',
      error: '#E4005A',
      info: '#045D49'
    };

    toast.style.cssText = `background: ${bgColors[type] || bgColors.success}; color: #FFFFFF; padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 500; box-shadow: 0 8px 24px rgba(0,0,0,0.15); backdrop-filter: blur(10px); opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease; transform: translateY(10px); pointer-events: auto; text-align: center; width: 100%;`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  },

  /**
   * Check if device is currently online
   * @returns {boolean}
   */
  isOnline() {
    return navigator.onLine;
  }
};

/**
 * =========================================================================
 * CONFLICT VALIDATOR ENGINE
 * =========================================================================
 */
const ConflictValidator = {
  // Parent Panels and constituent sub-tests / parameters
  panelToParameters: {
    'CBC': {
      panelName: 'Complete Blood Count (CBC)',
      aliases: ['CBC', 'COMPLETE BLOOD COUNT', 'HEMOGRAM', 'COMPLETE HEMOGRAM', 'T0001', 'SCDT0001'],
      subTests: [
        'HEMOGLOBIN', 'HB', 'TOTAL WBC', 'TLC', 'WBC', 'WHITE BLOOD CELL',
        'RBC COUNT', 'RBC', 'RED BLOOD CELL', 'PLATELET COUNT', 'PLATELET', 'PCV',
        'HEMATOCRIT', 'MCV', 'MCH', 'MCHC', 'RDW', 'RDW-CV', 'RDW-SD',
        'NEUTROPHIL', 'LYMPHOCYTE', 'MONOCYTE', 'EOSINOPHIL', 'BASOPHIL',
        'ANC', 'ALC', 'AMC', 'AEC', 'MPV', 'PDW', 'PCT', 'P-LCR'
      ]
    },
    'KFT': {
      panelName: 'Kidney Function Test (KFT/RFT)',
      aliases: ['KFT', 'RFT', 'KIDNEY FUNCTION', 'RENAL FUNCTION', 'T0016', 'SCDT0016', 'T0014', 'SCDT0014'],
      subTests: [
        'CREATININE', 'SERUM CREATININE', 'UREA', 'BLOOD UREA', 'BUN',
        'BLOOD UREA NITROGEN', 'URIC ACID', 'URIC ACID SERUM', 'CALCIUM',
        'PHOSPHORUS', 'ELECTROLYTES', 'SODIUM', 'POTASSIUM', 'CHLORIDE'
      ]
    },
    'LFT': {
      panelName: 'Liver Function Test (LFT)',
      aliases: ['LFT', 'LIVER FUNCTION', 'LIVER PANEL', 'HEPATIC FUNCTION', 'T0013', 'SCDT0013'],
      subTests: [
        'BILIRUBIN', 'TOTAL BILIRUBIN', 'DIRECT BILIRUBIN', 'INDIRECT BILIRUBIN',
        'SGOT', 'AST', 'SGPT', 'ALT', 'ALKALINE PHOSPHATASE', 'ALP', 'ALBUMIN',
        'TOTAL PROTEIN', 'GLOBULIN', 'A/G RATIO'
      ]
    },
    'LIPID': {
      panelName: 'Lipid Profile',
      aliases: ['LIPID PROFILE', 'LIPID PANEL', 'CHOLESTEROL PANEL', 'T0012', 'SCDT0012'],
      subTests: [
        'CHOLESTEROL', 'TOTAL CHOLESTEROL', 'TRIGLYCERIDES', 'HDL', 'HDL CHOLESTEROL',
        'LDL', 'LDL CHOLESTEROL', 'VLDL', 'VLDL CHOLESTEROL'
      ]
    },
    'THYROID': {
      panelName: 'Thyroid Profile (T3, T4, TSH)',
      aliases: ['THYROID PROFILE', 'THYROID PANEL', 'TOTAL THYROID', 'T3 T4 TSH', 'T0040', 'SCDT0040'],
      subTests: [
        'TSH', 'THYROID STIMULATING HORMONE', 'T0037', 'SCDT0037',
        'T3', 'TOTAL T3', 'FREE T3', 'T4', 'TOTAL T4', 'FREE T4'
      ]
    },
    'DIABETES': {
      panelName: 'Diabetes Screening Panel',
      aliases: ['DIABETES PANEL', 'DIABETIC SCREEN', 'DIABETES PROFILE'],
      subTests: [
        'FBS', 'FASTING BLOOD SUGAR', 'FASTING GLUCOSE', 'T0008', 'SCDT0008',
        'PPBS', 'POST PRANDIAL', 'PP GLUCOSE', 'T0009', 'SCDT0009',
        'HBA1C', 'GLYCATED HEMOGLOBIN', 'T0011', 'SCDT0011'
      ]
    },
    'PBS': {
      panelName: 'Peripheral Blood Smear',
      aliases: ['PERIPHERAL BLOOD SMEAR', 'PERIPHERAL SMEAR', 'PBS', 'T0005', 'SCDT0005'],
      subTests: [
        'RBC MORPHOLOGY', 'WBC MORPHOLOGY', 'PLATELET MORPHOLOGY'
      ]
    }
  },

  // Health Packages definitions
  packageDefinitions: {
    'PKG001': {
      name: 'Selfcare Basic Health Panel',
      aliases: ['PKG001', 'SCDPACK001', 'SCD001', 'BASIC HEALTH', 'BASIC WELLNESS'],
      panels: ['CBC', 'LIPID'],
      standalone: ['FBS', 'FASTING BLOOD SUGAR', 'URINE ROUTINE', 'T0008', 'T0046']
    },
    'PKG002': {
      name: 'Selfcare Premium Health Panel',
      aliases: ['PKG002', 'SCDPACK002', 'SCD002', 'PREMIUM HEALTH', 'PREMIUM PACKAGE'],
      panels: ['CBC', 'LFT', 'KFT', 'LIPID'],
      standalone: ['TSH', 'FBS', 'FASTING BLOOD SUGAR', 'URINE ROUTINE', 'T0008', 'T0037', 'T0046']
    },
    'PKG003': {
      name: 'Selfcare Elite Health Panel',
      aliases: ['PKG003', 'SCDPACK003', 'SCD003', 'ELITE HEALTH', 'ELITE PANEL'],
      panels: ['CBC', 'LFT', 'KFT', 'LIPID', 'THYROID'],
      standalone: ['VITAMIN D', 'VITAMIN B12', 'HBA1C', 'T0011', 'T0034', 'T0035']
    },
    'FULL_BODY': {
      name: 'Full Body Health Package',
      aliases: ['FULL BODY', 'HEALTH PACKAGE', 'SELFCARE PACKAGE', 'MASTER HEALTH', 'EXECUTIVE HEALTH', 'COMPREHENSIVE HEALTH'],
      panels: ['CBC', 'LFT', 'KFT', 'LIPID', 'THYROID', 'DIABETES'],
      standalone: ['URINE ROUTINE', 'VITAMIN D', 'VITAMIN B12', 'HBA1C', 'ESR']
    },
    'PKG010': {
      name: 'Fever Advanced Panel',
      aliases: ['PKG010', 'FEVER ADVANCED'],
      panels: ['CBC'],
      standalone: ['ESR', 'CRP', 'MALARIA', 'WIDAL', 'T0002', 'T0041', 'T0043M', 'T0051W']
    }
  },

  isPackage(item) {
    if (!item) return false;
    const type = String(item.type || '').toLowerCase();
    const code = String(item.PackageID || item.PackageCode || item.TestCode || item.code || '').toUpperCase();
    const name = String(item.TestName || item.PackageName || item.name || '').toUpperCase();
    return Boolean(
      item.isPackage === true ||
      type === 'package' ||
      code.startsWith('PKG') ||
      code.includes('SCDPACK') ||
      name.includes('PACKAGE') ||
      name.includes('PANEL') ||
      name.includes('HEALTH CHECK') ||
      name.includes('FULL BODY') ||
      name.includes('WELLNESS') ||
      name.includes('MASTER HEALTH')
    );
  },

  isReticulocyte(item) {
    if (!item) return false;
    const code = String(item.TestCode || item.code || '').toUpperCase();
    const name = String(item.TestName || item.name || '').toUpperCase();
    return code === 'T0015' || name.includes('RETICULOCYTE');
  },

  extractTestIds(pkg) {
    if (!pkg) return [];
    const raw = pkg.TestIDs || pkg.testIds || pkg.TestCodeList || pkg.tests || '';
    if (Array.isArray(raw)) {
      return raw.map(id => String(id).trim().toUpperCase()).filter(Boolean);
    }
    if (typeof raw === 'string') {
      return raw.split(/[,;|/\n]/).map(s => s.trim().toUpperCase()).filter(Boolean);
    }
    return [];
  },

  extractParameters(pkg) {
    if (!pkg) return [];
    const raw = pkg.Parameters || pkg.parameters || pkg.Description || '';
    let items = [];
    if (Array.isArray(raw)) {
      items = raw.flatMap(p => {
        const str = typeof p === 'object' && p !== null ? (p.Name || p.ParameterName || p.TestName || '') : String(p);
        return str.split(/[;,|\n•]|<br\s*[\/]?>/i).map(s => s.trim().toUpperCase()).filter(s => s.length > 2);
      });
    } else if (typeof raw === 'string') {
      items = raw.split(/[;,|\n•]|<br\s*[\/]?>/i).map(s => s.trim().toUpperCase()).filter(s => s.length > 2);
    }
    return items;
  },

  normalizeName(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/\(.*?\)/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  },

  matchesPanel(item, panelKey) {
    const p = this.panelToParameters[panelKey];
    if (!p) return false;
    const name = (item.TestName || item.PackageName || item.name || '').toUpperCase();
    const code = (item.TestCode || item.PackageCode || item.code || '').toUpperCase();
    return p.aliases.some(alias => name.includes(alias) || code === alias);
  },

  matchesSubTestOfPanel(item, panelKey) {
    const p = this.panelToParameters[panelKey];
    if (!p) return false;

    if (this.isReticulocyte(item)) return false;

    const name = (item.TestName || item.PackageName || item.name || '').toUpperCase();
    const code = (item.TestCode || item.PackageCode || item.code || '').toUpperCase();

    if (this.matchesPanel(item, panelKey)) return false;

    return p.subTests.some(sub => {
      const regex = new RegExp(`(^|[^A-Z0-9])${sub}([^A-Z0-9]|$)`, 'i');
      return regex.test(name) || code === sub;
    });
  },

  /**
   * Bi-directional conflict validation between new item and cart
   */
  checkConflict(newItem, cart) {
    if (!newItem || !Array.isArray(cart) || cart.length === 0) {
      return { hasConflict: false, reason: '' };
    }

    if (this.isReticulocyte(newItem)) {
      return { hasConflict: false, reason: '' };
    }

    const newIsPkg = this.isPackage(newItem);
    const newName = newItem.TestName || newItem.PackageName || newItem.name || 'Selected Item';
    const newUpper = newName.toUpperCase();
    const newCode = (newItem.TestCode || newItem.PackageCode || newItem.PackageID || newItem.code || '').toUpperCase().replace(/[\s\-_]/g, '');

    // Match package key
    let newPkgKey = Object.keys(this.packageDefinitions).find(k => {
      const p = this.packageDefinitions[k];
      return p.aliases.some(a => newCode === a.replace(/[\s\-_]/g, '') || newUpper.includes(a));
    });
    if (newIsPkg && !newPkgKey) newPkgKey = 'FULL_BODY';

    for (const cartItem of cart) {
      if (this.isReticulocyte(cartItem)) continue;

      const cartIsPkg = this.isPackage(cartItem);
      const cartName = cartItem.TestName || cartItem.PackageName || cartItem.name || 'Cart Item';
      const cartUpper = cartName.toUpperCase();
      const cartCode = (cartItem.TestCode || cartItem.PackageCode || cartItem.PackageID || cartItem.code || '').toUpperCase().replace(/[\s\-_]/g, '');

      let cartPkgKey = Object.keys(this.packageDefinitions).find(k => {
        const p = this.packageDefinitions[k];
        return p.aliases.some(a => cartCode === a.replace(/[\s\-_]/g, '') || cartUpper.includes(a));
      });
      if (cartIsPkg && !cartPkgKey) cartPkgKey = 'FULL_BODY';

      // =========================================================================
      // RULE 4: PACKAGE vs PACKAGE CONFLICT (Rendu Packages-la common tests irundha block)
      // =========================================================================
      if (cartIsPkg && newIsPkg) {
        // 4A: Definition Panels overlap check (e.g. Both have CBC, LFT, Lipid, etc.)
        if (cartPkgKey && newPkgKey) {
          const cartDef = this.packageDefinitions[cartPkgKey];
          const newDef = this.packageDefinitions[newPkgKey];

          const overlappingPanels = (cartDef.panels || []).filter(p => (newDef.panels || []).includes(p));
          if (overlappingPanels.length > 0) {
            const panelNames = overlappingPanels.map(p => this.panelToParameters[p]?.panelName || p).join(', ');
            return {
              hasConflict: true,
              reason: `⚠️ Package Conflict: "${newName}" contains common panels (${panelNames}) already included in "${cartName}". You cannot add both packages simultaneously.`
            };
          }

          const overlappingStandalone = (cartDef.standalone || []).filter(s => (newDef.standalone || []).includes(s));
          if (overlappingStandalone.length > 0) {
            return {
              hasConflict: true,
              reason: `⚠️ Package Conflict: "${newName}" contains tests already included in "${cartName}".`
            };
          }
        }

        // 4B: Dynamic TestIDs Overlap Check from Backend
        const newTestIds = this.extractTestIds(newItem);
        const cartTestIds = this.extractTestIds(cartItem);
        const commonTestIds = newTestIds.filter(id => id && cartTestIds.includes(id));
        if (commonTestIds.length > 0) {
          return {
            hasConflict: true,
            reason: `⚠️ Package Conflict: "${newName}" and "${cartName}" share common tests (${commonTestIds.slice(0, 3).join(', ')}).`
          };
        }

        // 4C: Dynamic Parameters / Test Names Overlap Check
        const newParams = this.extractParameters(newItem);
        const cartParams = this.extractParameters(cartItem);
        const commonParams = [];

        for (const np of newParams) {
          const normNp = this.normalizeName(np);
          if (normNp.length < 3) continue;
          for (const cp of cartParams) {
            const normCp = this.normalizeName(cp);
            if (normCp.length < 3) continue;
            if (normNp === normCp || (normNp.length > 4 && normCp.includes(normNp)) || (normCp.length > 4 && normNp.includes(normCp))) {
              if (!commonParams.includes(np)) commonParams.push(np);
            }
          }
        }

        if (commonParams.length > 0) {
          return {
            hasConflict: true,
            reason: `⚠️ Package Conflict: "${newName}" contains parameters (${commonParams.slice(0, 2).join(', ')}) already covered in "${cartName}".`
          };
        }
      }

      // =========================================================================
      // RULE 1: Cart-la Package irukku -> Individual Panel / Test add panna koodathu
      // =========================================================================
      if (cartIsPkg && !newIsPkg && cartPkgKey) {
        const pkgDef = this.packageDefinitions[cartPkgKey];

        for (const pKey of pkgDef.panels) {
          if (this.matchesPanel(newItem, pKey)) {
            return {
              hasConflict: true,
              reason: `⚠️ "${newName}" already included in "${cartName}" package in your cart.`
            };
          }
          if (this.matchesSubTestOfPanel(newItem, pKey)) {
            const panelTitle = this.panelToParameters[pKey].panelName;
            return {
              hasConflict: true,
              reason: `⚠️ "${newName}" is already covered under "${panelTitle}" in "${cartName}" package.`
            };
          }
        }

        const matchesStandalone = (pkgDef.standalone || []).some(term => {
          const regex = new RegExp(`(^|[^A-Z0-9])${term}([^A-Z0-9]|$)`, 'i');
          return regex.test(newUpper) || newCode === term;
        });

        if (matchesStandalone) {
          return {
            hasConflict: true,
            reason: `⚠️ "${newName}" is already covered in "${cartName}" package in your cart.`
          };
        }
      }

      // =========================================================================
      // RULE 2: Cart-la Test / Panel irukku -> Package add panna koodathu
      // =========================================================================
      if (!cartIsPkg && newIsPkg && newPkgKey) {
        const pkgDef = this.packageDefinitions[newPkgKey];

        for (const pKey of pkgDef.panels) {
          if (this.matchesPanel(cartItem, pKey)) {
            return {
              hasConflict: true,
              reason: `⚠️ Your cart already has "${cartName}". Please remove it first to add "${newName}".`
            };
          }
          if (this.matchesSubTestOfPanel(cartItem, pKey)) {
            return {
              hasConflict: true,
              reason: `⚠️ Your cart has "${cartName}" which is included in "${newName}". Please remove "${cartName}" first.`
            };
          }
        }

        const matchesStandalone = (pkgDef.standalone || []).some(term => {
          const regex = new RegExp(`(^|[^A-Z0-9])${term}([^A-Z0-9]|$)`, 'i');
          return regex.test(cartUpper) || cartCode === term;
        });

        if (matchesStandalone) {
          return {
            hasConflict: true,
            reason: `⚠️ Your cart already has "${cartName}". Please remove it first to add "${newName}".`
          };
        }
      }

      // =========================================================================
      // RULE 3: Panel vs Sub-parameter (CBC vs Hb, RFT vs Creatinine, LFT vs SGPT)
      // =========================================================================
      if (!cartIsPkg && !newIsPkg) {
        for (const pKey of Object.keys(this.panelToParameters)) {
          if (this.matchesPanel(cartItem, pKey) && this.matchesSubTestOfPanel(newItem, pKey)) {
            return {
              hasConflict: true,
              reason: `⚠️ "${newName}" is already included inside "${cartName}" in your cart.`
            };
          }

          if (this.matchesSubTestOfPanel(cartItem, pKey) && this.matchesPanel(newItem, pKey)) {
            return {
              hasConflict: true,
              reason: `⚠️ Cart-la already "${cartName}" irukku. Complete "${newName}" add panna first "${cartName}"-ah cart-la irunthu remove pannunga.`
            };
          }
        }
      }
    }

    return { hasConflict: false, reason: '' };
  }
};

// Global Exposure
if (typeof window !== 'undefined') {
  window.Utils = Utils;
  window.ConflictValidator = ConflictValidator;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Utils, ConflictValidator };
}
