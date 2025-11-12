import AsyncStorage from "@react-native-async-storage/async-storage";

// Dynamically import to handle case where native module isn't available
let InAppPurchases: typeof import("expo-in-app-purchases") | null = null;

try {
  const module = require("expo-in-app-purchases");
  // Check if the module has the required methods (not just an empty object)
  if (module && typeof module.isAvailableAsync === "function") {
    InAppPurchases = module;
  } else {
    console.warn(
      "expo-in-app-purchases native module not properly loaded. IAP features will be disabled. " +
      "Rebuild your app with 'npx expo run:ios' or 'npx expo run:android' to enable IAP."
    );
  }
} catch (error) {
  console.warn(
    "expo-in-app-purchases native module not available. IAP features will be disabled. " +
    "Rebuild your app with 'npx expo run:ios' or 'npx expo run:android' to enable IAP."
  );
}

// Product IDs - These must match what you configure in App Store Connect and Google Play Console
export const PRODUCT_IDS = {
  // Themes (non-consumable)
  THEME_BLUE: "theme_blue",
  THEME_GREEN: "theme_green",
  THEME_PINK: "theme_pink",
  THEME_ORANGE: "theme_orange",
  THEME_PURPLE: "theme_purple",
  
  // Donations (consumable)
  DONATE_SMALL: "donate_small", // $2.99
  DONATE_MEDIUM: "donate_medium", // $4.99
  DONATE_LARGE: "donate_large", // $9.99
} as const;

const PURCHASED_THEMES_KEY = "boop_purchased_themes";

export class PurchaseService {
  private static isInitialized = false;
  private static purchasedThemes: Set<string> = new Set();
  private static purchaseListeners: Set<() => void> = new Set();

