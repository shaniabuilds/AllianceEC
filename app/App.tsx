import React from 'react';
import './global.css';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './screens/AuthScreen';
import { StudentHomeScreen } from './screens/StudentHomeScreen';

function MainNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return isAuthenticated ? <StudentHomeScreen /> : <AuthScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
        <StatusBar barStyle="light-content" />
        <AuthProvider>
          <MainNavigator />
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
