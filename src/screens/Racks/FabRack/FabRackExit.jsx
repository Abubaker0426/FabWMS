import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScannerScreen from '../../../components/Scanner/ScannerScreen';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import ScanCountBar from '../../../components/common/ScanCountBar';
import CustomHeader from '../../../components/CustomHeader';
import { useScanner } from '../../../context/ScannerContext';
import { useWarehouseFlow } from '../../../hooks/useWarehouseFlow';
import { putFabricToRack } from '../../../api/apiService';
import { Colors, } from '../../../constants/colors';
import { Spacing } from '../../../constants/spacing';

const FabRackExit = () => {
  const { scannerType } = useScanner();
  const insets = useSafeAreaInsets();

  const { isLoading, totalCount, lastScanned, handleScannedData } = useWarehouseFlow({
    apiFn:          (barcode) => putFabricToRack(barcode),
    buildItem:      (barcode) => ({ barcode }),
    successMessage: (barcode) => `Fabric ${barcode} removed from rack`,
    errorParser: (error) => {
      if (error.message?.includes('not valid'))       return 'Invalid fabric barcode.';
      if (error.message?.includes('not been scanned'))return 'Fabric not scanned into warehouse.';
      if (error.message?.includes('does not belong')) return 'Fabric not assigned to any rack.';
      return error.message;
    },
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CustomHeader title="Remove Fabric From Rack" showBackButton />
      <View style={styles.body}>
        {isLoading
          ? <LoadingOverlay visible inline label={`Processing ${lastScanned || 'barcode'}...`} />
          : <ScannerScreen scannerType={scannerType} onScanSuccess={handleScannedData} />}
        <ScanCountBar lastScanned={lastScanned} count={totalCount} label="fabrics removed" />
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  body:      { flex: 1, paddingHorizontal: Spacing.screenPaddingHorizontal, paddingTop: Spacing.lg },
});
export default FabRackExit;