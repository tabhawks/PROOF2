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
      <section className="section">
        <div className="container-x">
          <div className="eyebrow mb-6">strategic &amp; family advisory</div>
          <h1 className="display text-[56px] md:text-[104px] max-w-[1100px]">Love without structure<br/>becomes pressure.</h1>
          <p className="font-serif text-[20px] md:text-[24px] mt-12 max-w-[760px] leading-[1.5] text-[rgba(10,10,10,0.78)]">
            PROOF helps families step into a new role — coordinating support, slowing down opportunity pressure, and protecting what matters before it is at risk.
          </p>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bone)', borderTop: '1px solid var(--gold-line)' }}>
        <div className="container-narrow">
          <p className="font-serif text-[22px] md:text-[28px] leading-[1.4] italic">
            Success changes the pressure around an athlete. PROOF helps create structure where firms typically wait until problems appear.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <ul className="meta-strip">
            {PILLARS.map((p, i) => (
              <li key={i} className="row">
                <div className="meta-mono">{String(i + 1).padStart(2, '0')}</div>
                <div className="font-serif italic text-[20px]">{p}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--obsidian)', color: 'var(--ivory)' }}>
        <div className="container-narrow text-center">
          <p className="display text-[36px] md:text-[56px] mb-8">Protection begins before the money arrives.</p>
          <h2 className="display text-[28px] md:text-[40px] mb-10">A private conversation, no commitment.</h2>
          <Link to="/contact" className="btn-line gold">request consideration</Link>
        </div>
      </section>
    </PublicLayout>
  );
}
