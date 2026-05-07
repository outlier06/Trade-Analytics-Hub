import { useState } from "react";
import { useGetTimeframeAnalytics, useGetTriggerAnalytics, useGetSessionAnalytics, useGetSetupAnalytics, useGetCombinationAnalytics, useListAccounts } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const ALL = "__all__";

function winRateColor(wr: number) {
  if (wr >= 60) return "text-profit";
  if (wr >= 40) return "text-yellow-500";
  return "text-loss";
}

function AnalyticsTable({ data, keyLabel, keyField }: { data: { winRate: number; totalPnl: number; totalTrades: number; profitFactor: number; averageRR: number; wins: number; losses: number; [key: string]: unknown }[]; keyLabel: string; keyField: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th className="text-left py-2 pr-3 font-medium">{keyLabel}</th>
            <th className="text-right py-2 pr-3 font-medium">Trades</th>
            <th className="text-right py-2 pr-3 font-medium">Win Rate</th>
            <th className="text-right py-2 pr-3 font-medium">P&L</th>
            <th className="text-right py-2 pr-3 font-medium">Profit Factor</th>
            <th className="text-right py-2 font-medium">Avg R:R</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-accent/40 transition-colors">
              <td className="py-2 pr-3 font-medium">{String(row[keyField] ?? "Unknown")}</td>
              <td className="py-2 pr-3 text-right text-muted-foreground">{row.totalTrades}</td>
              <td className={cn("py-2 pr-3 text-right font-semibold", winRateColor(row.winRate))}>{formatPercent(row.winRate)}</td>
              <td className={cn("py-2 pr-3 text-right font-semibold", row.totalPnl >= 0 ? "text-profit" : "text-loss")}>{formatCurrency(row.totalPnl)}</td>
              <td className="py-2 pr-3 text-right text-muted-foreground">{row.profitFactor.toFixed(2)}</td>
              <td className="py-2 text-right text-muted-foreground">{row.averageRR.toFixed(2)}R</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Analytics() {
  const { data: accounts } = useListAccounts();
  const [accountId, setAccountId] = useState<number | undefined>();
  const params = accountId ? { accountId } : {};
  const { data: timeframes } = useGetTimeframeAnalytics(params);
  const { data: triggers } = useGetTriggerAnalytics(params);
  const { data: sessions } = useGetSessionAnalytics(params);
  const { data: setups } = useGetSetupAnalytics(params);
  const { data: combinations } = useGetCombinationAnalytics(params);
  const [tab, setTab] = useState<"timeframes" | "triggers" | "sessions" | "setups" | "combinations">("timeframes");

  const tabs = [
    { key: "timeframes", label: "Timeframes" },
    { key: "triggers", label: "Triggers" },
    { key: "sessions", label: "Sessions" },
    { key: "setups", label: "Setups" },
    { key: "combinations", label: "Best Combos" },
  ] as const;

  const chartData = {
    timeframes: timeframes?.slice(0, 8).map(d => ({ name: d.timeframe, winRate: parseFloat(d.winRate.toFixed(1)), pnl: d.totalPnl })) ?? [],
    triggers: triggers?.slice(0, 8).map(d => ({ name: d.entryTrigger.slice(0, 10), winRate: parseFloat(d.winRate.toFixed(1)), pnl: d.totalPnl })) ?? [],
    sessions: sessions?.map(d => ({ name: d.session, winRate: parseFloat(d.winRate.toFixed(1)), pnl: d.totalPnl })) ?? [],
    setups: setups?.slice(0, 8).map(d => ({ name: d.setup.slice(0, 12), winRate: parseFloat(d.winRate.toFixed(1)), pnl: d.totalPnl })) ?? [],
    combinations: [],
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Deep performance breakdown</p>
        </div>
        <Select value={accountId?.toString() ?? ALL} onValueChange={v => setAccountId(v === ALL ? undefined : parseInt(v, 10))}>
          <SelectTrigger className="w-40 text-sm" data-testid="select-analytics-account">
            <SelectValue placeholder="All accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All accounts</SelectItem>
            {accounts?.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn("px-3 py-1.5 text-sm rounded-md font-medium transition-colors", tab === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            data-testid={`tab-${t.key}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "combinations" && chartData[tab].length > 0 && (
        <div className="bg-card border border-card-border rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-3">Win Rate by {tabs.find(t => t.key === tab)?.label}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData[tab]} margin={{ top: 5, right: 5, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, "Win Rate"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
              <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                {chartData[tab].map((entry, i) => <Cell key={i} fill={entry.winRate >= 60 ? "hsl(142 71% 45%)" : entry.winRate >= 40 ? "hsl(38 92% 50%)" : "hsl(0 72% 51%)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-card border border-card-border rounded-lg p-4">
        {tab === "timeframes" && (
          <>
            <h2 className="text-sm font-semibold mb-3">Timeframe Performance</h2>
            {timeframes?.length ? <AnalyticsTable data={timeframes} keyLabel="Timeframe" keyField="timeframe" /> : <p className="text-sm text-muted-foreground py-4 text-center">No data yet.</p>}
          </>
        )}
        {tab === "triggers" && (
          <>
            <h2 className="text-sm font-semibold mb-3">Entry Trigger Performance</h2>
            {triggers?.length ? <AnalyticsTable data={triggers} keyLabel="Entry Trigger" keyField="entryTrigger" /> : <p className="text-sm text-muted-foreground py-4 text-center">No data yet.</p>}
          </>
        )}
        {tab === "sessions" && (
          <>
            <h2 className="text-sm font-semibold mb-3">Session Performance</h2>
            {sessions?.length ? <AnalyticsTable data={sessions} keyLabel="Session" keyField="session" /> : <p className="text-sm text-muted-foreground py-4 text-center">No data yet.</p>}
          </>
        )}
        {tab === "setups" && (
          <>
            <h2 className="text-sm font-semibold mb-3">Setup Performance</h2>
            {setups?.length ? <AnalyticsTable data={setups} keyLabel="Setup" keyField="setup" /> : <p className="text-sm text-muted-foreground py-4 text-center">No data yet.</p>}
          </>
        )}
        {tab === "combinations" && (
          <>
            <h2 className="text-sm font-semibold mb-3">Best Setup Combinations</h2>
            {combinations?.length ? (
              <div className="space-y-2">
                {combinations.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg" data-testid={`combo-row-${i}`}>
                    <div>
                      <p className="text-sm font-medium">{[c.timeframe, c.entryTrigger, c.setup].filter(Boolean).join(" + ") || "General"}</p>
                      <p className="text-xs text-muted-foreground">{c.totalTrades} trades</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-bold", c.winRate >= 60 ? "text-profit" : c.winRate >= 40 ? "text-yellow-500" : "text-loss")}>{c.winRate.toFixed(1)}%</p>
                      <p className={cn("text-xs", c.totalPnl >= 0 ? "text-profit" : "text-loss")}>{formatCurrency(c.totalPnl)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground py-4 text-center">Log at least 2 trades with the same TF+Trigger+Setup combination to see combo analytics.</p>}
          </>
        )}
      </div>
    </div>
  );
}
