import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Grid, List, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { PRODUCTS, CATEGORIES, CONDITION_GRADES } from '../lib/mockData';
import ProductCard from '../components/ProductCard';

const BRANDS = ['Apple', 'Samsung', 'Google', 'Sony', 'Microsoft', 'OnePlus'];

function FilterPanel({ cat, setCat, brands, toggleBrand, conds, toggleCond, priceMax, setPriceMax, verifiedOnly, setVerifiedOnly }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-heading text-sm font-bold uppercase tracking-wider">Category</p>
        <div className="mt-3 space-y-2">
          {[{ id: '', name: 'All' }, ...CATEGORIES].map(c => (
            <label key={c.id || 'all'} className="flex cursor-pointer items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <input type="radio" checked={cat === c.id} onChange={() => setCat(c.id)} className="accent-teal-600" data-testid={`fcat-${c.id || 'all'}`} />
                {c.name}
              </span>
              <span className="text-xs text-muted-foreground">{c.count ?? ''}</span>
            </label>
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
  const [params, setParams] = useSearchParams();
  const [cat, setCat] = useState(params.get('cat') || '');
  const [q, setQ] = useState(params.get('q') || '');
  const [view, setView] = useState('grid');
  const [sort, setSort] = useState('newest');
  const [priceMax, setPriceMax] = useState(2500);
  const [brands, setBrands] = useState([]);
  const [conds, setConds] = useState([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const toggleBrand = (b) => setBrands(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  const toggleCond = (c) => setConds(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const filtered = useMemo(() => {
    let list = [...PRODUCTS];
    if (cat) list = list.filter(p => p.category === cat);
    if (q) list = list.filter(p => p.title.toLowerCase().includes(q.toLowerCase()));
    if (brands.length) list = list.filter(p => brands.includes(p.brand));
    if (conds.length) list = list.filter(p => conds.includes(p.condition));
    if (verifiedOnly) list = list.filter(p => p.verifiedBadge);
    list = list.filter(p => p.price <= priceMax);
    if (sort === 'priceLow') list.sort((a, b) => a.price - b.price);
    if (sort === 'priceHigh') list.sort((a, b) => b.price - a.price);
    if (sort === 'rating') list.sort((a, b) => b.seller.rating - a.seller.rating);
    if (sort === 'newest') list.sort((a, b) => a.postedDays - b.postedDays);
    return list;
  }, [cat, q, brands, conds, verifiedOnly, priceMax, sort]);

  const filterProps = { cat, setCat, brands, toggleBrand, conds, toggleCond, priceMax, setPriceMax, verifiedOnly, setVerifiedOnly };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">Marketplace</h1>
          <p className="text-muted-foreground">{filtered.length} listings · Verified by Cybridge</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <div className="sticky top-24 bento-card p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Filter className="h-4 w-4 text-teal-600" />Filters
            </div>
            <FilterPanel {...filterProps} />
          </div>
        </aside>
        <div>
          {filtered.length === 0 ? (
            <div className="bento-card p-12 text-center">
              <p className="font-heading text-xl font-bold">No matches found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try clearing filters or widening your price range.</p>
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
