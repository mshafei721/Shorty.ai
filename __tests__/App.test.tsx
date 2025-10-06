import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../App';
import * as schema from '../src/storage/schema';

jest.mock('../src/navigation/RootNavigator', () => ({
  RootNavigator: () => {
    const { View, Text } = require('react-native');
    return (
      <View testID="root-navigator">
        <Text>Navigation Ready</Text>
      </View>
    );
  },
}));

describe('App', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    jest.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId('app-loading')).toBeTruthy();
  });

  it('initializes schema and renders navigation', async () => {
    const { getByTestId, queryByTestId } = render(<App />);

    await waitFor(() => {
      expect(queryByTestId('app-loading')).toBeNull();
    });

    expect(getByTestId('root-navigator')).toBeTruthy();
  });

  it('handles initialization errors gracefully and shows error UI', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(schema, 'initializeSchema').mockRejectedValueOnce(new Error('Init failed'));

    const { getByText, queryByTestId } = render(<App />);

    await waitFor(() => {
      expect(queryByTestId('app-loading')).toBeNull();
    });

    expect(consoleSpy).toHaveBeenCalledWith('App initialization failed:', expect.any(Error));
    expect(getByText('Storage Error')).toBeTruthy();
    expect(getByText('Init failed')).toBeTruthy();
  });
});
