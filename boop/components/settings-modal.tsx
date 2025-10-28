import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Button,
  Alert,
  Pressable,
  TextInput,
  Clipboard,
  Animated,
} from "react-native";
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [currentDevice, setCurrentDevice] = useState<{
    name: string | null;
    code: string | null;
  }>({
    name: null,
    code: null,
  });

  // Animation refs for copy button
  const copyButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const copyButtonTextAnim = useRef(new Animated.Value(0)).current;

  // Load paired device when modal opens
  useEffect(() => {
    if (visible) {
      loadPairedDevice();
      loadCurrentDevice();
    }
  }, [visible]);

  const loadCurrentDevice = () => {
    const deviceInfo = DeviceService.getCurrentDevice();
    setCurrentDevice({ name: deviceInfo.name, code: deviceInfo.code });
  };

  const copyCodeToClipboard = async () => {
    if (!currentDevice.code) return;
    try {
      // Button press animation
      Animated.sequence([
        Animated.spring(copyButtonScaleAnim, {
          toValue: 0.95,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.spring(copyButtonScaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      // Text morph animation (Copy → ✓)
      Animated.timing(copyButtonTextAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      Clipboard.setString(currentDevice.code);

      // Reset after 2 seconds
      setTimeout(() => {
        Animated.timing(copyButtonTextAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

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

  const handleEditName = () => {
    setNewName(currentDevice.name || "");
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }

    try {
      const success = await DeviceService.updateDeviceName(newName.trim());
      if (success) {
        setCurrentDevice({ name: newName.trim() });
        setIsEditingName(false);
        Alert.alert("Success", "Name updated successfully!");
      } else {
        Alert.alert("Error", "Failed to update name");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update name");
      console.error(error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setNewName("");
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

              {/* Your Code */}
              <View className="mb-6">
                <Text className="mb-2 text-sm font-medium text-text-muted">
                  Your Code
                </Text>
                <View className="rounded-lg border border-border bg-bg p-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xl font-bold tracking-widest text-text">
                      {currentDevice.code || "Loading..."}
                    </Text>
                    <Animated.View
                      style={{
                        transform: [{ scale: copyButtonScaleAnim }],
                      }}
                    >
                      <Pressable
                        onPress={copyCodeToClipboard}
                        disabled={!currentDevice.code}
                        className="rounded-lg bg-primary px-3 py-2"
                      >
                        <Animated.Text
                          className="text-sm font-medium text-white"
                          style={{
                            opacity: copyButtonTextAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 0],
                            }),
                          }}
                        >
                          Copy
                        </Animated.Text>
                        <Animated.Text
                          className="text-sm font-medium text-white absolute"
                          style={{
                            opacity: copyButtonTextAnim,
                          }}
                        >
                          ✓
                        </Animated.Text>
                      </Pressable>
                    </Animated.View>
                  </View>
                  <Text className="mt-2 text-xs text-text-muted">
                    Share this code with your partner to pair devices
                  </Text>
                </View>
              </View>

              {/* Your Name */}
              <View className="mb-6">
                <Text className="mb-2 text-sm font-medium text-text-muted">
                  Your Name
                </Text>
                {isEditingName ? (
                  <View className="space-y-3">
                    <TextInput
                      value={newName}
                      onChangeText={setNewName}
                      placeholder="Enter your name"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="words"
                      autoCorrect={false}
                      className="rounded-lg border border-border bg-bg px-3 py-2 text-base text-text"
                      maxLength={50}
                    />
                    <View className="flex-row gap-2">
                      <Button
                        title="Save"
                        onPress={handleSaveName}
                        className="flex-1"
                      />
                      <Button
                        title="Cancel"
                        onPress={handleCancelEdit}
                        className="flex-1"
                      />
                    </View>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-between rounded-lg border border-border bg-bg p-3">
                    <Text className="text-base text-text">
                      {currentDevice.name || "Not set"}
                    </Text>
                    <Button title="Edit" onPress={handleEditName} />
                  </View>
                )}
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
