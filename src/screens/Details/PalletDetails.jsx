import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScannerScreen from '../../components/Scanner/ScannerScreen';
import AppSheetModal from '../../components/common/AppSheetModal';
import DetailCard from '../../components/common/Detailcard';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import CustomHeader from '../../components/CustomHeader';
import { useScanner } from '../../context/ScannerContext';
import { useApiCall } from '../../hooks/useApiCall';
import { fetchPalletRackDetails } from '../../api/apiService';
import { Colors } from '../../constants/colors';
import { FontSize, Spacing, Radius, Shadows } from '../../constants/spacing';
import Toast from 'react-native-toast-message';
import { ToastDefaults } from '../../constants/toastConfig';

const PalletDetails = () => {
  const { scannerType } = useScanner();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef(null);

  const [palletData, setPalletData] = React.useState([]);
  const seenCodes = React.useRef(new Set());

const { execute, isLoading, isDuplicate, markSeen } = useApiCall();

const handleScanSuccess = async (scanResult) => {
  const code = scanResult?.data;
  if (!code || isLoading) return;
  
  // Use the hook's duplicate checker
  if (isDuplicate(code)) return;
  
  await execute(() => fetchPalletRackDetails(code), {
    onSuccess: (response) => {
      if (!response || response.length === 0) {
        Toast.show({ ...ToastDefaults, type: 'error', text1: 'No data found' });
        return;
      }
      
      // Mark as seen using the hook
      markSeen(code);
      
      const now = Date.now();
      const enriched = response.map((item, idx) => ({
        ...item,
        scannedCode: code,
        scanId: `${code}-${now}-${idx}`,
      }));
      
      setPalletData(prev => [...prev, ...enriched]);
      sheetRef.current?.snapToIndex(1);
    },
    errorMessage: 'Invalid barcode or network error',
  });
};
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CustomHeader title="Pallet Details" showBackButton />

      <View style={styles.body}>
        <ScannerScreen
          scannerType={scannerType}
          onScanSuccess={handleScanSuccess}
        />
        <LoadingOverlay visible={isLoading} />
      </View>

      <AppSheetModal
        ref={sheetRef}
        title="Pallet Details"
        badge={palletData.length}
        snapPoints={['12%', '50%', '92%']}
        initialIndex={0}
      >
        {palletData.length === 0
          ? <Text style={styles.emptyText}>Scan a rack barcode to view pallet details.</Text>
          : palletData.map(item => (
              <DetailCard
                key={item.scanId}
                fields={[
                  { label: 'Rack Barcode',       value: item.scannedCode },
                  { label: 'Pallet Barcode',     value: item.barcode },
                  { label: 'Article Number',     value: item.articleNumber },
                  { label: 'Supplier Code',      value: item.supplierCode },
                  { label: 'Number of Pieces',   value: item.numberOfPieces },
                  { label: 'Date of Manufacture',value: item.dateOfManufacture },
                ]}
              />
            ))}
      </AppSheetModal>
    </View>
  );
};

export default PalletDetails;
const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: Colors.white },
  body:               {flex: 1 },
  viewButton:         { backgroundColor: Colors.action, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.lg, ...Shadows.button },
  viewButtonDisabled: { backgroundColor: Colors.disabledButton },
  viewButtonText:     { color: Colors.white, fontSize: FontSize.lg, fontWeight: 'bold' },
  emptyText:          { textAlign: 'center', padding: Spacing.xl, color: Colors.textFaint, fontSize: FontSize.lg },
});