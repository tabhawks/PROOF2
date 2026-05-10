import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function PortalNews() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get('/ops/announcements').then(({data}) => setItems(data)).catch(()=>{}); }, []);
  return (
    <div data-testid="portal-news">
      <div className="eyebrow mb-3">news</div>
      <h1 className="display text-[44px] md:text-[64px] mb-10">Announcements.</h1>
      <ul className="meta-strip">
        {items.length === 0 && <li className="row"><div className="meta-mono">—</div><div className="font-serif italic">No announcements.</div></li>}
        {items.map(n => (
          <li key={n.id} className="row">
            <div className="meta-mono">{(n.published_at || '').slice(0,10)}</div>
            <div>
              <div className="font-serif italic text-[20px]">{n.title}</div>
              <p className="font-serif text-[16px] mt-2 text-[rgba(10,10,10,0.78)]">{n.body}</p>
              <div className="meta-mono mt-2 text-[10px]">audience: {n.audience}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
