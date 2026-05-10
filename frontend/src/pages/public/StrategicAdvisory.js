import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '@/components/site/PublicLayout';

const PILLARS = [
  'Slow down opportunity pressure',
  'Understand risk',
  'Ask better questions',
  'Avoid preventable mistakes',
  'Coordinate the right professionals',
  'Protect eligibility & reputation',
  'Support the athlete without carrying it alone',
];

export default function StrategicAdvisory() {
  return (
    <PublicLayout>
      <section className="section" style={{ paddingTop: 120 }}>
        <div className="container-x">
          <div className="eyebrow mb-8">Family Advisory</div>
          <h1 className="display text-[60px] md:text-[112px]" style={{ lineHeight: 0.98 }}>Love without structure<br/>becomes <span className="gold">pressure.</span></h1>
          <p className="font-serif italic mt-12 max-w-[760px] leading-[1.5]" style={{ fontSize: 22, color: 'var(--text-muted)' }}>
            PROOF helps families step into a new role — coordinating support, slowing down opportunity pressure, and protecting what matters before it is at risk.
          </p>
        </div>
      </section>
      <section className="section" style={{ background: 'var(--surface)' }}>
        <div className="container-narrow">
          <p className="font-serif italic text-[26px] md:text-[34px] leading-[1.4]">
            Success changes the pressure around an athlete. PROOF helps create structure where firms typically wait until problems appear.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container-x">
          <ul className="meta-strip">
            {PILLARS.map((p, i) => (
              <li className="row" key={i}>
                <div className="meta-mono" style={{ color: 'var(--accent)' }}>{String(i + 1).padStart(2, '0')}</div>
                <div className="font-serif italic text-[22px] md:text-[28px]">{p}</div>
                <div></div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section" style={{ background: 'var(--surface)' }}>
        <div className="container-narrow text-center">
          <p className="display text-[36px] md:text-[56px] mb-10">Protection begins before<br/>the <span className="gold">money arrives.</span></p>
          <h2 className="display text-[28px] md:text-[40px] mb-10">A private conversation, no commitment.</h2>
          <Link to="/contact" className="btn-line gold">Request Consideration <span className="arrow">→</span></Link>
        </div>
      </section>
    </PublicLayout>
  );
}
