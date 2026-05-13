import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState, useEffect } from "react";
import { findSubstitutes, type SubstituteSuggestion } from "@/lib/substitutes";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Sparkles, ThumbsDown, ThumbsUp, History, RotateCcw, X } from "lucide-react";
import { z } from "zod";
import { REJECT_REASONS, type SubstitutionDecision } from "@/lib/types";

const searchSchema = z.object({ shiftId: z.string().optional() });

export const Route = createFileRoute("/simulador")({
  head: () => ({ meta: [{ title: "Simulador de baixa — TornAI" }] }),
  validateSearch: searchSchema,
  component: Simulador,
});

function Simulador() {
  const { professionals, shifts, assignShift, addAbsence, decisions, addDecision, clearDecisions } = useStore();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [profId, setProfId] = useState<string>("");
  const [shiftId, setShiftId] = useState<string>(search.shiftId ?? "");
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; suggestion: SubstituteSuggestion | null }>({ open: false, suggestion: null });
  const [rejectReason, setRejectReason] = useState<string>("");
  const [rejectNote, setRejectNote] = useState<string>("");

  useEffect(() => {
    if (search.shiftId) setShiftId(search.shiftId);
  }, [search.shiftId]);

  // Reset rejected list quan canvia el torn
  useEffect(() => {
    setRejectedIds([]);
  }, [shiftId, profId]);

  const profMap = useMemo(() => Object.fromEntries(professionals.map((p) => [p.id, p])), [professionals]);
  const shift = shifts.find((s) => s.id === shiftId) ?? null;
  const affectedProf = profId ? profMap[profId] : null;

  const candidateShifts = useMemo(() => {
    if (!profId) return shifts.filter((s) => !s.professionalId);
    return shifts.filter((s) => s.professionalId === profId);
  }, [profId, shifts]);

  const allSuggestions = useMemo(() => {
    if (!shift) return [];
    return findSubstitutes(shift, professionals, profId || shift.professionalId || undefined);
  }, [shift, professionals, profId]);

  const remaining = useMemo(
    () => allSuggestions.filter((s) => !rejectedIds.includes(s.professional.id)),
    [allSuggestions, rejectedIds]
  );
  const preferred = remaining[0] ?? null;

  const shiftLabel = shift ? `${shift.date} · ${shift.slot} · ${shift.role} · ${shift.center}` : "";

  const accept = () => {
    if (!shift || !preferred) return;
    assignShift(shift.id, preferred.professional.id);
    if (affectedProf) {
      addAbsence({
        id: `a-${Date.now()}`,
        professionalId: affectedProf.id,
        startDate: shift.date,
        endDate: shift.date,
        reason: "Baixa simulada",
        resolvedHours: 1 + Math.floor(Math.random() * 6),
      });
    }
    const decision: SubstitutionDecision = {
      id: `d-${Date.now()}`,
      createdAt: new Date().toISOString(),
      shiftId: shift.id,
      shiftLabel,
      affectedProfessionalId: affectedProf?.id ?? null,
      affectedProfessionalName: affectedProf?.name ?? null,
      proposedProfessionalId: preferred.professional.id,
      proposedProfessionalName: preferred.professional.name,
      reason: preferred.reason,
      action: "acceptada",
    };
    addDecision(decision);
    toast.success("Substitució acceptada", { description: `${preferred.professional.name} cobreix ${shiftLabel}` });
    navigate({ to: "/quadrant" });
  };

  const openReject = () => {
    if (!preferred) return;
    setRejectReason("");
    setRejectNote("");
    setRejectDialog({ open: true, suggestion: preferred });
  };

  const confirmReject = () => {
    if (!shift || !rejectDialog.suggestion || !rejectReason) return;
    const sug = rejectDialog.suggestion;
    const fullReason = rejectNote.trim() ? `${rejectReason} — ${rejectNote.trim()}` : rejectReason;
    addDecision({
      id: `d-${Date.now()}`,
      createdAt: new Date().toISOString(),
      shiftId: shift.id,
      shiftLabel,
      affectedProfessionalId: affectedProf?.id ?? null,
      affectedProfessionalName: affectedProf?.name ?? null,
      proposedProfessionalId: sug.professional.id,
      proposedProfessionalName: sug.professional.name,
      reason: sug.reason,
      action: "rebutjada",
      rejectReason: fullReason,
    });
    setRejectedIds((prev) => [...prev, sug.professional.id]);
    setRejectDialog({ open: false, suggestion: null });
    toast("Recomanació rebutjada", { description: "Buscant un altre substitut alternatiu…" });
  };

  const resetFlow = () => {
    setRejectedIds([]);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Simulador de baixa</h2>
        <p className="text-sm text-muted-foreground">El sistema proposa un substitut preferent. Pots acceptar-lo o rebutjar-lo i rebre una alternativa.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Selecciona la baixa</CardTitle>
          <CardDescription>Tria el professional i el torn afectat</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Professional de baixa</Label>
            <Select value={profId} onValueChange={(v) => { setProfId(v); setShiftId(""); }}>
              <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
              <SelectContent>
                {professionals.filter((p) => p.status === "actiu").map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} — {p.role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Torn afectat</Label>
            <Select value={shiftId} onValueChange={setShiftId}>
              <SelectTrigger><SelectValue placeholder="Selecciona torn…" /></SelectTrigger>
              <SelectContent>
                {candidateShifts.slice(0, 50).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.date} · {s.slot} · {s.role} · {s.center}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {shift && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              2. Buit detectat
            </CardTitle>
            <CardDescription>
              {shiftLabel}
              {affectedProf && <> · titular: <b>{affectedProf.name}</b></>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {preferred ? (
              <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-transparent p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge>Recomanació preferent</Badge>
                      {rejectedIds.length > 0 && (
                        <Badge variant="secondary">Alternativa #{rejectedIds.length + 1}</Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold">{preferred.professional.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium text-foreground">Justificació:</span> {preferred.reason}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button onClick={accept}>
                        <ThumbsUp className="h-4 w-4" /> Accepta la recomanació
                      </Button>
                      <Button variant="outline" onClick={openReject}>
                        <ThumbsDown className="h-4 w-4" /> Rebutja
                      </Button>
                      {rejectedIds.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={resetFlow}>
                          <RotateCcw className="h-3.5 w-3.5" /> Reinicia suggeriments
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                <X className="h-5 w-5 mx-auto mb-2" />
                No queden més candidats compatibles{rejectedIds.length > 0 ? " després dels rebutjos" : ""}.
                {rejectedIds.length > 0 && (
                  <div className="mt-3">
                    <Button variant="outline" size="sm" onClick={resetFlow}>
                      <RotateCcw className="h-3.5 w-3.5" /> Reinicia i torna a començar
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!shift && profId && (
        <Card>
          <CardContent className="p-6 flex items-center gap-3 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" /> Selecciona un torn afectat per continuar.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" /> Historial de decisions
            </CardTitle>
            <CardDescription>Registre cronològic de recomanacions acceptades i rebutjades</CardDescription>
          </div>
          {decisions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearDecisions}>Esborra historial</Button>
          )}
        </CardHeader>
        <CardContent>
          {decisions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Encara no s'ha pres cap decisió.</p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Torn</TableHead>
                    <TableHead>Substitut proposat</TableHead>
                    <TableHead>Decisió</TableHead>
                    <TableHead>Motiu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {decisions.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-xs whitespace-nowrap">{new Date(d.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{d.shiftLabel}</TableCell>
                      <TableCell className="text-sm">{d.proposedProfessionalName}</TableCell>
                      <TableCell>
                        <Badge variant={d.action === "acceptada" ? "default" : "secondary"}>
                          {d.action === "acceptada" ? "Acceptada" : "Rebutjada"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[280px]">
                        {d.action === "acceptada" ? d.reason : d.rejectReason}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectDialog.open} onOpenChange={(o) => setRejectDialog((d) => ({ ...d, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motiu del rebuig</DialogTitle>
            <DialogDescription>
              Indica per què rebutges {rejectDialog.suggestion?.professional.name}. El sistema proposarà un altre candidat.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Motiu</Label>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger><SelectValue placeholder="Selecciona un motiu…" /></SelectTrigger>
                <SelectContent>
                  {REJECT_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Comentari opcional</Label>
              <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Detalls addicionals…" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectDialog({ open: false, suggestion: null })}>Cancel·la</Button>
            <Button onClick={confirmReject} disabled={!rejectReason}>Confirma rebuig</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
