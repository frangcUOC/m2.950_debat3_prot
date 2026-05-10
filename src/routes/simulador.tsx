import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState, useEffect } from "react";
import { findSubstitutes } from "@/lib/substitutes";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({ shiftId: z.string().optional() });

export const Route = createFileRoute("/simulador")({
  head: () => ({ meta: [{ title: "Simulador de baixa — TornAI" }] }),
  validateSearch: searchSchema,
  component: Simulador,
});

function Simulador() {
  const { professionals, shifts, assignShift, addAbsence } = useStore();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [profId, setProfId] = useState<string>("");
  const [shiftId, setShiftId] = useState<string>(search.shiftId ?? "");

  useEffect(() => {
    if (search.shiftId) setShiftId(search.shiftId);
  }, [search.shiftId]);

  const profMap = useMemo(() => Object.fromEntries(professionals.map((p) => [p.id, p])), [professionals]);
  const shift = shifts.find((s) => s.id === shiftId) ?? null;
  const affectedProf = profId ? profMap[profId] : null;

  // Si seleccionem professional sense torn → suggerim el primer torn assignat
  const candidateShifts = useMemo(() => {
    if (!profId) return shifts.filter((s) => !s.professionalId);
    return shifts.filter((s) => s.professionalId === profId);
  }, [profId, shifts]);

  const suggestions = useMemo(() => {
    if (!shift) return [];
    return findSubstitutes(shift, professionals, profId || shift.professionalId || undefined).slice(0, 5);
  }, [shift, professionals, profId]);

  const apply = (substituteId: string) => {
    if (!shift) return;
    assignShift(shift.id, substituteId);
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
    toast.success("Substitució registrada", {
      description: `${profMap[substituteId]?.name} cobreix el torn ${shift.date} ${shift.slot}`,
    });
    navigate({ to: "/quadrant" });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Simulador de baixa</h2>
        <p className="text-sm text-muted-foreground">Detecta el buit i recomana substituts ordenats per rol, disponibilitat i càrrega.</p>
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
              {shift.date} · {shift.slot} · {shift.role} · {shift.center}
              {affectedProf && <> · titular: <b>{affectedProf.name}</b></>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <h4 className="font-medium mb-3">Substituts recomanats</h4>
            {suggestions.length === 0 && (
              <p className="text-sm text-muted-foreground">No s’han trobat candidats compatibles. Considera ampliar la disponibilitat o el centre.</p>
            )}
            <div className="space-y-2">
              {suggestions.map((s, idx) => (
                <div key={s.professional.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors">
                  <Badge variant={idx === 0 ? "default" : "secondary"} className="shrink-0">#{idx + 1}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{s.professional.name}</div>
                    <div className="text-xs text-muted-foreground">{s.reason}</div>
                  </div>
                  <Button size="sm" onClick={() => apply(s.professional.id)}>
                    Assignar <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
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
    </div>
  );
}
