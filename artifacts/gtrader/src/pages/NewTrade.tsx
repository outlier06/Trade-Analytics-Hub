import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useCreateTrade, useListAccounts, getListTradesQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { TIMEFRAMES, HIGHER_TF, ENTRY_TRIGGERS, SESSIONS, SETUPS, EMOTIONS_BEFORE, EMOTIONS_AFTER } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NONE = "__none__";

type FormState = {
  accountId: string; tradeDate: string; asset: string; direction: string; strategy: string;
  setup: string; timeframe: string; higherTimeframeBias: string; entryTrigger: string; session: string;
  entryPrice: string; stopLoss: string; takeProfit: string; riskPercent: string; riskAmount: string;
  riskReward: string; result: string; pnl: string; followedPlan: string; validSetup: string;
  impulsiveTrade: string; riskRespected: string; emotionBefore: string; emotionAfter: string;
  disciplineScore: string; notes: string; tags: string;
};

function initialForm(): FormState {
  return {
    accountId: "", tradeDate: new Date().toISOString().slice(0, 16), asset: "", direction: "buy",
    strategy: "", setup: "", timeframe: "", higherTimeframeBias: "", entryTrigger: "", session: "",
    entryPrice: "", stopLoss: "", takeProfit: "", riskPercent: "", riskAmount: "", riskReward: "",
    result: "win", pnl: "", followedPlan: "", validSetup: "", impulsiveTrade: "", riskRespected: "",
    emotionBefore: "", emotionAfter: "", disciplineScore: "", notes: "", tags: "",
  };
}

