import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const RadioButton = ({ label, selected, onPress }) => (
  <TouchableOpacity style={styles.radioContainer} onPress={onPress}>
    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
      {selected && <View style={styles.radioInner} />}
    </View>
    <Text style={styles.radioLabel}>{label}</Text>
  </TouchableOpacity>
);

const CustomRadioButton = ({ options, selectedValue, onValueChange, direction = 'row' }) => {
  return (
    <View style={[styles.groupContainer, { flexDirection: direction }]}>
      {options.map((option) => (
        <RadioButton
          key={option.value}
          label={option.label}
          selected={selectedValue === option.value}
          onPress={() => onValueChange(option.value)}
        />
      ))}
    </View>
  );
};

export default CustomRadioButton;

const styles = StyleSheet.create({
  groupContainer: {
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
    gap: 15,
    flexWrap: 'wrap',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#004D99',
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  radioLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
});
