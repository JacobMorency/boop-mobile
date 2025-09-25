import { Pressable, Text, Alert } from "react-native";
import { DeviceService } from "@/lib/deviceService";

export default function BoopButton() {
  const handleBoop = async () => {
    try {
      const success = await DeviceService.sendBoop();
      if (success) {
        Alert.alert("Boop!", "Sent successfully!");
      } else {
        Alert.alert(
          "Error",
          "No paired device found. Please pair with another device first."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to send boop");
      console.error(error);
    }
  };

  return (
    <Pressable
      className="h-40 w-40 items-center justify-center rounded-full border-2 border-primary bg-bg-light"
      accessibilityRole="button"
      accessibilityLabel="Boop"
      onPress={handleBoop}
    >
      <Text className="text-lg font-semibold text-text">Boop!</Text>
    </Pressable>
  );
}
