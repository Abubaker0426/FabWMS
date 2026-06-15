import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';

const CustomButton = ({ BtnText, onPress }) => {
  return (
    <>
      <TouchableOpacity
        style={styles.Btn}
        onPress={onPress}
      >
        <Text style={styles.BtnText}>{BtnText}</Text>
      </TouchableOpacity>
    </>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  Btn: {
    width: 180,
    height: 50,
    backgroundColor: '#1E90FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  BtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 