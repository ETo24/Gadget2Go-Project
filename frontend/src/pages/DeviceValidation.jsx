import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Scan, ShieldCheck, Truck, ClipboardCheck, CheckCircle2, MapPin, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { api } from '../lib/api';
import { toast } from 'sonner';

const STEPS = [
  { id: 'requested', label: 'Request received', icon: ClipboardCheck },
  { id: 'scheduled', label: 'Pickup scheduled', icon: Clock },
  { id: 'in-progress', label: 'Inspection in progress', icon: Scan },
  { id: 'completed', label: 'Verified & badge issued', icon: CheckCircle2 },
];

export default function DeviceValidation() {
  const [items, setItems] = useState([]);
  const [listings, setListings] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ listingId: '', pickupAddress: '', notes: '' });

  const load = () => api.get('/device-validations/mine').then(r => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); api.get('/listings/mine/me').then(r => setListings(r.data)).catch(() => {}); }, []);

  const submit = async () => {
    if (!form.listingId || !form.pickupAddress) return toast.error('Choose a listing and pickup address');
    try {
      await api.post('/device-validations', form);
      toast.success('Validation requested. We\'ll contact you to arrange pickup.');
      setOpen(false); setForm({ listingId: '', pickupAddress: '', notes: '' });
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">Physical Device Validation</h1>
          <p className="text-muted-foreground">Send your gadget to G2G for in-person inspection. Earn the "Inspected" badge and sell 2x faster.</p>
        </div>
        <Button data-testid="request-validation" onClick={() => setOpen(true)} className="rounded-full bg-navy hover:bg-navy-700"><Scan className="mr-2 h-4 w-4" />Request validation</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { i: Truck, t: 'Pickup arranged', d: 'Free door-to-door pickup in major cities.' },
          { i: Scan, t: '50-point inspection', d: 'Screen, battery, body, ports — all verified.' },
          { i: ShieldCheck, t: 'Inspected badge', d: 'Get the trust badge that closes deals.' },
        ].map(x => (
          <div key={x.t} className="bento-card p-5">
            <x.i className="h-5 w-5 text-teal-600" />
            <p className="mt-3 font-heading font-bold">{x.t}</p>
            <p className="text-sm text-muted-foreground">{x.d}</p>
          </div>
        ))}
      </div>

      <div className="bento-card p-6">
        <h2 className="font-heading text-lg font-bold">Service fee</h2>
        <p className="mt-1 text-sm text-muted-foreground">RM 25 flat fee per device. Refunded if your gadget sells within 7 days of validation.</p>
      </div>

      <h2 className="font-heading text-2xl font-bold">Your validation requests</h2>
      <div className="space-y-4">
        {items.length === 0 ? <div className="bento-card p-10 text-center text-muted-foreground">No requests yet. Click "Request validation" above.</div> :
          items.map(it => {
            const idx = STEPS.findIndex(s => s.id === it.status);
            return (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} key={it.id} className="bento-card p-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-heading text-lg font-bold">{it.listingTitle}</p>
                    <p className="text-xs text-muted-foreground"><MapPin className="inline h-3 w-3" /> {it.pickupAddress}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${it.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{it.status}</span>
                </div>
                <div className="mt-6 grid grid-cols-4 gap-2">
                  {STEPS.map((s, i) => (
                    <div key={s.id} className="text-center">
                      <div className={`mx-auto grid h-10 w-10 place-items-center rounded-full transition-colors ${i <= idx ? 'bg-teal-500 text-white' : 'bg-muted text-muted-foreground'}`}><s.icon className="h-4 w-4" /></div>
                      <p className={`mt-2 text-[11px] font-medium ${i <= idx ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</p>
                    </div>
                  ))}
                </div>
                {it.status === 'completed' && it.grade && (
                  <div className="mt-6 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-500/10">
                    <p className="font-heading font-bold text-emerald-700">Final grade: {it.grade}</p>
                    <p className="text-sm text-emerald-800">{it.report || 'Device passes all 50 inspection points.'}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request device validation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Select listing</Label>
              <Select value={form.listingId} onValueChange={(v) => setForm({ ...form, listingId: v })}>
                <SelectTrigger data-testid="dv-listing"><SelectValue placeholder={listings.length === 0 ? 'No listings — create one first' : 'Choose a listing'} /></SelectTrigger>
                <SelectContent>{listings.map(l => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Pickup address</Label><Input data-testid="dv-address" value={form.pickupAddress} onChange={(e) => setForm({ ...form, pickupAddress: e.target.value })} placeholder="123 Orchard Rd, Singapore" /></div>
            <div className="space-y-2"><Label>Notes (optional)</Label><Textarea data-testid="dv-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Best time to call, special instructions…" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button data-testid="dv-submit" onClick={submit} className="bg-navy hover:bg-navy-700">Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
