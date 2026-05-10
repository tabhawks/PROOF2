import React, { useEffect, useRef, useState } from 'react';
import { api, getToken } from '@/lib/api';
import { useAuth } from '@/lib/auth';

function SignaturePad({ value, onChange }) {
  const ref = useRef(null);
  const [drawing, setDrawing] = useState(false);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#F5F1EA'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#0A0A0A'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  }, []);
  const pos = (e) => {
    const c = ref.current; const r = c.getBoundingClientRect();
    const t = e.touches?.[0];
    return { x: ((t?.clientX ?? e.clientX) - r.left) * (c.width / r.width), y: ((t?.clientY ?? e.clientY) - r.top) * (c.height / r.height) };
  };
  const start = (e) => { setDrawing(true); const ctx = ref.current.getContext('2d'); const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const move = (e) => { if (!drawing) return; e.preventDefault(); const ctx = ref.current.getContext('2d'); const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
  const end = () => { if (drawing) { setDrawing(false); onChange(ref.current.toDataURL('image/png')); } };
  const clear = () => { const c = ref.current; const ctx = c.getContext('2d'); ctx.fillStyle = '#F5F1EA'; ctx.fillRect(0,0,c.width,c.height); onChange(''); };
  return (
    <div>
      <canvas ref={ref} width={520} height={160} className="w-full border border-[var(--gold-line)] cursor-crosshair touch-none" onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
      <div className="flex justify-end mt-2"><button type="button" onClick={clear} className="meta-mono link-underline">clear</button></div>
    </div>
  );
}

export default function PortalCovenants() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);
  const [typed, setTyped] = useState('');
  const [canvas, setCanvas] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const load = () => api.get('/billing/covenants').then(({data}) => setItems(data));
  useEffect(() => { load(); }, []);
  const sign = async (e) => {
    e.preventDefault(); if (!active) return;
    if (!typed.trim() || !canvas) { setErr('typed name and signature are required'); return; }
    setBusy(true); setErr('');
    try { await api.post(`/billing/covenants/${active.id}/sign`, { typed_name: typed, canvas_data_url: canvas }); setActive(null); setTyped(''); setCanvas(''); load(); }
    catch (e2) { setErr(e2?.response?.data?.detail || 'failed'); }
    finally { setBusy(false); }
  };
  const downloadPdf = (c) => {
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/billing/covenants/${c.id}/pdf`;
    fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.blob()).then(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `covenant-${c.id.slice(0,8)}.pdf`; a.click(); });
  };
  return (
    <div data-testid="portal-covenants">
      <div className="eyebrow mb-3">covenants</div>
      <h1 className="display text-[44px] md:text-[64px] mb-10">Engagements.</h1>
      <ul className="meta-strip mb-10">
        {items.length === 0 && <li className="row"><div className="meta-mono">—</div><div className="font-serif italic">No covenants on file.</div></li>}
        {items.map(c => (
          <li key={c.id} className="row">
            <div className="meta-mono">{(c.sent_at || '').slice(0,10) || '—'}</div>
            <div className="flex justify-between items-center gap-4">
              <div>
                <div className="font-serif italic text-[20px]">{c.title}</div>
                <div className="meta-mono mt-1" style={{ color: c.status === 'signed' ? 'var(--gold)' : undefined }}>• {c.status}</div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => downloadPdf(c)} className="btn-line">pdf</button>
                {c.status === 'sent' && <button onClick={() => setActive(c)} data-testid={`sign-${c.id}`} className="btn-line gold">review &amp; sign</button>}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {active && (
        <div className="fixed inset-0 z-50 overflow-auto" style={{ background: 'rgba(10,10,10,0.85)' }} onClick={() => setActive(null)}>
          <div onClick={e => e.stopPropagation()} className="max-w-[760px] mx-auto my-12 p-10" style={{ background: 'var(--ivory)' }}>
            <div className="flex justify-between items-baseline mb-6">
              <div><div className="eyebrow mb-2">covenant</div><h2 className="display text-[36px]">{active.title}</h2></div>
              <button onClick={() => setActive(null)} className="meta-mono">close</button>
            </div>
            <pre className="font-serif text-[15px] whitespace-pre-wrap leading-[1.7] p-6 bg-[var(--bone)] mb-8">{active.body}</pre>
            <form onSubmit={sign}>
              <div className="mb-5"><label className="meta-mono">type your full name</label><input data-testid="sign-typed" required className="input-line mt-2" value={typed} onChange={e => setTyped(e.target.value)} /></div>
              <div className="mb-5"><label className="meta-mono">draw your signature</label><div className="mt-2" data-testid="sign-canvas"><SignaturePad value={canvas} onChange={setCanvas} /></div></div>
              {err && <div className="text-red-700 text-[13px] mb-4">{err}</div>}
              <div className="meta-mono mb-4 text-[10px]">By signing, you affirm that the typed name and drawn signature constitute your legal mark for this covenant. Your IP, user-agent, and timestamp will be recorded with the signature in the audit log.</div>
              <div className="flex gap-3"><button type="button" onClick={() => setActive(null)} className="btn-line">cancel</button><button data-testid="sign-submit" disabled={busy} className="btn-line gold">{busy ? 'signing…' : 'sign covenant'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
