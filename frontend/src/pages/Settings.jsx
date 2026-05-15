import React from 'react';
import { Moon, Sun, Shield, Bell, Lock, User, LogOut, Smartphone, Globe } from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

function Section({ title, children }) {
  return (
    <div className="bento-card p-6">
      <h2 className="font-heading text-lg font-bold">{title}</h2>
      <Separator className="my-4" />
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function Row({ icon: Ic, title, desc, right }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground"><Ic className="h-4 w-4" /></div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div>{right}</div>
    </div>
  );
}

export default function Settings() {
  const { theme, toggleTheme, logout } = useApp();
  const navigate = useNavigate();
  const [notify, setNotify] = React.useState({ offers: true, chat: true, marketing: false });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">Settings</h1>
        <p className="text-muted-foreground">Manage your account, preferences, and security.</p>
      </div>

      <Section title="Appearance">
        <Row icon={theme === 'dark' ? Moon : Sun} title="Theme" desc="Toggle between light and dark mode." right={
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{theme === 'dark' ? 'Dark' : 'Light'}</span>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} data-testid="settings-theme-toggle" />
          </div>
        } />
        <Row icon={Globe} title="Language" desc="English (United States)" right={<Button variant="outline" size="sm" className="rounded-full">Change</Button>} />
      </Section>

      <Section title="Notifications">
        <Row icon={Bell} title="Offer alerts" desc="Buyer offers and counter-offers." right={<Switch checked={notify.offers} onCheckedChange={(v) => setNotify({ ...notify, offers: v })} data-testid="notify-offers" />} />
        <Row icon={Bell} title="Chat alerts" desc="New messages from buyers/sellers." right={<Switch checked={notify.chat} onCheckedChange={(v) => setNotify({ ...notify, chat: v })} data-testid="notify-chat" />} />
        <Row icon={Bell} title="Marketing" desc="Deals, drops & product updates." right={<Switch checked={notify.marketing} onCheckedChange={(v) => setNotify({ ...notify, marketing: v })} data-testid="notify-marketing" />} />
      </Section>

      <Section title="Security & Privacy">
        <Row icon={Lock} title="Change password" desc="Update your account password." right={<Button variant="outline" size="sm" className="rounded-full" onClick={() => toast.info('Password reset email sent')}>Update</Button>} />
        <Row icon={Shield} title="Two-factor authentication" desc="Add an extra layer of protection." right={<Switch defaultChecked data-testid="two-fa" />} />
        <Row icon={Smartphone} title="Active sessions" desc="iPhone 15 Pro · Safari · Singapore" right={<Button variant="ghost" size="sm">Manage</Button>} />
      </Section>

      <Section title="Account">
        <Row icon={User} title="Profile" desc="Edit name, email, phone." right={<Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate('/profile')}>Open</Button>} />
        <Row icon={LogOut} title="Sign out" desc="Log out of all devices." right={<Button data-testid="settings-logout" variant="outline" size="sm" className="rounded-full text-rose-600" onClick={() => { logout(); navigate('/'); }}>Sign out</Button>} />
      </Section>
    </div>
  );
}
