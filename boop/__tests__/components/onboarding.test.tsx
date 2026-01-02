/**
 * P0 Tests for Onboarding Flow
 * 
 * Tests:
 * 2. First-time Onboarding - New user can complete onboarding (welcome → name → code)
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../lib/themeContext';
import WelcomeModal from '../../components/welcome-modal';
import NameInputModal from '../../components/name-input-modal';

// Mock services before importing
jest.mock('../../lib/deviceService', () => ({
  DeviceService: {
    getCurrentDevice: jest.fn(),
    getPairedDevice: jest.fn(),
    updateDeviceName: jest.fn(),
    registerDevice: jest.fn(),
    findDeviceByCode: jest.fn(),
    pairWithDevice: jest.fn(),
    sendBoop: jest.fn(),
    checkRateLimit: jest.fn(),
    disconnectFromPartner: jest.fn(),
    initialize: jest.fn(),
  },
}));

jest.mock('../../lib/pushNotificationService', () => ({
  PushNotificationService: {
    registerForPushNotifications: jest.fn(() => Promise.resolve('mock-token')),
    addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

import { DeviceService } from '@/lib/deviceService';

const mockDeviceService = DeviceService as jest.Mocked<typeof DeviceService>;

describe('Welcome Modal', () => {
  it('should display welcome message', () => {
    const onContinue = jest.fn();

    render(
      <ThemeProvider>
        <WelcomeModal visible={true} onContinue={onContinue} />
      </ThemeProvider>
    );

    const welcomeText = screen.getByText(/welcome to boop/i);
    expect(welcomeText).toBeTruthy();
  });

  it('should call onContinue when next/get started button is pressed', async () => {
    const onContinue = jest.fn();

    render(
      <ThemeProvider>
        <WelcomeModal visible={true} onContinue={onContinue} />
      </ThemeProvider>
    );

    // Wait for modal to fully render
    await waitFor(() => {
      const nextButton = screen.getByText(/next|get started/i);
      expect(nextButton).toBeTruthy();
    });

    // Click through all steps
    const nextButton = screen.getByText(/next/i);
    fireEvent.press(nextButton);

    // Click next again
    await waitFor(() => {
      const getStartedButton = screen.getByText(/get started/i);
      expect(getStartedButton).toBeTruthy();
    });

    const getStartedButton = screen.getByText(/get started/i);
    fireEvent.press(getStartedButton);

    expect(onContinue).toHaveBeenCalled();
  });
});

describe('Name Input Modal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeviceService.getCurrentDevice = jest.fn(() => ({
      deviceId: 'test-device-id',
      code: 'TEST01',
      name: null,
    }));
    mockDeviceService.updateDeviceName = jest.fn(() => Promise.resolve(true));
  });

  it('should display name input field', () => {
    render(<NameInputModal visible={true} onComplete={jest.fn()} />);

    const input = screen.getByPlaceholderText(/enter your name/i);
    expect(input).toBeTruthy();
  });

  it('should update device name and call onComplete', async () => {
    const onComplete = jest.fn();
    
    // Mock device as already registered
    mockDeviceService.getCurrentDevice = jest.fn(() => ({
      deviceId: 'test-device-id',
      code: 'TEST01',
      name: null,
    }));

    render(
      <ThemeProvider>
        <NameInputModal visible={true} onComplete={onComplete} />
      </ThemeProvider>
    );

    const input = screen.getByPlaceholderText(/enter your name/i);
    fireEvent.changeText(input, 'Test User');

    const submitButton = screen.getByText(/continue|get started|done/i);
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockDeviceService.updateDeviceName).toHaveBeenCalledWith('Test User');
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('Test User');
    });
  });

  it('should call onComplete after successful name update', async () => {
    const onComplete = jest.fn();
    
    mockDeviceService.getCurrentDevice = jest.fn(() => ({
      deviceId: 'test-device-id',
      code: 'TEST01',
      name: null,
    }));

    render(
      <ThemeProvider>
        <NameInputModal visible={true} onComplete={onComplete} />
      </ThemeProvider>
    );

    const input = screen.getByPlaceholderText(/enter your name/i);
    fireEvent.changeText(input, 'Test User');

    const submitButton = screen.getByText(/continue|get started|done/i);
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('Test User');
    });
  });

  it('should show error for empty name', async () => {
    mockDeviceService.getCurrentDevice = jest.fn(() => ({
      deviceId: 'test-device-id',
      code: 'TEST01',
      name: null,
    }));

    render(<NameInputModal visible={true} onComplete={jest.fn()} />);

    const submitButton = screen.getByText(/continue|get started|done/i);
    fireEvent.press(submitButton);

    await waitFor(() => {
      const errorText = screen.queryByText(/please enter your name/i);
      expect(errorText).toBeTruthy();
    });
  });
});

