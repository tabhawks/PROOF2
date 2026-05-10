import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { api, setToken } from '@/lib/api';

export default function Login() {
  const { user, isStaff, isMember, refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('credentials'); // credentials | 2fa | setup_2fa
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [setupStatus, setSetupStatus] = useState(null);
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => { api.get('/auth/setup-status').then(({data}) => setSetupStatus(data)).catch(()=>{}); }, []);

  useEffect(() => {
    if (user) {
      const target = loc.state?.from || (isStaff ? '/admin' : '/portal');
      nav(target, { replace: true });
    }
  }, [user, isStaff, isMember, nav, loc.state]);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const { data } = await api.post('/auth/2fa/login', { email, password, code: code || undefined });
      setToken(data.access_token);
      await refresh();
      const target = loc.state?.from || (['athlete','family','agent','counsel'].includes(data.user.role) ? '/portal' : '/admin');
      nav(target, { replace: true });
    } catch (e) {
      const detail = e?.response?.data?.detail;
      if (detail && typeof detail === 'object' && detail.requires_2fa) { setStep('2fa'); setErr(code ? 'invalid code' : ''); }
      else if (detail && typeof detail === 'object' && detail.must_setup_2fa) { setErr('2FA setup required — first sign in once with the legacy login, then enable 2FA in your account.'); setStep('credentials'); }
      else { setErr(typeof detail === 'string' ? detail : 'login failed'); }
    } finally { setBusy(false); }
  };

  return (
    <div data-testid="login-page" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', background: 'var(--ivory)' }} className="max-md:grid-cols-1">
      <div className="hidden md:flex flex-col justify-between p-12" style={{ background: 'var(--obsidian)', color: 'var(--ivory)' }}>
        <Link to="/" className="flex items-baseline gap-3">
          <span className="font-serif italic text-[24px]">PROOF</span>
          <span className="meta-mono on-dark">— private athlete management</span>
        </Link>
        <div>
          <p className="display text-[40px] leading-[1.1]">Loyalty. Privacy. Legacy. Integrity. Love. Protection.</p>
          <div className="gold-rule mt-10" />
          <div className="meta-mono on-dark mt-4">PROOF™ · EDITION 2026.01 · NEW YORK · LONDON</div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-[420px]">
          <div className="eyebrow mb-3">member sign in</div>
          <h1 className="display text-[42px] mb-8">{step === '2fa' ? 'Verify identity.' : 'Welcome back.'}</h1>
          {setupStatus && !setupStatus.owner_exists && (
            <div className="mb-8 p-4 border border-[var(--gold-line)] bg-[rgba(200,169,106,0.08)]">
              <div className="meta-mono mb-2">first run</div>
              <p className="font-serif text-[16px] mb-3">No owner has been claimed for this firm. Begin onboarding.</p>
              <Link data-testid="go-onboarding" to="/onboarding" className="btn-line">claim ownership</Link>
            </div>
          )}
          <form onSubmit={submit} data-testid="login-form">
            {step === 'credentials' && <>
              <div className="mb-8"><label className="meta-mono">email</label><input data-testid="login-email" type="email" required className="input-line mt-2" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div className="mb-8"><label className="meta-mono">password</label><input data-testid="login-password" type="password" required className="input-line mt-2" value={password} onChange={e => setPassword(e.target.value)} /></div>
            </>}
            {step === '2fa' && <>
              <div className="mb-2 meta-mono">signing in as: {email}</div>
              <div className="mb-8"><label className="meta-mono">authenticator code</label><input data-testid="login-2fa-code" autoFocus required className="input-line mt-2" value={code} onChange={e => setCode(e.target.value)} placeholder="6-digit code" /></div>
            </>}
            {err && <div className="text-red-700 text-[13px] mb-4">{err}</div>}
            <button data-testid="login-submit" className="btn-line gold w-full justify-center" disabled={busy}>{busy ? 'signing in…' : (step === '2fa' ? 'verify code' : 'sign in')}</button>
            {step === '2fa' && <button type="button" onClick={() => { setStep('credentials'); setCode(''); setErr(''); }} className="meta-mono link-underline mt-4 block">use different account</button>}
          </form>
          <div className="mt-10 meta-mono text-[rgba(10,10,10,0.6)]">
            invite-only. <Link to="/contact" className="link-underline">request consideration</Link>
          </div>
          <div className="mt-12 p-4 border border-[var(--gold-line)] text-[12px] font-mono leading-[1.7]">
            <div className="meta-mono mb-2">test credentials · password: Proof2026!</div>
            owner@proof.firm · admin@proof.firm · editor@proof.firm · strategist@proof.firm<br/>
            devon@member.proof · amara@member.proof · helena@member.proof · lena@agent.proof
          </div>
        </div>
      </div>
    </div>
  );
}
