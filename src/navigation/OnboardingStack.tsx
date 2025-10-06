import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from './types';
import SplashScreen from '../screens/SplashScreen';
import NicheSelectionScreen from '../screens/NicheSelectionScreen';
import SubNicheConfirmationScreen from '../screens/SubNicheConfirmationScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="NicheSelection" component={NicheSelectionScreen} />
      <Stack.Screen name="SubNicheConfirmation" component={SubNicheConfirmationScreen} />
    </Stack.Navigator>
  );
}
