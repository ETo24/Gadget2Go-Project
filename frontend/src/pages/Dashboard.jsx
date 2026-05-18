import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingBag, Plus, TrendingUp, BadgeCheck, Eye, Heart, Star, ArrowRight, Wallet, Package, Bell, ShieldAlert, Scan } from 'lucide-react';
import { Button } from '../components/ui/button';
import { CATEGORIES } from '../lib/mockData';
import ProductCard from '../components/ProductCard';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, saved, coords } = useApp();
  const [trending, setTrending] = useState([]);
  const [flash, setFlash] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    api.get('/listings', { params: { lat: coords.lat, lon: coords.lon, sort: 'rating' } }).then(r => {
      setTrending(r.data.slice(0, 4));
      setFlash(r.data.slice(4, 6));
    }).catch(() => {});
    api.get('/listings/mine/me').then(r => setMyListings(r.data)).catch(() => {});
    api.get('/notifications').then(r => setNotifs(r.data)).catch(() => {});
  }, [coords.lat, coords.lon]);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-navy p-7 text-white sm:p-10">
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-teal-500/30 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-teal-300">Welcome back</p>
            <h1 className="mt-2 font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">Hi {user?.name?.split(' ')[0] || 'there'}</h1>
            <p className="mt-2 max-w-md text-white/70">Trust score <span className="font-semibold text-teal-300">{user?.trustScore}/100 · {user?.trustLabel}</span>. Keep building your reputation.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button data-testid="dashboard-sell-btn" onClick={() => navigate('/sell')} className="h-11 rounded-full bg-teal-500 px-6 text-white hover:bg-teal-600"><Plus className="mr-2 h-4 w-4" />List a gadget</Button>
            <Button data-testid="dashboard-match-btn" onClick={() => navigate('/match')} variant="outline" className="h-11 rounded-full border-white/30 bg-transparent px-6 text-white hover:bg-white/10"><Scan className="mr-2 h-4 w-4" />Smart Match</Button>
            <Button data-testid="dashboard-buy-btn" onClick={() => navigate('/buy')} variant="outline" className="h-11 rounded-full border-white/30 bg-transparent px-6 text-white hover:bg-white/10"><ShoppingBag className="mr-2 h-4 w-4" />Browse</Button>
          </div>
        </div>
      </section>

      {user?.kycStatus !== 'approved' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5" data-testid="kyc-banner">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-700 dark:text-amber-400" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-300">Complete identity verification to start selling</p>
              <p className="text-xs text-amber-800 dark:text-amber-400/80">Takes 2 minutes. Boosts your Trust Score by +20.</p>
            </div>
          </div>
          <Button data-testid="goto-verification" onClick={() => navigate('/verification')} className="rounded-full bg-amber-600 hover:bg-amber-700">Verify now</Button>
        </div>
      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: 'My Listings', v: myListings.length, i: Package, c: 'bg-navy text-white' },
          { l: 'Saved Items', v: saved.length, i: Heart, c: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' },
          { l: 'Wallet', v: `$${user?.walletBalance ?? 0}`, i: Wallet, c: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400' },
          { l: 'Trust Score', v: `${user?.trustScore ?? 50}/100`, i: BadgeCheck, c: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
        ].map((s) => (
          <button key={s.l} onClick={() => s.l === 'Wallet' ? navigate('/wallet') : null} className="bento-card p-5 text-left" data-testid={`stat-${s.l}`}>
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${s.c}`}><s.i className="h-5 w-5" /></div>
            <p className="mt-4 font-heading text-2xl font-bold">{s.v}</p>
            <p className="text-xs text-muted-foreground">{s.l}</p>
          </button>
        ))}
      </section>

      <section>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">Quick categories</p>
            <h2 className="mt-1 font-heading text-2xl font-bold">Shop by category</h2>
          </div>
        </div>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button key={c.id} data-testid={`dash-cat-${c.id}`} onClick={() => navigate(`/buy?cat=${c.id}`)} className="bento-card flex shrink-0 items-center gap-3 px-5 py-3">
              <span className="font-heading font-semibold">{c.name}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">{c.count}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600 inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Trending</p>
            <h2 className="mt-1 font-heading text-2xl font-bold">Hot picks near you</h2>
          </div>
          <Button variant="ghost" onClick={() => navigate('/buy')} data-testid="dash-see-all">See all <ArrowRight className="ml-1 h-4 w-4" /></Button>
        </div>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{trending.map(p => <ProductCard key={p.id} product={p} />)}</div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="bento-card relative overflow-hidden p-6 lg:col-span-2">
          <div className="absolute right-0 top-0 h-40 w-40 -translate-y-10 translate-x-10 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">⚡ Flash Deals</p>
            <h2 className="mt-1 font-heading text-2xl font-bold">Limited-time bargains</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">{flash.map(p => <ProductCard key={p.id} product={p} />)}</div>
          </div>
        </div>
        <button onClick={() => navigate('/valuation')} data-testid="dash-valuation-card" className="relative overflow-hidden rounded-3xl bg-navy p-6 text-left text-white shadow-[0_8px_40px_rgba(11,31,58,0.15)]">
          <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-teal-500/40 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/40 bg-teal-500/15 px-3 py-1 text-xs font-semibold text-teal-300"><Sparkles className="h-3 w-3" /> AI Valuation</span>
            <h2 className="mt-4 font-heading text-2xl font-bold">Know what your gadget is worth — in 3 seconds.</h2>
            <p className="mt-2 text-sm text-white/70">Instant, confident pricing powered by 50+ data points.</p>
            <div className="mt-6 flex items-center gap-2 text-sm font-medium text-teal-300">Try it now <ArrowRight className="h-4 w-4" /></div>
          </div>
        </button>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between">
            <h2 className="font-heading text-2xl font-bold">My listings</h2>
            <Button variant="ghost" onClick={() => navigate('/sell')} data-testid="add-listing-btn"><Plus className="mr-1 h-4 w-4" /> New listing</Button>
          </div>
          <div className="mt-4 space-y-3">
            {myListings.length === 0 ? (
              <div className="bento-card p-8 text-center text-muted-foreground">No listings yet. List your first gadget!</div>
            ) : myListings.map(p => (
              <div key={p.id} className="bento-card flex items-center gap-4 p-4">
                <img src={p.images?.[0]} alt={p.title} className="h-16 w-16 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-heading font-semibold">{p.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{p.views || 0}</span>
                    <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{p.saved || 0}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-heading font-bold">${p.price}</p>
                  <p className="inline-flex items-center gap-1 text-[10px] text-teal-700"><Sparkles className="h-3 w-3" />Fair ${p.aiFair}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-end justify-between">
            <h2 className="font-heading text-2xl font-bold">Activity</h2>
            <Button variant="ghost" onClick={() => navigate('/notifications')}>All</Button>
          </div>
          <div className="mt-4 space-y-3">
            {notifs.length === 0 ? (
              <div className="bento-card p-6 text-center text-sm text-muted-foreground">No notifications yet.</div>
            ) : notifs.slice(0, 4).map(n => (
              <div key={n.id} className="bento-card flex items-start gap-3 p-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-500/10 text-teal-700"><Bell className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-semibold">{n.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{n.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
