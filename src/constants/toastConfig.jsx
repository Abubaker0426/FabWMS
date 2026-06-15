import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from './colors';
import { FontSize, Radius, Spacing } from './spacing';

// ─── Base toast component ─────────────────────────────────────────────────────

const ToastBase = ({ text1, text2, backgroundColor, borderColor }) => (
  <View style={[styles.container, { backgroundColor, borderLeftColor: borderColor }]}>
    {text1 ? <Text style={styles.title} numberOfLines={1}>{text1}</Text> : null}
    {text2 ? <Text style={styles.message} numberOfLines={2}>{text2}</Text> : null}
  </View>
);

// ─── Toast type configs ───────────────────────────────────────────────────────

export const toastConfig = {
  success: ({ text1, text2 }) => (
    <ToastBase
      text1={text1}
      text2={text2}
      backgroundColor={Colors.successLight}
      borderColor={Colors.success}
    />
  ),

  error: ({ text1, text2 }) => (
    <ToastBase
      text1={text1}
      text2={text2}
      backgroundColor={Colors.errorLight}
      borderColor={Colors.error}
    />
  ),

  info: ({ text1, text2 }) => (
    <ToastBase
      text1={text1}
      text2={text2}
      backgroundColor={Colors.primaryLight}
      borderColor={Colors.primary}
    />
  ),
};

// ─── Default toast options (apply when calling Toast.show) ────────────────────
// Use these as your defaults so every call is consistent:
//
  // Toast.show({
  //   ...ToastDefaults,
  //   type: 'success',
  //   text1: 'Done',
  // });

export const ToastDefaults = {
  visibilityTime: 2000,    // 2 seconds — matches your old setTimeout popups
  position: 'top',
  topOffset: 60,           // clears the header
};

const styles = StyleSheet.create({
  container: {  width: '90%',  borderRadius: Radius.md,  borderLeftWidth: 5,  paddingVertical: Spacing.md,  paddingHorizontal: Spacing.lg,  marginHorizontal: Spacing.lg,},
  title: {  fontSize: FontSize.md,  fontWeight: '600',  color: Colors.textPrimary,  marginBottom: 2,},
  message: {  fontSize: FontSize.sm,  color: Colors.textSecondary,  lineHeight: 18,},
});