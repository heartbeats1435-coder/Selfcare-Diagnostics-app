/* file: assets/js/utils.js */
/**
 * Selfcare Diagnostics - Utilities & Dynamic 2-Tier Sheet Inspection Engine v11.0.0
 * Features:
 * 1. Rupee currency formatting, XSS sanitization, debouncing, online check, and toast notifications.
 * 2. Strict Bi-directional Dynamic Conflict Validation Engine:
 *    - Rule 1: Package vs Individual Test (Blocks LFT / GGT / Bilirubin if package has LFT, allows Vitamin D).
 *    - Rule 2: Individual Test vs Package.
 *    - Rule 3: Parent Panel vs Sub-parameter (e.g. CBC vs Hb, LFT vs GGT).
 *    - Rule 4: PACKAGE vs PACKAGE Deep Overlap (Blocks adding 1999 package when 1299 package is in cart).
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
 * CONFLICT VALIDATOR ENGINE - DYNAMIC 2-TIER SHEET GRAPH INSPECTION
 * =========================================================================
 */
const ConflictValidator = {
  // Common Organ Panel Clinical Alias Groups
  panelAliases: {
    'LFT': ['lft', 'liver function test', 'liver function', 'liver panel', 'hepatic function', 'liver profile', 't0013', 'scdt0013'],
    'CBC': ['cbc', 'complete blood count', 'hemogram', 'complete hemogram', 'haemogram', 't0001', 'scdt0001'],
    'KFT': ['kft', 'rft', 'kidney function test', 'renal function test', 'kidney function', 'renal function', 'kidney panel', 'renal panel', 't0016', 't0014', 'scdt0016', 'scdt0014'],
    'LIPID': ['lipid profile', 'lipid panel', 'cholesterol panel', 'lipid screen', 'lipids', 't0012', 'scdt0012'],
    'THYROID': ['thyroid profile', 'thyroid panel', 'total thyroid', 't3 t4 tsh', 'thyroid function', 't0040', 'scdt0040'],
    'DIABETES': ['diabetes profile', 'diabetic screen', 'diabetes panel', 'blood sugar profile']
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

  cleanStr(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/[;,/|•\n\t()\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  getAllSheetTests() {
    try {
      const raw = localStorage.getItem('cache_tests') || localStorage.getItem('selfcare_tests_db');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  },

  findFullPackageFromSheet(cartPkg) {
    try {
      const raw = localStorage.getItem('cache_packages') || localStorage.getItem('selfcare_packages_db');
      if (raw) {
        const pkgs = JSON.parse(raw);
        const pId = String(cartPkg.PackageID || cartPkg.id || cartPkg.PackageCode || cartPkg.code || '').toUpperCase().trim();
        const pName = String(cartPkg.PackageName || cartPkg.TestName || cartPkg.name || '').toUpperCase().trim();

        const found = pkgs.find(p => {
          const cId = String(p.PackageID || p.id || p.PackageCode || '').toUpperCase().trim();
          const cName = String(p.PackageName || p.name || '').toUpperCase().trim();
          return (pId && cId === pId) || (pName && cName === pName);
        });

        if (found) return found;
      }
    } catch (e) {}
    return cartPkg;
  },

  extractPackageConstituents(pkg) {
    const fullPkg = this.findFullPackageFromSheet(pkg);
    const raw = fullPkg.Parameters || fullPkg.parameters || fullPkg.Description || fullPkg.WhyDone || '';
    const rawTestIds = fullPkg.TestIDs || fullPkg.testIds || fullPkg.TestCodeList || fullPkg.tests || '';

    let items = [];

    if (Array.isArray(raw)) {
      items.push(...raw.map(r => typeof r === 'object' && r !== null ? (r.Name || r.ParameterName || r.TestName || '') : String(r)));
    } else if (typeof raw === 'string') {
      items.push(...raw.split(/[;,|\n•]|<br\s*[\/]?>/i));
    }

    if (Array.isArray(rawTestIds)) {
      items.push(...rawTestIds);
    } else if (typeof rawTestIds === 'string') {
      items.push(...rawTestIds.split(/[,;|/\n]/));
    }

    return items
      .map(i => String(i).trim())
      .filter(i => i.length > 1);
  },

  /**
   * Determines if two test names or codes represent the exact same Organ Panel (e.g. "LFT" vs "Liver Function Test")
   */
  isSameOrganPanel(nameA, codeA, nameB, codeB) {
    const cleanA = this.cleanStr(nameA);
    const cleanB = this.cleanStr(nameB);
    const cA = String(codeA || '').toUpperCase();
    const cB = String(codeB || '').toUpperCase();

    if (cA && cB && cA === cB) return true;
    if (cleanA && cleanB && cleanA === cleanB) return true;

    for (const key of Object.keys(this.panelAliases)) {
      const aliases = this.panelAliases[key];
      const aMatches = aliases.some(alias => cleanA === alias || cleanA.includes(alias) || cA === alias.toUpperCase());
      const bMatches = aliases.some(alias => cleanB === alias || cleanB.includes(alias) || cB === alias.toUpperCase());
      if (aMatches && bMatches) {
        return true;
      }
    }
    return false;
  },

  /**
   * Reads BloodTests Sheet row for a panel and returns all its dynamic sub-parameters
   */
  getDeepParametersForSheetTest(constituentName, allSheetTests) {
    if (!constituentName || !Array.isArray(allSheetTests) || allSheetTests.length === 0) {
      return { parentTest: null, subParameters: [] };
    }

    const cClean = this.cleanStr(constituentName);
    const cUpper = constituentName.toUpperCase().trim();

    const matchedTest = allSheetTests.find(t => {
      const tName = String(t.TestName || '').trim();
      const tCode = String(t.TestCode || t.TestID || '').toUpperCase().trim();
      const tClean = this.cleanStr(tName);

      if (tCode && tCode === cUpper) return true;
      if (tClean === cClean) return true;

      for (const key of Object.keys(this.panelAliases)) {
        const aliases = this.panelAliases[key];
        const cMatches = aliases.some(a => cClean === a || cClean.includes(a) || cUpper === a.toUpperCase());
        const tMatches = aliases.some(a => tClean === a || tClean.includes(a) || tCode === a.toUpperCase());
        if (cMatches && tMatches) return true;
      }

      const reg = new RegExp(`(^|[^a-z0-9])${cClean}([^a-z0-9]|$)`, 'i');
      return reg.test(tClean);
    });

    if (!matchedTest) {
      return { parentTest: null, subParameters: [] };
    }

    const rawParams = matchedTest.Parameters || matchedTest.Description || '';
    let subParams = [];

    if (Array.isArray(rawParams)) {
      subParams = rawParams.map(p => String(p).trim());
    } else if (typeof rawParams === 'string') {
      subParams = rawParams.split(/[;,|\n•]|<br\s*[\/]?>/i).map(p => p.trim());
    }

    const matchedCode = String(matchedTest.TestCode || matchedTest.TestID || '').toUpperCase();
    if (matchedCode === 'T0001' || this.cleanStr(matchedTest.TestName).includes('cbc')) {
      subParams.push('Hemoglobin', 'Hb', 'Total WBC', 'TLC', 'WBC', 'RBC', 'Platelet', 'PCV', 'MCV', 'MCH', 'MCHC', 'RDW', 'Neutrophils', 'Lymphocytes', 'Monocytes', 'Eosinophils', 'Basophils');
    }

    return {
      parentTest: matchedTest,
      subParameters: subParams.filter(p => p && p.length > 1)
    };
  },

  /**
   * Bi-directional Dynamic Conflict Engine
   */
  checkConflict(newItem, cart) {
    if (!newItem || !Array.isArray(cart) || cart.length === 0) {
      return { hasConflict: false, reason: '' };
    }

    if (this.isReticulocyte(newItem)) {
      return { hasConflict: false, reason: '' };
    }

    const allSheetTests = this.getAllSheetTests();
    const newIsPkg = this.isPackage(newItem);
    const newName = newItem.TestName || newItem.PackageName || newItem.name || 'Selected Test';
    const newNameClean = this.cleanStr(newName);
    const newCode = (newItem.TestCode || newItem.PackageCode || newItem.PackageID || newItem.code || '').toUpperCase().replace(/[\s\-_]/g, '');

    for (const cartItem of cart) {
      if (this.isReticulocyte(cartItem)) continue;

      const cartIsPkg = this.isPackage(cartItem);
      const cartName = cartItem.TestName || cartItem.PackageName || cartItem.name || 'Package';
      const cartNameClean = this.cleanStr(cartName);

      // =========================================================================
      // RULE 4: PACKAGE vs PACKAGE CONFLICT (e.g. 1299 Package vs 1999 Package)
      // =========================================================================
      if (cartIsPkg && newIsPkg) {
        // 1. Direct Same Package Check
        const cartCode = (cartItem.PackageCode || cartItem.PackageID || cartItem.TestCode || cartItem.code || '').toUpperCase().replace(/[\s\-_]/g, '');
        if (newCode && cartCode && newCode === cartCode) {
          return {
            hasConflict: true,
            reason: `⚠️ "${newName}" is already in your cart.`
          };
        }

        // 2. Overlapping Constituents / Panels Check (CBC, LFT, KFT, Lipid Profile, etc.)
        const cartConstituents = this.extractPackageConstituents(cartItem);
        const newConstituents = this.extractPackageConstituents(newItem);
        const commonOverlaps = [];

        for (const cItem of cartConstituents) {
          const cClean = this.cleanStr(cItem);
          for (const nItem of newConstituents) {
            const nClean = this.cleanStr(nItem);

            if (cClean === nClean || this.isSameOrganPanel(cItem, '', nItem, '')) {
              const displayName = cItem.toUpperCase();
              if (!commonOverlaps.includes(displayName)) {
                commonOverlaps.push(displayName);
              }
            }
          }
        }

        if (commonOverlaps.length > 0) {
          return {
            hasConflict: true,
            reason: `⚠️ Package Conflict: "${newName}" contains common panels/tests (${commonOverlaps.slice(0, 3).join(', ')}) already included in "${cartName}". You cannot add two health packages simultaneously.`
          };
        }

        // 3. Fallback: Both are comprehensive checkups (Prevent duplicate phlebotomy home visits)
        return {
          hasConflict: true,
          reason: `⚠️ Package Conflict: Your cart already has "${cartName}". Please remove it first to select "${newName}".`
        };
      }

      // =========================================================================
      // RULE 1: Cart-la Package irukku -> Individual Test add panna try pannumbodhu
      // =========================================================================
      if (cartIsPkg && !newIsPkg) {
        const pkgConstituents = this.extractPackageConstituents(cartItem);

        for (const constituent of pkgConstituents) {
          const itemClean = this.cleanStr(constituent);
          const itemCode = constituent.toUpperCase().replace(/[\s\-_]/g, '');

          // LEVEL 1: Whole Panel Block (Package has LFT -> User tries to add "LFT")
          if (newCode && (newCode === itemCode || newCode === constituent.toUpperCase())) {
            return {
              hasConflict: true,
              reason: `⚠️ "${newName}" already included in "${cartName}" package in your cart.`
            };
          }

          if (this.isSameOrganPanel(constituent, itemCode, newName, newCode)) {
            return {
              hasConflict: true,
              reason: `⚠️ "${newName}" already included in "${cartName}" package in your cart.`
            };
          }

          // LEVEL 2: Dynamic Sheet Sub-parameters Block (Package has LFT -> Blocks GGT, Bilirubin, SGOT, SGPT, ALP)
          const { parentTest, subParameters } = this.getDeepParametersForSheetTest(constituent, allSheetTests);

          if (parentTest) {
            const parentName = parentTest.TestName || constituent;

            if (this.isSameOrganPanel(parentName, parentTest.TestCode, newName, newCode)) {
              return {
                hasConflict: true,
                reason: `⚠️ "${newName}" already included in "${cartName}" package in your cart.`
              };
            }

            for (const param of subParameters) {
              const paramClean = this.cleanStr(param);
              const regexMatch = new RegExp(`(^|[^a-z0-9])${paramClean}([^a-z0-9]|$)`, 'i').test(newNameClean);
              const reverseRegexMatch = new RegExp(`(^|[^a-z0-9])${newNameClean}([^a-z0-9]|$)`, 'i').test(paramClean);

              if (paramClean === newNameClean || regexMatch || reverseRegexMatch) {
                return {
                  hasConflict: true,
                  reason: `⚠️ "${newName}" is already covered under "${parentName}" in "${cartName}" package.`
                };
              }
            }
          }
        }

        // LEVEL 3: Vitamin D package-lum illa, LFT parameters-lum illa என்பதால் ALLOW!
        continue;
      }

      // =========================================================================
      // RULE 2: Cart-la Test irukku -> Package add panna try pannumbodhu
      // =========================================================================
      if (!cartIsPkg && newIsPkg) {
        const pkgConstituents = this.extractPackageConstituents(newItem);

        for (const constituent of pkgConstituents) {
          const itemClean = this.cleanStr(constituent);
          const itemCode = constituent.toUpperCase().replace(/[\s\-_]/g, '');
          const cartCode = (cartItem.TestCode || cartItem.code || '').toUpperCase().replace(/[\s\-_]/g, '');

          if (this.isSameOrganPanel(constituent, itemCode, cartName, cartCode)) {
            return {
              hasConflict: true,
              reason: `⚠️ Your cart already has "${cartName}". Please remove it first to add "${newName}".`
            };
          }

          const { parentTest, subParameters } = this.getDeepParametersForSheetTest(constituent, allSheetTests);

          if (parentTest && subParameters.length > 0) {
            const parentName = parentTest.TestName || constituent;

            for (const param of subParameters) {
              const paramClean = this.cleanStr(param);
              const regexMatch = new RegExp(`(^|[^a-z0-9])${paramClean}([^a-z0-9]|$)`, 'i').test(cartNameClean);
              const reverseRegexMatch = new RegExp(`(^|[^a-z0-9])${cartNameClean}([^a-z0-9]|$)`, 'i').test(paramClean);

              if (paramClean === cartNameClean || regexMatch || reverseRegexMatch) {
                return {
                  hasConflict: true,
                  reason: `⚠️ Your cart has "${cartName}" which is already included under "${parentName}" in "${newName}". Please remove "${cartName}" first.`
                };
              }
            }
          }
        }
      }

      // =========================================================================
      // RULE 3: Panel vs Sub-parameter (e.g. Cart-la LFT irundhu GGT add pannaal)
      // =========================================================================
      if (!cartIsPkg && !newIsPkg) {
        const cartDeep = this.getDeepParametersForSheetTest(cartName, allSheetTests);
        if (cartDeep.parentTest && cartDeep.subParameters.length > 0) {
          for (const param of cartDeep.subParameters) {
            const paramClean = this.cleanStr(param);
            if (paramClean === newNameClean || 
                new RegExp(`(^|[^a-z0-9])${paramClean}([^a-z0-9]|$)`, 'i').test(newNameClean) ||
                new RegExp(`(^|[^a-z0-9])${newNameClean}([^a-z0-9]|$)`, 'i').test(paramClean)) {
              return {
                hasConflict: true,
                reason: `⚠️ "${newName}" is already covered inside "${cartName}" in your cart.`
              };
            }
          }
        }

        const newDeep = this.getDeepParametersForSheetTest(newName, allSheetTests);
        if (newDeep.parentTest && newDeep.subParameters.length > 0) {
          for (const param of newDeep.subParameters) {
            const paramClean = this.cleanStr(param);
            if (paramClean === cartNameClean || 
                new RegExp(`(^|[^a-z0-9])${paramClean}([^a-z0-9]|$)`, 'i').test(cartNameClean) ||
                new RegExp(`(^|[^a-z0-9])${cartNameClean}([^a-z0-9]|$)`, 'i').test(paramClean)) {
              return {
                hasConflict: true,
                reason: `⚠️ Cart-la already "${cartName}" irukku. Complete "${newName}" add panna first "${cartName}"-ah cart-la irunthu remove pannunga.`
              };
            }
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
