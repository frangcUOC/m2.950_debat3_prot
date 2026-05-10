import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useMemo, useState } from "react";
import { SLOTS, type Shift } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quadrant")({
  head: () => ({ meta: [{ title: "Quadrant setmanal — TornAI" }] }),
  component: Quadrant,
});

const DAY_NAMES = ["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte", "Diumenge"];

function Quadrant() {
  const { shifts, professionals } = useStore();
  const [selected, setSelected] = useState<Shift | null>(null);

  const dates = useMemo(() => Array.from(new Set(shifts.map((s) => s.date))).sort(), [shifts]);

  const profMap = useMemo(() => Object.fromEntries(professionals.map((p) => [p.id, p])), [professionals]);

  const grid = useMemo(() => {
    const map: Record<string, Record<string, Shift[]>> = {};
    for (const d of dates) { map[d] = { "Matí": [], "Tarda": [], "Nit": [] }; }
    for (const s of shifts) {
      if (!map[s.date]) continue;
      map[s.date][s.slot].push(s);
    }
    return map;
  }, [shifts, dates]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Quadrant setmanal</h2>
        <p className="text-sm text-muted-foreground">Selecciona un torn per veure’n els detalls</p>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium w-24">Franja</th>
                {dates.map((d, i) => {
                  const dt = new Date(d);
                  return (
                    <th key={d} className="text-left p-3 font-medium min-w-[150px]">
                      <div>{DAY_NAMES[(dt.getDay() + 6) % 7]}</div>
                      <div className="text-xs text-muted-foreground font-normal">{d}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => (
                <tr key={slot} className="border-b align-top">
                  <td className="p-3 font-medium bg-muted/30">{slot}</td>
                  {dates.map((d) => {
                    const cell = grid[d]?.[slot] ?? [];
                    return (
                      <td key={d + slot} className="p-2 align-top">
                        <div className="flex flex-col gap-1">
                          {cell.map((s) => {
                            const prof = s.professionalId ? profMap[s.professionalId] : null;
                            const covered = !!prof;
                            return (
                              <button
                                key={s.id}
                                onClick={() => setSelected(s)}
                                className={cn(
                                  "text-left rounded-md px-2 py-1.5 text-xs border transition-colors hover:ring-2 hover:ring-primary/40",
                                  covered
                                    ? "bg-[var(--success)]/10 border-[var(--success)]/30"
                                    : "bg-destructive/10 border-destructive/30"
                                )}
                              >
                                <div className="font-medium truncate">
                                  {prof ? prof.name : "— Descobert —"}
                                </div>
                                <div className="text-muted-foreground truncate">{s.role} · {s.center}</div>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex gap-3 text-xs">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-[var(--success)]/30 border border-[var(--success)]/50" /> Cobert</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-destructive/20 border border-destructive/40" /> Descobert</span>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Detalls del torn</SheetTitle>
            <SheetDescription>{selected?.date} · {selected?.slot}</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="space-y-4 mt-4 px-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Centre</span><span>{selected.center}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Rol requerit</span><span>{selected.role}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Estat</span>
                  {selected.professionalId
                    ? <Badge>Cobert</Badge>
                    : <Badge variant="destructive">Descobert</Badge>}
                </div>
                {selected.professionalId && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Assignat a</span>
                    <span className="font-medium">{profMap[selected.professionalId]?.name}</span></div>
                )}
                {selected.originalProfessionalId && selected.originalProfessionalId !== selected.professionalId && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Substitueix a</span>
                    <span className="text-muted-foreground italic">{profMap[selected.originalProfessionalId]?.name ?? "—"}</span></div>
                )}
              </div>
              <Button asChild className="w-full">
                <Link to="/simulador" search={{ shiftId: selected.id }}>Cercar substitut</Link>
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
