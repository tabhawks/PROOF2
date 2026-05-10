import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const SLIDES = [
  { eyebrow: 'edition 2026.01', title: 'PROOF', subtitle: 'Private Athlete Management' },
  { eyebrow: 'doctrine', title: 'Surrounded is not\nthe same as protected.', subtitle: 'PROOF is the strategy layer between an athlete and the world.' },
  { eyebrow: 'firm', title: 'A private command center.', subtitle: 'Sports-first launch · 2026' },
  { eyebrow: 'thesis', title: 'Athletes are no longer\njust athletes.', subtitle: 'Brand, business, public figure, family anchor, financial event, future founder, reputation, legacy.' },
  { eyebrow: 'the model', title: 'Seven dimensions.\nOne strategy.', subtitle: '01 Person · 02 Career · 03 Brand · 04 Business · 05 Reputation · 06 Lifestyle · 07 Legacy' },
  { eyebrow: 'practice', title: 'Sports & Athlete Management', subtitle: 'You are the asset. We are the infrastructure.' },
  { eyebrow: 'practice', title: 'Sports Advisory', subtitle: 'Programs. Athletic departments. Sports businesses.' },
  { eyebrow: 'practice', title: 'Strategic Advisory', subtitle: 'Founders. Principals. Family offices.' },
  { eyebrow: 'audience', title: 'High School & Family', subtitle: 'Eligibility, recruiting visibility, early structure.' },
  { eyebrow: 'audience', title: 'College & NIL', subtitle: 'First contracts. First brand. First exposure.' },
  { eyebrow: 'audience', title: 'Pre-Draft', subtitle: 'Agent selection. Brand launch. Reputation baseline.' },
  { eyebrow: 'audience', title: 'Professional', subtitle: 'Brand, business, reputation, private operations.' },
  { eyebrow: 'audience', title: 'Post-Career', subtitle: 'Identity. Ownership. Broadcasting. Foundation.' },
  { eyebrow: 'audience', title: 'Legacy', subtitle: 'Family wealth. Long-term architecture. Next 50 years.' },
  { eyebrow: 'principle', title: 'Loyalty.', subtitle: 'We are in the Member’s corner.' },
  { eyebrow: 'principle', title: 'Privacy.', subtitle: 'What is private stays protected.' },
  { eyebrow: 'principle', title: 'Legacy.', subtitle: 'We manage for the next 50 years.' },
  { eyebrow: 'principle', title: 'Integrity.', subtitle: 'We tell the truth early enough to protect the future.' },
  { eyebrow: 'principle', title: 'Love.', subtitle: 'We care about the person behind the performance.' },
  { eyebrow: 'principle', title: 'Protection.', subtitle: 'We protect what success makes vulnerable.' },
  { eyebrow: 'process', title: 'Selective intake.', subtitle: '01 Request Consideration · 02 Discovery · 03 Fit Review' },
  { eyebrow: 'process', title: 'Membership.', subtitle: '04 Proposal · 05 Covenant · 06 Strategic Plan' },
  { eyebrow: 'process', title: 'Continuity.', subtitle: '07 Ongoing Management — long-arc, low-noise.' },
  { eyebrow: 'doctrine', title: 'Most firms manage a lane.\nPROOF manages the architecture.', subtitle: '— firm doctrine' },
  { eyebrow: 'voice', title: 'Silence is a strategy when chosen.', subtitle: 'A liability when it is panic.' },
  { eyebrow: 'voice', title: 'A contract makes you rich.\nOwnership keeps you wealthy.', subtitle: 'From earned income to owned outcomes.' },
  { eyebrow: 'request', title: 'A private conversation.', subtitle: 'private@prooffirm.com · by referral & consideration' },
];

export default function Deck() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [idx, setIdx] = useState(0);
  // Simple gating: token presence required. Token validity is fine (any value ok in this build), reflective of “signed link” UX.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') setIdx(i => Math.min(i + 1, SLIDES.length - 1));
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--obsidian)', color: 'var(--ivory)' }}>
        <div className="text-center">
          <div className="eyebrow on-dark mb-3">access required</div>
          <h1 className="display text-[56px]">This deck is private.</h1>
          <p className="font-serif text-[18px] mt-6 text-[rgba(245,241,234,0.7)]">Open with a signed link.</p>
          <Link to="/contact" className="btn-line gold mt-10 inline-flex">request access</Link>
        </div>
      </div>
    );
  }
  const s = SLIDES[idx];
  return (
    <div data-testid="deck" style={{ minHeight: '100vh', background: 'var(--obsidian)', color: 'var(--ivory)', display: 'grid', gridTemplateRows: '60px 1fr 80px' }}>
      <header className="flex items-center justify-between px-8 border-b border-[var(--gold-line)]">
        <div className="flex items-baseline gap-3"><span className="font-serif italic text-[20px]">PROOF</span><span className="meta-mono on-dark">brand deck</span></div>
        <div className="meta-mono on-dark">slide {String(idx+1).padStart(2,'0')} / {String(SLIDES.length).padStart(2,'0')}</div>
      </header>
      <main className="flex items-center justify-center px-12">
        <div className="max-w-[1100px] text-center">
          <div className="eyebrow on-dark mb-8">{s.eyebrow}</div>
          <h1 className="display text-[56px] md:text-[120px] leading-[1.0] whitespace-pre-line">{s.title}</h1>
          {s.subtitle && <p className="font-serif text-[20px] md:text-[24px] mt-12 text-[rgba(245,241,234,0.75)] leading-[1.5] max-w-[760px] mx-auto">{s.subtitle}</p>}
        </div>
      </main>
      <footer className="flex items-center justify-between px-8 border-t border-[var(--gold-line)]">
        <button className="btn-line dark" onClick={() => setIdx(i => Math.max(i-1, 0))} disabled={idx === 0}>previous</button>
        <div className="meta-mono on-dark">PROOF™ · EDITION 2026.01 · NEW YORK · LONDON</div>
        <button className="btn-line dark" onClick={() => setIdx(i => Math.min(i+1, SLIDES.length-1))} disabled={idx === SLIDES.length-1}>next</button>
      </footer>
    </div>
  );
}
