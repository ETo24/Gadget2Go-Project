import React, { useEffect, useState } from 'react';
import { Wallet as WalletIcon, Clock, CheckCircle2, AlertCircle, RotateCcw, ArrowDownLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

function Countdown({ until }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 60000); return () => clearInterval(i); }, []);
  const ms = new Date(until) - new Date();
  if (ms <= 0) return <span className="text-emerald-600 font-semibold">Protection ended</span>;
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  return <span className="text-amber-700 dark:text-amber-400 font-semibold">{days}d {hours}h left</span>;
}

export default function Wallet() {
  const { user, refreshUser } = useApp();
  const [data, setData] = useState({ bought: [], sold: [] });
  const [refunds, setRefunds] = useState([]);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundPayment, setRefundPayment] = useState(null);
  const [reason, setReason] = useState('');

  const load = async () => {
    try {
      const p = await api.get('/payments/mine'); setData(p.data);
      const r = await api.get('/refunds/mine'); setRefunds(r.data);
    } catch (e) { toast.error(e.message); }
  };
  useEffect(() => { load(); }, []);

  const confirmReceipt = async (id) => {
    try { await api.post(`/payments/${id}/confirm`); toast.success('Receipt confirmed. Funds released to seller.'); await load(); await refreshUser(); }
    catch (e) { toast.error(e.message); }
  };

  const submitRefund = async () => {
    if (!reason.trim()) return toast.error('Tell us what went wrong');
    try { await api.post('/refunds', { paymentId: refundPayment.id, reason }); toast.success('Refund request submitted'); setRefundOpen(false); setReason(''); await load(); }
    catch (e) { toast.error(e.message); }
  };

  const PaymentCard = ({ p, side }) => (
    <div className="bento-card flex items-center gap-4 p-4">
      <img src={p.image} alt="" className="h-16 w-16 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 font-heading font-semibold">{p.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2 py-0.5 font-bold capitalize ${p.status === 'escrow' ? 'bg-amber-50 text-amber-700' : p.status === 'released' ? 'bg-emerald-50 text-emerald-700' : 'bg-muted'}`}>{p.status}</span>
          <span className="text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
          {p.status === 'escrow' && <Countdown until={p.protectionEndsAt} />}
        </div>
      </div>
      <div className="text-right">
        <p className={`font-heading text-lg font-bold ${side === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>{side === 'in' ? '+' : '-'}${p.amount}</p>
        {side === 'out' && p.status === 'escrow' && (
          <div className="mt-1 flex gap-1">
            <Button size="sm" className="h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-xs" data-testid={`confirm-${p.id}`} onClick={() => confirmReceipt(p.id)}><CheckCircle2 className="mr-1 h-3 w-3" />Received</Button>
            <Button size="sm" variant="outline" className="h-7 rounded-full text-xs" data-testid={`refund-${p.id}`} onClick={() => { setRefundPayment(p); setRefundOpen(true); }}><RotateCcw className="mr-1 h-3 w-3" />Refund</Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">Wallet & Orders</h1>
        <p className="text-muted-foreground">Track payments, refunds, and escrow protection.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bento-card relative overflow-hidden bg-navy p-6 text-white">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-teal-500/30 blur-3xl" />
          <WalletIcon className="h-5 w-5 text-teal-300" />
          <p className="mt-3 text-xs uppercase tracking-wider text-white/60">Available balance</p>
          <p className="mt-1 font-heading text-3xl font-bold">${user?.walletBalance || 0}</p>
          <Button variant="outline" className="mt-4 rounded-full border-white/30 bg-transparent text-white hover:bg-white/10">Withdraw</Button>
        </div>
        <div className="bento-card p-6">
          <Clock className="h-5 w-5 text-amber-600" />
          <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">In escrow</p>
          <p className="mt-1 font-heading text-3xl font-bold">${data.bought.filter(p => p.status === 'escrow').reduce((s, p) => s + p.amount, 0)}</p>
        </div>
        <div className="bento-card p-6">
          <ShieldCheck className="h-5 w-5 text-teal-600" />
          <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Lifetime sales</p>
          <p className="mt-1 font-heading text-3xl font-bold">${data.sold.filter(p => p.status === 'released').reduce((s, p) => s + p.amount, 0)}</p>
        </div>
      </div>

      <Tabs defaultValue="bought">
        <TabsList className="rounded-full bg-muted">
          <TabsTrigger value="bought" className="rounded-full" data-testid="tab-bought"><ArrowUpRight className="mr-2 h-4 w-4" />Purchases</TabsTrigger>
          <TabsTrigger value="sold" className="rounded-full" data-testid="tab-sold"><ArrowDownLeft className="mr-2 h-4 w-4" />Sales</TabsTrigger>
          <TabsTrigger value="refunds" className="rounded-full" data-testid="tab-refunds"><RotateCcw className="mr-2 h-4 w-4" />Refunds</TabsTrigger>
        </TabsList>
        <TabsContent value="bought" className="mt-4 space-y-3">
          {data.bought.length === 0 ? <div className="bento-card p-10 text-center text-muted-foreground">No purchases yet.</div> : data.bought.map(p => <PaymentCard key={p.id} p={p} side="out" />)}
        </TabsContent>
        <TabsContent value="sold" className="mt-4 space-y-3">
          {data.sold.length === 0 ? <div className="bento-card p-10 text-center text-muted-foreground">No sales yet.</div> : data.sold.map(p => <PaymentCard key={p.id} p={p} side="in" />)}
        </TabsContent>
        <TabsContent value="refunds" className="mt-4 space-y-3">
          {refunds.length === 0 ? <div className="bento-card p-10 text-center text-muted-foreground">No refund requests.</div> :
            refunds.map(r => (
              <div key={r.id} className="bento-card flex items-center justify-between gap-4 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-1 h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-heading font-semibold">Refund — ${r.amount}</p>
                    <p className="text-xs text-muted-foreground">{r.reason}</p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 capitalize">{r.status}</span>
              </div>
            ))}
        </TabsContent>
      </Tabs>

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request refund</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>What went wrong?</Label>
            <Textarea data-testid="refund-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Item not as described, never arrived, etc." className="rounded-xl" />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setRefundOpen(false)}>Cancel</Button><Button data-testid="submit-refund" onClick={submitRefund} className="bg-rose-600 hover:bg-rose-700">Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
