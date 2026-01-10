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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Constants from "expo-constants";
import { DeviceService } from "@/lib/deviceService";
import { Device } from "@/lib/supabase";
import { useTheme } from "@/lib/themeContext";
import {
  ThemeService,
  Theme,
  ThemeName,
  getModalBackdropColor,
} from "@/lib/themeService";
import PairingModal from "./pairing-modal";
import Icon from "./ui/icon";
import Button from "./ui/button";
import Toast from "./ui/toast";

export type SettingsModalProps = {
  visible: boolean;
  onClose: () => void;
  onReopen?: () => void;
  initialPairedDevice?: Device | null;
};

export default function SettingsModal({
  visible,
  onClose,
  onReopen,
  initialPairedDevice,
}: SettingsModalProps) {
  const { theme } = useTheme();
  const [pairedDevice, setPairedDevice] = useState<Device | null>(
    initialPairedDevice ?? null
  );
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
  const [toastType, setToastType] = useState<"error" | "success" | "info">(
    "error"
  );
  const [showToast, setShowToast] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeName>("lilac");
  const [themes, setThemes] = useState<Theme[]>([]);

  // Animation refs for copy button
  const copyButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const copyButtonTextAnim = useRef(new Animated.Value(0)).current;

  // Animation refs for modal entrance
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.95)).current;

  // Animation refs for content swap
  const contentOpacityAnim = useRef(new Animated.Value(1)).current;

  // Load paired device when modal opens
  useEffect(() => {
    if (visible) {
      // Use cached data immediately if available
      if (initialPairedDevice !== undefined) {
        setPairedDevice(initialPairedDevice);
      }

      // Load current device info (synchronous)
      loadCurrentDevice();

      // Load themes for theme picker
      setThemes(ThemeService.getAllThemes());
      setCurrentTheme(ThemeService.getCurrentTheme());

      // Refresh paired device in background (silent update)
      loadPairedDevice();

      // Start entrance animation
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(modalOpacityAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.spring(modalScaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Reset animations and state
      backdropAnim.setValue(0);
      modalOpacityAnim.setValue(0);
      modalScaleAnim.setValue(0.95);
      contentOpacityAnim.setValue(1);
      setShowThemePicker(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialPairedDevice]);

  const loadCurrentDevice = () => {
    const deviceInfo = DeviceService.getCurrentDevice();
    setCurrentDevice({ name: deviceInfo.name, code: deviceInfo.code });
  };

  const copyCodeToClipboard = async () => {
    if (!currentDevice.code) return;
    try {
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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

      // Reset after 2 seconds using Animated.delay()
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(copyButtonTextAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      showToastMessage("Failed to copy code", "error");
      console.error(error);
    }
  };

  const loadPairedDevice = async () => {
    // Only show loading if we don't have cached data
    if (!initialPairedDevice && !pairedDevice) {
      setIsLoading(true);
    }
    try {
      const device = await DeviceService.getPairedDevice();
      // Silent update - only update if data changed
      setPairedDevice(device);
    } catch (error) {
      console.error("Failed to load paired device:", error);
      // Don't show error toast for loading - it's not user-initiated
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

  const showToastMessage = (
    message: string,
    type: "error" | "success" | "info" = "error"
  ) => {
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
      showToastMessage("Failed to disconnect from partner", "error");
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Fade out settings content
    Animated.timing(contentOpacityAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowThemePicker(true);
      // Fade in theme picker
      Animated.timing(contentOpacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleCloseThemePicker = () => {
    // Fade out theme picker
    Animated.timing(contentOpacityAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowThemePicker(false);
      // Fade in settings content
      Animated.timing(contentOpacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSelectTheme = async (themeName: ThemeName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await ThemeService.setTheme(themeName);
    if (success) {
      setCurrentTheme(themeName);
    }
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
        animationType="fade"
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
          <Animated.View
            className="flex-1 items-center justify-center p-4"
            style={{
              backgroundColor: getModalBackdropColor(theme, 0.88),
              opacity: backdropAnim,
            }}
          >
            <Animated.View
              className="w-11/12 max-w-md rounded-3xl p-8"
              style={{
                opacity: modalOpacityAnim,
                transform: [{ scale: modalScaleAnim }],
                backgroundColor: theme.colors.bg.light,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {/* Header - always visible */}
              <View className="flex-row items-center justify-between mb-6">
                <Text
                  className="text-2xl font-semibold"
                  style={{ color: theme.colors.text.DEFAULT }}
                >
                  {showThemePicker ? "Choose Theme" : "Settings"}
                </Text>
                <Pressable
                  onPress={showThemePicker ? handleCloseThemePicker : onClose}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.5 : 1,
                    transform: [{ scale: pressed ? 0.9 : 1 }],
                  })}
                >
                  <Icon
                    name="close"
                    size={20}
                    color={theme.colors.text.muted}
                  />
                </Pressable>
              </View>

              {/* Content - animated swap */}
              <Animated.View
                style={{
                  opacity: contentOpacityAnim,
                }}
              >
                {showThemePicker ? (
                  /* Theme Picker Content */
                  <>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      <View className="flex-row flex-wrap gap-3 justify-between">
                        {themes.map((themeOption) => {
                          const isSelected = currentTheme === themeOption.name;
                          return (
                            <Pressable
                              key={themeOption.name}
                              onPress={() =>
                                handleSelectTheme(themeOption.name)
                              }
                              className="w-[47%] min-h-[120px]"
                              style={({ pressed }) => ({
                                opacity: pressed ? 0.8 : 1,
                              })}
                            >
                              <View
                                className="rounded-lg border-2 p-4 w-full min-h-[120px]"
                                style={{
                                  borderColor: isSelected
                                    ? themeOption.colors.primary
                                    : themeOption.colors.border.muted,
                                  backgroundColor:
                                    themeOption.colors.bg.DEFAULT,
                                }}
                              >
                                <View className="mb-3">
                                  <Text
                                    className="text-base font-semibold"
                                    style={{
                                      color: themeOption.colors.text.DEFAULT,
                                    }}
                                  >
                                    {themeOption.displayName}
                                  </Text>
                                </View>

                                {/* Color Swatches */}
                                <View className="flex-row flex-wrap gap-1.5">
                                  <View
                                    className="rounded-full w-6 h-6"
                                    style={{
                                      backgroundColor:
                                        themeOption.colors.primary,
                                    }}
                                  />
                                  <View
                                    className="rounded-full w-6 h-6"
                                    style={{
                                      backgroundColor:
                                        themeOption.colors.secondary,
                                    }}
                                  />
                                  <View
                                    className="rounded-full w-6 h-6"
                                    style={{
                                      backgroundColor:
                                        themeOption.colors.border.DEFAULT,
                                    }}
                                  />
                                </View>

                                {/* Selected Indicator */}
                                {isSelected && (
                                  <View className="absolute top-2 right-2">
                                    <Icon
                                      name="check"
                                      size={20}
                                      color={themeOption.colors.primary}
                                    />
                                  </View>
                                )}
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    </ScrollView>

                    <View className="mt-8">
                      <Text
                        className="text-xs text-center"
                        style={{ color: theme.colors.text.muted }}
                      >
                        Theme changes apply instantly
                      </Text>
                    </View>
                  </>
                ) : (
                  /* Settings Content */
                  <>
                    {/* Your Code */}
                    <View className="mb-8">
                      <Text
                        className="mb-3 text-sm font-medium"
                        style={{ color: theme.colors.text.muted }}
                      >
                        Your Code
                      </Text>
                      <View
                        className="rounded-xl px-4 py-3.5"
                        style={{
                          backgroundColor: theme.colors.bg.DEFAULT,
                        }}
                      >
                        <View className="flex-row items-center justify-between">
                          <Text
                            className="text-lg font-semibold tracking-widest"
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
                              <View
                                className="absolute items-center justify-center"
                                style={{ width: 20, height: 20 }}
                              >
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
                                  <Icon
                                    name="check"
                                    size={20}
                                    color={theme.colors.success}
                                  />
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
                    <View className="mb-8">
                      <Text
                        className="mb-3 text-sm font-medium"
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
                            className="rounded-xl text-base"
                            style={{
                              backgroundColor: theme.colors.bg.DEFAULT,
                              color: theme.colors.text.DEFAULT,
                              paddingHorizontal: 16,
                              paddingVertical: 14,
                              textAlignVertical: "center",
                              height: 48,
                            }}
                            maxLength={50}
                          />
                          <View className="flex-row mt-3" style={{ gap: 12 }}>
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
                          className="flex-row items-center justify-between rounded-xl px-4 py-3.5"
                          style={{
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
                            <Icon
                              name="edit"
                              size={20}
                              color={theme.colors.text.muted}
                            />
                          </Pressable>
                        </View>
                      )}
                    </View>

                    {/* Connection Status */}
                    <View className="mb-8">
                      <Text
                        className="mb-3 text-sm font-medium"
                        style={{ color: theme.colors.text.muted }}
                      >
                        Connection Status
                      </Text>
                      {isLoading && !pairedDevice ? (
                        <View
                          className="rounded-xl px-4 py-3.5"
                          style={{
                            backgroundColor: theme.colors.bg.DEFAULT,
                          }}
                        >
                          <View
                            className="h-4 rounded mb-2"
                            style={{
                              backgroundColor: theme.colors.border.muted,
                              opacity: 0.5,
                              width: "60%",
                            }}
                          />
                          <View
                            className="h-3 rounded"
                            style={{
                              backgroundColor: theme.colors.border.muted,
                              opacity: 0.3,
                              width: "40%",
                            }}
                          />
                        </View>
                      ) : pairedDevice ? (
                        <View
                          className="rounded-xl px-4 py-3.5"
                          style={{
                            backgroundColor: theme.colors.bg.DEFAULT,
                          }}
                        >
                          <Text
                            className="text-sm mb-1"
                            style={{ color: theme.colors.text.muted }}
                          >
                            Connected to:
                          </Text>
                          <Text
                            className="text-base font-medium mb-1"
                            style={{ color: theme.colors.text.DEFAULT }}
                          >
                            Device {pairedDevice.code}
                          </Text>
                          <Text
                            className="text-xs"
                            style={{ color: theme.colors.text.muted }}
                          >
                            Connected{" "}
                            {new Date(
                              pairedDevice.created_at
                            ).toLocaleDateString()}
                          </Text>
                        </View>
                      ) : (
                        <View
                          className="rounded-xl px-4 py-3.5"
                          style={{
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
                    <View className="gap-3">
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
                        />
                      ) : (
                        <Button
                          title="Pair with Partner"
                          onPress={handlePairNew}
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
                      <View
                        className="flex-row justify-center"
                        style={{ gap: 16 }}
                      >
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light
                            );
                            handleOpenThemePicker();
                          }}
                          className="rounded-lg px-4 py-2 items-center justify-center min-w-[80px]"
                          style={({ pressed }) => ({
                            opacity: pressed ? 0.8 : 1,
                            backgroundColor: theme.colors.bg.DEFAULT,
                          })}
                        >
                          <Icon
                            name="palette"
                            size={18}
                            color={theme.colors.text.muted}
                          />
                          <Text
                            className="mt-1 text-xs font-medium"
                            style={{ color: theme.colors.text.muted }}
                          >
                            Theme
                          </Text>
                        </Pressable>
                      </View>
                      {/* App Version */}
                      <Text
                        className="text-center mt-4 text-xs"
                        style={{ color: theme.colors.text.muted }}
                      >
                        Version {Constants.expoConfig?.version || "1.1.1"}
                      </Text>
                    </View>
                  </>
                )}
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </SafeAreaView>
      </Modal>

      <PairingModal
        visible={showPairingModal}
        onClose={handlePairingComplete}
      />
    </>
  );
}
