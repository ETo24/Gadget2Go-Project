import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, User, Mail, Phone, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { AuthShell } from './Login';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(true);
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please complete required fields');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (!agree) return toast.error('You must agree to the terms');
    setLoading(true);
    setTimeout(() => {
      login({ name: form.name, email: form.email });
      toast.success('Welcome to Gadget2Go!');
      navigate('/otp');
    }, 600);
  };

  return (
    <AuthShell title="Create your account" subtitle="Join the smart marketplace for used gadgets.">
      <form onSubmit={submit} className="space-y-4" data-testid="register-form">
        <div className="space-y-2">
          <Label>Full name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input data-testid="reg-name" placeholder="Aria Tan" className="h-12 rounded-xl pl-9" value={form.name} onChange={update('name')} />
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
            <Input data-testid="reg-pass" type={show ? 'text' : 'password'} placeholder="At least 8 characters" className="h-12 rounded-xl pl-9 pr-10" value={form.password} onChange={update('password')} />
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
