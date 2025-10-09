/**
 * ScriptStudio Navigation Wrapper
 *
 * Wraps ScriptStudioScreen component to work with React Navigation
 */

import React from 'react';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../../navigation/RootNavigator';
import ScriptStudioScreen from './ScriptStudioScreen';
import type { Script } from '../../../storage/schema';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigationProps = StackNavigationProp<RootStackParamList, 'ScriptStudio'>;
type RouteProps = RouteProp<RootStackParamList, 'ScriptStudio'>;

export default function ScriptStudioWrapper() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProps>();
  const { projectId, niche, subNiche } = route.params;

  const handleSendToTeleprompter = async (script: Script) => {
    try {
      // Save script to AsyncStorage
      const scriptsJson = await AsyncStorage.getItem('scripts');
      const scripts = scriptsJson ? JSON.parse(scriptsJson) : [];
      scripts.push(script);
      await AsyncStorage.setItem('scripts', JSON.stringify(scripts));

      // Navigate to Record screen with scriptId
      navigation.navigate('Record', {
        scriptId: script.id,
        projectId: script.projectId,
      });
    } catch (error) {
      console.error('Failed to save script:', error);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <ScriptStudioScreen
      projectId={projectId}
      niche={niche}
      subNiche={subNiche}
      onSendToTeleprompter={handleSendToTeleprompter}
      onClose={handleClose}
    />
  );
}
