import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

function Diff({ before, after }) {
  if (!before && !after) return <div className="meta-mono">—</div>;
  const keys = Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})])).filter(k => !['updated_at'].includes(k));
  const rows = keys.filter(k => JSON.stringify((before||{})[k]) !== JSON.stringify((after||{})[k]));
  if (rows.length === 0) return <div className="meta-mono">no field changes</div>;
  return (
    <table className="text-[12px] font-mono w-full">
      <tbody>
        {rows.map(k => (
          <tr key={k} style={{ borderBottom: '1px solid var(--gold-line)' }}>
            <td className="py-2 align-top w-32 meta-mono">{k}</td>
            <td className="py-2 align-top text-red-700 max-w-[280px] truncate">{JSON.stringify((before||{})[k]).slice(0, 120)}</td>
            <td className="py-2 align-top text-green-700 max-w-[280px] truncate">{JSON.stringify((after||{})[k]).slice(0, 120)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AdminAuditLog() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ resource_type: '', action: '' });
  const [expanded, setExpanded] = useState(null);
  const load = () => {
    const params = new URLSearchParams();
    if (filters.resource_type) params.append('resource_type', filters.resource_type);
    if (filters.action) params.append('action', filters.action);
    api.get(`/admin/audit?${params.toString()}`).then(({data}) => setItems(data));
  };
  useEffect(() => { load(); }, [filters]);
  return (
    <div data-testid="admin-audit">
      <div className="eyebrow mb-3">governance</div>
      <h1 className="display text-[44px] mb-8">Audit log.</h1>
      <div className="flex gap-3 mb-6">
        <select className="input-line w-44" value={filters.resource_type} onChange={e => setFilters({ ...filters, resource_type: e.target.value })}><option value="">all resources</option>{['page','post','profile','athlete','document','event','announcement','media','menu','invite','settings'].map(r => <option key={r}>{r}</option>)}</select>
        <select className="input-line w-44" value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value })}><option value="">all actions</option>{['create','update','delete','publish','restore','login','logout','download','sign_url','revoke','resend'].map(r => <option key={r}>{r}</option>)}</select>
        <span className="meta-mono ml-auto self-center">{items.length} entries</span>
      </div>
      <table className="w-full text-[13px]">
        <thead><tr className="meta-mono" style={{ borderBottom: '1px solid var(--gold-line)' }}><th className="text-left py-3">when</th><th className="text-left">actor</th><th className="text-left">action</th><th className="text-left">resource</th><th></th></tr></thead>
        <tbody>
          {items.map(a => (
            <React.Fragment key={a.id}>
              <tr style={{ borderBottom: '1px solid var(--gold-line)' }} className="hover:bg-[rgba(200,169,106,0.05)]">
                <td className="py-3 font-mono">{(a.created_at || '').slice(0, 19).replace('T',' ')}</td>
                <td className="font-mono text-[11px]">{a.actor_email || 'system'}</td>
                <td className="meta-mono">{a.action}</td>
                <td className="meta-mono">{a.resource_type} {a.resource_id ? `· ${a.resource_id.slice(0,8)}` : ''}</td>
                <td className="text-right"><button onClick={() => setExpanded(expanded === a.id ? null : a.id)} className="meta-mono link-underline">{expanded === a.id ? 'hide' : 'diff'}</button></td>
              </tr>
              {expanded === a.id && (
                <tr><td colSpan={5} style={{ background: 'var(--bone)' }} className="p-4"><Diff before={a.before} after={a.after} /></td></tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
