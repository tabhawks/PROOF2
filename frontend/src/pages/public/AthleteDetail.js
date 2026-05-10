import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PublicLayout from '@/components/site/PublicLayout';
import { api } from '@/lib/api';

export default function AthleteDetail() {
  const { slug } = useParams();
  const [a, setA] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    api.get(`/ops/athletes/by-slug/${slug}`).then(({data}) => setA(data)).catch(e => setErr(e?.response?.status === 404 ? 'not found' : 'error'));
  }, [slug]);
  if (err) return <PublicLayout><div className="section container-x"><h1 className="display text-[60px]">Not found.</h1><Link to="/athletes" className="btn-line mt-8 inline-flex">all members</Link></div></PublicLayout>;
  if (!a) return <PublicLayout><div className="section container-x"><div className="meta-mono">loading…</div></div></PublicLayout>;
  const statusStyle = { active: 'var(--gold)', paused: 'rgba(10,10,10,0.45)', alumni: 'rgba(10,10,10,0.55)', prospect: 'rgba(10,10,10,0.45)' };
  return (
    <PublicLayout>
      <section className="section">
        <div className="container-x">
          <Link to="/athletes" className="meta-mono link-underline">← all members</Link>
          <div className="mt-12 grid md:grid-cols-2 gap-16 items-start">
            <div className="aspect-[4/5] overflow-hidden" style={{ background: 'var(--charcoal)' }}>
              {a.photo_url && <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover editorial-img" />}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="meta-mono" style={{ color: statusStyle[a.status] }}>• {a.status}</span>
                <span className="meta-mono">{a.sport}</span>
              </div>
              <h1 className="display text-[56px] md:text-[88px] leading-[1.0]">{a.name}</h1>
              {a.headline && <p className="font-serif text-[20px] md:text-[24px] mt-8 leading-[1.45] text-[rgba(10,10,10,0.78)] max-w-[520px]">{a.headline}</p>}
              {a.pull_quote && (
                <div className="mt-12" style={{ borderLeft: '1px solid var(--gold)', paddingLeft: 24 }}>
                  <blockquote className="display text-[26px] md:text-[34px] leading-[1.2]">“{a.pull_quote}”</blockquote>
                </div>
              )}
              <div className="meta-strip mt-14">
                <div className="row"><div className="meta-mono">sport</div><div className="font-serif italic text-[20px]">{a.sport}</div></div>
                <div className="row"><div className="meta-mono">position</div><div className="font-serif italic text-[20px]">{a.position || '—'}</div></div>
                <div className="row"><div className="meta-mono">team</div><div className="font-serif italic text-[20px]">{a.team || '—'}</div></div>
                <div className="row"><div className="meta-mono">tenure</div><div className="font-serif italic text-[20px]">{a.tenure_year || '—'}</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section" style={{ background: 'var(--obsidian)', color: 'var(--ivory)' }}>
        <div className="container-narrow text-center">
          <h2 className="display text-[32px] md:text-[48px] mb-8">Each member is private by design.</h2>
          <Link to="/contact" className="btn-line gold">request consideration</Link>
        </div>
      </section>
    </PublicLayout>
  );
}
