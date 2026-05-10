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
      <section className="section" style={{ paddingTop: 120 }}>
        <div className="container-x">
          <div className="eyebrow mb-8">What We Do</div>
          <h1 className="display text-[60px] md:text-[112px]" style={{ lineHeight: 0.98 }}>The private command center<br/>behind public <span className="gold">excellence.</span></h1>
          <p className="font-serif italic mt-12 max-w-[720px] leading-[1.5]" style={{ fontSize: 22, color: 'var(--text-muted)' }}>
            PROOF helps athletes make better decisions, avoid preventable risk, build stronger brands, coordinate the right advisors, evaluate opportunities, and plan beyond the game.
          </p>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--surface)', borderTop: '1px solid var(--hairline)' }}>
        <div className="container-x">
          <ul className="meta-strip">
            {PRACTICES.map(p => (
              <li className="row" key={p.n}>
                <div className="meta-mono" style={{ color: 'var(--accent)' }}>{p.n}</div>
                <div className="font-serif italic text-[28px] md:text-[36px]">{p.t}</div>
                <div className="desc text-[15px] leading-[1.65] max-w-[460px]" style={{ color: 'var(--text-muted)' }}>{p.d}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container-narrow text-center">
          <p className="display text-[40px] md:text-[68px]">Most firms manage a lane.<br/>PROOF manages the <span className="gold">architecture.</span></p>
          <div className="gold-rule my-14" />
          <h2 className="display text-[28px] md:text-[44px] mb-12">A coordinated strategy<br/>across all seven dimensions.</h2>
          <Link to="/contact" className="btn-line gold">Begin a private conversation <span className="arrow">→</span></Link>
        </div>
      </section>
    </PublicLayout>
  );
}
