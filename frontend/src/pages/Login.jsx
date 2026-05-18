import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Apple, Store, User as UserIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';

const AuthShell = ({ children, title, subtitle }) => (
  <div className="grid min-h-screen lg:grid-cols-2">
    <div className="relative hidden bg-navy lg:block">
      <img alt="" src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1400&q=80" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-br from-navy/90 via-navy/70 to-teal-500/40" />
      <div className="relative flex h-full flex-col justify-between p-12 text-white">
        <Link to="/" className="flex items-center gap-2" data-testid="auth-logo">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur"><span className="font-heading font-bold">G2</span></div>
          <div>
            <p className="font-heading font-bold">Gadget2Go</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-teal-300">Cybridge Co.</p>
          </div>
        </Link>
        <div>
          <h1 className="font-heading text-5xl font-bold leading-tight">Sell Smart. <br />Buy Safe.</h1>
          <p className="mt-3 max-w-md text-white/70">The AI-powered marketplace trusted by 124,000+ buyers and sellers.</p>
        </div>
        <p className="text-xs text-white/50">Bridging People, Bridging Tech.</p>
      </div>
    </div>
    <div className="flex items-center justify-center p-6 sm:p-12">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
        <div className="lg:hidden mb-6 flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-white"><span className="font-heading font-bold">G2</span></div>
            <p className="font-heading font-bold">Gadget2Go</p>
          </Link>
        </div>
        <h2 className="font-heading text-3xl font-bold sm:text-4xl">{title}</h2>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </motion.div>
    </div>
  </div>
);

export default function Login() {
  const navigate = useNavigate();
  const { setSession } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setSession(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue trading gadgets safely.">
      <form onSubmit={submit} className="space-y-4" data-testid="login-form">
        <div className="space-y-2">
          <Label>Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input data-testid="login-email" type="email" placeholder="you@email.com" className="h-12 rounded-xl pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input data-testid="login-password" type={showPwd ? 'text' : 'password'} placeholder="••••••••" className="h-12 rounded-xl pl-9 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPwd(s => !s)} data-testid="toggle-password" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox data-testid="remember-me" checked={remember} onCheckedChange={setRemember} /> Remember me
          </label>
          <Link to="/forgot-password" className="text-sm font-medium text-teal-700 hover:underline" data-testid="forgot-link">Forgot password?</Link>
        </div>
        <Button data-testid="login-submit" disabled={loading} className="h-12 w-full rounded-xl bg-navy text-base hover:bg-navy-700">
          {loading ? 'Signing in…' : <>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>
        <div className="my-2 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /><span>OR</span><div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button data-testid="google-login" type="button" variant="outline" className="h-12 rounded-xl" onClick={() => toast.info('Social login is demo-only.')}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.973 32.91 29.418 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c2.999 0 5.736 1.13 7.793 2.977l5.657-5.657C33.846 6.053 29.155 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.342-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 16.108 19.001 12 24 12c2.999 0 5.736 1.13 7.793 2.977l5.657-5.657C33.846 6.053 29.155 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.41-5.197l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.396 0-9.957-3.075-11.292-7.93l-6.523 5.025C9.503 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.566l6.19 5.238C36.971 39.205 44 34 44 24c0-1.342-.138-2.65-.389-3.917z"/></svg>
            Google
          </Button>
          <Button data-testid="apple-login" type="button" variant="outline" className="h-12 rounded-xl" onClick={() => toast.info('Social login is demo-only.')}><Apple className="mr-2 h-4 w-4" />Apple</Button>
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">No account? <Link to="/register" className="font-semibold text-navy hover:underline dark:text-teal-400" data-testid="goto-register">Create one</Link></p>
        <p className="text-center text-xs text-muted-foreground">Try demo: <code className="rounded bg-muted px-1.5 py-0.5">aria@g2g.app</code> / <code className="rounded bg-muted px-1.5 py-0.5">demo1234</code> · admin: <code className="rounded bg-muted px-1.5 py-0.5">admin@g2g.app</code> / <code className="rounded bg-muted px-1.5 py-0.5">admin123</code></p>
      </form>
    </AuthShell>
  );
}

export { AuthShell };
