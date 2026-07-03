'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom numbered icon
const createNumberedIcon = (num: number) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: var(--teal); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-family: var(--font-ui); border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${num}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const createStartIcon = () => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: var(--rust); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">★</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

export default function RouteMap({ stops, startCoords }: { stops: any[], startCoords?: { lat: number, lng: number } }) {
  if (!stops || stops.length === 0) return null;

  // Compute center based on startCoords, then first stop, or Singapore default
  const center: [number, number] = startCoords ? [startCoords.lat, startCoords.lng] : (stops[0] ? [stops[0].lat, stops[0].lng] : [1.3521, 103.8198]);
  
  // Extract coordinates for the polyline
  const polylineCoords: [number, number][] = [];
  if (startCoords) polylineCoords.push([startCoords.lat, startCoords.lng]);
  stops.forEach(s => polylineCoords.push([s.lat, s.lng]));

  return (
    <div style={{ height: '100%', width: '100%', zIndex: 1 }}>
      <MapContainer 
        center={center} 
        zoom={14} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png"
          attribution='<img src="https://www.onemap.gov.sg/docs/maps/images/oneMap64-01.png" style="height:20px;width:20px;"/> New OneMap | Map data &copy; contributors, <a href="http://SLA.gov.sg">Singapore Land Authority</a>'
        />
        
        {startCoords && (
          <Marker position={[startCoords.lat, startCoords.lng]} icon={createStartIcon()}>
            <Popup><div style={{ font: '700 14px var(--font-ui)' }}>Starting Location</div></Popup>
          </Marker>
        )}

        {stops.map((stop, idx) => (
          <Marker 
            key={stop.id} 
            position={[stop.lat, stop.lng]}
            icon={createNumberedIcon(idx + 1)}
          >
            <Popup>
              <div style={{ font: '700 14px var(--font-ui)' }}>{stop.block}</div>
              <div style={{ font: '600 12px var(--font-ui)', color: 'var(--text-muted)' }}>{stop.pledges} pledges to collect</div>
            </Popup>
          </Marker>
        ))}

        {polylineCoords.length > 1 && (
          <Polyline 
            positions={polylineCoords} 
            color="var(--teal)" 
            weight={4}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}
      </MapContainer>
    </div>
  );
}
