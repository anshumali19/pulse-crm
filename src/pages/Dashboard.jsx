import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Trophy, Target, CheckSquare, Kanban } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useDB } from '../kit/db';
import { PageHeader, StatCard, Card, CardHeader, Avatar, Progress, Badge, Button } from '../kit/ui';
import { money, compact, date, lastMonths } from '../kit/format';
import { OPEN_STAGES, SOURCES } from '../seed';
import { byId, STAGE_COLOR, ACT_ICON, ACT_TONE } from './shared';

const SRC_COLORS = ['#8b5cf6', '#22c55e', '#0ea5e9', '#f59e0b', '#ec4899', '#64748b'];

export default function Dashboard() {
  const { db } = useDB();
  const team = byId(db.team);
  const co = byId(db.companies);
  const s = useMemo(() => {
    const open = db.deals.filter((d) => OPEN_STAGES.includes(d.stage));
    const won = db.deals.filter((d) => d.stage === 'Won');
    const lost = db.deals.filter((d) => d.stage === 'Lost');
    const now = new Date();
    const wonThisMonth = won.filter((d) => new Date(d.closedAt).getMonth() === now.getMonth() && new Date(d.closedAt).getFullYear() === now.getFullYear());
    const months = lastMonths(12).map((m) => ({ ...m, won: 0 }));
    won.forEach((d) => { const m = months.find((x) => x.year === new Date(d.closedAt).getFullYear() && x.month === new Date(d.closedAt).getMonth()); if (m) m.won += d.value; });
    const funnel = OPEN_STAGES.map((st) => ({ stage: st, value: open.filter((d) => d.stage === st).reduce((a, d) => a + d.value, 0), count: open.filter((d) => d.stage === st).length }));
    const sources = SOURCES.map((src) => ({ name: src, value: db.leads.filter((l) => l.source === src).length + db.deals.filter((d) => d.source === src).length }));
    const leaderboard = db.team.map((t) => ({ ...t, won: won.filter((d) => d.ownerId === t.id && new Date(d.closedAt).getFullYear() === now.getFullYear()).reduce((a, d) => a + d.value, 0) })).sort((a, b) => b.won - a.won);
    return { open, won, lost, wonThisMonth, months, funnel, sources, leaderboard, winRate: (won.length / (won.length + lost.length || 1)) * 100 };
  }, [db]);
  const tasks = db.activities.filter((a) => !a.done).sort((a, b) => new Date(a.due) - new Date(b.due)).slice(0, 6);
  const closing = s.open.filter((d) => new Date(d.closeDate) < new Date(Date.now() + 21 * 864e5)).sort((a, b) => new Date(a.closeDate) - new Date(b.closeDate)).slice(0, 5);

  return (
    <>
      <PageHeader title="Sales dashboard" subtitle="Your team's pipeline at a glance." actions={<Link to="/pipeline"><Button icon={Kanban}>Open pipeline</Button></Link>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open pipeline" value={money(s.open.reduce((a, d) => a + d.value, 0))} hint={`${s.open.length} deals`} icon={DollarSign} />
        <StatCard label="Won this month" value={money(s.wonThisMonth.reduce((a, d) => a + d.value, 0))} hint={`${s.wonThisMonth.length} deals closed`} icon={Trophy} tone="green" />
        <StatCard label="Win rate" value={`${s.winRate.toFixed(0)}%`} hint={`${s.won.length} won · ${s.lost.length} lost`} icon={Target} tone="blue" />
        <StatCard label="Open tasks" value={db.activities.filter((a) => !a.done).length} hint={`${db.activities.filter((a) => !a.done && new Date(a.due) < new Date()).length} overdue`} icon={CheckSquare} tone="yellow" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Revenue won" subtitle="Closed-won deal value, last 12 months" />
          <div className="h-72 p-4">
            <ResponsiveContainer>
              <AreaChart data={s.months}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => '$' + compact(v)} tickLine={false} axisLine={false} width={50} />
                <Tooltip formatter={(v) => money(v)} />
                <Area type="monotone" dataKey="won" name="Won" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Pipeline by stage" />
          <div className="space-y-4 p-5">
            {s.funnel.map((f) => (
              <div key={f.stage}>
                <div className="mb-1 flex justify-between text-sm"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: STAGE_COLOR[f.stage] }} />{f.stage} <span className="text-xs text-slate-400">({f.count})</span></span><span className="font-medium">{money(f.value)}</span></div>
                <div className="h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full" style={{ width: `${(f.value / Math.max(...s.funnel.map((x) => x.value), 1)) * 100}%`, background: STAGE_COLOR[f.stage] }} /></div>
              </div>
            ))}
          </div>
          <div className="h-44 border-t border-slate-100">
            <ResponsiveContainer>
              <PieChart><Pie data={s.sources} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={2}>{s.sources.map((_, i) => <Cell key={i} fill={SRC_COLORS[i]} />)}</Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-4 pb-4 text-[11px] text-slate-500">{s.sources.map((x, i) => <span key={x.name} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: SRC_COLORS[i] }} />{x.name}</span>)}</div>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Leaderboard" subtitle="Won this year vs. quota" />
          <ul className="space-y-4 p-5">
            {s.leaderboard.map((t, i) => (
              <li key={t.id}>
                <div className="mb-1.5 flex items-center gap-3">
                  <span className="w-4 text-xs font-semibold text-slate-400">{i + 1}</span>
                  <Avatar name={t.name} size={28} />
                  <div className="flex-1"><div className="text-sm font-medium">{t.name}</div><div className="text-xs text-slate-500">{t.role}</div></div>
                  <span className="text-sm font-semibold">{money(t.won)}</span>
                </div>
                <Progress value={t.won} max={t.quota} tone={t.won >= t.quota ? 'green' : 'brand'} />
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Closing soon" subtitle="Next 3 weeks" action={<Link to="/pipeline" className="text-xs font-medium text-brand-600 hover:underline">All deals</Link>} />
          <ul className="divide-y divide-slate-100">
            {closing.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0"><div className="truncate text-sm font-medium">{d.title.split(' – ')[1]}</div><div className="text-xs text-slate-500">{co[d.companyId]?.name} · {date(d.closeDate)}</div></div>
                <div className="text-right"><div className="text-sm font-semibold">{money(d.value)}</div><Badge tone="purple">{d.stage}</Badge></div>
              </li>
            ))}
            {closing.length === 0 && <li className="px-5 py-8 text-center text-sm text-slate-500">Nothing closing soon</li>}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Up next" action={<Link to="/activities" className="text-xs font-medium text-brand-600 hover:underline">All tasks</Link>} />
          <ul className="divide-y divide-slate-100">
            {tasks.map((a) => {
              const I = ACT_ICON[a.type];
              const late = new Date(a.due) < new Date(new Date().setHours(0, 0, 0, 0));
              return (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${ACT_TONE[a.type]}`}><I size={15} /></span>
                  <div className="min-w-0 flex-1"><div className="truncate text-sm">{a.subject}</div><div className={`text-xs ${late ? 'text-rose-600' : 'text-slate-500'}`}>{late ? 'Overdue · ' : ''}{date(a.due)} · {team[a.ownerId]?.name.split(' ')[0]}</div></div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </>
  );
}
