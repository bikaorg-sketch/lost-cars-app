'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((m) => m.Marker),
  { ssr: false }
);

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ onChange, initial }) {
  const [pos, setPos] = useState(initial || null);

  function handlePick(lat, lng) {
    const next = { lat, lng };
    setPos(next);
    onChange?.(lat, lng);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-600">انقر على الخريطة لتحديد مكان الفقد</p>
      <div style={{ height: '320px' }} className="overflow-hidden rounded-xl border border-slate-200">
        <MapContainer center={[15.5007, 32.5599]} zoom={6} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={handlePick} />
          {pos && <Marker position={[pos.lat, pos.lng]} icon={icon} />}
        </MapContainer>
      </div>
      {pos && (
        <p className="text-xs text-slate-500">
          الإحداثيات: {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
}
