import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '@/components/site/PublicLayout';

const PRACTICES = [
  { n: '01', t: 'Career Strategy', d: 'Path planning, transitions, and professional decisions over the full arc — not the next contract alone.' },
  { n: '02', t: 'Brand Architecture', d: 'Personal brand positioning, narrative, endorsements, and platform planning aligned with legacy.' },
  { n: '03', t: 'Business Development', d: 'Ownership opportunities, ventures, products, and the move from contract income to ownership wealth.' },
  { n: '04', t: 'Reputation Protection', d: 'Proactive risk review, communication discipline, sensitive matter navigation, privacy.' },
  { n: '05', t: 'Advisor Coordination', d: 'We work alongside agents, attorneys, financial advisors, publicists, and trainers — coordinating the system.' },
  { n: '06', t: 'Family Systems', d: 'Communication, requests, decision boundaries, private matters, and long-term planning.' },
];

export default function Services() {
  return (
    <PublicLayout>
      <section className="section">
        <div className="container-x">
          <div className="eyebrow mb-6">what we do</div>
          <h1 className="display text-[56px] md:text-[100px] max-w-[1100px]">The private command center<br/>behind public excellence.</h1>
          <p className="font-serif text-[20px] md:text-[24px] mt-12 max-w-[760px] text-[rgba(10,10,10,0.78)] leading-[1.5]">
            PROOF helps athletes make better decisions, avoid preventable risk, build stronger brands, coordinate the right advisors, evaluate opportunities, and plan beyond the game.
          </p>
        </div>
      </section>

      <section className="section" style={{ borderTop: '1px solid var(--gold-line)' }}>
        <div className="container-x grid md:grid-cols-2 gap-x-16 gap-y-14">
          {PRACTICES.map(p => (
            <div key={p.n} className="pt-6" style={{ borderTop: '1px solid var(--gold-line)' }}>
              <div className="meta-mono mb-3">{p.n}</div>
              <div className="font-serif italic text-[28px] md:text-[32px] mb-4">{p.t}</div>
              <p className="text-[16px] leading-[1.6] text-[rgba(10,10,10,0.75)] max-w-[520px]">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ background: 'var(--obsidian)', color: 'var(--ivory)' }}>
        <div className="container-narrow text-center">
          <div className="gold-rule mb-12" />
          <p className="display text-[40px] md:text-[64px]">Most firms manage a lane.<br/>PROOF manages the architecture.</p>
          <div className="gold-rule mt-12 mb-12" />
          <h2 className="display text-[28px] md:text-[40px] mb-10">A coordinated strategy<br/>across all seven dimensions.</h2>
          <Link to="/contact" className="btn-line gold">begin a private conversation</Link>
        </div>
      </section>
    </PublicLayout>
  );
}
