/**
 * useApiCall.js
 * Generic hook that wraps ANY async API call with:
 *   - loading state
 *   - error extraction (handles all error shapes in your codebase)
 *   - automatic Toast feedback (no more Modal per screen)
 *   - duplicate-scan guard
 *
 * ─── USAGE EXAMPLES ──────────────────────────────────────────────────────────
 * 1. Simple one-shot call (FabRackExit, PalletRackExit pattern):
 * 2. With data returned (FabDetails, FabWHentry pattern):
 * 3. With duplicate guard (FabWHentry, FabWHexit pattern):
 */

import { useState, useCallback, useRef } from 'react';
import Toast from 'react-native-toast-message';
import { logger } from '../utils/logger';
import { ToastDefaults } from '../constants/toastConfig';

// ─── Error message extractor ──────────────────────────────────────────────────
// Handles every error shape found across your screens:
//   error.response.data.message  (most API errors)
//   error.response.data.error
//   error.response.data          (raw string from backend)
//   error.message                (network / JS errors)

const extractErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error  ||
    (typeof error?.response?.data === 'string' ? error.response.data : null) ||
    error?.message                ||
    fallback
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param {object} [hookOptions]
 * @param {boolean} [hookOptions.showSuccessToast=true]  Show green toast on success
 * @param {boolean} [hookOptions.showErrorToast=true]    Show red toast on error
 */
export const useApiCall = (hookOptions = {}) => {
  const {
    showSuccessToast = true,
    showErrorToast   = true,
  } = hookOptions;

  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState(null);

  // Duplicate-scan guard — a Set stored in a ref (not state) so it never
  // causes re-renders on its own.
  const seenBarcodes = useRef(new Set());

  // ── isDuplicate ────────────────────────────────────────────────────────────
  const isDuplicate = useCallback((barcode) => {
    if (seenBarcodes.current.has(barcode)) {
      Toast.show({
        ...ToastDefaults,
        type: 'error',
        text1: 'Already scanned',
        text2: `Barcode ${barcode} has already been processed.`,
      });
      return true;
    }
    return false;
  }, []);

  // ── markSeen ───────────────────────────────────────────────────────────────
  // Call this inside onSuccess after you've confirmed the API accepted it.
  const markSeen = useCallback((barcode) => {
    seenBarcodes.current.add(barcode);
  }, []);

  // ── clearSeen ──────────────────────────────────────────────────────────────
  // Call on reset / clear-all buttons.
  const clearSeen = useCallback(() => {
    seenBarcodes.current.clear();
  }, []);

  // ── execute ────────────────────────────────────────────────────────────────
  /**
   * @param {() => Promise<any>} apiFn   — the API call, e.g. () => postFabricData(barcode)
   * @param {object} [callOptions]
   * @param {(data: any) => void} [callOptions.onSuccess]      — called with response data
   * @param {(error: Error) => void} [callOptions.onError]     — called with the raw error
   * @param {string} [callOptions.successMessage]              — toast text1 on success
   * @param {string} [callOptions.successDetail]               — toast text2 on success
   * @param {string} [callOptions.errorMessage]                — override auto-extracted error
   * @returns {Promise<any>}                                   — the API response, or undefined on error
   */
  const execute = useCallback(async (apiFn, callOptions = {}) => {
    const {
      onSuccess,
      onError,
      successMessage,
      successDetail,
      errorMessage: overrideError,
    } = callOptions;

    if (isLoading) return; // prevent double-tap

    setIsLoading(true);
    setLastError(null);

    try {
      const data = await apiFn();
      logger.api('Response', data);

      if (showSuccessToast && successMessage) {
        Toast.show({
          ...ToastDefaults,
          type: 'success',
          text1: successMessage,
          text2: successDetail,
        });
      }

      onSuccess?.(data);
      return data;

    } catch (error) {
      logger.error('[useApiCall] API error:', error);

      const message = overrideError || extractErrorMessage(error);
      setLastError(message);

      if (showErrorToast) {
        Toast.show({
          ...ToastDefaults,
          type: 'error',
          text1: 'Error',
          text2: message,
        });
      }

      onError?.(error);

    } finally {
      setIsLoading(false);
    }
  }, [isLoading, showSuccessToast, showErrorToast]);

  return {
    execute,
    isLoading,
    lastError,
    isDuplicate,
    markSeen,
    clearSeen,
  };
};