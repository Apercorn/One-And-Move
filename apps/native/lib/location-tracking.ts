import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TRACKING = 'background-location-task';

TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }) => {
  if (error) {
    console.error('Task manager error:', error);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const latestLocation = locations[0];
    
    if (latestLocation) {
      // In production, sync this to the global TRPC/ORPC context to send to server.
      // Example: 
      // await orpcClient.vehicles.reportStatus({ 
      //   officialNumber: 'JUTC-53', 
      //   lat: latestLocation.coords.latitude, 
      //   lng: latestLocation.coords.longitude,
      //   fullness: 50,
      //   speed: latestLocation.coords.speed
      // });
      console.log('Background Location Ping:', latestLocation.coords);
    }
  }
});

export const startLocationTracking = async () => {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus === 'granted') {
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus === 'granted') {
      await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 10,
        showsBackgroundLocationIndicator: true,
      });
      console.log('Started background tracking array');
    }
  }
};

export const stopLocationTracking = async () => {
  const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING);
  if (isTracking) {
    await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
    console.log('Stopped background tracking');
  }
};
