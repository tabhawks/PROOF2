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
      <section className="section">
        <div className="container-x">
          <div className="eyebrow mb-6">approach</div>
          <h1 className="display text-[56px] md:text-[100px] max-w-[1100px]">Loyalty. Privacy. Legacy.<br/>Integrity. Love. Protection.</h1>
          <p className="font-serif text-[20px] md:text-[22px] mt-10 max-w-[680px] text-[rgba(10,10,10,0.78)] leading-[1.5]">
            These are not marketing words. They are how PROOF operates.
          </p>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bone)', borderTop: '1px solid var(--gold-line)' }}>
        <div className="container-x grid md:grid-cols-2 gap-x-16 gap-y-14">
          {PILLARS.map(p => (
            <div key={p.n} className="pt-6" style={{ borderTop: '1px solid var(--gold-line)' }}>
              <div className="meta-mono mb-3">{p.n}</div>
              <div className="font-serif italic text-[28px] md:text-[34px] mb-3">{p.t}</div>
              <p className="text-[16px] leading-[1.6] text-[rgba(10,10,10,0.75)] max-w-[480px]">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <div className="eyebrow mb-6">how we work</div>
          <h2 className="display text-[40px] md:text-[64px] mb-10">Private membership.<br/>Selective intake.</h2>
          <ul className="meta-strip">
            {PROCESS.map((p, i) => (
              <li key={i} className="row">
                <div className="meta-mono">{p.split(' ')[0]}</div>
                <div className="font-serif italic text-[20px]">{p.split(' ').slice(1).join(' ')}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--obsidian)', color: 'var(--ivory)' }}>
        <div className="container-narrow text-center">
          <h2 className="display text-[36px] md:text-[56px] mb-10">Aligned principles.<br/>Coordinated execution.</h2>
          <Link to="/contact" className="btn-line gold">begin a private conversation</Link>
        </div>
      </section>
    </PublicLayout>
  );
}
