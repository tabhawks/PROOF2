import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminOutbox() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get('/billing/outbox').then(({data}) => setItems(data)).catch(()=>{}); }, []);
  return (
    <div data-testid="admin-outbox">
      <div className="eyebrow mb-3">operations</div>
      <h1 className="display text-[44px] mb-3">Email outbox.</h1>
      <p className="font-serif text-[16px] text-[rgba(10,10,10,0.7)] mb-10 max-w-[640px]">No real emails are sent in this build. Every invitation and notification is queued here so you can review the message and copy the private link to share.</p>
      <ul className="meta-strip">
        {items.length === 0 && <li className="row"><div className="meta-mono">—</div><div className="font-serif italic">Outbox is empty.</div></li>}
        {items.map(e => (
          <li key={e.id} className="row">
            <div className="meta-mono">{(e.created_at || '').slice(0,16).replace('T',' ')}</div>
            <div>
              <div className="font-serif italic text-[18px]">{e.subject}</div>
              <div className="meta-mono mt-1">to: {e.to_email} · sent by: {e.sent_by || '—'}</div>
              <pre className="text-[12px] font-mono mt-2 p-3 bg-[var(--bone)] whitespace-pre-wrap">{e.body}</pre>
              {e.cta_url && <div className="meta-mono mt-2">link: <code className="text-[12px]">{window.location.origin}{e.cta_url}</code></div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
