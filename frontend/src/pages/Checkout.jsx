import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ShieldCheck, CreditCard, Wallet as WalletIcon, ArrowRight, CheckCircle2, Truck, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useApp();
  const [product, setProduct] = useState(null);
  const [method, setMethod] = useState('card');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { api.get(`/listings/${id}`).then(r => setProduct(r.data)).catch(() => {}); }, [id]);

  const pay = async () => {
    setSubmitting(true);
    try {
      await api.post('/payments', { listingId: id, method });
      await refreshUser();
      setDone(true);
    } catch (e) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  if (!product) return <div className="space-y-3"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-64" /></div>;

  if (done) return (
    <div className="mx-auto max-w-2xl">
      <div className="bento-card p-10 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20"><CheckCircle2 className="h-10 w-10" strokeWidth={1.5} /></div>
        <h1 className="mt-4 font-heading text-3xl font-bold">Payment successful</h1>
        <p className="mt-2 text-muted-foreground">${product.price} held in G2G Escrow. The seller will be paid after you confirm receipt or 7-day buyer protection ends.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/wallet"><Button className="rounded-full bg-navy hover:bg-navy-700">View order in Wallet</Button></Link>
          <Link to="/buy"><Button variant="outline" className="rounded-full">Continue shopping</Button></Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-heading text-3xl font-bold sm:text-4xl">Checkout</h1>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <div className="bento-card p-6">
            <h2 className="font-heading text-lg font-bold">Payment method</h2>
            <div className="mt-4 space-y-3">
              {[
                { v: 'card', i: CreditCard, t: 'Credit / Debit Card', d: 'Visa, Mastercard, Amex' },
                { v: 'wallet', i: WalletIcon, t: 'G2G Wallet', d: `Balance: RM ${user?.walletBalance || 0}` },
              ].map(o => (
                <label key={o.v} data-testid={`pm-${o.v}`} className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 ${method === o.v ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10' : 'border-border'}`}>
                  <input type="radio" checked={method === o.v} onChange={() => setMethod(o.v)} className="accent-teal-600" />
                  <o.i className="h-5 w-5 text-teal-600" />
                  <div>
                    <p className="font-heading font-semibold">{o.t}</p>
                    <p className="text-xs text-muted-foreground">{o.d}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bento-card p-6">
            <h2 className="font-heading text-lg font-bold">Buyer protection</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { i: ShieldCheck, t: 'Escrow held', d: 'Payment is safe until you confirm delivery.' },
                { i: Truck, t: 'Tracked delivery', d: 'Real-time updates via G2G Express.' },
                { i: RotateCcw, t: '7-day protection', d: 'Refund eligible if item differs.' },
              ].map(x => (
                <div key={x.t} className="rounded-2xl border border-border p-4">
                  <x.i className="h-5 w-5 text-teal-600" />
                  <p className="mt-2 font-heading text-sm font-bold">{x.t}</p>
                  <p className="text-xs text-muted-foreground">{x.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bento-card p-6 lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-heading text-lg font-bold">Order summary</h2>
          <div className="mt-4 flex items-start gap-3">
            <img src={product.images?.[0]} alt="" className="h-20 w-20 rounded-xl object-cover" />
            <div>
              <p className="line-clamp-2 font-heading font-semibold">{product.title}</p>
              <p className="text-xs text-muted-foreground">From {product.seller?.name}</p>
            </div>
          </div>
          <div className="mt-5 space-y-2 text-sm">
            <Row l="Item price" v={`RM ${Number(product.price).toLocaleString()}`} />
            <Row l="Service fee" v="Free" />
            <Row l="Delivery" v="RM 0 (G2G Express)" />
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <p className="font-heading text-base font-bold">Total</p>
              <p className="font-heading text-2xl font-bold">${Number(product.price).toLocaleString()}</p>
            </div>
          </div>
          <Button onClick={pay} disabled={submitting} data-testid="confirm-pay" className="mt-6 h-12 w-full rounded-full bg-navy hover:bg-navy-700">
            {submitting ? 'Processing…' : (<>Pay ${Number(product.price).toLocaleString()} <ArrowRight className="ml-2 h-4 w-4" /></>)}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">By paying you agree to G2G's terms and buyer-protection policy.</p>
        </div>
      </div>
    </div>
  );
}

function Row({ l, v }) { return <div className="flex items-center justify-between text-muted-foreground"><span>{l}</span><span className="font-medium text-foreground">{v}</span></div>; }
