import { ScrollView, View, StyleSheet } from 'react-native';
import CustomHeader from '../../components/CustomHeader';
import CustomRadioButton from '../../components/CustomRadioButton';
import CustomButton from '../../components/CustomButton';
import { useScanner } from '../../context/ScannerContext';

const PalletScreen = ({ navigation }) => {
  const { scannerType, setScannerType } = useScanner();
  const radioOptions = [
    { label: 'External Scanner', value: 'External Scanner' },
    { label: 'Camera Scanner', value: 'Camera Scanner' },
  ];
  return (
    <ScrollView>
   {/* custom header */}
      <CustomHeader
        title="Pallet"
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
          BtnText="WAREHOUSE ENTRY"
          onPress={() => navigation.navigate('PalletWHentry')}
        />

        <CustomButton
          BtnText="RACK"
          onPress={() => navigation.navigate('PalletRack')}
        />

        <CustomButton
          BtnText="WAREHOUSE EXIT"
          onPress={() => navigation.navigate('PalletWHexit')}
        />
      </View>
    </ScrollView>
  );
};

export default PalletScreen;

const styles = StyleSheet.create({
  radiobtn: {
    alignItems: 'center',
    marginTop: 10,
  },
  butcoint: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 200,
  },
});

