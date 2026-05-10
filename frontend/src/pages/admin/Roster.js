import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const EMPTY = { name: '', sport: '', position: '', team: '', status: 'active', headline: '', pull_quote: '', tenure_year: '', photo_url: '' };

export default function AdminRoster() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const load = () => api.get('/ops/athletes').then(({data}) => setItems(data));
  useEffect(() => { load(); }, []);
  const save = async (e) => {
    e.preventDefault();
    const payload = { ...editing, tenure_year: editing.tenure_year ? parseInt(editing.tenure_year, 10) : null };
    if (editing.id) await api.patch(`/ops/athletes/${editing.id}`, payload);
    else await api.post('/ops/athletes', payload);
    setOpen(false); setEditing(null); load();
  };
  const remove = async (a) => {
    if (!window.confirm(`Delete ${a.name}?`)) return;
    await api.delete(`/ops/athletes/${a.id}`); load();
  };
  return (
    <div data-testid="admin-roster">
      <div className="flex justify-between items-center mb-8">
        <div><div className="eyebrow mb-3">roster</div><h1 className="display text-[44px]">Athletes.</h1></div>
        <button data-testid="roster-new" onClick={() => { setEditing({ ...EMPTY }); setOpen(true); }} className="btn-line">new athlete</button>
      </div>
      <table className="w-full text-left text-[14px] border-collapse">
        <thead><tr className="meta-mono" style={{ borderBottom: '1px solid var(--gold-line)' }}>
          <th className="py-3">name</th><th>sport</th><th>position</th><th>status</th><th>tenure</th><th></th>
        </tr></thead>
        <tbody>
          {items.map(a => (
            <tr key={a.id} className="hairline" style={{ borderBottom: '1px solid var(--gold-line)' }}>
              <td className="py-3 font-serif italic text-[18px]">{a.name}</td>
              <td>{a.sport}</td><td>{a.position || '—'}</td>
              <td><span className="meta-mono" style={{ color: a.status === 'active' ? 'var(--gold)' : undefined }}>• {a.status}</span></td>
              <td className="tabular">{a.tenure_year || '—'}</td>
              <td className="text-right">
                <button onClick={() => { setEditing({ ...a }); setOpen(true); }} className="meta-mono link-underline mr-4">edit</button>
                <button onClick={() => remove(a)} className="meta-mono" style={{ color: 'var(--destructive, red)' }}>delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {open && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(10,10,10,0.6)' }} onClick={() => setOpen(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={save} className="w-full max-w-[560px] p-8" style={{ background: 'var(--ivory)' }}>
            <div className="eyebrow mb-2">{editing.id ? 'edit athlete' : 'new athlete'}</div>
            <h2 className="display text-[32px] mb-6">{editing.name || 'New roster entry'}</h2>
            {['name','sport','position','team','headline','pull_quote','photo_url'].map(f => (
              <div className="mb-5" key={f}><label className="meta-mono">{f.replace('_',' ')}</label><input className="input-line mt-2" value={editing[f] || ''} onChange={e => setEditing({ ...editing, [f]: e.target.value })} /></div>
            ))}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><label className="meta-mono">status</label>
                <select className="input-line mt-2" value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })}>
                  {['active','paused','alumni','prospect'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="meta-mono">tenure year</label><input className="input-line mt-2" value={editing.tenure_year || ''} onChange={e => setEditing({ ...editing, tenure_year: e.target.value })} /></div>
            </div>
            <div className="flex gap-3"><button type="button" onClick={() => setOpen(false)} className="btn-line">cancel</button><button className="btn-line gold">save</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
