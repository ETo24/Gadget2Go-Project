import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Scan, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import ProductCard from '../components/ProductCard';
import { CATEGORIES, CONDITION_GRADES } from '../lib/mockData';

const DISTANCES = [5, 10, 20, 50, 200];

export default function SmartMatch() {
  const { coords, requestGeolocation } = useApp();
  const [form, setForm] = useState({
    budget: 1000, deviceType: '', brand: '', condition: '',
    maxDistanceKm: 50, sellerType: 'any',
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const run = async () => {
    setLoading(true); setRan(true);
    try {
      const { data } = await api.post('/match', { ...form, lat: coords.lat, lon: coords.lon });
      setResults(data);
      toast.success(`Found ${data.length} smart matches`);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-50/60 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-500/10"><Sparkles className="h-3 w-3" /> Smart Matching</span>
        <h1 className="mt-3 font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">Find your perfect gadget</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Tell us what you want, we'll find the best-matching listings ranked by price, distance, condition, and seller trust.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="bento-card p-6 sm:p-8">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Budget · <span className="font-semibold text-foreground">${form.budget}</span></Label>
              <Slider value={[form.budget]} min={100} max={3000} step={50} onValueChange={(v) => update('budget', v[0])} data-testid="match-budget" />
            </div>
            <div className="space-y-2">
              <Label>Device type</Label>
              <Select value={form.deviceType} onValueChange={(v) => update('deviceType', v)}>
                <SelectTrigger className="h-12 rounded-xl" data-testid="match-device"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input data-testid="match-brand" placeholder="e.g. Apple" value={form.brand} onChange={(e) => update('brand', e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Minimum condition</Label>
              <Select value={form.condition} onValueChange={(v) => update('condition', v)}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  {CONDITION_GRADES.map(c => <SelectItem key={c.id} value={c.id}>{c.id} — {c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Distance</Label>
              <div className="flex flex-wrap gap-2">
                {DISTANCES.map(d => (
                  <button key={d} data-testid={`match-dist-${d}`} onClick={() => update('maxDistanceKm', d)} className={`rounded-full px-3 py-1.5 text-xs ${form.maxDistanceKm === d ? 'bg-teal-500 text-white' : 'bg-muted'}`}>{d} km</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Seller type</Label>
              <div className="grid grid-cols-3 gap-2">
                {[{ v: 'any', l: 'Anyone' }, { v: 'user', l: 'Personal' }, { v: 'dealer', l: 'Dealer' }].map(o => (
                  <button key={o.v} data-testid={`match-seller-${o.v}`} onClick={() => update('sellerType', o.v)} className={`rounded-full px-3 py-1.5 text-xs ${form.sellerType === o.v ? 'bg-navy text-white' : 'bg-muted'}`}>{o.l}</button>
                ))}
              </div>
            </div>
            <Button variant="outline" onClick={async () => { await requestGeolocation(); toast.success('Location updated'); }} className="w-full rounded-xl"><MapPin className="mr-2 h-4 w-4 text-teal-600" />Use my location</Button>
            <Button data-testid="match-run" onClick={run} disabled={loading} className="h-12 w-full rounded-full bg-navy hover:bg-navy-700"><Scan className="mr-2 h-4 w-4" />{loading ? 'Matching…' : 'Find matches'}</Button>
          </div>
        </div>

        <div>
          {!ran && (
            <div className="bento-card grid h-full place-items-center p-10 text-center">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-teal-500/10 text-teal-600"><Sparkles className="h-7 w-7" /></div>
                <p className="mt-4 font-heading text-xl font-semibold">Enter your preferences</p>
                <p className="text-sm text-muted-foreground">We'll surface the best deals for you.</p>
              </div>
            </div>
          )}
          {ran && results.length === 0 && !loading && (
            <div className="bento-card p-10 text-center text-muted-foreground">No matches found. Try widening your filters.</div>
          )}
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="bento-card flex items-center gap-3 border-teal-500/30 p-4">
                <Sparkles className="h-5 w-5 text-teal-600" />
                <div>
                  <p className="font-heading font-bold">{results.length} smart matches</p>
                  <p className="text-xs text-muted-foreground">Ranked by budget fit, distance, condition, and seller trust.</p>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {results.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
