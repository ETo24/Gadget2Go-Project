import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Star, ShieldCheck, MapPin, Calendar, Edit3, Camera, Trophy, Store } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import ProductCard from '../components/ProductCard';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';

function fileToDataUrl(file) {
  return new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(file); });
}

export default function Profile() {
  const { user, refreshUser } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', bio: user?.bio || '', location: user?.location || '' });
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!user) return;
    setForm({ name: user.name, phone: user.phone || '', bio: user.bio || '', location: user.location || '' });
    api.get('/listings/mine/me').then(r => setListings(r.data)).catch(() => {});
    api.get(`/reviews/seller/${user.id}`).then(r => setReviews(r.data)).catch(() => {});
  }, [user?.id]);

  const save = async () => {
    try {
      await api.patch('/users/me', form);
      await refreshUser();
      toast.success('Profile updated');
      setOpen(false);
    } catch (e) { toast.error(e.message); }
  };

  const onAvatar = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const dataUrl = await fileToDataUrl(f);
    try {
      await api.post('/users/me/avatar', { avatar: dataUrl });
      await refreshUser();
      toast.success('Profile picture updated');
    } catch (err) { toast.error(err.message); }
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-navy">
        <img alt="" src="https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?auto=format&fit=crop&w=1600&q=80" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-tr from-navy via-navy/70 to-teal-500/30" />
        <div className="relative flex flex-col items-start gap-6 p-6 sm:p-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-end gap-5">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-white/20">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-navy-700 text-white">{user.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <label data-testid="avatar-upload" className="absolute -bottom-1 -right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-teal-500 text-white hover:bg-teal-600">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
              </label>
            </div>
            <div className="text-white">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading text-3xl font-bold">{user.name}</h1>
                {user.role === 'dealer' && <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold backdrop-blur"><Store className="h-3 w-3" />Dealer</span>}
                {user.kycStatus === 'approved' && <BadgeCheck className="h-6 w-6 text-teal-300" />}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-amber-300 text-amber-300" /> {user.rating}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {user.location || 'Set location'}</span>
                <span className="inline-flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-teal-300" /> {user.trustLabel} ({user.trustScore})</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button data-testid="edit-profile-btn" onClick={() => setOpen(true)} variant="outline" className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10"><Edit3 className="mr-2 h-4 w-4" />Edit profile</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { i: ShieldCheck, l: 'Trust Score', v: `${user.trustScore}/100`, c: 'text-emerald-600' },
          { i: BadgeCheck, l: 'KYC Status', v: user.kycStatus, c: 'text-teal-600' },
          { i: Trophy, l: 'Completed Deals', v: user.dealsCompleted ?? 0, c: 'text-amber-600' },
          { i: Star, l: 'Rating', v: `${user.rating}/5`, c: 'text-rose-600' },
        ].map(s => (
          <div key={s.l} className="bento-card p-5">
            <s.i className={`h-5 w-5 ${s.c}`} />
            <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{s.l}</p>
            <p className="mt-1 font-heading text-xl font-bold capitalize">{s.v}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="listings">
        <TabsList className="rounded-full bg-muted">
          <TabsTrigger value="listings" className="rounded-full" data-testid="tab-listings">Listings</TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-full" data-testid="tab-reviews">Reviews</TabsTrigger>
          <TabsTrigger value="verification" className="rounded-full" data-testid="tab-verification">Verification</TabsTrigger>
        </TabsList>
        <TabsContent value="listings" className="mt-6">
          {listings.length === 0 ? <div className="bento-card p-10 text-center text-muted-foreground">No listings yet.</div> :
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{listings.map(p => <ProductCard key={p.id} product={p} />)}</div>}
        </TabsContent>
        <TabsContent value="reviews" className="mt-6 space-y-3">
          {reviews.length === 0 ? <div className="bento-card p-10 text-center text-muted-foreground">No reviews yet.</div> :
            reviews.map(r => (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} key={r.id} className="bento-card p-5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10"><AvatarImage src={r.fromAvatar} /><AvatarFallback>{r.fromName?.[0]}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{r.fromName}</p>
                    <div className="flex items-center gap-1">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}</div>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed">{r.text}</p>
              </motion.div>
            ))}
        </TabsContent>
        <TabsContent value="verification" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { l: 'Email', s: user.emailVerified ? 'Verified' : 'Pending', d: user.email },
              { l: 'Phone', s: user.phoneVerified ? 'Verified' : 'Not verified', d: user.phone || '—' },
              { l: 'Identity (KYC)', s: user.kycStatus, d: user.kycStatus === 'approved' ? 'Government ID confirmed.' : 'Required to sell on G2G.' },
              { l: 'Account type', s: user.role === 'dealer' ? 'Dealer' : 'Personal', d: 'Set during signup.' },
            ].map(v => (
              <div key={v.l} className="bento-card p-5">
                <div className="flex items-center justify-between">
                  <p className="font-heading font-semibold">{v.l}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${v.s === 'Verified' || v.s === 'approved' || v.s === 'Dealer' || v.s === 'Personal' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}>{v.s}</span>
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
            <div className="space-y-2"><Label>Phone</Label><Input data-testid="edit-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Location</Label><Input data-testid="edit-location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="space-y-2"><Label>Bio</Label><Textarea data-testid="edit-bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button data-testid="save-profile" onClick={save} className="bg-navy hover:bg-navy-700">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
