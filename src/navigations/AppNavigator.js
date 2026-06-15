import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import PalletScreen from '../screens/Pallet/PalletScreen';
import FabricScreen from '../screens/Fabric/FabricScreen';
import PalletRack from '../screens/Racks/PalletRack/PalletRack';
import FabRack from '../screens/Racks/FabRack/FabRack';
import FabWHentry from '../screens/Fabric/FabWHentry';
import FabRackExit from '../screens/Racks/FabRack/FabRackExit';
import PalletDetails from '../screens/Details/PalletDetails';
import FabDetails from '../screens/Details/FabDetails';
import FabWHexit from '../screens/Fabric/FabWHexit';
import FabRackEntery from '../screens/Racks/FabRack/FabRackEntry';
import PalletRackEntry from '../screens/Racks/PalletRack/PalletRackEntry';
import PalletRackExit from '../screens/Racks/PalletRack/PalletRackExit';
import PalletWHentry from '../screens/Pallet/PalletWHentry';
import PalletWHexit from '../screens/Pallet/PalletWHexit';

const Stack = createStackNavigator();

export default function AppNavigator({ navigation }) {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Pallet" component={PalletScreen} />
        <Stack.Screen name="Fabric" component={FabricScreen} />
        <Stack.Screen name="PalletRack" component={PalletRack} />
        <Stack.Screen name="FabRack" component={FabRack} />
        {/* ---------------- where-house-entry-exit-screens ---------------- */}
        <Stack.Screen name="PalletWHentry" component={PalletWHentry} />
        <Stack.Screen name="PalletWHexit" component={PalletWHexit} />
        <Stack.Screen name="FabWHentry" component={FabWHentry} />
        <Stack.Screen name="FabWHexit" component={FabWHexit} />
        {/* -------------------Rack-enrty-exit-screen-------------- */}
        <Stack.Screen name="PalletRackEntry" component={PalletRackEntry} />
        <Stack.Screen name="PalletRackExit" component={PalletRackExit} />

        <Stack.Screen name="FabRackEntry" component={FabRackEntery} />
        <Stack.Screen name="FabRackExit" component={FabRackExit} />
        {/* --------------------  Dearail screeen---------------------- */}
        <Stack.Screen name="PalletDetails" component={PalletDetails} />
        <Stack.Screen name="FabDetails" component={FabDetails} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}