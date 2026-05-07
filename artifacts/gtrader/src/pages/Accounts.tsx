import { useState } from "react";
import { useListAccounts, useCreateAccount, useDeleteAccount, getListAccountsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, ACCOUNT_TYPES, ACCOUNT_STATUSES, cn } from "@/lib/utils";
import { Link } from "wouter";
import { Plus, Trash2, Edit, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

function statusColor(status: string) {
  switch (status) {
    case "active": return "bg-green-500/10 text-green-500";
    case "passed": return "bg-blue-500/10 text-blue-500";
    case "failed": return "bg-orange-500/10 text-orange-500";
    case "blown": return "bg-red-500/10 text-red-500";
    default: return "bg-muted text-muted-foreground";
  }
}

function typeLabel(type: string) {
  const map: Record<string, string> = { forex: "Forex", crypto: "Crypto", prop_firm: "Prop Firm", demo: "Demo", cent: "Cent" };
  return map[type] ?? type;
}

export default function Accounts() {
  const { data: accounts, isLoading } = useListAccounts();
  const createAccount = useCreateAccount();
  const deleteAccount = useDeleteAccount();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", brokerName: "", accountType: "forex", initialBalance: "", currentBalance: "", currency: "USD", status: "active", growthTarget: "", dailyLossLimit: "", maxDrawdown: "" });

  function reset() {
    setForm({ name: "", brokerName: "", accountType: "forex", initialBalance: "", currentBalance: "", currency: "USD", status: "active", growthTarget: "", dailyLossLimit: "", maxDrawdown: "" });
  }

  async function handleCreate() {
    if (!form.name || !form.initialBalance) return;
    createAccount.mutate({
      data: {
        name: form.name,
        brokerName: form.brokerName || null,
        accountType: form.accountType,
        initialBalance: parseFloat(form.initialBalance),
        currentBalance: parseFloat(form.currentBalance || form.initialBalance),
        currency: form.currency,
        status: form.status,
        growthTarget: form.growthTarget ? parseFloat(form.growthTarget) : null,
        dailyLossLimit: form.dailyLossLimit ? parseFloat(form.dailyLossLimit) : null,
        maxDrawdown: form.maxDrawdown ? parseFloat(form.maxDrawdown) : null,
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAccountsQueryKey() });
        toast({ title: "Account created" });
        setOpen(false); reset();
      },
      onError: () => toast({ title: "Failed to create account", variant: "destructive" }),
    });
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete account "${name}"? This will also delete all its trades.`)) return;
    deleteAccount.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAccountsQueryKey() });
        toast({ title: "Account deleted" });
      },
    });
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Accounts</h1>
          <p className="text-sm text-muted-foreground">Manage all your trading accounts</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm" data-testid="button-add-account">
          <Plus className="h-4 w-4 mr-1" /> New Account
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : !accounts?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground mb-3">No accounts yet.</p>
          <Button onClick={() => setOpen(true)} data-testid="button-add-account-empty">Create your first account</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => {
            const growth = acc.initialBalance > 0 ? ((acc.currentBalance - acc.initialBalance) / acc.initialBalance) * 100 : 0;
            const isPositive = acc.currentBalance >= acc.initialBalance;
            return (
              <div key={acc.id} className="bg-card border border-card-border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors" data-testid={`account-card-${acc.id}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/accounts/${acc.id}`}>
                      <h3 className="font-semibold text-foreground hover:text-primary cursor-pointer transition-colors">{acc.name}</h3>
                    </Link>
                    <p className="text-xs text-muted-foreground">{acc.brokerName ?? typeLabel(acc.accountType)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColor(acc.status))}>{acc.status}</span>
                    <button onClick={() => handleDelete(acc.id, acc.name)} className="p-1 text-muted-foreground hover:text-destructive transition-colors" data-testid={`button-delete-account-${acc.id}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-end justify-between">
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(acc.currentBalance, acc.currency)}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Initial: {formatCurrency(acc.initialBalance, acc.currency)}</span>
                    <span className={cn("flex items-center gap-0.5 font-medium", isPositive ? "text-profit" : "text-loss")}>
                      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="pt-1 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{typeLabel(acc.accountType)} · {acc.currency}</span>
                  <Link href={`/accounts/${acc.id}`}>
                    <button className="text-xs text-primary hover:underline" data-testid={`link-account-detail-${acc.id}`}>View details</button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Account</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="acc-name">Account Name *</Label>
              <Input id="acc-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Forex Live 1" data-testid="input-account-name" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="acc-broker">Broker</Label>
              <Input id="acc-broker" value={form.brokerName} onChange={e => setForm(f => ({ ...f, brokerName: e.target.value }))} placeholder="e.g. IC Markets" data-testid="input-account-broker" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Type</Label>
                <Select value={form.accountType} onValueChange={v => setForm(f => ({ ...f, accountType: v }))}>
                  <SelectTrigger data-testid="select-account-type"><SelectValue /></SelectTrigger>
                  <SelectContent>{ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger data-testid="select-account-status"><SelectValue /></SelectTrigger>
                  <SelectContent>{ACCOUNT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="acc-initial">Initial Balance *</Label>
                <Input id="acc-initial" type="number" value={form.initialBalance} onChange={e => setForm(f => ({ ...f, initialBalance: e.target.value }))} placeholder="10000" data-testid="input-initial-balance" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="acc-currency">Currency</Label>
                <Input id="acc-currency" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} placeholder="USD" data-testid="input-currency" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="acc-maxdd">Max Drawdown %</Label>
                <Input id="acc-maxdd" type="number" value={form.maxDrawdown} onChange={e => setForm(f => ({ ...f, maxDrawdown: e.target.value }))} placeholder="10" data-testid="input-max-drawdown" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="acc-target">Growth Target %</Label>
                <Input id="acc-target" type="number" value={form.growthTarget} onChange={e => setForm(f => ({ ...f, growthTarget: e.target.value }))} placeholder="20" data-testid="input-growth-target" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createAccount.isPending || !form.name || !form.initialBalance} data-testid="button-create-account">
              {createAccount.isPending ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
