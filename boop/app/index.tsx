import { useState, useEffect } from "react";
import { View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/header";
import BoopButton from "@/components/boop-button";
import PairingModal from "@/components/pairing-modal";
import { DeviceService } from "@/lib/deviceService";
import { PushNotificationService } from "@/lib/pushNotificationService";
import * as Notifications from "expo-notifications";

export default function Index() {
  const [isPairingVisible, setIsPairingVisible] = useState(false);

  // Initialize device service and notifications on app start
  useEffect(() => {
    DeviceService.initialize();
    setupNotifications();
  }, []);

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
      <Header title="Boop" onPressSettings={() => setIsPairingVisible(true)} />
      <View className="flex-1 items-center justify-center">
        <BoopButton />
      </View>
      <PairingModal
        visible={isPairingVisible}
        onClose={() => setIsPairingVisible(false)}
      />
    </SafeAreaView>
  );
}
