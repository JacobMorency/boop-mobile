import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DeviceService } from "@/lib/deviceService";
import { useTheme } from "@/lib/themeContext";
import Button from "@/components/ui/button";
import Toast from "@/components/ui/toast";

export type PairingModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function PairingModal({ visible, onClose }: PairingModalProps) {
  const { theme } = useTheme();
  const [myCode, setMyCode] = useState<string>("");
  const [otherCode, setOtherCode] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCodeValid, setIsCodeValid] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"error" | "success" | "info">(
    "error"
  );
  const [showToast, setShowToast] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const showToastMessage = useCallback(
    (message: string, type: "error" | "success" | "info" = "error") => {
      setToastMessage(message);
      setToastType(type);
      setShowToast(true);
    },
    []
  );

  const loadDeviceCode = useCallback(async () => {
    try {
      const result = await DeviceService.registerDevice();
      if (result.success && result.code) {
        setMyCode(result.code);
      } else {
        showToastMessage(result.error || "Failed to load device code", "error");
      }
    } catch (error) {
      showToastMessage("Failed to load device code", "error");
      console.error(error);
    }
  }, [showToastMessage]);

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
  }, [visible, loadDeviceCode]);

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

  const handleConnect = async () => {
    if (!otherCode.trim()) return;

    setIsConnecting(true);
    try {
      // Find the device by code
      const otherDevice = await DeviceService.findDeviceByCode(
        otherCode.trim()
      );

      if (!otherDevice) {
        showToastMessage("Device not found. Please check the code.", "error");
        setIsConnecting(false);
        return;
      }

      // Pair with the device
      const pairResult = await DeviceService.pairWithDevice(otherDevice.id);

      if (pairResult.success) {
        showToastMessage("Devices paired successfully!", "success");
        // Close modal after a short delay to show success toast
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        showToastMessage(
          pairResult.error ||
            "Failed to pair devices. They may already be paired.",
          "error"
        );
        setIsConnecting(false);
      }
    } catch (error) {
      showToastMessage("Failed to pair devices", "error");
      console.error(error);
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
        <Toast
          message={toastMessage}
          type={toastType}
          visible={showToast}
          onHide={() => setShowToast(false)}
        />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            className="flex-1 items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          >
            <View
              className="w-11/12 rounded-2xl p-6"
              style={{ backgroundColor: theme.colors.bg.light }}
            >
              <Text
                className="mb-4 text-xl font-semibold"
                style={{ color: theme.colors.text.DEFAULT }}
              >
                Pairing
              </Text>
              <View className="mb-4">
                <Text
                  className="mb-1 text-sm"
                  style={{ color: theme.colors.text.muted }}
                >
                  Your code
                </Text>
                <View
                  className="rounded-lg px-3 py-2"
                  style={{
                    borderWidth: 1,
                    borderColor: theme.colors.border.DEFAULT,
                    backgroundColor: theme.colors.bg.DEFAULT,
                  }}
                >
                  <Text
                    className="text-base tracking-widest"
                    style={{ color: theme.colors.text.DEFAULT }}
                  >
                    {myCode}
                  </Text>
                </View>
              </View>
              <View className="mb-6">
                <Text
                  className="mb-1 text-sm"
                  style={{ color: theme.colors.text.muted }}
                >
                  Enter partner code
                </Text>
                <TextInput
                  ref={inputRef}
                  value={otherCode}
                  onChangeText={handleCodeChange}
                  placeholder="XXXXXX"
                  placeholderTextColor={theme.colors.text.muted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={6}
                  className="rounded-lg px-3 py-2 text-base"
                  style={{
                    borderWidth: 1,
                    borderColor: isCodeValid
                      ? theme.colors.border.muted
                      : theme.colors.danger,
                    backgroundColor: theme.colors.bg.DEFAULT,
                    color: theme.colors.text.DEFAULT,
                  }}
                />
                {!isCodeValid && otherCode.length > 0 && (
                  <Text
                    className="mt-1 text-xs"
                    style={{ color: theme.colors.danger }}
                  >
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
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </Modal>
  );
}
