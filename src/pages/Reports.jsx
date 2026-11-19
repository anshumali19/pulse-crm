import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, FunnelChart, Funnel, LabelList } from 'recharts';
import { useDB } from '../kit/db';
import { PageHeader, Card, CardHeader, StatCard, Avatar } from '../kit/ui';
import { money, compact, MONTHS } from '../kit/format';
import { OPEN_STAGES, SOURCES } from '../seed';

export default function Reports() {
  const { db } = useDB();
  const r = useMemo(() => {
    const won = db.deals.filter((d) => d.stage === 'Won');
    const lost = db.deals.filter((d) => d.stage === 'Lost');
    const open = db.deals.filter((d) => OPEN_STAGES.includes(d.stage));
    const forecast = Array.from({ length: 4 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() + i);
      const inMonth = open.filter((x) => new Date(x.closeDate).getMonth() === d.getMonth() && new Date(x.closeDate).getFullYear() === d.getFullYear());
      return { label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, best: inMonth.reduce((a, x) => a + x.value, 0), weighted: Math.round(inMonth.reduce((a, x) => a + (x.value * x.probability) / 100, 0)) };
    });
    const reps = db.team.map((t) => {
      const w = won.filter((d) => d.ownerId === t.id);
      const l = lost.filter((d) => d.ownerId === t.id);
      return { ...t, won: w.length, lost: l.length, revenue: w.reduce((a, d) => a + d.value, 0), rate: (w.length / (w.length + l.length || 1)) * 100, avg: w.length ? w.reduce((a, d) => a + d.value, 0) / w.length : 0, activities: db.activities.filter((a) => a.ownerId === t.id && a.done).length };
    });
    const bySource = SOURCES.map((s) => ({ name: s, won: won.filter((d) => d.source === s).reduce((a, d) => a + d.value, 0), lost: lost.filter((d) => d.source === s).reduce((a, d) => a + d.value, 0) }));
    const cycle = won.length ? won.reduce((a, d) => a + (new Date(d.closedAt) - new Date(d.createdAt)) / 864e5, 0) / won.length : 0;
    const funnel = [
      { name: 'Leads', value: db.leads.length + db.deals.length, fill: '#c4b5fd' },
      { name: 'Qualified', value: db.deals.filter((d) => d.stage !== 'Lead In').length, fill: '#a78bfa' },
      { name: 'Proposal', value: db.deals.filter((d) => ['Proposal', 'Negotiation', 'Won', 'Lost'].includes(d.stage)).length, fill: '#8b5cf6' },
      { name: 'Negotiation', value: db.deals.filter((d) => ['Negotiation', 'Won'].includes(d.stage)).length, fill: '#7c3aed' },
      { name: 'Won', value: won.length, fill: '#22c55e' },
    ];
    return { won, lost, forecast, reps, bySource, cycle, funnel, avg: won.length ? won.reduce((a, d) => a + d.value, 0) / won.length : 0 };
  }, [db]);
  return (
    <>
      <PageHeader title="Reports" subtitle="Forecast, conversion and team performance." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total won" value={money(r.won.reduce((a, d) => a + d.value, 0))} tone="green" />
        <StatCard label="Average deal size" value={money(r.avg)} />
        <StatCard label="Avg. sales cycle" value={`${Math.round(r.cycle)} days`} tone="blue" />
        <StatCard label="Weighted forecast (4 mo)" value={money(r.forecast.reduce((a, f) => a + f.weighted, 0))} tone="purple" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Revenue forecast" subtitle="Best case vs. probability-weighted, by expected close month" />
          <div className="h-72 p-4">
            <ResponsiveContainer>
              <BarChart data={r.forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => '$' + compact(v)} tickLine={false} axisLine={false} width={50} />
                <Tooltip formatter={(v) => money(v)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="best" name="Best case" fill="#ddd6fe" radius={[4, 4, 0, 0]} />
                <Bar dataKey="weighted" name="Weighted" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Conversion funnel" subtitle="All-time" />
          <div className="h-72 p-4">
            <ResponsiveContainer>
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="value" data={r.funnel} isAnimationActive>
                  <LabelList position="right" fill="#475569" stroke="none" dataKey="name" fontSize={12} />
                  <LabelList position="center" fill="#fff" stroke="none" dataKey="value" fontSize={12} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Team performance" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-2 text-left">Rep</th><th className="px-5 py-2 text-right">Won</th><th className="px-5 py-2 text-right">Lost</th><th className="px-5 py-2 text-right">Win rate</th><th className="px-5 py-2 text-right">Avg deal</th><th className="px-5 py-2 text-right">Activities</th><th className="px-5 py-2 text-right">Revenue</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {r.reps.sort((a, b) => b.revenue - a.revenue).map((t) => (
                  <tr key={t.id}>
                    <td className="px-5 py-3"><span className="flex items-center gap-2"><Avatar name={t.name} size={26} /><span className="font-medium">{t.name}</span></span></td>
                    <td className="px-5 py-3 text-right">{t.won}</td><td className="px-5 py-3 text-right">{t.lost}</td>
                    <td className="px-5 py-3 text-right font-medium">{t.rate.toFixed(0)}%</td>
                    <td className="px-5 py-3 text-right">{money(t.avg)}</td><td className="px-5 py-3 text-right">{t.activities}</td>
                    <td className="px-5 py-3 text-right font-semibold">{money(t.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Won vs. lost value by source" />
          <div className="h-72 p-4">
            <ResponsiveContainer>
              <BarChart data={r.bySource}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => '$' + compact(v)} tickLine={false} axisLine={false} width={50} />
                <Tooltip formatter={(v) => money(v)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="won" name="Won" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lost" name="Lost" fill="#fda4af" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  );
}
