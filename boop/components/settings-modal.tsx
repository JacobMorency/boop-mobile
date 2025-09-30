import { useState, useEffect } from "react";
import { View, Text, Modal, Button, Alert, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DeviceService } from "@/lib/deviceService";
import { Device } from "@/lib/supabase";
import PairingModal from "./pairing-modal";
import Icon from "./ui/icon";

export type SettingsModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function SettingsModal({
  visible,
  onClose,
}: SettingsModalProps) {
  const [pairedDevice, setPairedDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false);

  // Load paired device when modal opens
  useEffect(() => {
    if (visible) {
      loadPairedDevice();
    }
  }, [visible]);

  const loadPairedDevice = async () => {
    setIsLoading(true);
    try {
      const device = await DeviceService.getPairedDevice();
      setPairedDevice(device);
    } catch (error) {
      console.error("Failed to load paired device:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Disconnect Partner",
      "Are you sure you want to disconnect from your current partner?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: confirmDisconnect,
        },
      ]
    );
  };

  const confirmDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const success = await DeviceService.disconnectFromPartner();
      if (success) {
        setPairedDevice(null);
        Alert.alert("Success", "Disconnected from partner successfully!");
      } else {
        Alert.alert("Error", "Failed to disconnect from partner.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to disconnect from partner.");
      console.error(error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handlePairNew = () => {
    onClose();
    setShowPairingModal(true);
  };

  const handlePairingComplete = () => {
    setShowPairingModal(false);
    loadPairedDevice(); // Refresh the paired device
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <SafeAreaView className="flex-1">
          <View className="flex-1 items-center justify-center bg-black/50 p-4">
            <View className="w-11/12 rounded-2xl bg-bg-light p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-xl font-semibold text-text">
                  Settings
                </Text>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.5 : 1,
                    transform: [{ scale: pressed ? 0.9 : 1 }],
                  })}
                >
                  <Icon name="close" size={20} color="#9CA3AF" />
                </Pressable>
              </View>

              {/* Connection Status */}
              <View className="mb-6">
                <Text className="mb-2 text-sm font-medium text-text-muted">
                  Connection Status
                </Text>
                {isLoading ? (
                  <Text className="text-text-muted">Loading...</Text>
                ) : pairedDevice ? (
                  <View className="rounded-lg border border-border bg-bg p-3">
                    <Text className="text-sm text-text-muted">
                      Connected to:
                    </Text>
                    <Text className="text-base font-medium text-text">
                      Device {pairedDevice.code}
                    </Text>
                    <Text className="text-xs text-text-muted">
                      Connected{" "}
                      {new Date(pairedDevice.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                ) : (
                  <View className="rounded-lg border border-border bg-bg p-3">
                    <Text className="text-sm text-text-muted">
                      Not connected
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View className="space-y-3">
                {pairedDevice ? (
                  <Button
                    title={
                      isDisconnecting
                        ? "Disconnecting..."
                        : "Disconnect Partner"
                    }
                    onPress={handleDisconnect}
                    disabled={isDisconnecting}
                  />
                ) : (
                  <Button title="Pair with Partner" onPress={handlePairNew} />
                )}

                <View className="mr-2">
                  <Button title="Close" onPress={onClose} />
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <PairingModal
        visible={showPairingModal}
        onClose={handlePairingComplete}
      />
    </>
  );
}
