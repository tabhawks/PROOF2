import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';

function fmtDateTime(s) {
  if (!s) return '';
  try { return new Date(s).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return s; }
}

export default function PortalToday() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/ops/portal/today').then(({data}) => setData(data)).catch(()=>{}); }, []);
  if (!data) return <div className="meta-mono">loading…</div>;
  return (
    <div data-testid="portal-today">
      <div className="eyebrow mb-3">today</div>
      <h1 className="display text-[44px] md:text-[64px] mb-10">Today.</h1>
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="p-6 border border-[var(--gold-line)]">
          <div className="meta-mono mb-2">next event</div>
          {data.next_event ? (
            <>
              <div className="font-serif italic text-[22px]">{data.next_event.title}</div>
              <div className="text-[13px] mt-2 text-[rgba(10,10,10,0.65)]">{fmtDateTime(data.next_event.start)}</div>
              {data.next_event.location && <div className="meta-mono mt-2">{data.next_event.location}</div>}
            </>
          ) : <div className="font-serif italic text-[18px] text-[rgba(10,10,10,0.55)]">No upcoming.</div>}
        </div>
        <div className="p-6 border border-[var(--gold-line)]">
          <div className="meta-mono mb-2">documents</div>
          <div className="display text-[56px] tabular">{data.doc_count}</div>
          <Link to="/portal/documents" className="meta-mono link-underline">view vault</Link>
        </div>
        <div className="p-6 border border-[var(--gold-line)]">
          <div className="meta-mono mb-2">unread messages</div>
          <div className="display text-[56px] tabular">{data.unread_count}</div>
          <Link to="/portal/messages" className="meta-mono link-underline">open messages</Link>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="display text-[28px]">This week.</h2>
            <Link to="/portal/calendar" className="meta-mono link-underline">all events</Link>
          </div>
          <ul className="meta-strip">
            {data.week_events.length === 0 && <li className="row"><div className="meta-mono">—</div><div className="font-serif italic">No events this week.</div></li>}
            {data.week_events.map(e => (
              <li key={e.id} className="row">
                <div className="meta-mono">{fmtDateTime(e.start)}</div>
                <div>
                  <div className="font-serif italic text-[18px]">{e.title}</div>
                  {e.location && <div className="meta-mono text-[10px]">{e.location}</div>}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="display text-[28px]">News.</h2>
            <Link to="/portal/news" className="meta-mono link-underline">all announcements</Link>
          </div>
          <ul className="meta-strip">
            {data.news.length === 0 && <li className="row"><div className="meta-mono">—</div><div className="font-serif italic">No announcements.</div></li>}
            {data.news.map(n => (
              <li key={n.id} className="row">
                <div className="meta-mono">{(n.published_at || '').slice(0,10)}</div>
                <div>
                  <div className="font-serif italic text-[18px]">{n.title}</div>
                  <p className="text-[13px] text-[rgba(10,10,10,0.65)] mt-1">{n.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
