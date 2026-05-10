import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { api, setToken } from '@/lib/api';

export default function Onboarding() {
  const { claimOwner, refresh } = useAuth();
  const [params] = useSearchParams();
  const inviteToken = params.get('invite');
  const [mode, setMode] = useState(inviteToken ? 'invite' : 'claim');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [setupStatus, setSetupStatus] = useState(null);
  const [inviteInfo, setInviteInfo] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    api.get('/auth/setup-status').then(({data}) => setSetupStatus(data)).catch(()=>{});
  }, []);
  useEffect(() => {
    if (inviteToken) {
      api.get(`/auth/invites/${inviteToken}`).then(({data}) => {
        setInviteInfo(data); setEmail(data.email); setName(data.name);
      }).catch(e => setErr(e?.response?.data?.detail || 'invalid invite'));
    }
  }, [inviteToken]);

  const onClaim = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await claimOwner(name, email, password); nav('/admin', { replace: true }); }
    catch (e) { setErr(e?.response?.data?.detail || 'failed'); } finally { setBusy(false); }
  };

  const onAccept = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const { data } = await api.post(`/auth/invites/${inviteToken}/accept?password=${encodeURIComponent(password)}`);
      setToken(data.access_token);
      await refresh();
      const role = data.user.role;
      nav(['athlete','family','agent','counsel'].includes(role) ? '/portal' : '/admin', { replace: true });
    } catch (e) { setErr(e?.response?.data?.detail || 'failed'); } finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--ivory)' }}>
      <div className="w-full max-w-[480px] p-6">
        <Link to="/" className="flex items-baseline gap-3 mb-12">
          <span className="font-serif italic text-[26px]">PROOF</span>
          <span className="meta-mono">— onboarding</span>
        </Link>
        {mode === 'claim' && (
          <>
            <div className="eyebrow mb-3">first run</div>
            <h1 className="display text-[44px] mb-3">Claim ownership.</h1>
            <p className="font-serif text-[16px] mb-10 text-[rgba(10,10,10,0.7)] leading-[1.5]">A firm must have a single Owner. Once claimed, it cannot be transferred without another Owner.</p>
            {setupStatus?.owner_exists ? (
              <div className="p-4 border border-[var(--gold-line)] bg-[rgba(200,169,106,0.08)]">
                <div className="meta-mono mb-2">already claimed</div>
                <p>This firm has an Owner. <Link to="/login" className="link-underline">Sign in</Link> instead.</p>
              </div>
            ) : (
              <form onSubmit={onClaim}>
                <div className="mb-6"><label className="meta-mono">your name</label><input required className="input-line mt-2" value={name} onChange={e => setName(e.target.value)} /></div>
                <div className="mb-6"><label className="meta-mono">email</label><input required type="email" className="input-line mt-2" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div className="mb-8"><label className="meta-mono">password (min 8)</label><input required type="password" minLength={8} className="input-line mt-2" value={password} onChange={e => setPassword(e.target.value)} /></div>
                {err && <div className="text-red-700 text-[13px] mb-4">{err}</div>}
                <button className="btn-line gold w-full justify-center" disabled={busy}>{busy ? 'claiming…' : 'claim ownership'}</button>
              </form>
            )}
          </>
        )}
        {mode === 'invite' && (
          <>
            <div className="eyebrow mb-3">membership invitation</div>
            <h1 className="display text-[44px] mb-3">Welcome.</h1>
            {inviteInfo ? (
              <p className="font-serif text-[16px] mb-8 text-[rgba(10,10,10,0.78)]">For <strong>{inviteInfo.name}</strong> &middot; {inviteInfo.email} &middot; role: {inviteInfo.role}</p>
            ) : err ? <div className="text-red-700 text-[13px] mb-4">{err}</div> : <div className="meta-mono">verifying invite…</div>}
            {inviteInfo && (
              <form onSubmit={onAccept}>
                <div className="mb-8"><label className="meta-mono">create password (min 8)</label><input required type="password" minLength={8} className="input-line mt-2" value={password} onChange={e => setPassword(e.target.value)} /></div>
                {err && <div className="text-red-700 text-[13px] mb-4">{err}</div>}
                <button className="btn-line gold w-full justify-center" disabled={busy}>{busy ? 'accepting…' : 'accept invitation'}</button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
