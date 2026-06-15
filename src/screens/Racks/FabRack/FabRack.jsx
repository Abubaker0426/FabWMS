import { ScrollView, View, StyleSheet } from 'react-native';
import CustomHeader from '../../../components/CustomHeader';
import CustomRadioButton from '../../../components/CustomRadioButton';
import CustomButton from '../../../components/CustomButton';
import { useScanner } from '../../../context/ScannerContext';

const FabRack = ({ navigation }) => {
  const { scannerType, setScannerType } = useScanner();
  const radioOptions = [
    { label: 'External Scanner', value: 'External Scanner' },
    { label: 'Camera Scanner', value: 'Camera Scanner' },
  ];
  return (
    <ScrollView>
   
      <CustomHeader
        title="Fabric Rack"
        showBackButton={true}
        showSearchButton={true}
        onSearchPress={() => navigation.navigate('FabDetails')} 
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
          onPress={() => navigation.navigate('FabRackEntry')}
        />

        <CustomButton
          BtnText="BACK TO FABRIC"
          onPress={() => navigation.navigate('Fabric')}
        />

        <CustomButton
          BtnText="RACK EXIT"
          onPress={() => navigation.navigate('FabRackExit')}
        />
      </View>
    </ScrollView>
  );
};

export default FabRack;

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

