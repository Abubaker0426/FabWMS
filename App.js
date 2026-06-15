import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AppNavigator from './src/navigations/AppNavigator';
import { ScannerProvider } from './src/context/ScannerContext';
import { toastConfig } from './src/constants/toastConfig';

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ScannerProvider>
            <AppNavigator />
            <Toast config={toastConfig} />
          </ScannerProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </>
  );
}
