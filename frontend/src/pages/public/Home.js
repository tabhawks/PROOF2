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

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [athletes, setAthletes] = useState([]);
  useEffect(() => {
    api.get('/cms/posts?status=published').then(({data}) => setPosts(data.slice(0,3))).catch(()=>{});
    api.get('/ops/athletes').then(({data}) => setAthletes(data.slice(0,3))).catch(()=>{});
    api.post('/track/page-view', { path: '/' }).catch(()=>{});
  }, []);
  return (
    <PublicLayout>
      <section data-testid="home-hero" className="section" style={{ minHeight: '88vh', display: 'flex', alignItems: 'center' }}>
        <div className="container-x w-full">
          <div className="eyebrow mb-8">private athlete management</div>
          <h1 className="display text-[64px] md:text-[124px] leading-[1.0] tracking-tight max-w-[1180px]">
            Surrounded is not the same<br/>
            <span style={{ color: 'var(--gold)' }}>as protected.</span>
          </h1>
          <p className="font-serif text-[22px] md:text-[26px] mt-12 max-w-[720px] text-[rgba(10,10,10,0.75)] leading-[1.45]">
            PROOF is a private management and strategic advisory firm for elite athletes — operating as the central strategy layer behind a long career and a longer life.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <Link to="/contact" className="btn-line gold">request consideration</Link>
            <Link to="/services" className="btn-line">what we do</Link>
          </div>
          <div className="mt-16 flex flex-wrap gap-12 meta-mono">
            <span>sports-first launch · 2026</span>
            <span>by referral &amp; consideration</span>
            <span>prooffirm.com · @prooffirm</span>
          </div>
        </div>
      </section>

      <section data-testid="home-model" className="section" style={{ borderTop: '1px solid var(--gold-line)' }}>
        <div className="container-x">
          <div className="eyebrow mb-6">the proof model</div>
          <h2 className="display text-[44px] md:text-[80px] max-w-[1100px]">Seven dimensions.<br/>One strategy.</h2>
          <p className="font-serif text-[20px] md:text-[22px] mt-10 max-w-[760px] text-[rgba(10,10,10,0.78)] leading-[1.55]">
            The athlete is no longer just an athlete. They are a brand, a business, a public figure, a media asset, a family anchor, a financial event, a future founder, a reputation under evaluation, a legacy in motion. PROOF coordinates all of it.
          </p>
          <div className="meta-strip mt-16">
            {SEVEN.map(s => (
              <div className="row" key={s.n}>
                <div className="meta-mono">{s.n}</div>
                <div className="font-serif italic text-[26px]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-testid="home-stages" className="section" style={{ background: 'var(--bone)', borderTop: '1px solid var(--gold-line)' }}>
        <div className="container-x">
          <div className="eyebrow mb-6">who we serve</div>
          <h2 className="display text-[44px] md:text-[72px] max-w-[1100px]">Built for athletes at every<br/>critical transition.</h2>
          <div className="grid md:grid-cols-3 gap-x-12 gap-y-10 mt-16">
            {STAGES.map(s => (
              <div key={s.n} className="pt-6" style={{ borderTop: '1px solid var(--gold-line)' }}>
                <div className="meta-mono mb-3">stage {s.n}</div>
                <div className="font-serif italic text-[26px] mb-3">{s.t}</div>
                <p className="text-[15px] text-[rgba(10,10,10,0.7)] leading-[1.6]">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--obsidian)', color: 'var(--ivory)' }}>
        <div className="container-narrow text-center">
          <div className="gold-rule mb-12" />
          <p className="display text-[36px] md:text-[60px] leading-[1.05]">The athlete performs. PROOF manages what performance creates.</p>
          <div className="meta-mono on-dark mt-10">— firm doctrine</div>
          <div className="gold-rule mt-12" />
        </div>
      </section>

      <section data-testid="home-roster" className="section">
        <div className="container-x">
          <div className="flex justify-between items-baseline mb-12">
            <div>
              <div className="eyebrow mb-3">selected member roster</div>
              <h2 className="display text-[36px] md:text-[56px]">A small membership, by design.</h2>
            </div>
            <Link to="/athletes" className="btn-line">all members</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {athletes.map(a => (
              <Link key={a.id} to={`/athletes/${a.slug}`} className="group block">
                <div className="aspect-[4/5] overflow-hidden" style={{ background: 'var(--charcoal)' }}>
                  {a.photo_url && <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover editorial-img group-hover:scale-[1.02]" style={{ transition: 'transform .8s ease' }} />}
                </div>
                <div className="mt-4 flex justify-between items-baseline">
                  <div className="meta-mono">{a.sport}</div>
                  <div className="meta-mono">{a.status}</div>
                </div>
                <div className="font-serif italic text-[24px] mt-1">{a.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section data-testid="home-press" className="section" style={{ background: 'var(--bone)' }}>
        <div className="container-x">
          <div className="flex justify-between items-baseline mb-12">
            <div>
              <div className="eyebrow mb-3">press &amp; insights</div>
              <h2 className="display text-[36px] md:text-[56px]">Recent writing.</h2>
            </div>
            <Link to="/press" className="btn-line">all insights</Link>
          </div>
          <div className="meta-strip">
            {posts.map(p => (
              <Link key={p.id} to={`/press/${p.slug}`} className="row hover:bg-[rgba(200,169,106,0.06)] -mx-4 px-4 transition-colors">
                <div className="meta-mono">{(p.publish_at || p.created_at || '').slice(0,10)} · {(p.categories || [])[0] || 'Insights'}</div>
                <div className="font-serif italic text-[22px] md:text-[28px]">{p.title}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--obsidian)', color: 'var(--ivory)' }}>
        <div className="container-narrow text-center">
          <div className="eyebrow on-dark mb-6">request consideration</div>
          <h2 className="display text-[42px] md:text-[68px]">Private management for athletes building beyond the game.</h2>
          <p className="font-serif text-[18px] mt-8 text-[rgba(245,241,234,0.78)]">Membership is selective. If there is alignment, PROOF will respond with next steps.</p>
          <div className="mt-12"><Link to="/contact" className="btn-line gold">request consideration</Link></div>
        </div>
      </section>
    </PublicLayout>
  );
}
