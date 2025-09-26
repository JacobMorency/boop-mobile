import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class PushNotificationService {
  // Request permissions and get push token
  static async registerForPushNotifications(): Promise<string | null> {
    let token: string | null = null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return null;
      }

      try {
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;
        if (!projectId) {
          throw new Error("Project ID not found");
        }

        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log("Push token:", token);
      } catch (error) {
        console.error("Error getting push token:", error);
        return null;
      }
    } else {
      console.log("Must use physical device for Push Notifications");
    }

    return token;
  }

  // Send a push notification to a specific device
  static async sendPushNotification(
    expoPushToken: string,
    title: string,
    body: string
  ) {
    const message = {
      to: expoPushToken,
      sound: "default",
      title: title,
      body: body,
      data: { type: "boop" },
    };

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log("Push notification sent:", result);
      return result;
    } catch (error) {
      console.error("Error sending push notification:", error);
      throw error;
    }
  }

  // Listen for notifications when app is in foreground
  static addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  // Listen for notification responses (when user taps notification)
  static addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Remove all listeners
  static removeAllListeners() {
    Notifications.removeAllNotificationListeners();
  }
}
