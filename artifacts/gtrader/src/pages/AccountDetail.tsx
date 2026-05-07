import { useParams, Link } from "wouter";
import { useGetAccount, useGetAccountStats, useGetEquityCurve, useListTrades } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, formatDate, pnlColor, cn, resultBadgeClass } from "@/lib/utils";
import StatCard from "@/components/StatCard";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function AccountDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id, 10);
  const { data: account, isLoading } = useGetAccount(id, { query: { enabled: !!id } });
  const { data: stats } = useGetAccountStats(id, { query: { enabled: !!id } });
  const { data: equity } = useGetEquityCurve({ accountId: id }, { query: { enabled: !!id } });
  const { data: trades } = useListTrades({ accountId: id, limit: 20 }, { query: { enabled: !!id } });

  if (isLoading) return <div className="p-6 space-y-4"><div className="h-8 w-48 bg-muted rounded animate-pulse" /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}</div></div>;
  if (!account) return <div className="p-6"><p className="text-muted-foreground">Account not found.</p></div>;

  const growth = account.initialBalance > 0 ? ((account.currentBalance - account.initialBalance) / account.initialBalance) * 100 : 0;

  function statusColor(s: string) {
    const m: Record<string, string> = { active: "text-green-500", passed: "text-blue-500", failed: "text-orange-500", blown: "text-red-500" };
    return m[s] ?? "text-muted-foreground";
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/accounts"><button className="p-1.5 rounded-md hover:bg-accent transition-colors" data-testid="button-back"><ArrowLeft className="h-4 w-4" /></button></Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">{account.name}</h1>
          <p className="text-sm text-muted-foreground">{account.brokerName ?? account.accountType} · <span className={statusColor(account.status)}>{account.status}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Balance" value={formatCurrency(account.currentBalance, account.currency)} sub={`Initial: ${formatCurrency(account.initialBalance, account.currency)}`} data-testid="stat-balance" />
        <StatCard label="Growth" value={`${growth >= 0 ? "+" : ""}${growth.toFixed(2)}%`} trend={growth >= 0 ? "up" : "down"} data-testid="stat-growth" />
        <StatCard label="Win Rate" value={stats ? formatPercent(stats.winRate) : "—"} sub={stats ? `${stats.wins}W / ${stats.losses}L` : ""} data-testid="stat-win-rate" />
        <StatCard label="Total P&L" value={stats ? formatCurrency(stats.totalPnl) : "—"} trend={stats && stats.totalPnl >= 0 ? "up" : "down"} data-testid="stat-pnl" />
        <StatCard label="Profit Factor" value={stats ? stats.profitFactor.toFixed(2) : "—"} data-testid="stat-profit-factor" />
        <StatCard label="Avg R:R" value={stats ? stats.averageRR.toFixed(2) : "—"} data-testid="stat-avg-rr" />
        <StatCard label="Discipline" value={stats ? `${stats.disciplineScore.toFixed(0)}%` : "—"} data-testid="stat-discipline" />
        <StatCard label="Max Drawdown" value={stats ? formatCurrency(stats.maxDrawdown) : "—"} trend="down" data-testid="stat-max-drawdown" />
      </div>

      {/* Best indicators */}
      {stats && (stats.bestSession || stats.bestSetup || stats.bestTimeframe) && (
        <div className="grid grid-cols-3 gap-3">
          {stats.bestTimeframe && <div className="bg-card border border-card-border rounded-lg p-3"><p className="text-xs text-muted-foreground">Best Timeframe</p><p className="text-base font-bold mt-1">{stats.bestTimeframe}</p></div>}
          {stats.bestSetup && <div className="bg-card border border-card-border rounded-lg p-3"><p className="text-xs text-muted-foreground">Best Setup</p><p className="text-base font-bold mt-1">{stats.bestSetup}</p></div>}
          {stats.bestSession && <div className="bg-card border border-card-border rounded-lg p-3"><p className="text-xs text-muted-foreground">Best Session</p><p className="text-base font-bold mt-1">{stats.bestSession}</p></div>}
        </div>
      )}

      {/* Equity curve */}
      {equity && equity.length > 1 && (
        <div className="bg-card border border-card-border rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-3">Equity Curve</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={equity} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={v => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `$${v.toLocaleString()}`} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Balance"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
              <Area type="monotone" dataKey="balance" stroke="hsl(217 91% 60%)" fill="url(#equityGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Trade list */}
      <div className="bg-card border border-card-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Recent Trades</h2>
          <Link href={`/journal?accountId=${id}`}><span className="text-xs text-primary hover:underline cursor-pointer">View all</span></Link>
        </div>
        {!trades?.length ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No trades for this account. <Link href="/journal/new"><span className="text-primary cursor-pointer hover:underline">Log one</span></Link></p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left py-2 pr-3 font-medium">Date</th>
                  <th className="text-left py-2 pr-3 font-medium">Asset</th>
                  <th className="text-left py-2 pr-3 font-medium">Setup</th>
                  <th className="text-left py-2 pr-3 font-medium">Result</th>
                  <th className="text-right py-2 font-medium">P&L</th>
                </tr>
              </thead>
              <tbody>
                {trades.map(t => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => window.location.href = `/journal/${t.id}`} data-testid={`trade-row-${t.id}`}>
                    <td className="py-2 pr-3 text-muted-foreground">{formatDate(t.tradeDate)}</td>
                    <td className="py-2 pr-3 font-medium">{t.asset} <span className={cn("text-xs", t.direction === "buy" ? "text-profit" : "text-loss")}>{t.direction?.toUpperCase()}</span></td>
                    <td className="py-2 pr-3 text-muted-foreground">{t.setup ?? t.entryTrigger ?? "—"}</td>
                    <td className="py-2 pr-3"><span className={cn("text-xs px-2 py-0.5 rounded", resultBadgeClass(t.result))}>{t.result}</span></td>
                    <td className={cn("py-2 text-right font-semibold", pnlColor(t.pnl))}>{t.pnl != null ? formatCurrency(t.pnl) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
