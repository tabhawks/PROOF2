import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const NAV_DEFAULT = [
  { id: 'a', label: 'What We Do', href: '/services', order: 1 },
  { id: 'b', label: 'Athletes', href: '/athletes', order: 2 },
  { id: 'c', label: 'Organizations', href: '/orgs', order: 3 },
  { id: 'd', label: 'Family', href: '/family', order: 4 },
  { id: 'e', label: 'Approach', href: '/approach', order: 5 },
  { id: 'f', label: 'About', href: '/about', order: 6 },
  { id: 'g', label: 'Press', href: '/press', order: 7 },
];

function applyTheme(s) {
  if (!s) return;
  const r = document.documentElement.style;
  if (s.theme_bg) r.setProperty('--bg', s.theme_bg);
  if (s.theme_surface) r.setProperty('--surface', s.theme_surface);
  if (s.theme_text) r.setProperty('--text', s.theme_text);
  if (s.theme_text_muted) r.setProperty('--text-muted', s.theme_text_muted);
  if (s.theme_accent) r.setProperty('--accent', s.theme_accent);
  if (s.theme_accent_soft) r.setProperty('--accent-soft', s.theme_accent_soft);
  if (s.theme_hairline) r.setProperty('--hairline', s.theme_hairline);
  if (s.font_serif) r.setProperty('--font-serif', s.font_serif);
  if (s.font_sans) r.setProperty('--font-sans', s.font_sans);
  if (s.font_mono) r.setProperty('--font-mono', s.font_mono);
  if (s.google_fonts_url) {
    const id = 'proof-google-fonts';
    let link = document.getElementById(id);
    if (!link) { link = document.createElement('link'); link.id = id; link.rel = 'stylesheet'; document.head.appendChild(link); }
    if (link.href !== s.google_fonts_url) link.href = s.google_fonts_url;
  }
}

export default function PublicLayout({ children }) {
  const [menus, setMenus] = useState({ header: NAV_DEFAULT, footer_firm: [], footer_practices: [], footer_legal: [] });
  const [settings, setSettings] = useState({ site_title: 'PROOF', edition_meta: 'PROOF™ · EDITION 2026.01 · NEW YORK · LONDON', contact_email: 'private@prooffirm.com' });
  const { user, isStaff } = useAuth() || {};
  const loc = useLocation();

  useEffect(() => {
    api.get('/cms/menus').then(({ data }) => {
      const map = { header: NAV_DEFAULT, footer_firm: [], footer_practices: [], footer_legal: [] };
      data.forEach(m => { if (map.hasOwnProperty(m.location)) map[m.location] = (m.items || []).sort((a,b) => a.order - b.order); });
      setMenus(map);
    }).catch(()=>{});
    api.get('/admin/public-settings').then(({ data }) => { setSettings(s => ({ ...s, ...data })); applyTheme(data); }).catch(()=>{});
  }, []);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [loc.pathname]);

  return (
    <div data-testid="public-layout" className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <header data-testid="public-header" className="sticky top-0 z-40" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--hairline)' }}>
        <div className="container-x flex items-center justify-between" style={{ padding: '20px 48px' }}>
          <Link to="/" className="flex items-baseline" data-testid="site-wordmark">
            <span className="font-mono uppercase tracking-[0.18em]" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 18 }}>PROOF</span>
            <span style={{ color: 'var(--accent)', fontSize: 9, marginLeft: 2, marginTop: -8 }}>™</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-9" data-testid="site-nav">
            {(menus.header.length ? menus.header : NAV_DEFAULT).map(item => (
              <NavLink key={item.id} to={item.href} className={({ isActive }) => `font-mono uppercase tracking-[0.22em] text-[10.5px] transition-colors ${isActive ? 'text-[var(--accent)]' : ''}`} style={({ isActive }) => ({ color: isActive ? 'var(--accent)' : 'var(--text)' })}>{item.label}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              isStaff ? <Link to="/admin" className="btn-line ghost" data-testid="nav-admin">Admin</Link> : <Link to="/portal" className="btn-line ghost" data-testid="nav-portal">Portal</Link>
            ) : (
              <Link to="/login" className="btn-line ghost" data-testid="nav-portal">Member Portal</Link>
            )}
            <Link to="/contact" className="btn-line gold" data-testid="nav-inquire">Request Consideration</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 page-enter" key={loc.pathname}>{children}</main>

      <footer data-testid="public-footer" className="mt-32" style={{ borderTop: '1px solid var(--hairline)' }}>
        <div className="container-x" style={{ padding: '80px 48px' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-baseline mb-4">
                <span className="font-mono uppercase tracking-[0.18em]" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 22 }}>PROOF</span>
                <span style={{ color: 'var(--accent)', fontSize: 11, marginLeft: 2, marginTop: -10 }}>™</span>
              </div>
              <p className="font-serif italic text-[20px] leading-[1.4]" style={{ color: 'var(--text-muted)' }}>Surrounded is not the same as protected.</p>
            </div>
            <div>
              <div className="meta-mono mb-4">Firm</div>
              <ul className="space-y-2">
                {(menus.footer_firm || []).map(it => <li key={it.id}><Link to={it.href} className="text-[14px] hover:text-[var(--accent)]" style={{ color: 'var(--text-muted)' }}>{it.label}</Link></li>)}
              </ul>
            </div>
            <div>
              <div className="meta-mono mb-4">Practices</div>
              <ul className="space-y-2">
                {(menus.footer_practices || []).map(it => <li key={it.id}><Link to={it.href} className="text-[14px] hover:text-[var(--accent)]" style={{ color: 'var(--text-muted)' }}>{it.label}</Link></li>)}
              </ul>
            </div>
            <div>
              <div className="meta-mono mb-4">Legal</div>
              <ul className="space-y-2">
                {(menus.footer_legal || []).map(it => <li key={it.id}><Link to={it.href} className="text-[14px] hover:text-[var(--accent)]" style={{ color: 'var(--text-muted)' }}>{it.label}</Link></li>)}
              </ul>
            </div>
          </div>
          <div className="gold-rule mt-16 mb-6" />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="meta-mono">{settings.edition_meta}</div>
            <div className="meta-mono">By referral &middot; {settings.contact_email || 'private@prooffirm.com'}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
