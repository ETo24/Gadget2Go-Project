import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Users, Package, Wallet as WalletIcon, Flag, ShieldAlert, Check, X, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

export default function Admin() {
  const navigate = useNavigate();
  const { user, theme, toggleTheme, logout } = useApp();
  const [analytics, setAnalytics] = useState({ users: 0, listings: 0, payments: 0, revenue: 0, pendingKyc: 0 });
  const [kycs, setKycs] = useState([]);
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);

  const load = async () => {
    try {
      const a = await api.get('/admin/analytics'); setAnalytics(a.data);
      const k = await api.get('/admin/verifications'); setKycs(k.data);
      const l = await api.get('/admin/listings'); setListings(l.data);
      const r = await api.get('/admin/reports'); setReports(r.data);
    } catch (e) { toast.error(e.message); }
  };
  useEffect(() => { if (user?.role === 'admin') load(); }, [user?.id]);

  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const reviewKyc = async (id, action) => {
    try { await api.post(`/admin/verifications/${id}`, { action }); toast.success(action === 'approve' ? 'Approved' : 'Rejected'); load(); }
    catch (e) { toast.error(e.message); }
  };
  const removeListing = async (id) => {
    if (!window.confirm('Remove this listing?')) return;
    try { await api.delete(`/admin/listings/${id}`); toast.success('Listing removed'); load(); }
    catch (e) { toast.error(e.message); }
  };
  const resolveReport = async (id, action) => {
    try { await api.post(`/admin/reports/${id}`, { action }); toast.success('Done'); load(); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="mx-auto flex max-w-[1400px] items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-teal-600">Cybridge Admin</p>
          <h1 className="font-heading text-3xl font-bold">G2G Control Panel</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={toggleTheme} className="rounded-full">{theme === 'dark' ? 'Light' : 'Dark'} mode</Button>
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="rounded-full">Exit admin</Button>
          <Button variant="outline" onClick={() => { logout(); navigate('/'); }} className="rounded-full text-rose-600">Sign out</Button>
        </div>
      </header>

      <section className="mx-auto mt-8 grid max-w-[1400px] grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { i: Users, l: 'Users', v: analytics.users, c: 'bg-navy text-white' },
          { i: Package, l: 'Active listings', v: analytics.listings, c: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400' },
          { i: WalletIcon, l: 'Total payments', v: analytics.payments, c: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
          { i: WalletIcon, l: 'Revenue (released)', v: `$${analytics.revenue}`, c: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
          { i: ShieldAlert, l: 'Pending KYC', v: analytics.pendingKyc, c: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' },
        ].map(s => (
          <div key={s.l} className="bento-card p-5">
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${s.c}`}><s.i className="h-5 w-5" /></div>
            <p className="mt-3 font-heading text-2xl font-bold">{s.v}</p>
            <p className="text-xs text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-8 max-w-[1400px]">
        <Tabs defaultValue="kyc">
          <TabsList className="rounded-full bg-muted">
            <TabsTrigger value="kyc" className="rounded-full" data-testid="admin-tab-kyc">KYC ({kycs.filter(k => k.status === 'pending').length})</TabsTrigger>
            <TabsTrigger value="listings" className="rounded-full" data-testid="admin-tab-listings">Listings ({listings.length})</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-full" data-testid="admin-tab-reports">Reports ({reports.filter(r => r.status === 'open').length})</TabsTrigger>
          </TabsList>
          <TabsContent value="kyc" className="mt-4 space-y-3">
            {kycs.length === 0 ? <div className="bento-card p-10 text-center text-muted-foreground">No KYC submissions.</div> :
              kycs.map(k => (
                <div key={k.id} className="bento-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-heading font-semibold">{k.userName} <span className="text-xs text-muted-foreground">· {k.userEmail}</span></p>
                      <p className="text-xs text-muted-foreground">Document: {k.docType}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${k.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : k.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{k.status}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {k.idDoc && <img src={k.idDoc} alt="" className="aspect-video w-full rounded-xl object-cover" />}
                    {k.selfie && <img src={k.selfie} alt="" className="aspect-video w-full rounded-xl object-cover" />}
                  </div>
                  {k.status === 'pending' && (
                    <div className="mt-4 flex gap-2">
                      <Button data-testid={`approve-${k.id}`} onClick={() => reviewKyc(k.id, 'approve')} className="rounded-full bg-emerald-600 hover:bg-emerald-700"><Check className="mr-1 h-4 w-4" />Approve</Button>
                      <Button data-testid={`reject-${k.id}`} variant="outline" onClick={() => reviewKyc(k.id, 'reject')} className="rounded-full text-rose-600"><X className="mr-1 h-4 w-4" />Reject</Button>
                    </div>
                  )}
                </div>
              ))}
          </TabsContent>
          <TabsContent value="listings" className="mt-4 space-y-3">
            {listings.map(l => (
              <div key={l.id} className="bento-card flex items-center gap-4 p-4">
                <img src={l.images?.[0]} alt="" className="h-16 w-16 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-heading font-semibold">{l.title}</p>
                  <p className="text-xs text-muted-foreground">{l.seller?.name} · ${l.price} · {l.status}</p>
                </div>
                <Button data-testid={`remove-${l.id}`} variant="outline" onClick={() => removeListing(l.id)} className="rounded-full text-rose-600" size="sm"><Trash2 className="mr-1 h-3 w-3" />Remove</Button>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="reports" className="mt-4 space-y-3">
            {reports.length === 0 ? <div className="bento-card p-10 text-center text-muted-foreground">No reports.</div> :
              reports.map(r => (
                <div key={r.id} className="bento-card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <Flag className="mt-1 h-5 w-5 text-rose-600" />
                      <div>
                        <p className="font-heading font-semibold">Report from {r.reporterName}</p>
                        <p className="text-xs text-muted-foreground">Target: {r.targetId} ({r.targetType})</p>
                        <p className="mt-2 text-sm">{r.reason}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${r.status === 'open' ? 'bg-amber-50 text-amber-700' : 'bg-muted'}`}>{r.status}</span>
                  </div>
                  {r.status === 'open' && (
                    <div className="mt-3 flex gap-2">
                      <Button data-testid={`resolve-${r.id}`} onClick={() => resolveReport(r.id, 'resolve')} className="rounded-full bg-emerald-600 hover:bg-emerald-700" size="sm">Resolve</Button>
                      <Button data-testid={`dismiss-${r.id}`} variant="outline" onClick={() => resolveReport(r.id, 'dismiss')} className="rounded-full" size="sm">Dismiss</Button>
                    </div>
                  )}
                </div>
              ))}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
