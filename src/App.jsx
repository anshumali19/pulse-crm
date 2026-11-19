import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, UserPlus, Users, Building2, Kanban, CheckSquare, BarChart3, Settings as SettingsIcon, Activity } from 'lucide-react';
import { Shell, Login, RequireAuth } from './kit/Shell';
import { useDB } from './kit/db';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import { Contacts, Companies } from './pages/People';
import Pipeline from './pages/Pipeline';
import Activities from './pages/Activities';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const brand = {
  name: 'Pulse CRM',
  tagline: 'Sales workspace',
  icon: Activity,
  sessionKey: 'pulse-crm-auth',
  headline: 'Close more deals with a CRM your team will actually use.',
  description: 'Capture leads, manage contacts and companies, drag deals through your pipeline, never miss a follow-up, and forecast revenue with confidence.',
};

export default function App() {
  const { db } = useDB();
  const today = new Date(); today.setHours(23, 59, 59);
  const dueToday = db.activities.filter((a) => !a.done && new Date(a.due) <= today);
  const newLeads = db.leads.filter((l) => l.status === 'New').length;
  const nav = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { section: 'Sales' },
    { to: '/leads', label: 'Leads', icon: UserPlus, badge: newLeads || null },
    { to: '/pipeline', label: 'Deals pipeline', icon: Kanban },
    { to: '/activities', label: 'Tasks & activities', icon: CheckSquare, badge: dueToday.length || null },
    { section: 'Relationships' },
    { to: '/contacts', label: 'Contacts', icon: Users },
    { to: '/companies', label: 'Companies', icon: Building2 },
    { section: 'Insights' },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/settings', label: 'Team & settings', icon: SettingsIcon },
  ];
  const notifications = [
    ...dueToday.slice(0, 4).map((a) => ({ title: `${a.type}: ${a.subject}`, text: new Date(a.due) < new Date() ? 'Overdue' : 'Due today', tone: new Date(a.due) < new Date(Date.now() - 864e5) ? 'red' : 'yellow', to: '/activities' })),
    ...(newLeads ? [{ title: `${newLeads} new leads to qualify`, to: '/leads' }] : []),
  ];
  return (
    <Routes>
      <Route path="/login" element={<Login brand={brand} demoEmail="sarah@pulse.example" highlights={['Drag-and-drop deal pipeline', 'Lead scoring & one-click conversion', 'Activity timeline for every contact & deal', 'Forecasts, win rates and rep leaderboards']} />} />
      <Route path="/*" element={
        <RequireAuth sessionKey={brand.sessionKey}>
          <Shell brand={brand} nav={nav} user={{ name: 'Sarah Chen', role: 'Sales Director' }} notifications={notifications} onSearch={(q, nav) => nav(`/contacts?q=${encodeURIComponent(q)}`)}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Shell>
        </RequireAuth>
      } />
    </Routes>
  );
}
