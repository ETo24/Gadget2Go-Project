import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { toast } from 'sonner';
import { AuthShell } from './Login';
import { api } from '../lib/api';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [mockOtp, setMockOtp] = useState('');
  const navigate = useNavigate();

  const sendCode = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter your email');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMockOtp(data.mockOtp);
      toast.success('Reset code sent! Demo code: ' + data.mockOtp, { duration: 8000 });
      setStep(2);
    } catch (err) { toast.error(err.message); }
  };

  const resetPwd = async (e) => {
    e.preventDefault();
    if (code.length < 6 || newPassword.length < 6) return toast.error('Enter full code and a 6+ character password');
    try {
      await api.post('/auth/reset-password', { email, code, newPassword });
      toast.success('Password reset! Please sign in.');
      navigate('/login');
    } catch (err) { toast.error(err.message); }
  };

  return (
    <AuthShell title={step === 1 ? 'Forgot password?' : 'Set a new password'} subtitle={step === 1 ? 'We\'ll send a 6-digit code to reset your password.' : `Enter the code we sent to ${email}.`}>
      {step === 1 ? (
        <form onSubmit={sendCode} className="space-y-4" data-testid="forgot-form">
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
      ) : (
        <form onSubmit={resetPwd} className="space-y-5" data-testid="reset-form">
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card p-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-500/10 text-teal-700"><ShieldCheck className="h-6 w-6" /></div>
            <InputOTP maxLength={6} value={code} onChange={setCode} data-testid="reset-otp"><InputOTPGroup>{[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg" />)}</InputOTPGroup></InputOTP>
            {mockOtp && <p className="text-xs text-muted-foreground">DEMO code: <code className="rounded bg-muted px-1.5 py-0.5 font-bold">{mockOtp}</code></p>}
          </div>
          <div className="space-y-2">
            <Label>New password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input data-testid="reset-pass" type="password" placeholder="At least 6 characters" className="h-12 rounded-xl pl-9" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
          </div>
          <Button data-testid="reset-submit" className="h-12 w-full rounded-xl bg-navy hover:bg-navy-700">Reset password</Button>
        </form>
      )}
    </AuthShell>
  );
}
