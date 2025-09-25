import { useState } from "react";
import {
  View,
  Text,
  Modal,
  Button,
  SafeAreaView,
  TextInput,
} from "react-native";

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
          <View className="w-11/12 rounded-2xl bg-white p-6 dark:bg-neutral-900">
            <Text className="mb-4 text-xl font-semibold text-black dark:text-white">
              Pairing
            </Text>
            <View className="mb-4">
              <Text className="mb-1 text-sm text-neutral-600 dark:text-neutral-300">
                Your code
              </Text>
              <View className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
                <Text className="text-base tracking-widest text-black dark:text-white">
                  {myCode}
                </Text>
              </View>
            </View>
            <View className="mb-6">
              <Text className="mb-1 text-sm text-neutral-600 dark:text-neutral-300">
                Enter partner code
              </Text>
              <TextInput
                value={otherCode}
                onChangeText={setOtherCode}
                placeholder="XXXX-XXXX"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                autoCorrect={false}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base text-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
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
