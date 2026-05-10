import React, { useState } from 'react';
import PublicLayout from '@/components/site/PublicLayout';
import { api } from '@/lib/api';

export default function Contact() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', inquiring_as: 'Athlete', message: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setStatus('submitting'); setError('');
    try {
      await api.post('/ops/inquiries', form);
      setStatus('success');
    } catch (e) {
      setStatus('error');
      setError(e?.response?.data?.detail || 'Submission failed');
    }
  };

  if (status === 'success') {
    return (
      <PublicLayout>
        <section className="section" style={{ minHeight: '70vh' }}>
          <div className="container-narrow text-center">
            <div className="eyebrow mb-8">received</div>
            <h1 className="display text-[48px] md:text-[80px]">Thank you.</h1>
            <p className="font-serif text-[20px] md:text-[24px] mt-10 text-[rgba(10,10,10,0.78)] leading-[1.5]">A partner will review your inquiry. If there is alignment, PROOF will respond with next steps.</p>
          </div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="section">
        <div className="container-x grid md:grid-cols-2 gap-16">
          <div>
            <div className="eyebrow mb-6">request consideration</div>
            <h1 className="display text-[56px] md:text-[88px] leading-[1.0]">A private<br/>conversation.</h1>
            <p className="font-serif text-[20px] md:text-[22px] mt-10 text-[rgba(10,10,10,0.78)] max-w-[520px] leading-[1.5]">
              Membership is selective. Tell us a little about who you are and what you are managing. If there is alignment, PROOF will respond with next steps.
            </p>
            <div className="meta-strip mt-14 max-w-[480px]">
              <div className="row"><div className="meta-mono">email</div><div className="font-serif italic text-[18px]">private@prooffirm.com</div></div>
              <div className="row"><div className="meta-mono">intake</div><div className="font-serif italic text-[18px]">by referral &amp; consideration</div></div>
              <div className="row"><div className="meta-mono">review</div><div className="font-serif italic text-[18px]">all inquiries reviewed by a partner</div></div>
            </div>
          </div>
          <form onSubmit={submit} data-testid="inquiry-form" className="pt-2">
            <div className="grid grid-cols-2 gap-6 mb-10">
              <div>
                <label className="meta-mono">first name</label>
                <input data-testid="inq-first" required className="input-line mt-2" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <label className="meta-mono">last name</label>
                <input data-testid="inq-last" required className="input-line mt-2" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div className="mb-10">
              <label className="meta-mono">email</label>
              <input data-testid="inq-email" required type="email" className="input-line mt-2" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="mb-10">
              <label className="meta-mono">i am inquiring as</label>
              <select data-testid="inq-as" className="input-line mt-2" value={form.inquiring_as} onChange={e => setForm({ ...form, inquiring_as: e.target.value })}>
                {['Athlete','Family member','Advisor / Agent','Sports organization','Press'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="mb-10">
              <label className="meta-mono">a few sentences</label>
              <textarea data-testid="inq-message" required rows={5} className="input-line mt-2 resize-none" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
            </div>
            {error && <div className="text-red-700 text-[13px] mb-6">{error}</div>}
            <button data-testid="inq-submit" className="btn-line gold" disabled={status === 'submitting'}>{status === 'submitting' ? 'submitting…' : 'submit privately'}</button>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}
