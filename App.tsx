// App.tsx
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
 import { AuthProvider } from './src/context/AuthContext'; // <<< Consider removing if Redux is sole auth source

import { Provider, useDispatch } from 'react-redux';
import { store } from './src/store/store';
import { restoreToken } from './src/store/slices/authSlice';
import { AppDispatch } from './src/store/store';

const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    console.log("AppContent: Dispatching restoreToken to Redux authSlice");
    dispatch(restoreToken());
  }, [dispatch]);

  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator /> 
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <AuthProvider>  
          <AppContent /> 
        </AuthProvider>
      </Provider>
    </SafeAreaProvider>
  );
}