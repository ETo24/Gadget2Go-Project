import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import ProductCard from '../components/ProductCard';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

export default function Liked() {
  const { likedSet } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const r = await api.get('/likes/mine'); setItems(r.data); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  // Refresh if liked set changes (after toggle in cards)
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [likedSet.size]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">Liked Gadgets</h1>
          <p className="text-muted-foreground">{items.length} item{items.length === 1 ? '' : 's'} saved for later</p>
        </div>
        <Link to="/buy"><Button variant="outline" className="rounded-full"><ShoppingBag className="mr-2 h-4 w-4" />Keep browsing</Button></Link>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-3xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bento-card grid place-items-center p-16 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-rose-50 text-rose-500 dark:bg-rose-500/10">
            <Heart className="h-10 w-10" strokeWidth={1.5} />
          </div>
          <h2 className="mt-4 font-heading text-2xl font-bold">Nothing here yet</h2>
          <p className="mt-2 max-w-sm text-muted-foreground">Tap the heart icon on any listing to save it. Your favourites will appear here.</p>
          <Link to="/buy" data-testid="liked-go-browse"><Button className="mt-6 rounded-full bg-navy hover:bg-navy-700">Browse marketplace</Button></Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map(p => (
            <div key={p.id} className="relative">
              <ProductCard product={p} />
              {p.likedAt && <p className="mt-1 px-1 text-[11px] text-muted-foreground">Saved {new Date(p.likedAt).toLocaleDateString()}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
