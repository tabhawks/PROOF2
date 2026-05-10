import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminAnnouncements() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', audience: 'members', athlete_id: '' });
  const [athletes, setAthletes] = useState([]);
  const load = () => api.get('/ops/announcements').then(({data}) => setItems(data));
  useEffect(() => { load(); api.get('/ops/athletes').then(({data}) => setAthletes(data)); }, []);
  const create = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (payload.audience !== 'athlete') delete payload.athlete_id;
    await api.post('/ops/announcements', payload);
    setOpen(false); setForm({ title: '', body: '', audience: 'members', athlete_id: '' }); load();
  };
  const remove = async (a) => { if (!window.confirm('Delete?')) return; await api.delete(`/ops/announcements/${a.id}`); load(); };
  return (
    <div data-testid="admin-announcements">
      <div className="flex justify-between items-center mb-8">
        <div><div className="eyebrow mb-3">content</div><h1 className="display text-[44px]">Announcements.</h1></div>
        <button onClick={() => setOpen(true)} className="btn-line">new announcement</button>
      </div>
      <ul className="meta-strip">
        {items.map(a => (
          <li key={a.id} className="row">
            <div className="meta-mono">{(a.published_at || '').slice(0,10)}</div>
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="font-serif italic text-[20px]">{a.title}</div>
                <p className="text-[14px] mt-1 text-[rgba(10,10,10,0.7)]">{a.body}</p>
                <div className="meta-mono mt-2 text-[10px]">audience: {a.audience}</div>
              </div>
              <button onClick={() => remove(a)} className="meta-mono" style={{ color: 'red' }}>delete</button>
            </div>
          </li>
        ))}
      </ul>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(10,10,10,0.6)' }} onClick={() => setOpen(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={create} className="w-full max-w-[480px] p-8" style={{ background: 'var(--ivory)' }}>
            <h2 className="display text-[28px] mb-4">New announcement</h2>
            <div className="mb-4"><label className="meta-mono">title</label><input required className="input-line mt-1" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="mb-4"><label className="meta-mono">body</label><textarea required rows={4} className="w-full input-line resize-none" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} /></div>
            <div className="mb-4"><label className="meta-mono">audience</label><select className="input-line mt-1" value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })}><option>all</option><option>members</option><option>athlete</option></select></div>
            {form.audience === 'athlete' && <div className="mb-4"><label className="meta-mono">athlete</label><select className="input-line mt-1" value={form.athlete_id} onChange={e => setForm({ ...form, athlete_id: e.target.value })}><option value="">— select —</option>{athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>}
            <div className="flex gap-3"><button type="button" onClick={() => setOpen(false)} className="btn-line">cancel</button><button className="btn-line gold">publish</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
