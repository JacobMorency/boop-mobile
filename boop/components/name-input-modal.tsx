import { useState } from "react";
import { View, Text, Modal, Button, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DeviceService } from "@/lib/deviceService";

export type NameInputModalProps = {
  visible: boolean;
  onComplete: (name: string) => void;
};

export default function NameInputModal({
  visible,
  onComplete,
}: NameInputModalProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    setIsLoading(true);
    try {
      // Register device with the provided name
      await DeviceService.registerDevice(name.trim());
      onComplete(name.trim());
    } catch (error) {
      Alert.alert("Error", "Failed to set up your profile");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {}} // Prevent closing without name
    >
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center bg-black/50 p-4">
          <View className="w-11/12 rounded-2xl bg-bg-light p-6">
            <Text className="mb-2 text-2xl font-bold text-text">
              Welcome to Boop! 👋
            </Text>
            <Text className="mb-6 text-base text-text-muted">
              What should we call you? This name will appear in notifications
              when you boop someone.
            </Text>

            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-text-muted">
                Your name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                autoCorrect={false}
                className="rounded-lg border border-border bg-bg px-4 py-3 text-base text-text"
                maxLength={50}
                onSubmitEditing={handleSubmit}
                returnKeyType="done"
              />
            </View>

            <Button
              title={isLoading ? "Setting up..." : "Continue"}
              onPress={handleSubmit}
              disabled={!name.trim() || isLoading}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
