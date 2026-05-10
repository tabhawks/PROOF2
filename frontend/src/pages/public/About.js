import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '@/components/site/PublicLayout';

const LEADERS = [
  { name: '[Founder Name]', role: 'Founder & Managing Principal', bio: 'Brief biography. Two or three lines that establish the operator behind the firm.' },
  { name: '[Principal Name]', role: 'Principal, Sports Practice', bio: 'Brief biography. Two or three lines.' },
  { name: '[Counsel Name]', role: 'Counsel, Reputation & Risk', bio: 'Brief biography. Two or three lines.' },
];

export default function About() {
  return (
    <PublicLayout>
      <section className="section" style={{ paddingTop: 120 }}>
        <div className="container-x">
          <div className="eyebrow mb-8">About PROOF</div>
          <h1 className="display text-[60px] md:text-[112px]" style={{ lineHeight: 0.98 }}>A firm built<br/>on <span className="gold">discretion.</span></h1>
          <p className="font-serif italic mt-12 max-w-[760px] leading-[1.5]" style={{ fontSize: 22, color: 'var(--text-muted)' }}>
            PROOF is a private athlete management and strategic advisory firm. Sports is the launch division. The long game is larger.
          </p>
        </div>
      </section>
      <section className="section" style={{ background: 'var(--surface)' }}>
        <div className="container-x">
          <div className="eyebrow mb-6">Leadership</div>
          <h2 className="display text-[40px] md:text-[64px] mb-12">A small team, by design.</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {LEADERS.map(l => (
              <div key={l.name} className="pt-6" style={{ borderTop: '1px solid var(--hairline)' }}>
                <div className="font-serif italic text-[30px] mb-2">{l.name}</div>
                <div className="meta-mono mb-4" style={{ color: 'var(--accent)' }}>{l.role}</div>
                <p className="text-[15px] leading-[1.7]" style={{ color: 'var(--text-muted)' }}>{l.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container-narrow text-center">
          <p className="display text-[36px] md:text-[60px]">We do not announce.<br/>We <span className="gold">deliver.</span></p>
          <div className="gold-rule my-12" />
          <Link to="/contact" className="btn-line gold">Request Consideration <span className="arrow">→</span></Link>
        </div>
      </section>
    </PublicLayout>
  );
}
