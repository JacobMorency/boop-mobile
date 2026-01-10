import { useState, useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import BoopButton from "@/components/boop-button";
import SettingsModal from "@/components/settings-modal";
import NameInputModal from "@/components/name-input-modal";
import WelcomeModal from "@/components/welcome-modal";
import Toast from "@/components/ui/toast";
import { DeviceService } from "@/lib/deviceService";
import { PushNotificationService } from "@/lib/pushNotificationService";
import { ThemeService } from "@/lib/themeService";
import { useTheme } from "@/lib/themeContext";
import { Device } from "@/lib/supabase";
import { useConnectionAnimation } from "@/hooks/useConnectionAnimation";
import { useButtonAnimations } from "@/hooks/useButtonAnimations";

export default function Index() {
  const { theme } = useTheme();
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [pairedDevice, setPairedDevice] = useState<Device | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"error" | "success" | "info">(
    "error"
  );
  const [showToast, setShowToast] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // Animation hooks
  const { connectionSlideAnim, connectionOpacityAnim, dotPulseAnim } =
    useConnectionAnimation(pairedDevice !== null);

  const {
    boopButtonPulseAnim,
    boopButtonGlowAnim,
    triggerBoopReceptionAnimation,
  } = useButtonAnimations();

  // Helper text animations
  const helperTextAnim = useRef(new Animated.Value(0)).current;
  const helperTextSlideAnim = useRef(new Animated.Value(20)).current;

  const notificationCleanupRef = useRef<(() => void) | null>(null);
  const rateLimitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Clear rate limit error after timeout
  useEffect(() => {
    if (rateLimitError) {
      if (rateLimitTimeoutRef.current) {
        clearTimeout(rateLimitTimeoutRef.current);
      }
      rateLimitTimeoutRef.current = setTimeout(() => {
        setRateLimitError(null);
        rateLimitTimeoutRef.current = null;
      }, 5000);
    }

    return () => {
      if (rateLimitTimeoutRef.current) {
        clearTimeout(rateLimitTimeoutRef.current);
        rateLimitTimeoutRef.current = null;
      }
    };
  }, [rateLimitError]);

  // Initialize device service and notifications on app start
  useEffect(() => {
    initializeApp();

    // Cleanup function
    return () => {
      // Notification cleanup
      if (notificationCleanupRef.current) {
        notificationCleanupRef.current();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeApp = async () => {
    await DeviceService.initialize();
    await ThemeService.initialize();
    setupNotifications();
    await loadPairedDevice();

    // Check if this is first time user
    const deviceInfo = DeviceService.getCurrentDevice();
    if (!deviceInfo.name || deviceInfo.name === "Anonymous") {
      // Show welcome screen first, then name input
      setShowWelcome(true);
    }
  };

  const loadPairedDevice = async () => {
    try {
      const device = await DeviceService.getPairedDevice();
      const isNowPaired = device !== null;

      setPairedDevice(device);

      // Animate helper text based on pairing status
      // Connection animations are handled by useConnectionAnimation hook
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

  const showToastMessage = (
    message: string,
    type: "error" | "success" | "info" = "error"
  ) => {
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

    // Store cleanup function
    notificationCleanupRef.current = () => {
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
      {/* Connection Status - Refined animated indicator */}
      <Animated.View
        className="absolute z-10"
        style={{
          top: 48, // Using theme spacing equivalent (12 * 4 = 48)
          left: 24, // Using theme spacing equivalent (6 * 4 = 24)
          opacity: connectionOpacityAnim,
          transform: [{ translateY: connectionSlideAnim }],
        }}
      >
        <View
          className="flex-row items-center rounded-full px-3 py-1.5"
          style={{
            backgroundColor: theme.colors.bg.light,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <Animated.View
            className="w-2.5 h-2.5 rounded-full mr-2"
            style={{
              transform: [{ scale: dotPulseAnim }],
              backgroundColor: theme.colors.success,
            }}
          />
          <Text
            className="text-xs font-semibold"
            style={{ color: theme.colors.text.DEFAULT }}
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
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsSettingsVisible(true);
            }}
            onError={(message) => {
              // Handle rate limit errors - show on button with pulse
              if (
                message.includes("Rate limit") ||
                message.includes("too fast")
              ) {
                setRateLimitError(message);
                // Clear after 5 seconds - using useEffect would be better but this is simpler for now
                // The error will clear when user tries again or component unmounts
              } else {
                // Show toast for other errors
                showToastMessage(message, "error");
              }
            }}
            isPaired={pairedDevice !== null}
            rateLimitError={rateLimitError}
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

      <WelcomeModal
        visible={showWelcome}
        onContinue={() => {
          setShowWelcome(false);
          setShowNameInput(true);
        }}
      />

      <SettingsModal
        visible={isSettingsVisible}
        initialPairedDevice={pairedDevice}
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
