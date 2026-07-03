'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;

type InterestBlock = {
  block_id: string;
  block_number: string;
  street_name: string;
  lat: number | null;
  lng: number | null;
  interestCount: number;
  categoryBreakdown?: Record<string, number>;
};

const createInterestIcon = (count: number, selected: boolean) => {
  const size = Math.min(44, 20 + count * 4);
  const color = selected ? 'var(--teal)' : count > 0 ? 'var(--rust)' : 'var(--text-muted)';
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color:${color};color:white;width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 12px var(--font-ui);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35);">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export default function InterestMap({
  blocks,
  selectedBlockIds,
  onToggle,
  readOnly,
}: {
  blocks: InterestBlock[];
  selectedBlockIds: string[];
  onToggle?: (block: InterestBlock) => void;
  readOnly?: boolean;
}) {
  const withCoords = blocks.filter(b => b.lat != null && b.lng != null);
  if (withCoords.length === 0) return null;

  const center: [number, number] = [withCoords[0].lat as number, withCoords[0].lng as number];

  return (
    <div style={{ height: 260, width: '100%', borderRadius: 14, overflow: 'hidden' }}>
      <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png"
          attribution='<img src="https://www.onemap.gov.sg/docs/maps/images/oneMap64-01.png" style="height:20px;width:20px;"/> New OneMap | Map data &copy; contributors, <a href="http://SLA.gov.sg">Singapore Land Authority</a>'
        />

        {withCoords.map(block => {
          const selected = selectedBlockIds.includes(block.block_id);
          const breakdown = Object.entries(block.categoryBreakdown || {}).sort((a, b) => b[1] - a[1]);
          return (
            <Marker
              key={block.block_id}
              position={[block.lat as number, block.lng as number]}
              icon={createInterestIcon(block.interestCount, selected)}
              eventHandlers={readOnly ? {} : { click: () => onToggle?.(block) }}
            >
              <Popup>
                <div style={{ font: '700 14px var(--font-ui)' }}>Blk {block.block_number} {block.street_name}</div>
                <div style={{ font: '600 12px var(--font-ui)', color: 'var(--text-muted)' }}>
                  {breakdown.length > 0
                    ? breakdown.map(([cat, count]) => `${count} ${cat}`).join(' · ')
                    : `${block.interestCount} interested`}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
