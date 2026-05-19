import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Users, Package, Wallet as WalletIcon, Flag, ShieldAlert, Check, X, Trash2, Search, BadgeCheck, RotateCcw, LogOut, Sun, Moon, ShieldCheck, AlertCircle, Image as ImageIcon, ArrowUpRight, Filter, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

export default function Admin() {
  const navigate = useNavigate();
  const { user, theme, toggleTheme, logout } = useApp();
  const [analytics, setAnalytics] = useState({});
  const [kycs, setKycs] = useState([]);
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('analytics');
  const [search, setSearch] = useState('');
  const [reportFilter, setReportFilter] = useState('all');
  const [refundFilter, setRefundFilter] = useState('all');

  // Refund detail dialog
  const [refundDetail, setRefundDetail] = useState(null);
  // Report notes dialog
  const [reportNote, setReportNote] = useState({ open: false, report: null, notes: '', action: 'resolve' });
  // Suspend dialog
  const [suspend, setSuspend] = useState({ open: false, user: null, notes: '' });

  const load = async () => {
    try {
      const a = await api.get('/admin/analytics'); setAnalytics(a.data);
      const k = await api.get('/admin/verifications'); setKycs(k.data);
      const l = await api.get('/admin/listings'); setListings(l.data);
      const r = await api.get('/admin/reports'); setReports(r.data);
      const rf = await api.get('/admin/refunds'); setRefunds(rf.data);
      const u = await api.get('/admin/users'); setUsers(u.data);
    } catch (e) { toast.error(e.message); }
  };
  useEffect(() => { if (user?.role === 'admin') load(); }, [user?.id]);

  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  // Actions
  const reviewKyc = async (id, action) => {
    try { await api.post(`/admin/verifications/${id}`, { action }); toast.success(action === 'approve' ? 'Approved' : 'Rejected'); load(); }
    catch (e) { toast.error(e.message); }
  };
  const removeListing = async (id) => {
    if (!window.confirm('Remove this listing?')) return;
    try { await api.delete(`/admin/listings/${id}`); toast.success('Listing removed'); load(); }
    catch (e) { toast.error(e.message); }
  };
  const resolveReport = async () => {
    try { await api.post(`/admin/reports/${reportNote.report.id}`, { action: reportNote.action, notes: reportNote.notes }); toast.success('Updated'); setReportNote({ open: false, report: null, notes: '', action: 'resolve' }); load(); }
    catch (e) { toast.error(e.message); }
  };
  const submitSuspend = async () => {
    try { await api.post(`/admin/users/${suspend.user.id}`, { action: 'suspend', notes: suspend.notes }); toast.success('User suspended'); setSuspend({ open: false, user: null, notes: '' }); load(); }
    catch (e) { toast.error(e.message); }
  };
  const unsuspend = async (uid) => {
    try { await api.post(`/admin/users/${uid}`, { action: 'unsuspend' }); toast.success('Restored'); load(); }
    catch (e) { toast.error(e.message); }
  };
  const refundAction = async (action) => {
    try { await api.post(`/admin/refunds/${refundDetail.id}`, { action, notes: refundDetail.adminNotes || '' }); toast.success('Done'); setRefundDetail(null); load(); }
    catch (e) { toast.error(e.message); }
  };
  const adminMessage = async () => {
    if (!refundDetail._draft?.trim()) return;
    try { await api.post(`/refunds/${refundDetail.id}/messages`, { text: refundDetail._draft }); const r = await api.get(`/admin/refunds/${refundDetail.id}`); setRefundDetail({ ...r.data, _draft: '' }); }
    catch (e) { toast.error(e.message); }
  };

  const filteredReports = reports.filter(r => reportFilter === 'all' || r.status === reportFilter);
  const filteredRefunds = refunds.filter(r => refundFilter === 'all' || r.status === refundFilter);
  const filteredUsers = users.filter(u => !search || (u.name + u.email).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-700 to-navy-900 p-0 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-navy-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-500 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-teal-300">Cybridge Admin</p>
              <h1 className="font-heading text-xl font-bold">G2G Control Panel</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-white hover:bg-white/10">{theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10">Exit admin</Button>
            <Button variant="outline" onClick={() => { logout(); navigate('/'); }} className="rounded-full border-white/30 bg-transparent text-rose-300 hover:bg-rose-500/10"><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-6 p-6">
        {/* Analytics */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { i: Users, l: 'Total users', v: analytics.users || 0, c: 'from-teal-500 to-teal-700' },
            { i: BadgeCheck, l: 'Verified users', v: analytics.verifiedUsers || 0, c: 'from-emerald-500 to-emerald-700' },
            { i: Package, l: 'Active listings', v: analytics.listings || 0, c: 'from-sky-500 to-sky-700' },
            { i: WalletIcon, l: 'Revenue', v: `$${analytics.revenue || 0}`, c: 'from-amber-500 to-amber-700' },
            { i: ShieldAlert, l: 'Pending KYC', v: analytics.pendingKyc || 0, c: 'from-orange-500 to-orange-700' },
            { i: Flag, l: 'Open reports', v: analytics.openReports || 0, c: 'from-rose-500 to-rose-700' },
            { i: RotateCcw, l: 'Open refunds', v: analytics.openRefunds || 0, c: 'from-fuchsia-500 to-fuchsia-700' },
            { i: WalletIcon, l: 'Total payments', v: analytics.payments || 0, c: 'from-indigo-500 to-indigo-700' },
          ].map(s => (
            <div key={s.l} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${s.c} text-white`}><s.i className="h-5 w-5" /></div>
              <p className="font-heading text-2xl font-bold">{s.v}</p>
              <p className="mt-1 text-xs text-white/60">{s.l}</p>
            </div>
          ))}
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="rounded-full bg-white/10 backdrop-blur">
            <TabsTrigger value="refunds" className="rounded-full data-[state=active]:bg-teal-500 data-[state=active]:text-white" data-testid="admin-tab-refunds">Refunds ({refunds.filter(r => ['pending','under_admin_review'].includes(r.status)).length})</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-full data-[state=active]:bg-teal-500 data-[state=active]:text-white" data-testid="admin-tab-reports">Reports ({reports.filter(r => r.status === 'pending').length})</TabsTrigger>
            <TabsTrigger value="kyc" className="rounded-full data-[state=active]:bg-teal-500 data-[state=active]:text-white" data-testid="admin-tab-kyc">eKYC ({kycs.filter(k => k.status === 'pending').length})</TabsTrigger>
            <TabsTrigger value="users" className="rounded-full data-[state=active]:bg-teal-500 data-[state=active]:text-white" data-testid="admin-tab-users">Users ({users.filter(u => u.role !== 'admin').length})</TabsTrigger>
            <TabsTrigger value="listings" className="rounded-full data-[state=active]:bg-teal-500 data-[state=active]:text-white" data-testid="admin-tab-listings">Listings ({listings.length})</TabsTrigger>
          </TabsList>

          {/* REFUNDS */}
          <TabsContent value="refunds" className="mt-4 space-y-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
              <Filter className="h-4 w-4 text-white/60" />
              <Select value={refundFilter} onValueChange={setRefundFilter}>
                <SelectTrigger className="h-9 w-56 rounded-full border-white/20 bg-white/5 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_admin_review">Under admin review</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filteredRefunds.length === 0 ? <div className="rounded-2xl bg-white/5 p-10 text-center text-white/60">No refunds.</div> :
              filteredRefunds.map(r => (
                <button key={r.id} onClick={() => setRefundDetail({ ...r, _draft: '' })} data-testid={`admin-refund-${r.id}`} className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10">
                  {r.image && <img src={r.image} alt="" className="h-16 w-16 rounded-xl object-cover" />}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-heading font-semibold">{r.title}</p>
                    <p className="text-xs text-white/60">${r.amount} · {r.buyerName} ↔ {r.sellerName}</p>
                    <p className="line-clamp-1 mt-1 text-xs text-white/70">{r.reason}</p>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold capitalize ${r.status === 'refunded' ? 'bg-emerald-500/20 text-emerald-300' : r.status === 'under_admin_review' ? 'bg-amber-500/20 text-amber-300 animate-pulse' : r.status === 'rejected' || r.status === 'closed' ? 'bg-rose-500/20 text-rose-300' : 'bg-white/10 text-white/70'}`}>{r.status.replace(/_/g, ' ')}</span>
                    <p className="mt-1 text-[10px] text-white/50">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </button>
              ))}
          </TabsContent>

          {/* REPORTS */}
          <TabsContent value="reports" className="mt-4 space-y-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
              <Filter className="h-4 w-4 text-white/60" />
              <Select value={reportFilter} onValueChange={setReportFilter}>
                <SelectTrigger className="h-9 w-56 rounded-full border-white/20 bg-white/5 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filteredReports.length === 0 ? <div className="rounded-2xl bg-white/5 p-10 text-center text-white/60">No reports.</div> :
              filteredReports.map(r => (
                <div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start gap-4">
                    <Flag className="mt-1 h-5 w-5 text-rose-300" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-heading font-semibold">{r.reporterName} → {r.targetName}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${r.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300' : r.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : r.status === 'dismissed' ? 'bg-white/10 text-white/60' : 'bg-sky-500/20 text-sky-300'}`}>{r.status}</span>
                      </div>
                      {r.listingTitle && (
                        <div className="mt-2 flex items-center gap-2 rounded-xl bg-white/5 p-2">
                          {r.listingImage && <img src={r.listingImage} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                          <p className="text-xs text-white/70">Listing: {r.listingTitle}</p>
                        </div>
                      )}
                      <p className="mt-3 text-sm">{r.reason}</p>
                      {r.adminNotes && <p className="mt-2 rounded-lg bg-teal-500/10 p-2 text-xs text-teal-200"><strong>Admin notes:</strong> {r.adminNotes}</p>}
                      <p className="mt-2 text-[10px] text-white/40">{new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {r.status !== 'resolved' && r.status !== 'dismissed' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button data-testid={`resolve-${r.id}`} size="sm" onClick={() => setReportNote({ open: true, report: r, notes: '', action: 'resolve' })} className="rounded-full bg-emerald-500 hover:bg-emerald-600">Resolve</Button>
                      <Button data-testid={`review-${r.id}`} size="sm" variant="outline" onClick={() => setReportNote({ open: true, report: r, notes: '', action: 'review' })} className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10">Mark reviewed</Button>
                      <Button data-testid={`dismiss-${r.id}`} size="sm" variant="outline" onClick={() => setReportNote({ open: true, report: r, notes: '', action: 'dismiss' })} className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10">Dismiss</Button>
                      {r.targetType === 'user' && <Button data-testid={`suspend-${r.targetId}`} size="sm" variant="outline" onClick={() => setSuspend({ open: true, user: { id: r.targetId, name: r.targetName }, notes: '' })} className="rounded-full border-rose-400/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20">Suspend user</Button>}
                      {r.listingId && <Button data-testid={`remove-listing-${r.listingId}`} size="sm" variant="outline" onClick={() => removeListing(r.listingId)} className="rounded-full border-rose-400/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"><Trash2 className="mr-1 h-3 w-3" />Remove listing</Button>}
                    </div>
                  )}
                </div>
              ))}
          </TabsContent>

          {/* KYC */}
          <TabsContent value="kyc" className="mt-4 space-y-3">
            {kycs.length === 0 ? <div className="rounded-2xl bg-white/5 p-10 text-center text-white/60">No eKYC submissions.</div> :
              kycs.map(k => (
                <div key={k.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-heading font-semibold">{k.userName} <span className="text-xs text-white/50">· {k.userEmail}</span></p>
                      <p className="text-xs text-white/60">Document: {k.docType}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${k.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : k.status === 'rejected' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>{k.status}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {k.idDoc && <img src={k.idDoc} alt="" className="aspect-video w-full rounded-xl object-cover" />}
                    {k.selfie && <img src={k.selfie} alt="" className="aspect-video w-full rounded-xl object-cover" />}
                  </div>
                  {k.status === 'pending' && (
                    <div className="mt-4 flex gap-2">
                      <Button data-testid={`approve-${k.id}`} onClick={() => reviewKyc(k.id, 'approve')} className="rounded-full bg-emerald-500 hover:bg-emerald-600"><Check className="mr-1 h-4 w-4" />Approve</Button>
                      <Button data-testid={`reject-${k.id}`} variant="outline" onClick={() => reviewKyc(k.id, 'reject')} className="rounded-full border-rose-400/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"><X className="mr-1 h-4 w-4" />Reject</Button>
                    </div>
                  )}
                </div>
              ))}
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users" className="mt-4 space-y-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
              <Search className="h-4 w-4 text-white/60" />
              <Input data-testid="user-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…" className="h-9 border-white/20 bg-transparent text-white placeholder:text-white/40" />
            </div>
            {filteredUsers.filter(u => u.role !== 'admin').map(u => (
              <div key={u.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <Avatar className="h-12 w-12"><AvatarImage src={u.avatar} /><AvatarFallback className="bg-white/10 text-white">{u.name?.[0]}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-heading font-semibold">{u.name}</p>
                    {u.kycStatus === 'approved' && <BadgeCheck className="h-4 w-4 text-teal-300" />}
                    {u.suspended && <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">SUSPENDED</span>}
                  </div>
                  <p className="text-xs text-white/60">{u.email} · {u.role} · Trust {u.trustScore ?? '—'}/100</p>
                </div>
                {u.suspended ? (
                  <Button data-testid={`unsuspend-${u.id}`} size="sm" onClick={() => unsuspend(u.id)} className="rounded-full bg-emerald-500 hover:bg-emerald-600">Restore</Button>
                ) : (
                  <Button data-testid={`susp-${u.id}`} size="sm" variant="outline" onClick={() => setSuspend({ open: true, user: u, notes: '' })} className="rounded-full border-rose-400/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20">Suspend</Button>
                )}
              </div>
            ))}
          </TabsContent>

          {/* LISTINGS */}
          <TabsContent value="listings" className="mt-4 space-y-3">
            {listings.map(l => (
              <div key={l.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <img src={l.images?.[0]} alt="" className="h-16 w-16 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-heading font-semibold">{l.title}</p>
                  <p className="text-xs text-white/60">{l.seller?.name} · ${l.price} · <span className="capitalize">{l.status}</span></p>
                </div>
                <Button data-testid={`remove-${l.id}`} variant="outline" onClick={() => removeListing(l.id)} className="rounded-full border-rose-400/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20" size="sm"><Trash2 className="mr-1 h-3 w-3" />Remove</Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Refund Detail Dialog */}
      <Dialog open={!!refundDetail} onOpenChange={(v) => !v && setRefundDetail(null)}>
        <DialogContent className="max-w-3xl">
          {refundDetail && (
            <>
              <DialogHeader><DialogTitle>Refund dispute — ${refundDetail.amount}</DialogTitle></DialogHeader>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="rounded-2xl border p-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Item</p>
                    <p className="mt-1 font-semibold">{refundDetail.title}</p>
                    <p className="text-xs text-muted-foreground">{refundDetail.buyerName} bought from {refundDetail.sellerName}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Buyer's reason</p>
                    <p className="mt-1 text-sm">{refundDetail.reason}</p>
                  </div>
                  {refundDetail.escalationReason && (
                    <div className="rounded-2xl bg-amber-50 p-3 dark:bg-amber-500/10">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Escalation</p>
                      <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">{refundDetail.escalationReason}</p>
                    </div>
                  )}
                  {refundDetail.evidence?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Evidence</p>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {refundDetail.evidence.map(e => <img key={e.id} src={e.image} alt="" className="aspect-square rounded-lg object-cover" />)}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex max-h-[400px] flex-col rounded-2xl border bg-card">
                  <p className="border-b p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Discussion ({refundDetail.messages?.length || 0})</p>
                  <div className="flex-1 space-y-2 overflow-y-auto p-3">
                    {(refundDetail.messages || []).map(m => (
                      <div key={m.id} className={`rounded-xl p-2 text-sm ${m.fromRole === 'admin' ? 'bg-amber-50 border border-amber-200 dark:bg-amber-500/10' : m.fromRole === 'buyer' ? 'bg-blue-50 dark:bg-blue-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10'}`}>
                        <p className="text-[10px] font-bold uppercase tracking-wider">{m.fromName} · {m.fromRole}</p>
                        {m.image && <img src={m.image} alt="" className="my-1 max-h-32 rounded" />}
                        {m.text && <p>{m.text}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 border-t p-2">
                    <Input value={refundDetail._draft || ''} onChange={(e) => setRefundDetail({ ...refundDetail, _draft: e.target.value })} placeholder="Admin message…" className="h-9 rounded-full" data-testid="admin-refund-msg" />
                    <Button size="sm" onClick={adminMessage} data-testid="admin-refund-msg-send" className="rounded-full bg-navy hover:bg-navy-700"><MessageSquare className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex flex-wrap gap-2">
                <Button data-testid="admin-force-refund" onClick={() => refundAction('force_refund')} className="rounded-full bg-emerald-600 hover:bg-emerald-700"><Check className="mr-1 h-4 w-4" />Force refund</Button>
                <Button data-testid="admin-force-reject" onClick={() => refundAction('force_reject')} variant="outline" className="rounded-full text-rose-600"><X className="mr-1 h-4 w-4" />Force reject</Button>
                <Button data-testid="admin-resolve" onClick={() => refundAction('resolve')} variant="outline" className="rounded-full">Mark resolved</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Report note Dialog */}
      <Dialog open={reportNote.open} onOpenChange={(v) => !v && setReportNote({ ...reportNote, open: false })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add admin notes</DialogTitle></DialogHeader>
          <Label>Notes (visible to reporter)</Label>
          <Textarea data-testid="report-note" value={reportNote.notes} onChange={(e) => setReportNote({ ...reportNote, notes: e.target.value })} rows={4} className="rounded-xl" />
          <DialogFooter><Button variant="outline" onClick={() => setReportNote({ ...reportNote, open: false })}>Cancel</Button><Button data-testid="report-save" onClick={resolveReport} className="bg-navy hover:bg-navy-700 capitalize">Mark as {reportNote.action}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={suspend.open} onOpenChange={(v) => !v && setSuspend({ ...suspend, open: false })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Suspend user · {suspend.user?.name}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Suspended users cannot log in until restored.</p>
          <Label>Reason</Label>
          <Textarea data-testid="suspend-notes" value={suspend.notes} onChange={(e) => setSuspend({ ...suspend, notes: e.target.value })} rows={3} className="rounded-xl" />
          <DialogFooter><Button variant="outline" onClick={() => setSuspend({ ...suspend, open: false })}>Cancel</Button><Button data-testid="confirm-suspend" onClick={submitSuspend} className="bg-rose-600 hover:bg-rose-700">Suspend</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
