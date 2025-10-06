import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MainStackParamList } from './types';
import ProjectsListScreen from '../screens/ProjectsListScreen';
import ProjectDashboardScreen from '../screens/ProjectDashboardScreen';
import ProjectFormScreen from '../screens/ProjectFormScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="ProjectsList" component={ProjectsListScreen} />
      <Stack.Screen name="ProjectDashboard" component={ProjectDashboardScreen} />
      <Stack.Screen
        name="ProjectForm"
        component={ProjectFormScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}
