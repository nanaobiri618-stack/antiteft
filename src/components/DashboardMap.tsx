'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

function ChangeView({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat !== 0 || lng !== 0) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}

export default function DashboardMap({ devices, selectedDeviceId }: { devices: any[], selectedDeviceId?: string }) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const defaultCenter: [number, number] = [5.6037, -0.1870]; // Accra, Ghana as default

  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.error('Error getting location:', error),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);
  
  const center = selectedDevice && selectedDevice.current_lat && selectedDevice.current_lng
    ? [selectedDevice.current_lat, selectedDevice.current_lng] as [number, number]
    : devices.length > 0 && devices[0].current_lat && devices[0].current_lng
      ? [devices[0].current_lat, devices[0].current_lng] as [number, number]
      : defaultCenter;

  const activeDevices = devices.filter(d => 
    d.current_lat !== null && 
    d.current_lng !== null && 
    Math.abs(d.current_lat) > 0.0001 && 
    Math.abs(d.current_lng) > 0.0001
  );

  return (
    <div className="w-full h-full relative bg-zinc-950">
      <MapContainer 
        center={center} 
        zoom={13} 
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <ChangeView lat={center[0]} lng={center[1]} />

        {/* User Location Pulse */}
        {userLocation && (
          <>
            <Circle
              center={userLocation}
              radius={200}
              pathOptions={{ 
                fillColor: '#3b82f6', 
                fillOpacity: 0.1, 
                color: '#3b82f6', 
                weight: 1,
                className: 'animate-pulse' 
              }}
            />
            <Marker 
              position={userLocation}
              icon={L.divIcon({
                className: 'user-location-marker',
                html: `<div class="relative flex items-center justify-center">
                  <div class="absolute w-6 h-6 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                  <div class="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
                </div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })}
            >
              <Popup>
                <div className="text-zinc-900 p-1 font-bold text-[10px] uppercase">Your Location (Owner)</div>
              </Popup>
            </Marker>
          </>
        )}
        
        {activeDevices.map((device: any) => {
          const isEmergency = device.status && (device.status.includes('HYBRID') || device.status.includes('Lost') || device.status.includes('Emergency'));
          return (
            <Marker 
              key={device.id} 
              position={[device.current_lat, device.current_lng]}
              icon={L.divIcon({
                className: 'device-marker',
                html: `<div class="relative flex items-center justify-center">
                  ${isEmergency ? '<div class="absolute w-10 h-10 bg-red-600 rounded-full animate-ping opacity-40"></div>' : ''}
                  <div class="absolute w-6 h-6 ${isEmergency ? 'bg-red-500' : 'bg-slate-800'} rounded-full animate-pulse opacity-25"></div>
                  <div class="relative w-4 h-4 ${isEmergency ? 'bg-red-600' : 'bg-slate-900'} rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <div class="w-1 h-1 bg-white rounded-full"></div>
                  </div>
                </div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
              })}
            >
              <Popup>
                <div className="text-zinc-900 p-2 min-w-[150px]">
                  <p className="font-black text-xs uppercase tracking-tight mb-1 border-b pb-1 text-slate-900">{device.model || 'Node Fleet'}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${device.last_seen && new Date(device.last_seen).getTime() > Date.now() - 300000 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {device.last_seen ? formatDistanceToNow(new Date(device.last_seen), { addSuffix: true }) : 'Never seen'}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${isEmergency ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                      {isEmergency ? 'Emergency Tracking' : 'Secure Mode'}
                    </div>
                  </div>
                  <p className="text-[9px] text-zinc-400 font-mono mt-2 bg-zinc-50 p-1 rounded">SID: {device.id.slice(0, 16)}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.5); opacity: 0.1; }
          100% { transform: scale(1); opacity: 0.4; }
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 1rem;
          padding: 0;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .leaflet-popup-content {
          margin: 0;
        }
        .leaflet-popup-tip-container {
          display: none;
        }
        .leaflet-control-zoom {
          border: none !important;
          margin-top: 2rem !important;
          margin-left: 1.5rem !important;
        }
        .leaflet-control-zoom-in, .leaflet-control-zoom-out {
          background: white !important;
          color: #64748b !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 12px !important;
          margin-bottom: 4px !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-weight: black !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
        }
        .leaflet-control-zoom-in:hover, .leaflet-control-zoom-out:hover {
          background: #f8fafc !important;
          color: #0f172a !important;
        }
      `}</style>
    </div>
  );
}
