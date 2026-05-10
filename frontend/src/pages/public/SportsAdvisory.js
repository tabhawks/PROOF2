import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '@/components/site/PublicLayout';

const SERVICES = [
  'NIL education & family programming',
  'Athlete enterprise curriculum',
  'Reputation readiness training',
  'Brand & media literacy',
  'Business infrastructure',
  'Operational advisory',
  'Strategic growth planning',
];

export default function SportsAdvisory() {
  return (
    <PublicLayout>
      <section className="section">
        <div className="container-x">
          <div className="eyebrow mb-6">sports advisory</div>
          <h1 className="display text-[56px] md:text-[104px] max-w-[1100px]">Athlete development<br/>has changed.</h1>
          <p className="font-serif text-[20px] md:text-[24px] mt-12 max-w-[760px] leading-[1.5] text-[rgba(10,10,10,0.78)]">
            PROOF Sports Advisory partners with programs, athletic departments, and sports businesses to build the enterprise layer their athletes will need on day one.
          </p>
        </div>
      </section>

      <section className="section" style={{ borderTop: '1px solid var(--gold-line)' }}>
        <div className="container-x grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="eyebrow mb-4">for programs &amp; athletic businesses</div>
            <h2 className="display text-[36px] md:text-[56px]">Your athletes are becoming brands whether your program prepares them or not.</h2>
          </div>
          <ul className="meta-strip">
            {SERVICES.map((s, i) => (
              <li key={i} className="row">
                <div className="meta-mono">{String(i + 1).padStart(2, '0')}</div>
                <div className="font-serif italic text-[20px]">{s}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--obsidian)', color: 'var(--ivory)' }}>
        <div className="container-narrow text-center">
          <h2 className="display text-[36px] md:text-[56px] mb-10">Inquire about an advisory engagement.</h2>
          <Link to="/contact" className="btn-line gold">request consideration</Link>
        </div>
      </section>
    </PublicLayout>
  );
}
