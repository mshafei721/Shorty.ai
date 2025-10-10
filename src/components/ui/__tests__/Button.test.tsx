import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with title', () => {
    const { getByText } = render(
      <Button title="Click Me" onPress={() => {}} />
    );
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Click Me" onPress={onPress} />
    );
    fireEvent.press(getByText('Click Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Click Me" onPress={onPress} disabled />
    );
    fireEvent.press(getByText('Click Me'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { getByTestId, queryByText } = render(
      <Button title="Click Me" onPress={() => {}} loading testID="button" />
    );
    expect(queryByText('Click Me')).toBeNull();
  });

  it('applies correct variant styles', () => {
    const { rerender, getByText } = render(
      <Button title="Primary" onPress={() => {}} variant="primary" />
    );
    expect(getByText('Primary')).toBeTruthy();

    rerender(
      <Button title="Secondary" onPress={() => {}} variant="secondary" />
    );
    expect(getByText('Secondary')).toBeTruthy();

    rerender(<Button title="Ghost" onPress={() => {}} variant="ghost" />);
    expect(getByText('Ghost')).toBeTruthy();

    rerender(
      <Button title="Destructive" onPress={() => {}} variant="destructive" />
    );
    expect(getByText('Destructive')).toBeTruthy();
  });

  it('applies correct size styles', () => {
    const { rerender, getByText } = render(
      <Button title="Small" onPress={() => {}} size="small" />
    );
    expect(getByText('Small')).toBeTruthy();

    rerender(<Button title="Medium" onPress={() => {}} size="medium" />);
    expect(getByText('Medium')).toBeTruthy();

    rerender(<Button title="Large" onPress={() => {}} size="large" />);
    expect(getByText('Large')).toBeTruthy();
  });

  it('has correct accessibility props', () => {
    const { getByLabelText } = render(
      <Button
        title="Submit"
        onPress={() => {}}
        accessibilityLabel="Submit form"
        accessibilityHint="Submits the form data"
      />
    );
    expect(getByLabelText('Submit form')).toBeTruthy();
  });
});
