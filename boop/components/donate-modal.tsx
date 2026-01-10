import { useState, useEffect, useRef } from "react";
import { View, Text, Modal, Pressable, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PurchaseService, PRODUCT_IDS } from "@/lib/purchaseService";
import { useTheme } from "@/lib/themeContext";
import { getModalBackdropColor } from "@/lib/themeService";
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

  // Animation refs for modal entrance
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      loadProductPrices();
      PurchaseService.initialize();
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
      // Reset animations
      backdropAnim.setValue(0);
      modalOpacityAnim.setValue(0);
      modalScaleAnim.setValue(0.95);
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
        // Close modal after toast is shown - toast handles its own timing
        // For now, close immediately after showing success
        onClose();
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
            <View className="flex-row items-center justify-between mb-6">
              <Text
                className="text-2xl font-semibold"
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
              className="text-base mb-8 text-center"
              style={{ color: theme.colors.text.muted }}
            >
              Thank you for considering a donation! Your support helps keep Boop free and simple.
            </Text>

            <View className="gap-3 mb-8">
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

            <Button
              title="Cancel"
              onPress={onClose}
              variant="secondary"
            />
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

