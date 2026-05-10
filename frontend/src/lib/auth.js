import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setToken, getToken } from './api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); setLoading(false); return; }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const claimOwner = async (name, email, password) => {
    const { data } = await api.post('/auth/claim-owner', { name, email, password });
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    setToken(null);
    setUser(null);
  };

  const signOutAll = async () => {
    try { await api.post('/auth/sign-out-all'); } catch {}
    setToken(null);
    setUser(null);
  };

  const STAFF = new Set(['owner','admin','editor','strategist','operations','read_only']);
  const MEMBER = new Set(['athlete','family','agent','counsel']);
  const CAPS = {
    manage_staff: new Set(['owner']),
    manage_members: new Set(['owner','admin']),
    edit_content: new Set(['owner','admin','editor']),
    manage_roster: new Set(['owner','admin','strategist']),
    manage_documents: new Set(['owner','admin','strategist','operations']),
    send_announcements: new Set(['owner','admin','editor','strategist']),
    view_audit: new Set(['owner','admin']),
    view_analytics: new Set(['owner','admin']),
    manage_settings: new Set(['owner','admin']),
    manage_invites: new Set(['owner','admin']),
    access_admin: STAFF,
    access_portal: MEMBER,
  };

  const has = (cap) => !!user && CAPS[cap]?.has(user.role);
  const isStaff = !!user && STAFF.has(user.role);
  const isMember = !!user && MEMBER.has(user.role);

  return (
    <AuthCtx.Provider value={{ user, loading, refresh, login, claimOwner, logout, signOutAll, has, isStaff, isMember, setUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
