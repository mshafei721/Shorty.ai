import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import OnboardingStack from './OnboardingStack';
import MainStack from './MainStack';
import { getStorageItem } from '../storage';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const userProfile = await getStorageItem('userProfile');
      setIsOnboarded(userProfile !== null);
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      setIsOnboarded(false);
    }
  };

  if (isOnboarded === null) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isOnboarded ? (
        <Stack.Screen name="Main" component={MainStack} />
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingStack} />
      )}
    </Stack.Navigator>
  );
}
