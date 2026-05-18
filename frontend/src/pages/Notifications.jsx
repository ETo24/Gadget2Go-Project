import React, { useEffect, useState } from 'react';
import { Bell, Tag, MessageSquare, Truck, ShieldCheck, Check, Wallet } from 'lucide-react';
import { Button } from '../components/ui/button';
import { api } from '../lib/api';
import { toast } from 'sonner';

const ICONS = { Tag, MessageSquare, Truck, ShieldCheck, Wallet, Bell };

export default function Notifications() {
  const [items, setItems] = useState([]);
  const load = () => api.get('/notifications').then(r => setItems(r.data)).catch(e => toast.error(e.message));
  useEffect(() => { load(); }, []);
  const markAllRead = async () => { try { await api.post('/notifications/read-all'); toast.success('All marked read'); load(); } catch (e) { toast.error(e.message); } };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">Notifications</h1>
          <p className="text-muted-foreground">{items.filter(i => i.unread).length} unread</p>
        </div>
        <Button data-testid="mark-all-read" onClick={markAllRead} variant="outline" className="rounded-full"><Check className="mr-2 h-4 w-4" />Mark all read</Button>
      </div>
      <div className="space-y-3">
        {items.length === 0 ? <div className="bento-card p-12 text-center text-muted-foreground">No notifications yet.</div> :
          items.map(n => {
            const I = ICONS[n.icon] || Bell;
            return (
              <div key={n.id} className={`bento-card flex items-start gap-4 p-5 ${n.unread ? '' : 'opacity-70'}`}>
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${n.unread ? 'bg-teal-500/10 text-teal-700' : 'bg-muted text-muted-foreground'}`}><I className="h-5 w-5" /></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-heading font-semibold">{n.title}</p>
                    <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{n.text}</p>
                </div>
                {n.unread && <span className="mt-2 h-2 w-2 rounded-full bg-teal-500" />}
              </div>
            );
          })}
      </div>
    </div>
  );
}
