/* file: assets/js/utils.js */
/**
 * Selfcare Diagnostics - Utilities & Conflict Validation Engine v6.0.0
 * Features:
 * 1. Rupee currency formatting, XSS sanitization, debouncing, online check, and toast notifications.
 * 2. Dual-Layer Conflict Validation Engine:
 *    - Package vs Test / Panel (e.g. PKG includes CBC / LFT / KFT / Lipid / Thyroid)
 *    - Parent Panel vs Sub-test / Parameter (e.g. CBC vs Hb/Platelet, KFT vs Urea/Creatinine, LFT vs SGPT/Bilirubin)
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
   * Debounce function to limit rapid execution (e.g. search input)
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
 * CONFLICT VALIDATOR (Package vs Test & Panel vs Sub-parameter)
 * =========================================================================
 */
const ConflictValidator = {
  // Parent Panels and constituent parameters / sub-tests
  panelToParameters: {
    'CBC': {
      panelName: 'CBC (Complete Blood Count)',
      aliases: ['CBC', 'COMPLETE BLOOD COUNT', 'HEMOGRAM', 'COMPLETE HEMOGRAM', 'T0001', 'SCDT0001'],
      subTests: [
        'HEMOGLOBIN', 'HB', 'TOTAL WBC', 'TLC', 'WBC', 'WHITE BLOOD CELL',
        'RBC', 'RED BLOOD CELL', 'PLATELET', 'PLATELET COUNT', 'PCV', 'HEMATOCRIT',
        'MCV', 'MCH', 'MCHC', 'RDW', 'NEUTROPHIL', 'LYMPHOCYTE', 'MONOCYTE',
        'EOSINOPHIL', 'BASOPHIL', 'PERIPHERAL SMEAR', 'T0005', 'SCDT0005'
      ]
    },
    'KFT': {
      panelName: 'Kidney Function Test (KFT/RFT)',
      aliases: ['KFT', 'RFT', 'KIDNEY FUNCTION', 'RENAL FUNCTION', 'T0014', 'SCDT0014'],
      subTests: [
        'CREATININE', 'SERUM CREATININE', 'UREA', 'BLOOD UREA', 'BUN', 'URIC ACID',
        'T0015', 'SCDT0015', 'T0016', 'SCDT0016'
      ]
    },
    'LFT': {
      panelName: 'Liver Function Test (LFT)',
      aliases: ['LFT', 'LIVER FUNCTION', 'LIVER PANEL', 'T0013', 'SCDT0013'],
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
    }
  },

  // Health Packages and covered panels / standalone tests
  packageDefinitions: {
    'PKG001': {
      name: 'Selfcare Basic Health Panel',
      aliases: ['PKG001', 'BASIC HEALTH', 'BASIC WELLNESS'],
      panels: ['CBC', 'LIPID'],
      standalone: ['FBS', 'FASTING BLOOD SUGAR', 'URINE ROUTINE', 'T0008', 'T0046']
    },
    'PKG002': {
      name: 'Selfcare Premium Health Panel',
      aliases: ['PKG002', 'PREMIUM HEALTH', 'PREMIUM PACKAGE'],
      panels: ['CBC', 'LFT', 'KFT', 'LIPID'],
      standalone: ['TSH', 'FBS', 'FASTING BLOOD SUGAR', 'URINE ROUTINE', 'T0008', 'T0037', 'T0046']
    },
    'PKG003': {
      name: 'Selfcare Elite Health Panel',
      aliases: ['PKG003', 'ELITE HEALTH', 'ELITE PANEL'],
      panels: ['CBC', 'LFT', 'KFT', 'LIPID', 'THYROID'],
      standalone: ['VITAMIN D', 'VITAMIN B12', 'HBA1C', 'T0011', 'T0034', 'T0035']
    },
    'PKG010': {
      name: 'Fever Advanced Panel',
      aliases: ['PKG010', 'FEVER ADVANCED'],
      panels: ['CBC'],
      standalone: ['ESR', 'CRP', 'MALARIA', 'WIDAL', 'T0002', 'T0041', 'T0043M', 'T0051W']
    },
    'PKG011': {
      name: 'Dengue Complete Profile',
      aliases: ['PKG011', 'DENGUE PROFILE'],
      panels: [],
      standalone: ['DENGUE NS1', 'DENGUE IGM', 'DENGUE IGG', 'DENGUE']
    },
    'PKG012': {
      name: 'Dengue + Malaria Screen',
      aliases: ['PKG012', 'DENGUE + MALARIA'],
      panels: [],
      standalone: ['DENGUE NS1', 'DENGUE IGM', 'DENGUE IGG', 'MALARIA', 'MALARIA ANTIGEN', 'PERIPHERAL SMEAR', 'T0043M']
    },
    'PKG013': {
      name: 'Typhoid Screening',
      aliases: ['PKG013', 'TYPHOID SCREENING'],
      panels: [],
      standalone: ['WIDAL', 'TYPHOID', 'T0051W']
    }
  },

  isPackage(item) {
    if (!item) return false;
    return item.type === 'package' || String(item.PackageID || item.PackageCode || item.code || '').toUpperCase().startsWith('PKG');
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
    const name = (item.TestName || item.PackageName || item.name || '').toUpperCase();
    const code = (item.TestCode || item.PackageCode || item.code || '').toUpperCase();

    if (this.matchesPanel(item, panelKey)) return false;

    return p.subTests.some(sub => {
      const regex = new RegExp(`\\b${sub}\\b`, 'i');
      return regex.test(name) || code === sub;
    });
  },

  /**
   * Validates if adding `newItem` creates conflict with `cart`
   */
  checkConflict(newItem, cart) {
    if (!newItem || !Array.isArray(cart) || cart.length === 0) {
      return { hasConflict: false, reason: '' };
    }

    const newIsPkg = this.isPackage(newItem);
    const newName = newItem.TestName || newItem.PackageName || newItem.name || 'Selected Item';
    const newPkgKey = Object.keys(this.packageDefinitions).find(k => {
      const p = this.packageDefinitions[k];
      const code = (newItem.PackageCode || newItem.PackageID || newItem.code || '').toUpperCase();
      const name = newName.toUpperCase();
      return p.aliases.some(a => code === a || name.includes(a));
    });

    for (const cartItem of cart) {
      const cartIsPkg = this.isPackage(cartItem);
      const cartName = cartItem.TestName || cartItem.PackageName || cartItem.name || 'Cart Item';
      const cartPkgKey = Object.keys(this.packageDefinitions).find(k => {
        const p = this.packageDefinitions[k];
        const code = (cartItem.PackageCode || cartItem.PackageID || cartItem.code || '').toUpperCase();
        const name = cartName.toUpperCase();
        return p.aliases.some(a => code === a || name.includes(a));
      });

      // CASE 1: Cart-il Package ulladhu -> User panel/sub-test add seiya muyarchithaal
      if (cartIsPkg && !newIsPkg && cartPkgKey) {
        const pkgDef = this.packageDefinitions[cartPkgKey];

        for (const pKey of pkgDef.panels) {
          if (this.matchesPanel(newItem, pKey)) {
            return {
              hasConflict: true,
              reason: `Conflict: "${newName}" is already included in "${cartName}" package in your cart.`
            };
          }
          if (this.matchesSubTestOfPanel(newItem, pKey)) {
            const panelTitle = this.panelToParameters[pKey].panelName;
            return {
              hasConflict: true,
              reason: `Conflict: "${newName}" is already covered under "${panelTitle}" in "${cartName}" package.`
            };
          }
        }

        const nameUpper = newName.toUpperCase();
        const codeUpper = (newItem.TestCode || newItem.code || '').toUpperCase();
        const matchesStandalone = pkgDef.standalone.some(term => {
          const regex = new RegExp(`\\b${term}\\b`, 'i');
          return regex.test(nameUpper) || codeUpper === term;
        });
        if (matchesStandalone) {
          return {
            hasConflict: true,
            reason: `Conflict: "${newName}" is already included in "${cartName}" package in your cart.`
          };
        }
      }

      // CASE 2: Cart-il Test / Sub-test ulladhu -> User Package add seiya muyarchithaal
      if (!cartIsPkg && newIsPkg && newPkgKey) {
        const pkgDef = this.packageDefinitions[newPkgKey];

        for (const pKey of pkgDef.panels) {
          if (this.matchesPanel(cartItem, pKey)) {
            return {
              hasConflict: true,
              reason: `Conflict: "${newName}" package already includes "${cartName}" which is in your cart. Please remove the individual test first.`
            };
          }
          if (this.matchesSubTestOfPanel(cartItem, pKey)) {
            return {
              hasConflict: true,
              reason: `Conflict: Your cart already has "${cartName}" which is covered under "${newName}". Please remove "${cartName}" first to add this complete package.`
            };
          }
        }

        const cartNameUpper = cartName.toUpperCase();
        const cartCodeUpper = (cartItem.TestCode || cartItem.code || '').toUpperCase();
        const matchesStandalone = pkgDef.standalone.some(term => {
          const regex = new RegExp(`\\b${term}\\b`, 'i');
          return regex.test(cartNameUpper) || cartCodeUpper === term;
        });
        if (matchesStandalone) {
          return {
            hasConflict: true,
            reason: `Conflict: "${newName}" includes "${cartName}" which is in your cart. Please remove the individual test first.`
          };
        }
      }

      // CASE 3: Parent Panel vs Constituent Sub-parameter (e.g. CBC vs Hb, KFT vs Urea)
      if (!cartIsPkg && !newIsPkg) {
        for (const pKey of Object.keys(this.panelToParameters)) {
          // 3A: Cart-il Parent Panel ulladhu, sub-parameter add seiyappadugirathu
          if (this.matchesPanel(cartItem, pKey) && this.matchesSubTestOfPanel(newItem, pKey)) {
            return {
              hasConflict: true,
              reason: `Conflict: "${newName}" is already covered in "${cartName}" which is in your cart.`
            };
          }

          // 3B: Cart-il Sub-parameter ulladhu, Parent Panel add seiyappadugirathu
          if (this.matchesSubTestOfPanel(cartItem, pKey) && this.matchesPanel(newItem, pKey)) {
            return {
              hasConflict: true,
              reason: `Conflict: Your cart already has "${cartName}" which is part of "${newName}". Please remove the individual parameter first to add the complete panel.`
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
