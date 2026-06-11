import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Share2, MapPin, BadgeCheck, Star, ShieldCheck, MessageCircle, Sparkles, ChevronLeft, Battery, Cpu, HardDrive, Package, Truck, RotateCcw, Flag, Store, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { CONDITION_GRADES } from '../lib/mockData';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLiked, toggleLike, addRecentlyViewed, user } = useApp();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/listings/${id}`).then(r => { setProduct(r.data); addRecentlyViewed(r.data.id); }).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, [id, addRecentlyViewed]);

  if (loading) return (
    <div className="grid gap-8 lg:grid-cols-2"><Skeleton className="aspect-square rounded-3xl" /><div className="space-y-4"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-6 w-1/3" /><Skeleton className="h-32 w-full" /></div></div>
  );
  if (!product) return <div className="p-10 text-center"><p>Listing not found.</p><Link to="/buy" className="text-teal-700 underline">Back to marketplace</Link></div>;

  const liked = isLiked(product.id);
  const cond = CONDITION_GRADES.find(c => c.id === product.condition);
  const aiDelta = (product.aiFair || product.price) - product.price;
  const seller = product.seller || {};
  const isOwn = user?.id === seller.id;

  const handleBuy = () => navigate(`/checkout/${product.id}`);
  const openChat = async () => {
    try {
      const { data } = await api.post('/chats', { otherUserId: seller.id, listingId: product.id });
      navigate(`/chat/${data.id}`);
    } catch (e) { toast.error(e.message); }
  };
  const submitReport = async () => {
    if (!reportReason.trim()) return toast.error('Tell us what went wrong');
    try {
      await api.post('/reports', { targetId: seller.id, targetType: 'user', listingId: product.id, reason: reportReason });
      toast.success('Report sent to G2G admin team.');
      setReportOpen(false);
      setReportReason('');
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-8">
      <Button variant="ghost" onClick={() => navigate(-1)} data-testid="back-btn" className="-ml-2"><ChevronLeft className="mr-1 h-4 w-4" />Back</Button>

      {/* Scam-prevention banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-300">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Stay safe on G2G</p>
          <p className="text-xs">Always pay through G2G Escrow. Never share OTPs. If a deal looks too good to be true, report it.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative aspect-square overflow-hidden rounded-[2rem] bg-muted">
            <img src={product.images[active]} alt={product.title} className="h-full w-full object-cover" />
            <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-navy backdrop-blur">{cond?.label} · Grade {product.condition}</span>
            {seller.verified && <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-teal-500 px-3 py-1 text-xs font-bold text-white"><BadgeCheck className="h-3.5 w-3.5" />Verified</span>}
          </motion.div>
          <div className="flex gap-3">
            {product.images.map((src, i) => (
              <button key={i} onClick={() => setActive(i)} data-testid={`thumb-${i}`} className={`relative h-20 w-20 overflow-hidden rounded-2xl border-2 ${active === i ? 'border-teal-500' : 'border-transparent'}`}>
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />{product.location}{product.distanceKm !== undefined && ` · ${product.distanceKm} km away`}
          </div>
          <h1 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">{product.title}</h1>
          <div className="mt-4 flex items-end gap-4">
            <div>
              <p className="font-heading text-4xl font-bold">RM {Number(product.price).toLocaleString()}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-teal-700 dark:text-teal-400">
                <Sparkles className="h-4 w-4" />AI fair price: RM {Number(product.aiFair).toLocaleString()} {aiDelta > 0 && <span className="ml-1 rounded-full bg-emerald-50 px-2 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Good deal RM {aiDelta}</span>}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Spec icon={HardDrive} label="Storage" value={product.storage} />
            <Spec icon={Cpu} label="RAM" value={product.ram} />
            <Spec icon={Battery} label="Battery" value={product.batteryHealth ? `${product.batteryHealth}%` : '—'} />
            <Spec icon={ShieldCheck} label="Warranty" value={product.warranty} />
          </div>

          {!isOwn && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Button data-testid="buy-now-btn" onClick={handleBuy} className="h-12 flex-1 rounded-full bg-navy text-base hover:bg-navy-700">Buy now (Escrow)</Button>
              <Button data-testid="chat-seller-btn" onClick={openChat} variant="outline" className="h-12 flex-1 rounded-full"><MessageCircle className="mr-2 h-4 w-4" />Chat seller</Button>
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full" data-testid="detail-save-btn" onClick={() => toggleLike(product.id)}>
                <Heart className={`h-5 w-5 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full"><Share2 className="h-5 w-5" /></Button>
            </div>
          )}

          {/* Seller */}
          <div className="mt-6 bento-card p-5">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12"><AvatarImage src={seller.avatar} /><AvatarFallback>{seller.name?.[0]}</AvatarFallback></Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-heading font-semibold">{seller.name}</p>
                  {seller.role === 'dealer' && <span className="inline-flex items-center gap-1 rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold text-white"><Store className="h-3 w-3" />Dealer</span>}
                  {seller.verified && <BadgeCheck className="h-4 w-4 text-teal-600" />}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{seller.rating}</span>
                  <span>{seller.deals} deals</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-teal-700 dark:text-teal-400"><ShieldCheck className="h-3 w-3" />{seller.trustLabel} · {seller.trustScore}/100</span>
                </div>
              </div>
            </div>
            {!isOwn && (
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="rounded-full" data-testid="report-btn" onClick={() => setReportOpen(true)}><Flag className="mr-1 h-3 w-3" />Report</Button>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[
              { i: ShieldCheck, t: 'Escrow protected' },
              { i: Package, t: 'Inspected' },
              { i: RotateCcw, t: '7-day return' },
            ].map((x) => (
              <div key={x.t} className="bento-card flex flex-col items-center gap-1 p-3">
                <x.i className="h-5 w-5 text-teal-600" />
                <p className="text-[11px] font-medium text-muted-foreground">{x.t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 rounded-full bg-muted">
          <TabsTrigger value="description" className="rounded-full" data-testid="tab-description">Description</TabsTrigger>
          <TabsTrigger value="condition" className="rounded-full" data-testid="tab-condition">Condition</TabsTrigger>
          <TabsTrigger value="shipping" className="rounded-full" data-testid="tab-shipping">Shipping</TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="mt-6"><div className="bento-card p-6"><p className="leading-relaxed text-foreground/80">{product.description}</p></div></TabsContent>
        <TabsContent value="condition" className="mt-6">
          <div className="bento-card p-6">
            <p className="font-heading text-lg font-bold">Condition report</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                { l: 'Screen', v: 'No scratches or dead pixels' },
                { l: 'Body', v: 'Minor wear on corners' },
                { l: 'Battery health', v: product.batteryHealth ? `${product.batteryHealth}% (Excellent)` : 'Not applicable' },
                { l: 'Functionality', v: 'All buttons & cameras work perfectly' },
              ].map(x => (
                <div key={x.l} className="rounded-2xl border border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{x.l}</p>
                  <p className="mt-1 font-medium">{x.v}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="shipping" className="mt-6"><div className="bento-card p-6"><div className="flex items-center gap-3"><Truck className="h-5 w-5 text-teal-600" /> <p>Delivery in 2–3 working days via G2G Express.</p></div><p className="mt-2 text-sm text-muted-foreground">Free delivery for orders above RM 500. Real-time tracking with Cybridge logistics.</p></div></TabsContent>
      </Tabs>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Report this seller</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>What went wrong?</Label>
            <Textarea data-testid="report-reason" value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Describe the issue (scam, fake item, no response…)" rows={4} className="rounded-xl" />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button><Button onClick={submitReport} data-testid="submit-report" className="bg-rose-600 hover:bg-rose-700">Send report</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Spec({ icon: Ic, label, value }) {
  return (
    <div className="bento-card p-3">
      <Ic className="h-4 w-4 text-teal-600" />
      <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value || '—'}</p>
    </div>
  );
}
