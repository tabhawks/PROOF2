import React, { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminDocuments() {
  const [items, setItems] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', athlete_id: '', visibility: 'member' });
  const fileRef = useRef(null);
  const load = () => api.get('/ops/documents').then(({data}) => setItems(data));
  useEffect(() => { load(); api.get('/ops/athletes').then(({data}) => setAthletes(data)); }, []);
  const upload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !form.title) return;
    const fd = new FormData(); fd.append('file', file); fd.append('title', form.title); fd.append('athlete_id', form.athlete_id || ''); fd.append('visibility', form.visibility);
    await api.post('/ops/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setOpen(false); setForm({ title: '', athlete_id: '', visibility: 'member' }); load();
  };
  const remove = async (d) => { if (!window.confirm(`Delete ${d.title}?`)) return; await api.delete(`/ops/documents/${d.id}`); load(); };
  return (
    <div data-testid="admin-documents">
      <div className="flex justify-between items-center mb-8">
        <div><div className="eyebrow mb-3">operations</div><h1 className="display text-[44px]">Documents.</h1></div>
        <button onClick={() => setOpen(true)} className="btn-line">upload document</button>
      </div>
      <table className="w-full text-[14px]">
        <thead><tr className="meta-mono" style={{ borderBottom: '1px solid var(--gold-line)' }}><th className="text-left py-3">title</th><th className="text-left">athlete</th><th className="text-left">visibility</th><th className="text-left">size</th><th></th></tr></thead>
        <tbody>
          {items.map(d => {
            const ath = athletes.find(a => a.id === d.athlete_id);
            return (
              <tr key={d.id} style={{ borderBottom: '1px solid var(--gold-line)' }}>
                <td className="py-3 font-serif italic text-[18px]">{d.title}</td>
                <td>{ath?.name || '—'}</td>
                <td className="meta-mono">{d.visibility}</td>
                <td className="tabular">{Math.round((d.size || 0)/1024)} KB</td>
                <td className="text-right"><button onClick={() => remove(d)} className="meta-mono" style={{ color: 'red' }}>delete</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(10,10,10,0.6)' }} onClick={() => setOpen(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={upload} className="w-full max-w-[480px] p-8" style={{ background: 'var(--ivory)' }}>
            <h2 className="display text-[28px] mb-4">Upload document</h2>
            <div className="mb-4"><label className="meta-mono">title</label><input required className="input-line mt-1" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="mb-4"><label className="meta-mono">athlete</label><select className="input-line mt-1" value={form.athlete_id} onChange={e => setForm({ ...form, athlete_id: e.target.value })}><option value="">— none —</option>{athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
            <div className="mb-4"><label className="meta-mono">visibility</label><select className="input-line mt-1" value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })}>{['public','member','owner','staff'].map(v => <option key={v}>{v}</option>)}</select></div>
            <div className="mb-6"><label className="meta-mono">file</label><input ref={fileRef} type="file" required className="input-line mt-1" /></div>
            <div className="flex gap-3"><button type="button" onClick={() => setOpen(false)} className="btn-line">cancel</button><button className="btn-line gold">upload</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
