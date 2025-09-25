import { useState, useEffect } from "react";
import { View, Text, Modal, Button, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DeviceService } from "@/lib/deviceService";

export type PairingModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function PairingModal({ visible, onClose }: PairingModalProps) {
  const [myCode, setMyCode] = useState<string>("");
  const [otherCode, setOtherCode] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  // Get device code when modal opens
  useEffect(() => {
    if (visible) {
      loadDeviceCode();
    }
  }, [visible]);

  const loadDeviceCode = async () => {
    try {
      const { code } = await DeviceService.registerDevice();
      setMyCode(code);
    } catch (error) {
      Alert.alert("Error", "Failed to load device code");
      console.error(error);
    }
  };

  const handleConnect = async () => {
    if (!otherCode.trim()) return;

    setIsConnecting(true);
    try {
      // Find the device by code
      const otherDevice = await DeviceService.findDeviceByCode(
        otherCode.trim()
      );

      if (!otherDevice) {
        Alert.alert("Error", "Device not found. Please check the code.");
        return;
      }

      // Pair with the device
      await DeviceService.pairWithDevice(otherDevice.id);

      Alert.alert("Success", "Devices paired successfully!");
      onClose();
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to pair devices. They may already be paired."
      );
      console.error(error);
    } finally {
      setIsConnecting(false);
    }
  };
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center bg-black/50 p-4">
          <View className="w-11/12 rounded-2xl bg-bg-light p-6">
            <Text className="mb-4 text-xl font-semibold text-text">
              Pairing
            </Text>
            <View className="mb-4">
              <Text className="mb-1 text-sm text-text-muted">Your code</Text>
              <View className="rounded-lg border border-border px-3 py-2 bg-bg dark:bg-bg">
                <Text className="text-base tracking-widest text-text">
                  {myCode}
                </Text>
              </View>
            </View>
            <View className="mb-6">
              <Text className="mb-1 text-sm text-text-muted">
                Enter partner code
              </Text>
              <TextInput
                value={otherCode}
                onChangeText={setOtherCode}
                placeholder="XXXX-XXXX"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                autoCorrect={false}
                className="rounded-lg border border-border-muted bg-bg px-3 py-2 text-base text-text-muted"
              />
            </View>
            <View className="flex-row justify-end gap-3">
              <View className="mr-2">
                <Button title="Cancel" onPress={onClose} />
              </View>
              <Button
                title={isConnecting ? "Connecting..." : "Connect"}
                onPress={handleConnect}
                disabled={!otherCode || isConnecting}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
