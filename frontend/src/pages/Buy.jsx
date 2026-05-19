import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Grid, List, Search, SlidersHorizontal, MapPin, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { Skeleton } from '../components/ui/skeleton';
import { CATEGORIES, CONDITION_GRADES } from '../lib/mockData';
import ProductCard from '../components/ProductCard';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

const BRANDS = ['Apple', 'Samsung', 'Google', 'Sony', 'Microsoft', 'OnePlus'];
const DISTANCES = [{ v: 2, l: '2 km' }, { v: 5, l: '5 km' }, { v: 10, l: '10 km' }, { v: 20, l: '20 km' }, { v: 99999, l: 'Anywhere' }];

function FilterPanel({ cat, setCat, brands, toggleBrand, conds, toggleCond, priceMax, setPriceMax, verifiedOnly, setVerifiedOnly, sellerType, setSellerType, dist, setDist, counts }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-heading text-sm font-bold uppercase tracking-wider">Category</p>
        <div className="mt-3 space-y-2">
          {[{ id: '', name: 'All' }, ...CATEGORIES].map(c => {
            const count = c.id === '' ? counts.total : (counts.byCategory?.[c.id] ?? 0);
            return (
              <label key={c.id || 'all'} className="flex cursor-pointer items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <input type="radio" checked={cat === c.id} onChange={() => setCat(c.id)} className="accent-teal-600" data-testid={`fcat-${c.id || 'all'}`} />
                  {c.name}
                </span>
                <span className="text-xs font-semibold text-muted-foreground" data-testid={`count-${c.id || 'all'}`}>{count}</span>
              </label>
            );
          })}
        </div>
      </div>
      <div>
        <p className="font-heading text-sm font-bold uppercase tracking-wider">Seller Type</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          {[{ v: '', l: 'All' }, { v: 'user', l: 'Personal' }, { v: 'dealer', l: 'Dealer' }].map(o => (
            <button key={o.v || 'all'} data-testid={`fseller-${o.v || 'all'}`} onClick={() => setSellerType(o.v)} className={`rounded-full px-3 py-1.5 ${sellerType === o.v ? 'bg-navy text-white' : 'bg-muted text-foreground'}`}>{o.l}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="font-heading text-sm font-bold uppercase tracking-wider">Distance</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DISTANCES.map(d => (
            <button key={d.v} data-testid={`fdist-${d.v}`} onClick={() => setDist(d.v)} className={`rounded-full px-3 py-1.5 text-xs ${dist === d.v ? 'bg-teal-500 text-white' : 'bg-muted text-foreground'}`}>{d.l}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="font-heading text-sm font-bold uppercase tracking-wider">Price</p>
        <div className="mt-3">
          <Slider value={[priceMax]} max={2500} step={50} onValueChange={(v) => setPriceMax(v[0])} data-testid="price-slider" />
          <p className="mt-2 text-sm text-muted-foreground">Up to <span className="font-semibold text-foreground">${priceMax}</span></p>
        </div>
      </div>
      <div>
        <p className="font-heading text-sm font-bold uppercase tracking-wider">Condition</p>
        <div className="mt-3 space-y-2">
          {CONDITION_GRADES.map(c => (
            <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={conds.includes(c.id)} onCheckedChange={() => toggleCond(c.id)} data-testid={`fcond-${c.id}`} />
              <span>{c.label} <span className="ml-1 text-xs text-muted-foreground">({c.id})</span></span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="font-heading text-sm font-bold uppercase tracking-wider">Brand</p>
        <div className="mt-3 space-y-2">
          {BRANDS.map(b => (
            <label key={b} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={brands.includes(b)} onCheckedChange={() => toggleBrand(b)} data-testid={`fbrand-${b}`} />
              <span>{b}</span>
            </label>
          ))}
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox checked={verifiedOnly} onCheckedChange={setVerifiedOnly} data-testid="fverified" />
        <span>Verified sellers only</span>
      </label>
    </div>
  );
}

export default function Buy() {
  const [params] = useSearchParams();
  const { coords, requestGeolocation } = useApp();
  const [cat, setCat] = useState(params.get('cat') || '');
  const [q, setQ] = useState(params.get('q') || '');
  const [view, setView] = useState('grid');
  const [sort, setSort] = useState('newest');
  const [priceMax, setPriceMax] = useState(2500);
  const [brands, setBrands] = useState([]);
  const [conds, setConds] = useState([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sellerType, setSellerType] = useState('');
  const [dist, setDist] = useState(99999);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ byCategory: {}, total: 0 });

  const toggleBrand = (b) => setBrands(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  const toggleCond = (c) => setConds(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const filterProps = { cat, setCat, brands, toggleBrand, conds, toggleCond, priceMax, setPriceMax, verifiedOnly, setVerifiedOnly, sellerType, setSellerType, dist, setDist, counts };

  useEffect(() => {
    api.get('/categories/counts').then(r => setCounts(r.data)).catch(() => {});
  }, [items.length]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const queryParams = {
      category: cat || undefined,
      q: q || undefined,
      priceMax: priceMax,
      verifiedOnly: verifiedOnly || undefined,
      sellerType: sellerType || undefined,
      maxDistanceKm: dist < 99999 ? dist : undefined,
      lat: coords.lat, lon: coords.lon, sort,
    };
    api.get('/listings', { params: queryParams })
      .then(r => { if (active) setItems(r.data); })
      .catch(e => toast.error(e.message))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [cat, q, priceMax, verifiedOnly, sellerType, dist, coords.lat, coords.lon, sort]);

  const filtered = useMemo(() => {
    let list = items;
    if (brands.length) list = list.filter(p => brands.includes(p.brand));
    if (conds.length) list = list.filter(p => conds.includes(p.condition));
    return list;
  }, [items, brands, conds]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">Marketplace</h1>
          <p className="text-muted-foreground">{filtered.length} listings · Verified by Cybridge</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button data-testid="locate-me" variant="outline" className="h-10 rounded-full" onClick={async () => { await requestGeolocation(); toast.success('Location updated'); }}>
            <MapPin className="mr-2 h-4 w-4 text-teal-600" />Locate me
          </Button>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input data-testid="buy-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-10 rounded-full bg-card pl-9" />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-10 w-40 rounded-full bg-card" data-testid="sort-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="priceLow">Price: Low → High</SelectItem>
              <SelectItem value="priceHigh">Price: High → Low</SelectItem>
              <SelectItem value="rating">Top-rated sellers</SelectItem>
              <SelectItem value="distance">Nearest first</SelectItem>
            </SelectContent>
          </Select>
          <div className="inline-flex rounded-full border border-border bg-card p-1">
            <Button data-testid="view-grid" variant={view === 'grid' ? 'default' : 'ghost'} size="icon" className="h-8 w-8 rounded-full" onClick={() => setView('grid')}><Grid className="h-4 w-4" /></Button>
            <Button data-testid="view-list" variant={view === 'list' ? 'default' : 'ghost'} size="icon" className="h-8 w-8 rounded-full" onClick={() => setView('list')}><List className="h-4 w-4" /></Button>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 rounded-full lg:hidden" data-testid="open-filters"><SlidersHorizontal className="mr-2 h-4 w-4" />Filters</Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
              <div className="mt-6"><FilterPanel {...filterProps} /></div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 bento-card max-h-[calc(100vh-120px)] overflow-y-auto p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Filter className="h-4 w-4 text-teal-600" />Filters
            </div>
            <FilterPanel {...filterProps} />
          </div>
        </aside>
        <div>
          {dist < 99999 && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-700 dark:bg-teal-500/10 dark:text-teal-400">
              <Sparkles className="h-3 w-3" /> Showing nearby deals within {dist} km of your location
            </div>
          )}
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3"><Skeleton className="aspect-square rounded-3xl" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-2/5" /></div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bento-card p-12 text-center">
              <p className="font-heading text-xl font-bold">No matches found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try clearing filters or widening your range.</p>
            </div>
          ) : (
            <div className={view === 'grid' ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-4'}>
              {filtered.map(p => <ProductCard key={p.id} product={p} view={view} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
