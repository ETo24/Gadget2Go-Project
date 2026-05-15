import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Star, ShieldCheck, MapPin, Calendar, Edit3, Camera, Trophy } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { PRODUCTS } from '../lib/mockData';
import ProductCard from '../components/ProductCard';
import { useApp } from '../context/AppContext';

const REVIEWS = [
  { id: 'r1', name: 'Daniel Lim', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', rating: 5, text: 'Smooth transaction, exactly as described.', time: '3 days ago' },
  { id: 'r2', name: 'Maya R.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80', rating: 5, text: 'Best seller on G2G. Fast shipping & verified seal.', time: '1 week ago' },
  { id: 'r3', name: 'Kenji Y.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80', rating: 4, text: 'Great communication and fair price.', time: '2 weeks ago' },
];

export default function Profile() {
  const { user, login } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });

  const save = () => { login({ ...user, name: form.name, email: form.email }); toast.success('Profile updated'); setOpen(false); };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-navy">
        <img alt="" src="https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?auto=format&fit=crop&w=1600&q=80" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-tr from-navy via-navy/70 to-teal-500/30" />
        <div className="relative flex flex-col items-start gap-6 p-6 sm:p-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-end gap-5">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-white/20"><AvatarImage src={user?.avatar} /><AvatarFallback>{user?.name?.[0]}</AvatarFallback></Avatar>
              <button className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-teal-500 text-white"><Camera className="h-4 w-4" /></button>
            </div>
            <div className="text-white">
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-3xl font-bold">{user?.name}</h1>
                <BadgeCheck className="h-6 w-6 text-teal-300" />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-amber-300 text-amber-300" /> {user?.rating} ({user?.reviews} reviews)</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> Singapore</span>
                <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> Member since {user?.memberSince}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button data-testid="edit-profile-btn" onClick={() => setOpen(true)} variant="outline" className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10"><Edit3 className="mr-2 h-4 w-4" />Edit profile</Button>
          </div>
        </div>
      </div>

      {/* Trust stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { i: ShieldCheck, l: 'Trust Score', v: `${user?.trustScore ?? 96}/100`, c: 'text-emerald-600' },
          { i: BadgeCheck, l: 'Verifications', v: 'ID · Phone · Email', c: 'text-teal-600' },
          { i: Trophy, l: 'Top Seller', v: 'Gold tier', c: 'text-amber-600' },
          { i: Star, l: 'Rating', v: `${user?.rating}/5`, c: 'text-rose-600' },
        ].map(s => (
          <div key={s.l} className="bento-card p-5">
            <s.i className={`h-5 w-5 ${s.c}`} />
            <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{s.l}</p>
            <p className="mt-1 font-heading text-xl font-bold">{s.v}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="listings">
        <TabsList className="rounded-full bg-muted">
          <TabsTrigger value="listings" className="rounded-full" data-testid="tab-listings">Listings</TabsTrigger>
          <TabsTrigger value="sold" className="rounded-full" data-testid="tab-sold">Sold</TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-full" data-testid="tab-reviews">Reviews</TabsTrigger>
          <TabsTrigger value="verification" className="rounded-full" data-testid="tab-verification">Verification</TabsTrigger>
        </TabsList>
        <TabsContent value="listings" className="mt-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{PRODUCTS.slice(0, 3).map(p => <ProductCard key={p.id} product={p} />)}</div>
        </TabsContent>
        <TabsContent value="sold" className="mt-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{PRODUCTS.slice(3, 6).map(p => <ProductCard key={p.id} product={p} />)}</div>
        </TabsContent>
        <TabsContent value="reviews" className="mt-6 space-y-3">
          {REVIEWS.map(r => (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} key={r.id} className="bento-card p-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10"><AvatarImage src={r.avatar} /><AvatarFallback>{r.name[0]}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{r.name}</p>
                  <div className="flex items-center gap-1">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}</div>
                </div>
                <p className="text-xs text-muted-foreground">{r.time}</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed">{r.text}</p>
            </motion.div>
          ))}
        </TabsContent>
        <TabsContent value="verification" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { l: 'ID Verification', s: 'Verified', d: 'Government-issued ID confirmed.' },
              { l: 'Phone', s: 'Verified', d: 'Mobile number confirmed via SMS.' },
              { l: 'Email', s: 'Verified', d: 'Email address confirmed.' },
              { l: 'Bank Account', s: 'Pending', d: 'Add a bank to enable instant withdrawals.' },
            ].map(v => (
              <div key={v.l} className="bento-card p-5">
                <div className="flex items-center justify-between">
                  <p className="font-heading font-semibold">{v.l}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${v.s === 'Verified' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}>{v.s}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{v.d}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit profile</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Name</Label><Input data-testid="edit-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input data-testid="edit-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input data-testid="edit-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button data-testid="save-profile" onClick={save} className="bg-navy hover:bg-navy-700">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
