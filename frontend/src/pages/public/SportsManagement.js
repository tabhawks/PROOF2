import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '@/components/site/PublicLayout';

const STAGES = [
  { n: '01', t: 'High School & Family', d: 'Eligibility, recruiting visibility, and early structure.' },
  { n: '02', t: 'College & NIL', d: 'Brand decisions, advisor exposure, first contracts.' },
  { n: '03', t: 'Pre-Draft', d: 'Agent selection, brand launch, reputation baseline.' },
  { n: '04', t: 'Professional', d: 'Brand, business, reputation, private operations.' },
  { n: '05', t: 'Post-Career', d: 'Identity, ownership, broadcasting, foundation.' },
  { n: '06', t: 'Legacy', d: 'Family wealth, long-term architecture, next 50 years.' },
];

export default function SportsManagement() {
  return (
    <PublicLayout>
      <section className="section">
        <div className="container-x">
          <div className="eyebrow mb-6">sports &amp; athlete management</div>
          <h1 className="display text-[56px] md:text-[104px] max-w-[1100px]">You are the asset.<br/>We are the infrastructure.</h1>
          <p className="font-serif text-[20px] md:text-[24px] mt-12 max-w-[760px] leading-[1.5] text-[rgba(10,10,10,0.78)]">
            Private management for elite athletes — from college and pre-draft through professional and post-career.
          </p>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bone)', borderTop: '1px solid var(--gold-line)' }}>
        <div className="container-x grid md:grid-cols-3 gap-x-12 gap-y-12">
          {STAGES.map(s => (
            <div key={s.n} className="pt-6" style={{ borderTop: '1px solid var(--gold-line)' }}>
              <div className="meta-mono mb-3">stage {s.n}</div>
              <div className="font-serif italic text-[26px] mb-3">{s.t}</div>
              <p className="text-[15px] text-[rgba(10,10,10,0.72)] leading-[1.6]">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ background: 'var(--obsidian)', color: 'var(--ivory)' }}>
        <div className="container-narrow text-center">
          <p className="display text-[36px] md:text-[60px]">You handle the field.<br/>We handle everything else.</p>
          <div className="gold-rule my-14" />
          <h2 className="display text-[28px] md:text-[40px] mb-10">If you are building beyond the game,<br/>you need infrastructure.</h2>
          <Link to="/contact" className="btn-line gold">request consideration</Link>
        </div>
      </section>
    </PublicLayout>
  );
}
