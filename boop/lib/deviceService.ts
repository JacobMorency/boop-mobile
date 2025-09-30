import { supabase, Device, Pair } from "./supabase";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PushNotificationService } from "./pushNotificationService";

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
  ): Promise<{ deviceId: string; code: string; name: string }> {
    // If we already have device info, return it
    if (this.deviceId && this.deviceCode && this.deviceName) {
      return {
        deviceId: this.deviceId,
        code: this.deviceCode,
        name: this.deviceName,
      };
    }

    try {
      // Get push notification token
      const expoPushToken =
        await PushNotificationService.registerForPushNotifications();

      const { data, error } = await supabase
        .from("devices")
        .insert({
          name: name || "Anonymous",
          expo_push_token: expoPushToken,
          platform: Platform.OS as "ios" | "android" | "web",
        })
        .select()
        .single();

      if (error) throw error;

      this.deviceId = data.id;
      this.deviceCode = data.code;
      this.deviceName = data.name;

      // Store device info locally
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify({
          deviceId: data.id,
          code: data.code,
          name: data.name,
        })
      );

      return {
        deviceId: data.id,
        code: data.code,
        name: data.name,
      };
    } catch (error) {
      console.error("Failed to register device:", error);
      throw error;
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

      if (error) throw error;

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
  static async pairWithDevice(otherDeviceId: string): Promise<Pair | null> {
    if (!this.deviceId) {
      throw new Error("Device not registered");
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

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Failed to pair devices:", error);
      throw error;
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
        throw error;
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

  // Send a "boop" (ping)
  static async sendBoop(): Promise<boolean> {
    if (!this.deviceId) return false;

    const pairedDevice = await this.getPairedDevice();
    if (!pairedDevice) return false;

    try {
      // Insert the ping into database
      const { error } = await supabase.from("pings").insert({
        from_device: this.deviceId,
        to_device: pairedDevice.id,
      });

      if (error) throw error;

      // Send push notification if the paired device has a push token
      if (pairedDevice.expo_push_token) {
        try {
          const senderName = this.deviceName || "Someone";
          await PushNotificationService.sendPushNotification(
            pairedDevice.expo_push_token,
            "Boop!",
            `${senderName} is thinking of you! 💭`
          );
        } catch (pushError) {
          console.error("Failed to send push notification:", pushError);
          // Don't fail the boop if push notification fails
        }
      }

      return true;
    } catch (error) {
      console.error("Failed to send boop:", error);
      return false;
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

      if (error) throw error;

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
}
