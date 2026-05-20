'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const carIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.latitude, m.longitude]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }, [markers, map]);
  return null;
}

export default function MapView({ markers = [], defaultCenter = [15.5007, 32.5599], defaultZoom = 6, height = '500px' }) {
  const validMarkers = markers.filter(
    (m) => typeof m.latitude === 'number' && typeof m.longitude === 'number'
  );

  return (
    <div style={{ height }} className="overflow-hidden rounded-xl border border-slate-200">
      <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validMarkers.map((m) => (
          <Marker key={m.id} position={[m.latitude, m.longitude]} icon={carIcon}>
            <Popup>
              <div className="text-right" dir="rtl">
                <div className="mb-1 font-bold">
                  {m.brand} {m.model}
                </div>
                {m.plateNumber && <div className="text-sm">لوحة: {m.plateNumber}</div>}
                {!m.plateNumber && m.chassisNumber && (
                  <div className="text-sm">شاسيه: {m.chassisNumber}</div>
                )}
                <div className="text-sm">الولاية: {m.lostCity}</div>
                <a
                  href={`/reports/${m.id}`}
                  className="mt-2 inline-block text-brand-600 underline"
                >
                  تفاصيل البلاغ
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
        <FitBounds markers={validMarkers} />
      </MapContainer>
    </div>
  );
}
