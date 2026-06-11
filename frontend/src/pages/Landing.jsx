import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, ArrowRight, BadgeCheck, Star, Smartphone, Tablet, Laptop, Gamepad2, Watch, Headphones, Zap, MessageCircle, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { PRODUCTS, CATEGORIES, TESTIMONIALS, TRUST_STATS, TRENDING_IDS } from '../lib/mockData';
import { useApp } from '../context/AppContext';

const ICONS = { Smartphone, Tablet, Laptop, Gamepad2, Watch, Headphones };

function AnimatedNumber({ value, suffix = '' }) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    let frame; let start; const dur = 1400;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      setN(Math.round(value * (0.2 + 0.8 * (1 - Math.pow(1 - p, 3)))));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  const display = value < 10 ? value.toFixed(1) : n.toLocaleString();
  return <span>{display}{suffix}</span>;
}

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useApp();
  const featured = TRENDING_IDS.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2" data-testid="landing-logo">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-white">
              <span className="font-heading text-base font-bold">G2</span>
            </div>
            <div className="leading-tight">
              <p className="font-heading text-base font-bold">Gadget2Go</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-teal-600">Cybridge Co.</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <a href="#features" className="text-sm font-medium text-foreground/70 hover:text-foreground">Features</a>
            <a href="#categories" className="text-sm font-medium text-foreground/70 hover:text-foreground">Categories</a>
            <a href="#trust" className="text-sm font-medium text-foreground/70 hover:text-foreground">Trust</a>
            <a href="#reviews" className="text-sm font-medium text-foreground/70 hover:text-foreground">Reviews</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button onClick={() => navigate('/dashboard')} data-testid="cta-dashboard" className="rounded-full bg-navy hover:bg-navy-700">Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')} data-testid="cta-signin" className="rounded-full">Sign in</Button>
                <Button onClick={() => navigate('/register')} data-testid="cta-getstarted" className="rounded-full bg-navy hover:bg-navy-700 text-white">Get started</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="absolute -right-32 top-40 h-[28rem] w-[28rem] rounded-full bg-navy/10 blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:py-24">
          <div className="lg:col-span-7">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-50/50 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-500/10 dark:text-teal-400">
                <Sparkles className="h-3.5 w-3.5" /> AI-powered marketplace · Trusted by 124K+
              </span>
              <h1 className="mt-5 font-heading text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Sell Smart. <br />
                <span className="gradient-text">Buy Safe.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                The AI-powered used-gadget marketplace. Compare dealer vs individual offers, verify device condition, and chat securely — all in one place.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button data-testid="hero-sell-now" size="lg" onClick={() => navigate(user ? '/sell' : '/register')} className="h-12 rounded-full bg-navy px-7 text-base hover:bg-navy-700">
                  Sell Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button data-testid="hero-browse" size="lg" variant="outline" onClick={() => navigate(user ? '/buy' : '/register')} className="h-12 rounded-full border-2 border-navy/15 bg-card px-7 text-base hover:bg-muted">
                  Browse Gadgets
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-600" /> Verified Sellers</span>
                <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-teal-600" /> Instant AI Pricing</span>
                <span className="inline-flex items-center gap-2"><MessageCircle className="h-4 w-4 text-teal-600" /> In-app Escrow</span>
              </div>
            </motion.div>
          </div>

          <div className="relative lg:col-span-5">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-navy">
              <img alt="hero" src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80" className="absolute inset-0 h-full w-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent" />
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity }} className="absolute left-5 top-5 rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur">
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-700"><Sparkles className="h-4 w-4" /> AI Fair Price</div>
                <p className="mt-1 font-heading text-3xl font-bold text-navy">RM 1,050</p>
                <p className="text-xs text-muted-foreground">iPhone 15 Pro · 256GB</p>
              </motion.div>
              <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 7, repeat: Infinity, delay: 0.6 }} className="absolute bottom-5 right-5 rounded-2xl bg-teal-500 p-4 text-white shadow-2xl">
                <div className="flex items-center gap-2 text-xs font-semibold"><BadgeCheck className="h-4 w-4" /> Verified Seller</div>
                <p className="mt-1 font-heading text-lg font-bold">96/100 Trust</p>
                <p className="text-xs text-white/80">38 successful deals</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">Top Categories</p>
            <h2 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">Shop by what you love</h2>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => {
            const Ic = ICONS[c.icon];
            return (
              <button key={c.id} data-testid={`landing-cat-${c.id}`} onClick={() => navigate(user ? `/buy?cat=${c.id}` : '/register')} className="bento-card group p-5 text-left">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-navy text-white transition-transform group-hover:rotate-3">
                  <Ic className="h-6 w-6" strokeWidth={1.6} />
                </div>
                <p className="mt-4 font-heading font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.count} listings</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">Featured & Trending</p>
            <h2 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">Hand-picked deals today</h2>
          </div>
          <Button variant="ghost" onClick={() => navigate(user ? '/buy' : '/register')} data-testid="landing-see-all">See all <ArrowRight className="ml-1 h-4 w-4" /></Button>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <button onClick={() => navigate(user ? `/buy/${p.id}` : '/register')} data-testid={`landing-feat-${p.id}`} className="bento-card group block w-full overflow-hidden text-left">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  {p.verifiedBadge && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-teal-500 px-2 py-1 text-[10px] font-bold text-white"><BadgeCheck className="h-3 w-3" />Verified</span>}
                </div>
                <div className="p-4">
                  <p className="line-clamp-1 font-heading font-semibold">{p.title}</p>
                  <div className="mt-2 flex items-end justify-between">
                    <p className="font-heading text-xl font-bold">RM {p.price}</p>
                    <p className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700"><Sparkles className="h-3 w-3" />Fair RM {p.aiFair}</p>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Showcase */}
      <section id="features" className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-square overflow-hidden rounded-[2.5rem] bg-navy">
            <img alt="AI" src="https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?auto=format&fit=crop&w=1200&q=80" className="absolute inset-0 h-full w-full object-cover opacity-50" />
            <div className="absolute inset-0 grid place-items-center">
              <div className="rounded-3xl border border-teal-400/30 bg-navy-900/60 p-8 backdrop-blur-xl">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-teal-300">AI Valuation</p>
                <p className="mt-3 font-heading text-5xl font-bold text-white">RM 1,050</p>
                <div className="mt-3 flex items-center gap-3 text-sm text-white/80">
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-white/20">
                    <div className="h-full w-[88%] bg-teal-400" />
                  </div>
                  <span>88% confidence</span>
                </div>
                <p className="mt-4 text-xs text-white/60">Based on 1,420 recent comparable sales</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">Smart Pricing Engine</p>
            <h2 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">Know exactly what your gadget is worth</h2>
            <p className="mt-3 text-muted-foreground">Our AI analyses 50+ data points — model, storage, battery health, demand, and live market prices — to give you a fair, confident estimate in seconds.</p>
            <ul className="mt-6 space-y-3">
              {[
                { icon: TrendingUp, t: 'Live market trend graphs', d: '12-month price history for every model.' },
                { icon: Zap, t: 'Instant offers from dealers', d: 'Bulk buyers compete to give you the best price.' },
                { icon: ShieldCheck, t: 'Verified condition reports', d: 'Battery, screen, cosmetic — all transparent.' },
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-400"><f.icon className="h-5 w-5" /></div>
                  <div>
                    <p className="font-heading font-semibold">{f.t}</p>
                    <p className="text-sm text-muted-foreground">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Button data-testid="try-valuation" onClick={() => navigate(user ? '/valuation' : '/register')} className="mt-7 h-12 rounded-full bg-navy px-6 hover:bg-navy-700">Try AI Valuation</Button>
          </div>
        </div>
      </section>

      {/* Trust Stats */}
      <section id="trust" className="bg-navy text-white">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {TRUST_STATS.map((s) => (
              <div key={s.label} data-testid={`stat-${s.label}`}>
                <p className="font-heading text-4xl font-bold sm:text-5xl"><AnimatedNumber value={s.value} suffix={s.suffix} /></p>
                <p className="mt-2 text-sm text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">Loved by the community</p>
        <h2 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">Real stories from real users</h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.id} className="bento-card p-6">
              <div className="flex gap-1">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
              <p className="mt-4 font-heading text-lg leading-snug">"{t.text}"</p>
              <div className="mt-5 flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-navy p-10 text-white lg:p-16">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-teal-500/30 blur-3xl" />
          <div className="relative">
            <h2 className="font-heading text-3xl font-bold sm:text-5xl">Ready to bridge people & tech?</h2>
            <p className="mt-3 max-w-xl text-white/70">Join 124,000+ users buying and selling gadgets the smart, safe way.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button data-testid="cta-bottom-signup" onClick={() => navigate('/register')} size="lg" className="h-12 rounded-full bg-teal-500 px-7 text-base text-white hover:bg-teal-600">Create free account</Button>
              <Button data-testid="cta-bottom-explore" onClick={() => navigate(user ? '/buy' : '/register')} variant="outline" size="lg" className="h-12 rounded-full border-white/30 bg-transparent px-7 text-base text-white hover:bg-white/10">Explore marketplace</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card">
        <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-white"><span className="font-heading font-bold">G2</span></div>
                <p className="font-heading font-bold">Gadget2Go</p>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Bridging People, Bridging Tech.</p>
              <p className="mt-2 text-xs text-muted-foreground">© 2026 Cybridge Co. All rights reserved.</p>
            </div>
            {[
              { t: 'Product', l: ['Buy', 'Sell', 'AI Valuation', 'Dealer Center'] },
              { t: 'Company', l: ['About', 'Careers', 'Press', 'Blog'] },
              { t: 'Support', l: ['Help Center', 'Trust & Safety', 'Contact', 'Status'] },
            ].map((col) => (
              <div key={col.t}>
                <p className="font-heading text-sm font-bold uppercase tracking-wider">{col.t}</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {col.l.map(x => <li key={x}><a href="#" className="hover:text-foreground">{x}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
