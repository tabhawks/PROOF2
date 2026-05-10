import React, { useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';

export default function AdminCovenants() {
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ member_id: '', title: 'Covenant of Engagement', body: '' });
  const load = () => {
    api.get('/billing/covenants').then(({data}) => setItems(data));
    api.get('/admin/users?role_class=member').then(({data}) => setMembers(data));
  };
  useEffect(() => { load(); }, []);
  const create = async (e) => {
    e.preventDefault();
    await api.post('/billing/covenants', form);
    setOpen(false); setForm({ member_id: '', title: 'Covenant of Engagement', body: '' }); load();
  };
  const voidIt = async (c) => { if (!window.confirm('Void this covenant?')) return; await api.post(`/billing/covenants/${c.id}/void`); load(); };
  const downloadPdf = (c) => {
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/billing/covenants/${c.id}/pdf`;
    fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.blob()).then(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `covenant-${c.id.slice(0,8)}.pdf`; a.click(); });
  };
  return (
    <div data-testid="admin-covenants">
      <div className="flex justify-between items-center mb-8">
        <div><div className="eyebrow mb-3">billing</div><h1 className="display text-[44px]">Covenants.</h1></div>
        <button onClick={() => setOpen(true)} data-testid="covenant-new" className="btn-line">new covenant</button>
      </div>
      <table className="w-full text-[14px]">
        <thead><tr className="meta-mono" style={{ borderBottom: '1px solid var(--gold-line)' }}><th className="text-left py-3">title</th><th className="text-left">member</th><th className="text-left">status</th><th className="text-left">sent</th><th className="text-left">signed</th><th></th></tr></thead>
        <tbody>
          {items.map(c => (
            <tr key={c.id} style={{ borderBottom: '1px solid var(--gold-line)' }}>
              <td className="py-3 font-serif italic text-[18px]">{c.title}</td>
              <td>{c.member?.name}</td>
              <td><span className="meta-mono" style={{ color: c.status === 'signed' ? 'var(--gold)' : c.status === 'void' ? 'red' : undefined }}>• {c.status}</span></td>
              <td className="meta-mono">{(c.sent_at || '').slice(0,10) || '—'}</td>
              <td className="meta-mono">{(c.signed_at || '').slice(0,10) || '—'}</td>
              <td className="text-right">
                <button onClick={() => downloadPdf(c)} className="meta-mono link-underline mr-3">pdf</button>
                {c.status !== 'void' && c.status !== 'signed' && <button onClick={() => voidIt(c)} className="meta-mono" style={{ color: 'red' }}>void</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(10,10,10,0.6)' }} onClick={() => setOpen(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={create} className="w-full max-w-[640px] p-8" style={{ background: 'var(--ivory)' }}>
            <h2 className="display text-[28px] mb-4">New covenant</h2>
            <div className="mb-3"><label className="meta-mono">member</label><select required className="input-line mt-1" value={form.member_id} onChange={e => setForm({ ...form, member_id: e.target.value })}><option value="">— select —</option>{members.map(m => <option key={m.id} value={m.id}>{m.name} · {m.email}</option>)}</select></div>
            <div className="mb-3"><label className="meta-mono">title</label><input required className="input-line mt-1" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="mb-6"><label className="meta-mono">body (leave blank for default template)</label><textarea rows={8} className="w-full input-line resize-none" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Default PROOF covenant template will be used." /></div>
            <div className="flex gap-3"><button type="button" onClick={() => setOpen(false)} className="btn-line">cancel</button><button data-testid="covenant-send" className="btn-line gold">send to member</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
