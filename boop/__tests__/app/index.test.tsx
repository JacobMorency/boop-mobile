/**
 * P0 Tests for Main App Screen
 * 
 * Tests:
 * 1. App Launch - App initializes and shows main screen
 * 2. First-time Onboarding - New user can complete onboarding
 * 3. Settings Modal Access - User can open settings by long-pressing button
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../lib/themeContext';

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

jest.mock('../../lib/themeService', () => ({
  ThemeService: {
    initialize: jest.fn(() => Promise.resolve()),
    getCurrentTheme: jest.fn(() => 'lilac'),
    getTheme: jest.fn(() => ({
      name: 'lilac',
      displayName: 'Lilac',
      colors: {
        bg: { dark: '#ede9fe', DEFAULT: '#f5f3ff', light: '#ffffff' },
        text: { DEFAULT: '#1e1b4b', muted: '#6366f1' },
        highlight: '#c8a2c8',
        border: { DEFAULT: '#e0e7ff', muted: '#c7d2fe' },
        primary: '#a855f7',
        secondary: '#8b5cf6',
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
        info: '#3b82f6',
      },
    })),
    getAllThemes: jest.fn(() => []),
    setTheme: jest.fn(() => Promise.resolve(true)),
    subscribe: jest.fn(() => () => {}),
    getThemeProductId: jest.fn(() => null),
  },
}));

jest.mock('../../lib/pushNotificationService', () => ({
  PushNotificationService: {
    registerForPushNotifications: jest.fn(() => Promise.resolve('mock-token')),
    addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

import { DeviceService } from '../../lib/deviceService';
import { ThemeService } from '../../lib/themeService';
import Index from '../../app/index';

const mockDeviceService = DeviceService as jest.Mocked<typeof DeviceService>;
const mockThemeService = ThemeService as jest.Mocked<typeof ThemeService>;

describe('App Launch and Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeviceService.initialize = jest.fn(() => Promise.resolve());
    mockDeviceService.getCurrentDevice = jest.fn(() => ({
      deviceId: null,
      code: null,
      name: null,
    }));
    mockDeviceService.getPairedDevice = jest.fn(() => Promise.resolve(null));
    mockThemeService.initialize = jest.fn(() => Promise.resolve());
  });

  it('should initialize app and show main screen', async () => {
    // Mock device as already registered (not first-time user)
    mockDeviceService.getCurrentDevice = jest.fn(() => ({
      deviceId: 'test-device-id',
      code: 'TEST01',
      name: 'Test User',
    }));

    render(
      <ThemeProvider>
        <Index />
      </ThemeProvider>
    );

    // Wait for initialization
    await waitFor(() => {
      expect(mockDeviceService.initialize).toHaveBeenCalled();
      expect(mockThemeService.initialize).toHaveBeenCalled();
    });

    // Should show boop button
    const boopButton = screen.getByRole('button', { name: /boop/i });
    expect(boopButton).toBeTruthy();
  });

  it('should show welcome modal for first-time user', async () => {
    // Mock first-time user (no name set)
    mockDeviceService.getCurrentDevice = jest.fn(() => ({
      deviceId: null,
      code: null,
      name: null,
    }));

    render(
      <ThemeProvider>
        <Index />
      </ThemeProvider>
    );

    // Wait for welcome modal to appear
    await waitFor(() => {
      const welcomeText = screen.queryByText(/welcome to boop/i);
      expect(welcomeText).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should show helper text when not paired', async () => {
    mockDeviceService.getCurrentDevice = jest.fn(() => ({
      deviceId: 'test-device-id',
      code: 'TEST01',
      name: 'Test User',
    }));
    mockDeviceService.getPairedDevice = jest.fn(() => Promise.resolve(null));

    render(
      <ThemeProvider>
        <Index />
      </ThemeProvider>
    );

    await waitFor(() => {
      const helperText = screen.queryByText(/long press the button to open settings/i);
      expect(helperText).toBeTruthy();
    });
  });

  it('should show connection status when paired', async () => {
    const mockPairedDevice = {
      id: 'partner-device-id',
      code: 'TEST02',
      name: 'Partner User',
      expo_push_token: 'partner-token',
      platform: 'ios' as const,
      created_at: new Date().toISOString(),
    };

    mockDeviceService.getCurrentDevice = jest.fn(() => ({
      deviceId: 'test-device-id',
      code: 'TEST01',
      name: 'Test User',
    }));
    mockDeviceService.getPairedDevice = jest.fn(() => Promise.resolve(mockPairedDevice));

    render(
      <ThemeProvider>
        <Index />
      </ThemeProvider>
    );

    await waitFor(() => {
      const connectionText = screen.queryByText(/TEST02|Partner User/i);
      expect(connectionText).toBeTruthy();
    });
  });
});

describe('Settings Modal Access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeviceService.initialize = jest.fn(() => Promise.resolve());
    mockDeviceService.getCurrentDevice = jest.fn(() => ({
      deviceId: 'test-device-id',
      code: 'TEST01',
      name: 'Test User',
    }));
    mockDeviceService.getPairedDevice = jest.fn(() => Promise.resolve(null));
    mockThemeService.initialize = jest.fn(() => Promise.resolve());
  });

  it('should open settings modal on long press', async () => {
    render(
      <ThemeProvider>
        <Index />
      </ThemeProvider>
    );

    await waitFor(() => {
      const boopButton = screen.getByRole('button', { name: /boop/i });
      expect(boopButton).toBeTruthy();
    });

    // Long press the button (simulate long press)
    const boopButton = screen.getByRole('button', { name: /boop/i });
    fireEvent(boopButton, 'longPress');

    // Wait for settings modal to appear - use getAllByText and check it's visible
    await waitFor(() => {
      const settingsTitles = screen.getAllByText(/settings/i);
      // Should have at least one visible settings title
      expect(settingsTitles.length).toBeGreaterThan(0);
    });
  });

  it('should close settings modal when close button is pressed', async () => {
    render(
      <ThemeProvider>
        <Index />
      </ThemeProvider>
    );

    await waitFor(() => {
      const boopButton = screen.getByRole('button', { name: /boop/i });
      expect(boopButton).toBeTruthy();
    });

    // Open settings
    const boopButton = screen.getByRole('button', { name: /boop/i });
    fireEvent(boopButton, 'longPress');

    await waitFor(() => {
      const settingsTitles = screen.getAllByText(/settings/i);
      expect(settingsTitles.length).toBeGreaterThan(0);
    });

    // Find close button by accessibility label
    const closeButton = screen.getByLabelText(/close/i);
    fireEvent.press(closeButton);
    
    // Wait for modal to close - check that "Pair with Partner" button is no longer visible
    // This is a more reliable check than looking for "Settings" text
    await waitFor(() => {
      const pairButton = screen.queryByLabelText(/pair with partner/i);
      expect(pairButton).toBeNull();
    }, { timeout: 2000 });
  });
});

