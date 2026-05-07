import { useState } from "react";
import { useListTrades, useDeleteTrade, getListTradesQueryKey, useListAccounts } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate, pnlColor, resultBadgeClass, cn, TIMEFRAMES, SESSIONS, SETUPS, ENTRY_TRIGGERS } from "@/lib/utils";
import { Link } from "wouter";
import { Plus, Trash2, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const ALL = "__all__";

export default function Journal() {
  const { data: accounts } = useListAccounts();
  const [filters, setFilters] = useState<{ accountId?: number; result?: string; timeframe?: string; session?: string; setup?: string; entryTrigger?: string }>({});
  const [showFilters, setShowFilters] = useState(false);
  const { data: trades, isLoading } = useListTrades(filters);
  const deleteTrade = useDeleteTrade();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  function setFilter(key: string, value: string) {
    setFilters(f => value === ALL ? (({ [key]: _, ...rest }) => rest)(f as Record<string, string>) : { ...f, [key]: value === ALL ? undefined : (["accountId"].includes(key) ? parseInt(value, 10) : value) });
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this trade?")) return;
    deleteTrade.mutate({ id }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListTradesQueryKey() }); toast({ title: "Trade deleted" }); },
    });
  }

  const activeFilterCount = Object.keys(filters).length;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Trade Journal</h1>
          <p className="text-sm text-muted-foreground">{trades?.length ?? 0} trade{trades?.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} data-testid="button-toggle-filters">
            <Filter className="h-3.5 w-3.5 mr-1" />
            Filters {activeFilterCount > 0 && <span className="ml-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">{activeFilterCount}</span>}
          </Button>
          <Link href="/journal/new">
            <Button size="sm" data-testid="button-new-trade"><Plus className="h-3.5 w-3.5 mr-1" /> New Trade</Button>
          </Link>
        </div>
      </div>

      {showFilters && (
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Filters</p>
            {activeFilterCount > 0 && <button onClick={() => setFilters({})} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><X className="h-3 w-3" /> Clear all</button>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <Select value={filters.accountId?.toString() ?? ALL} onValueChange={v => setFilter("accountId", v)}>
              <SelectTrigger className="text-xs" data-testid="filter-account"><SelectValue placeholder="Account" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All accounts</SelectItem>
                {accounts?.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.result ?? ALL} onValueChange={v => setFilter("result", v)}>
              <SelectTrigger className="text-xs" data-testid="filter-result"><SelectValue placeholder="Result" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All results</SelectItem>
                <SelectItem value="win">Win</SelectItem>
                <SelectItem value="loss">Loss</SelectItem>
                <SelectItem value="breakeven">Breakeven</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.timeframe ?? ALL} onValueChange={v => setFilter("timeframe", v)}>
              <SelectTrigger className="text-xs" data-testid="filter-timeframe"><SelectValue placeholder="Timeframe" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All TFs</SelectItem>
                {TIMEFRAMES.map(tf => <SelectItem key={tf} value={tf}>{tf}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.session ?? ALL} onValueChange={v => setFilter("session", v)}>
              <SelectTrigger className="text-xs" data-testid="filter-session"><SelectValue placeholder="Session" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All sessions</SelectItem>
                {SESSIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.setup ?? ALL} onValueChange={v => setFilter("setup", v)}>
              <SelectTrigger className="text-xs" data-testid="filter-setup"><SelectValue placeholder="Setup" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All setups</SelectItem>
                {SETUPS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.entryTrigger ?? ALL} onValueChange={v => setFilter("entryTrigger", v)}>
              <SelectTrigger className="text-xs" data-testid="filter-trigger"><SelectValue placeholder="Trigger" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All triggers</SelectItem>
                {ENTRY_TRIGGERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : !trades?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground mb-3">{activeFilterCount > 0 ? "No trades match your filters." : "No trades yet."}</p>
          {!activeFilterCount && <Link href="/journal/new"><Button data-testid="button-log-first-trade">Log your first trade</Button></Link>}
        </div>
      ) : (
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Asset</th>
                  <th className="text-left px-4 py-3 font-medium">TF</th>
                  <th className="text-left px-4 py-3 font-medium">Setup</th>
                  <th className="text-left px-4 py-3 font-medium">Trigger</th>
                  <th className="text-left px-4 py-3 font-medium">Session</th>
                  <th className="text-left px-4 py-3 font-medium">R:R</th>
                  <th className="text-left px-4 py-3 font-medium">Result</th>
                  <th className="text-right px-4 py-3 font-medium">P&L</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {trades.map(t => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-accent/40 transition-colors" data-testid={`trade-row-${t.id}`}>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(t.tradeDate)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/journal/${t.id}`}>
                        <span className="font-medium hover:text-primary cursor-pointer">{t.asset}</span>
                      </Link>
                      <span className={cn("ml-1 text-xs", t.direction === "buy" ? "text-profit" : "text-loss")}>{t.direction?.toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t.timeframe ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.setup ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.entryTrigger ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.session ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.riskReward != null ? `${t.riskReward.toFixed(1)}R` : "—"}</td>
                    <td className="px-4 py-3"><span className={cn("text-xs px-2 py-0.5 rounded", resultBadgeClass(t.result))}>{t.result}</span></td>
                    <td className={cn("px-4 py-3 text-right font-semibold", pnlColor(t.pnl))}>{t.pnl != null ? formatCurrency(t.pnl) : "—"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(t.id)} className="text-muted-foreground hover:text-destructive transition-colors" data-testid={`button-delete-trade-${t.id}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
