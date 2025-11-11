import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Alert,
  Pressable,
  TextInput,
  Clipboard,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { DeviceService } from "@/lib/deviceService";
import { Device } from "@/lib/supabase";
import { useTheme } from "@/lib/themeContext";
import PairingModal from "./pairing-modal";
import Icon from "./ui/icon";
import Button from "./ui/button";
import Toast from "./ui/toast";

export type SettingsModalProps = {
  visible: boolean;
  onClose: () => void;
  onReopen?: () => void;
};

export default function SettingsModal({
  visible,
  onClose,
  onReopen,
}: SettingsModalProps) {
  const { theme } = useTheme();
  const router = useRouter();
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
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"error" | "success" | "info">("error");
  const [showToast, setShowToast] = useState(false);

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

  const showToastMessage = (message: string, type: "error" | "success" | "info" = "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const confirmDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const success = await DeviceService.disconnectFromPartner();
      if (success) {
        setPairedDevice(null);
        showToastMessage("Disconnected from partner successfully!", "success");
      } else {
        showToastMessage("Failed to disconnect from partner.", "error");
      }
    } catch (error) {
      showToastMessage("Failed to disconnect from partner.", "error");
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

  const handleOpenThemePicker = () => {
    onClose(); // Close settings modal first
    // Small delay to ensure settings modal closes before navigating
    setTimeout(() => {
      router.push("/theme");
    }, 300);
  };

  const handleEditName = () => {
    setNewName(currentDevice.name || "");
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      showToastMessage("Please enter a name", "error");
      return;
    }

    try {
      const success = await DeviceService.updateDeviceName(newName.trim());
      if (success) {
        // Reload device info to ensure we have the latest data including code
        loadCurrentDevice();
        setIsEditingName(false);
        showToastMessage("Name updated successfully!", "success");
      } else {
        showToastMessage("Failed to update name", "error");
      }
    } catch (error) {
      showToastMessage("Failed to update name", "error");
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
          <Toast
            message={toastMessage}
            type={toastType}
            visible={showToast}
            onHide={() => setShowToast(false)}
          />
          <View 
            className="flex-1 items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          >
            <View 
              className="w-11/12 rounded-2xl p-6"
              style={{ backgroundColor: theme.colors.bg.light }}
            >
              <View className="flex-row items-center justify-between mb-6">
                <Text 
                  className="text-xl font-semibold"
                  style={{ color: theme.colors.text.DEFAULT }}
                >
                  Settings
                </Text>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.5 : 1,
                    transform: [{ scale: pressed ? 0.9 : 1 }],
                  })}
                >
                  <Icon name="close" size={20} color={theme.colors.text.muted} />
                </Pressable>
              </View>

              {/* Your Code */}
              <View className="mb-6">
                <Text 
                  className="mb-2 text-sm font-medium"
                  style={{ color: theme.colors.text.muted }}
                >
                  Your Code
                </Text>
                <View 
                  className="rounded-lg p-3"
                  style={{
                    borderWidth: 1,
                    borderColor: theme.colors.border.DEFAULT,
                    backgroundColor: theme.colors.bg.DEFAULT,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text 
                      className="text-xl font-bold tracking-widest"
                      style={{ color: theme.colors.text.DEFAULT }}
                    >
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
                        className="rounded-lg p-2 items-center justify-center"
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.6 : 1,
                          width: 36,
                          height: 36,
                        })}
                      >
                        <View className="absolute items-center justify-center" style={{ width: 20, height: 20 }}>
                          <Animated.View
                            style={{
                              opacity: copyButtonTextAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 0],
                              }),
                            }}
                          >
                            <Icon
                              name="copy"
                              size={20}
                              color={theme.colors.text.muted}
                            />
                          </Animated.View>
                          <Animated.View
                            className="absolute"
                            style={{
                              opacity: copyButtonTextAnim,
                            }}
                          >
                            <Icon name="check" size={20} color={theme.colors.success} />
                          </Animated.View>
                        </View>
                      </Pressable>
                    </Animated.View>
                  </View>
                </View>
                <Text 
                  className="mt-2 text-xs"
                  style={{ color: theme.colors.text.muted }}
                >
                  Share this code with your partner to pair devices
                </Text>
              </View>

              {/* Your Name */}
              <View className="mb-6">
                <Text 
                  className="mb-2 text-sm font-medium"
                  style={{ color: theme.colors.text.muted }}
                >
                  Your Name
                </Text>
                {isEditingName ? (
                  <View>
                    <TextInput
                      value={newName}
                      onChangeText={setNewName}
                      placeholder="Enter your name"
                      placeholderTextColor={theme.colors.text.muted}
                      autoCapitalize="words"
                      autoCorrect={false}
                      className="rounded-lg px-3 py-2 text-base"
                      style={{
                        borderWidth: 1,
                        borderColor: theme.colors.border.DEFAULT,
                        backgroundColor: theme.colors.bg.DEFAULT,
                        color: theme.colors.text.DEFAULT,
                      }}
                      maxLength={50}
                    />
                    <View className="flex-row mt-3" style={{ gap: 8 }}>
                      <Button
                        title="Save"
                        onPress={handleSaveName}
                        className="flex-1"
                      />
                      <Button
                        title="Cancel"
                        onPress={handleCancelEdit}
                        variant="secondary"
                        className="flex-1"
                      />
                    </View>
                  </View>
                ) : (
                  <View 
                    className="flex-row items-center justify-between rounded-lg p-3"
                    style={{
                      borderWidth: 1,
                      borderColor: theme.colors.border.DEFAULT,
                      backgroundColor: theme.colors.bg.DEFAULT,
                    }}
                  >
                    <Text 
                      className="text-base"
                      style={{ color: theme.colors.text.DEFAULT }}
                    >
                      {currentDevice.name || "Not set"}
                    </Text>
                    <Pressable
                      onPress={handleEditName}
                      className="p-2"
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.6 : 1,
                      })}
                    >
                      <Icon name="edit" size={20} color={theme.colors.text.muted} />
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Connection Status */}
              <View className="mb-6">
                <Text 
                  className="mb-2 text-sm font-medium"
                  style={{ color: theme.colors.text.muted }}
                >
                  Connection Status
                </Text>
                {isLoading ? (
                  <Text style={{ color: theme.colors.text.muted }}>Loading...</Text>
                ) : pairedDevice ? (
                  <View 
                    className="rounded-lg p-3"
                    style={{
                      borderWidth: 1,
                      borderColor: theme.colors.border.DEFAULT,
                      backgroundColor: theme.colors.bg.DEFAULT,
                    }}
                  >
                    <Text 
                      className="text-sm"
                      style={{ color: theme.colors.text.muted }}
                    >
                      Connected to:
                    </Text>
                    <Text 
                      className="text-base font-medium"
                      style={{ color: theme.colors.text.DEFAULT }}
                    >
                      Device {pairedDevice.code}
                    </Text>
                    <Text 
                      className="text-xs"
                      style={{ color: theme.colors.text.muted }}
                    >
                      Connected{" "}
                      {new Date(pairedDevice.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                ) : (
                  <View 
                    className="rounded-lg p-3"
                    style={{
                      borderWidth: 1,
                      borderColor: theme.colors.border.DEFAULT,
                      backgroundColor: theme.colors.bg.DEFAULT,
                    }}
                  >
                    <Text 
                      className="text-sm"
                      style={{ color: theme.colors.text.muted }}
                    >
                      Not connected
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View>
                {pairedDevice ? (
                  <Button
                    title={
                      isDisconnecting
                        ? "Disconnecting..."
                        : "Disconnect Partner"
                    }
                    onPress={handleDisconnect}
                    disabled={isDisconnecting}
                    loading={isDisconnecting}
                    className="mb-3"
                  />
                ) : (
                  <Button
                    title="Pair with Partner"
                    onPress={handlePairNew}
                    className="mb-3"
                  />
                )}

                <Button
                  title="Close"
                  onPress={onClose}
                  variant="secondary"
                />
              </View>

              {/* Footer Section */}
              <View 
                className="mt-6 pt-4"
                style={{
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.border.muted,
                }}
              >
                <View className="flex-row justify-center" style={{ gap: 16 }}>
                  <Pressable
                    onPress={handleOpenThemePicker}
                    className="rounded-lg px-4 py-2 items-center justify-center min-w-[80px]"
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.8 : 1,
                      backgroundColor: theme.colors.bg.DEFAULT,
                    })}
                  >
                    <Icon name="palette" size={18} color={theme.colors.text.muted} />
                    <Text 
                      className="mt-1 text-xs font-medium"
                      style={{ color: theme.colors.text.muted }}
                    >
                      Theme
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      // Placeholder for donate functionality
                      Alert.alert(
                        "Donate",
                        "Donation feature coming soon! Thank you for your support."
                      );
                    }}
                    className="rounded-lg px-4 py-2 items-center justify-center min-w-[80px]"
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.8 : 1,
                      backgroundColor: theme.colors.bg.DEFAULT,
                    })}
                  >
                    <Icon name="heart" size={18} color={theme.colors.text.muted} />
                    <Text 
                      className="mt-1 text-xs font-medium"
                      style={{ color: theme.colors.text.muted }}
                    >
                      Donate
                    </Text>
                  </Pressable>
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
