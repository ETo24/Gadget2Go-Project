import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { AuthShell } from './Login';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const submit = (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter your email');
    toast.success('Verification code sent to ' + email);
    navigate('/otp');
  };
  return (
    <AuthShell title="Forgot password?" subtitle="No worries — we'll send a code to reset your password.">
      <form onSubmit={submit} className="space-y-4" data-testid="forgot-form">
        <div className="space-y-2">
          <Label>Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input data-testid="forgot-email" type="email" placeholder="you@email.com" className="h-12 rounded-xl pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <Button data-testid="forgot-submit" className="h-12 w-full rounded-xl bg-navy hover:bg-navy-700">Send code <ArrowRight className="ml-2 h-4 w-4" /></Button>
        <p className="text-center text-sm text-muted-foreground">Remembered? <Link to="/login" className="font-semibold text-navy dark:text-teal-400 hover:underline">Sign in</Link></p>
      </form>
    </AuthShell>
  );
}
