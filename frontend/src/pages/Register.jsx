import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, User, Mail, Phone, Lock, Store, User as UserIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import { AuthShell } from './Login';
import { api } from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [role, setRole] = useState('user');
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(true);
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please complete required fields');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (!agree) return toast.error('You must agree to the terms');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', { name: form.name, email: form.email, phone: form.phone, password: form.password, role });
      toast.success('OTP sent! Demo code: ' + data.mockOtp, { duration: 8000 });
      navigate('/otp', { state: { email: form.email, password: form.password, mockOtp: data.mockOtp } });
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell title="Create your account" subtitle="Join the smart marketplace for used gadgets.">
      <form onSubmit={submit} className="space-y-4" data-testid="register-form">
        <div className="grid grid-cols-2 gap-3">
          <button type="button" data-testid="role-user" onClick={() => setRole('user')} className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left ${role === 'user' ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10' : 'border-border'}`}>
            <UserIcon className="h-5 w-5 text-teal-600" />
            <div>
              <p className="font-heading font-semibold">Personal</p>
              <p className="text-xs text-muted-foreground">Buy & sell as an individual</p>
            </div>
          </button>
          <button type="button" data-testid="role-dealer" onClick={() => setRole('dealer')} className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left ${role === 'dealer' ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10' : 'border-border'}`}>
            <Store className="h-5 w-5 text-teal-600" />
            <div>
              <p className="font-heading font-semibold">Dealer</p>
              <p className="text-xs text-muted-foreground">Gadget shop / reseller</p>
            </div>
          </button>
        </div>
        <div className="space-y-2">
          <Label>{role === 'dealer' ? 'Store name' : 'Full name'}</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input data-testid="reg-name" placeholder={role === 'dealer' ? 'TechHub SG' : 'Aria Tan'} className="h-12 rounded-xl pl-9" value={form.name} onChange={update('name')} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input data-testid="reg-email" type="email" placeholder="you@email.com" className="h-12 rounded-xl pl-9" value={form.email} onChange={update('email')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input data-testid="reg-phone" placeholder="+65 9123 4567" className="h-12 rounded-xl pl-9" value={form.phone} onChange={update('phone')} />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input data-testid="reg-pass" type={show ? 'text' : 'password'} placeholder="At least 6 characters" className="h-12 rounded-xl pl-9 pr-10" value={form.password} onChange={update('password')} />
            <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Confirm password</Label>
          <Input data-testid="reg-confirm" type={show ? 'text' : 'password'} placeholder="Repeat password" className="h-12 rounded-xl" value={form.confirm} onChange={update('confirm')} />
        </div>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <Checkbox checked={agree} onCheckedChange={setAgree} data-testid="agree-terms" className="mt-0.5" />
          <span>I agree to G2G's <a href="#" className="text-teal-700 underline">Terms</a> & <a href="#" className="text-teal-700 underline">Privacy</a>.</span>
        </label>
        <Button disabled={loading} data-testid="reg-submit" className="h-12 w-full rounded-xl bg-navy text-base hover:bg-navy-700">
          {loading ? 'Creating account…' : <>Create account <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>
        <p className="text-center text-sm text-muted-foreground">Already a member? <Link to="/login" className="font-semibold text-navy hover:underline dark:text-teal-400" data-testid="goto-login">Sign in</Link></p>
      </form>
    </AuthShell>
  );
}
