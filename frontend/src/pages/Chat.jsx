import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Send, Paperclip, Smile, MoreVertical, ShieldCheck, BadgeCheck, Image as ImageIcon, Tag, ExternalLink, Store } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { api, onChatEvent, sendChatEvent } from '../lib/api';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

function fileToDataUrl(file) {
  return new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(file); });
}

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState(id || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const typingTimerRef = useRef(null);

  const loadChats = async () => {
    try { const r = await api.get('/chats'); setChats(r.data); if (!activeId && r.data[0]) setActiveId(r.data[0].id); }
    catch (e) { toast.error(e.message); }
  };
  useEffect(() => { loadChats(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    if (!activeId) return;
    api.get(`/chats/${activeId}/messages`).then(r => setMessages(r.data)).catch(e => toast.error(e.message));
    setChats(prev => prev.map(c => c.id === activeId ? { ...c, unread: 0 } : c));
  }, [activeId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }); }, [messages.length, activeId]);

  // WS listener
  useEffect(() => {
    const off = onChatEvent((ev) => {
      if (ev.type === 'message') {
        if (ev.message.chatId === activeId) setMessages(m => [...m, ev.message]);
        loadChats();
      } else if (ev.type === 'typing' && ev.chatId === activeId) {
        setTyping(true);
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setTyping(false), 2200);
      }
    });
    return off;
  }, [activeId]);

  const active = chats.find(c => c.id === activeId);

  const send = async () => {
    if (!text.trim() || !activeId) return;
    const t = text.trim();
    setText('');
    try {
      const { data } = await api.post('/messages', { chatId: activeId, text: t });
      setMessages(m => [...m, data]);
    } catch (e) { toast.error(e.message); }
  };

  const sendImage = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const dataUrl = await fileToDataUrl(f);
    try {
      const { data } = await api.post('/messages', { chatId: activeId, text: '', image: dataUrl });
      setMessages(m => [...m, data]);
    } catch (err) { toast.error(err.message); }
    e.target.value = '';
  };

  const onTyping = (e) => {
    setText(e.target.value);
    if (active?.other?.id) sendChatEvent({ type: 'typing', toUserId: active.other.id, chatId: activeId });
  };

  if (chats.length === 0) {
    return (
      <div className="bento-card mx-auto max-w-xl p-12 text-center">
        <p className="font-heading text-2xl font-bold">No conversations yet</p>
        <p className="mt-2 text-muted-foreground">Start a chat by visiting a listing and tapping "Chat seller".</p>
        <Link to="/buy"><Button className="mt-6 rounded-full bg-navy hover:bg-navy-700">Browse marketplace</Button></Link>
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-200px)] gap-0 overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-[320px_1fr]">
      <aside className="flex flex-col border-r border-border">
        <div className="border-b border-border p-4">
          <h2 className="font-heading text-xl font-bold">Messages</h2>
          <p className="text-xs text-muted-foreground">{chats.length} active conversations</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map(c => (
            <button key={c.id} data-testid={`conv-${c.id}`} onClick={() => setActiveId(c.id)} className={`flex w-full items-center gap-3 border-b border-border/60 p-4 text-left transition-colors hover:bg-muted/50 ${activeId === c.id ? 'bg-muted/60' : ''}`}>
              <div className="relative">
                <Avatar className="h-11 w-11"><AvatarImage src={c.other?.avatar} /><AvatarFallback>{c.other?.name?.[0] || '?'}</AvatarFallback></Avatar>
                {c.other?.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate font-semibold">{c.other?.name}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="truncate text-xs text-muted-foreground">{c.lastMessage?.text || c.lastMessage?.image ? '[image]' : 'Say hi…'}</p>
                  {c.unread > 0 && <span className="ml-2 grid h-5 min-w-5 place-items-center rounded-full bg-teal-500 px-1.5 text-[10px] font-bold text-white">{c.unread}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {active ? (
        <section className="flex min-w-0 flex-col">
          <div className="flex items-center gap-3 border-b border-border p-4">
            <Avatar className="h-10 w-10"><AvatarImage src={active.other?.avatar} /><AvatarFallback>{active.other?.name?.[0]}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-heading font-semibold">{active.other?.name}</p>
                {active.other?.role === 'dealer' && <span className="inline-flex items-center gap-1 rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold text-white"><Store className="h-3 w-3" />Dealer</span>}
                <BadgeCheck className="h-4 w-4 text-teal-600" />
              </div>
              <p className="text-xs text-muted-foreground">{active.other?.online ? 'Online' : 'Offline'}</p>
            </div>
            <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
          </div>

          {active.product && (
            <button onClick={() => navigate(`/buy/${active.product.id}`)} className="flex items-center gap-3 border-b border-border bg-muted/30 p-3 text-left transition-colors hover:bg-muted/60" data-testid="chat-view-product">
              <img src={active.product.images?.[0]} alt="" className="h-12 w-12 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-semibold">{active.product.title}</p>
                <p className="text-xs text-muted-foreground">${active.product.price} · AI fair ${active.product.aiFair}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </button>
          )}

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            <div className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-3 text-center text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-300">
              <ShieldCheck className="mx-auto mb-1 h-4 w-4" />
              Stay safe — always pay via G2G Escrow and meet at verified pickup zones.
            </div>
            {messages.map(m => {
              const mine = m.fromId === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${mine ? 'bg-navy text-white rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
                    {m.image && <img src={m.image} alt="" className="mb-2 max-h-60 rounded-xl" />}
                    {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                    <p className={`mt-1 text-[10px] ${mine ? 'text-white/60' : 'text-muted-foreground'}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{mine && (m.seen ? ' · Seen' : ' · Sent')}</p>
                  </div>
                </div>
              );
            })}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-4 py-3"><div className="flex gap-1"><span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" /><span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0.15s' }} /><span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0.3s' }} /></div></div>
              </div>
            )}
          </div>

          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={sendImage} />
              <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()}><ImageIcon className="h-5 w-5" /></Button>
              <Input data-testid="chat-input" value={text} onChange={onTyping} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="Type a message…" className="h-11 flex-1 rounded-full bg-muted/40" />
              <Button data-testid="chat-send" onClick={send} className="h-11 rounded-full bg-navy hover:bg-navy-700"><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </section>
      ) : (
        <div className="grid place-items-center p-10 text-center text-muted-foreground">Select a conversation</div>
      )}
    </div>
  );
}
