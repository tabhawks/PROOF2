import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminCalendar() {
  const [items, setItems] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', start: '', end: '', athlete_id: '', location: '', description: '', visibility: 'member' });
  const load = () => api.get('/ops/events').then(({data}) => setItems(data));
  useEffect(() => { load(); api.get('/ops/athletes').then(({data}) => setAthletes(data)); }, []);
  const create = async (e) => {
    e.preventDefault();
    const payload = { ...form, start: new Date(form.start).toISOString(), end: form.end ? new Date(form.end).toISOString() : null };
    await api.post('/ops/events', payload);
    setOpen(false); setForm({ title: '', start: '', end: '', athlete_id: '', location: '', description: '', visibility: 'member' }); load();
  };
  const remove = async (e) => { if (!window.confirm(`Delete ${e.title}?`)) return; await api.delete(`/ops/events/${e.id}`); load(); };
  return (
    <div data-testid="admin-calendar">
      <div className="flex justify-between items-center mb-8">
        <div><div className="eyebrow mb-3">operations</div><h1 className="display text-[44px]">Calendar.</h1></div>
        <button onClick={() => setOpen(true)} className="btn-line">new event</button>
      </div>
      <ul className="meta-strip">
        {items.map(e => {
          const ath = athletes.find(a => a.id === e.athlete_id);
          return (
            <li key={e.id} className="row">
              <div className="meta-mono">{(e.start || '').slice(0,16).replace('T', ' ')}</div>
              <div className="flex justify-between items-center gap-4">
                <div>
                  <div className="font-serif italic text-[18px]">{e.title}</div>
                  <div className="meta-mono mt-1">{ath?.name || 'all members'} · {e.location || '—'}</div>
                </div>
                <button onClick={() => remove(e)} className="meta-mono" style={{ color: 'red' }}>delete</button>
              </div>
            </li>
          );
        })}
      </ul>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(10,10,10,0.6)' }} onClick={() => setOpen(false)}>
          <form onClick={ev => ev.stopPropagation()} onSubmit={create} className="w-full max-w-[480px] p-8" style={{ background: 'var(--ivory)' }}>
            <h2 className="display text-[28px] mb-4">New event</h2>
            <div className="mb-3"><label className="meta-mono">title</label><input required className="input-line mt-1" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="meta-mono">start</label><input required type="datetime-local" className="input-line mt-1" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} /></div>
              <div><label className="meta-mono">end</label><input type="datetime-local" className="input-line mt-1" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} /></div>
            </div>
            <div className="mb-3 mt-3"><label className="meta-mono">athlete</label><select className="input-line mt-1" value={form.athlete_id} onChange={e => setForm({ ...form, athlete_id: e.target.value })}><option value="">— all —</option>{athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
            <div className="mb-3"><label className="meta-mono">location</label><input className="input-line mt-1" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
            <div className="mb-6"><label className="meta-mono">description</label><textarea rows={3} className="w-full input-line resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex gap-3"><button type="button" onClick={() => setOpen(false)} className="btn-line">cancel</button><button className="btn-line gold">create</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
