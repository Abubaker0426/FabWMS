// import React from 'react';
// import { ActivityIndicator, StatusBar, View } from 'react-native';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import Toast from 'react-native-toast-message';
// import { AuthProvider, useAuth } from './src/context/AuthContext';
// import { ScannerProvider } from './src/context/ScannerContext';
// import AppNavigator from './src/navigations/AppNavigator';
// import { toastConfig } from './src/constants/toastConfig';

// function AppContent() {
//   const { isAuthenticated, isLoading } = useAuth();

//   if (isLoading || !isAuthenticated) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" color="#043887" />
//       </View>
//     );
//   }

//   return (
//     <ScannerProvider>
//       <AppNavigator />
//       <Toast config={toastConfig} />
//     </ScannerProvider>
//   );
// }

// export default function App() {
//   return (
//     <>
//       <StatusBar barStyle="light-content" backgroundColor="#000000" />
//       <GestureHandlerRootView style={{ flex: 1 }}>
//         <SafeAreaProvider>
//           <AuthProvider>
//             <AppContent />
//           </AuthProvider>
//         </SafeAreaProvider>
//       </GestureHandlerRootView>
//     </>
//   );
// }





import React from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ScannerProvider } from './src/context/ScannerContext';
import AppNavigator from './src/navigations/AppNavigator';
import { toastConfig } from './src/constants/toastConfig';

// function AppContent() {
//   const { isAuthenticated, isLoading } = useAuth();

//   if (isLoading || !isAuthenticated) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" color="#043887" />
//       </View>
//     );
//   }

//   return (
//     <ScannerProvider>
//       <AppNavigator />
//       <Toast config={toastConfig} />
//     </ScannerProvider>
//   );
// }

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          {/* <AuthProvider> */}
          <ScannerProvider>
            <AppNavigator />
          </ScannerProvider>
          {/* </AuthProvider> */}

        </SafeAreaProvider>
      </GestureHandlerRootView>
    </>
  );
}
