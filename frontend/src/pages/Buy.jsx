import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, Grid, List, Search, SlidersHorizontal, ShieldCheck, Star, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { Skeleton } from '../components/ui/skeleton';
import { api } from '../lib/api';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'phones',      name: 'Phones' },
  { id: 'laptops',     name: 'Laptops' },
  { id: 'tablets',     name: 'Tablets' },
  { id: 'consoles',    name: 'Consoles' },
  { id: 'smartwatches',name: 'Smartwatches' },
  { id: 'accessories', name: 'Accessories' },
];

const BRANDS = ['Apple', 'Samsung', 'Google', 'Sony', 'Microsoft', 'OnePlus'];

const CONDITIONS = [
  { id: 'A', label: 'Like New' },
  { id: 'B', label: 'Good' },
  { id: 'C', label: 'Fair' },
  { id: 'D', label: 'Acceptable' },
];

function FilterPanel({ cat, setCat, brands, toggleBrand, conds, toggleCond, priceMax, setPriceMax, verifiedOnly, setVerifiedOnly }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-heading text-sm font-bold uppercase tracking-wider">Category</p>
        <div className="mt-3 space-y-2">
          {[{ id: '', name: 'All' }, ...CATEGORIES].map(c => (
            <label key={c.id || 'all'} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                checked={cat === c.id}
                onChange={() => setCat(c.id)}
                className="accent-teal-600"
                data-testid={`fcat-${c.id || 'all'}`}
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="font-heading text-sm font-bold uppercase tracking-wider">Price</p>
        <div className="mt-3">
          <Slider value={[priceMax]} max={2500} step={50} onValueChange={v => setPriceMax(v[0])} />
          <p className="mt-2 text-sm text-muted-foreground">Up to <span className="font-semibold text-foreground">${priceMax}</span></p>
        </div>
      </div>
      <div>
        <p className="font-heading text-sm font-bold uppercase tracking-wider">Condition</p>
        <div className="mt-3 space-y-2">
          {CONDITIONS.map(c => (
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

function ListingCard({ listing, view, onClick }) {
  const img   = listing.images?.[0] || listing.image || '';
  const seller = listing.seller || {};

  if (view === 'list') {
    return (
      <div
        onClick={onClick}
        className="bento-card flex cursor-pointer items-center gap-4 p-4 transition-shadow hover:shadow-lg"
        data-testid={`listing-${listing.id}`}
      >
        <img src={img} alt={listing.title} className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
        <div className="min-w-0 flex-1">
          <p className="font-heading font-bold line-clamp-1">{listing.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium">{listing.condition}</span>
            {seller.verified && (
              <span className="flex items-center gap-1 text-teal-600">
                <ShieldCheck className="h-3 w-3" />Verified
              </span>
            )}
            {listing.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />{listing.location}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{listing.description}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-heading text-xl font-bold">${listing.price}</p>
          {listing.aiFair && listing.aiFair !== listing.price && (
            <p className="text-xs text-muted-foreground">AI fair: ${listing.aiFair}</p>
          )}
          <div className="mt-1 flex items-center justify-end gap-1 text-xs">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{seller.rating?.toFixed(1)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="bento-card group cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
      data-testid={`listing-${listing.id}`}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {img
          ? <img src={img} alt={listing.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          : <div className="h-full w-full bg-muted" />
        }
        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          Grade {listing.condition}
        </span>
        {seller.verified && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-teal-500/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            <ShieldCheck className="h-3 w-3" />Verified
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="font-heading font-bold line-clamp-2 leading-snug">{listing.title}</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="font-heading text-xl font-bold">${listing.price}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {seller.rating?.toFixed(1)} · {seller.name}
          </div>
        </div>
        {listing.distanceKm != null && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />{listing.distanceKm} km away
          </p>
        )}
      </div>
    </div>
  );
}

export default function Buy() {
  const navigate = useNavigate();
  const [params]  = useSearchParams();

  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);

  const [cat, setCat]           = useState(params.get('cat') || '');
  const [q, setQ]               = useState(params.get('q') || '');
  const [view, setView]         = useState('grid');
  const [sort, setSort]         = useState('newest');
  const [priceMax, setPriceMax] = useState(2500);
  const [brands, setBrands]     = useState([]);
  const [conds, setConds]       = useState([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const toggleBrand = b => setBrands(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  const toggleCond  = c => setConds(prev  => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  // Load listings from real API
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (cat)          params.set('category', cat);
        if (q)            params.set('q', q);
        if (priceMax < 2500) params.set('priceMax', priceMax);
        if (verifiedOnly) params.set('verifiedOnly', 'true');
        if (sort)         params.set('sort', sort);
        // Pass user location for distance (default Singapore)
        params.set('lat', '1.3521');
        params.set('lon', '103.8198');

        const res = await api.get(`/listings?${params.toString()}`);
        setListings(res.data);
      } catch (e) {
        toast.error('Failed to load listings');
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [cat, q, priceMax, verifiedOnly, sort]);

  // Client-side brand + condition filter (API doesn't support multi-brand/multi-cond)
  const filtered = useMemo(() => {
    let list = [...listings];
    if (brands.length) list = list.filter(p => brands.includes(p.brand));
    if (conds.length)  list = list.filter(p => conds.includes(p.condition));
    return list;
  }, [listings, brands, conds]);

  const filterProps = { cat, setCat, brands, toggleBrand, conds, toggleCond, priceMax, setPriceMax, verifiedOnly, setVerifiedOnly };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">Marketplace</h1>
          <p className="text-muted-foreground">
            {loading ? 'Loading…' : `${filtered.length} listings`} · Verified by Cybridge
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              data-testid="buy-search"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search…"
              className="h-10 rounded-full bg-card pl-9"
            />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-10 w-44 rounded-full bg-card" data-testid="sort-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="priceLow">Price: Low → High</SelectItem>
              <SelectItem value="priceHigh">Price: High → Low</SelectItem>
              <SelectItem value="rating">Top-rated sellers</SelectItem>
              <SelectItem value="distance">Nearest first</SelectItem>
            </SelectContent>
          </Select>
          <div className="inline-flex rounded-full border border-border bg-card p-1">
            <Button
              data-testid="view-grid"
              variant={view === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setView('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              data-testid="view-list"
              variant={view === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          {/* Mobile filters sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 rounded-full lg:hidden" data-testid="open-filters">
                <SlidersHorizontal className="mr-2 h-4 w-4" />Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
              <div className="mt-6"><FilterPanel {...filterProps} /></div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Desktop filter sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 bento-card p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Filter className="h-4 w-4 text-teal-600" />Filters
            </div>
            <FilterPanel {...filterProps} />
          </div>
        </aside>

        {/* Listings grid / list */}
        <div>
          {loading ? (
            <div className={view === 'grid' ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className={view === 'grid' ? 'h-64 rounded-3xl' : 'h-24 rounded-2xl'} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bento-card p-12 text-center">
              <p className="font-heading text-xl font-bold">No listings found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try clearing filters or widening your price range.</p>
            </div>
          ) : (
            <div className={view === 'grid' ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-4'}>
              {filtered.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  view={view}
                  onClick={() => navigate(`/listing/${listing.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}