import React, { useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';

function fmtDateTime(s) { try { return new Date(s).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return s; } }

export default function PortalCalendar() {
  const [events, setEvents] = useState([]);
  useEffect(() => { api.get('/ops/events').then(({data}) => setEvents(data)).catch(()=>{}); }, []);
  const exportIcs = () => {
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/ops/events.ics`;
    fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.blob()).then(b => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = 'proof-calendar.ics';
        a.click();
      });
  };
  return (
    <div data-testid="portal-calendar">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="eyebrow mb-3">calendar</div>
          <h1 className="display text-[44px] md:text-[64px]">Schedule.</h1>
        </div>
        <button data-testid="ics-export" onClick={exportIcs} className="btn-line">export .ics</button>
      </div>
      <ul className="meta-strip">
        {events.length === 0 && <li className="row"><div className="meta-mono">—</div><div className="font-serif italic">No events.</div></li>}
        {events.map(e => (
          <li key={e.id} className="row">
            <div className="meta-mono">{fmtDateTime(e.start)}</div>
            <div>
              <div className="font-serif italic text-[20px]">{e.title}</div>
              {e.location && <div className="meta-mono mt-1">{e.location}</div>}
              {e.description && <p className="text-[14px] mt-2 text-[rgba(10,10,10,0.7)]">{e.description}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
