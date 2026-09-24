import { StyleSheet, ScrollView, View } from 'react-native'
import React, { useState } from 'react'
import CustomHeader from '../../components/CustomHeader';
import CustomRadioButton from '../../components/CustomRadioButton';
import CustomButton from '../../components/CustomButton';
import { useScanner } from '../../context/ScannerContext';

const FabricScreen = ({ navigation }) => {
  const { scannerType, setScannerType } = useScanner();
  const radioOptions = [
    { label: 'External Scanner', value: 'External Scanner' },
    { label: 'Camera Scanner', value: 'Camera Scanner' },
  ];
  return (
    <ScrollView>
      <CustomHeader
        title="Fabric"
        showBackButton={true}
        showSearchButton={true}
        onSearchPress={() => navigation.navigate('FabDetails')} 
      />
      {/* radio button */}
      <View style={styles.radiobtn}>
        <CustomRadioButton
          options={radioOptions}
          //this scannerType is coming from the useContaxt component 
          // based on this  the camera and the external scanner will open okk
          selectedValue={scannerType}
          onValueChange={setScannerType}
          direction="row"
        />
      </View>
      <View style={styles.butcoint}>
        <CustomButton BtnText="WAREHOUSE ENTRY" onPress={() => navigation.navigate('FabWHentry')}
        />
        <CustomButton BtnText="RACK" onPress={() => navigation.navigate('FabRack')}
        />
        <CustomButton BtnText="WAREHOUSE EXIT" onPress={() => navigation.navigate('FabWHexit')}
        />
        <CustomButton BtnText="PALLET DETAILS" onPress={() => navigation.navigate('PalletRobotic')}
        />
      </View>
    </ScrollView>
  )
}
export default FabricScreen

const styles = StyleSheet.create({
  butcoint: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: 230
  },
  radiobtn:{
    marginTop: 10,
  }

})