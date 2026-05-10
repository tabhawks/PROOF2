import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '@/components/site/PublicLayout';
import { api } from '@/lib/api';

export default function Athletes() {
  const [athletes, setAthletes] = useState([]);
  const [filter, setFilter] = useState('all');
  useEffect(() => { api.get('/ops/athletes').then(({data}) => setAthletes(data)).catch(()=>{}); }, []);
  const filtered = athletes.filter(a => filter === 'all' || a.status === filter);
  return (
    <PublicLayout>
      <section className="section">
        <div className="container-x">
          <div className="eyebrow mb-6">selected members</div>
          <h1 className="display text-[56px] md:text-[100px] max-w-[1100px]">A small roster.<br/>By design.</h1>
          <p className="font-serif text-[20px] md:text-[22px] mt-10 max-w-[680px] text-[rgba(10,10,10,0.78)] leading-[1.5]">
            Membership is selective and anonymized in public. Each member is supported by a dedicated strategist and a coordinated team.
          </p>
        </div>
      </section>

      <section className="section-tight" style={{ borderTop: '1px solid var(--gold-line)', borderBottom: '1px solid var(--gold-line)' }}>
        <div className="container-x flex items-center gap-4 flex-wrap">
          {['all', 'active', 'paused', 'alumni', 'prospect'].map(s => (
            <button key={s} data-testid={`filter-${s}`} onClick={() => setFilter(s)} className={`btn-line ${filter === s ? 'gold' : ''}`} style={{ background: filter === s ? 'var(--gold)' : 'transparent', color: filter === s ? 'var(--obsidian)' : undefined, borderColor: filter === s ? 'var(--gold)' : undefined }}>
              {s}
            </button>
          ))}
          <span className="meta-mono ml-auto">{filtered.length} members</span>
        </div>
      </section>

      <section className="section">
        <div className="container-x grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16">
          {filtered.map(a => (
            <Link to={`/athletes/${a.slug}`} key={a.id} className="group block" data-testid={`athlete-card-${a.slug}`}>
              <div className="aspect-[4/5] overflow-hidden" style={{ background: 'var(--charcoal)' }}>
                {a.photo_url && <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover editorial-img group-hover:scale-[1.02]" style={{ transition: 'transform .8s ease' }} />}
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <div className="meta-mono">{a.sport}</div>
                <div className="meta-mono">{a.status}</div>
              </div>
              <div className="font-serif italic text-[26px] mt-1">{a.name}</div>
              {a.headline && <p className="text-[14px] mt-2 text-[rgba(10,10,10,0.65)] leading-[1.5] max-w-[420px]">{a.headline}</p>}
            </Link>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
