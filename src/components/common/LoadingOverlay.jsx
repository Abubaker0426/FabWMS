import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize, Spacing } from '../../constants/spacing';
const LoadingOverlay = ({
  visible = false,
  label = 'Processing...',
  inline = false,
}) => {
  if (!visible) return null;
  // ── Inline variant (FabRackExit, PalletRackExit pattern) ──────────────────
  if (inline) {
    return (
      <View style={styles.inlineContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.inlineLabel}>{label}</Text>
      </View>
    );
  }
  // ── Full-screen blocking overlay (RackEntry, WHentry pattern) ─────────────
  return (
    <View style={styles.overlay}>
      <View style={styles.pill}>
        <ActivityIndicator size="small" color={Colors.white} />
        <Text style={styles.overlayLabel}>{label}</Text>
      </View>
    </View>
  );
};
export default LoadingOverlay;
const styles = StyleSheet.create({
  // ── Full-screen overlay ───────────────────────────────────────────────────
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlayDark, justifyContent: 'center', alignItems: 'center', zIndex: 999, },
  pill: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: 'rgba(0,0,0,0.75)', paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, borderRadius: 30, },
  overlayLabel: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '600', },

  // ── Inline variant ────────────────────────────────────────────────────────
  inlineContainer: {
    height: 300,   // matches scanner height so layout doesn't jump
    justifyContent: 'center', alignItems: 'center', gap: Spacing.lg,
  },
  inlineLabel: { fontSize: FontSize.lg, color: Colors.textMuted, },
});