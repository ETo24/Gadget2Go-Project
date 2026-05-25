import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Upload, Send, CheckCircle2, ArrowUpRight,
  Image as ImageIcon, ShieldCheck, AlertTriangle, Clock, Info,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.readAsDataURL(file);
  });
}

// ── Role-aware status labels ──────────────────────────────────────────────────
const STATUS_META_BUYER = {
  pending:            { color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',        label: 'Pending seller response'  },
  rejected:           { color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',            label: 'Rejected — you can escalate' },
  under_admin_review: { color: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',            label: 'Under admin review'       },
  refunded:           { color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', label: 'Refund approved ✓'        },
  closed:             { color: 'bg-muted text-muted-foreground',                                              label: 'Dispute closed'           },
};

const STATUS_META_SELLER = {
  pending:            { color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',        label: '⚠ Action required — respond to buyer' },
  rejected:           { color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',            label: 'You rejected this request'            },
  under_admin_review: { color: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',            label: 'Escalated to admin'                   },
  refunded:           { color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', label: 'Refund was accepted'                  },
  closed:             { color: 'bg-muted text-muted-foreground',                                              label: 'Dispute closed'                       },
};

// ── Seller context banner (explains what to do) ───────────────────────────────
function SellerGuidance({ status }) {
  if (status === 'pending') return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-300">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">You have a pending refund request</p>
        <p className="text-xs mt-0.5">Review the buyer's reason below. Accept to return the funds, or reject with an explanation. If rejected, the buyer may escalate to G2G admin.</p>
      </div>
    </div>
  );
  if (status === 'under_admin_review') return (
    <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/5 dark:text-blue-300">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">This dispute is under admin review</p>
        <p className="text-xs mt-0.5">The buyer escalated after your rejection. A G2G admin will review all messages and evidence and make a final ruling. You can still send messages below.</p>
      </div>
    </div>
  );
  if (status === 'rejected') return (
    <div className="flex items-start gap-3 rounded-2xl border border-muted bg-muted/40 p-4 text-sm text-muted-foreground">
      <Info className="mt-0.5 h-5 w-5 shrink-0" />
      <p>You rejected this refund. The buyer may still escalate to admin within the dispute window.</p>
    </div>
  );
  return null;
}

// ── Buyer context banner ──────────────────────────────────────────────────────
function BuyerGuidance({ status }) {
  if (status === 'pending') return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-300">
      <Clock className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">Waiting for the seller to respond</p>
        <p className="text-xs mt-0.5">The seller has 48 hours to accept or reject. You can send messages or upload evidence below while you wait.</p>
      </div>
    </div>
  );
  if (status === 'rejected') return (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/5 dark:text-rose-300">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">The seller rejected your request</p>
        <p className="text-xs mt-0.5">You can escalate this dispute to a G2G admin for a final decision. Upload any additional evidence before escalating.</p>
      </div>
    </div>
  );
  if (status === 'under_admin_review') return (
    <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/5 dark:text-blue-300">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">Escalated — admin is reviewing</p>
        <p className="text-xs mt-0.5">A G2G admin will make a final ruling based on all messages and evidence. You'll be notified of the outcome.</p>
      </div>
    </div>
  );
  return null;
}

export default function RefundDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();

  const [refund, setRefund]               = useState(null);
  const [text, setText]                   = useState('');
  const [escalateOpen, setEscalateOpen]   = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [rejectOpen, setRejectOpen]       = useState(false);
  const [rejectMsg, setRejectMsg]         = useState('');
  const [lightbox, setLightbox]           = useState(null); // { src, caption }
  const messagesRef = useRef(null);
  const fileRef     = useRef(null);

  const load = async () => {
    try { const r = await api.get(`/refunds/${id}`); setRefund(r.data); }
    catch (e) { toast.error(e.message); }
  };

  useEffect(() => { load(); const i = setInterval(load, 8000); return () => clearInterval(i); }, [id]);
  useEffect(() => { messagesRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }); }, [refund?.messages?.length]);

  if (!refund) return <div className="p-10 text-center text-muted-foreground">Loading refund…</div>;

  // ── Role flags ──────────────────────────────────────────────────────────────
  const isBuyer  = user?.id === refund.buyerId;
  const isSeller = user?.id === refund.sellerId;

  // Role-aware status badge
  const metaMap = isBuyer ? STATUS_META_BUYER : STATUS_META_SELLER;
  const meta    = metaMap[refund.status] || { color: 'bg-muted', label: refund.status };

  // What actions are available — strictly role-gated
  const canSellerAcceptReject = isSeller && refund.status === 'pending';
  const canBuyerEscalate      = isBuyer  && refund.status === 'rejected';
  // Terminal states — no further actions
  const isTerminal = ['refunded', 'closed'].includes(refund.status);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!text.trim()) return;
    try { await api.post(`/refunds/${id}/messages`, { text: text.trim() }); setText(''); await load(); }
    catch (e) { toast.error(e.message); }
  };

  const sendImage = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const dataUrl = await fileToDataUrl(f);
    try { await api.post(`/refunds/${id}/messages`, { image: dataUrl }); await load(); }
    catch (err) { toast.error(err.message); }
    e.target.value = '';
  };

  const uploadEvidence = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const dataUrl = await fileToDataUrl(f);
    try { await api.post(`/refunds/${id}/evidence`, { image: dataUrl }); toast.success('Evidence uploaded'); await load(); }
    catch (err) { toast.error(err.message); }
    e.target.value = '';
  };

  const sellerAct = async (action) => {
    try {
      await api.post(`/refunds/${id}/respond`, { action, message: action === 'reject' ? rejectMsg : '' });
      toast.success(action === 'accept' ? 'Refund accepted — buyer will be credited.' : 'Refund rejected.');
      setRejectOpen(false); setRejectMsg(''); await load();
    } catch (e) { toast.error(e?.response?.data?.detail || e.message); }
  };

  const escalate = async () => {
    try {
      await api.post(`/refunds/${id}/escalate`, { reason: escalateReason });
      toast.success('Escalated to admin'); setEscalateOpen(false); setEscalateReason(''); await load();
    } catch (e) { toast.error(e?.response?.data?.detail || e.message); }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-2">
        <ChevronLeft className="mr-1 h-4 w-4" />Back
      </Button>

      {/* ── Context banner — different for buyer vs seller ── */}
      {isSeller && <SellerGuidance status={refund.status} />}
      {isBuyer  && <BuyerGuidance  status={refund.status} />}

      {/* ── Main refund card ── */}
      <div className="bento-card p-6">

        {/* Role pill */}
        <div className="mb-4 flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide
            ${isBuyer
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
              : 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400'}`}>
            {isBuyer ? 'Your refund request' : 'Buyer refund request'}
          </span>
          <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${meta.color}`}>
            {meta.label}
          </span>
        </div>

        {/* Item info */}
        <div className="flex items-start gap-4">
          {refund.image && <img src={refund.image} alt="" className="h-20 w-20 rounded-2xl object-cover shrink-0" />}
          <div className="flex-1">
            <p className="font-heading text-xl font-bold">{refund.title}</p>
            <p className="text-sm text-muted-foreground">
              Refund amount: <span className={`font-semibold ${isBuyer ? 'text-rose-600' : 'text-foreground'}`}>
                {isBuyer ? '-' : ''}${refund.amount.toLocaleString()}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Opened {new Date(refund.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Buyer's reason (shown to both, labelled clearly) */}
        <div className="mt-4 rounded-2xl bg-muted/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Buyer's reason</p>
          <p className="mt-1 text-sm">{refund.reason}</p>
        </div>

        {/* Seller's rejection message — shown to buyer after rejection */}
        {refund.sellerMessage && isBuyer && refund.status === 'rejected' && (
          <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50/50 p-4 dark:border-rose-500/20 dark:bg-rose-500/5">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Seller's response</p>
            <p className="mt-1 text-sm text-rose-800 dark:text-rose-300">{refund.sellerMessage}</p>
          </div>
        )}

        {/* ── ACTION BUTTONS — strictly role-gated ── */}
        {!isTerminal && (
          <div className="mt-5 flex flex-wrap gap-2">

            {/* SELLER ONLY: accept / reject — only when pending */}
            {canSellerAcceptReject && (
              <>
                <Button
                  data-testid="seller-accept"
                  onClick={() => sellerAct('accept')}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />Accept refund
                </Button>
                <Button
                  data-testid="seller-reject"
                  variant="outline"
                  onClick={() => setRejectOpen(true)}
                  className="rounded-full text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Reject
                </Button>
              </>
            )}

            {/* BUYER ONLY: escalate — only after seller rejects */}
            {canBuyerEscalate && (
              <Button
                data-testid="buyer-escalate"
                onClick={() => setEscalateOpen(true)}
                variant="outline"
                className="rounded-full"
              >
                <ArrowUpRight className="mr-2 h-4 w-4" />Escalate to admin
              </Button>
            )}

            {/* Evidence upload — available to both parties while dispute is open */}
            <label
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-muted"
              data-testid="evidence-upload"
            >
              <Upload className="h-4 w-4" /> Upload evidence
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadEvidence} />
            </label>
          </div>
        )}

        {/* Terminal state notice */}
        {isTerminal && (
          <div className="mt-4 rounded-2xl bg-muted/50 p-3 text-center text-sm text-muted-foreground">
            This dispute is closed. No further actions are available.
          </div>
        )}
      </div>

      {/* ── Evidence ── */}
      {refund.evidence?.length > 0 && (
        <div className="bento-card p-6">
          <h2 className="font-heading text-lg font-bold">Evidence ({refund.evidence.length})</h2>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {refund.evidence.map(e => (
              <div key={e.id} className="space-y-1">
                <button
                  onClick={() => setLightbox({ src: e.image, caption: `Uploaded by ${e.userName}` })}
                  className="group relative block w-full overflow-hidden rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  title="Click to enlarge"
                >
                  <img src={e.image} alt="" className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-105" />
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 transition-colors group-hover:bg-black/30">
                    <svg className="h-7 w-7 text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0zM11 8v6M8 11h6" />
                    </svg>
                  </div>
                </button>
                <p className="text-[10px] text-muted-foreground">By {e.userName}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Discussion ── */}
      <div className="bento-card flex flex-col p-0">
        <div className="border-b border-border p-5">
          <h2 className="font-heading text-lg font-bold">Discussion</h2>
          <p className="text-xs text-muted-foreground">
            {refund.status === 'under_admin_review'
              ? 'Admin is monitoring this conversation.'
              : 'Resolve your dispute respectfully. Admins read every message if escalated.'}
          </p>
        </div>

        <div ref={messagesRef} className="flex-1 max-h-[500px] space-y-3 overflow-y-auto p-5">
          {(refund.messages || []).length === 0
            ? <p className="text-center text-sm text-muted-foreground">No messages yet. Start the conversation below.</p>
            : refund.messages.map(m => {
                const mine = m.fromId === user?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} gap-2`}>
                    {!mine && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={m.fromAvatar} />
                        <AvatarFallback>{m.fromName?.[0]}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm
                      ${mine
                        ? 'bg-navy text-white rounded-br-md'
                        : m.fromRole === 'admin'
                          ? 'bg-amber-500/10 text-foreground border border-amber-500/30 rounded-bl-md'
                          : 'bg-muted text-foreground rounded-bl-md'}`}>
                      <p className="text-[10px] font-bold opacity-70">
                        {m.fromName}
                        {m.fromRole === 'admin' ? ' · ADMIN' : m.fromRole === 'seller' ? ' · Seller' : ' · Buyer'}
                      </p>
                      {m.image && <img src={m.image} alt="" className="mt-1 max-h-48 rounded-xl" />}
                      {m.text && <p className="mt-0.5 whitespace-pre-wrap break-words">{m.text}</p>}
                      <p className="mt-1 text-[10px] opacity-60">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
          }
        </div>

        {/* Message input — hidden once terminal */}
        {!isTerminal && (
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-2">
              <input type="file" accept="image/*" className="hidden" id="refund-img" onChange={sendImage} />
              <Button variant="ghost" size="icon" onClick={() => document.getElementById('refund-img')?.click()}>
                <ImageIcon className="h-5 w-5" />
              </Button>
              <Input
                data-testid="refund-msg-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                placeholder="Write a message…"
                className="h-11 flex-1 rounded-full bg-muted/40"
              />
              <Button
                data-testid="refund-msg-send"
                onClick={sendMessage}
                className="h-11 rounded-full bg-navy hover:bg-navy-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Reject dialog (seller only) ── */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject refund request</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Explain why you're rejecting. The buyer can escalate to admin if they disagree.</p>
          <Label>Your reason <span className="text-rose-500">*</span></Label>
          <Textarea
            data-testid="reject-msg"
            value={rejectMsg}
            onChange={(e) => setRejectMsg(e.target.value)}
            rows={4}
            placeholder="e.g. Item was as described, buyer confirmed working on delivery…"
            className="rounded-xl"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              data-testid="confirm-reject"
              onClick={() => sellerAct('reject')}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Reject refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Lightbox overlay ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(null)}
              className="absolute -right-3 -top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={lightbox.src}
              alt="Evidence"
              className="max-h-[80vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl"
            />
            {lightbox.caption && (
              <p className="mt-2 text-center text-xs text-white/70">{lightbox.caption}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Escalate dialog (buyer only) ── */}
      <Dialog open={escalateOpen} onOpenChange={setEscalateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Escalate to G2G Admin</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            A G2G admin will review the full conversation, evidence, and make a final binding decision.
          </p>
          <Label>Why are you escalating?</Label>
          <Textarea
            data-testid="escalate-reason"
            value={escalateReason}
            onChange={(e) => setEscalateReason(e.target.value)}
            rows={4}
            placeholder="Provide any additional context for the admin…"
            className="rounded-xl"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateOpen(false)}>Cancel</Button>
            <Button data-testid="confirm-escalate" onClick={escalate} className="bg-navy hover:bg-navy-700">
              Escalate to admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}