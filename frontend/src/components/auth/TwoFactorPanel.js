import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function TwoFactorPanel() {
  const { user, refresh } = useAuth();
  const [status, setStatus] = useState(null);
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const load = () => api.get('/auth/2fa/status').then(({data}) => setStatus(data));
  useEffect(() => { load(); }, [user]);

  const begin = async () => {
    setErr(''); setMsg(''); setBusy(true);
    try { const { data } = await api.post('/auth/2fa/setup'); setSetupData(data); }
    catch (e) { setErr(e?.response?.data?.detail || 'failed'); }
    finally { setBusy(false); }
  };
  const enable = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await api.post('/auth/2fa/enable', { code }); setSetupData(null); setCode(''); setMsg('Two-factor authentication enabled.'); await refresh(); load(); }
    catch (e) { setErr(e?.response?.data?.detail || 'invalid code'); }
    finally { setBusy(false); }
  };
  const disable = async () => {
    const c = window.prompt('Enter your current 6-digit authenticator code to disable 2FA:');
    if (!c) return;
    setBusy(true); setErr(''); setMsg('');
    try { await api.post('/auth/2fa/disable', { code: c }); setMsg('Two-factor authentication disabled.'); await refresh(); load(); }
    catch (e) { setErr(e?.response?.data?.detail || 'failed'); }
    finally { setBusy(false); }
  };

  if (!status) return null;
  return (
    <div data-testid="twofactor-panel">
      <h2 className="display text-[26px] mb-3">Two-factor authentication.</h2>
      <div className="meta-mono mb-4">
        status: <span style={{ color: status.enabled ? 'var(--gold)' : undefined }}>{status.enabled ? 'enabled' : 'disabled'}</span>
        {status.enforced && <span className="ml-3">· enforced by firm policy</span>}
      </div>
      {!status.enabled && !setupData && (
        <button onClick={begin} disabled={busy} data-testid="2fa-begin" className="btn-line">{busy ? 'preparing…' : 'set up authenticator'}</button>
      )}
      {!status.enabled && setupData && (
        <div className="p-5 border border-[var(--gold-line)] bg-[rgba(200,169,106,0.06)]">
          <div className="meta-mono mb-3">scan with any TOTP app (1Password, Authy, Google Authenticator)</div>
          <div className="flex gap-6 items-start">
            <img src={setupData.qr_png_data_url} alt="TOTP QR" className="w-40 h-40 bg-white p-2" />
            <div className="flex-1">
              <div className="meta-mono mb-2">or enter secret manually:</div>
              <code className="block bg-[var(--bone)] p-3 text-[12px] break-all mb-4">{setupData.secret}</code>
              <form onSubmit={enable}>
                <label className="meta-mono">enter 6-digit code from app</label>
                <input data-testid="2fa-code" required className="input-line mt-2" value={code} onChange={e => setCode(e.target.value)} placeholder="123456" />
                <div className="flex gap-3 mt-4"><button type="button" onClick={() => setSetupData(null)} className="btn-line">cancel</button><button data-testid="2fa-enable" disabled={busy} className="btn-line gold">verify &amp; enable</button></div>
              </form>
            </div>
          </div>
        </div>
      )}
      {status.enabled && (
        <div>
          <p className="font-serif text-[16px] mb-4 text-[rgba(10,10,10,0.78)]">Two-factor authentication is active. You will be asked for a code at every sign-in.</p>
          <button onClick={disable} disabled={busy} className="btn-line" style={{ borderColor: 'red', color: 'red' }}>disable 2fa</button>
        </div>
      )}
      {msg && <div className="mt-4 meta-mono" style={{ color: 'var(--gold)' }}>{msg}</div>}
      {err && <div className="mt-4 text-red-700 text-[13px]">{err}</div>}
    </div>
  );
}
