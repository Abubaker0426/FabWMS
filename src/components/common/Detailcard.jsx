import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize, Spacing, Radius, Shadows } from '../../constants/spacing';
const DetailCard = ({ fields = [] }) => (
  <View style={styles.card}>
    {fields.map(({ label, value }, i) => (
      <Text key={i} style={styles.label}>
        {label}:{' '}
        <Text style={styles.value}>{value ?? 'N/A'}</Text>
      </Text>
    ))}
  </View>
);
export default DetailCard;
const styles = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: Radius.card, marginBottom: Spacing.cardMarginBottom, padding: Spacing.cardPadding, borderWidth: 1, borderColor: Colors.borderCard, ...Shadows.card, },
  label: { fontSize: FontSize.label, color: Colors.textSecondary, fontWeight: '500', marginBottom: Spacing.sm, lineHeight: 20, },
  value: { fontSize: FontSize.label, color: Colors.textPrimary, fontWeight: '400', },
});