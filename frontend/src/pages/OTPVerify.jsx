import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { toast } from 'sonner';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { AuthShell } from './Login';
import { useApp } from '../context/AppContext';

export default function OTPVerify() {
  const [code, setCode] = useState('');
  const navigate = useNavigate();
  const { user, login } = useApp();
  const submit = (e) => {
    e.preventDefault();
    if (code.length < 6) return toast.error('Enter the full 6-digit code');
    if (!user) login({ email: 'demo@g2g.app', name: 'Demo User' });
    toast.success('Verified! Welcome to Gadget2Go.');
    navigate('/dashboard');
  };
  return (
    <AuthShell title="Verify your number" subtitle="Enter the 6-digit code we sent to your phone or email.">
      <form onSubmit={submit} className="space-y-6" data-testid="otp-form">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-8">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-teal-500/10 text-teal-700"><ShieldCheck className="h-7 w-7" /></div>
          <InputOTP maxLength={6} value={code} onChange={setCode} data-testid="otp-input">
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map(i => <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg" />)}
            </InputOTPGroup>
          </InputOTP>
          <p className="text-xs text-muted-foreground">Didn't receive a code? <button type="button" className="text-teal-700 font-medium hover:underline">Resend</button></p>
        </div>
        <Button data-testid="otp-submit" className="h-12 w-full rounded-xl bg-navy hover:bg-navy-700">Verify <ArrowRight className="ml-2 h-4 w-4" /></Button>
      </form>
    </AuthShell>
  );
}
