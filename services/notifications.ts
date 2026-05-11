import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const ANDROID_CHANNEL_ID = "meal-reminders";

function clampHour(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(23, Math.max(0, Math.trunc(value)));
}

function clampMinute(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(59, Math.max(0, Math.trunc(value)));
}

function getProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra;
  if (extra && typeof extra === "object") {
    const eas = (extra as Record<string, unknown>).eas;
    if (eas && typeof eas === "object") {
      const projectId = (eas as Record<string, unknown>).projectId;
      if (typeof projectId === "string" && projectId.length > 0) {
        return projectId;
      }
    }
  }

  const easConfig = (Constants as { easConfig?: { projectId?: unknown } }).easConfig;
  if (easConfig && typeof easConfig.projectId === "string" && easConfig.projectId.length > 0) {
    return easConfig.projectId;
  }

  return undefined;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Meal reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#7F77DD",
    sound: "default",
    enableVibrate: true,
  });
}

export async function requestPermission(): Promise<string | null> {
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== "granted") {
    return null;
  }

  try {
    if (!Device.isDevice) {
      return null;
    }

    const projectId = getProjectId();
    const tokenResult = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    return tokenResult.data;
  } catch {
    return null;
  }
}

export async function scheduleMealReminder(hour: number, minute: number): Promise<string> {
  await ensureAndroidChannel();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "PRAXIS",
      body: "Hora de registrar sua refeição — 30s e está feito",
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: clampHour(hour),
      minute: clampMinute(minute),
    },
  });
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
