import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Activity, Scan, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CONDITION_GRADES, valuateDevice } from '../lib/mockData';

export default function AIValuation() {
  const [form, setForm] = useState({ brand: 'Apple', model: 'iPhone 15 Pro', storage: '256GB', batteryHealth: 95, condition: 'A' });
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const run = () => {
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      setResult(valuateDevice(form));
      setScanning(false);
    }, 1600);
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-50/60 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-500/10"><Sparkles className="h-3 w-3" /> Powered by G2G AI</span>
        <h1 className="mt-3 font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">Instant gadget valuation</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Get a fair-market estimate, demand score and dealer offers — backed by 50+ data points and 1.4M comparable sales.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Form */}
        <div className="bento-card p-6 sm:p-8">
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Brand</Label>
                <Select value={form.brand} onValueChange={(v) => update('brand', v)}>
                  <SelectTrigger className="h-12 rounded-xl" data-testid="val-brand"><SelectValue /></SelectTrigger>
                  <SelectContent>{['Apple', 'Samsung', 'Google', 'Sony', 'Microsoft', 'OnePlus', 'Xiaomi', 'Other'].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input data-testid="val-model" value={form.model} onChange={(e) => update('model', e.target.value)} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Storage</Label>
                <Select value={form.storage} onValueChange={(v) => update('storage', v)}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select value={form.condition} onValueChange={(v) => update('condition', v)}>
                  <SelectTrigger className="h-12 rounded-xl" data-testid="val-cond"><SelectValue /></SelectTrigger>
                  <SelectContent>{CONDITION_GRADES.map(c => <SelectItem key={c.id} value={c.id}>{c.id} — {c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Battery health · {form.batteryHealth}%</Label>
              <Slider value={[form.batteryHealth]} min={50} max={100} step={1} onValueChange={(v) => update('batteryHealth', v[0])} data-testid="val-battery" />
            </div>
            <Button data-testid="run-valuation" onClick={run} disabled={scanning} className="h-12 w-full rounded-full bg-navy text-base hover:bg-navy-700">
              {scanning ? 'Scanning…' : (<><Scan className="mr-2 h-4 w-4" />Run AI valuation</>)}
            </Button>
          </div>
        </div>

        {/* Result */}
        <div className="relative overflow-hidden rounded-3xl bg-navy p-6 text-white sm:p-8">
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-teal-500/30 blur-3xl" />
          <div className="relative">
            {scanning && (
              <div className="grid h-64 place-items-center">
                <div className="relative h-40 w-40 overflow-hidden rounded-3xl border border-teal-400/30">
                  <div className="absolute inset-x-0 h-1 bg-teal-400/80 shadow-[0_0_24px_rgba(20,184,166,0.8)] animate-scan-sweep" />
                  <div className="grid h-full w-full place-items-center text-xs uppercase tracking-[0.25em] text-teal-300">Scanning…</div>
                </div>
              </div>
            )}
            {!scanning && !result && (
              <div className="grid h-64 place-items-center text-center">
                <div>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-teal-500/20"><Sparkles className="h-7 w-7 text-teal-300" /></div>
                  <p className="mt-4 font-heading text-xl font-semibold">Enter your gadget details</p>
                  <p className="text-sm text-white/60">We'll instantly estimate its value.</p>
                </div>
              </div>
            )}
            <AnimatePresence>
              {!scanning && result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-teal-300">AI Estimate</p>
                  <p className="mt-2 font-heading text-5xl font-bold sm:text-6xl">RM {result.fair.toLocaleString()}</p>
                  <div className="mt-3 flex items-center gap-3 text-sm text-white/80">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-white/15"><div className="h-full bg-teal-400" style={{ width: `${result.confidence}%` }} /></div>
                    <span>{result.confidence}% confidence</span>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <Stat label="Dealer low" value={`RM ${result.dealerLow}`} />
                    <Stat label="Dealer high" value={`RM ${result.dealerHigh}`} />
                    <Stat label="Suggested" value={`RM ${result.recommended}`} highlight />
                  </div>
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-xs text-white/70"><span>Demand meter</span><span>{result.demand}/100</span></div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gradient-to-r from-teal-300 to-teal-500" style={{ width: `${result.demand}%` }} /></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Trend chart + insights */}
      {result && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="bento-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-teal-700">12-month market trend</p>
                <p className="font-heading text-xl font-bold">{form.brand} {form.model}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-teal-600" />
            </div>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.trend}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#14B8A6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                  <Area type="monotone" dataKey="value" stroke="#0F766E" strokeWidth={2} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bento-card p-5">
              <Activity className="h-5 w-5 text-teal-600" />
              <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Quick-sale probability</p>
              <p className="mt-1 font-heading text-3xl font-bold">{result.quickSale}%</p>
              <p className="text-xs text-muted-foreground">Within the next 48 hours.</p>
            </div>
            <div className="bento-card p-5">
              <ShieldCheck className="h-5 w-5 text-teal-600" />
              <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Compare with marketplace</p>
              <p className="mt-1 text-sm">Your AI estimate is <span className="font-semibold text-emerald-600">within range</span> of comparable G2G listings (±5%).</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className={`rounded-2xl p-3 ${highlight ? 'bg-teal-500/20 ring-1 ring-teal-400/40' : 'bg-white/5'}`}>
      <p className="text-[10px] uppercase tracking-wider text-white/60">{label}</p>
      <p className="mt-1 font-heading text-lg font-bold">{value}</p>
    </div>
  );
}
