import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Upload, Send, AlertCircle, CheckCircle2, X, Clock, Image as ImageIcon, ShieldCheck, ArrowUpRight } from 'lucide-react';
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
  return new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(file); });
}

const STATUS_META = {
  pending: { color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', label: 'Pending seller response' },
  accepted: { color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', label: 'Accepted' },
  rejected: { color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400', label: 'Rejected by seller' },
  under_admin_review: { color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', label: 'Under admin review' },
  refunded: { color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', label: 'Refunded' },
  closed: { color: 'bg-muted text-muted-foreground', label: 'Closed' },
};

export default function RefundDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();
  const [refund, setRefund] = useState(null);
  const [text, setText] = useState('');
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectMsg, setRejectMsg] = useState('');
  const messagesRef = useRef(null);
  const fileRef = useRef(null);

  const load = async () => {
    try { const r = await api.get(`/refunds/${id}`); setRefund(r.data); }
    catch (e) { toast.error(e.message); }
  };
  useEffect(() => { load(); const i = setInterval(load, 8000); return () => clearInterval(i); }, [id]);
  useEffect(() => { messagesRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }); }, [refund?.messages?.length]);

  if (!refund) return <div className="p-10 text-center text-muted-foreground">Loading refund…</div>;

  const isBuyer = user?.id === refund.buyerId;
  const isSeller = user?.id === refund.sellerId;
  const meta = STATUS_META[refund.status] || { color: 'bg-muted', label: refund.status };

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
    try { await api.post(`/refunds/${id}/respond`, { action, message: action === 'reject' ? rejectMsg : '' }); toast.success('Response sent'); setRejectOpen(false); setRejectMsg(''); await load(); }
    catch (e) { toast.error(e.message); }
  };
  const escalate = async () => {
    try { await api.post(`/refunds/${id}/escalate`, { reason: escalateReason }); toast.success('Escalated to admin'); setEscalateOpen(false); setEscalateReason(''); await load(); }
    catch (e) { toast.error(e.message); }
  };

  const canEscalate = isBuyer && (refund.status === 'rejected' || refund.status === 'pending');
  const canSellerAct = isSeller && refund.status === 'pending';

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-2"><ChevronLeft className="mr-1 h-4 w-4" />Back</Button>

      <div className="bento-card p-6">
        <div className="flex items-start gap-4">
          {refund.image && <img src={refund.image} alt="" className="h-20 w-20 rounded-2xl object-cover" />}
          <div className="flex-1">
            <p className="font-heading text-xl font-bold">{refund.title}</p>
            <p className="text-sm text-muted-foreground">Refund amount: <span className="font-semibold text-foreground">${refund.amount}</span></p>
            <p className="mt-1 text-xs text-muted-foreground">Opened {new Date(refund.createdAt).toLocaleString()}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${meta.color}`}>{meta.label}</span>
        </div>
        <div className="mt-4 rounded-2xl bg-muted/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Buyer's reason</p>
          <p className="mt-1 text-sm">{refund.reason}</p>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {canSellerAct && (
            <>
              <Button data-testid="seller-accept" onClick={() => sellerAct('accept')} className="rounded-full bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="mr-2 h-4 w-4" />Accept refund</Button>
              <Button data-testid="seller-reject" variant="outline" onClick={() => setRejectOpen(true)} className="rounded-full text-rose-600">Reject</Button>
            </>
          )}
          {canEscalate && (
            <Button data-testid="buyer-escalate" onClick={() => setEscalateOpen(true)} variant="outline" className="rounded-full"><ArrowUpRight className="mr-2 h-4 w-4" />Escalate to admin</Button>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-muted" data-testid="evidence-upload">
            <Upload className="h-4 w-4" /> Upload evidence
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadEvidence} />
          </label>
        </div>
      </div>

      {/* Evidence */}
      {refund.evidence?.length > 0 && (
        <div className="bento-card p-6">
          <h2 className="font-heading text-lg font-bold">Evidence ({refund.evidence.length})</h2>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {refund.evidence.map(e => (
              <div key={e.id} className="space-y-1">
                <img src={e.image} alt="" className="aspect-square w-full rounded-2xl object-cover" />
                <p className="text-[10px] text-muted-foreground">By {e.userName}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discussion */}
      <div className="bento-card flex flex-col p-0">
        <div className="border-b border-border p-5">
          <h2 className="font-heading text-lg font-bold">Discussion</h2>
          <p className="text-xs text-muted-foreground">Resolve your dispute respectfully. Admins read every message if escalated.</p>
        </div>
        <div ref={messagesRef} className="flex-1 max-h-[500px] space-y-3 overflow-y-auto p-5">
          {(refund.messages || []).length === 0 ? <p className="text-center text-sm text-muted-foreground">No messages yet. Start the conversation below.</p> :
            refund.messages.map(m => {
              const mine = m.fromId === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} gap-2`}>
                  {!mine && <Avatar className="h-8 w-8"><AvatarImage src={m.fromAvatar} /><AvatarFallback>{m.fromName?.[0]}</AvatarFallback></Avatar>}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${mine ? 'bg-navy text-white rounded-br-md' : m.fromRole === 'admin' ? 'bg-amber-500/10 text-foreground border border-amber-500/30 rounded-bl-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
                    <p className="text-[10px] font-bold opacity-70">{m.fromName}{m.fromRole === 'admin' ? ' · ADMIN' : ''}</p>
                    {m.image && <img src={m.image} alt="" className="mt-1 max-h-48 rounded-xl" />}
                    {m.text && <p className="mt-0.5 whitespace-pre-wrap break-words">{m.text}</p>}
                    <p className="mt-1 text-[10px] opacity-60">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              );
            })}
        </div>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2">
            <input type="file" accept="image/*" className="hidden" id="refund-img" onChange={sendImage} />
            <Button variant="ghost" size="icon" onClick={() => document.getElementById('refund-img')?.click()}><ImageIcon className="h-5 w-5" /></Button>
            <Input data-testid="refund-msg-input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }} placeholder="Write a message…" className="h-11 flex-1 rounded-full bg-muted/40" />
            <Button data-testid="refund-msg-send" onClick={sendMessage} className="h-11 rounded-full bg-navy hover:bg-navy-700"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject refund</DialogTitle></DialogHeader>
          <Label>Reason</Label>
          <Textarea data-testid="reject-msg" value={rejectMsg} onChange={(e) => setRejectMsg(e.target.value)} rows={4} placeholder="Explain why you're rejecting…" className="rounded-xl" />
          <DialogFooter><Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button><Button data-testid="confirm-reject" onClick={() => sellerAct('reject')} className="bg-rose-600 hover:bg-rose-700">Reject refund</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate dialog */}
      <Dialog open={escalateOpen} onOpenChange={setEscalateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Escalate to admin</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">A G2G admin will review the conversation, evidence and make a final decision.</p>
          <Label>Why are you escalating?</Label>
          <Textarea data-testid="escalate-reason" value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)} rows={4} placeholder="Provide context for the admin…" className="rounded-xl" />
          <DialogFooter><Button variant="outline" onClick={() => setEscalateOpen(false)}>Cancel</Button><Button data-testid="confirm-escalate" onClick={escalate} className="bg-navy hover:bg-navy-700">Escalate</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
