import { useListAccounts, useGetAccountStats } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { Link } from "wouter";
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle } from "lucide-react";

function AccountRiskCard({ accountId }: { accountId: number }) {
  const { data: accounts } = useListAccounts();
  const { data: stats } = useGetAccountStats(accountId, { query: { enabled: !!accountId } });
  const account = accounts?.find(a => a.id === accountId);
  if (!account || !stats) return null;

  const ddPercent = account.initialBalance > 0 ? (stats.maxDrawdown / account.initialBalance) * 100 : 0;
  const maxDdLimit = account.maxDrawdown ?? 10;
  const ddRatio = maxDdLimit > 0 ? ddPercent / maxDdLimit : 0;
  const ddColor = ddRatio >= 0.8 ? "text-loss" : ddRatio >= 0.5 ? "text-yellow-500" : "text-profit";

  const alerts = [];
  if (ddRatio >= 0.8) alerts.push("Near max drawdown limit");
  if (stats.winRate < 40 && stats.totalTrades >= 5) alerts.push("Low win rate");
  if (stats.disciplineScore < 60 && stats.totalTrades >= 3) alerts.push("Low discipline score");

  const rules = [
    { label: "Max Drawdown", ok: ddRatio < 0.8, value: account.maxDrawdown ? `${maxDdLimit}% limit (${ddPercent.toFixed(1)}% used)` : "No limit set" },
    { label: "Daily Loss Limit", ok: true, value: account.dailyLossLimit ? formatCurrency(account.dailyLossLimit) : "No limit set" },
    { label: "Max Trades/Day", ok: true, value: account.maxTradesPerDay ? `${account.maxTradesPerDay} trades` : "No limit set" },
    { label: "Win Rate", ok: stats.winRate >= 40, value: formatPercent(stats.winRate) },
    { label: "Discipline Score", ok: stats.disciplineScore >= 60, value: `${stats.disciplineScore.toFixed(0)}%` },
    { label: "Profit Factor", ok: stats.profitFactor >= 1, value: stats.profitFactor.toFixed(2) },
  ];

  return (
    <div className="bg-card border border-card-border rounded-lg p-4 space-y-3" data-testid={`risk-card-${accountId}`}>
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/accounts/${accountId}`}><h3 className="font-semibold hover:text-primary cursor-pointer">{account.name}</h3></Link>
          <p className="text-xs text-muted-foreground">{account.status} · {formatCurrency(account.currentBalance, account.currency)}</p>
        </div>
        <div className="flex items-center gap-2">
          {alerts.length > 0 ? <ShieldAlert className="h-5 w-5 text-loss" /> : <ShieldCheck className="h-5 w-5 text-profit" />}
          {stats.totalTrades > 0 && <span className={cn("text-xs font-bold", stats.profitFactor >= 1.5 ? "text-profit" : stats.profitFactor >= 1 ? "text-yellow-500" : "text-loss")}>PF: {stats.profitFactor.toFixed(2)}</span>}
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-1">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-loss bg-loss/10 px-2 py-1.5 rounded-md">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" /> {a}
            </div>
          ))}
        </div>
      )}

      {/* Drawdown bar */}
      {account.maxDrawdown && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Drawdown usage</span>
            <span className={cn("font-medium", ddColor)}>{ddPercent.toFixed(1)}% / {maxDdLimit}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", ddRatio >= 0.8 ? "bg-red-500" : ddRatio >= 0.5 ? "bg-yellow-500" : "bg-green-500")} style={{ width: `${Math.min(100, ddRatio * 100)}%` }} />
          </div>
        </div>
      )}

      <div className="space-y-1.5 pt-1">
        {rules.map(r => (
          <div key={r.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              {r.ok ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-loss" />}
              <span className="text-muted-foreground">{r.label}</span>
            </div>
            <span className={cn("font-medium", !r.ok ? "text-loss" : "text-foreground")}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Risk() {
  const { data: accounts, isLoading } = useListAccounts();
  const activeAccounts = accounts?.filter(a => a.status === "active" || a.status === "passed") ?? [];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold">Risk Management</h1>
        <p className="text-sm text-muted-foreground">Monitor risk limits and discipline across all accounts</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : !accounts?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShieldAlert className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-3">No accounts yet.</p>
          <Link href="/accounts"><button className="text-sm text-primary hover:underline">Create an account to track risk</button></Link>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="bg-card border border-card-border rounded-lg p-4">
            <h2 className="text-sm font-semibold mb-3">Risk Rules Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="bg-muted/40 rounded-md p-3"><p className="text-2xl font-bold text-foreground">{accounts.length}</p><p className="text-xs text-muted-foreground mt-1">Total Accounts</p></div>
              <div className="bg-muted/40 rounded-md p-3"><p className="text-2xl font-bold text-green-500">{activeAccounts.length}</p><p className="text-xs text-muted-foreground mt-1">Active</p></div>
              <div className="bg-muted/40 rounded-md p-3"><p className="text-2xl font-bold text-red-500">{accounts.filter(a => a.status === "blown").length}</p><p className="text-xs text-muted-foreground mt-1">Blown</p></div>
              <div className="bg-muted/40 rounded-md p-3"><p className="text-2xl font-bold text-blue-500">{accounts.filter(a => a.status === "passed").length}</p><p className="text-xs text-muted-foreground mt-1">Passed</p></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {accounts.map(a => <AccountRiskCard key={a.id} accountId={a.id} />)}
          </div>
        </>
      )}
    </div>
  );
}
