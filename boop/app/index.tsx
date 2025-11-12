import { useState, useEffect, useRef } from "react";
import { View, Alert, Text, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import BoopButton from "@/components/boop-button";
import SettingsModal from "@/components/settings-modal";
import NameInputModal from "@/components/name-input-modal";
import Toast from "@/components/ui/toast";
import { DeviceService } from "@/lib/deviceService";
import { PushNotificationService } from "@/lib/pushNotificationService";
import { ThemeService } from "@/lib/themeService";
// import { PurchaseService } from "@/lib/purchaseService"; // Commented out - IAP disabled for now
import { useTheme } from "@/lib/themeContext";
import { Device } from "@/lib/supabase";

export default function Index() {
  const { theme } = useTheme();
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [pairedDevice, setPairedDevice] = useState<Device | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"error" | "success" | "info">("error");
  const [showToast, setShowToast] = useState(false);

  // Animation refs
  const connectionSlideAnim = useRef(new Animated.Value(-50)).current;
  const connectionOpacityAnim = useRef(new Animated.Value(0)).current;
  const dotPulseAnim = useRef(new Animated.Value(1)).current;
  const helperTextAnim = useRef(new Animated.Value(0)).current;
  const helperTextSlideAnim = useRef(new Animated.Value(20)).current;
  const boopButtonPulseAnim = useRef(new Animated.Value(1)).current;
  const boopButtonGlowAnim = useRef(new Animated.Value(0)).current;

  // Initialize device service and notifications on app start
  useEffect(() => {
    initializeApp();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeApp = async () => {
    await DeviceService.initialize();
    await ThemeService.initialize();
    // await PurchaseService.initialize(); // Initialize IAP - Commented out for now
    setupNotifications();
    await loadPairedDevice();

    // Check if user needs to set their name
    const deviceInfo = DeviceService.getCurrentDevice();
    if (!deviceInfo.name || deviceInfo.name === "Anonymous") {
      setShowNameInput(true);
    }
  };

  const loadPairedDevice = async () => {
    try {
      const device = await DeviceService.getPairedDevice();
      const wasPaired = pairedDevice !== null;
      const isNowPaired = device !== null;

      setPairedDevice(device);

      // Animate connection status changes
      if (isNowPaired && !wasPaired) {
        // Just connected - slide in with bounce
        Animated.parallel([
          Animated.spring(connectionSlideAnim, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(connectionOpacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

        // Start pulsing dot animation
        startDotPulse();
      } else if (!isNowPaired && wasPaired) {
        // Just disconnected - fade out
        Animated.parallel([
          Animated.timing(connectionSlideAnim, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(connectionOpacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }

      // Animate helper text
      if (!isNowPaired) {
        Animated.parallel([
          Animated.timing(helperTextAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(helperTextSlideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(helperTextAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(helperTextSlideAnim, {
            toValue: 20,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error) {
      console.error("Failed to load paired device:", error);
      // Don't show error toast for loading - it's not user-initiated
    }
  };

  const startDotPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(dotPulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const triggerBoopReceptionAnimation = () => {
    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Pulse animation - scale up and down
    Animated.sequence([
      Animated.parallel([
        Animated.spring(boopButtonPulseAnim, {
          toValue: 1.15,
          tension: 200,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(boopButtonGlowAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(boopButtonPulseAnim, {
          toValue: 1,
          tension: 200,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(boopButtonGlowAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const showToastMessage = (message: string, type: "error" | "success" | "info" = "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const setupNotifications = () => {
    // Listen for notifications when app is in foreground
    const notificationListener =
      PushNotificationService.addNotificationReceivedListener(
        (notification) => {
          console.log("Notification received:", notification);
          // Trigger animation and haptic feedback
          triggerBoopReceptionAnimation();
          // Show toast notification
          showToastMessage(
            notification.request.content.body || "You received a boop!",
            "info"
          );
        }
      );

    // Listen for notification taps
    const responseListener =
      PushNotificationService.addNotificationResponseReceivedListener(
        (response) => {
          console.log("Notification tapped:", response);
          // Handle notification tap - maybe show a specific screen
        }
      );

    // Cleanup listeners on unmount
    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  };

  return (
    <SafeAreaView 
      className="flex-1"
      style={{ backgroundColor: theme.colors.bg.DEFAULT }}
    >
      <Toast
        message={toastMessage}
        type={toastType}
        visible={showToast}
        onHide={() => setShowToast(false)}
      />
      {/* Connection Status - Animated indicator */}
      <Animated.View
        className="absolute top-12 left-6 z-10"
        style={{
          opacity: connectionOpacityAnim,
          transform: [{ translateY: connectionSlideAnim }],
        }}
      >
        <View 
          className="flex-row items-center rounded-full px-2 py-1"
          style={{ backgroundColor: theme.colors.bg.light }}
        >
          <Animated.View
            className="w-2 h-2 rounded-full mr-2"
            style={{
              transform: [{ scale: dotPulseAnim }],
              backgroundColor: theme.colors.success,
            }}
          />
          <Text 
            className="text-xs font-medium"
            style={{ color: theme.colors.text.muted }}
          >
            {pairedDevice?.name || pairedDevice?.code}
          </Text>
        </View>
      </Animated.View>

      {/* Main Content - Centered Boop Button */}
      <View className="flex-1 items-center justify-center">
        <Animated.View
          style={{
            transform: [{ scale: boopButtonPulseAnim }],
            shadowOpacity: boopButtonGlowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.8],
            }),
            shadowColor: "#c8a2c8",
            shadowOffset: {
              width: 0,
              height: 0,
            },
            shadowRadius: 30,
          }}
        >
          <BoopButton 
            onLongPress={() => setIsSettingsVisible(true)}
            onError={(message) => showToastMessage(message, "error")}
          />
        </Animated.View>

        {/* Helper text when not paired - Animated */}
        <Animated.View
          className="mt-8 px-8"
          style={{
            opacity: helperTextAnim,
            transform: [{ translateY: helperTextSlideAnim }],
          }}
        >
          <Text 
            className="text-center text-sm"
            style={{ color: theme.colors.text.muted }}
          >
            Long press the button to open settings and pair with a partner
          </Text>
        </Animated.View>
      </View>

      <SettingsModal
        visible={isSettingsVisible}
        onClose={() => {
          setIsSettingsVisible(false);
          loadPairedDevice(); // Refresh connection status when settings close
        }}
        onReopen={() => {
          setIsSettingsVisible(true);
        }}
      />

      <NameInputModal
        visible={showNameInput}
        onComplete={() => {
          setShowNameInput(false);
          loadPairedDevice(); // Refresh after name setup
        }}
      />
    </SafeAreaView>
  );
}
