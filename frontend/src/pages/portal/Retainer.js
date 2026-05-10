import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function PortalRetainer() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get('/billing/retainers').then(({data}) => setItems(data)).catch(()=>{}); }, []);
  return (
    <div data-testid="portal-retainer">
      <div className="eyebrow mb-3">membership</div>
      <h1 className="display text-[44px] md:text-[64px] mb-10">Retainer.</h1>
      {items.length === 0 ? (
        <div className="font-serif italic text-[20px] text-[rgba(10,10,10,0.6)]">No active retainer assigned.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {items.map(r => (
            <div key={r.id} className="p-8 border border-[var(--gold-line)]">
              <div className="meta-mono mb-3">{r.athlete?.name}</div>
              <div className="display text-[40px]">{r.plan?.name}</div>
              <div className="meta-mono mt-1">{r.plan?.tagline}</div>
              <div className="display text-[44px] tabular mt-6">${(r.plan?.monthly_amount_usd || 0).toLocaleString()}<span className="meta-mono ml-2">/mo</span></div>
              <div className="meta-mono mt-2" style={{ color: r.status === 'active' ? 'var(--gold)' : undefined }}>• {r.status} · since {(r.started_at || '').slice(0,10)}</div>
              <ul className="mt-6 space-y-1">
                {(r.plan?.features || []).map((f, i) => <li key={i} className="text-[14px] text-[rgba(10,10,10,0.78)]">— {f}</li>)}
              </ul>
              {r.plan?.payment_link_url && (
                <a href={r.plan.payment_link_url} target="_blank" rel="noreferrer" className="btn-line gold mt-6 inline-flex">manage billing</a>
              )}
              {r.note && <div className="meta-mono mt-6 text-[10px]">note: {r.note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
