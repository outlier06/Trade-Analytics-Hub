import { useState } from "react";
import { useListPsychologyLogs, useCreatePsychologyLog, useDeletePsychologyLog, getListPsychologyLogsQueryKey, useListAccounts } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDate, cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const NONE = "__none__";

const EMOTION_STATES = ["excellent", "good", "neutral", "anxious", "stressed", "fearful", "overconfident", "revenge_mode", "focused", "tired"];

function emotionColor(state: string) {
  const pos = ["excellent", "good", "focused"];
  const neg = ["anxious", "stressed", "fearful", "overconfident", "revenge_mode"];
  if (pos.includes(state)) return "bg-profit text-green-600 dark:text-green-400";
  if (neg.includes(state)) return "bg-loss text-red-600 dark:text-red-400";
  return "bg-muted text-muted-foreground";
}

function ScoreBar({ label, value }: { label: string; value: number | null | undefined }) {
  if (value == null) return null;
  const color = value >= 7 ? "bg-green-500" : value >= 4 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}/10</span></div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className={cn("h-full rounded-full", color)} style={{ width: `${value * 10}%` }} /></div>
    </div>
  );
}

export default function Psychology() {
  const { data: accounts } = useListAccounts();
  const { data: logs, isLoading } = useListPsychologyLogs();
  const createLog = useCreatePsychologyLog();
  const deleteLog = useDeletePsychologyLog();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ accountId: "", logDate: new Date().toISOString().slice(0, 10), emotionState: "neutral", energyLevel: "", stressLevel: "", focusLevel: "", notes: "", tradedToday: "", followedRules: "", overallScore: "" });

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }
  function optBool(v: string) { return v === "true" ? true : v === "false" ? false : null; }

  async function handleCreate() {
    createLog.mutate({
      data: {
        accountId: form.accountId ? parseInt(form.accountId, 10) : null,
        logDate: form.logDate,
        emotionState: form.emotionState,
        energyLevel: form.energyLevel ? parseInt(form.energyLevel, 10) : null,
        stressLevel: form.stressLevel ? parseInt(form.stressLevel, 10) : null,
        focusLevel: form.focusLevel ? parseInt(form.focusLevel, 10) : null,
        notes: form.notes || null,
        tradedToday: optBool(form.tradedToday),
        followedRules: optBool(form.followedRules),
        overallScore: form.overallScore ? parseInt(form.overallScore, 10) : null,
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPsychologyLogsQueryKey() });
        toast({ title: "Psychology log saved" });
        setOpen(false);
        setForm({ accountId: "", logDate: new Date().toISOString().slice(0, 10), emotionState: "neutral", energyLevel: "", stressLevel: "", focusLevel: "", notes: "", tradedToday: "", followedRules: "", overallScore: "" });
      },
      onError: () => toast({ title: "Failed to save log", variant: "destructive" }),
    });
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Psychology</h1>
          <p className="text-sm text-muted-foreground">Track your emotional state and mindset</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} data-testid="button-new-log"><Plus className="h-3.5 w-3.5 mr-1" /> Log Today</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : !logs?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground mb-3">No psychology logs yet.</p>
          <Button onClick={() => setOpen(true)}>Log your first entry</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className="bg-card border border-card-border rounded-lg p-4" data-testid={`psychology-log-${log.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", emotionColor(log.emotionState))}>{log.emotionState.replace(/_/g, " ")}</span>
                  <p className="text-xs text-muted-foreground">{formatDate(log.logDate)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {log.overallScore != null && <span className="text-xs font-bold text-foreground">{log.overallScore}/10</span>}
                  {log.tradedToday != null && <span className={cn("text-xs px-1.5 py-0.5 rounded", log.tradedToday ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground")}>{log.tradedToday ? "Traded" : "No trades"}</span>}
                  {log.followedRules != null && <span className={cn("text-xs px-1.5 py-0.5 rounded", log.followedRules ? "bg-profit text-green-600 dark:text-green-400" : "bg-loss text-red-600 dark:text-red-400")}>{log.followedRules ? "Rules followed" : "Rules broken"}</span>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <ScoreBar label="Energy" value={log.energyLevel} />
                <ScoreBar label="Focus" value={log.focusLevel} />
                <ScoreBar label="Stress" value={log.stressLevel ? (10 - log.stressLevel) : null} />
              </div>
              {log.notes && <p className="text-xs text-muted-foreground border-t border-border/50 pt-2">{log.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Psychology Log</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.logDate} onChange={e => set("logDate", e.target.value)} data-testid="input-log-date" />
              </div>
              <div className="grid gap-1.5">
                <Label>Account</Label>
                <Select value={form.accountId || NONE} onValueChange={v => set("accountId", v === NONE ? "" : v)}>
                  <SelectTrigger data-testid="select-psych-account"><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent><SelectItem value={NONE}>All accounts</SelectItem>{accounts?.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Emotional State</Label>
              <Select value={form.emotionState} onValueChange={v => set("emotionState", v)}>
                <SelectTrigger data-testid="select-emotion"><SelectValue /></SelectTrigger>
                <SelectContent>{EMOTION_STATES.map(e => <SelectItem key={e} value={e}>{e.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[["energyLevel", "Energy (1-10)"], ["focusLevel", "Focus (1-10)"], ["stressLevel", "Stress (1-10)"]].map(([key, label]) => (
                <div key={key} className="grid gap-1.5">
                  <Label className="text-xs">{label}</Label>
                  <Input type="number" min="1" max="10" value={form[key as keyof typeof form]} onChange={e => set(key, e.target.value)} placeholder="—" data-testid={`input-${key}`} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Traded Today?</Label>
                <Select value={form.tradedToday || NONE} onValueChange={v => set("tradedToday", v === NONE ? "" : v)}>
                  <SelectTrigger data-testid="select-traded"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent><SelectItem value={NONE}>—</SelectItem><SelectItem value="true">Yes</SelectItem><SelectItem value="false">No</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Followed Rules?</Label>
                <Select value={form.followedRules || NONE} onValueChange={v => set("followedRules", v === NONE ? "" : v)}>
                  <SelectTrigger data-testid="select-rules"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent><SelectItem value={NONE}>—</SelectItem><SelectItem value="true">Yes</SelectItem><SelectItem value="false">No</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Overall Score</Label>
                <Input type="number" min="1" max="10" value={form.overallScore} onChange={e => set("overallScore", e.target.value)} placeholder="—" data-testid="input-overall-score" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} placeholder="How are you feeling today?" data-testid="textarea-psych-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createLog.isPending} data-testid="button-save-log">
              {createLog.isPending ? "Saving..." : "Save Log"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
