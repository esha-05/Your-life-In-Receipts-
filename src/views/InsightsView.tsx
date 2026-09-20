import { useMemo, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useReducedMotion } from "motion/react";
import { Flame, Headphones, Moon, Wallet } from "lucide-react";
import { items } from "@/lib/data";
import type { Stats } from "@/lib/stats";
import { TYPE_META, TYPE_ORDER } from "@/lib/meta";
import { count, monthLong, monthShort, money } from "@/lib/format";
import { YEAR } from "@/lib/data";
import { Heatmap } from "@/components/Heatmap";

const TICK = { fill: "#a8a08f", fontSize: 12 };
const TIP = {
  contentStyle: { background: "#141311", border: "1px solid #2b2823", borderRadius: 12, color: "#efe9dc" },
  labelStyle: { color: "#a8a08f" },
  cursor: { fill: "rgb(255 255 255 / 0.04)" },
};

function Panel({ title, note, children, className = "" }: { title: string; note?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-ink-2/70 p-5 md:p-6 ${className}`}>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {note && <p className="mt-1 text-sm text-muted">{note}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function BarList({ rows, color, fmt = count }: { rows: Array<{ name: string; value: number }>; color: string; fmt?: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ol className="space-y-3">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="flex justify-between gap-3 text-sm">
            <span className="truncate">{r.name}</span>
            <span className="font-mono text-muted tabular-nums">{fmt(r.value)}</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-ink-3" aria-hidden>
            <div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function Kpi({ icon: Icon, label, value, sub, color }: { icon: typeof Wallet; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl border border-line bg-ink-2/70 p-5">
      <p className="flex items-center gap-2 text-sm text-muted">
        <Icon className="size-4" style={{ color }} aria-hidden /> {label}
      </p>
      <p className="mt-3 font-display text-3xl font-semibold tabular-nums md:text-4xl">{value}</p>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
  );
}

const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? "a" : "p"}`;

export default function InsightsView({ stats, onOpenDay }: { stats: Stats; onOpenDay: (k: string) => void }) {
  const reduce = useReducedMotion();
  const monthly = useMemo(() => stats.monthly.map((m) => ({ ...m, name: monthShort(m.month) })), [stats]);
  const hourly = useMemo(() => stats.hourly.map((n, h) => ({ name: hourLabel(h), n })), [stats]);

  const insights = useMemo(() => {
    const music = items.filter((i) => i.type === "music");
    const nightShare = music.length ? Math.round((music.filter((m) => m.date.getHours() >= 23 || m.date.getHours() < 5).length / music.length) * 100) : 0;
    const weekend = stats.weekday[0] + stats.weekday[6];
    const weekendShare = Math.round((weekend / Math.max(1, stats.total)) * 100);
    const peak = stats.hourly.indexOf(Math.max(...stats.hourly));
    return { nightShare, weekendShare, peak };
  }, [stats]);

  const busiest = stats.busiestDay;

  return (
    <div className="py-10 md:py-14">
      <p className="eyebrow">The shape of {YEAR}</p>
      <h1 className="mt-2 font-display text-4xl font-semibold md:text-6xl">Insights</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted text-pretty">
        Weekends hold {insights.weekendShare}% of your traces, and your day peaks around {hourLabel(insights.peak).replace("a", " AM").replace("p", " PM")}.
        {insights.nightShare > 0 && ` About ${insights.nightShare}% of your listening happens after 11 PM.`}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Flame} color="#f5b74a" label="Busiest month" value={monthLong(stats.busiestMonth)} sub={`${count(stats.monthly[stats.busiestMonth] ? TYPE_ORDER.reduce((s, t) => s + stats.monthly[stats.busiestMonth][t], 0) : 0)} traces`} />
        <Kpi icon={Wallet} color="#f5b74a" label="Total spent" value={money(stats.spend)} sub={`${count(stats.byType.purchase)} purchases`} />
        <Kpi icon={Headphones} color="#6fdc9b" label="Listening" value={`${count(stats.listeningHours)} h`} sub={`${count(stats.byType.music)} tracks logged`} />
        <Kpi icon={Moon} color="#b79cff" label="Busiest day" value={busiest ? new Date(`${busiest.key}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long" }) : "—"} sub={busiest ? `${busiest.count} traces` : undefined} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Panel title="Month by month" note="Traces per month, stacked by type." className="lg:col-span-3">
          <div role="img" aria-label={`Stacked bar chart of traces per month. Busiest month: ${monthLong(stats.busiestMonth)}.`} className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ left: -12, right: 4 }}>
                <CartesianGrid vertical={false} stroke="#2b2823" />
                <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip {...TIP} />
                {TYPE_ORDER.map((t) => (
                  <Bar key={t} dataKey={t} name={TYPE_META[t].plural} stackId="a" fill={TYPE_META[t].color} isAnimationActive={!reduce} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            {TYPE_ORDER.filter((t) => stats.byType[t] > 0).map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ background: TYPE_META[t].color }} aria-hidden />
                {TYPE_META[t].plural}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Your daily rhythm" note="When in the day traces happen." className="lg:col-span-2">
          <div role="img" aria-label={`Area chart of traces by hour of day. Peak hour: ${hourLabel(insights.peak)}.`} className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourly} margin={{ left: -12, right: 4 }}>
                <defs>
                  <linearGradient id="hr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f5b74a" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#f5b74a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#2b2823" />
                <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip {...TIP} />
                <Area type="monotone" dataKey="n" name="Traces" stroke="#f5b74a" strokeWidth={2} fill="url(#hr)" isAnimationActive={!reduce} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Where the money went" note="Spend by category." className="lg:col-span-2">
          <BarList rows={stats.spendByCategory} color="#f5b74a" fmt={money} />
        </Panel>
        <Panel title="On repeat" note="Most-listened artists (by tracks logged)." className="lg:col-span-2">
          <BarList rows={stats.topArtists} color="#6fdc9b" />
        </Panel>
        <Panel title={`Every day of ${YEAR}`} note="One square per day — brighter means more traces. Pick a day to open it." className="lg:col-span-5">
          <Heatmap counts={stats.dayCounts} onSelect={onOpenDay} />
        </Panel>
        <Panel title="Recurring threads" note="Tags that show up across every kind of trace." className="lg:col-span-1">
          <ul className="flex flex-wrap gap-2">
            {stats.topTags.slice(0, 10).map((t) => (
              <li key={t.name} className="rounded-full border border-line px-2.5 py-1 font-mono text-xs">
                #{t.name} <span className="text-muted">{t.value}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
