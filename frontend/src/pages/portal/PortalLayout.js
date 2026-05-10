import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

const NAV = [
  { to: '/portal', label: 'Today', exact: true, key: 'today' },
  { to: '/portal/documents', label: 'Documents', key: 'docs' },
  { to: '/portal/calendar', label: 'Calendar', key: 'cal' },
  { to: '/portal/messages', label: 'Messages', key: 'msg' },
  { to: '/portal/news', label: 'News', key: 'news' },
  { to: '/portal/account', label: 'My Account', key: 'acct' },
];

export default function PortalLayout() {
  const { user, logout, loading, isMember } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav('/login', { state: { from: window.location.pathname } });
    else if (!loading && user && !isMember) nav('/admin');
  }, [loading, user, isMember, nav]);
  if (loading || !user) return null;
  return (
    <div data-testid="portal-layout" className="min-h-screen grid grid-cols-[260px_1fr]" style={{ background: 'var(--ivory)' }}>
      <aside className="border-r border-[var(--gold-line)] flex flex-col" style={{ background: 'var(--obsidian)', color: 'var(--ivory)' }}>
        <Link to="/" className="p-6 block">
          <div className="font-serif italic text-[24px]">PROOF</div>
          <div className="meta-mono on-dark">member portal</div>
        </Link>
        <div className="gold-rule" />
        <nav className="flex-1 p-3">
          {NAV.map(n => (
            <NavLink key={n.key} to={n.to} end={n.exact} data-testid={`portal-nav-${n.key}`} className={({ isActive }) => `block px-4 py-3 mb-1 meta-mono on-dark ${isActive ? 'bg-[rgba(200,169,106,0.18)] text-[var(--gold)]' : 'hover:bg-[rgba(245,241,234,0.06)]'}`}>{n.label}</NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-[var(--gold-line)]">
          <div className="meta-mono on-dark mb-2">{user.name}</div>
          <div className="meta-mono on-dark text-[10px] mb-3">{user.email}</div>
          <button onClick={logout} data-testid="portal-logout" className="btn-line dark w-full justify-center">sign out</button>
        </div>
      </aside>
      <main className="overflow-auto">
        <div className="p-10"><Outlet /></div>
      </main>
    </div>
  );
}
