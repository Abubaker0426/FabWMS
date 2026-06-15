/**
 * logger.js — production-safe logging utility
 *
 * HOW TO USE:
 *   import { logger } from '../utils/logger';
 *   logger.log('[SCANNER] Scanned data:', cleanData);
 *   logger.error('[API ERROR]', error);
 *   logger.warn('Duplicate scan detected');
 *
 * WHY: Your app has 40+ console.log calls that will spam the console
 * in production builds and slow down the app. This wrapper is a
 * no-op in production (__DEV__ === false), but works normally in dev.
 */

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

export const logger = {
  /**
   * General info log — replaces console.log
   * Silent in production builds.
   */
  log: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Error log — replaces console.error
   * Always logs (errors matter in production too).
   * In Phase 2 you can wire this to a crash reporter (Sentry, etc.)
   */
  error: (...args) => {
    console.error(...args);
    // TODO Phase 4: Sentry.captureException(args[1]) or similar
  },

  /**
   * Warning log — replaces console.warn
   * Silent in production builds.
   */
  warn: (...args) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * API-specific log — groups request/response for readability in dev
   */
  api: (label, data) => {
    if (isDev) {
      console.log(`[API] ${label}`, JSON.stringify(data, null, 2));
    }
  },
};