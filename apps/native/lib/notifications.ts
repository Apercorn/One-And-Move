import * as Notifications from 'expo-notifications';
import * as Battery from 'expo-battery';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token for push notification!');
    return null;
  }
  
  // You would typically use this token to register with your DB/Backend
  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('Push Token Generated:', token);

  return token;
}

export async function checkBatteryLevelAndAlert() {
  const batteryLevel = await Battery.getBatteryLevelAsync();
  
  // If battery is below 20%
  if (batteryLevel > 0 && batteryLevel <= 0.2) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Low Battery Warning 🔋",
        body: "Your device battery is low. Consider pausing crowdsourced location sharing to save power.",
      },
      trigger: null, // trigger immediately
    });
  }
}

// Set up an occasional battery check
let batteryInterval: ReturnType<typeof setInterval> | null = null;
export function startBatteryMonitoring() {
  if (batteryInterval) return;
  // Check every 30 mins (30 * 60 * 1000)
  batteryInterval = setInterval(checkBatteryLevelAndAlert, 1800000);
}

export function stopBatteryMonitoring() {
  if (batteryInterval) {
    clearInterval(batteryInterval);
    batteryInterval = null;
  }
}
