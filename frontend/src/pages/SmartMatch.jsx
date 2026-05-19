import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Scan, MapPin, Map as MapIcon, Grid } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import ProductCard from '../components/ProductCard';
import { CATEGORIES, CONDITION_GRADES } from '../lib/mockData';

// Fix default icon paths for Leaflet (CRA / Webpack issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const teal = L.divIcon({
  className: '',
  html: `<div style="width:32px;height:32px;border-radius:50%;background:#14B8A6;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:grid;place-items:center;color:white;font-weight:bold;font-size:11px">G2</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});
const navyIcon = L.divIcon({
  className: '',
  html: `<div style="width:36px;height:36px;border-radius:50%;background:#0B1F3A;border:3px solid #14B8A6;box-shadow:0 4px 12px rgba(0,0,0,0.4);display:grid;place-items:center;color:white;font-size:14px">📍</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const DISTANCES = [{ v: 2, l: '2 km' }, { v: 5, l: '5 km' }, { v: 10, l: '10 km' }, { v: 20, l: '20 km' }];

function ReCenter({ coords }) {
  const map = useMap();
  useEffect(() => { map.flyTo([coords.lat, coords.lon], 12, { duration: 0.8 }); }, [coords.lat, coords.lon, map]);
  return null;
}

export default function SmartMatch() {
  const { coords, requestGeolocation } = useApp();
  const [form, setForm] = useState({
    budget: 1000, deviceType: '', brand: '', condition: '',
    maxDistanceKm: 10, sellerType: 'any',
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);
  const [view, setView] = useState('map');

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const run = async () => {
    setLoading(true); setRan(true);
    try {
      const { data } = await api.post('/match', { ...form, lat: coords.lat, lon: coords.lon });
      setResults(data);
      if (data.length === 0) toast.info('No matches in this radius. Try widening the distance.');
      else toast.success(`Found ${data.length} nearby gadgets`);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  // Auto-run on mount + when coords change
  useEffect(() => { run(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-50/60 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-500/10"><Sparkles className="h-3 w-3" /> Smart Matching</span>
          <h1 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">Find gadgets near you</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">Live map of nearby sellers + AI-ranked matches.</p>
        </div>
        <Button data-testid="locate-me" variant="outline" onClick={async () => { await requestGeolocation(); toast.success('Location updated'); }} className="rounded-full"><MapPin className="mr-2 h-4 w-4 text-teal-600" />Use my location</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Filters */}
        <div className="bento-card p-6">
          <h2 className="font-heading text-lg font-bold">Preferences</h2>
          <div className="mt-5 space-y-5">
            <div className="space-y-2">
              <Label>Budget · <span className="font-semibold text-foreground">${form.budget}</span></Label>
              <Slider value={[form.budget]} min={100} max={3000} step={50} onValueChange={(v) => update('budget', v[0])} data-testid="match-budget" />
            </div>
            <div className="space-y-2">
              <Label>Radius</Label>
              <div className="flex flex-wrap gap-2">
                {DISTANCES.map(d => (
                  <button key={d.v} data-testid={`match-dist-${d.v}`} onClick={() => update('maxDistanceKm', d.v)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${form.maxDistanceKm === d.v ? 'bg-teal-500 text-white' : 'bg-muted'}`}>{d.l}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Device type</Label>
              <Select value={form.deviceType} onValueChange={(v) => update('deviceType', v === '__any' ? '' : v)}>
                <SelectTrigger className="h-11 rounded-xl" data-testid="match-device"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__any">Any</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input data-testid="match-brand" placeholder="e.g. Apple" value={form.brand} onChange={(e) => update('brand', e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={(v) => update('condition', v === '__any' ? '' : v)}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__any">Any</SelectItem>
                  {CONDITION_GRADES.map(c => <SelectItem key={c.id} value={c.id}>{c.id} — {c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Seller</Label>
              <div className="grid grid-cols-3 gap-2">
                {[{ v: 'any', l: 'Anyone' }, { v: 'user', l: 'Personal' }, { v: 'dealer', l: 'Dealer' }].map(o => (
                  <button key={o.v} data-testid={`match-seller-${o.v}`} onClick={() => update('sellerType', o.v)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${form.sellerType === o.v ? 'bg-navy text-white' : 'bg-muted'}`}>{o.l}</button>
                ))}
              </div>
            </div>
            <Button data-testid="match-run" onClick={run} disabled={loading} className="h-11 w-full rounded-full bg-navy hover:bg-navy-700"><Scan className="mr-2 h-4 w-4" />{loading ? 'Searching…' : 'Find matches'}</Button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-teal-600" />
              <span className="font-semibold">{results.length} match{results.length === 1 ? '' : 'es'}</span>
              <span className="text-muted-foreground">within {form.maxDistanceKm} km</span>
            </div>
            <div className="inline-flex rounded-full border border-border bg-card p-1">
              <Button data-testid="view-map" variant={view === 'map' ? 'default' : 'ghost'} size="sm" onClick={() => setView('map')} className="rounded-full"><MapIcon className="mr-1 h-4 w-4" />Map</Button>
              <Button data-testid="view-grid-match" variant={view === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setView('grid')} className="rounded-full"><Grid className="mr-1 h-4 w-4" />Grid</Button>
            </div>
          </div>

          {view === 'map' && (
            <div className="overflow-hidden rounded-3xl border border-border" style={{ height: 520 }}>
              <MapContainer center={[coords.lat, coords.lon]} zoom={12} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png" />
                <ReCenter coords={coords} />
                <Marker position={[coords.lat, coords.lon]} icon={navyIcon}>
                  <Popup>You are here</Popup>
                </Marker>
                <Circle center={[coords.lat, coords.lon]} radius={form.maxDistanceKm * 1000} pathOptions={{ color: '#14B8A6', fillColor: '#14B8A6', fillOpacity: 0.08, weight: 1.5 }} />
                {results.filter(r => r.lat && r.lon).map(r => (
                  <Marker key={r.id} position={[r.lat, r.lon]} icon={teal}>
                    <Popup>
                      <div className="w-48">
                        <img src={r.images?.[0]} alt="" className="mb-2 h-24 w-full rounded-lg object-cover" />
                        <p className="text-sm font-bold">{r.title}</p>
                        <p className="text-xs">${r.price} · {r.distanceKm} km away</p>
                        <p className="text-xs text-teal-700">Match {r.matchScore}%</p>
                        <a href={`/buy/${r.id}`} className="mt-2 inline-block rounded bg-navy px-2 py-1 text-xs text-white">View →</a>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}

          {view === 'grid' && (
            results.length === 0 ? (
              <div className="bento-card p-10 text-center text-muted-foreground">No matches. Widen your filters.</div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-5 sm:grid-cols-2">
                {results.map(p => <ProductCard key={p.id} product={p} />)}
              </motion.div>
            )
          )}

          {/* Always show top 3 below the map as cards */}
          {view === 'map' && results.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top matches</p>
              <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.slice(0, 3).map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
