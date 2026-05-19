import React, { useEffect, useState } from 'react';
import { Wallet as WalletIcon, Clock, CheckCircle2, AlertCircle, RotateCcw, ArrowDownLeft, ArrowUpRight, ShieldCheck, Plus, CreditCard, Building2, TrendingUp, History } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Skeleton } from '../components/ui/skeleton';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

function Countdown({ until }) {
  const [, force] = useState(0);
  useEffect(() => { const i = setInterval(() => force(t => t + 1), 60000); return () => clearInterval(i); }, []);
  const ms = new Date(until) - new Date();
  if (ms <= 0) return <span className="font-semibold text-emerald-600">Protection ended</span>;
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  return <span className="font-semibold text-amber-700 dark:text-amber-400">{days}d {hours}h left</span>;
}

const TX_ICONS = { topup: Plus, sale: ArrowDownLeft, purchase: ArrowUpRight, refund: RotateCcw };
const TX_COLORS = {
  topup: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10',
  sale: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10',
  purchase: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10',
  refund: 'text-teal-600 bg-teal-50 dark:bg-teal-500/10',
};

export default function Wallet() {
  const navigate = useNavigate();
  const { refreshUser } = useApp();
  const [wallet, setWallet] = useState({ balance: 0, pendingEscrow: 0, refundPending: 0, transactions: [] });
  const [orders, setOrders] = useState({ bought: [], sold: [] });
  const [refunds, setRefunds] = useState([]);
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmt, setTopupAmt] = useState(50);
  const [topupMethod, setTopupMethod] = useState('card');
  const [topping, setTopping] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundPayment, setRefundPayment] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const w = await api.get('/wallet/transactions'); setWallet(w.data);
      const p = await api.get('/payments/mine'); setOrders(p.data);
      const r = await api.get('/refunds/mine'); setRefunds(r.data);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submitTopup = async () => {
    if (!topupAmt || topupAmt <= 0) return toast.error('Enter a valid amount');
    setTopping(true);
    try {
      const { data } = await api.post('/wallet/topup', { amount: Number(topupAmt), method: topupMethod });
      toast.success(`Topped up $${topupAmt}. New balance: $${data.balance}`);
      setTopupOpen(false);
      await refreshUser();
      await load();
    } catch (e) { toast.error(e.message); }
    finally { setTopping(false); }
  };

  const confirmReceipt = async (id) => {
    try { await api.post(`/payments/${id}/confirm`); toast.success('Receipt confirmed. Funds released to seller.'); await load(); await refreshUser(); }
    catch (e) { toast.error(e.message); }
  };

  const submitRefund = async () => {
    if (!reason.trim()) return toast.error('Tell us what went wrong');
    try { await api.post('/refunds', { paymentId: refundPayment.id, reason }); toast.success('Refund request submitted to seller'); setRefundOpen(false); setReason(''); await load(); }
    catch (e) { toast.error(e.message); }
  };

  const PaymentCard = ({ p, side }) => (
    <div className="bento-card flex items-center gap-4 p-4">
      <img src={p.image} alt="" className="h-16 w-16 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 font-heading font-semibold">{p.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2 py-0.5 font-bold capitalize ${p.status === 'escrow' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : p.status === 'released' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : p.status === 'refunded' ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400' : 'bg-muted'}`}>{p.status}</span>
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">Wallet & Orders</h1>
          <p className="text-muted-foreground">Top up, track payments, refunds & escrow protection.</p>
        </div>
        <Button data-testid="open-topup" onClick={() => setTopupOpen(true)} className="rounded-full bg-teal-500 hover:bg-teal-600"><Plus className="mr-2 h-4 w-4" />Top up wallet</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="bento-card relative overflow-hidden bg-navy p-6 text-white sm:col-span-2">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-teal-500/30 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <WalletIcon className="h-6 w-6 text-teal-300" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-teal-300">Available</span>
            </div>
            <p className="mt-3 font-heading text-4xl font-bold">${(wallet.balance || 0).toLocaleString()}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button data-testid="topup-quick" onClick={() => setTopupOpen(true)} className="rounded-full bg-teal-500 hover:bg-teal-600">Add funds</Button>
              <Button variant="outline" className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10">Withdraw</Button>
            </div>
          </div>
        </div>
        <div className="bento-card p-6">
          <Clock className="h-5 w-5 text-amber-600" />
          <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">In escrow</p>
          <p className="mt-1 font-heading text-2xl font-bold">${wallet.pendingEscrow || 0}</p>
          <p className="mt-1 text-xs text-muted-foreground">Held until you confirm receipt</p>
        </div>
        <div className="bento-card p-6">
          <RotateCcw className="h-5 w-5 text-teal-600" />
          <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Refund balance</p>
          <p className="mt-1 font-heading text-2xl font-bold">${wallet.refundPending || 0}</p>
          <p className="mt-1 text-xs text-muted-foreground">Pending refunds in dispute</p>
        </div>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList className="rounded-full bg-muted">
          <TabsTrigger value="transactions" className="rounded-full" data-testid="tab-tx"><History className="mr-2 h-4 w-4" />Activity</TabsTrigger>
          <TabsTrigger value="bought" className="rounded-full" data-testid="tab-bought"><ArrowUpRight className="mr-2 h-4 w-4" />Purchases</TabsTrigger>
          <TabsTrigger value="sold" className="rounded-full" data-testid="tab-sold"><ArrowDownLeft className="mr-2 h-4 w-4" />Sales</TabsTrigger>
          <TabsTrigger value="refunds" className="rounded-full" data-testid="tab-refunds"><RotateCcw className="mr-2 h-4 w-4" />Refunds</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-4">
          {loading ? <Skeleton className="h-20 w-full rounded-2xl" /> :
            wallet.transactions.length === 0 ? <div className="bento-card p-10 text-center text-muted-foreground">No wallet activity yet. Top up to get started!</div> :
            <div className="space-y-2">
              {wallet.transactions.map(tx => {
                const Ic = TX_ICONS[tx.type] || History;
                const cls = TX_COLORS[tx.type] || 'text-muted-foreground bg-muted';
                const positive = tx.type === 'topup' || tx.type === 'sale' || tx.type === 'refund';
                return (
                  <div key={tx.id} className="bento-card flex items-center gap-4 p-4">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${cls}`}><Ic className="h-5 w-5" /></div>
                    <div className="flex-1">
                      <p className="font-heading font-semibold capitalize">{tx.type}</p>
                      <p className="text-xs text-muted-foreground">{tx.description}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p>
                    </div>
                    <p className={`font-heading text-lg font-bold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>{positive ? '+' : '-'}${tx.amount}</p>
                  </div>
                );
              })}
            </div>
          }
        </TabsContent>
        <TabsContent value="bought" className="mt-4 space-y-3">
          {orders.bought.length === 0 ? <div className="bento-card p-10 text-center text-muted-foreground">No purchases yet.</div> : orders.bought.map(p => <PaymentCard key={p.id} p={p} side="out" />)}
        </TabsContent>
        <TabsContent value="sold" className="mt-4 space-y-3">
          {orders.sold.length === 0 ? <div className="bento-card p-10 text-center text-muted-foreground">No sales yet.</div> : orders.sold.map(p => <PaymentCard key={p.id} p={p} side="in" />)}
        </TabsContent>
        <TabsContent value="refunds" className="mt-4 space-y-3">
          {refunds.length === 0 ? <div className="bento-card p-10 text-center text-muted-foreground">No refund requests.</div> :
            refunds.map(r => (
              <button key={r.id} onClick={() => navigate(`/refund/${r.id}`)} data-testid={`refund-card-${r.id}`} className="bento-card flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-muted/50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-1 h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-heading font-semibold">Refund — ${r.amount}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{r.reason}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold capitalize ${r.status === 'refunded' ? 'bg-emerald-50 text-emerald-700' : r.status === 'rejected' || r.status === 'closed' ? 'bg-rose-50 text-rose-700' : r.status === 'under_admin_review' ? 'bg-amber-50 text-amber-700' : 'bg-teal-50 text-teal-700'}`}>{r.status.replace(/_/g, ' ')}</span>
              </button>
            ))}
        </TabsContent>
      </Tabs>

      {/* Top-up Dialog */}
      <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Top up wallet</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {[20, 50, 100, 200].map(v => (
                <button key={v} data-testid={`topup-amt-${v}`} onClick={() => setTopupAmt(v)} className={`rounded-2xl border-2 p-3 text-center font-heading font-bold ${topupAmt === v ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10' : 'border-border'}`}>${v}</button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Or custom amount</Label>
              <Input data-testid="topup-amount" type="number" min="1" max="10000" value={topupAmt} onChange={(e) => setTopupAmt(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Payment method (simulated)</Label>
              <div className="grid grid-cols-2 gap-2">
                {[{ v: 'card', l: 'Card', i: CreditCard }, { v: 'bank', l: 'Bank', i: Building2 }].map(o => (
                  <button key={o.v} data-testid={`topup-method-${o.v}`} onClick={() => setTopupMethod(o.v)} className={`flex items-center gap-2 rounded-xl border-2 p-3 ${topupMethod === o.v ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10' : 'border-border'}`}>
                    <o.i className="h-4 w-4 text-teal-600" />
                    <span className="text-sm font-medium">{o.l}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopupOpen(false)}>Cancel</Button>
            <Button data-testid="submit-topup" onClick={submitTopup} disabled={topping} className="bg-navy hover:bg-navy-700">{topping ? 'Processing…' : `Top up $${topupAmt}`}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund request Dialog */}
      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request refund</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>What went wrong?</Label>
            <Textarea data-testid="refund-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Item not as described, never arrived, etc." className="rounded-xl" />
            <p className="text-xs text-muted-foreground">Your seller will respond. If they reject, you can escalate to G2G admin for review.</p>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setRefundOpen(false)}>Cancel</Button><Button data-testid="submit-refund" onClick={submitRefund} className="bg-rose-600 hover:bg-rose-700">Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
