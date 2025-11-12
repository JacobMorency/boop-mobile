import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ThemeService, Theme, ThemeName } from "@/lib/themeService";
// import { PurchaseService } from "@/lib/purchaseService"; // Commented out - IAP disabled for now
// import { THEME_PRODUCT_IDS } from "@/lib/themeService"; // Commented out - IAP disabled for now
import { useTheme } from "@/lib/themeContext";
import Icon from "@/components/ui/icon";
// import Toast from "@/components/ui/toast"; // Commented out - not needed without IAP
// import Button from "@/components/ui/button"; // Commented out - not needed without IAP

export default function ThemeScreen() {
  const router = useRouter();
  const { theme: currentThemeObj, themeName: currentThemeName, setTheme } = useTheme();
  const [themes, setThemes] = useState<Theme[]>([]);
  // IAP-related state commented out - all themes are free now
  // const [purchasedThemes, setPurchasedThemes] = useState<Set<string>>(new Set(["lilac"]));
  // const [productPrices, setProductPrices] = useState<Record<string, string>>({});
  // const [purchasingTheme, setPurchasingTheme] = useState<string | null>(null);
  // const [toastMessage, setToastMessage] = useState("");
  // const [toastType, setToastType] = useState<"error" | "success" | "info">("error");
  // const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    initializeScreen();
    
    // IAP subscription commented out - all themes are free now
    // Subscribe to purchase updates
    // const unsubscribe = PurchaseService.subscribeToPurchases(() => {
    //   const purchased = PurchaseService.getPurchasedThemes();
    //   const purchasedSet = new Set(["lilac", ...purchased]);
    //   setPurchasedThemes(purchasedSet);
    // });
    // return unsubscribe;
  }, []);

  const initializeScreen = async () => {
    setThemes(ThemeService.getAllThemes());
    
    // IAP initialization commented out - all themes are free now
    // Initialize purchase service
    // await PurchaseService.initialize();
    
    // Load purchased themes
    // const purchased = PurchaseService.getPurchasedThemes();
    // const purchasedSet = new Set(["lilac", ...purchased]);
    // setPurchasedThemes(purchasedSet);
    
    // Load product prices
    // await loadProductPrices();
  };

  // IAP functions commented out - all themes are free now
  // const loadProductPrices = async () => {
  //   const themeProductIds = Object.values(THEME_PRODUCT_IDS).filter(
  //     (id): id is string => id !== null
  //   );
  //   
  //   const result = await PurchaseService.getProducts(themeProductIds);
  //   if (result.success && result.products) {
  //     const prices: Record<string, string> = {};
  //     result.products.forEach((product) => {
  //       prices[product.productId] = product.price || "$0.99";
  //     });
  //     setProductPrices(prices);
  //   }
  // };

  // const showToastMessage = (message: string, type: "error" | "success" | "info" = "error") => {
  //   setToastMessage(message);
  //   setToastType(type);
  //   setShowToast(true);
  // };

  // const isThemePurchased = (themeName: ThemeName): boolean => {
  //   const productId = THEME_PRODUCT_IDS[themeName];
  //   if (!productId) return true; // Free theme (lilac)
  //   return purchasedThemes.has(productId);
  // };

  const handleSelectTheme = async (themeName: ThemeName) => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // All themes are now free - no purchase check needed
    await setTheme(themeName);
    // Theme will update automatically via context
  };

  // IAP purchase function commented out - all themes are free now
  // const handlePurchaseTheme = async (themeName: ThemeName) => {
  //   const productId = THEME_PRODUCT_IDS[themeName];
  //   if (!productId) return;

  //   setPurchasingTheme(productId);
  //   
  //   try {
  //     const result = await PurchaseService.purchaseProduct(productId);
  //     
  //     if (result.success) {
  //       // Purchase will be handled by the purchase listener
  //       // The listener will update purchasedThemes state and we'll switch themes
  //       // Wait a moment for the purchase to process
  //       setTimeout(() => {
  //         const purchased = PurchaseService.getPurchasedThemes();
  //         const purchasedSet = new Set(["lilac", ...purchased]);
  //         setPurchasedThemes(purchasedSet);
  //         
  //         // If theme is now purchased, switch to it
  //         if (purchasedSet.has(productId)) {
  //           const themeObj = themes.find((t) => t.name === themeName);
  //           if (themeObj) {
  //             setTheme(themeName);
  //             showToastMessage(`${themeObj.displayName} theme unlocked!`, "success");
  //           }
  //         }
  //       }, 1500);
  //     } else {
  //       showToastMessage(result.error || "Failed to purchase theme", "error");
  //     }
  //   } catch (error) {
  //     showToastMessage("Failed to purchase theme", "error");
  //     console.error(error);
  //   } finally {
  //     setPurchasingTheme(null);
  //   }
  // };

  return (
    <SafeAreaView 
      className="flex-1"
      style={{ backgroundColor: currentThemeObj.colors.bg.DEFAULT }}
    >
      {/* Toast commented out - not needed without IAP */}
      {/* <Toast
        message={toastMessage}
        type={toastType}
        visible={showToast}
        onHide={() => setShowToast(false)}
      /> */}
      {/* Header */}
      <View 
        className="flex-row items-center px-4 py-3"
        style={{ 
          borderBottomWidth: 1,
          borderBottomColor: currentThemeObj.colors.border.muted,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          className="mr-4 p-2"
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Icon name="arrow-back" size={24} color={currentThemeObj.colors.text.muted} />
        </Pressable>
        <Text 
          className="text-xl font-semibold"
          style={{ color: currentThemeObj.colors.text.DEFAULT }}
        >
          Choose Theme
        </Text>
      </View>

      {/* Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 gap-3">
          {themes.map((theme) => {
            const isSelected = currentThemeName === theme.name;
            // All themes are free now - no purchase checks needed
            // const isPurchased = isThemePurchased(theme.name);
            // const productId = THEME_PRODUCT_IDS[theme.name];
            // const price = productId ? productPrices[productId] : null;
            // const isPurchasing = purchasingTheme === productId;

            return (
              <View key={theme.name}>
                <Pressable
                  onPress={() => handleSelectTheme(theme.name)}
                  // All themes are enabled - no disabled state
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <View
                    style={{
                      borderRadius: 8,
                      padding: 16,
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.border.DEFAULT,
                      borderWidth: isSelected ? 3 : 2,
                      backgroundColor: theme.colors.bg.DEFAULT,
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-2">
                          <Text
                            className="text-base font-semibold"
                            style={{ color: theme.colors.text.DEFAULT }}
                          >
                            {theme.displayName}
                          </Text>
                          {/* Price tag commented out - all themes are free */}
                          {/* {!isPurchased && productId && (
                            <View
                              style={{
                                backgroundColor: theme.colors.primary,
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 4,
                              }}
                            >
                              <Text
                                className="text-xs font-semibold"
                                style={{ color: theme.colors.highlight }}
                              >
                                {price || "$0.99"}
                              </Text>
                            </View>
                          )} */}
                        </View>

                        {/* Color Swatches */}
                        <View className="flex-row gap-2">
                          <View
                            className="rounded-full w-6 h-6"
                            style={{
                              backgroundColor: theme.colors.primary,
                            }}
                          />
                          <View
                            className="rounded-full w-6 h-6"
                            style={{
                              backgroundColor: theme.colors.secondary,
                            }}
                          />
                          <View
                            className="rounded-full w-6 h-6"
                            style={{
                              backgroundColor: theme.colors.border.DEFAULT,
                            }}
                          />
                        </View>
                      </View>

                      {/* Selected Indicator - no lock icon needed */}
                      {isSelected && (
                        <View className="ml-4">
                          <Icon
                            name="check"
                            size={24}
                            color={theme.colors.primary}
                          />
                        </View>
                      )}
                      {/* Lock icon commented out - all themes are free */}
                      {/* {!isPurchased && (
                        <View className="ml-4">
                          <Icon
                            name="lock-closed"
                            size={24}
                            color={theme.colors.text.muted}
                          />
                        </View>
                      )} */}
                    </View>
                  </View>
                </Pressable>

                {/* Purchase Button commented out - all themes are free */}
                {/* {!isPurchased && productId && (
                  <View className="mt-2">
                    <Button
                      title={isPurchasing ? "Purchasing..." : `Purchase ${price || "$0.99"}`}
                      onPress={() => handlePurchaseTheme(theme.name)}
                      disabled={isPurchasing}
                      loading={isPurchasing}
                    />
                  </View>
                )} */}
              </View>
            );
          })}
        </View>

        <View className="px-4 pb-6">
          <Text 
            className="text-xs text-center"
            style={{ color: currentThemeObj.colors.text.muted }}
          >
            Theme changes apply instantly
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

