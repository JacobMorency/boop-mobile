import { useState, useEffect } from "react";
import { View, Text, Modal, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PurchaseService, PRODUCT_IDS } from "@/lib/purchaseService";
import { useTheme } from "@/lib/themeContext";
import Icon from "./ui/icon";
import Button from "./ui/button";
import Toast from "./ui/toast";

export type DonateModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function DonateModal({ visible, onClose }: DonateModalProps) {
  const { theme } = useTheme();
  const [productPrices, setProductPrices] = useState<Record<string, string>>({});
  const [purchasingProduct, setPurchasingProduct] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"error" | "success" | "info">("error");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (visible) {
      loadProductPrices();
      PurchaseService.initialize();
    }
  }, [visible]);

  const loadProductPrices = async () => {
    const donateProductIds = [
      PRODUCT_IDS.DONATE_SMALL,
      PRODUCT_IDS.DONATE_MEDIUM,
      PRODUCT_IDS.DONATE_LARGE,
    ];

    const result = await PurchaseService.getProducts(donateProductIds);
    if (result.success && result.products) {
      const prices: Record<string, string> = {};
      result.products.forEach((product) => {
        prices[product.productId] = product.price || "$2.99";
      });
      setProductPrices(prices);
    }
  };

  const showToastMessage = (message: string, type: "error" | "success" | "info" = "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleDonate = async (productId: string) => {
    setPurchasingProduct(productId);

    try {
      const result = await PurchaseService.purchaseProduct(productId);

      if (result.success) {
        showToastMessage("Thank you for your support! ❤️", "success");
        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        showToastMessage(result.error || "Failed to process donation", "error");
      }
    } catch (error) {
      showToastMessage("Failed to process donation", "error");
      console.error(error);
    } finally {
      setPurchasingProduct(null);
    }
  };

  const donationOptions = [
    {
      id: PRODUCT_IDS.DONATE_SMALL,
      label: "Small",
      emoji: "☕",
      defaultPrice: "$2.99",
    },
    {
      id: PRODUCT_IDS.DONATE_MEDIUM,
      label: "Medium",
      emoji: "🍕",
      defaultPrice: "$4.99",
    },
    {
      id: PRODUCT_IDS.DONATE_LARGE,
      label: "Large",
      emoji: "🎁",
      defaultPrice: "$9.99",
    },
  ];

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
                Support Boop
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

            <Text
              className="text-base mb-6 text-center"
              style={{ color: theme.colors.text.muted }}
            >
              Thank you for considering a donation! Your support helps keep Boop free and simple.
            </Text>

            <View className="gap-3">
              {donationOptions.map((option) => {
                const price = productPrices[option.id] || option.defaultPrice;
                const isPurchasing = purchasingProduct === option.id;

                return (
                  <Button
                    key={option.id}
                    title={
                      isPurchasing
                        ? "Processing..."
                        : `${option.emoji} ${option.label} - ${price}`
                    }
                    onPress={() => handleDonate(option.id)}
                    disabled={isPurchasing || !!purchasingProduct}
                    loading={isPurchasing}
                  />
                );
              })}
            </View>

            <View className="mt-6">
              <Button
                title="Cancel"
                onPress={onClose}
                variant="secondary"
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

