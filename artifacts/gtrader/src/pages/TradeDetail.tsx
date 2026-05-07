import { useParams, Link, useLocation } from "wouter";
import { useGetTrade, useUpdateTrade, useDeleteTrade, getListTradesQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDateTime, pnlColor, resultBadgeClass, cn } from "@/lib/utils";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function Row({ label, value, className }: { label: string; value?: string | number | boolean | null; className?: string }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-start justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground w-36 flex-shrink-0">{label}</span>
      <span className={cn("text-sm font-medium text-right", className)}>{String(value)}</span>
    </div>
  );
}

export default function TradeDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id, 10);
  const [, setLocation] = useLocation();
  const { data: trade, isLoading } = useGetTrade(id, { query: { enabled: !!id } });
  const deleteTrade = useDeleteTrade();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  async function handleDelete() {
    if (!confirm("Delete this trade permanently?")) return;
    deleteTrade.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTradesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        toast({ title: "Trade deleted" });
        setLocation("/journal");
      },
    });
  }

  if (isLoading) return <div className="p-6"><div className="h-64 bg-muted rounded-lg animate-pulse" /></div>;
  if (!trade) return <div className="p-6"><p className="text-muted-foreground">Trade not found.</p></div>;

  const disciplineFlags = [
    trade.followedPlan != null && `${trade.followedPlan ? "Followed" : "Broke"} plan`,
    trade.validSetup != null && (trade.validSetup ? "Valid setup" : "Invalid setup"),
    trade.riskRespected != null && (trade.riskRespected ? "Risk respected" : "Risk violated"),
    trade.impulsiveTrade != null && (trade.impulsiveTrade ? "Impulsive trade" : "Planned entry"),
  ].filter(Boolean);

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/journal"><button className="p-1.5 rounded-md hover:bg-accent transition-colors" data-testid="button-back"><ArrowLeft className="h-4 w-4" /></button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{trade.asset}</h1>
            <span className={cn("text-xs px-2 py-0.5 rounded font-medium", trade.direction === "buy" ? "bg-profit text-green-600 dark:text-green-400" : "bg-loss text-red-600 dark:text-red-400")}>{trade.direction?.toUpperCase()}</span>
            <span className={cn("text-xs px-2 py-0.5 rounded font-medium", resultBadgeClass(trade.result))}>{trade.result}</span>
          </div>
          <p className="text-sm text-muted-foreground">{formatDateTime(trade.tradeDate)}</p>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={handleDelete} data-testid="button-delete-trade">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* P&L highlight */}
      <div className="bg-card border border-card-border rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">P&L</p>
          <p className={cn("text-3xl font-bold mt-1", pnlColor(trade.pnl))}>{trade.pnl != null ? formatCurrency(trade.pnl) : "—"}</p>
        </div>
        <div className="text-right">
          {trade.riskReward != null && <div><p className="text-xs text-muted-foreground">R:R</p><p className="text-lg font-bold">{trade.riskReward.toFixed(2)}R</p></div>}
          {trade.riskPercent != null && <p className="text-xs text-muted-foreground mt-1">{trade.riskPercent}% risk</p>}
        </div>
      </div>

      {/* Trade details */}
      <div className="bg-card border border-card-border rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-2">Trade Details</h2>
        <Row label="Timeframe" value={trade.timeframe} />
        <Row label="HTF Bias" value={trade.higherTimeframeBias} />
        <Row label="Entry Trigger" value={trade.entryTrigger} />
        <Row label="Setup" value={trade.setup} />
        <Row label="Session" value={trade.session} />
        <Row label="Strategy" value={trade.strategy} />
        <Row label="Entry Price" value={trade.entryPrice?.toFixed(5)} />
        <Row label="Stop Loss" value={trade.stopLoss?.toFixed(5)} />
        <Row label="Take Profit" value={trade.takeProfit?.toFixed(5)} />
        <Row label="Risk Amount" value={trade.riskAmount != null ? formatCurrency(trade.riskAmount) : undefined} />
      </div>

      {/* Discipline */}
      {disciplineFlags.length > 0 && (
        <div className="bg-card border border-card-border rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-2">Discipline</h2>
          <div className="flex flex-wrap gap-2">
            {disciplineFlags.map((flag, i) => (
              <span key={i} className={cn("text-xs px-2 py-1 rounded-full", typeof flag === "string" && (flag.startsWith("Broke") || flag.startsWith("Invalid") || flag.startsWith("Risk violated") || flag.startsWith("Impulsive")) ? "bg-loss text-red-600 dark:text-red-400" : "bg-profit text-green-600 dark:text-green-400")}>
                {flag}
              </span>
            ))}
          </div>
          {trade.disciplineScore != null && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Discipline Score</span>
                <span>{trade.disciplineScore}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", trade.disciplineScore >= 70 ? "bg-green-500" : trade.disciplineScore >= 40 ? "bg-yellow-500" : "bg-red-500")} style={{ width: `${trade.disciplineScore}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Psychology */}
      {(trade.emotionBefore || trade.emotionAfter) && (
        <div className="bg-card border border-card-border rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-2">Psychology</h2>
          <div className="grid grid-cols-2 gap-3">
            {trade.emotionBefore && <div className="bg-muted/40 rounded-md p-3"><p className="text-xs text-muted-foreground">Before</p><p className="text-sm font-medium mt-1 capitalize">{trade.emotionBefore}</p></div>}
            {trade.emotionAfter && <div className="bg-muted/40 rounded-md p-3"><p className="text-xs text-muted-foreground">After</p><p className="text-sm font-medium mt-1 capitalize">{trade.emotionAfter}</p></div>}
          </div>
        </div>
      )}

      {/* Notes */}
      {trade.notes && (
        <div className="bg-card border border-card-border rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-2">Notes</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{trade.notes}</p>
        </div>
      )}

      {trade.tags && (
        <div className="flex flex-wrap gap-1.5">
          {trade.tags.split(",").map(tag => (
            <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{tag.trim()}</span>
          ))}
        </div>
      )}
    </div>
  );
}
