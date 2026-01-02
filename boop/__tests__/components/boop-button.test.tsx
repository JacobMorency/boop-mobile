/**
 * P0 Tests for Boop Button
 * 
 * Tests:
 * 5. Send Boop (Paired) - User can send a boop when paired
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../lib/themeContext';
import BoopButton from '../../components/boop-button';

// Mock DeviceService before importing
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

import { DeviceService } from '../../lib/deviceService';

const mockDeviceService = DeviceService as jest.Mocked<typeof DeviceService>;

describe('Boop Button - Send Boop', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send boop successfully when paired', async () => {
    const mockPairedDevice = {
      id: 'partner-device-id',
      code: 'TEST02',
      name: 'Partner User',
      expo_push_token: 'partner-token',
      platform: 'ios' as const,
      created_at: new Date().toISOString(),
    };

    mockDeviceService.getPairedDevice = jest.fn(() => Promise.resolve(mockPairedDevice));
    mockDeviceService.checkRateLimit = jest.fn(() => Promise.resolve({ allowed: true }));
    mockDeviceService.sendBoop = jest.fn(() => Promise.resolve({ success: true }));

    const onError = jest.fn();

    render(
      <ThemeProvider>
        <BoopButton onError={onError} />
      </ThemeProvider>
    );

    // Find and press the boop button
    const boopButton = screen.getByRole('button', { name: /boop/i });
    fireEvent.press(boopButton);

    await waitFor(() => {
      expect(mockDeviceService.sendBoop).toHaveBeenCalled();
    });

    // Should not call onError on success
    expect(onError).not.toHaveBeenCalled();
  });

  it('should show error when not paired', async () => {
    mockDeviceService.getPairedDevice = jest.fn(() => Promise.resolve(null));
    mockDeviceService.sendBoop = jest.fn(() => Promise.resolve({ 
      success: false, 
      error: 'No paired device found' 
    }));

    const onError = jest.fn();

    render(
      <ThemeProvider>
        <BoopButton onError={onError} />
      </ThemeProvider>
    );

    const boopButton = screen.getByRole('button', { name: /boop/i });
    fireEvent.press(boopButton);

    await waitFor(() => {
      expect(mockDeviceService.sendBoop).toHaveBeenCalled();
    });

    // Should call onError with error message
    expect(onError).toHaveBeenCalledWith('No paired device found');
  });

  it('should show error when rate limit is exceeded', async () => {
    const mockPairedDevice = {
      id: 'partner-device-id',
      code: 'TEST02',
      name: 'Partner User',
      expo_push_token: 'partner-token',
      platform: 'ios' as const,
      created_at: new Date().toISOString(),
    };

    mockDeviceService.getPairedDevice = jest.fn(() => Promise.resolve(mockPairedDevice));
    mockDeviceService.sendBoop = jest.fn(() => Promise.resolve({ 
      success: false, 
      error: 'Rate limit reached. Try again in 5m 30s',
      rateLimitSecondsRemaining: 330
    }));

    const onError = jest.fn();

    render(
      <ThemeProvider>
        <BoopButton onError={onError} />
      </ThemeProvider>
    );

    const boopButton = screen.getByRole('button', { name: /boop/i });
    fireEvent.press(boopButton);

    await waitFor(() => {
      expect(mockDeviceService.sendBoop).toHaveBeenCalled();
    });

    expect(onError).toHaveBeenCalledWith('Rate limit reached. Try again in 5m 30s');
  });

  it('should trigger long press handler', async () => {
    const onLongPress = jest.fn();

    render(
      <ThemeProvider>
        <BoopButton onLongPress={onLongPress} />
      </ThemeProvider>
    );

    const boopButton = screen.getByRole('button', { name: /boop/i });
    
    // Simulate long press (delayLongPress is 500ms in component)
    fireEvent(boopButton, 'longPress');

    await waitFor(() => {
      expect(onLongPress).toHaveBeenCalled();
    });
  });
});

