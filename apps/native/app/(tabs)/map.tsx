import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, Button } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { MapPin, Navigation } from 'lucide-react-native';
// API client imports would go here: import { trpc } from '../utils/trpc';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Mock routes data that would typically come from our ORPC getBestRoute query
  const mockRoutePolyline = [
    { latitude: 18.0179, longitude: -76.8099 },
    { latitude: 18.0150, longitude: -76.8000 },
  ];
  
  const mockVehicles = [
    { id: '1', type: 'jutc', lat: 18.0170, lng: -76.8050, name: 'JUTC 32' },
    { id: '2', type: 'robot_taxi', lat: 18.0160, lng: -76.8020, name: 'Robot Taxi A' }
  ];

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 18.0179,
          longitude: -76.8099,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={!!location}
      >
        {location && (
          <Marker 
            coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
            title="You"
          >
            <Navigation color="blue" size={24} />
          </Marker>
        )}

        {/* Render Vehicles */}
        {mockVehicles.map(v => (
          <Marker
            key={v.id}
            coordinate={{ latitude: v.lat, longitude: v.lng }}
            title={v.name}
            description={v.type === 'jutc' ? 'Bus Arrival in 5 min' : 'Taxi Nearby'}
          >
            <MapPin color={v.type === 'jutc' ? 'orange' : 'green'} size={24} />
          </Marker>
        ))}

        {/* Route Polyline (Hybrid Route) */}
        <Polyline 
          coordinates={mockRoutePolyline}
          strokeColor="#3b82f6" 
          strokeWidth={4} 
        />
      </MapView>

      <View style={styles.card}>
        <Text style={styles.title}>Live Hybrid Routes</Text>
        <Text style={styles.subtitle}>Showing recommended transit combinations nearby.</Text>
        <Button title="Report Crowding" onPress={() => console.log('Open report modal')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: width,
    height: height,
  },
  card: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  }
});