export default function NewTrade() {
  const [, setLocation] = useLocation();
  const { data: accounts } = useListAccounts();
  const createTrade = useCreateTrade();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(initialForm);

  function set(key: keyof FormState, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function optionalBool(v: string): boolean | null {
    if (v === "true") return true;
    if (v === "false") return false;
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.accountId || !form.asset || !form.result) {
      toast({ title: "Fill required fields", variant: "destructive" }); return;
    }
    createTrade.mutate({
      data: {
        accountId: parseInt(form.accountId, 10),
        tradeDate: form.tradeDate,
        asset: form.asset,
        direction: form.direction,
        strategy: form.strategy || null,
        setup: form.setup === NONE ? null : form.setup || null,
        timeframe: form.timeframe === NONE ? null : form.timeframe || null,
        higherTimeframeBias: form.higherTimeframeBias === NONE ? null : form.higherTimeframeBias || null,
        entryTrigger: form.entryTrigger === NONE ? null : form.entryTrigger || null,
        session: form.session === NONE ? null : form.session || null,
        entryPrice: form.entryPrice ? parseFloat(form.entryPrice) : null,
        stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : null,
        takeProfit: form.takeProfit ? parseFloat(form.takeProfit) : null,
        riskPercent: form.riskPercent ? parseFloat(form.riskPercent) : null,
        riskAmount: form.riskAmount ? parseFloat(form.riskAmount) : null,
        riskReward: form.riskReward ? parseFloat(form.riskReward) : null,
        result: form.result,
        pnl: form.pnl ? parseFloat(form.pnl) : null,
        followedPlan: optionalBool(form.followedPlan),
        validSetup: optionalBool(form.validSetup),
        impulsiveTrade: optionalBool(form.impulsiveTrade),
        riskRespected: optionalBool(form.riskRespected),
        emotionBefore: form.emotionBefore === NONE ? null : form.emotionBefore || null,
        emotionAfter: form.emotionAfter === NONE ? null : form.emotionAfter || null,
        disciplineScore: form.disciplineScore ? parseInt(form.disciplineScore, 10) : null,
        notes: form.notes || null,
        tags: form.tags || null,
        screenshotUrl: null,
      },
    }, {
      onSuccess: (trade) => {
        queryClient.invalidateQueries({ queryKey: getListTradesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        toast({ title: "Trade logged" });
        setLocation(`/journal/${trade.id}`);
      },
      onError: () => toast({ title: "Failed to create trade", variant: "destructive" }),
    });
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/journal"><button className="p-1.5 rounded-md hover:bg-accent transition-colors" data-testid="button-back"><ArrowLeft className="h-4 w-4" /></button></Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">New Trade</h1>
          <p className="text-sm text-muted-foreground">Log a trade with full details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Core info */}
        <div className="bg-card border border-card-border rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Trade Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Account *</Label>
              <Select value={form.accountId} onValueChange={v => set("accountId", v)}>
                <SelectTrigger data-testid="select-account"><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>{accounts?.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Date & Time</Label>
              <Input type="datetime-local" value={form.tradeDate} onChange={e => set("tradeDate", e.target.value)} data-testid="input-trade-date" />
            </div>
            <div className="grid gap-1.5">
              <Label>Asset *</Label>
              <Input value={form.asset} onChange={e => set("asset", e.target.value)} placeholder="e.g. NAS100, EURUSD" data-testid="input-asset" />
            </div>
            <div className="grid gap-1.5">
              <Label>Direction</Label>
              <Select value={form.direction} onValueChange={v => set("direction", v)}>
                <SelectTrigger data-testid="select-direction"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="buy">Buy (Long)</SelectItem><SelectItem value="sell">Sell (Short)</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Result *</Label>
              <Select value={form.result} onValueChange={v => set("result", v)}>
                <SelectTrigger data-testid="select-result"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="win">Win</SelectItem><SelectItem value="loss">Loss</SelectItem><SelectItem value="breakeven">Breakeven</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>P&L ($)</Label>
              <Input type="number" step="0.01" value={form.pnl} onChange={e => set("pnl", e.target.value)} placeholder="e.g. 250.00 or -100.00" data-testid="input-pnl" />
            </div>
          </div>
        </div>

        {/* Timeframe & trigger */}
        <div className="bg-card border border-card-border rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Timeframe & Entry</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label>Timeframe</Label>
              <Select value={form.timeframe || NONE} onValueChange={v => set("timeframe", v === NONE ? "" : v)}>
                <SelectTrigger data-testid="select-timeframe"><SelectValue placeholder="Select TF" /></SelectTrigger>
                <SelectContent><SelectItem value={NONE}>None</SelectItem>{TIMEFRAMES.map(tf => <SelectItem key={tf} value={tf}>{tf}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>HTF Bias</Label>
              <Select value={form.higherTimeframeBias || NONE} onValueChange={v => set("higherTimeframeBias", v === NONE ? "" : v)}>
                <SelectTrigger data-testid="select-htf"><SelectValue placeholder="HTF Bias" /></SelectTrigger>
                <SelectContent><SelectItem value={NONE}>None</SelectItem>{HIGHER_TF.map(tf => <SelectItem key={tf} value={tf}>{tf}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Entry Trigger</Label>
              <Select value={form.entryTrigger || NONE} onValueChange={v => set("entryTrigger", v === NONE ? "" : v)}>
                <SelectTrigger data-testid="select-trigger"><SelectValue placeholder="Trigger" /></SelectTrigger>
                <SelectContent><SelectItem value={NONE}>None</SelectItem>{ENTRY_TRIGGERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Setup</Label>
              <Select value={form.setup || NONE} onValueChange={v => set("setup", v === NONE ? "" : v)}>
                <SelectTrigger data-testid="select-setup"><SelectValue placeholder="Setup" /></SelectTrigger>
                <SelectContent><SelectItem value={NONE}>None</SelectItem>{SETUPS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Session</Label>
              <Select value={form.session || NONE} onValueChange={v => set("session", v === NONE ? "" : v)}>
                <SelectTrigger data-testid="select-session"><SelectValue placeholder="Session" /></SelectTrigger>
                <SelectContent><SelectItem value={NONE}>None</SelectItem>{SESSIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Strategy</Label>
              <Input value={form.strategy} onChange={e => set("strategy", e.target.value)} placeholder="e.g. SMC, ICT" data-testid="input-strategy" />
            </div>
          </div>
        </div>

        {/* Price levels */}
        <div className="bg-card border border-card-border rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Price & Risk</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="grid gap-1.5"><Label>Entry Price</Label><Input type="number" step="any" value={form.entryPrice} onChange={e => set("entryPrice", e.target.value)} placeholder="0.00" data-testid="input-entry-price" /></div>
            <div className="grid gap-1.5"><Label>Stop Loss</Label><Input type="number" step="any" value={form.stopLoss} onChange={e => set("stopLoss", e.target.value)} placeholder="0.00" data-testid="input-stop-loss" /></div>
            <div className="grid gap-1.5"><Label>Take Profit</Label><Input type="number" step="any" value={form.takeProfit} onChange={e => set("takeProfit", e.target.value)} placeholder="0.00" data-testid="input-take-profit" /></div>
            <div className="grid gap-1.5"><Label>R:R</Label><Input type="number" step="0.1" value={form.riskReward} onChange={e => set("riskReward", e.target.value)} placeholder="2.0" data-testid="input-rr" /></div>
            <div className="grid gap-1.5"><Label>Risk %</Label><Input type="number" step="0.1" value={form.riskPercent} onChange={e => set("riskPercent", e.target.value)} placeholder="1.0" data-testid="input-risk-percent" /></div>
            <div className="grid gap-1.5"><Label>Risk Amount</Label><Input type="number" step="0.01" value={form.riskAmount} onChange={e => set("riskAmount", e.target.value)} placeholder="100" data-testid="input-risk-amount" /></div>
          </div>
        </div>

        {/* Discipline */}
        <div className="bg-card border border-card-border rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Discipline</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: "followedPlan", label: "Followed Plan?" },
              { key: "validSetup", label: "Valid Setup?" },
              { key: "riskRespected", label: "Risk Respected?" },
              { key: "impulsiveTrade", label: "Impulsive?" },
            ].map(({ key, label }) => (
              <div key={key} className="grid gap-1.5">
                <Label>{label}</Label>
                <Select value={form[key as keyof FormState] || NONE} onValueChange={v => set(key as keyof FormState, v === NONE ? "" : v)}>
                  <SelectTrigger data-testid={`select-${key}`}><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent><SelectItem value={NONE}>—</SelectItem><SelectItem value="true">Yes</SelectItem><SelectItem value="false">No</SelectItem></SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="grid gap-1.5">
            <Label>Discipline Score (0–100)</Label>
            <Input type="number" min="0" max="100" value={form.disciplineScore} onChange={e => set("disciplineScore", e.target.value)} placeholder="85" data-testid="input-discipline-score" />
          </div>
        </div>

        {/* Psychology */}
        <div className="bg-card border border-card-border rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Psychology</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Emotion Before</Label>
              <Select value={form.emotionBefore || NONE} onValueChange={v => set("emotionBefore", v === NONE ? "" : v)}>
                <SelectTrigger data-testid="select-emotion-before"><SelectValue placeholder="Before trade" /></SelectTrigger>
                <SelectContent><SelectItem value={NONE}>None</SelectItem>{EMOTIONS_BEFORE.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Emotion After</Label>
              <Select value={form.emotionAfter || NONE} onValueChange={v => set("emotionAfter", v === NONE ? "" : v)}>
                <SelectTrigger data-testid="select-emotion-after"><SelectValue placeholder="After trade" /></SelectTrigger>
                <SelectContent><SelectItem value={NONE}>None</SelectItem>{EMOTIONS_AFTER.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-card border border-card-border rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Notes</h2>
          <div className="grid gap-1.5">
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Trade rationale, observations..." rows={3} data-testid="textarea-notes" />
          </div>
          <div className="grid gap-1.5">
            <Label>Tags (comma-separated)</Label>
            <Input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="killzone, high-conviction, news" data-testid="input-tags" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={createTrade.isPending} data-testid="button-submit-trade">
            {createTrade.isPending ? "Saving..." : "Save Trade"}
          </Button>
          <Link href="/journal"><Button type="button" variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