  // Initialize the purchase service
  static async initialize(): Promise<{ success: boolean; error?: string }> {
    if (this.isInitialized) {
      return { success: true };
    }

    // Check if native module is available
    if (!InAppPurchases) {
      console.warn("IAP native module not available - running in development mode");
      // Still load purchased themes from storage (for testing)
      await this.loadPurchasedThemes();
      return { success: false, error: "IAP requires a development build. Run 'npx expo run:ios' or 'npx expo run:android'" };
    }

    try {
      // Connect to the store
      const isAvailable = await InAppPurchases.isAvailableAsync();
      if (!isAvailable) {
        return { success: false, error: "In-app purchases are not available" };
      }

      // Set up purchase listener
      InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }) => {
        if (responseCode === InAppPurchases.IAPResponseCode.OK) {
          results?.forEach((purchase) => {
            this.handlePurchase(purchase);
          });
        } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
          console.log("User canceled the purchase");
        } else {
          console.error("Purchase error:", errorCode);
        }
      });

      // Load purchased themes from storage
      await this.loadPurchasedThemes();

      this.isInitialized = true;
      return { success: true };
    } catch (error) {
      console.error("Failed to initialize purchases:", error);
      return { success: false, error: "Failed to initialize purchases" };
    }
  }

  // Load purchased themes from AsyncStorage
  private static async loadPurchasedThemes(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(PURCHASED_THEMES_KEY);
      if (stored) {
        const themes = JSON.parse(stored) as string[];
        this.purchasedThemes = new Set(themes);
      }
    } catch (error) {
      console.error("Failed to load purchased themes:", error);
    }
  }

  // Save purchased themes to AsyncStorage
  private static async savePurchasedThemes(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        PURCHASED_THEMES_KEY,
        JSON.stringify(Array.from(this.purchasedThemes))
      );
    } catch (error) {
      console.error("Failed to save purchased themes:", error);
    }
  }

  // Handle a completed purchase
  private static async handlePurchase(purchase: InAppPurchases.InAppPurchase): Promise<void> {
    try {
      // Check if it's a theme purchase
      const themeProductIds = Object.values(PRODUCT_IDS).filter((id) =>
        id.startsWith("theme_")
      );
      
      let themeUnlocked = false;
      if (themeProductIds.includes(purchase.productId)) {
        // Unlock the theme
        this.purchasedThemes.add(purchase.productId);
        await this.savePurchasedThemes();
        themeUnlocked = true;
      }

      // Finish the transaction
      await InAppPurchases.finishTransactionAsync(purchase, true);
      
      // Notify listeners after transaction is finished
      if (themeUnlocked) {
        this.purchaseListeners.forEach((listener) => listener());
      }
    } catch (error) {
      console.error("Failed to handle purchase:", error);
    }
  }

  // Check if a theme is purchased/unlocked
  static isThemePurchased(themeProductId: string): boolean {
    // "lilac" is free (default theme)
    if (themeProductId === "lilac") return true;
    
    return this.purchasedThemes.has(themeProductId);
  }

  // Get all purchased themes
  static getPurchasedThemes(): string[] {
    return Array.from(this.purchasedThemes);
  }

  // Purchase a product
  static async purchaseProduct(
    productId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!InAppPurchases) {
      return { success: false, error: "IAP requires a development build. Run 'npx expo run:ios' or 'npx expo run:android'" };
    }

    if (!this.isInitialized) {
      const initResult = await this.initialize();
      if (!initResult.success) {
        return initResult;
      }
    }

    try {
      await InAppPurchases.purchaseItemAsync(productId);
      // The purchase will be handled by the purchase listener
      return { success: true };
    } catch (error) {
      console.error("Failed to purchase product:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to purchase";
      return { success: false, error: errorMessage };
    }
  }

  // Get product details
  static async getProducts(
    productIds: string[]
  ): Promise<{ success: boolean; products?: any[]; error?: string }> {
    if (!InAppPurchases) {
      // Return mock products for development
      return {
        success: true,
        products: productIds.map((id) => ({
          productId: id,
          price: id.includes("donate_small") ? "$2.99" : id.includes("donate_medium") ? "$4.99" : id.includes("donate_large") ? "$9.99" : "$0.99",
        })),
      };
    }

    if (!this.isInitialized) {
      const initResult = await this.initialize();
      if (!initResult.success) {
        return initResult;
      }
    }

    try {
      const { responseCode, results } = await InAppPurchases.getProductsAsync(productIds);
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
        return { success: true, products: results };
      } else {
        return { success: false, error: "Failed to fetch products" };
      }
    } catch (error) {
      console.error("Failed to get products:", error);
      return { success: false, error: "Failed to fetch products" };
    }
  }

  // Restore purchases (for users who reinstalled the app)
  static async restorePurchases(): Promise<{ success: boolean; restoredCount?: number; error?: string }> {
    if (!InAppPurchases) {
      return { success: false, error: "IAP requires a development build" };
    }

    if (!this.isInitialized) {
      const initResult = await this.initialize();
      if (!initResult.success) {
        return initResult;
      }
    }

    try {
      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
        let restoredCount = 0;
        for (const purchase of results) {
          const themeProductIds = Object.values(PRODUCT_IDS).filter((id) =>
            id.startsWith("theme_")
          );
          
          if (themeProductIds.includes(purchase.productId)) {
            if (!this.purchasedThemes.has(purchase.productId)) {
              this.purchasedThemes.add(purchase.productId);
              restoredCount++;
            }
          }
        }
        
        if (restoredCount > 0) {
          await this.savePurchasedThemes();
        }
        
        return { success: true, restoredCount };
      } else {
        return { success: false, error: "Failed to restore purchases" };
      }
    } catch (error) {
      console.error("Failed to restore purchases:", error);
      return { success: false, error: "Failed to restore purchases" };
    }
  }

  // Subscribe to purchase updates
  static subscribeToPurchases(listener: () => void): () => void {
    this.purchaseListeners.add(listener);
    return () => {
      this.purchaseListeners.delete(listener);
    };
  }
}

