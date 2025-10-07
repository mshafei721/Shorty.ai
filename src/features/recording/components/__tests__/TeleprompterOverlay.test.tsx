import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TeleprompterOverlay } from '../TeleprompterOverlay';

describe('TeleprompterOverlay', () => {
  const mockScript = 'This is a test script for the teleprompter. It has multiple words to test scrolling behavior.';

  const defaultProps = {
    scriptText: mockScript,
    isPlaying: false,
  };

  it('renders script text', () => {
    const { getByText } = render(<TeleprompterOverlay {...defaultProps} />);

    expect(getByText(mockScript)).toBeTruthy();
  });

  it('does not render when visible is false', () => {
    const { queryByText } = render(
      <TeleprompterOverlay {...defaultProps} visible={false} />
    );

    expect(queryByText(mockScript)).toBeNull();
  });

  it('does not render when scriptText is empty', () => {
    const { queryByText } = render(
      <TeleprompterOverlay {...defaultProps} scriptText="" />
    );

    expect(queryByText('Speed')).toBeNull();
  });

  it('displays default WPM value', () => {
    const { getByText } = render(<TeleprompterOverlay {...defaultProps} />);

    expect(getByText('140 WPM')).toBeTruthy();
  });

  it('displays custom WPM value', () => {
    const { getByText } = render(
      <TeleprompterOverlay {...defaultProps} wpm={180} />
    );

    expect(getByText('180 WPM')).toBeTruthy();
  });

  it('displays default font size', () => {
    const { getByText } = render(<TeleprompterOverlay {...defaultProps} />);

    expect(getByText('18pt')).toBeTruthy();
  });

  it('displays custom font size', () => {
    const { getByText } = render(
      <TeleprompterOverlay {...defaultProps} fontSize={24} />
    );

    expect(getByText('24pt')).toBeTruthy();
  });

  it('calls onWpmChange when increasing WPM', () => {
    const onWpmChange = jest.fn();
    const { getAllByText } = render(
      <TeleprompterOverlay {...defaultProps} wpm={140} onWpmChange={onWpmChange} />
    );

    const plusButtons = getAllByText('+');
    const wpmPlusButton = plusButtons[0]; // First + button is for WPM

    fireEvent.press(wpmPlusButton);

    expect(onWpmChange).toHaveBeenCalledWith(150);
  });

  it('calls onWpmChange when decreasing WPM', () => {
    const onWpmChange = jest.fn();
    const { getAllByText } = render(
      <TeleprompterOverlay {...defaultProps} wpm={140} onWpmChange={onWpmChange} />
    );

    const minusButtons = getAllByText('-');
    const wpmMinusButton = minusButtons[0]; // First - button is for WPM

    fireEvent.press(wpmMinusButton);

    expect(onWpmChange).toHaveBeenCalledWith(130);
  });

  it('does not decrease WPM below minimum', () => {
    const onWpmChange = jest.fn();
    const { getAllByText } = render(
      <TeleprompterOverlay {...defaultProps} wpm={60} onWpmChange={onWpmChange} />
    );

    const minusButtons = getAllByText('-');
    const wpmMinusButton = minusButtons[0];

    fireEvent.press(wpmMinusButton);

    expect(onWpmChange).not.toHaveBeenCalled();
  });

  it('does not increase WPM above maximum', () => {
    const onWpmChange = jest.fn();
    const { getAllByText } = render(
      <TeleprompterOverlay {...defaultProps} wpm={220} onWpmChange={onWpmChange} />
    );

    const plusButtons = getAllByText('+');
    const wpmPlusButton = plusButtons[0];

    fireEvent.press(wpmPlusButton);

    expect(onWpmChange).not.toHaveBeenCalled();
  });

  it('calls onFontSizeChange when increasing font size', () => {
    const onFontSizeChange = jest.fn();
    const { getAllByText } = render(
      <TeleprompterOverlay
        {...defaultProps}
        fontSize={18}
        onFontSizeChange={onFontSizeChange}
      />
    );

    const plusButtons = getAllByText('+');
    const fontPlusButton = plusButtons[1]; // Second + button is for font size

    fireEvent.press(fontPlusButton);

    expect(onFontSizeChange).toHaveBeenCalledWith(20);
  });

  it('calls onFontSizeChange when decreasing font size', () => {
    const onFontSizeChange = jest.fn();
    const { getAllByText } = render(
      <TeleprompterOverlay
        {...defaultProps}
        fontSize={18}
        onFontSizeChange={onFontSizeChange}
      />
    );

    const minusButtons = getAllByText('-');
    const fontMinusButton = minusButtons[1]; // Second - button is for font size

    fireEvent.press(fontMinusButton);

    expect(onFontSizeChange).toHaveBeenCalledWith(16);
  });

  it('does not decrease font size below minimum', () => {
    const onFontSizeChange = jest.fn();
    const { getAllByText } = render(
      <TeleprompterOverlay
        {...defaultProps}
        fontSize={12}
        onFontSizeChange={onFontSizeChange}
      />
    );

    const minusButtons = getAllByText('-');
    const fontMinusButton = minusButtons[1];

    fireEvent.press(fontMinusButton);

    expect(onFontSizeChange).not.toHaveBeenCalled();
  });

  it('does not increase font size above maximum', () => {
    const onFontSizeChange = jest.fn();
    const { getAllByText } = render(
      <TeleprompterOverlay
        {...defaultProps}
        fontSize={32}
        onFontSizeChange={onFontSizeChange}
      />
    );

    const plusButtons = getAllByText('+');
    const fontPlusButton = plusButtons[1];

    fireEvent.press(fontPlusButton);

    expect(onFontSizeChange).not.toHaveBeenCalled();
  });

  it('shows rewind button', () => {
    const { getByText } = render(<TeleprompterOverlay {...defaultProps} />);

    expect(getByText(/Rewind/)).toBeTruthy();
  });

  it('can hide controls', () => {
    const { getByText, queryByText } = render(
      <TeleprompterOverlay {...defaultProps} />
    );

    const hideButton = getByText('Hide Controls');
    fireEvent.press(hideButton);

    expect(queryByText('Speed')).toBeNull();
  });

  it('can show controls when hidden', () => {
    const { getByText, queryByText } = render(
      <TeleprompterOverlay {...defaultProps} />
    );

    // Hide controls
    const hideButton = getByText('Hide Controls');
    fireEvent.press(hideButton);

    expect(queryByText('Speed')).toBeNull();

    // Show controls
    const showButton = getByText('⚙️');
    fireEvent.press(showButton);

    expect(queryByText('Speed')).toBeTruthy();
  });

  it('applies custom font size to script text', () => {
    const { getByText } = render(
      <TeleprompterOverlay {...defaultProps} fontSize={24} />
    );

    const scriptElement = getByText(mockScript);
    expect(scriptElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fontSize: 24 }),
      ])
    );
  });

  it('shows controls by default', () => {
    const { getByText } = render(<TeleprompterOverlay {...defaultProps} />);

    expect(getByText('Speed')).toBeTruthy();
    expect(getByText('Size')).toBeTruthy();
  });
});
