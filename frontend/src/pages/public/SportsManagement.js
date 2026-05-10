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
      <section className="section" style={{ paddingTop: 120 }}>
        <div className="container-x">
          <div className="eyebrow mb-8">Sports &amp; Athlete Management</div>
          <h1 className="display text-[60px] md:text-[112px]" style={{ lineHeight: 0.98 }}>You are the asset.<br/>We are the <span className="gold">infrastructure.</span></h1>
          <p className="font-serif italic mt-12 max-w-[720px] leading-[1.5]" style={{ fontSize: 22, color: 'var(--text-muted)' }}>
            Private management for elite athletes — from college and pre-draft through professional and post-career.
          </p>
        </div>
      </section>
      <section className="section" style={{ background: 'var(--surface)' }}>
        <div className="container-x">
          <ul className="meta-strip">
            {STAGES.map(s => (
              <li className="row" key={s.n}>
                <div className="meta-mono" style={{ color: 'var(--accent)' }}>{s.n}</div>
                <div className="font-serif italic text-[26px] md:text-[34px]">{s.t}</div>
                <div className="desc text-[15px] leading-[1.6] max-w-[460px]" style={{ color: 'var(--text-muted)' }}>{s.d}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section">
        <div className="container-narrow text-center">
          <p className="display text-[36px] md:text-[60px]">You handle the field.<br/>We handle <span className="gold">everything else.</span></p>
          <div className="gold-rule my-14" />
          <h2 className="display text-[28px] md:text-[40px] mb-10">If you are building beyond the game,<br/>you need infrastructure.</h2>
          <Link to="/contact" className="btn-line gold">Request Consideration <span className="arrow">→</span></Link>
        </div>
      </section>
    </PublicLayout>
  );
}
