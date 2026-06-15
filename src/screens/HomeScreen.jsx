import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomHeader from '../components/CustomHeader';
import CustomButton from '../components/CustomButton';
export default function HomeScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <CustomHeader title="FABWMS" showBackButton={false} />
            <View style={styles.butview}>
                <CustomButton BtnText="PALLET " onPress={() => { navigation.navigate('Pallet') }} />
                <CustomButton BtnText="FABRIC" onPress={() => navigation.navigate('Fabric')} />
            </View>
        </View>
    );
}
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ecf0f3', },
    butview: { display: "flex", flex: 1, alignItems: "center", justifyContent: "center", gap: 20, },
})


