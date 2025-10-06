import AsyncStorage from '@react-native-async-storage/async-storage';
import { getInitialRoute } from '../../src/navigation/RootNavigator';

describe('Navigation Guards', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('redirects to Onboarding if not completed', async () => {
    const route = await getInitialRoute();
    expect(route).toBe('Onboarding');
  });

  it('redirects to Main if onboarding completed', async () => {
    await AsyncStorage.setItem(
      'userProfile',
      JSON.stringify({ niche: 'Healthcare', onboarded: true })
    );

    const route = await getInitialRoute();
    expect(route).toBe('Main');
  });

  it('redirects to Onboarding if userProfile exists but onboarded is false', async () => {
    await AsyncStorage.setItem(
      'userProfile',
      JSON.stringify({ niche: 'Healthcare', onboarded: false })
    );

    const route = await getInitialRoute();
    expect(route).toBe('Onboarding');
  });

  it('handles corrupted userProfile gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await AsyncStorage.setItem('userProfile', 'invalid-json');

    const route = await getInitialRoute();
    expect(route).toBe('Onboarding');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('redirects to Onboarding if userProfile is empty object', async () => {
    await AsyncStorage.setItem('userProfile', JSON.stringify({}));

    const route = await getInitialRoute();
    expect(route).toBe('Onboarding');
  });

  it('handles AsyncStorage errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Storage error'));

    const route = await getInitialRoute();
    expect(route).toBe('Onboarding');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
