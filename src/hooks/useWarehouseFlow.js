/**
 * useWarehouseFlow.js
 *
 * Hook for simple scan → API call → append-to-list flows.
 * No rack selection, no barcode classification needed — just scan, call, display.
 *
 * Covers ALL four of these screens (they share identical logic):
 *   - FabWHentry   (postFabricData   → table rows)
 *   - FabWHexit    (putFabricData    → table rows)
 *   - FabRackExit  (putFabricToRack  → count + last scanned)
 *   - PalletRackExit (putPalletFromRack → count + last scanned)

 */

import { useCallback, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';
import { ToastDefaults } from '../constants/toastConfig';
import { logger } from '../utils/logger';

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param {object} config
 * @param {(barcode: string) => Promise<any>} config.apiFn
 *        — The API function to call. Receives the raw barcode string.
 *
 * @param {(barcode: string, response: any) => object} config.buildItem
 *        — Transforms the API response into a list item object.
 *
 * @param {(existingItem: object, newItem: object) => object} [config.mergeItem]
 *        — Optional. If provided and mergeKey matches an existing item,
 *          this function merges them instead of appending.
 *          (Used by FabWHentry/FabWHexit to group rolls by PO+invoice)
 *
 * @param {(item: object) => string} [config.mergeKey]
 *        — Returns the string key to match items for merging.
 *          Required if mergeItem is provided.
 *
 * @param {(barcode: string) => string} [config.successMessage]
 *        — Custom success toast text. Receives the barcode.
 *
 * @param {(error: Error) => string} [config.errorParser]
 *        — Optional custom error message extractor (PalletRackExit/FabRackExit
 *          have specific messages for different error types).
 */
export const useWarehouseFlow = ({
  apiFn,
  buildItem,
  mergeItem,
  mergeKey,
  successMessage,
  errorParser,
}) => {
  const [isLoading,   setIsLoading]   = useState(false);
  const [items,       setItems]       = useState([]);
  const [lastScanned, setLastScanned] = useState(null);

  // Duplicate guard — ref so it never causes extra renders
  const seenBarcodes = useRef(new Set());

  const notify = useCallback((type, text1, text2) => {
    Toast.show({ ...ToastDefaults, type, text1, text2 });
  }, []);

  // ── Main scan handler ──────────────────────────────────────────────────────

  const handleScannedData = useCallback(async (scanResult) => {
    const barcode = scanResult?.data ?? scanResult;
    if (!barcode || typeof barcode !== 'string') return;

    const clean = barcode.trim();

    // ── Duplicate guard ──────────────────────────────────────────────────
    if (seenBarcodes.current.has(clean)) {
      notify('error', 'Already scanned', `Barcode ${clean} has already been processed.`);
      return;
    }

    setIsLoading(true);
    setLastScanned(clean);
    logger.log('[useWarehouseFlow] Processing:', clean);

    try {
      const response = await apiFn(clean);
      logger.api('Warehouse flow response', response);

      seenBarcodes.current.add(clean);

      const newItem = buildItem(clean, response);

      setItems(prev => {
        // ── Merge logic (FabWHentry/FabWHexit group by PO + invoice) ────
        if (mergeItem && mergeKey) {
          const key = mergeKey(newItem);
          const idx = prev.findIndex(i => mergeKey(i) === key);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = mergeItem(updated[idx], newItem);
            return updated;
          }
        }
        return [...prev, newItem];
      });

      if (successMessage) {
        notify('success', successMessage(clean));
      }

    } catch (error) {
      logger.error('[useWarehouseFlow] API error:', error);

      const msg = errorParser
        ? errorParser(error)
        : error?.response?.data?.message ||
          error?.response?.data?.error   ||
          error?.message                 ||
          'Failed to process scanned barcode';

      notify(
        'error',
        'Scan failed',
        `${msg}${error?.response?.status ? ` (${error.response.status})` : ''}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, [apiFn, buildItem, mergeItem, mergeKey, successMessage, errorParser, notify]);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const resetFlow = useCallback(() => {
    setItems([]);
    setLastScanned(null);
    seenBarcodes.current.clear();
    notify('info', 'Reset', 'All scan data cleared.');
  }, [notify]);

  return {
    isLoading,
    items,
    lastScanned,
    totalCount: items.length,
    handleScannedData,
    resetFlow,
  };
};