import React, { useEffect, useState } from 'react';
import {
  Wallet as WalletIcon, Clock, CheckCircle2, AlertCircle, RotateCcw,
  ArrowDownLeft, ArrowUpRight, Plus, CreditCard, Building2, History,
  Mail, ChevronRight, ShieldCheck, ExternalLink, MessageSquare,
} from 'lucide-react';
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

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Live countdown — refreshes every minute */
function Countdown({ until }) {
  const [, force] = useState(0);
  useEffect(() => {
    const i = setInterval(() => force(t => t + 1), 60000);
    return () => clearInterval(i);
  }, []);
  const ms = new Date(until) - new Date();
  if (ms <= 0) return <span className="font-semibold text-muted-foreground">Protection expired</span>;
  const days  = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  return (
    <span className="font-semibold text-amber-700 dark:text-amber-400">
      {days}d {hours}h buyer protection left
    </span>
  );
}

const TX_ICONS  = { topup: Plus, sale: ArrowDownLeft, purchase: ArrowUpRight, refund: RotateCcw };
const TX_COLORS = {
  topup:    'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10',
  sale:     'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10',
  purchase: 'text-rose-600   bg-rose-50    dark:bg-rose-500/10',
  refund:   'text-teal-600   bg-teal-50    dark:bg-teal-500/10',
};

