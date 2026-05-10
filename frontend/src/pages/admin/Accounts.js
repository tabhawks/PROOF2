import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const ROLES = ['owner','admin','editor','strategist','operations','read_only','athlete','family','agent','counsel'];

export default function AdminAccounts() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const load = () => api.get(`/admin/users${filter === 'all' ? '' : '?role_class=' + filter}`).then(({data}) => setUsers(data));
  useEffect(() => { load(); }, [filter]);
  const update = async (u, changes) => {
    await api.patch(`/admin/users/${u.id}`, changes); load();
  };
  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.email}?`)) return;
    try { await api.delete(`/admin/users/${u.id}`); load(); }
    catch (e) { alert(e?.response?.data?.detail || 'failed'); }
  };
  return (
    <div data-testid="admin-accounts">
      <div className="flex justify-between items-center mb-8">
        <div><div className="eyebrow mb-3">accounts</div><h1 className="display text-[44px]">People.</h1></div>
        <div className="flex gap-2">
          {['all','staff','member'].map(s => <button key={s} onClick={() => setFilter(s)} className={`btn-line ${filter === s ? 'gold' : ''}`}>{s}</button>)}
        </div>
      </div>
      <table className="w-full text-[14px]">
        <thead><tr className="meta-mono" style={{ borderBottom: '1px solid var(--gold-line)' }}><th className="text-left py-3">name</th><th className="text-left">email</th><th className="text-left">role</th><th className="text-left">status</th><th></th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={{ borderBottom: '1px solid var(--gold-line)' }}>
              <td className="py-3 font-serif italic text-[18px]">{u.name}</td>
              <td className="font-mono text-[12px]">{u.email}</td>
              <td>
                <select className="text-[13px] bg-transparent" value={u.role} onChange={e => update(u, { role: e.target.value })}>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </td>
              <td>
                <select className="text-[13px] bg-transparent" value={u.status} onChange={e => update(u, { status: e.target.value })}>
                  {['active','suspended','pending'].map(s => <option key={s}>{s}</option>)}
                </select>
              </td>
              <td className="text-right"><button onClick={() => remove(u)} className="meta-mono" style={{ color: 'red' }}>delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
