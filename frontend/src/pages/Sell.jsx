import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Upload, Sparkles, Check, CheckCircle2, Smartphone, Tablet, Laptop, Gamepad2, Watch, Headphones, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Slider } from '../components/ui/slider';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import { CONDITION_GRADES, valuateDevice } from '../lib/mockData';

const DEVICE_TYPES = [
  { id: 'phones', label: 'Phone', icon: Smartphone },
  { id: 'tablets', label: 'Tablet', icon: Tablet },
  { id: 'laptops', label: 'Laptop', icon: Laptop },
  { id: 'consoles', label: 'Console', icon: Gamepad2 },
  { id: 'smartwatches', label: 'Smartwatch', icon: Watch },
  { id: 'accessories', label: 'Accessory', icon: Headphones },
];

const STEPS = ['Device', 'Photos', 'Details', 'AI Valuation', 'Method', 'Publish'];

export default function Sell() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    type: '', images: [], brand: 'Apple', model: '', storage: '128GB', ram: '8GB',
    batteryHealth: 90, condition: 'A', warranty: 'No', description: '',
    method: 'both', valuation: null,
  });

  const update = (k, v) => setData(d => ({ ...d, [k]: v }));

  const next = () => {
    if (step === 0 && !data.type) return toast.error('Choose a device type');
    if (step === 1 && data.images.length === 0) return toast.error('Upload at least 1 photo');
    if (step === 2 && (!data.brand || !data.model)) return toast.error('Enter brand & model');
    if (step === 2) {
      const v = valuateDevice(data);
      update('valuation', v);
    }
    setStep(s => Math.min(STEPS.length - 1, s + 1));
  };
  const back = () => setStep(s => Math.max(0, s - 1));

  const onFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const urls = files.map(f => URL.createObjectURL(f));
    update('images', [...data.images, ...urls].slice(0, 6));
  };
  const removeImage = (i) => update('images', data.images.filter((_, x) => x !== i));

  const publish = () => {
    toast.success('Listing published! Your gadget is live on G2G.');
    setTimeout(() => navigate('/dashboard'), 600);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">Sell your gadget</h1>
          <p className="text-muted-foreground">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-xs text-muted-foreground">Progress</p>
          <Progress value={((step + 1) / STEPS.length) * 100} className="mt-1 h-2 w-40" />
        </div>
      </div>

      {/* Stepper */}
      <div className="mt-6 hidden gap-2 lg:flex">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${i < step ? 'bg-teal-500/10 text-teal-700' : i === step ? 'bg-navy text-white' : 'bg-muted text-muted-foreground'}`}>
            <div className={`grid h-5 w-5 place-items-center rounded-full ${i < step ? 'bg-teal-500 text-white' : i === step ? 'bg-white text-navy' : 'bg-foreground/10'}`}>{i < step ? <Check className="h-3 w-3" /> : i + 1}</div>
            {s}
          </div>
        ))}
      </div>

      <div className="bento-card mt-6 p-6 sm:p-10">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            {step === 0 && (
              <div>
                <h2 className="font-heading text-2xl font-bold">What are you selling?</h2>
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {DEVICE_TYPES.map(d => (
                    <button key={d.id} data-testid={`sell-type-${d.id}`} onClick={() => update('type', d.id)} className={`flex flex-col items-center gap-2 rounded-3xl border-2 p-6 transition-all ${data.type === d.id ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10' : 'border-border bg-card hover:border-teal-500/40'}`}>
                      <div className={`grid h-12 w-12 place-items-center rounded-2xl ${data.type === d.id ? 'bg-teal-500 text-white' : 'bg-muted'}`}><d.icon className="h-6 w-6" /></div>
                      <p className="font-heading font-semibold">{d.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === 1 && (
              <div>
                <h2 className="font-heading text-2xl font-bold">Add photos</h2>
                <p className="text-sm text-muted-foreground">High-quality photos sell 3x faster. Add up to 6 images.</p>
                <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {data.images.map((src, i) => (
                    <div key={i} className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <button onClick={() => removeImage(i)} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white" data-testid={`remove-img-${i}`}><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                  {data.images.length < 6 && (
                    <label data-testid="upload-btn" className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Upload</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
                    </label>
                  )}
                </div>
              </div>
            )}
            {step === 2 && (
              <div>
                <h2 className="font-heading text-2xl font-bold">Device details</h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Brand</Label>
                    <Select value={data.brand} onValueChange={(v) => update('brand', v)}>
                      <SelectTrigger className="h-12 rounded-xl" data-testid="sell-brand"><SelectValue /></SelectTrigger>
                      <SelectContent>{['Apple', 'Samsung', 'Google', 'Sony', 'Microsoft', 'OnePlus', 'Xiaomi', 'Other'].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input data-testid="sell-model" value={data.model} onChange={(e) => update('model', e.target.value)} placeholder="e.g. iPhone 15 Pro" className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Storage</Label>
                    <Select value={data.storage} onValueChange={(v) => update('storage', v)}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>{['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>RAM</Label>
                    <Select value={data.ram} onValueChange={(v) => update('ram', v)}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>{['4GB', '6GB', '8GB', '12GB', '16GB', '18GB', '32GB'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Battery health · {data.batteryHealth}%</Label>
                    <Slider value={[data.batteryHealth]} min={50} max={100} step={1} onValueChange={(v) => update('batteryHealth', v[0])} data-testid="sell-battery" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Cosmetic condition</Label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {CONDITION_GRADES.map(c => (
                        <button key={c.id} data-testid={`sell-cond-${c.id}`} onClick={() => update('condition', c.id)} className={`rounded-2xl border-2 p-3 text-left ${data.condition === c.id ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10' : 'border-border hover:border-teal-500/40'}`}>
                          <p className="font-heading font-bold">{c.id} · {c.label}</p>
                          <p className="text-xs text-muted-foreground">{c.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Warranty</Label>
                    <Select value={data.warranty} onValueChange={(v) => update('warranty', v)}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>{['No', '< 6 months', '6 - 12 months', '> 12 months'].map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Description</Label>
                    <Textarea data-testid="sell-desc" value={data.description} onChange={(e) => update('description', e.target.value)} placeholder="Why is your device special?" rows={4} className="rounded-xl" />
                  </div>
                </div>
              </div>
            )}
            {step === 3 && data.valuation && (
              <div>
                <div className="text-center">
                  <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-50/50 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-500/10"><Sparkles className="h-3 w-3" /> AI Valuation Complete</div>
                  <h2 className="mt-4 font-heading text-3xl font-bold">Your gadget is worth</h2>
                  <p className="mt-2 font-heading text-6xl font-bold gradient-text">${data.valuation.fair.toLocaleString()}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Confidence: {data.valuation.confidence}% · Quick-sale probability {data.valuation.quickSale}%</p>
                </div>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="bento-card p-5"><p className="text-xs uppercase tracking-wider text-muted-foreground">Dealer offers</p><p className="mt-1 font-heading text-2xl font-bold">${data.valuation.dealerLow} - ${data.valuation.dealerHigh}</p></div>
                  <div className="bento-card p-5"><p className="text-xs uppercase tracking-wider text-muted-foreground">Suggested sell</p><p className="mt-1 font-heading text-2xl font-bold text-teal-700">${data.valuation.recommended}</p></div>
                  <div className="bento-card p-5"><p className="text-xs uppercase tracking-wider text-muted-foreground">Demand</p><p className="mt-1 font-heading text-2xl font-bold">{data.valuation.demand}/100</p></div>
                </div>
              </div>
            )}
            {step === 4 && (
              <div>
                <h2 className="font-heading text-2xl font-bold">How would you like to sell?</h2>
                <RadioGroup value={data.method} onValueChange={(v) => update('method', v)} className="mt-6 space-y-3">
                  {[
                    { id: 'individual', t: 'Sell to individual buyer', d: 'List publicly. Negotiate directly. Best for top price.' },
                    { id: 'dealer', t: 'Sell to dealer', d: 'Instant offers from verified dealers. Fast & guaranteed.' },
                    { id: 'both', t: 'Both (recommended)', d: 'Get dealer offers while listed publicly. Sell to whoever pays best.' },
                  ].map(o => (
                    <label key={o.id} data-testid={`sell-method-${o.id}`} className={`flex cursor-pointer items-start gap-4 rounded-3xl border-2 p-5 transition-all ${data.method === o.id ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10' : 'border-border hover:border-teal-500/40'}`}>
                      <RadioGroupItem value={o.id} className="mt-1" />
                      <div>
                        <p className="font-heading font-bold">{o.t}</p>
                        <p className="text-sm text-muted-foreground">{o.d}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            )}
            {step === 5 && (
              <div className="text-center">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-teal-500/10 text-teal-600"><CheckCircle2 className="h-10 w-10" strokeWidth={1.5} /></div>
                <h2 className="mt-4 font-heading text-3xl font-bold">Ready to publish</h2>
                <p className="mt-2 text-muted-foreground">Your listing will be live to 124,000+ verified buyers.</p>
                <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
                  <Summary label="Device" value={`${data.brand} ${data.model}`} />
                  <Summary label="Storage / RAM" value={`${data.storage} · ${data.ram}`} />
                  <Summary label="Condition" value={`${data.condition} · ${CONDITION_GRADES.find(c => c.id === data.condition)?.label}`} />
                  <Summary label="Battery" value={`${data.batteryHealth}%`} />
                  <Summary label="AI Suggested price" value={`$${data.valuation?.recommended}`} />
                  <Summary label="Method" value={data.method} />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 0} data-testid="sell-back">
            <ChevronLeft className="mr-1 h-4 w-4" />Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next} data-testid="sell-next" className="h-11 rounded-full bg-navy px-6 hover:bg-navy-700">{step === 2 ? 'Run AI valuation' : 'Continue'}<ChevronRight className="ml-1 h-4 w-4" /></Button>
          ) : (
            <Button onClick={publish} data-testid="sell-publish" className="h-11 rounded-full bg-teal-500 px-6 hover:bg-teal-600">Publish listing</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <div className="rounded-2xl bg-muted/50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value || '—'}</p>
    </div>
  );
}
