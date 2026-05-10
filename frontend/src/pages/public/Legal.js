import React from 'react';
import PublicLayout from '@/components/site/PublicLayout';

export default function Legal() {
  return (
    <PublicLayout>
      <section className="section">
        <div className="container-narrow">
          <div className="eyebrow mb-6">legal</div>
          <h1 className="display text-[56px] md:text-[88px]">Privacy &amp; Disclosures.</h1>
          <p className="font-serif text-[20px] mt-10 leading-[1.55] text-[rgba(10,10,10,0.78)]">
            PROOF is a private management and strategic advisory firm. PROOF does not act as a registered athlete agent in jurisdictions where registration is required, does not provide legal advice, does not offer investment advice, and does not act as a fiduciary in financial matters. PROOF works alongside the licensed professionals an athlete already retains.
          </p>
          <h2 id="privacy" className="display text-[36px] mt-16 mb-4">Privacy</h2>
          <p className="font-serif text-[18px] leading-[1.55] text-[rgba(10,10,10,0.78)]">
            Information shared with PROOF in the course of consideration or membership is treated as private and confidential. We do not sell, share, or otherwise disclose Member information without consent, except where compelled by law.
          </p>
          <h2 id="disclosures" className="display text-[36px] mt-16 mb-4">Eligibility</h2>
          <p className="font-serif text-[18px] leading-[1.55] text-[rgba(10,10,10,0.78)]">
            PROOF advisory services are educational and strategic. PROOF does not make NIL eligibility determinations and recommends Members independently consult with their institution’s compliance office and qualified counsel.
          </p>
          <div className="meta-mono mt-16">last updated: may 2026</div>
        </div>
      </section>
    </PublicLayout>
  );
}
