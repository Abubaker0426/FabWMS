/**
 * spacing.js — single source of truth for layout values in FabWMS
 *
 * HOW TO USE:
 *   import { Spacing, Radius, FontSize, Shadows } from '../constants/spacing';
 *   style={{ padding: Spacing.md, borderRadius: Radius.card }}
 *
 * SCALE: 4px base unit.
 *   xs=4, sm=8, md=12, lg=16, xl=20, xxl=24, xxxl=30, huge=50
 */

// ─── Spacing scale ────────────────────────────────────────────────────────────
export const Spacing = {
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  xxl:   24,
  xxxl:  30,

  // Screen-level padding (replaces hardcoded paddingTop: 50 everywhere)
  // Use with useSafeAreaInsets() — see App.js
  screenPaddingHorizontal: 10,
  screenPaddingTop: 50,       // legacy fallback — prefer safeArea.top + 8

  // Component-specific — named so intent is clear
  headerHeight: 60,
  headerMarginTop: 30,        // header top margin (pre-safe-area)
  headerPaddingHorizontal: 16,

  buttonHeight: 50,
  buttonWidth: 180,
  buttonMarginTop: 20,
  buttonBorderRadius: 5,

  sectionGap: 20,             // HomeScreen button gap
  radioGroupGap: 15,

  tableRowPaddingVertical: 8,
  tableRowPaddingHorizontal: 8,
  tableHeaderPaddingVertical: 10,

  cardPadding: 16,
  cardMarginBottom: 16,

  bottomSheetHandleHeight: 30,
  bottomSheetCollapsed: 100,  // used in DraggableSheet (Phase 3)

  drawerTopRatio: 0.3,        // drawer opens to 30% of screen height

  rackItemPadding: 15,
  deleteButtonPadding: 8,

  inputHeight: 50,
  inputPaddingHorizontal: 15,
  inputMarginTop: 20,

  scanBoxRatio: 0.7,          // scan box = 70% of screen width
  scanResetDelay: 1500,       // ms before scanner resets
  duplicateTimeout: 2000,     // ms to block duplicate scans
};

// ─── Border radius ────────────────────────────────────────────────────────────
export const Radius = {
  xs:     4,
  sm:     5,
  md:     8,
  lg:     12,
  xl:     15,    // bottom sheet corners
  xxl:    20,    // drawer corners
  pill:   20,    // scanner status badge
  circle: 999,   // fully circular (radio inner dot uses half of its size)

  // Named by component
  button: 5,
  card: 12,
  input: 8,
  badge: 20,
  rackItem: 8,
  handleBar: 2.5,
};

// ─── Font sizes ───────────────────────────────────────────────────────────────
export const FontSize = {
  xs:    12,
  sm:    13,
  md:    14,
  lg:    16,
  xl:    18,
  xxl:   20,

  // Named by role
  screenTitle: 20,
  sectionTitle: 16,
  body: 14,
  label: 14,
  caption: 12,
  button: 16,
  headerTitle: 20,
  tableCell: 12,
  tableHeader: 13,
  rackName: 16,
  itemCount: 12,
  timestamp: 12,
  popupTitle: 16,
  popupMessage: 14,
};

// ─── Shadows ──────────────────────────────────────────────────────────────────
// Centralised so Android elevation and iOS shadow stay in sync.
export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  bottomSheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  drawer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
};