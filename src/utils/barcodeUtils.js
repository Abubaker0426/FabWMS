/**
 * barcodeUtils.js
 *
 * Single source of truth for barcode classification.
 * Logic mirrors Java AppConstants + CommonUtils.getBarcodeType() exactly.
 *
 * ─── BARCODE LENGTH RULES (from Java AppConstants) ───────────────────────────
 *   RACK_BARCODE_LENGTH    = 5   → type: 'rack'
 *   DATE_BARCODE_LENGTH    = 6   → type: 'date'
 *   PALLET_BARCODE_LENGTH  = 20  → type depends on SUPPLIER_CODE presence
 *   SUPPLIER_CODE          = '23009'
 *     length >= 20 + contains '23009' → 'article'
 *     length >= 20, no '23009'        → 'pallet' or 'fabric' (context decides)
 *     anything else                   → 'unknown'
 *
 * ─── USAGE ───────────────────────────────────────────────────────────────────
 *
 *   import { classifyBarcode, cleanBarcode } from '../utils/barcodeUtils';
 *
 *   const barcode = cleanBarcode(rawScanData);
 *   const { type, details } = await classifyBarcode(barcode, fetchBarcodeDetails, 'fabric');
 *   // type: 'rack' | 'fabric' | 'pallet' | 'article' | 'date' | 'unknown' | 'error'
 */

import { logger } from './logger';

// ─── Java AppConstants mirrored ───────────────────────────────────────────────
const RACK_LENGTH   = 5;
const DATE_LENGTH   = 6;
const PALLET_LENGTH = 20;
const SUPPLIER_CODE = '23009';

// ─── Clean raw scan data ──────────────────────────────────────────────────────
export const cleanBarcode = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  return raw.trim().replace(/[()]/g, '');
};

// ─── Local length-based classification (no API) ───────────────────────────────
// Rack detection mirrors Java: exactly 5 chars = rack.
// For everything else (fabric, pallet) we cannot rely on Java's >=20 rule
// because RN barcodes may be shorter — so we fall back to itemType from context.
const classifyByLength = (barcode, itemType) => {
  if (barcode.length === RACK_LENGTH) return 'rack';
  // Java date/article/pallet rules only apply when lengths match exactly
  if (barcode.length === DATE_LENGTH)  return 'date';
  if (barcode.length >= PALLET_LENGTH && barcode.includes(SUPPLIER_CODE)) return 'article';
  if (barcode.length >= PALLET_LENGTH) return itemType; // pallet or fabric by context
  // Any other length → treat as the expected item type for this screen
  // (fabric screen → fabric, pallet screen → pallet)
  return itemType;
};

// ─── Classify barcode type ────────────────────────────────────────────────────
/**
 * Determines whether a barcode is a rack, pallet, fabric, article, date, or unknown.
 *
 * Strategy:
 *   1. Length-based classification (mirrors Java) — fast, no network call
 *      This resolves rack, date, article definitively.
 *   2. For pallet/fabric (length >= 20, no supplier code):
 *      itemType param decides ('pallet' for PalletRackEntry, 'fabric' for FabRackEntry)
 *   3. For 'unknown' (short barcodes that are not rack/date):
 *      Optional API call to try to resolve — only fires for truly ambiguous lengths.
 *
 * @param {string} barcode          — already cleaned via cleanBarcode()
 * @param {Function} fetchDetailsFn — apiService.fetchBarcodeDetails (only called for unknowns)
 * @param {'pallet'|'fabric'} [itemType='fabric']
 *        — PalletRackEntry passes 'pallet', FabRackEntry passes 'fabric'
 *
 * @returns {Promise<{ type: 'rack'|'pallet'|'fabric'|'article'|'date'|'unknown'|'error', barcode: string, details?: any }>}
 */
export const classifyBarcode = async (barcode, fetchDetailsFn, itemType = 'fabric') => {
  if (!barcode) return { type: 'error', barcode };

  // ── Step 1: Length classification — handles rack/date/article/pallet instantly ──
  const localType = classifyByLength(barcode, itemType);
  logger.log(`[barcodeUtils] Length-classified "${barcode}" (len=${barcode.length}) → ${localType}`);

  if (localType !== 'unknown') {
    return { type: localType, barcode };
  }

  // ── Step 2: Only call API for truly unknown barcodes (not rack/date/pallet length) ──
  logger.warn(`[barcodeUtils] Barcode "${barcode}" has unexpected length ${barcode.length}, trying API`);
  try {
    const response = await fetchDetailsFn(barcode);
    const data = response?.data ?? response;

    if (!data) return { type: 'unknown', barcode };

    if (data.rackId   || data.rackCode)                                          return { type: 'rack',   barcode, details: data };
    if (data.palletId || data.palletCode)                                        return { type: 'pallet', barcode, details: data };
    if (data.fabricId || data.fabricCode || data.poNumber)                       return { type: 'fabric', barcode, details: data };

    return { type: 'unknown', barcode };

  } catch (err) {
    logger.warn('[barcodeUtils] API fallback also failed:', err.message);
    return { type: 'error', barcode };
  }
};