import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchBarcodeDetails, postPalletToRack } from '../../../api/apiService';
import CustomHeader from '../../../components/CustomHeader';
import ScannerScreen from '../../../components/Scanner/ScannerScreen';
import AppSheetModal from '../../../components/common/AppSheetModal';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { Colors } from '../../../constants/colors';
import { FontSize, Radius, Spacing } from '../../../constants/spacing';
import { useScanner } from '../../../context/ScannerContext';
import { useRackScanning } from '../../../hooks/useRackScanning';

const PalletRackEntry = () => {
  const { scannerType } = useScanner();
  const sheetRef = useRef(null);

  const {
    isLoading, scannedRacks, totalItemCount,
    handleScannedData, handleScanError,
    toggleRackExpansion, deleteItem,
  } = useRackScanning({
    postToRackFn: (rack, pallet) => postPalletToRack(rack, pallet),
    fetchDetailsFn: fetchBarcodeDetails,
    itemType: 'pallet',
    itemLabel: 'pallet',
    buildItem: (barcode) => ({
      id: Date.now(), palletBarcode: barcode,
      timestamp: new Date().toLocaleTimeString(),
    }),
  });

  const onScanSuccess = (result) => {
    handleScannedData(result);
    sheetRef.current?.snapToIndex(0);
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Add Pallet To Rack" showBackButton />
      <ScannerScreen
        onScanSuccess={onScanSuccess}
        onScanError={handleScanError}
      />
      <LoadingOverlay visible={isLoading} />
      <AppSheetModal ref={sheetRef} title="Scanned Racks & Pallets" badge={totalItemCount}
        snapPoints={['15%', '55%', '92%']} initialIndex={0} scrollable={false}>
        <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetContent}>
          {scannedRacks.length === 0
            ? <Text style={styles.emptyText}>No racks scanned yet. Scan a rack to begin.</Text>
            : scannedRacks.map(rack => (
              <RackRow key={rack.id} rack={rack} onToggle={toggleRackExpansion}
                onDelete={(rId, iId) => deleteItem(rId, iId, 'palletBarcode')} />
            ))}
        </ScrollView>
      </AppSheetModal>
    </View>
  );
};

const RackRow = ({ rack, onToggle, onDelete }) => (
  <View style={styles.rackContainer}>
    <TouchableOpacity style={styles.rackHeader} onPress={() => onToggle(rack.id)}
      accessibilityRole="button" accessibilityLabel={`Toggle ${rack.rackName}`}>
      <View style={styles.rackHeaderContent}>
        <Text style={styles.rackName}>{rack.rackName}</Text>
        <Text style={styles.itemCount}>{rack.items.length} pallet{rack.items.length !== 1 ? 's' : ''}</Text>
        {rack.items.length === 0 && <Text style={styles.emptyRackIndicator}>⚠️ Empty</Text>}
      </View>
      <Ionicons name={rack.isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textPrimary} />
    </TouchableOpacity>
    {rack.isExpanded && (
      <View style={styles.itemsList}>
        {rack.items.length === 0
          ? <Text style={styles.emptyRackText}>Scan pallet barcodes to add items.</Text>
          : rack.items.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.palletBarcode}>{item.palletBarcode}</Text>
                <Text style={styles.timestamp}>Scanned: {item.timestamp}</Text>
              </View>
              <TouchableOpacity style={styles.deleteButton}
                onPress={() => onDelete(rack.id, item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={22} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  sheetScroll: { flex: 1 },
  sheetContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  emptyText: { textAlign: 'center', marginTop: Spacing.xxxl, color: Colors.textFaint },
  rackContainer: { marginVertical: Spacing.xs, backgroundColor: Colors.rackBackground, borderRadius: Radius.rackItem, overflow: 'hidden' },
  rackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.rackItemPadding, backgroundColor: Colors.rackHeader },
  rackHeaderContent: { flex: 1 },
  rackName: { fontSize: FontSize.rackName, fontWeight: 'bold' },
  itemCount: { fontSize: FontSize.itemCount, color: Colors.textMuted, marginTop: 2 },
  emptyRackIndicator: { fontSize: FontSize.itemCount, color: Colors.warning, marginTop: 2 },
  itemsList: { backgroundColor: Colors.white },
  emptyRackText: { textAlign: 'center', padding: Spacing.xl, color: Colors.textFaint, fontStyle: 'italic' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.rackItemPadding, borderBottomWidth: 1, borderBottomColor: Colors.borderFaint },
  itemInfo: { flex: 1 },
  palletBarcode: { fontSize: FontSize.md, fontWeight: 'bold', fontFamily: 'monospace' },
  timestamp: { fontSize: FontSize.timestamp, color: Colors.textMuted, marginTop: 4 },
  deleteButton: { padding: Spacing.deleteButtonPadding, backgroundColor: Colors.errorLight, borderRadius: Radius.xs },
});

export default PalletRackEntry;