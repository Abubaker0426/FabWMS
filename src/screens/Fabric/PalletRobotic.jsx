import { StyleSheet, View } from 'react-native'
import React from 'react'
import { useScanner } from '../../context/ScannerContext';
import CustomHeader from '../../components/CustomHeader'
import { FontSize, Spacing } from '../../constants/spacing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScannerScreen from '../../components/Scanner/ScannerScreen';

const PalletRobotic = () => {
  const insets = useSafeAreaInsets();
  const { scannerType } = useScanner();

  const onScanSuccess = (result) => {
    // handleScannedData(result);
    // sheetRef.current?.snapToIndex(1); // expand to 50% after scan
    console.log("Scanned Result:", result);
  };
  return (
    <View style={[styles.container,]}>
      {/*  { paddingTop: insets.top }*/}
      <CustomHeader title="Pallet Robotic  Entry" showBackButton />
      <View style={styles.body}>
        <ScannerScreen scannerType={scannerType} onScanSuccess={onScanSuccess} />
      </View>
    </View>
  )
}

export default PalletRobotic

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  body: { flex: 1 },
})