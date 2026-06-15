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
import { fetchRackFabricDetails } from '../../api/apiService';
import { Colors } from '../../constants/colors';
import { FontSize, Spacing } from '../../constants/spacing';
import Toast from 'react-native-toast-message';
import { ToastDefaults } from '../../constants/toastConfig';

const FabDetails = () => {
  const { scannerType } = useScanner();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef(null);

  const { execute, isLoading, isDuplicate, markSeen } = useApiCall();

  const [fabricData, setFabricData] = React.useState([]);

  const handleScanSuccess = async (scanResult) => {
    const code = scanResult?.data;
    if (!code || isLoading) return;

    if (isDuplicate(code)) return;

    await execute(() => fetchRackFabricDetails(code), {
      onSuccess: (response) => {
        if (!response || response.length === 0) {
          Toast.show({ ...ToastDefaults, type: 'error', text1: 'No data found', text2: 'No fabric data found for this barcode.' });
          return;
        }

        markSeen(code);
        const now = Date.now();

        const enriched = response.map((item, idx) => {
          const totalMeters = item.fabricBarcodeDetails?.reduce(
            (sum, f) => sum + parseFloat(f.fabricLength || 0), 0
          ) ?? 0;
          return {
            ...item,
            totalMeters: totalMeters.toFixed(2),
            scannedCode: code,
            scanId: `${code}-${now}-${idx}`,
          };
        });

        setFabricData(prev => [...prev, ...enriched]);
        sheetRef.current?.snapToIndex(1);
      },
      errorMessage: 'Invalid barcode or network error',
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CustomHeader title="Fabric Details" showBackButton />

      <View style={styles.body}>
        <ScannerScreen
          scannerType={scannerType}
          onScanSuccess={handleScanSuccess}
        />
        <LoadingOverlay visible={isLoading} />
      </View>

      <AppSheetModal
        ref={sheetRef}
        title="Fabric Details"
        badge={fabricData.length}
        snapPoints={['12%', '50%', '92%']}
        initialIndex={0}
      >
        {fabricData.length === 0
          ? <Text style={styles.emptyText}>Scan a rack barcode to view fabric details.</Text>
          : fabricData.map(item => (
              <DetailCard
                key={item.scanId}
                fields={[
                  { label: 'Rack Name',          value: item.scannedCode },
                  { label: 'PO Number',          value: item.poNumber },
                  { label: 'Invoice Number',     value: item.invoiceNumber },
                  { label: 'Item Code',          value: item.itemCode },
                  { label: 'Fabric Description', value: item.itemDescription },
                  { label: 'Total Meters',       value: item.totalMeters },
                  { label: 'No of Rolls',        value: item.fabricBarcodeDetails?.length ?? 0 },
                ]}
              />
            ))}
      </AppSheetModal>
    </View>
  );
};
export default FabDetails;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  body:       { flex: 1 },
  emptyText:  { textAlign: 'center', padding: Spacing.xl, color: Colors.textFaint, fontSize: FontSize.lg },
});