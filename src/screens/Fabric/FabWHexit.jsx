import { useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { putFabricData } from '../../api/apiService';
import AppSheetModal from '../../components/common/AppSheetModal';
import CustomHeader from '../../components/CustomHeader';
import ScannerScreen from '../../components/Scanner/ScannerScreen';
import { Colors } from '../../constants/colors';
import { FontSize, Spacing } from '../../constants/spacing';
import { useScanner } from '../../context/ScannerContext';
import { useWarehouseFlow } from '../../hooks/useWarehouseFlow';

const HEADERS = ['PO No', 'Rolls', 'Meters', 'Invoice'];

const FabWHexit = () => {
  const { scannerType } = useScanner();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef(null);

  const { items, totalCount, handleScannedData } = useWarehouseFlow({
    apiFn:     (barcode) => putFabricData(barcode),
    buildItem: (barcode, res) => ({
      id:            barcode,
      poNumber:      res.poNumber      ?? 'N/A',
      rollCount:     parseInt(res.rollCount   ?? '1'),
      meters:        parseFloat(res.fabricLength ?? '0'),
      invoiceNumber: res.invoiceNumber ?? 'N/A',
    }),
    mergeItem: (existing, item) => ({
      ...existing,
      rollCount: existing.rollCount + item.rollCount,
      meters:    existing.meters    + item.meters,
      id:        `${existing.id},${item.id}`,
    }),
    mergeKey: (item) => `${item.poNumber}|${item.invoiceNumber}`,
  });

  const onScanSuccess = (result) => {
    handleScannedData(result);
    sheetRef.current?.snapToIndex(1);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CustomHeader title="Fabric Warehouse Exit" showBackButton />
      <View style={styles.body}>
        <ScannerScreen scannerType={scannerType} onScanSuccess={onScanSuccess} />
      </View>

      <AppSheetModal
        ref={sheetRef}
        title="Scanned Fabric Exit"
        badge={totalCount}
        snapPoints={['12%', '50%', '90%']}
        initialIndex={0}
        scrollable={false}
      >
        <View style={styles.tableHeader}>
          {HEADERS.map(h => <Text key={h} style={styles.headerCell}>{h}</Text>)}
        </View>
        <FlatList
          data={items}
          keyExtractor={(item, i) => `${item.poNumber}-${i}`}
          renderItem={({ item }) => (
            <View style={styles.tableRow}>
              <Text style={styles.cell}>{item.poNumber}</Text>
              <Text style={styles.cell}>{item.rollCount}</Text>
              {/* <Text style={styles.cell}>{item.meters.toFixed(2)}</Text> */}
              <Text style={styles.cell}>{(item.meters ?? 0).toFixed(2)}</Text>
              <Text style={styles.cell}>{item.invoiceNumber}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No scanned items yet</Text>}
        />
      </AppSheetModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.white },
  body:        { flex: 1 },
  tableHeader: { flexDirection: 'row', backgroundColor: Colors.tableHeader, paddingVertical: Spacing.tableHeaderPaddingVertical, paddingHorizontal: Spacing.sm },
  headerCell:  { flex: 1, fontWeight: 'bold', fontSize: FontSize.tableHeader, textAlign: 'center' },
  tableRow:    { flexDirection: 'row', paddingVertical: Spacing.tableRowPaddingVertical, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: Spacing.sm },
  cell:        { flex: 1, fontSize: FontSize.tableCell, textAlign: 'center' },
  empty:       { textAlign: 'center', padding: Spacing.xl, color: Colors.textFaint, fontSize: FontSize.lg },
});

export default FabWHexit;