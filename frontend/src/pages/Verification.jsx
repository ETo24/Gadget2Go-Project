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
  const [showBreakdown, setShowBreakdown] = useState(false);
  const trustScore = typeof user?.trustScore === 'object'
  ? (user.trustScore.score ?? 0)
  : (user?.trustScore ?? 0);
  const trustBreakdown = user?.trustBreakdown || {
    kyc: 0,
    transactions: 0,
    ratings: 0,
    reports: 0,
    refunds: 0,
  };

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
    <div className="mx-auto max-w-2xl space-y-6">

      {/* VERIFIED CARD */}
      <div className="bento-card p-10 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20">
          <CheckCircle2 className="h-10 w-10" strokeWidth={1.5} />
        </div>

        <h1 className="mt-4 font-heading text-3xl font-bold">
          You're verified
        </h1>

        <p className="mt-2 text-muted-foreground">
          You can now list gadgets, receive payments, and earn the Verified Seller badge.
        </p>

        <Button
          onClick={() => navigate('/sell')}
          data-testid="goto-sell"
          className="mt-6 rounded-full bg-navy hover:bg-navy-700"
        >
          Start selling
        </Button>
      </div>

      {/* TRUST SCORE CARD */}
      <div className="bento-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold">
              Trust Score
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Based on your account activity and marketplace reputation.
            </p>
          </div>

          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="text-sm text-teal-600 hover:underline"
          >
            {showBreakdown ? 'Hide details' : 'Show details'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-5xl font-bold text-navy">{trustScore}</p>
        </div>

        <div className="mt-6">
          <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-3 rounded-full bg-teal-500 transition-all duration-300"
              style={{ width: `${trustScore}%` }}
            />
          </div>

          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>100</span>
          </div>
        </div>

        {showBreakdown && (
          <div className="mt-6 border-t pt-4">
            <p className="mb-4 text-sm text-muted-foreground">Trust score contribution breakdown</p>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>KYC Verification</span>
                <span className="font-semibold text-emerald-600">
                  +{trustBreakdown.kyc ?? 0}
                </span>
              </div>

              <div className="flex justify-between">
                 <span>Email Verified</span>
                 <span className="font-semibold text-emerald-600">
                    +{trustBreakdown.email ?? 0}
                 </span>
              </div>

              <div className="flex justify-between">
                <span>Phone Verified</span>
                <span className="font-semibold text-emerald-600">
                    +{trustBreakdown.phone ?? 0}
                </span>
               </div>

              <div className="flex justify-between">
                <span>Successful Transactions</span>
                <span className="font-semibold text-teal-600">
                  +{trustBreakdown.transactions ?? 0}
                </span>
              </div>

              <div className="flex justify-between">
                <span>User Ratings</span>
                <span className="font-semibold text-blue-600">
                  +{trustBreakdown.ratings ?? 0}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Reports</span>
                <span className="font-semibold text-red-500">
                  {trustBreakdown.reports ?? 0}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Refunds</span>
                <span className="font-semibold text-red-500">
                  {trustBreakdown.refunds ?? 0}
                </span>
              </div>

              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Total Score</span>
                <span>{trustScore}</span>
              </div>

            </div>
          </div>
        )}
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
