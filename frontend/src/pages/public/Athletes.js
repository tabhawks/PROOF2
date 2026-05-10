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
      <section className="section" style={{ paddingTop: 120 }}>
        <div className="container-x">
          <div className="eyebrow mb-8">Selected Members</div>
          <h1 className="display text-[60px] md:text-[112px]" style={{ lineHeight: 0.98 }}>A small roster.<br/>By <span className="gold">design.</span></h1>
          <p className="font-serif italic mt-12 max-w-[680px] leading-[1.5]" style={{ fontSize: 22, color: 'var(--text-muted)' }}>
            Membership is selective and anonymized in public. Each member is supported by a dedicated strategist and a coordinated team.
          </p>
        </div>
      </section>
      <section className="section-tight" style={{ borderTop: '1px solid var(--hairline)', borderBottom: '1px solid var(--hairline)' }}>
        <div className="container-x flex items-center gap-3 flex-wrap">
          {['all','active','paused','alumni','prospect'].map(s => (
            <button key={s} data-testid={`filter-${s}`} onClick={() => setFilter(s)} className={`btn-line ${filter === s ? 'gold' : ''}`}>{s}</button>
          ))}
          <span className="meta-mono ml-auto">{filtered.length} members</span>
        </div>
      </section>
      <section className="section">
        <div className="container-x grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16">
          {filtered.map(a => (
            <Link to={`/athletes/${a.slug}`} key={a.id} className="group block" data-testid={`athlete-card-${a.slug}`}>
              <div className="aspect-[4/5] overflow-hidden" style={{ background: 'var(--surface)' }}>
                {a.photo_url && <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover editorial-img group-hover:scale-[1.02]" style={{ transition: 'transform .8s ease' }} />}
              </div>
              <div className="mt-5 flex items-baseline justify-between">
                <div className="meta-mono">{a.sport}</div>
                <div className="meta-mono" style={{ color: a.status === 'active' ? 'var(--accent)' : undefined }}>• {a.status}</div>
              </div>
              <div className="font-serif italic text-[28px] mt-2">{a.name}</div>
              {a.headline && <p className="text-[14px] mt-3 leading-[1.55] max-w-[420px]" style={{ color: 'var(--text-muted)' }}>{a.headline}</p>}
            </Link>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
