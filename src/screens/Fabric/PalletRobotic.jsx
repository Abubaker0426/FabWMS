import { StyleSheet, View } from 'react-native';
import React from 'react';
import { useScanner } from '../../context/ScannerContext';
import CustomHeader from '../../components/CustomHeader';
import ScannerScreen from '../../components/Scanner/ScannerScreen';
import { usePalletRobotic } from '../../hooks/usePallestRobotic';
import LoadingOverlay from '../../components/common/LoadingOverlay';

const PalletRobotic = () => {
  const { scannerType } = useScanner();
  const { isLoading, handleScannedData } = usePalletRobotic();

  return (
    <View style={styles.container}>
      <CustomHeader title="Pallet Robotic Entry" showBackButton />

      <View style={styles.body}>
        <ScannerScreen
          scannerType={scannerType}
          onScanSuccess={handleScannedData}
        />
      </View>

      {isLoading && <LoadingOverlay />}
    </View>
  );
};

export default PalletRobotic;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  body: { flex: 1 },
});
