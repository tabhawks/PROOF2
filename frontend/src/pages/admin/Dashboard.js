import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';

function StatCard({ label, value, hint }) {
  return (
    <div className="p-6 border border-[var(--gold-line)]">
      <div className="meta-mono mb-3">{label}</div>
      <div className="display text-[56px] tabular leading-none">{value}</div>
      {hint && <div className="meta-mono mt-2 text-[10px]">{hint}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ athletes: 0, members: 0, staff: 0, documents: 0 });
  const [audit, setAudit] = useState([]);
  const [events, setEvents] = useState([]);
  useEffect(() => {
    Promise.all([
      api.get('/ops/athletes'),
      api.get('/admin/users?role_class=member'),
      api.get('/admin/users?role_class=staff'),
      api.get('/ops/documents'),
      api.get('/admin/audit?limit=10'),
      api.get('/ops/events'),
    ]).then(([a, m, s, d, au, ev]) => {
      setStats({ athletes: a.data.length, members: m.data.length, staff: s.data.length, documents: d.data.length });
      setAudit(au.data); setEvents(ev.data.slice(0, 6));
    }).catch(()=>{});
  }, []);
  return (
    <div data-testid="admin-dashboard">
      <div className="eyebrow mb-3">dashboard</div>
      <h1 className="display text-[44px] md:text-[64px] mb-10">Operations.</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <StatCard label="athletes" value={stats.athletes} hint="signed members" />
        <StatCard label="members" value={stats.members} hint="linked accounts" />
        <StatCard label="staff" value={stats.staff} hint="firm + advisory" />
        <StatCard label="documents" value={stats.documents} hint="vault total" />
      </div>
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="display text-[28px] mb-4">This week.</h2>
          <ul className="meta-strip">
            {events.length === 0 && <li className="row"><div className="meta-mono">—</div><div className="font-serif italic">No events.</div></li>}
            {events.map(e => (
              <li key={e.id} className="row">
                <div className="meta-mono">{(e.start || '').slice(0, 16).replace('T', ' ')}</div>
                <div className="font-serif italic text-[18px]">{e.title}</div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="display text-[28px] mb-4">Recent activity.</h2>
          <ul className="meta-strip">
            {audit.length === 0 && <li className="row"><div className="meta-mono">—</div><div className="font-serif italic">Nothing yet.</div></li>}
            {audit.map(a => (
              <li key={a.id} className="row">
                <div className="meta-mono">{(a.created_at || '').slice(11, 16)}</div>
                <div>
                  <div className="font-serif italic text-[16px]">{a.action} · {a.resource_type}</div>
                  <div className="meta-mono text-[10px] mt-1">{a.actor_email || 'system'}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4"><Link to="/admin/audit" className="meta-mono link-underline">full audit log →</Link></div>
        </div>
      </div>
    </div>
  );
}
