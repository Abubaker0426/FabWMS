/**
 * AppSheetModal.jsx
 *
 * The single reusable bottom sheet wrapper for all screens in FabWMS.
 * Replaces ALL of these in one component:
 *   - PanResponder + Animated drag panel (PalletRackEntry, FabRackEntry)
 *   - Animated.timing slide drawer (FabDetails, PalletDetails)
 *   - Hand-rolled table drawer (FabWHentry, FabWHexit)
 *
 * Built on @gorhom/bottom-sheet — handles gestures, snap points,
 * keyboard avoidance, and safe area automatically on all devices.
 *
 * ─── USAGE PATTERNS ──────────────────────────────────────────────────────────
 *
 * Pattern A — Imperative (controlled by ref, no visible trigger button):
 * Used by: PalletRackEntry, FabRackEntry, FabDetails, PalletDetails
 *
 *   const sheetRef = useRef(null);
 *
 *   // open from anywhere (e.g. after a successful scan)
 *   sheetRef.current?.expand();
 *   sheetRef.current?.collapse();   // shrink to peek height
 *   sheetRef.current?.close();      // hide entirely
 *
 *   <AppSheetModal ref={sheetRef} title="Scanned Pallets (3)">
 *     <MyContent />
 *   </AppSheetModal>
 *
 *
 * Pattern B — Self-controlled (sheet manages its own open/close via a badge button):
 * Used by: FabWHentry, FabWHexit (tap the handle pill to expand)
 *
 *   <AppSheetModal
 *     title="Scanned Fabric Entry"
 *     snapPoints={['12%', '50%', '90%']}
 *     initialIndex={0}             // starts peeking (12%)
 *   >
 *     <TableContent data={items} />
 *   </AppSheetModal>
 *
 *
 * ─── PROPS ───────────────────────────────────────────────────────────────────
 *
 * @prop {string}   title            — shown in the sheet handle bar
 * @prop {number}   [badge]          — optional count badge next to title (e.g. scanned items)
 * @prop {string[]} [snapPoints]     — default ['15%', '50%', '92%']
 * @prop {number}   [initialIndex]   — which snap point to open at. -1 = hidden
 * @prop {boolean}  [showBackdrop]   — dim background when open (default true)
 * @prop {Function} [onClose]        — called when user swipes/closes sheet
 * @prop {React.ReactNode} children  — the inner content (table, list, cards)
 */

import React, { forwardRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet';
import { Colors } from '../../constants/colors';
import { FontSize, Radius, Spacing, Shadows } from '../../constants/spacing';

// ─── Component ────────────────────────────────────────────────────────────────

const AppSheetModal = forwardRef(({
  title,
  badge,
  snapPoints: snapPointsProp,
  initialIndex = -1,
  showBackdrop = true,
  onClose,
  scrollable = true,
  children,
}, ref) => {

  // Memoised snap points — required by @gorhom/bottom-sheet
  const snapPoints = useMemo(
    () => snapPointsProp ?? ['15%', '50%', '92%'],
    [snapPointsProp]
  );

  // ── Backdrop ───────────────────────────────────────────────────────────────
  const renderBackdrop = useCallback(
    (props) => showBackdrop ? (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={1}       // backdrop fades in at second snap point
        disappearsOnIndex={0}    // backdrop fades out at peek (first snap point)
        pressBehavior="collapse" // tap backdrop → collapse to peek, not close
      />
    ) : null,
    [showBackdrop]
  );

  // ── Handle ─────────────────────────────────────────────────────────────────
  const renderHandle = useCallback(() => (
    <View style={styles.handleContainer}>
      <View style={styles.handlePill} />
      <View style={styles.handleContent}>
        <Text style={styles.handleTitle} numberOfLines={1}>{title}</Text>
        {badge != null && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
    </View>
  ), [title, badge]);

  // ── Content wrapper ────────────────────────────────────────────────────────
  // scrollable=true  → BottomSheetScrollView (rack lists, fabric cards)
  // scrollable=false → BottomSheetView (fixed-height table with own FlatList)

  return (
    <BottomSheet
      ref={ref}
      index={initialIndex}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      // minSnapIndex={0}
      onClose={onClose}
      backdropComponent={renderBackdrop}
      handleComponent={renderHandle}
      backgroundStyle={styles.sheetBackground}
      style={styles.sheet}
      enableDynamicSizing={false}
      animateOnMount
    >
      {/* scrollable=true  → BottomSheetScrollView  (cards, detail lists)
           scrollable=false → raw children direct child of BottomSheet
                              use this when passing BottomSheetFlatList yourself */}
      {scrollable ? (
        <BottomSheetScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </BottomSheetScrollView>
      ) : (
        children
      )}
    </BottomSheet>
  );
});

AppSheetModal.displayName = 'AppSheetModal';

export { BottomSheetFlatList };
export default AppSheetModal;

const styles = StyleSheet.create({
  sheet: {  ...Shadows.bottomSheet,
    // Replaces the old: shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation
},
  sheetBackground: {  backgroundColor: Colors.white,  borderTopLeftRadius: Radius.xxl,  borderTopRightRadius: Radius.xxl,},
  // ── Handle ─────────────────────────────────────────────────────────────────
  handleContainer: { alignItems: 'center', paddingTop: Spacing.sm, paddingBottom: Spacing.sm, paddingHorizontal: Spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.borderLight, backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, },
  handlePill: { width: 40, height: 5, borderRadius: Radius.handleBar, backgroundColor: Colors.handleBar, marginBottom: Spacing.xs, },
  handleContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, },
  handleTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textMuted, },

  // ── Badge ──────────────────────────────────────────────────────────────────
  badge: { backgroundColor: Colors.primary, borderRadius: Radius.badge, paddingHorizontal: Spacing.sm, paddingVertical: 2, minWidth: 22, alignItems: 'center', },
  badgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: '700', },

  // ── Content ────────────────────────────────────────────────────────────────
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl, },
  viewContent: { flex: 1 },
});