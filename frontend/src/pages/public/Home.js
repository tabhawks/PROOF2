import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '@/components/site/PublicLayout';
import { api } from '@/lib/api';

const SEVEN = [
  { n: '01', label: 'Person' }, { n: '02', label: 'Career' }, { n: '03', label: 'Brand' },
  { n: '04', label: 'Business' }, { n: '05', label: 'Reputation' }, { n: '06', label: 'Lifestyle' },
  { n: '07', label: 'Legacy' },
];

const STAGES = [
  { n: '01', t: 'High School & Family', d: 'Early visibility and eligibility questions.' },
  { n: '02', t: 'College & NIL', d: 'First contracts, brand decisions, advisor exposure.' },
  { n: '03', t: 'Pre-Draft', d: 'Agent selection, brand launch, reputation baseline.' },
  { n: '04', t: 'Professional', d: 'Brand, business, reputation, private operations.' },
  { n: '05', t: 'Post-Career', d: 'Identity, ownership, broadcasting, foundation.' },
  { n: '06', t: 'Legacy', d: 'Family wealth, long-term architecture, next 50 years.' },
];

function Arrow() { return <span className="arrow">→</span>; }

export default function Home() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    api.get('/cms/posts?status=published').then(({data}) => setPosts(data.slice(0,3))).catch(()=>{});
    api.post('/track/page-view', { path: '/' }).catch(()=>{});
  }, []);
  return (
    <PublicLayout>
      {/* HERO */}
      <section data-testid="home-hero" className="section" style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div className="container-x grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="eyebrow mb-10">Private Athlete Management</div>
            <h1 className="display text-[64px] md:text-[96px] xl:text-[112px] tracking-tight" style={{ lineHeight: 0.96 }}>
              Surrounded is not the same<br/>as <span className="gold">protected.</span>
            </h1>
            <p className="font-serif italic mt-12 max-w-[560px] leading-[1.5]" style={{ fontSize: 22, color: 'var(--text-muted)' }}>
              PROOF is a private management and strategic advisory firm for elite athletes — operating as the central strategy layer behind a long career and a longer life.
            </p>
            <div className="mt-12 flex flex-wrap gap-4">
              <Link to="/contact" className="btn-line gold">Request Consideration <Arrow /></Link>
              <Link to="/services" className="btn-line">What we do</Link>
            </div>
          </div>
          <div className="hidden lg:block"><div className="orb"><span className="ring-3"></span><span className="ring-4"></span></div></div>
        </div>
        <div className="container-x mt-24 pt-8" style={{ borderTop: '1px solid var(--hairline)' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="meta-mono">Sports-First Launch · 2026</div>
            <div className="meta-mono md:text-center">By Referral &amp; Consideration</div>
            <div className="meta-mono md:text-right">prooffirm.com · @prooffirm</div>
          </div>
        </div>
      </section>

      {/* THE PROOF MODEL */}
      <section className="section" style={{ background: 'var(--surface)', borderTop: '1px solid var(--hairline)' }}>
        <div className="container-x">
          <div className="eyebrow mb-8">The PROOF Model</div>
          <h2 className="display text-[48px] md:text-[88px]">Seven dimensions.<br/>One strategy.</h2>
          <p className="font-serif italic mt-12 max-w-[640px] leading-[1.55]" style={{ fontSize: 20, color: 'var(--text-muted)' }}>
            The athlete is no longer just an athlete. They are a brand, a business, a public figure, a media asset, a family anchor, a financial event, a future founder, a reputation under evaluation, a legacy in motion. PROOF coordinates all of it.
          </p>
          <ul className="meta-strip mt-20">
            {SEVEN.map(s => (
              <li className="row" key={s.n}>
                <div className="meta-mono" style={{ color: 'var(--accent)' }}>{s.n}</div>
                <div className="font-serif italic text-[28px] md:text-[36px]">{s.label}</div>
                <div></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* WHO WE SERVE */}
      <section className="section">
        <div className="container-x">
          <div className="eyebrow mb-8">Who We Serve</div>
          <h2 className="display text-[48px] md:text-[80px]">Built for athletes at every<br/>critical transition.</h2>
          <ul className="meta-strip mt-16">
            {STAGES.map(s => (
              <li className="row" key={s.n}>
                <div className="meta-mono" style={{ color: 'var(--accent)' }}>Stage {s.n}</div>
                <div className="font-serif italic text-[26px]">{s.t}</div>
                <div className="desc text-[15px] leading-[1.6]" style={{ color: 'var(--text-muted)' }}>{s.d}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* DOCTRINE */}
      <section className="section" style={{ background: 'var(--surface)' }}>
        <div className="container-narrow text-center">
          <div className="gold-rule mb-12" />
          <p className="display text-[36px] md:text-[60px] leading-[1.05]">The athlete performs.<br/>PROOF manages what performance creates.</p>
          <div className="meta-mono mt-10" style={{ color: 'var(--accent)' }}>— Firm doctrine</div>
          <div className="gold-rule mt-12" />
        </div>
      </section>

      {/* PRESS */}
      <section className="section">
        <div className="container-x">
          <div className="flex justify-between items-baseline mb-12">
            <div>
              <div className="eyebrow mb-4">Press &amp; Insights</div>
              <h2 className="display text-[40px] md:text-[64px]">Recent writing.</h2>
            </div>
            <Link to="/press" className="btn-line">All insights</Link>
          </div>
          <ul className="meta-strip">
            {posts.map(p => (
              <li key={p.id}>
                <Link to={`/press/${p.slug}`} className="row" style={{ display: 'grid' }}>
                  <div className="meta-mono" style={{ color: 'var(--accent)' }}>{(p.publish_at || p.created_at || '').slice(0,7)}</div>
                  <div className="meta-mono">{(p.categories || [])[0] || 'Insights'}</div>
                  <div className="font-serif italic text-[24px] md:text-[32px] desc">{p.title}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: 'var(--surface)', borderTop: '1px solid var(--hairline)' }}>
        <div className="container-narrow text-center">
          <div className="eyebrow mb-8">Request Consideration</div>
          <h2 className="display text-[44px] md:text-[68px]">Private management for athletes<br/>building beyond the game.</h2>
          <p className="font-serif italic mt-10 leading-[1.55]" style={{ fontSize: 20, color: 'var(--text-muted)' }}>Membership is selective. If there is alignment, PROOF will respond with next steps.</p>
          <div className="mt-12"><Link to="/contact" className="btn-line gold">Request Consideration <Arrow /></Link></div>
        </div>
      </section>
    </PublicLayout>
  );
}
