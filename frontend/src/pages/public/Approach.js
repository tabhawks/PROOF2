import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '@/components/site/PublicLayout';

const PILLARS = [
  { n: '01', t: 'Loyalty', d: 'We are in the Member’s corner.' },
  { n: '02', t: 'Privacy', d: 'What is private stays protected.' },
  { n: '03', t: 'Legacy', d: 'We manage for the next 50 years.' },
  { n: '04', t: 'Integrity', d: 'We tell the truth early enough to protect the future.' },
  { n: '05', t: 'Love', d: 'We care about the person behind the performance.' },
  { n: '06', t: 'Protection', d: 'We protect what success makes vulnerable.' },
];

const PROCESS = [
  '01 Request Consideration', '02 Discovery Conversation', '03 Fit Review',
  '04 Membership Proposal', '05 Covenant & Onboarding', '06 Strategic Plan', '07 Ongoing Management',
];

export default function Approach() {
  return (
    <PublicLayout>
      <section className="section" style={{ paddingTop: 120 }}>
        <div className="container-x">
          <div className="eyebrow mb-8">Approach</div>
          <h1 className="display text-[56px] md:text-[104px]" style={{ lineHeight: 1.0 }}>Loyalty. Privacy. Legacy.<br/>Integrity. Love. <span className="gold">Protection.</span></h1>
          <p className="font-serif italic mt-12 max-w-[680px] leading-[1.5]" style={{ fontSize: 22, color: 'var(--text-muted)' }}>
            These are not marketing words. They are how PROOF operates.
          </p>
        </div>
      </section>
      <section className="section" style={{ background: 'var(--surface)' }}>
        <div className="container-x">
          <ul className="meta-strip">
            {PILLARS.map(p => (
              <li className="row" key={p.n}>
                <div className="meta-mono" style={{ color: 'var(--accent)' }}>{p.n}</div>
                <div className="font-serif italic text-[28px] md:text-[40px]">{p.t}</div>
                <div className="desc text-[15px] leading-[1.6] max-w-[460px]" style={{ color: 'var(--text-muted)' }}>{p.d}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section">
        <div className="container-x">
          <div className="eyebrow mb-6">How we work</div>
          <h2 className="display text-[40px] md:text-[64px] mb-12">Private membership.<br/>Selective intake. Strategic management.</h2>
          <ul className="meta-strip">
            {PROCESS.map((p, i) => (
              <li className="row" key={i}>
                <div className="meta-mono" style={{ color: 'var(--accent)' }}>{p.split(' ')[0]}</div>
                <div className="font-serif italic text-[22px] md:text-[28px]">{p.split(' ').slice(1).join(' ')}</div>
                <div></div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section" style={{ background: 'var(--surface)' }}>
        <div className="container-narrow text-center">
          <h2 className="display text-[36px] md:text-[60px] mb-12">Aligned principles.<br/>Coordinated <span className="gold">execution.</span></h2>
          <Link to="/contact" className="btn-line gold">Begin a private conversation <span className="arrow">→</span></Link>
        </div>
      </section>
    </PublicLayout>
  );
}
