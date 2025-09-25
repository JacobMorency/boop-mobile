import { useState } from "react";
import { View, Text, Modal, Button, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type PairingModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function PairingModal({ visible, onClose }: PairingModalProps) {
  const myCode = "ABCD-1234";
  const [otherCode, setOtherCode] = useState("");
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
                title="Connect"
                onPress={() => {
                  onClose();
                }}
                disabled={!otherCode}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
