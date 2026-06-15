import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize, Spacing } from '../../constants/spacing';
const ScanCountBar = ({ lastScanned, count, label = 'items processed' }) => (
  <View style={styles.container}>
    {lastScanned ? (
      <Text style={styles.lastScanned}>Last scanned: {lastScanned}</Text>
    ) : null}
    <Text style={styles.count}>
      Total {label}: <Text style={styles.countNum}>{count}</Text>
    </Text>
  </View>
);
export default ScanCountBar;
const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.xs, },
  lastScanned: { fontSize: FontSize.caption, color: Colors.textFaint, fontStyle: 'italic', },
  count: { fontSize: FontSize.lg, color: Colors.textPrimary, fontWeight: '500', },
  countNum: { fontWeight: 'bold', color: Colors.primary, },
});