import { supabase, Device, Pair } from "./supabase";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PushNotificationService } from "./pushNotificationService";
import { handleError, isNetworkError } from "./errorHandler";

export class DeviceService {
  private static deviceId: string | null = null;
  private static deviceCode: string | null = null;
  private static deviceName: string | null = null;
  private static readonly STORAGE_KEY = "boop_device_info";

  // Initialize device info from storage
  static async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const deviceInfo = JSON.parse(stored);
        this.deviceId = deviceInfo.deviceId;
        this.deviceCode = deviceInfo.code;
        this.deviceName = deviceInfo.name;
      }
    } catch (error) {
      console.error("Failed to load device info:", error);
    }
  }

  // Register this device and get a pairing code (only if not already registered)
  static async registerDevice(
    name?: string
  ): Promise<{ success: boolean; deviceId?: string; code?: string; name?: string; error?: string }> {
    // If we already have device info, return it
    if (this.deviceId && this.deviceCode && this.deviceName) {
      return {
        success: true,
        deviceId: this.deviceId,
        code: this.deviceCode,
        name: this.deviceName,
      };
    }

    try {
      // Get push notification token
      const expoPushToken =
        await PushNotificationService.registerForPushNotifications();

      // Insert device with name
      const insertData: any = {
        expo_push_token: expoPushToken,
        platform: Platform.OS as "ios" | "android" | "web",
      };
      
      if (name) {
        insertData.name = name;
      }

      const { data, error } = await supabase
        .from("devices")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        const appError = handleError(error);
        return { success: false, error: appError.userMessage };
      }

      this.deviceId = data.id;
      this.deviceCode = data.code;
      this.deviceName = data.name || name || "Anonymous";

      // Store device info locally
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify({
          deviceId: data.id,
          code: data.code,
          name: this.deviceName,
        })
      );

      return {
        success: true,
        deviceId: data.id,
        code: data.code,
        name: this.deviceName,
      };
    } catch (error) {
      console.error("Failed to register device:", error);
      // Check if it's a schema error (missing name column)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("name") && errorMessage.includes("column")) {
        console.warn(
          "Database schema missing 'name' column. Please run the migration: add-name-migration.sql"
        );
        // Try to continue without name if we have deviceId and code
        if (this.deviceId && this.deviceCode) {
          this.deviceName = name || "Anonymous";
          return {
            success: true,
            deviceId: this.deviceId,
            code: this.deviceCode,
            name: this.deviceName,
          };
        }
      }
      return { success: false, error: "Failed to register device" };
    }
  }

  // Get current device info
  static getCurrentDevice(): {
    deviceId: string | null;
    code: string | null;
    name: string | null;
  } {
    return {
      deviceId: this.deviceId,
      code: this.deviceCode,
      name: this.deviceName,
    };
  }

  // Update device name
  static async updateDeviceName(name: string): Promise<boolean> {
    if (!this.deviceId) return false;

    try {
      const { error } = await supabase
        .from("devices")
        .update({ name })
        .eq("id", this.deviceId);

      if (error) {
        // Check if it's a schema error (missing name column)
        const errorMessage = error.message || String(error);
        if (errorMessage.includes("name") && errorMessage.includes("column")) {
          console.warn(
            "Database schema missing 'name' column. Please run the migration: add-name-migration.sql"
          );
          // Still update local storage even if DB update fails
          this.deviceName = name;
          const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
          if (stored) {
            const deviceInfo = JSON.parse(stored);
            deviceInfo.name = name;
            await AsyncStorage.setItem(
              this.STORAGE_KEY,
              JSON.stringify(deviceInfo)
            );
          }
          // Return false but don't throw - app can still function
          return false;
        }
        console.error("Failed to update device name:", error);
        return false;
      }

      this.deviceName = name;

      // Update local storage
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const deviceInfo = JSON.parse(stored);
        deviceInfo.name = name;
        await AsyncStorage.setItem(
          this.STORAGE_KEY,
          JSON.stringify(deviceInfo)
        );
      }

      return true;
    } catch (error) {
      console.error("Failed to update device name:", error);
      return false;
    }
  }

  // Find a device by its code
  static async findDeviceByCode(code: string): Promise<Device | null> {
    try {
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .eq("code", code.toUpperCase())
        .single();

      if (error) {
        if (error.code === "PGRST116") return null; // No rows found
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Failed to find device:", error);
      return null;
    }
  }

  // Pair with another device
  static async pairWithDevice(otherDeviceId: string): Promise<{ success: boolean; pair?: Pair; error?: string }> {
    if (!this.deviceId) {
      return { success: false, error: "Device not registered" };
    }

    try {
      const { data, error } = await supabase
        .from("pairs")
        .insert({
          device_a: this.deviceId,
          device_b: otherDeviceId,
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to pair devices:", error);
        // Check if devices are already paired
        const errorMessage = error.message || String(error);
        if (errorMessage.includes("unique") || errorMessage.includes("duplicate")) {
          return { success: false, error: "Devices are already paired" };
        }
        return { success: false, error: "Failed to pair devices" };
      }

      return { success: true, pair: data };
    } catch (error) {
      console.error("Failed to pair devices:", error);
      return { success: false, error: "Failed to pair devices" };
    }
  }

  // Get paired device
  static async getPairedDevice(): Promise<Device | null> {
    if (!this.deviceId) return null;

    try {
      const { data, error } = await supabase
        .from("pairs")
        .select(
          `
          *,
          device_a_info:devices!pairs_device_a_fkey(*),
          device_b_info:devices!pairs_device_b_fkey(*)
        `
        )
        .or(`device_a.eq.${this.deviceId},device_b.eq.${this.deviceId}`)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null; // No rows found
        console.error("Failed to get paired device:", error);
        return null;
      }

      // Return the other device (not the current one)
      const otherDevice =
        data.device_a === this.deviceId
          ? data.device_b_info
          : data.device_a_info;

      return otherDevice;
    } catch (error) {
      console.error("Failed to get paired device:", error);
      return null;
    }
  }

  // Check rate limit (20 boops per hour)
  static async checkRateLimit(): Promise<{ allowed: boolean; message?: string; secondsRemaining?: number }> {
    if (!this.deviceId) {
      return { allowed: false, message: "Device not registered" };
    }

    try {
      // Get pings from the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from("pings")
        .select("created_at")
        .eq("from_device", this.deviceId)
        .gte("created_at", oneHourAgo)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to check rate limit:", error);
        // Allow boop if rate limit check fails (fail open)
        return { allowed: true };
      }

      const boopCount = data?.length || 0;
      const maxBoopsPerHour = 20;

      if (boopCount >= maxBoopsPerHour) {
        // Find the oldest ping in the current window
        const oldestPing = data?.[data.length - 1];
        if (oldestPing?.created_at) {
          const oldestPingTime = new Date(oldestPing.created_at).getTime();
          const oneHourFromOldest = oldestPingTime + 60 * 60 * 1000;
          const now = Date.now();
          const secondsRemaining = Math.ceil((oneHourFromOldest - now) / 1000);
          
          const minutes = Math.floor(secondsRemaining / 60);
          const seconds = secondsRemaining % 60;
          
          return {
            allowed: false,
            message: `Rate limit reached. Try again in ${minutes}m ${seconds}s`,
            secondsRemaining,
          };
        }
        
        return {
          allowed: false,
          message: "You're booping too fast! Please wait a moment.",
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error("Failed to check rate limit:", error);
      // Allow boop if rate limit check fails (fail open)
      return { allowed: true };
    }
  }

  // Send a "boop" (ping)
  static async sendBoop(): Promise<{ success: boolean; error?: string; rateLimitSecondsRemaining?: number }> {
    if (!this.deviceId) {
      return { success: false, error: "Device not registered" };
    }

    const pairedDevice = await this.getPairedDevice();
    if (!pairedDevice) {
      return { success: false, error: "No paired device found" };
    }

    // Check rate limit
    const rateLimitCheck = await this.checkRateLimit();
    if (!rateLimitCheck.allowed) {
      return { 
        success: false, 
        error: rateLimitCheck.message,
        rateLimitSecondsRemaining: rateLimitCheck.secondsRemaining,
      };
    }

    try {
      // Insert the ping into database
      const { error } = await supabase.from("pings").insert({
        from_device: this.deviceId,
        to_device: pairedDevice.id,
      });

      if (error) {
        const appError = handleError(error);
        return { success: false, error: appError.userMessage };
      }

      // Send push notification if the paired device has a push token
      if (pairedDevice.expo_push_token) {
        try {
          const senderName = this.deviceName || "Someone";
          await PushNotificationService.sendPushNotification(
            pairedDevice.expo_push_token,
            senderName,
            "I'm thinking of you! 💭"
          );
        } catch (pushError) {
          // Don't fail the boop if push notification fails
          // Log for debugging but don't surface to user
          if (__DEV__) {
            console.error("Failed to send push notification:", pushError);
          }
        }
      }

      return { success: true };
    } catch (error) {
      const appError = handleError(error);
      return { success: false, error: appError.userMessage };
    }
  }

  // Disconnect from current partner
  static async disconnectFromPartner(): Promise<boolean> {
    if (!this.deviceId) return false;

    try {
      const { error } = await supabase
        .from("pairs")
        .delete()
        .or(`device_a.eq.${this.deviceId},device_b.eq.${this.deviceId}`);

      if (error) {
        console.error("Failed to disconnect from partner:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to disconnect from partner:", error);
      return false;
    }
  }

  // Update last seen timestamp
  static async updateLastSeen(): Promise<void> {
    if (!this.deviceId) return;

    try {
      await supabase
        .from("devices")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", this.deviceId);
    } catch (error) {
      console.error("Failed to update last seen:", error);
    }
  }

  // Cleanup old pings (older than 90 days)
  // Note: Best practice is to run this server-side via Supabase cron jobs
  // This method is provided for manual cleanup if needed
  static async cleanupOldPings(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      // Call the database function
      const { data, error } = await supabase.rpc("cleanup_old_pings");

      if (error) {
        console.error("Failed to cleanup old pings:", error);
        return { 
          success: false, 
          error: "Failed to cleanup old pings" 
        };
      }

      const deletedCount = data && data.length > 0 ? data[0].deleted_count : 0;
      
      console.log(`Cleaned up ${deletedCount} old pings`);
      
      return { success: true, deletedCount: Number(deletedCount) };
    } catch (error) {
      console.error("Failed to cleanup old pings:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to cleanup old pings" 
      };
    }
  }
}
