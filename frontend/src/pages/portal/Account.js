import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api, setToken } from '@/lib/api';
import TwoFactorPanel from '@/components/auth/TwoFactorPanel';

export default function PortalAccount() {
  const { user, refresh, signOutAll } = useAuth();
  const [phone, setPhone] = useState(user?.phone || '');
  const [name, setName] = useState(user?.name || '');
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const save = async (e) => {
    e.preventDefault(); setMsg(''); setErr('');
    try { await api.patch(`/admin/users/${user.id}`, { name, phone }); await refresh(); setMsg('Saved.'); }
    catch (e) { setErr(e?.response?.data?.detail || 'failed'); }
  };
  const changePw = async (e) => {
    e.preventDefault(); setMsg(''); setErr('');
    try {
      const { data } = await api.post('/auth/password-reset', { current_password: pwCurrent, new_password: pwNew });
      if (data.access_token) setToken(data.access_token);
      setPwCurrent(''); setPwNew(''); setMsg('Password changed.');
    } catch (e) { setErr(e?.response?.data?.detail || 'failed'); }
  };
  return (
    <div data-testid="portal-account">
      <div className="eyebrow mb-3">my account</div>
      <h1 className="display text-[44px] md:text-[64px] mb-10">{user?.name}</h1>
      <div className="grid md:grid-cols-2 gap-12 max-w-[1000px]">
        <form onSubmit={save}>
          <h2 className="display text-[26px] mb-4">Profile.</h2>
          <div className="mb-6"><label className="meta-mono">name</label><input className="input-line mt-2" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="mb-6"><label className="meta-mono">email</label><input className="input-line mt-2 text-[rgba(10,10,10,0.5)]" value={user?.email} disabled /></div>
          <div className="mb-6"><label className="meta-mono">phone</label><input className="input-line mt-2" value={phone} onChange={e => setPhone(e.target.value)} /></div>
          <button className="btn-line">save</button>
        </form>
        <div>
          <h2 className="display text-[26px] mb-4">Password.</h2>
          <form onSubmit={changePw}>
            <div className="mb-6"><label className="meta-mono">current password</label><input type="password" className="input-line mt-2" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} /></div>
            <div className="mb-6"><label className="meta-mono">new password</label><input type="password" minLength={8} className="input-line mt-2" value={pwNew} onChange={e => setPwNew(e.target.value)} /></div>
            <button className="btn-line">change password</button>
          </form>
          <h3 className="display text-[22px] mt-12 mb-3">Sessions.</h3>
          <button onClick={signOutAll} className="btn-line">sign out all sessions</button>
        </div>
      </div>
      {msg && <div className="mt-6 meta-mono" style={{ color: 'var(--gold)' }}>{msg}</div>}
      {err && <div className="mt-6 text-red-700">{err}</div>}
      <div className="mt-12 max-w-[800px] pt-8" style={{ borderTop: '1px solid var(--gold-line)' }}>
        <TwoFactorPanel />
      </div>
    </div>
  );
}
