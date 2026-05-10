import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const LOCATIONS = ['header', 'footer_firm', 'footer_practices', 'footer_legal'];

export default function AdminMenus() {
  const [menus, setMenus] = useState({});
  const load = () => api.get('/cms/menus').then(({data}) => {
    const map = {}; data.forEach(m => map[m.location] = m);
    setMenus(map);
  });
  useEffect(() => { load(); }, []);
  const save = async (loc) => {
    const m = menus[loc]; if (!m) return;
    const items = (m.items || []).map((it, i) => ({ ...it, order: i }));
    await api.put(`/cms/menus/${loc}`, { items });
    load();
  };
  const setMenu = (loc, items) => setMenus(p => ({ ...p, [loc]: { ...p[loc], location: loc, items } }));
  const addItem = (loc) => setMenu(loc, [...(menus[loc]?.items || []), { id: Math.random().toString(36).slice(2,8), label: 'New item', href: '/' }]);
  const move = (loc, idx, dir) => {
    const items = [...(menus[loc]?.items || [])]; const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const t = items[idx]; items[idx] = items[j]; items[j] = t;
    setMenu(loc, items);
  };
  return (
    <div data-testid="admin-menus">
      <div className="eyebrow mb-3">content</div>
      <h1 className="display text-[44px] mb-10">Menus.</h1>
      <div className="grid md:grid-cols-2 gap-12">
        {LOCATIONS.map(loc => {
          const m = menus[loc] || { items: [] };
          return (
            <div key={loc} className="p-6 border border-[var(--gold-line)]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="display text-[22px]">{loc.replace('_', ' ')}</h2>
                <div className="flex gap-2"><button onClick={() => addItem(loc)} className="meta-mono link-underline">add item</button><button onClick={() => save(loc)} className="btn-line">save</button></div>
              </div>
              {(m.items || []).map((it, i) => (
                <div key={i} className="flex gap-2 items-center mb-2">
                  <span className="meta-mono w-6">{String(i+1).padStart(2,'0')}</span>
                  <input className="input-line flex-1" value={it.label} onChange={e => { const items = [...m.items]; items[i] = { ...items[i], label: e.target.value }; setMenu(loc, items); }} />
                  <input className="input-line flex-1 font-mono text-[12px]" value={it.href} onChange={e => { const items = [...m.items]; items[i] = { ...items[i], href: e.target.value }; setMenu(loc, items); }} />
                  <button onClick={() => move(loc, i, -1)} className="meta-mono">↑</button>
                  <button onClick={() => move(loc, i, 1)} className="meta-mono">↓</button>
                  <button onClick={() => { const items = [...m.items]; items.splice(i,1); setMenu(loc, items); }} className="meta-mono" style={{ color: 'red' }}>×</button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
