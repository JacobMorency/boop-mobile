import { useState, useEffect } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/header";
import BoopButton from "@/components/boop-button";
import PairingModal from "@/components/pairing-modal";
import { DeviceService } from "@/lib/deviceService";

export default function Index() {
  const [isPairingVisible, setIsPairingVisible] = useState(false);

  // Initialize device service on app start
  useEffect(() => {
    DeviceService.initialize();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <Header title="Boop" onPressSettings={() => setIsPairingVisible(true)} />
      <View className="flex-1 items-center justify-center">
        <BoopButton />
      </View>
      <PairingModal
        visible={isPairingVisible}
        onClose={() => setIsPairingVisible(false)}
      />
    </SafeAreaView>
  );
}
