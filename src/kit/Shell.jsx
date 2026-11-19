import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, RotateCcw, LogOut, Search, Plus, UserPlus, Kanban, CheckSquare, Users } from 'lucide-react';
import { Avatar, cx, useToast, Progress } from './ui';
import { useDB } from './db';

/**
 * Pulse CRM shell: floating white sidebar with pill navigation and a light top row with quick-create.
 */
export function Shell({ brand, nav, user, children, notifications = [], onSearch }) {
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const [create, setCreate] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();
  const { db, reset } = useDB();
  const toast = useToast();
  const ref = useRef();
  useEffect(() => { setOpen(false); setBell(false); setCreate(false); }, [loc.pathname]);
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && (setBell(false), setCreate(false));
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Quota progress for the signed-in rep (CRM-specific; safe if data is missing)
  const meRep = db.team?.find((t) => t.id === db.me);
  const wonYtd = (db.deals || []).filter((d) => d.ownerId === db.me && d.stage === 'Won' && new Date(d.closedAt).getFullYear() === new Date().getFullYear()).reduce((s, d) => s + d.value, 0);
  const Logo = brand.icon;

  const sidebar = (
    <div className="flex h-full flex-col rounded-[28px] border border-white bg-white/90 p-4 shadow-[0_8px_40px_-12px_rgba(91,33,182,0.18)] backdrop-blur">
      <Link to="/" className="mb-6 flex items-center gap-3 px-2 pt-1">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white shadow-lg shadow-brand-500/30"><Logo size={19} /></span>
        <span><span className="block text-[15px] font-bold text-slate-900">{brand.name}</span><span className="block text-[11px] text-slate-400">{brand.tagline}</span></span>
      </Link>
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {nav.map((n, i) =>
          n.section ? (
            <div key={i} className="px-3 pb-1 pt-5 text-[11px] font-semibold text-slate-400">{n.section}</div>
          ) : (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => cx('flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition', isActive ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700')}>
              {({ isActive }) => (<>
                <n.icon size={17} />
                <span className="flex-1">{n.label}</span>
                {n.badge ? <span className={cx('rounded-full px-2 text-[11px] font-semibold', isActive ? 'bg-white/20' : 'bg-brand-100 text-brand-700')}>{n.badge}</span> : null}
              </>)}
            </NavLink>
          )
        )}
      </nav>
      {meRep && (
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-brand-50 to-fuchsia-50 p-4">
          <div className="flex items-center gap-3"><Avatar name={user.name} size={36} /><div className="min-w-0"><div className="truncate text-sm font-semibold">{user.name}</div><div className="text-[11px] text-slate-500">{user.role}</div></div></div>
          <div className="mt-3 flex justify-between text-[11px] text-slate-500"><span>Annual quota</span><span className="font-semibold text-brand-700">{Math.round((wonYtd / (meRep.quota || 1)) * 100)}%</span></div>
          <Progress value={wonYtd} max={meRep.quota} className="mt-1 bg-white" />
        </div>
      )}
      <div className="mt-3 flex gap-1">
        <button onClick={() => { if (confirm('Reset all demo data to the original sample set?')) { reset(); toast('Demo data restored'); } }} className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs text-slate-500 hover:bg-slate-100 cursor-pointer"><RotateCcw size={13} /> Reset data</button>
        <button onClick={() => { sessionStorage.removeItem(brand.sessionKey); navigate('/login'); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs text-slate-500 hover:bg-slate-100 cursor-pointer"><LogOut size={13} /> Sign out</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f4fb]">
      <div className="pointer-events-none fixed -top-40 right-0 h-96 w-96 rounded-full bg-fuchsia-200/40 blur-3xl" />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 p-3 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 p-3 animate-slide-left">{sidebar}</div>
        </div>
      )}
      <div className="relative lg:pl-72">
        <header ref={ref} className="sticky top-0 z-20 flex items-center gap-3 px-4 pb-2 pt-4 sm:px-6 lg:px-8">
          <button className="rounded-full bg-white p-2.5 shadow-sm lg:hidden cursor-pointer" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Search contacts… (Enter)" onKeyDown={(e) => e.key === 'Enter' && onSearch?.(e.currentTarget.value, navigate)} className="h-11 w-full rounded-full border border-white bg-white/90 pl-11 pr-4 text-sm shadow-sm outline-none backdrop-blur focus:ring-2 focus:ring-brand-500/30" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button onClick={() => { setCreate((c) => !c); setBell(false); }} className="flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-fuchsia-600 px-5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 hover:brightness-110 cursor-pointer"><Plus size={16} /> New</button>
              {create && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl animate-pop">
                  {[[UserPlus, 'Lead', '/leads'], [Kanban, 'Deal', '/pipeline'], [CheckSquare, 'Task', '/activities'], [Users, 'Contact', '/contacts']].map(([I, l, to]) => (
                    <button key={l} onClick={() => navigate(to)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-brand-50 cursor-pointer"><I size={15} className="text-brand-600" /> New {l.toLowerCase()}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button onClick={() => { setBell((b) => !b); setCreate(false); }} className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm hover:text-brand-700 cursor-pointer" aria-label="Notifications">
                <Bell size={18} />
                {notifications.length > 0 && <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-fuchsia-500 ring-2 ring-white" />}
              </button>
              {bell && (
                <div className="absolute right-0 mt-2 w-80 rounded-3xl border border-slate-100 bg-white p-2 shadow-xl animate-pop">
                  <div className="px-3 py-2 text-sm font-semibold">Notifications</div>
                  {notifications.length === 0 && <div className="px-3 py-6 text-center text-sm text-slate-500">You're all caught up 🎉</div>}
                  {notifications.slice(0, 6).map((n, i) => (
                    <button key={i} onClick={() => n.to && navigate(n.to)} className="flex w-full items-start gap-3 rounded-2xl px-3 py-2 text-left hover:bg-brand-50 cursor-pointer">
                      <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.tone === 'red' ? 'bg-rose-500' : n.tone === 'yellow' ? 'bg-amber-500' : 'bg-brand-500')} />
                      <span><span className="block text-sm text-slate-800">{n.title}</span>{n.text && <span className="block text-xs text-slate-500">{n.text}</span>}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="hidden lg:block"><Avatar name={user.name} size={44} className="ring-4 ring-white" /></span>
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] px-4 pb-10 pt-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

/** Light, gradient sign-in with a mini pipeline illustration. */
export function Login({ brand, highlights = [], demoEmail }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(demoEmail);
  const [pw, setPw] = useState('demo1234');
  const Logo = brand.icon;
  const go = (e) => { e?.preventDefault(); sessionStorage.setItem(brand.sessionKey, '1'); navigate(brand.base || '/'); };
  const cols = [['Qualified', ['Acme · $42k', 'Globex · $18k']], ['Proposal', ['Initech · $65k']], ['Won', ['Hooli · $120k']]];
  return (
    <div className="grid min-h-screen bg-[#f6f4fb] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-fuchsia-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur"><Logo size={20} /></span><span className="text-lg font-bold">{brand.name}</span></div>
        <div className="relative flex gap-3">
          {cols.map(([t, cards]) => (
            <div key={t} className="w-40 rounded-2xl bg-white/10 p-3 backdrop-blur">
              <div className="mb-2 text-xs font-semibold text-white/80">{t}</div>
              {cards.map((c) => <div key={c} className="mb-2 rounded-xl bg-white p-2.5 text-xs font-medium text-slate-800 shadow-lg">{c}</div>)}
            </div>
          ))}
        </div>
        <div className="relative">
          <h2 className="max-w-md text-4xl font-bold leading-tight">{brand.headline}</h2>
          <div className="mt-6 flex flex-wrap gap-2">{highlights.map((h) => <span key={h} className="rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">{h}</span>)}</div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={go} className="w-full max-w-sm rounded-[28px] bg-white p-8 shadow-[0_8px_40px_-12px_rgba(91,33,182,0.2)]">
          <div className="mb-6 flex items-center gap-3 lg:hidden"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white"><Logo size={20} /></span><span className="text-lg font-bold">{brand.name}</span></div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back 👋</h1>
          <p className="mt-1 text-sm text-slate-500">Let's close some deals today.</p>
          <div className="mt-7 space-y-3">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="h-12 w-full rounded-full border border-slate-200 bg-slate-50 px-5 text-sm outline-none focus:border-brand-500 focus:bg-white" />
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" className="h-12 w-full rounded-full border border-slate-200 bg-slate-50 px-5 text-sm outline-none focus:border-brand-500 focus:bg-white" />
            <button className="h-12 w-full rounded-full bg-gradient-to-r from-brand-600 to-fuchsia-600 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 hover:brightness-110 cursor-pointer">Sign in</button>
            <button type="button" onClick={go} className="h-12 w-full rounded-full border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">Continue as demo user</button>
          </div>
          <p className="mt-6 text-center text-xs leading-relaxed text-slate-400">Demo workspace — your changes stay in this browser.</p>
        </form>
      </div>
    </div>
  );
}

export function RequireAuth({ sessionKey, base = '', children }) {
  const navigate = useNavigate();
  const ok = sessionStorage.getItem(sessionKey);
  useEffect(() => { if (!ok) navigate(`${base}/login`, { replace: true }); }, [ok, navigate, base]);
  return ok ? children : null;
}
