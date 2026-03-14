'use client';

import React, { useMemo, useState } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Bus } from 'lucide-react';

export default function WebMap() {
  const [viewState, setViewState] = useState({
    longitude: -76.8099,
    latitude: 18.0179,
    zoom: 12
  });

  // Mock data for ORPC endpoints
  const mockVehicles = [
    { id: '1', type: 'jutc', lat: 18.0170, lng: -76.8050, name: 'JUTC 32' },
    { id: '2', type: 'robot_taxi', lat: 18.0160, lng: -76.8020, name: 'Robot Taxi A' }
  ];

  const mockRoutePolyline = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [
        [-76.8099, 18.0179],
        [-76.8000, 18.0150]
      ]
    }
  };

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden relative shadow-lg">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "pk.eyJ1IjoiZHVtbXkiLCJhIjoiY2xhMTI3bHJnMGEwaDNwdGVybGwwMjJqNiJ9.dummy"}
      >
        <NavigationControl position="top-right" />

        {/* Vehicles */}
        {mockVehicles.map(v => (
          <Marker key={v.id} longitude={v.lng} latitude={v.lat} anchor="bottom">
            <div className="flex flex-col items-center bg-white p-1 rounded-full shadow-md">
              {v.type === 'jutc' ? (
                <Bus className="text-orange-500" size={20} />
              ) : (
                <MapPin className="text-green-500" size={20} />
              )}
            </div>
          </Marker>
        ))}

        {/* Polyline */}
        <Source id="route" type="geojson" data={mockRoutePolyline as any}>
          <Layer 
            id="route-line" 
            type="line" 
            paint={{
              'line-color': '#3b82f6',
              'line-width': 4
            }} 
          />
        </Source>
      </Map>

      <div className="absolute bottom-6 left-6 bg-white p-4 rounded-lg shadow-xl max-w-sm">
        <h3 className="font-bold text-lg mb-1 text-gray-800">Live Web Map</h3>
        <p className="text-sm text-gray-600 mb-3">Viewing recommended transit combos and live bus locations.</p>
        <button className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition">
          Simulate Search
        </button>
      </div>
    </div>
  );
}
