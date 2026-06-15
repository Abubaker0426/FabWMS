/**
 * colors.js — single source of truth for all colors in FabWMS
 *
 * HOW TO USE:
 *   import { Colors } from '../constants/colors';
 *   style={{ backgroundColor: Colors.primary }}
 *
 * HOW TO CHANGE THE APP THEME:
 *   Change the values here. Every screen updates automatically.
 */

// ─── Brand / Primary ──────────────────────────────────────────────────────────
// Previously scattered as #3B82F6 (header), #1E90FF (button), #007AFF (details)
// Unified to one blue family.

export const Colors = {

  // Primary brand blue — used for header, main buttons, activity indicators
  primary: '#3B82F6',
  primaryDark: '#1D65D4',       // pressed state for buttons
  primaryLight: '#EFF6FF',      // subtle backgrounds, radio selected bg

  // Action blue (iOS-style) — used for links, secondary CTAs
  action: '#007AFF',
  actionDark: '#004D99',        // radio button selected border

  // ─── Feedback ───────────────────────────────────────────────────────────────
  success: '#4CAF50',
  successLight: '#e8f5e9',      // success modal background
  successBorder: '#4caf50',
  successAlt: '#34c759',        // iOS green — rack exit success border
  successAltLight: '#e6ffed',   // rack exit success background

  error: '#f44336',
  errorLight: '#ffebee',        // error modal / delete button background
  errorBorder: '#ef9a9a',       // error container border
  errorAlt: '#ff4444',          // popup error background
  errorDark: '#c62828',         // error text

  warning: '#ff9800',           // empty rack indicator
  info: '#2196f3',              // info state (rack exit)
  infoLight: '#e6f3ff',
  infoBorder: '#2196f3',

  // ─── Neutrals ───────────────────────────────────────────────────────────────
  white: '#ffffff',
  offWhite: '#f8f9fa',          // drawer background
  surface: '#f8f8f8',           // bottom sheet handle area
  background: '#f9f9f9',        // input background
  card: '#ffffff',

  // Borders & dividers
  border: '#ddd',
  borderLight: '#eee',
  borderFaint: '#f0f0f0',
  borderCard: '#e5e7eb',

  // Text hierarchy
  textPrimary: '#111827',       // darkest body text
  textSecondary: '#374151',     // labels
  textMuted: '#666666',         // timestamps, subtitles
  textFaint: '#888888',         // empty state text, hints
  textBody: '#333333',          // popup body text
  textLink: '#1976d2',          // scanner input display text

  // Grays — structural UI
  handleBar: '#cccccc',         // bottom sheet handle pill
  tableHeader: '#dddddd',       // table header background
  rackHeader: '#e8f4f8',        // rack item header background
  rackBackground: '#f9f9f9',    // rack item container background
  inputBorder: '#cccccc',       // text input border
  disabledButton: '#cccccc',    // disabled button background

  // Dark overlays
  overlayDark: 'rgba(0,0,0,0.5)',
  overlayMedium: 'rgba(0,0,0,0.3)',
  overlayLoading: 'rgba(0,0,0,0.7)',
  overlayScanBox: 'rgba(128,128,128,0.6)',

  // Scanner feedback
  scannerSuccess: '#00ff00',    // scan confirmed bg
  scannerLoading: '#ffa500',    // scan processing bg
  scannerError: 'rgba(255,0,0,0.7)', // duplicate scan alert

  // Misc
  black: '#000000',
  transparent: 'transparent',
  shadow: '#000000',            // shadowColor (always black in RN)
};