import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function PublicLayout({ children }) {
  const [menus, setMenus] = useState({ header: [], footer_firm: [], footer_practices: [], footer_legal: [] });
  const [settings, setSettings] = useState({ site_title: 'PROOF', edition_meta: 'PROOF™ · EDITION 2026.01 · NEW YORK · LONDON' });
  const [scrolled, setScrolled] = useState(false);
  const { user, isStaff } = useAuth() || {};
  const loc = useLocation();

  useEffect(() => {
    api.get('/cms/menus').then(({ data }) => {
      const map = { header: [], footer_firm: [], footer_practices: [], footer_legal: [] };
      data.forEach(m => { if (map.hasOwnProperty(m.location)) map[m.location] = (m.items || []).sort((a,b) => a.order - b.order); });
      setMenus(map);
    }).catch(()=>{});
    api.get('/admin/public-settings').then(({ data }) => setSettings(s => ({ ...s, ...data }))).catch(()=>{});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [loc.pathname]);

  return (
    <div data-testid="public-layout" className="min-h-screen flex flex-col" style={{ background: 'var(--ivory)' }}>
      <header data-testid="public-header" className={`sticky top-0 z-40 transition-colors`} style={{ background: scrolled ? 'rgba(245,241,234,0.92)' : 'transparent', backdropFilter: scrolled ? 'saturate(120%) blur(8px)' : 'none', borderBottom: '1px solid var(--gold-line)' }}>
        <div className="container-x flex items-center justify-between py-5 px-8">
          <Link to="/" className="flex items-baseline gap-3" data-testid="site-wordmark">
            <span className="font-serif italic text-[22px] tracking-tight">PROOF</span>
            <span className="meta-mono hidden sm:inline">— private athlete management</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 meta-mono" data-testid="site-nav">
            {menus.header.map(item => (
              <NavLink key={item.id} to={item.href} className={({ isActive }) => `link-underline tracking-[0.18em] uppercase text-[11px] ${isActive ? 'text-[var(--obsidian)]' : 'text-[rgba(10,10,10,0.7)]'}`}>{item.label}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {isStaff && <Link to="/admin" className="btn-line" data-testid="nav-admin">admin</Link>}
                {!isStaff && <Link to="/portal" className="btn-line" data-testid="nav-portal">portal</Link>}
              </>
            ) : (
              <Link to="/login" className="btn-line" data-testid="nav-portal">member portal</Link>
            )}
            <Link to="/contact" className="btn-line gold" data-testid="nav-inquire">inquire</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer data-testid="public-footer" className="mt-32" style={{ background: 'var(--obsidian)', color: 'var(--ivory)', borderTop: '1px solid var(--gold-line)' }}>
        <div className="container-x px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="font-serif italic text-[28px] mb-3">PROOF</div>
              <div className="meta-mono on-dark text-[11px] mb-6">private athlete management</div>
              <p className="font-serif italic text-[18px] leading-[1.4] text-[rgba(245,241,234,0.78)]">Surrounded is not the same as protected.</p>
            </div>
            <div>
              <div className="eyebrow on-dark mb-4">firm</div>
              <ul className="space-y-2">
                {menus.footer_firm.map(it => <li key={it.id}><Link to={it.href} className="text-[14px] text-[rgba(245,241,234,0.78)] hover:text-[var(--gold)]">{it.label}</Link></li>)}
              </ul>
            </div>
            <div>
              <div className="eyebrow on-dark mb-4">practices</div>
              <ul className="space-y-2">
                {menus.footer_practices.map(it => <li key={it.id}><Link to={it.href} className="text-[14px] text-[rgba(245,241,234,0.78)] hover:text-[var(--gold)]">{it.label}</Link></li>)}
              </ul>
            </div>
            <div>
              <div className="eyebrow on-dark mb-4">legal</div>
              <ul className="space-y-2">
                {menus.footer_legal.map(it => <li key={it.id}><Link to={it.href} className="text-[14px] text-[rgba(245,241,234,0.78)] hover:text-[var(--gold)]">{it.label}</Link></li>)}
              </ul>
            </div>
          </div>
          <div className="gold-rule mt-16 mb-6" />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="meta-mono on-dark">{settings.edition_meta}</div>
            <div className="meta-mono on-dark">by referral &middot; {settings.contact_email || 'private@prooffirm.com'}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
