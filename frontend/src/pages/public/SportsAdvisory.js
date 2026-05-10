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
      <section className="section" style={{ paddingTop: 120 }}>
        <div className="container-x">
          <div className="eyebrow mb-8">Sports Advisory</div>
          <h1 className="display text-[60px] md:text-[112px]" style={{ lineHeight: 0.98 }}>Athlete development<br/>has <span className="gold">changed.</span></h1>
          <p className="font-serif italic mt-12 max-w-[720px] leading-[1.5]" style={{ fontSize: 22, color: 'var(--text-muted)' }}>
            PROOF Sports Advisory partners with programs, athletic departments, and sports businesses to build the enterprise layer their athletes will need on day one.
          </p>
        </div>
      </section>
      <section className="section" style={{ background: 'var(--surface)' }}>
        <div className="container-x grid md:grid-cols-2 gap-12">
          <div>
            <div className="eyebrow mb-6">For programs &amp; athletic businesses</div>
            <h2 className="display text-[36px] md:text-[60px]">Your athletes are becoming brands whether your program prepares them or not.</h2>
          </div>
          <ul className="meta-strip">
            {SERVICES.map((s, i) => (
              <li className="row" key={i}>
                <div className="meta-mono" style={{ color: 'var(--accent)' }}>{String(i + 1).padStart(2, '0')}</div>
                <div className="font-serif italic text-[22px]">{s}</div>
                <div></div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section">
        <div className="container-narrow text-center">
          <h2 className="display text-[36px] md:text-[60px] mb-12">Inquire about an<br/>advisory engagement.</h2>
          <Link to="/contact" className="btn-line gold">Request Consideration <span className="arrow">→</span></Link>
        </div>
      </section>
    </PublicLayout>
  );
}
