import React, { useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

const GROUPS = [
  { label: 'Operate', items: [
    { to: '/admin', end: true, label: 'Dashboard', key: 'dash' },
    { to: '/admin/roster', label: 'Roster', key: 'roster' },
    { to: '/admin/accounts', label: 'Accounts', key: 'accounts' },
    { to: '/admin/invites', label: 'Invites', key: 'invites' },
  ]},
  { label: 'Content', items: [
    { to: '/admin/pages', label: 'Pages', key: 'pages' },
    { to: '/admin/posts', label: 'Posts', key: 'posts' },
    { to: '/admin/announcements', label: 'Announcements', key: 'ann' },
    { to: '/admin/media', label: 'Media Library', key: 'media' },
    { to: '/admin/menus', label: 'Menus', key: 'menus' },
  ]},
  { label: 'Operations', items: [
    { to: '/admin/documents', label: 'Documents', key: 'docs' },
    { to: '/admin/calendar', label: 'Calendar', key: 'cal' },
    { to: '/admin/messages', label: 'Messages', key: 'msg' },
    { to: '/admin/outbox', label: 'Email Outbox', key: 'outbox' },
  ]},
  { label: 'Billing', items: [
    { to: '/admin/retainers', label: 'Retainers', key: 'retainers' },
    { to: '/admin/covenants', label: 'Covenants', key: 'covenants' },
  ]},
  { label: 'Governance', items: [
    { to: '/admin/audit', label: 'Audit Log', key: 'audit' },
    { to: '/admin/analytics', label: 'Analytics', key: 'analytics' },
    { to: '/admin/settings', label: 'Settings', key: 'settings' },
  ]},
];

export default function AdminLayout() {
  const { user, loading, isStaff, logout } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav('/login', { state: { from: window.location.pathname } });
    else if (!loading && user && !isStaff) nav('/portal');
  }, [loading, user, isStaff, nav]);
  if (loading || !user) return null;
  return (
    <div data-testid="admin-layout" className="min-h-screen grid grid-cols-[280px_1fr]" style={{ background: 'var(--ivory)' }}>
      <aside className="flex flex-col border-r border-[var(--gold-line)]" style={{ background: 'var(--obsidian)', color: 'var(--ivory)' }}>
        <Link to="/" className="p-6 block">
          <div className="font-serif italic text-[24px]">PROOF</div>
          <div className="meta-mono on-dark">admin · cms</div>
        </Link>
        <div className="gold-rule" />
        <nav className="flex-1 p-3 overflow-auto">
          {GROUPS.map(g => (
            <div key={g.label} className="mb-5">
              <div className="meta-mono on-dark px-3 mb-1">{g.label}</div>
              {g.items.map(it => (
                <NavLink key={it.key} to={it.to} end={it.end} data-testid={`admin-nav-${it.key}`} className={({ isActive }) => `block px-3 py-2 text-[13px] font-mono ${isActive ? 'bg-[rgba(200,169,106,0.18)] text-[var(--gold)]' : 'text-[rgba(245,241,234,0.7)] hover:text-[var(--ivory)]'}`}>{it.label}</NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-[var(--gold-line)]">
          <div className="meta-mono on-dark mb-1">{user.name}</div>
          <div className="meta-mono on-dark text-[10px] mb-3">{user.role} · {user.email}</div>
          <button onClick={logout} data-testid="admin-logout" className="btn-line dark w-full justify-center">sign out</button>
        </div>
      </aside>
      <main className="overflow-auto">
        <div className="p-10"><Outlet /></div>
      </main>
    </div>
  );
}
