import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Paperclip, Smile, MoreVertical, ShieldCheck, BadgeCheck, Image as ImageIcon, Tag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { CONVERSATIONS, getProductById } from '../lib/mockData';

export default function Chat() {
  const { id } = useParams();
  const [convs, setConvs] = useState(CONVERSATIONS);
  const [activeId, setActiveId] = useState(id || CONVERSATIONS[0].id);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const active = convs.find(c => c.id === activeId);
  const product = active ? getProductById(active.productId) : null;
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }); }, [active?.messages.length, activeId]);

  const send = () => {
    if (!text.trim()) return;
    const newMsg = { id: `m${Date.now()}`, from: 'me', text: text.trim(), time: 'now' };
    setConvs(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, newMsg], lastMessage: newMsg.text, time: 'now' } : c));
    setText('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setConvs(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, { id: `m${Date.now()+1}`, from: 'them', text: 'Got it! Let me check and reply shortly.', time: 'now' }] } : c));
    }, 1400);
  };

  return (
    <div className="grid h-[calc(100vh-200px)] gap-0 overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-[320px_1fr]">
      {/* List */}
      <aside className="flex flex-col border-r border-border">
        <div className="border-b border-border p-4">
          <h2 className="font-heading text-xl font-bold">Messages</h2>
          <p className="text-xs text-muted-foreground">{convs.length} active conversations</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {convs.map(c => (
            <button key={c.id} data-testid={`conv-${c.id}`} onClick={() => setActiveId(c.id)} className={`flex w-full items-center gap-3 border-b border-border/60 p-4 text-left transition-colors hover:bg-muted/50 ${activeId === c.id ? 'bg-muted/60' : ''}`}>
              <div className="relative">
                <Avatar className="h-11 w-11"><AvatarImage src={c.avatar} /><AvatarFallback>{c.name[0]}</AvatarFallback></Avatar>
                {c.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate font-semibold">{c.name}</p>
                  <span className="text-[10px] text-muted-foreground">{c.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="truncate text-xs text-muted-foreground">{c.lastMessage}</p>
                  {c.unread > 0 && <span className="ml-2 grid h-5 min-w-5 place-items-center rounded-full bg-teal-500 px-1.5 text-[10px] font-bold text-white">{c.unread}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Window */}
      {active ? (
        <section className="flex min-w-0 flex-col">
          <div className="flex items-center gap-3 border-b border-border p-4">
            <Avatar className="h-10 w-10"><AvatarImage src={active.avatar} /><AvatarFallback>{active.name[0]}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">{active.name}</p>
                <BadgeCheck className="h-4 w-4 text-teal-600" />
              </div>
              <p className="text-xs text-muted-foreground">{active.online ? 'Online · typing rarely' : 'Last seen 2h ago'}</p>
            </div>
            <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
          </div>

          {product && (
            <div className="flex items-center gap-3 border-b border-border bg-muted/30 p-3">
              <img src={product.images[0]} alt="" className="h-12 w-12 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-semibold">{product.title}</p>
                <p className="text-xs text-muted-foreground">${product.price} · AI fair ${product.aiFair}</p>
              </div>
              <Button size="sm" className="rounded-full bg-teal-500 hover:bg-teal-600" data-testid="chat-offer-btn"><Tag className="mr-1 h-3 w-3" />Offer</Button>
            </div>
          )}

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            <div className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-3 text-center text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-300">
              <ShieldCheck className="mx-auto mb-1 h-4 w-4" />
              Stay safe — always meet in verified pickup zones and use G2G Escrow for payments.
            </div>
            {active.messages.map(m => (
              <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.from === 'me' ? 'bg-navy text-white rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
                  <p>{m.text}</p>
                  <p className={`mt-1 text-[10px] ${m.from === 'me' ? 'text-white/60' : 'text-muted-foreground'}`}>{m.time} {m.from === 'me' && '· Seen'}</p>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0.15s' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon"><Paperclip className="h-5 w-5" /></Button>
              <Button variant="ghost" size="icon"><ImageIcon className="h-5 w-5" /></Button>
              <Input data-testid="chat-input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="Type a message…" className="h-11 flex-1 rounded-full bg-muted/40" />
              <Button variant="ghost" size="icon"><Smile className="h-5 w-5" /></Button>
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
