import { useGetDashboardSummary, useGetRecentTrades } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, formatDateTime, pnlColor, resultBadgeClass, cn } from "@/lib/utils";
import StatCard from "@/components/StatCard";
import { TrendingUp, TrendingDown, Activity, Wallet, Target, Star } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();
  const { data: recentTrades } = useGetRecentTrades({ limit: 8 });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  const s = summary;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overall portfolio performance</p>
        </div>
        <Link href="/journal/new">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            data-testid="button-new-trade"
          >
            + New Trade
          </button>
        </Link>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total P&L"
          value={s ? formatCurrency(s.totalPnl) : "—"}
          sub={`Today: ${s ? formatCurrency(s.totalPnlToday) : "—"}`}
          trend={s && s.totalPnl > 0 ? "up" : s && s.totalPnl < 0 ? "down" : "neutral"}
          data-testid="stat-total-pnl"
        />
        <StatCard
          label="Win Rate"
          value={s ? formatPercent(s.overallWinRate) : "—"}
          sub={`${s?.totalWins ?? 0}W / ${s?.totalLosses ?? 0}L`}
          data-testid="stat-win-rate"
        />
        <StatCard
          label="Total Trades"
          value={s?.totalTrades ?? "—"}
          sub={`${s?.activeAccounts ?? 0} active accounts`}
          data-testid="stat-total-trades"
        />
        <StatCard
          label="Discipline"
          value={s ? `${s.averageDisciplineScore.toFixed(0)}%` : "—"}
          sub="Rule adherence score"
          data-testid="stat-discipline"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="This Week" value={s ? formatCurrency(s.totalPnlThisWeek) : "—"} trend={s && s.totalPnlThisWeek > 0 ? "up" : "down"} data-testid="stat-week-pnl" />
        <StatCard label="This Month" value={s ? formatCurrency(s.totalPnlThisMonth) : "—"} trend={s && s.totalPnlThisMonth > 0 ? "up" : "down"} data-testid="stat-month-pnl" />
        <StatCard label="Best Setup" value={s?.bestSetup ?? "—"} sub="By profit" data-testid="stat-best-setup" />
        <StatCard label="Best Session" value={s?.bestSession ?? "—"} sub="By profit" data-testid="stat-best-session" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Account breakdown */}
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" /> Accounts
            </h2>
            <Link href="/accounts">
              <span className="text-xs text-primary hover:underline cursor-pointer">View all</span>
            </Link>
          </div>
          {!s?.accountBreakdown?.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No accounts yet. <Link href="/accounts"><span className="text-primary cursor-pointer hover:underline">Add one</span></Link></p>
          ) : (
            <div className="space-y-2">
              {s.accountBreakdown.slice(0, 5).map(acc => (
                <Link key={acc.accountId} href={`/accounts/${acc.accountId}`}>
                  <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors cursor-pointer" data-testid={`account-row-${acc.accountId}`}>
                    <div>
                      <p className="text-sm font-medium text-foreground">{acc.accountName}</p>
                      <p className="text-xs text-muted-foreground">{acc.totalTrades} trades · {acc.winRate.toFixed(0)}% WR</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-semibold", acc.totalPnl >= 0 ? "text-profit" : "text-loss")}>
                        {formatCurrency(acc.totalPnl)}
                      </p>
                      <span className={cn("text-xs px-1.5 py-0.5 rounded", acc.status === "active" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground")}>
                        {acc.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent trades */}
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Recent Trades
            </h2>
            <Link href="/journal">
              <span className="text-xs text-primary hover:underline cursor-pointer">View all</span>
            </Link>
          </div>
          {!recentTrades?.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No trades yet. <Link href="/journal/new"><span className="text-primary cursor-pointer hover:underline">Log one</span></Link></p>
          ) : (
            <div className="space-y-1.5">
              {recentTrades.map(t => (
                <Link key={t.id} href={`/journal/${t.id}`}>
                  <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors cursor-pointer" data-testid={`trade-row-${t.id}`}>
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", t.result === "win" ? "bg-green-500" : t.result === "loss" ? "bg-red-500" : "bg-muted-foreground")} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.asset} <span className="text-xs text-muted-foreground">{t.direction?.toUpperCase()}</span></p>
                        <p className="text-xs text-muted-foreground">{t.setup ?? t.entryTrigger ?? "—"} · {formatDateTime(t.tradeDate)}</p>
                      </div>
                    </div>
                    <p className={cn("text-sm font-semibold", pnlColor(t.pnl))}>
                      {t.pnl != null ? formatCurrency(t.pnl) : "—"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Best combinations */}
      {s && (s.bestTrigger || s.bestTimeframe) && (
        <div className="bg-card border border-card-border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-primary" /> Top Performers
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {s.bestTimeframe && <div className="bg-muted/50 rounded-md p-3"><p className="text-xs text-muted-foreground">Best Timeframe</p><p className="text-sm font-bold text-foreground mt-1">{s.bestTimeframe}</p></div>}
            {s.bestTrigger && <div className="bg-muted/50 rounded-md p-3"><p className="text-xs text-muted-foreground">Best Trigger</p><p className="text-sm font-bold text-foreground mt-1">{s.bestTrigger}</p></div>}
            {s.bestSetup && <div className="bg-muted/50 rounded-md p-3"><p className="text-xs text-muted-foreground">Best Setup</p><p className="text-sm font-bold text-foreground mt-1">{s.bestSetup}</p></div>}
            {s.bestSession && <div className="bg-muted/50 rounded-md p-3"><p className="text-xs text-muted-foreground">Best Session</p><p className="text-sm font-bold text-foreground mt-1">{s.bestSession}</p></div>}
          </div>
        </div>
      )}
    </div>
  );
}
