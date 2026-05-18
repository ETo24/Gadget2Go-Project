import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Check, ShieldCheck, Clock, X, CheckCircle2, FileText, Camera } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';

function fileToDataUrl(file) {
  return new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(file); });
}

export default function Verification() {
  const navigate = useNavigate();
  const { user, refreshUser } = useApp();
  const [docType, setDocType] = useState('ic');
  const [idDoc, setIdDoc] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState(null);

  useEffect(() => { api.get('/verifications/me').then(r => setRecord(r.data)).catch(() => {}); }, []);

  const submit = async () => {
    if (!idDoc || !selfie) return toast.error('Please upload both your ID and a selfie');
    setSubmitting(true);
    try {
      await api.post('/verifications', { idDoc, selfie, docType });
      await refreshUser();
      toast.success('Submitted! Our team will review within 24 hours.');
      const { data } = await api.get('/verifications/me');
      setRecord(data);
    } catch (e) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  if (user?.kycStatus === 'approved') {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <div className="bento-card p-10">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20"><CheckCircle2 className="h-10 w-10" strokeWidth={1.5} /></div>
          <h1 className="mt-4 font-heading text-3xl font-bold">You're verified</h1>
          <p className="mt-2 text-muted-foreground">You can now list gadgets, receive payments, and earn the Verified Seller badge.</p>
          <Button onClick={() => navigate('/sell')} data-testid="goto-sell" className="mt-6 rounded-full bg-navy hover:bg-navy-700">Start selling</Button>
        </div>
      </div>
    );
  }

  if (user?.kycStatus === 'pending' || record?.status === 'pending') {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <div className="bento-card p-10">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-amber-100 text-amber-700 dark:bg-amber-500/20"><Clock className="h-10 w-10" strokeWidth={1.5} /></div>
          <h1 className="mt-4 font-heading text-3xl font-bold">Verification pending</h1>
          <p className="mt-2 text-muted-foreground">Our team is reviewing your documents. This usually takes under 24 hours.</p>
          <div className="mt-6 space-y-2 text-left text-sm">
            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Documents received</div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-amber-600 animate-pulse" /> Admin review in progress</div>
            <div className="flex items-center gap-2 text-muted-foreground"><div className="h-4 w-4 rounded-full border-2 border-muted" /> Approval</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">Identity verification</h1>
        <p className="text-muted-foreground">Verify your identity to start selling and earn the Verified Seller badge.</p>
      </div>

      <div className="bento-card p-6 sm:p-8">
        <h2 className="font-heading text-xl font-bold">Step 1 · Choose document</h2>
        <RadioGroup value={docType} onValueChange={setDocType} className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { v: 'ic', l: 'National ID / IC' },
            { v: 'passport', l: 'Passport' },
            { v: 'license', l: 'Driver License' },
          ].map(o => (
            <label key={o.v} data-testid={`doctype-${o.v}`} className={`flex cursor-pointer items-center gap-2 rounded-2xl border-2 p-4 ${docType === o.v ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10' : 'border-border'}`}>
              <RadioGroupItem value={o.v} />
              <FileText className="h-4 w-4 text-teal-600" />
              <span className="text-sm font-medium">{o.l}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Uploader label="Step 2 · Upload your ID" data={idDoc} setData={setIdDoc} icon={FileText} testid="id-upload" />
        <Uploader label="Step 3 · Take a selfie" data={selfie} setData={setSelfie} icon={Camera} testid="selfie-upload" />
      </div>

      <div className="bento-card p-6">
        <h2 className="font-heading text-lg font-bold">Privacy & security</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-teal-600 shrink-0" /> Documents are encrypted and only used for verification.</li>
          <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-teal-600 shrink-0" /> We never share your ID with sellers, buyers, or third parties.</li>
          <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-teal-600 shrink-0" /> Verified status unlocks selling, escrow payouts, and trust badges.</li>
        </ul>
      </div>

      <Button data-testid="submit-kyc" onClick={submit} disabled={submitting} className="h-12 w-full rounded-full bg-navy text-base hover:bg-navy-700">
        {submitting ? 'Submitting…' : 'Submit for verification'}
      </Button>
    </div>
  );
}

function Uploader({ label, data, setData, icon: Ic, testid }) {
  const on = async (e) => { const f = e.target.files?.[0]; if (!f) return; setData(await fileToDataUrl(f)); };
  return (
    <div className="bento-card p-6">
      <h2 className="font-heading text-xl font-bold">{label}</h2>
      <div className="mt-4">
        {data ? (
          <div className="relative">
            <img src={data} alt="" className="aspect-video w-full rounded-2xl object-cover" />
            <button onClick={() => setData(null)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-white"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <label data-testid={testid} className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted">
            <Ic className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Click to upload</span>
            <input type="file" accept="image/*" className="hidden" onChange={on} />
          </label>
        )}
      </div>
    </div>
  );
}
