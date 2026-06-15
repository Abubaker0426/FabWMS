/**
 * useRackScanning.js
 *
 * One hook that handles the entire rack-scanning flow.
 * Used by BOTH PalletRackEntry and FabRackEntry.
 * The only difference between those two screens is which API function
 * they call and what fields come back — that's all handled by the
 * config object you pass in.
 */

import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { ToastDefaults } from '../constants/toastConfig';
import { classifyBarcode, cleanBarcode } from '../utils/barcodeUtils';
import { logger } from '../utils/logger';

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param {object} config
 * @param {Function} config.postToRackFn    — (rackBarcode, itemBarcode) => Promise
 * @param {Function} config.fetchDetailsFn  — fetchBarcodeDetails from apiService
 * @param {'pallet'|'fabric'} config.itemType — used by barcode classifier fallback
 * @param {string} config.itemLabel         — 'pallet' or 'fabric', used in toast messages
 * @param {Function} config.buildItem       — (barcode, apiResponse) => item object for the list
 */
export const useRackScanning = ({
  postToRackFn,
  fetchDetailsFn,
  itemType  = 'fabric',
  itemLabel = 'item',
  buildItem,
}) => {

  const [isLoading,           setIsLoading]           = useState(false);
  const [currentRackBarcode,  setCurrentRackBarcode]  = useState(null);
  const [scannedRacks,        setScannedRacks]        = useState([]);

  // Use a ref for the seen-items Set — updating a Set doesn't need to re-render
  const seenItems = useRef(new Set());

  // ── Helpers ────────────────────────────────────────────────────────────────

  const notify = useCallback((type, text1, text2) => {
    Toast.show({ ...ToastDefaults, type, text1, text2 });
  }, []);

  const isCurrentRackEmpty = useCallback(() => {
    if (!currentRackBarcode) return true;
    const rack = scannedRacks.find(r => r.rackBarcode === currentRackBarcode);
    return !rack || rack.items.length === 0;
  }, [currentRackBarcode, scannedRacks]);

  // ── Rack scan handler ──────────────────────────────────────────────────────

  const handleRackScan = useCallback((rackBarcode) => {
    // Guard: don't switch to an empty rack from another rack (FabRackEntry logic)
    if (currentRackBarcode && currentRackBarcode !== rackBarcode && isCurrentRackEmpty()) {
      notify('error',
        'Cannot switch racks',
        `Rack ${currentRackBarcode} is empty. Add items first.`
      );
      return;
    }

    // Already on this rack — silently ignore re-scan
    if (currentRackBarcode === rackBarcode) return;

    setCurrentRackBarcode(rackBarcode);

    // Add to list if not already there
    setScannedRacks(prev =>
      prev.some(r => r.rackBarcode === rackBarcode)
        ? prev
        : [...prev, {
            id:          Date.now(),
            rackName:    `Rack ${rackBarcode}`,
            rackBarcode,
            isExpanded:  false,
            items:       [],
          }]
    );

    notify('success', `Rack scanned`, `Now scan ${itemLabel}s into rack ${rackBarcode}`);
  }, [currentRackBarcode, isCurrentRackEmpty, itemLabel, notify]);

  // ── Item scan handler ──────────────────────────────────────────────────────

  const handleItemScan = useCallback(async (itemBarcode) => {
    if (!currentRackBarcode) {
      notify('error', 'No rack selected', `Please scan a rack before scanning a ${itemLabel}.`);
      return;
    }

    if (seenItems.current.has(itemBarcode)) {
      notify('error', 'Already scanned', `${itemLabel} ${itemBarcode} has already been added.`);
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Validate barcode exists in system via API
      await fetchDetailsFn(itemBarcode);
      logger.api(`Validated ${itemLabel} barcode`, { itemBarcode });

      // Step 2: Add to rack
      const response = await postToRackFn(currentRackBarcode, itemBarcode);
      logger.api(`Add ${itemLabel} to rack`, { rackBarcode: currentRackBarcode, itemBarcode, response });

      seenItems.current.add(itemBarcode);

      const newItem = buildItem(itemBarcode, response);

      setScannedRacks(prev => {
        const idx = prev.findIndex(r => r.rackBarcode === currentRackBarcode);
        if (idx === -1) return prev;

        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          items: [...updated[idx].items, newItem],
        };
        return updated;
      });

    } catch (err) {
      logger.error(`[useRackScanning] Failed to add ${itemLabel}:`, err);
      const msg = err?.response?.data?.message || err?.message || `Failed to add ${itemLabel} to rack`;
      notify('error', 'Scan failed', msg);
    } finally {
      setIsLoading(false);
    }
  }, [currentRackBarcode, itemLabel, fetchDetailsFn, postToRackFn, buildItem, notify]);

  // ── Unknown barcode — ask user ─────────────────────────────────────────────
  // Replicates the Alert.alert from FabRackEntry for ambiguous barcodes.

  const handleUnknownBarcode = useCallback((barcode) => {
    if (seenItems.current.has(barcode)) {
      notify('error', 'Already scanned', `${barcode} already processed.`);
      return;
    }
    Alert.alert(
      'Barcode type unknown',
      `Is "${barcode}" a rack or ${itemLabel}?`,
      [
        { text: 'Rack',             onPress: () => handleRackScan(barcode) },
        { text: itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1),
                                    onPress: () => handleItemScan(barcode) },
        { text: 'Cancel',           style: 'cancel' },
      ]
    );
  }, [seenItems, itemLabel, handleRackScan, handleItemScan, notify]);

  // ── Main scan entry point ──────────────────────────────────────────────────
  // This is what ScannerScreen's onScanSuccess calls.

  const handleScannedData = useCallback(async (scanResult) => {
    if (!scanResult?.data || isLoading) return;

    const barcode = cleanBarcode(scanResult.data);
    if (!barcode) return;

    setIsLoading(true);
    try {
      const { type } = await classifyBarcode(barcode, fetchDetailsFn, itemType);
      logger.log(`[useRackScanning] Classified "${barcode}" as: ${type}`);

      if      (type === 'rack')    handleRackScan(barcode);
      else if (type === itemType)  await handleItemScan(barcode);
      else     notify('error', 'Invalid barcode', `Expected a rack or ${itemLabel} barcode. Please try again.`);

    } catch {
      notify('error', 'Scan error', 'Failed to classify barcode. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, fetchDetailsFn, itemType, handleRackScan, handleItemScan, handleUnknownBarcode, notify]);

  const handleScanError = useCallback(() => {
    notify('error', 'Scanner error', 'An error occurred while scanning. Please try again.');
  }, [notify]);

  // ── List manipulation ──────────────────────────────────────────────────────

  const toggleRackExpansion = useCallback((rackId) => {
    setScannedRacks(prev =>
      prev.map(r => r.id === rackId ? { ...r, isExpanded: !r.isExpanded } : r)
    );
  }, []);

  const deleteItem = useCallback((rackId, itemId, itemBarcodeKey) => {
    setScannedRacks(prev => {
      const updated = prev.map(rack => {
        if (rack.id !== rackId) return rack;

        const item = rack.items.find(i => i.id === itemId);
        if (item && itemBarcodeKey) {
          // Remove from the seen-set so it can be re-scanned
          seenItems.current.delete(item[itemBarcodeKey]);
        }
        return { ...rack, items: rack.items.filter(i => i.id !== itemId) };
      });
      // Remove racks that are now empty
      return updated.filter(r => r.items.length > 0);
    });
  }, []);

  const resetScanning = useCallback(() => {
    setCurrentRackBarcode(null);
    setScannedRacks([]);
    seenItems.current.clear();
    notify('info', 'Reset complete', 'All scan data has been cleared.');
  }, [notify]);

  // ── Derived values ─────────────────────────────────────────────────────────

  const totalItemCount = scannedRacks.reduce((sum, r) => sum + r.items.length, 0);

  return {
    // State
    isLoading,
    currentRackBarcode,
    scannedRacks,
    totalItemCount,

    // Scan handlers — wire these to ScannerScreen
    handleScannedData,
    handleScanError,

    // List actions — wire these to the bottom sheet rows
    toggleRackExpansion,
    deleteItem,
    resetScanning,
  };
};