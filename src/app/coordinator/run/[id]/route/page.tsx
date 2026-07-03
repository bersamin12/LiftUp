'use client';

import { useEffect, useState, use } from 'react';
import dynamic from 'next/dynamic';
import { createBrowserClient } from '@supabase/ssr';
import AppScreen from '@/components/layout/AppScreen';
import ScreenHeader from '@/components/layout/ScreenHeader';

// Dynamically import Leaflet map to prevent SSR issues
const Map = dynamic(
  () => import('@/components/RouteMap'),
  { ssr: false, loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0dbcf' }}>Loading Map...</div> }
);

export default function RoutePlannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [stops, setStops] = useState<any[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [startLocation, setStartLocation] = useState('warehouse');

  const START_COORDS: Record<string, {lat: number, lng: number}> = {
    warehouse: { lat: 1.4382, lng: 103.8443 },
    cc: { lat: 1.4312, lng: 103.8360 },
    mrt: { lat: 1.4295, lng: 103.8350 }
  };

  useEffect(() => {
    const fetchRunData = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: run } = await supabase.from('collection_runs').select('*').eq('id', id).single();
      if (!run) return;

      const { data: allPledges } = await supabase.from('pledges').select('*').eq('collection_run_id', id);
      const pledgesByBlock: Record<string, number> = {};
      if (allPledges) {
        allPledges.forEach(p => {
          if (p.block_id) {
            pledgesByBlock[p.block_id] = (pledgesByBlock[p.block_id] || 0) + 1;
          }
        });
      }

      let areaBlockIds = [];
      try {
        if (typeof run.area_blocks === 'string') areaBlockIds = JSON.parse(run.area_blocks);
        else if (Array.isArray(run.area_blocks)) areaBlockIds = run.area_blocks;
      } catch(e) {}

      if (areaBlockIds.length > 0) {
        const { data: blocksData } = await supabase.from('blocks').select('*').in('block_id', areaBlockIds);
        if (blocksData) {
          const generatedStops = blocksData.map((b, i) => {
            // Generate deterministic pseudo-coordinates if null
            const lat = b.lat || (1.4300 + (i * 0.002) + (parseInt(b.block_number) % 10) * 0.001);
            const lng = b.lng || (103.8350 + (i * 0.001) - (parseInt(b.block_number) % 5) * 0.001);
            
            return {
              id: b.block_id,
              block: `Blk ${b.block_number} ${b.street_name}`,
              pledges: pledgesByBlock[b.block_id] || 0,
              lat,
              lng,
              distance: 'pending'
            };
          });
          // Initial unsorted state (or sorted by block number)
          generatedStops.sort((a, b) => a.block.localeCompare(b.block));
          
          // Compute rough mock distances for display
          generatedStops.forEach((s, i) => {
            s.distance = i === 0 ? '0 mins' : '15 mins drive (unoptimized)';
          });
          
          setStops(generatedStops);
        }
      }
    };
    fetchRunData();
  }, [id]);

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      // Simulate route optimization by sorting or rearranging
      setStops(prev => {
        const start = START_COORDS[startLocation];
        const newStops = [...prev].sort((a, b) => {
          if (b.pledges !== a.pledges) return b.pledges - a.pledges;
          const distA = Math.pow(a.lat - start.lat, 2) + Math.pow(a.lng - start.lng, 2);
          const distB = Math.pow(b.lat - start.lat, 2) + Math.pow(b.lng - start.lng, 2);
          return distA - distB;
        });
        // Update distances after "optimization"
        newStops.forEach((s, i) => {
          s.distance = i === 0 ? '0 mins' : `${(i*2) + 1} mins drive`;
        });
        return newStops;
      });
      setIsOptimizing(false);
    }, 1200);
  };

  return (
    <AppScreen background="#fff" style={{ display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader
        title="Route Planner"
        right={
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            style={{ background: 'var(--cream-bg)', border: 'none', padding: '6px 12px', borderRadius: 999, font: '800 12px var(--font-ui)', color: 'var(--teal)', cursor: 'pointer', opacity: isOptimizing ? 0.7 : 1 }}
          >
            {isOptimizing ? 'Optimizing...' : 'Optimize'}
          </button>
        }
      />

      <div style={{ height: '40vh', position: 'relative' }}>
        <Map stops={stops} startCoords={START_COORDS[startLocation]} />
      </div>

      <div style={{ flex: 1, background: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, zIndex: 20, position: 'relative', padding: '24px 22px', boxShadow: '0 -10px 30px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
        
        <div style={{ marginBottom: 24 }}>
          <label className="section-label" style={{ display: 'block', marginBottom: 8 }}>Starting location</label>
          <select
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
            disabled={isOptimizing}
            className="input"
            style={{ background: 'var(--cream-bg)', fontSize: 15 }}
          >
            <option value="warehouse">Main Warehouse (Yishun Industrial)</option>
            <option value="cc">Nee Soon East CC</option>
            <option value="mrt">Yishun MRT Station</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="section-label" style={{ margin: 0 }}>
            {isOptimizing ? 'Calculating best route…' : 'Driving sequence'}
          </h2>
          <span style={{ font: '800 12px var(--font-ui)', color: 'var(--teal)' }}>
            {stops.length} Blocks · {stops.reduce((sum, s) => sum + s.pledges, 0)} Pledges
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {stops.map((stop, i) => (
            <div key={stop.id} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? 'var(--teal)' : '#fff', border: `2px solid ${i === 0 ? 'var(--teal)' : 'var(--teal)'}`, color: i === 0 ? '#fff' : 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 12px var(--font-ui)' }}>
                  {i + 1}
                </div>
                {i < stops.length - 1 && <div style={{ width: 2, height: 24, background: 'var(--teal-light-bg)', margin: '4px 0' }}></div>}
              </div>
              <div style={{ flex: 1, paddingBottom: i < stops.length - 1 ? 16 : 0 }}>
                <div style={{ font: '700 16px var(--font-ui)', color: 'var(--text-dark)' }}>{stop.block}</div>
                <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-muted)', marginTop: 2 }}>
                  {stop.pledges} pledges · {stop.distance}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppScreen>
  );
}
