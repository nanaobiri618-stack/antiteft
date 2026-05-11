'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
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
  const defaultCenter: [number, number] = [5.6037, -0.1870]; // Accra, Ghana as default

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
        zoomControl={false}
      >
        {/* Light Theme Map Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <ChangeView lat={center[0]} lng={center[1]} />
        
        {activeDevices.map((device: any) => (
          <Marker key={device.id} position={[device.current_lat, device.current_lng]}>
            <Popup>
              <div className="text-zinc-900 p-1">
                <p className="font-black text-xs uppercase tracking-tight mb-1 border-b pb-1">{device.model || 'Unknown Device'}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${device.last_seen && new Date(device.last_seen).getTime() > Date.now() - 300000 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {device.last_seen ? formatDistanceToNow(new Date(device.last_seen), { addSuffix: true }) : 'Never seen'}
                  </p>
                </div>
                <p className="text-[10px] text-zinc-500 font-mono mt-2">ID: {device.id.slice(0, 12)}...</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