const REFUND_STATUS_META = {
  pending:            { color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',          label: 'Pending seller response' },
  rejected:           { color: 'bg-rose-50  text-rose-700  dark:bg-rose-500/10  dark:text-rose-400',           label: 'Rejected by seller'       },
  under_admin_review: { color: 'bg-blue-50  text-blue-700  dark:bg-blue-500/10  dark:text-blue-400',           label: 'Under admin review'       },
  refunded:           { color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',  label: 'Refunded'                 },
  closed:             { color: 'bg-muted text-muted-foreground',                                                label: 'Closed'                   },
};

// ─── component ───────────────────────────────────────────────────────────────

export default function Wallet() {
  const navigate = useNavigate();
  const { refreshUser, user } = useApp();

  const [wallet,   setWallet]   = useState({ balance: 0, pendingEscrow: 0, transactions: [] });
  const [orders,   setOrders]   = useState({ bought: [], sold: [] });
  const [refunds,  setRefunds]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Top-up dialog
  const [topupOpen,   setTopupOpen]   = useState(false);
  const [topupAmt,    setTopupAmt]    = useState(50);
  const [topupMethod, setTopupMethod] = useState('card');
  const [topping,     setTopping]     = useState(false);

  // Refund request dialog
  const [refundOpen,    setRefundOpen]    = useState(false);
  const [refundPayment, setRefundPayment] = useState(null);
  const [reason,        setReason]        = useState('');
  const [contactEmail,  setContactEmail]  = useState(user?.email || '');
  const [submitting,    setSubmitting]    = useState(false);

  // paymentIds that already have a refund (disables the Refund button)
  const [refundedPaymentIds, setRefundedPaymentIds] = useState(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const [w, p, r] = await Promise.all([
        api.get('/wallet/transactions'),
        api.get('/payments/mine'),
        api.get('/refunds/mine'),
      ]);
      setWallet(w.data);
      setOrders(p.data);
      setRefunds(r.data);
      setRefundedPaymentIds(new Set(r.data.map(rf => rf.paymentId)));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── actions ────────────────────────────────────────────────────────────────

  const submitTopup = async () => {
    if (!topupAmt || topupAmt <= 0) return toast.error('Enter a valid amount');
    setTopping(true);
    try {
      const { data } = await api.post('/wallet/topup', { amount: Number(topupAmt), method: topupMethod });
      toast.success(`Topped up: RM ${topupAmt}. New balance: RM ${data.balance}`);
      setTopupOpen(false);
      await refreshUser();
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setTopping(false);
    }
  };

  const openRefundDialog = (p) => {
    setRefundPayment(p);
    setContactEmail(user?.email || '');
    setReason('');
    setRefundOpen(true);
  };

  const submitRefund = async () => {
    if (!reason.trim()) return toast.error('Please describe what went wrong');
    if (!contactEmail.trim() || !contactEmail.includes('@')) return toast.error('Please enter a valid email address');
    setSubmitting(true);
    try {
      await api.post('/refunds', {
        paymentId: refundPayment.id,
        reason: `${reason.trim()} [Contact: ${contactEmail.trim()}]`,
      });
      toast.success('Refund request submitted. The seller will review and respond.');
      setRefundOpen(false);
      setReason('');
      await load();
    } catch (e) {
      const detail = e?.response?.data?.detail;
      const msg = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map(d => d.msg || d).join(', ')
          : (e?.message || 'Failed to submit refund');
      if (msg.includes('already exists') || msg.includes('409') || msg.includes('one refund')) {
        toast.error('You already have an open refund for this item.');
      } else if (msg.includes('already released') || msg.includes('not in escrow')) {
        toast.error('This payment has already been released — refund not possible.');
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Seller: respond to a refund directly from the wallet card
  const sellerRespond = async (refundId, action) => {
    try {
      await api.post(`/refunds/${refundId}/respond`, { action });
      toast.success(action === 'accept'
        ? 'Refund accepted — buyer will be credited.'
        : 'Refund rejected. Buyer can escalate if needed.');
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to respond');
    }
  };

  // Buyer: escalate a rejected refund to admin
  const escalateRefund = async (refundId) => {
    try {
      await api.post(`/refunds/${refundId}/escalate`, { reason: 'Buyer escalated from wallet' });
      toast.success('Escalated to admin team.');
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to escalate');
    }
  };

  // ── PaymentCard ────────────────────────────────────────────────────────────
  // Used for both Purchases (side="out") and Sales (side="in")

  const PaymentCard = ({ p, side }) => {
    const isEscrow    = p.status === 'escrow';
    const isReleased  = p.status === 'released';
    const isCompleted = p.status === 'completed';
    const isRefunded  = p.status === 'refunded';
    const hasRefund   = refundedPaymentIds.has(p.id);

    // ── Buyer-protection window check ──────────────────────────────────────
    // Refund button is only active while protectionEndsAt is in the future
    const protectionEndsAt  = p.protectionEndsAt ? new Date(p.protectionEndsAt) : null;
    const withinProtection  = protectionEndsAt && new Date() < protectionEndsAt;
    const canRequestRefund  = side === 'out' && isEscrow && !hasRefund && withinProtection;
    const refundExpired     = side === 'out' && isEscrow && !hasRefund && !withinProtection;

    const statusBadge = (
      <span className={`rounded-full px-2 py-0.5 font-bold capitalize text-xs
        ${isEscrow    ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : ''}
        ${isReleased  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : ''}
        ${isCompleted ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : ''}
        ${isRefunded  ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400' : ''}
        ${!isEscrow && !isReleased && !isCompleted && !isRefunded ? 'bg-muted text-muted-foreground' : ''}
      `}>
        {isCompleted ? 'Completed' : p.status}
      </span>
    );

    return (
      <div className="bento-card flex items-center gap-4 p-4">
        {p.image && <img src={p.image} alt="" className="h-16 w-16 rounded-xl object-cover shrink-0" />}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 font-heading font-semibold">{p.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            {statusBadge}
            <span className="text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
            {/* Live countdown shown on buyer side while in escrow */}
            {side === 'out' && isEscrow && protectionEndsAt && <Countdown until={p.protectionEndsAt} />}
            {isCompleted && p.autoReleased && (
              <span className="text-xs text-muted-foreground italic">Auto-completed after protection period</span>
            )}
          </div>
          {/* Refund status link for buyer */}
          {hasRefund && side === 'out' && (() => {
            const rf = refunds.find(r => r.paymentId === p.id);
            if (!rf) return null;
            const rm = REFUND_STATUS_META[rf.status] || { color: 'bg-muted', label: rf.status };
            return (
              <button
                onClick={() => navigate(`/refund/${rf.id}`)}
                className="mt-1.5 flex items-center gap-1 text-xs text-teal-600 hover:underline"
              >
                <ShieldCheck className="h-3 w-3" />
                Refund {rm.label.toLowerCase()} — View status
                <ChevronRight className="h-3 w-3" />
              </button>
            );
          })()}
        </div>

        <div className="text-right shrink-0">
          <p className={`font-heading text-lg font-bold ${side === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {side === 'in' ? '+' : '-'}RM {p.amount}
          </p>

          {/* ── BUYER side: only Refund button (no Received button) ── */}
          {side === 'out' && isEscrow && (
            <div className="mt-1 flex gap-1 justify-end">
              {canRequestRefund && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-full text-xs"
                  data-testid={`refund-${p.id}`}
                  onClick={() => openRefundDialog(p)}
                >
                  <RotateCcw className="mr-1 h-3 w-3" />Refund
                </Button>
              )}
              {refundExpired && (
                <span
                  title="Buyer protection window has closed"
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground cursor-not-allowed"
                >
                  <AlertCircle className="h-3 w-3" />Refund expired
                </span>
              )}
              {hasRefund && (
                <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  Refund filed
                </span>
              )}
            </div>
          )}

          {/* ── SELLER side (Sales tab): escrow status info only ── */}
          {side === 'in' && isEscrow && (
            <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              Awaiting release
            </span>
          )}
        </div>
      </div>
    );
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">Wallet & Orders</h1>
          <p className="text-muted-foreground">Top up, track payments, refunds & escrow protection.</p>
        </div>
        <Button data-testid="open-topup" onClick={() => setTopupOpen(true)} className="rounded-full bg-teal-500 hover:bg-teal-600">
          <Plus className="mr-2 h-4 w-4" />Top up wallet
        </Button>
      </div>

      {/* Balance cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bento-card relative overflow-hidden bg-navy p-6 text-white sm:col-span-2">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-teal-500/30 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <WalletIcon className="h-6 w-6 text-teal-300" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-teal-300">Available</span>
            </div>
            <p className="mt-3 font-heading text-4xl font-bold">RM {(wallet.balance || 0).toLocaleString()}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button data-testid="topup-quick" onClick={() => setTopupOpen(true)} className="rounded-full bg-teal-500 hover:bg-teal-600">
                Add funds
              </Button>
              <Button variant="outline" className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10">
                Withdraw
              </Button>
            </div>
          </div>
        </div>
        <div className="bento-card p-6">
          <Clock className="h-5 w-5 text-amber-600" />
          <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">In escrow</p>
          <p className="mt-1 font-heading text-2xl font-bold">RM {wallet.pendingEscrow || 0}</p>
          <p className="mt-1 text-xs text-muted-foreground">Auto-released after 7-day protection window</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions">
        <TabsList className="rounded-full bg-muted">
          <TabsTrigger value="transactions" className="rounded-full" data-testid="tab-tx">
            <History className="mr-2 h-4 w-4" />Activity
          </TabsTrigger>
          <TabsTrigger value="bought" className="rounded-full" data-testid="tab-bought">
            <ArrowUpRight className="mr-2 h-4 w-4" />Purchases
          </TabsTrigger>
          <TabsTrigger value="sold" className="rounded-full" data-testid="tab-sold">
            <ArrowDownLeft className="mr-2 h-4 w-4" />Sales
          </TabsTrigger>
          <TabsTrigger value="refunds" className="rounded-full" data-testid="tab-refunds">
            <RotateCcw className="mr-2 h-4 w-4" />Refunds
          </TabsTrigger>
        </TabsList>

        {/* Activity */}
        <TabsContent value="transactions" className="mt-4">
          {loading ? <Skeleton className="h-20 w-full rounded-2xl" /> :
            wallet.transactions.length === 0
              ? <div className="bento-card p-10 text-center text-muted-foreground">No wallet activity yet. Top up to get started!</div>
              : (
                <div className="space-y-2">
                  {wallet.transactions.map(tx => {
                    const Ic       = TX_ICONS[tx.type] || History;
                    const cls      = TX_COLORS[tx.type] || 'text-muted-foreground bg-muted';
                    const positive = ['topup', 'sale', 'refund'].includes(tx.type);
                    return (
                      <div key={tx.id} className="bento-card flex items-center gap-4 p-4">
                        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${cls}`}>
                          <Ic className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-heading font-semibold capitalize">{tx.type}</p>
                          <p className="text-xs text-muted-foreground">{tx.description}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p>
                        </div>
                        <p className={`font-heading text-lg font-bold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {positive ? '+' : '-'}RM {tx.amount}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )
          }
        </TabsContent>

        {/* Purchases (buyer view) */}
        <TabsContent value="bought" className="mt-4 space-y-3">
          {loading
            ? <Skeleton className="h-20 w-full rounded-2xl" />
            : orders.bought.length === 0
              ? <div className="bento-card p-10 text-center text-muted-foreground">No purchases yet.</div>
              : orders.bought.map(p => <PaymentCard key={p.id} p={p} side="out" />)
          }
        </TabsContent>

        {/* Sales (seller view) */}
        <TabsContent value="sold" className="mt-4 space-y-3">
          {loading
            ? <Skeleton className="h-20 w-full rounded-2xl" />
            : orders.sold.length === 0
              ? <div className="bento-card p-10 text-center text-muted-foreground">No sales yet.</div>
              : orders.sold.map(p => <PaymentCard key={p.id} p={p} side="in" />)
          }
        </TabsContent>

        {/* Refunds — role-aware rendering */}
        <TabsContent value="refunds" className="mt-4 space-y-3">
          {loading
            ? <Skeleton className="h-20 w-full rounded-2xl" />
            : refunds.length === 0
              ? <div className="bento-card p-10 text-center text-muted-foreground">No refund requests yet.</div>
              : refunds.map(r => {
                  // ── KEY: branch on whether logged-in user is buyer or seller ──
                  const isBuyer = user?.id === r.buyerId;
                  const rm      = REFUND_STATUS_META[r.status] || { color: 'bg-muted', label: r.status };

                  return (
                    <div key={r.id} className="bento-card p-4 space-y-4">

                      {/* Role badge so each party knows their position */}
                      <div className="flex items-center justify-between">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide
                          ${isBuyer
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                            : 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400'}`}>
                          {isBuyer ? 'You are the buyer' : 'You are the seller'}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${rm.color}`}>
                          {/* Role-aware status label */}
                          {isBuyer ? rm.label : (
                            {
                              pending:            '⚠ Action required',
                              rejected:           'You rejected this',
                              under_admin_review: 'Escalated to admin',
                              refunded:           'Refund was accepted',
                              closed:             'Dispute closed',
                            }[r.status] ?? r.status
                          )}
                        </span>
                      </div>

                      {/* Item row */}
                      <div className="flex items-start gap-3">
                        {r.image
                          ? <img src={r.image} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0" />
                          : <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-50 dark:bg-amber-500/10">
                              <RotateCcw className="h-5 w-5 text-amber-600" />
                            </div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-semibold">{r.title || `Refund — RM ${r.amount}`}</p>
                          <p className="line-clamp-2 text-xs text-muted-foreground mt-0.5">{r.reason}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Opened {new Date(r.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {/* Buyer sees red -$amount; seller sees neutral amount */}
                          <p className={`font-heading text-lg font-bold
                            ${isBuyer ? 'text-rose-600' : 'text-foreground'}`}>
                            {isBuyer ? '-' : ''}RM {r.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Progress stepper — same for both parties */}
                      <div className="rounded-2xl bg-muted/40 p-4">
                        <RefundStatusTracker status={r.status} />
                      </div>

                      {/* ── SELLER action buttons (only when pending) ── */}
                      {!isBuyer && r.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 h-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                            onClick={() => sellerRespond(r.id, 'accept')}
                          >
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Accept refund
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-9 rounded-full border-rose-200 text-rose-600 hover:bg-rose-50 text-xs"
                            onClick={() => sellerRespond(r.id, 'reject')}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 rounded-full text-xs"
                            onClick={() => navigate(`/refund/${r.id}`)}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}

                      {/* ── BUYER: escalate button after seller rejects ── */}
                      {isBuyer && r.status === 'rejected' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 h-9 rounded-full bg-navy text-white text-xs"
                            onClick={() => escalateRefund(r.id)}
                          >
                            Escalate to admin
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 rounded-full text-xs"
                            onClick={() => navigate(`/refund/${r.id}`)}
                          >
                            Details
                          </Button>
                        </div>
                      )}

                      {/* View full dispute — shown for all other states */}
                      {(isBuyer || r.status !== 'pending') && !(isBuyer && r.status === 'rejected') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-full text-xs"
                          onClick={() => navigate(`/refund/${r.id}`)}
                          data-testid={`refund-card-${r.id}`}
                        >
                          <ExternalLink className="mr-2 h-3 w-3" />View full dispute details
                        </Button>
                      )}
                    </div>
                  );
                })
          }
        </TabsContent>
      </Tabs>

      {/* ── Top-up Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Top up wallet</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {[20, 50, 100, 200].map(v => (
                <button
                  key={v}
                  data-testid={`topup-amt-${v}`}
                  onClick={() => setTopupAmt(v)}
                  className={`rounded-2xl border-2 p-3 text-center font-heading font-bold transition-colors ${topupAmt === v ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10' : 'border-border'}`}
                >
                  RM {v}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Or custom amount</Label>
              <Input
                data-testid="topup-amount"
                type="number" min="1" max="10000"
                value={topupAmt}
                onChange={e => setTopupAmt(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment method (simulated)</Label>
              <div className="grid grid-cols-2 gap-2">
                {[{ v: 'card', l: 'Card', i: CreditCard }, { v: 'bank', l: 'Bank', i: Building2 }].map(o => (
                  <button
                    key={o.v}
                    data-testid={`topup-method-${o.v}`}
                    onClick={() => setTopupMethod(o.v)}
                    className={`flex items-center gap-2 rounded-xl border-2 p-3 transition-colors ${topupMethod === o.v ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10' : 'border-border'}`}
                  >
                    <o.i className="h-4 w-4 text-teal-600" />
                    <span className="text-sm font-medium">{o.l}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopupOpen(false)}>Cancel</Button>
            <Button data-testid="submit-topup" onClick={submitTopup} disabled={topping} className="bg-navy hover:bg-navy-700">
              {topping ? 'Processing…' : `Top up RM ${topupAmt}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Refund Request Dialog ─────────────────────────────────────────── */}
      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a Refund</DialogTitle>
          </DialogHeader>
          {refundPayment && (
            <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
              {refundPayment.image && (
                <img src={refundPayment.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
              )}
              <div>
                <p className="font-heading font-semibold text-sm">{refundPayment.title}</p>
                <p className="text-xs text-muted-foreground">RM {refundPayment.amount}</p>
              </div>
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What went wrong? <span className="text-rose-500">*</span></Label>
              <Textarea
                data-testid="refund-reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={4}
                placeholder="Item not as described, never arrived, wrong item received, etc."
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Contact email for follow-up <span className="text-rose-500">*</span>
              </Label>
              <Input
                data-testid="refund-email"
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="your@email.com"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="rounded-2xl bg-amber-50/60 border border-amber-200/60 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
              <p className="font-semibold mb-0.5">What happens next?</p>
              <p>Your seller has 48 hours to respond. If rejected, you can escalate to a G2G admin. Funds stay locked in escrow until resolved.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOpen(false)}>Cancel</Button>
            <Button
              data-testid="submit-refund"
              onClick={submitRefund}
              disabled={submitting}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {submitting ? 'Submitting…' : 'Submit refund request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Refund status tracker ────────────────────────────────────────────────────

const STEPS = [
  { key: 'submitted', label: 'Request\nSubmitted' },
  { key: 'seller',    label: 'Seller\nReviewing'  },
  { key: 'admin',     label: 'Admin\nReview'       },
  { key: 'done',      label: 'Refund\nCredited'    },
];

function getStepIndex(status) {
  switch (status) {
    case 'pending':            return 1;
    case 'rejected':           return 1;
    case 'under_admin_review': return 2;
    case 'refunded':           return 3;
    case 'closed':             return 3;
    default:                   return 0;
  }
}

function RefundStatusTracker({ status }) {
  const activeIdx = getStepIndex(status);
  const isDone    = status === 'refunded';
  const isClosed  = status === 'closed';

  return (
    <div className="flex items-start justify-between gap-1">
      {STEPS.map((step, idx) => {
        const completed = idx < activeIdx;
        const current   = idx === activeIdx;

        let circleClass = 'bg-muted border-border text-muted-foreground';
        if (completed)                                circleClass = 'bg-emerald-500 border-emerald-500 text-white';
        if (current && isDone)                        circleClass = 'bg-emerald-500 border-emerald-500 text-white';
        if (current && isClosed && idx === 3)         circleClass = 'bg-rose-400 border-rose-400 text-white';
        if (current && !isDone && !isClosed)          circleClass = 'bg-amber-500 border-amber-500 text-white';

        const lineClass = completed ? 'bg-emerald-400' : 'bg-border';

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1.5" style={{ minWidth: 52 }}>
              <div className={`grid h-9 w-9 place-items-center rounded-full border-2 text-xs font-bold transition-colors ${circleClass}`}>
                {completed || (current && isDone)
                  ? <CheckCircle2 className="h-4 w-4" />
                  : idx + 1
                }
              </div>
              <p className="text-center text-[9px] leading-tight text-muted-foreground whitespace-pre-line font-medium">
                {step.label}
              </p>
              {current && !isDone && !isClosed && (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                  Now
                </span>
              )}
              {current && isDone && (
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                  Done ✓
                </span>
              )}
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`mt-4 h-0.5 flex-1 rounded-full transition-colors ${lineClass}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}