import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { toast } from 'sonner';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { AuthShell } from './Login';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';

export default function OTPVerify() {
  const [code, setCode] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useApp();
  const email = location.state?.email;
  const password = location.state?.password;
  const mockOtp = location.state?.mockOtp;
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('No email in session. Please sign up again.'); return navigate('/register'); }
    if (code.length < 6) return toast.error('Enter the full 6-digit code');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, code });
      setSession(data.token, data.user);
      toast.success('Verified! Welcome to Gadget2Go.');
      navigate('/dashboard');
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const resend = async () => {
    if (!email || !password) { toast.error('Please sign up again to resend.'); return; }
    try {
      const { data } = await api.post('/auth/signup', { name: 'User', email, password });
      toast.success('New OTP sent! Demo code: ' + data.mockOtp, { duration: 8000 });
    } catch (err) { toast.error(err.message); }
  };

  return (
    <AuthShell title="Verify your email" subtitle={`We sent a 6-digit code to ${email || 'your email'}.`}>
      <form onSubmit={submit} className="space-y-6" data-testid="otp-form">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-8">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-teal-500/10 text-teal-700"><ShieldCheck className="h-7 w-7" /></div>
          <InputOTP maxLength={6} value={code} onChange={setCode} data-testid="otp-input">
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map(i => <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg" />)}
            </InputOTPGroup>
          </InputOTP>
          {mockOtp && (
            <p className="text-center text-xs text-muted-foreground">
              <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">DEMO MODE</span>{' '}
              Use code: <code className="rounded bg-muted px-1.5 py-0.5 font-bold">{mockOtp}</code>
            </p>
          )}
          <p className="text-xs text-muted-foreground">Didn't receive it? <button type="button" onClick={resend} className="text-teal-700 font-medium hover:underline">Resend</button></p>
        </div>
        <Button disabled={loading} data-testid="otp-submit" className="h-12 w-full rounded-xl bg-navy hover:bg-navy-700">{loading ? 'Verifying…' : (<>Verify <ArrowRight className="ml-2 h-4 w-4" /></>)}</Button>
      </form>
    </AuthShell>
  );
}
