import { ScrollView, View, StyleSheet } from 'react-native';
import CustomHeader from '../../../components/CustomHeader';
import CustomRadioButton from '../../../components/CustomRadioButton';
import CustomButton from '../../../components/CustomButton';
import { useScanner } from '../../../context/ScannerContext';

const PalletRack = ({ navigation }) => {
  const { scannerType, setScannerType } = useScanner();
  const radioOptions = [
    { label: 'External Scanner', value: 'External Scanner' },
    { label: 'Camera Scanner', value: 'Camera Scanner' },
  ];
  return (
    <ScrollView>
      <CustomHeader
        title="Pallet Rack"
        showBackButton={true}
        showSearchButton={true}
        onSearchPress={() => navigation.navigate('PalletDetails')}
      />
      <View style={styles.radiobtn}>
        <CustomRadioButton
          options={radioOptions}
          selectedValue={scannerType}
          onValueChange={setScannerType}
          direction="row"
        />
      </View>
      <View style={styles.butcoint}>
        <CustomButton
          BtnText="RACK ENTRY"
          onPress={() => navigation.navigate('PalletRackEntry')}
        />
        <CustomButton
          BtnText=" BACK TO PALLET"
          onPress={() => navigation.navigate('Pallet')}
        />
        <CustomButton
          BtnText="RACK EXIT"
          onPress={() => navigation.navigate('PalletRackExit')}
        />
      </View>
    </ScrollView>
  );
};
export default PalletRack;
const styles = StyleSheet.create({
  radiobtn: { alignItems: 'center', marginTop: 10, },
  butcoint: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 200, },
});

