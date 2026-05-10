import React from 'react';
import '@/index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';

import Home from '@/pages/public/Home';
import Services from '@/pages/public/Services';
import SportsManagement from '@/pages/public/SportsManagement';
import SportsAdvisory from '@/pages/public/SportsAdvisory';
import StrategicAdvisory from '@/pages/public/StrategicAdvisory';
import Athletes from '@/pages/public/Athletes';
import AthleteDetail from '@/pages/public/AthleteDetail';
import Approach from '@/pages/public/Approach';
import About from '@/pages/public/About';
import Press from '@/pages/public/Press';
import PressDetail from '@/pages/public/PressDetail';
import Contact from '@/pages/public/Contact';
import Legal from '@/pages/public/Legal';
import CmsPage from '@/pages/public/CmsPage';
import Login from '@/pages/auth/Login';
import Onboarding from '@/pages/auth/Onboarding';
import Deck from '@/pages/deck/Deck';

import PortalLayout from '@/pages/portal/PortalLayout';
import PortalToday from '@/pages/portal/Today';
import PortalDocuments from '@/pages/portal/Documents';
import PortalCalendar from '@/pages/portal/Calendar';
import PortalMessages from '@/pages/portal/Messages';
import PortalNews from '@/pages/portal/News';
import PortalAccount from '@/pages/portal/Account';

import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminRoster from '@/pages/admin/Roster';
import AdminAccounts from '@/pages/admin/Accounts';
import AdminInvites from '@/pages/admin/Invites';
import AdminPagesList from '@/pages/admin/PagesList';
import AdminPostsList from '@/pages/admin/PostsList';
import PageEditor from '@/pages/admin/PageEditor';
import AdminMedia from '@/pages/admin/MediaLibrary';
import AdminMenus from '@/pages/admin/Menus';
import AdminDocuments from '@/pages/admin/Documents';
import AdminCalendar from '@/pages/admin/Calendar';
import AdminMessages from '@/pages/admin/Messages';
import AdminAnnouncements from '@/pages/admin/Announcements';
import AdminAuditLog from '@/pages/admin/AuditLog';
import AdminAnalytics from '@/pages/admin/Analytics';
import AdminSettings from '@/pages/admin/Settings';
import AdminRetainers from '@/pages/admin/Retainers';
import AdminCovenants from '@/pages/admin/Covenants';
import AdminOutbox from '@/pages/admin/Outbox';
import PortalCovenants from '@/pages/portal/Covenants';
import PortalRetainer from '@/pages/portal/Retainer';

function NotFound() {
  return <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', background: 'var(--ivory)' }}><div className="text-center"><h1 className="display text-[80px]">404</h1><p className="meta-mono">A page that does not exist is the most private of all.</p><a href="/" className="btn-line gold mt-8 inline-flex">return home</a></div></div>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/sports-management" element={<SportsManagement />} />
          <Route path="/sports-advisory" element={<SportsAdvisory />} />
          <Route path="/orgs" element={<SportsAdvisory />} />
          <Route path="/strategic-advisory" element={<StrategicAdvisory />} />
          <Route path="/family" element={<StrategicAdvisory />} />
          <Route path="/athletes" element={<Athletes />} />
          <Route path="/athletes/:slug" element={<AthleteDetail />} />
          <Route path="/approach" element={<Approach />} />
          <Route path="/about" element={<About />} />
          <Route path="/press" element={<Press />} />
          <Route path="/press/:slug" element={<PressDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/p/:slug" element={<CmsPage />} />

          {/* Auth / onboarding */}
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Brand deck (gated) */}
          <Route path="/deck" element={<Deck />} />

          {/* Portal */}
          <Route path="/portal" element={<PortalLayout />}>
            <Route index element={<PortalToday />} />
            <Route path="documents" element={<PortalDocuments />} />
            <Route path="calendar" element={<PortalCalendar />} />
            <Route path="messages" element={<PortalMessages />} />
            <Route path="news" element={<PortalNews />} />
            <Route path="covenants" element={<PortalCovenants />} />
            <Route path="retainer" element={<PortalRetainer />} />
            <Route path="account" element={<PortalAccount />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="roster" element={<AdminRoster />} />
            <Route path="accounts" element={<AdminAccounts />} />
            <Route path="invites" element={<AdminInvites />} />
            <Route path="pages" element={<AdminPagesList />} />
            <Route path="pages/:id" element={<PageEditor resourceType="page" />} />
            <Route path="posts" element={<AdminPostsList />} />
            <Route path="posts/:id" element={<PageEditor resourceType="post" />} />
            <Route path="media" element={<AdminMedia />} />
            <Route path="menus" element={<AdminMenus />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="calendar" element={<AdminCalendar />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="audit" element={<AdminAuditLog />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="retainers" element={<AdminRetainers />} />
            <Route path="covenants" element={<AdminCovenants />} />
            <Route path="outbox" element={<AdminOutbox />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
