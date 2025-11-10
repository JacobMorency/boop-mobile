import { useState, useEffect, useRef } from "react";
import { View, Text, Modal, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DeviceService } from "@/lib/deviceService";
import Button from "@/components/ui/button";

export type PairingModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function PairingModal({ visible, onClose }: PairingModalProps) {
  const [myCode, setMyCode] = useState<string>("");
  const [otherCode, setOtherCode] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCodeValid, setIsCodeValid] = useState(true);
  const inputRef = useRef<TextInput>(null);

  // Get device code when modal opens
  useEffect(() => {
    if (visible) {
      loadDeviceCode();
      // Auto-focus input after a short delay
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    } else {
      // Reset state when modal closes
      setOtherCode("");
      setIsCodeValid(true);
    }
  }, [visible]);

  // Validate pairing code format
  const validateCode = (code: string): boolean => {
    if (code.length === 0) return true; // Empty is valid (not yet entered)
    // 6 characters, alphanumeric only (no ambiguous characters)
    const codeRegex = /^[A-Z0-9]{0,6}$/;
    return codeRegex.test(code);
  };

  const handleCodeChange = (text: string) => {
    // Auto-uppercase
    const upperText = text.toUpperCase();
    setOtherCode(upperText);
    setIsCodeValid(validateCode(upperText));
  };

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
                ref={inputRef}
                value={otherCode}
                onChangeText={handleCodeChange}
                placeholder="XXXXXX"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                className={`rounded-lg border bg-bg px-3 py-2 text-base text-text ${
                  isCodeValid ? "border-border-muted" : "border-danger"
                }`}
              />
              {!isCodeValid && otherCode.length > 0 && (
                <Text className="mt-1 text-xs text-danger">
                  Code must be 6 alphanumeric characters
                </Text>
              )}
            </View>
            <View className="flex-row" style={{ gap: 12 }}>
              <Button
                title="Cancel"
                onPress={onClose}
                variant="secondary"
                className="flex-1"
              />
              <Button
                title={isConnecting ? "Connecting..." : "Connect"}
                onPress={handleConnect}
                disabled={!otherCode.trim() || isConnecting || !isCodeValid}
                loading={isConnecting}
                className="flex-1"
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
