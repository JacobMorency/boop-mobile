import { useState, useEffect } from "react";
import { View, Alert, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BoopButton from "@/components/boop-button";
import SettingsModal from "@/components/settings-modal";
import NameInputModal from "@/components/name-input-modal";
import { DeviceService } from "@/lib/deviceService";
import { PushNotificationService } from "@/lib/pushNotificationService";
import { Device } from "@/lib/supabase";

export default function Index() {
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [pairedDevice, setPairedDevice] = useState<Device | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);

  // Initialize device service and notifications on app start
  useEffect(() => {
    initializeApp();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeApp = async () => {
    await DeviceService.initialize();
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
      setPairedDevice(device);
    } catch (error) {
      console.error("Failed to load paired device:", error);
    }
  };

  const setupNotifications = () => {
    // Listen for notifications when app is in foreground
    const notificationListener =
      PushNotificationService.addNotificationReceivedListener(
        (notification) => {
          console.log("Notification received:", notification);
          // You can show a custom alert or update UI here
          Alert.alert(
            notification.request.content.title || "Boop!",
            notification.request.content.body || "You received a boop!"
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
    <SafeAreaView className="flex-1 bg-bg">
      {/* Connection Status - Subtle indicator */}
      {pairedDevice && (
        <View className="absolute top-12 left-6 z-10">
          <View className="flex-row items-center rounded-full px-2 py-1">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-2"></View>
            <Text className="text-xs font-medium text-text-muted">
              {pairedDevice.code}
            </Text>
          </View>
        </View>
      )}

      {/* Main Content - Centered Boop Button */}
      <View className="flex-1 items-center justify-center">
        <BoopButton onLongPress={() => setIsSettingsVisible(true)} />
      </View>

      <SettingsModal
        visible={isSettingsVisible}
        onClose={() => {
          setIsSettingsVisible(false);
          loadPairedDevice(); // Refresh connection status when settings close
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
