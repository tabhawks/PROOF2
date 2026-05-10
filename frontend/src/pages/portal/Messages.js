import React, { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function PortalMessages() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const pollRef = useRef(null);
  const load = async () => {
    const { data } = await api.get('/ops/threads');
    setThreads(data);
    if (!active && data.length) setActive(data[0]);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!active) return;
    const fetchMsgs = () => api.get(`/ops/threads/${active.id}/messages`).then(({data}) => setMessages(data)).catch(()=>{});
    fetchMsgs();
    pollRef.current = setInterval(fetchMsgs, 5000);
    return () => clearInterval(pollRef.current);
  }, [active]);
  const send = async (e) => {
    e.preventDefault();
    if (!body.trim() || !active) return;
    await api.post(`/ops/threads/${active.id}/messages`, { body });
    setBody('');
    const { data } = await api.get(`/ops/threads/${active.id}/messages`);
    setMessages(data);
  };
  const startThread = async () => {
    const { data } = await api.post('/ops/threads', { subject: 'New conversation' });
    await load();
    setActive(data);
  };
  return (
    <div data-testid="portal-messages">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="eyebrow mb-3">messages</div>
          <h1 className="display text-[44px] md:text-[64px]">Conversations.</h1>
        </div>
        <button onClick={startThread} className="btn-line">new thread</button>
      </div>
      <div className="grid grid-cols-[280px_1fr] gap-6 border border-[var(--gold-line)]" style={{ minHeight: 520 }}>
        <div className="border-r border-[var(--gold-line)] overflow-auto">
          {threads.length === 0 && <div className="p-6 meta-mono">No threads.</div>}
          {threads.map(t => (
            <button key={t.id} onClick={() => setActive(t)} className={`block w-full text-left p-4 border-b border-[var(--gold-line)] ${active?.id === t.id ? 'bg-[rgba(200,169,106,0.08)]' : ''}`}>
              <div className="font-serif italic text-[16px]">{t.subject}</div>
              <div className="meta-mono mt-1">{t.strategist?.name || t.member?.name}</div>
              {t.unread_count > 0 && <div className="meta-mono" style={{ color: 'var(--gold)' }}>{t.unread_count} unread</div>}
            </button>
          ))}
        </div>
        <div className="flex flex-col">
          <div className="p-4 border-b border-[var(--gold-line)]">
            <div className="font-serif italic text-[18px]">{active?.subject || 'No thread'}</div>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {messages.map(m => {
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`max-w-[70%] ${mine ? 'ml-auto' : ''}`}>
                  <div className={`p-3 ${mine ? 'bg-[var(--obsidian)] text-[var(--ivory)]' : 'bg-[var(--bone)]'}`}>{m.body}</div>
                  <div className="meta-mono mt-1 text-[10px]">{(m.created_at || '').slice(11,16)}</div>
                </div>
              );
            })}
            {messages.length === 0 && active && <div className="meta-mono">No messages yet.</div>}
          </div>
          {active && (
            <form onSubmit={send} className="p-4 border-t border-[var(--gold-line)] flex gap-2">
              <input data-testid="msg-input" className="input-line flex-1" placeholder="Write a message…" value={body} onChange={e => setBody(e.target.value)} />
              <button data-testid="msg-send" className="btn-line">send</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
