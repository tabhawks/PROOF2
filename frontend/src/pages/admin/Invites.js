import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const ROLES = ['admin','editor','strategist','operations','read_only','athlete','family','agent','counsel'];

export default function AdminInvites() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'editor' });
  const [lastToken, setLastToken] = useState('');
  const load = () => api.get('/admin/invites').then(({data}) => setItems(data));
  useEffect(() => { load(); }, []);
  const create = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/invites', form);
      setLastToken(data.token);
      setOpen(false); setForm({ name: '', email: '', role: 'editor' });
      load();
    } catch (e) { alert(e?.response?.data?.detail || 'failed'); }
  };
  const resend = async (i) => {
    const { data } = await api.post(`/admin/invites/${i.id}/resend`);
    setLastToken(data.token); load();
  };
  const revoke = async (i) => {
    await api.post(`/admin/invites/${i.id}/revoke`); load();
  };
  const inviteUrl = (token) => `${window.location.origin}/onboarding?invite=${token}`;
  return (
    <div data-testid="admin-invites">
      <div className="flex justify-between items-center mb-8">
        <div><div className="eyebrow mb-3">invites</div><h1 className="display text-[44px]">Invitations.</h1></div>
        <button data-testid="invite-new" onClick={() => setOpen(true)} className="btn-line">new invite</button>
      </div>
      {lastToken && (
        <div className="p-4 border border-[var(--gold-line)] bg-[rgba(200,169,106,0.08)] mb-8">
          <div className="meta-mono mb-2">invite link — share privately</div>
          <code className="text-[12px] break-all">{inviteUrl(lastToken)}</code>
        </div>
      )}
      <table className="w-full text-[14px]">
        <thead><tr className="meta-mono" style={{ borderBottom: '1px solid var(--gold-line)' }}><th className="text-left py-3">email</th><th className="text-left">name</th><th className="text-left">role</th><th className="text-left">status</th><th className="text-left">expires</th><th></th></tr></thead>
        <tbody>
          {items.map(i => (
            <tr key={i.id} style={{ borderBottom: '1px solid var(--gold-line)' }}>
              <td className="py-3 font-mono text-[12px]">{i.email}</td>
              <td className="font-serif italic">{i.name}</td>
              <td className="meta-mono">{i.role}</td>
              <td className="meta-mono" style={{ color: i.status === 'pending' ? 'var(--gold)' : undefined }}>• {i.status}</td>
              <td className="meta-mono">{(i.expires_at || '').slice(0,10)}</td>
              <td className="text-right">
                {i.status === 'pending' && <>
                  <button onClick={() => resend(i)} className="meta-mono link-underline mr-4">resend</button>
                  <button onClick={() => revoke(i)} className="meta-mono" style={{ color: 'red' }}>revoke</button>
                </>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(10,10,10,0.6)' }} onClick={() => setOpen(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={create} className="w-full max-w-[480px] p-8" style={{ background: 'var(--ivory)' }}>
            <div className="eyebrow mb-2">new invitation</div>
            <h2 className="display text-[32px] mb-6">Invite a member.</h2>
            <div className="mb-5"><label className="meta-mono">name</label><input required className="input-line mt-2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="mb-5"><label className="meta-mono">email</label><input required type="email" className="input-line mt-2" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="mb-6"><label className="meta-mono">role</label><select className="input-line mt-2" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></div>
            <div className="flex gap-3"><button type="button" onClick={() => setOpen(false)} className="btn-line">cancel</button><button className="btn-line gold">create invite</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
