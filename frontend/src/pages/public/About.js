import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '@/components/site/PublicLayout';

const LEADERS = [
  { name: 'Marcus Hale', role: 'Founder & Managing Principal', bio: 'Built the firm around a single principle: continuity over noise. Two decades of private operations across sport, brand, and family enterprise.' },
  { name: 'Eleanor Stone', role: 'Principal, Sports Practice', bio: 'Leads athlete management and strategist coordination. Former lead of a private athletic enterprise group, now translating it into a discreet membership model.' },
  { name: 'Tomas Reyes', role: 'Counsel, Reputation & Risk', bio: 'Specializes in reputation, sensitive matter navigation, and the quiet hours after public events. Member of the bar; never the spokesperson.' },
];

export default function About() {
  return (
    <PublicLayout>
      <section className="section">
        <div className="container-x">
          <div className="eyebrow mb-6">about proof</div>
          <h1 className="display text-[56px] md:text-[104px] max-w-[1100px]">A firm built<br/>on discretion.</h1>
          <p className="font-serif text-[20px] md:text-[24px] mt-12 max-w-[760px] leading-[1.5] text-[rgba(10,10,10,0.78)]">
            PROOF is a private athlete management and strategic advisory firm. Sports is the launch division. The long game is larger.
          </p>
        </div>
      </section>

      <section className="section" style={{ borderTop: '1px solid var(--gold-line)' }}>
        <div className="container-x">
          <div className="eyebrow mb-6">leadership</div>
          <h2 className="display text-[36px] md:text-[56px] mb-12">A small team, by design.</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {LEADERS.map(l => (
              <div key={l.name} className="pt-6" style={{ borderTop: '1px solid var(--gold-line)' }}>
                <div className="font-serif italic text-[28px] mb-2">{l.name}</div>
                <div className="meta-mono mb-4">{l.role}</div>
                <p className="text-[15px] text-[rgba(10,10,10,0.72)] leading-[1.65]">{l.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--obsidian)', color: 'var(--ivory)' }}>
        <div className="container-narrow text-center">
          <p className="display text-[36px] md:text-[60px]">We do not announce. We deliver.</p>
          <div className="gold-rule my-12" />
          <Link to="/contact" className="btn-line gold">request consideration</Link>
        </div>
      </section>
    </PublicLayout>
  );
}
