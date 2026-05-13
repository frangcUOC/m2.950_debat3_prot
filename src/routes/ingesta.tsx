import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRef, useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import type { Professional, Shift, Absence, Role, ShiftSlot } from "@/lib/types";
import { ROLES, SLOTS } from "@/lib/types";
import { Download, Upload, RefreshCw, Trash2, ShieldCheck, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

type ValidationIssue = {
  severity: "error" | "warning";
  professionalId: string;
  professionalName: string;
  field: string;
  message: string;
};

const MAX_REASONABLE_HOURS = 250; // hores acumulades per període raonable
const MIN_REASONABLE_HOURS = 0;

function validateProfessionals(profs: Professional[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenIds = new Map<string, number>();

  for (const p of profs) {
    const tag = { professionalId: p.id, professionalName: p.name || "(sense nom)" };

    // ID
    if (!p.id || !p.id.trim()) {
      issues.push({ ...tag, severity: "error", field: "id", message: "Identificador buit" });
    } else {
      seenIds.set(p.id, (seenIds.get(p.id) ?? 0) + 1);
    }

    // Nom
    if (!p.name || !p.name.trim()) {
      issues.push({ ...tag, severity: "error", field: "name", message: "Nom buit" });
    }

    // Rol
    if (!ROLES.includes(p.role)) {
      issues.push({
        ...tag,
        severity: "error",
        field: "role",
        message: `Rol no vàlid "${p.role}". Valors permesos: ${ROLES.join(", ")}`,
      });
    }

    // Hores acumulades
    if (typeof p.hoursAccrued !== "number" || Number.isNaN(p.hoursAccrued)) {
      issues.push({ ...tag, severity: "error", field: "hoursAccrued", message: "Hores acumulades no és un número" });
    } else if (p.hoursAccrued < MIN_REASONABLE_HOURS) {
      issues.push({ ...tag, severity: "error", field: "hoursAccrued", message: `Hores acumulades negatives (${p.hoursAccrued})` });
    } else if (p.hoursAccrued > MAX_REASONABLE_HOURS) {
      issues.push({
        ...tag,
        severity: "warning",
        field: "hoursAccrued",
        message: `Hores acumulades molt elevades (${p.hoursAccrued} > ${MAX_REASONABLE_HOURS})`,
      });
    }

    // Disponibilitat
    if (!Array.isArray(p.availability) || p.availability.length === 0) {
      issues.push({ ...tag, severity: "warning", field: "availability", message: "Sense franges de disponibilitat" });
    } else {
      const invalid = p.availability.filter((s) => !SLOTS.includes(s));
      if (invalid.length) {
        issues.push({
          ...tag,
          severity: "error",
          field: "availability",
          message: `Franja(es) no vàlida(es): ${invalid.join(", ")}`,
        });
      }
      const dups = p.availability.filter((s, i, arr) => arr.indexOf(s) !== i);
      if (dups.length) {
        issues.push({ ...tag, severity: "warning", field: "availability", message: `Franges duplicades: ${[...new Set(dups)].join(", ")}` });
      }
    }

    // Estat
    if (!["actiu", "baixa", "vacances"].includes(p.status)) {
      issues.push({ ...tag, severity: "error", field: "status", message: `Estat no vàlid "${p.status}"` });
    }

    // Centre
    if (!p.center || !p.center.trim()) {
      issues.push({ ...tag, severity: "warning", field: "center", message: "Centre no especificat" });
    }
  }

  // IDs duplicats
  for (const [id, count] of seenIds) {
    if (count > 1) {
      const p = profs.find((x) => x.id === id);
      issues.push({
        professionalId: id,
        professionalName: p?.name ?? "(?)",
        severity: "error",
        field: "id",
        message: `Identificador duplicat (${count} vegades)`,
      });
    }
  }

  return issues;
}

export const Route = createFileRoute("/ingesta")({
  head: () => ({ meta: [{ title: "Ingesta de dades — TornAI" }] }),
  component: Ingesta,
});

const SHIFT_TEMPLATE = `date,slot,role,center,professionalId
2026-05-11,Matí,Infermer/a,Centre Sant Pau,p-1
2026-05-11,Tarda,Auxiliar,Centre Sant Joan,
`;

const PROF_TEMPLATE = `id,name,role,availability,hoursAccrued,status,center
p-1,Marta Puig,Infermer/a,"Matí;Tarda",120,actiu,Centre Sant Pau
p-2,Joan Ribera,Metge/ssa,"Matí;Nit",140,actiu,Centre Sant Joan
`;

function Ingesta() {
  const store = useStore();
  const [profsCsv, setProfsCsv] = useState("");
  const [shiftsCsv, setShiftsCsv] = useState("");
  const profFile = useRef<HTMLInputElement>(null);
  const shiftFile = useRef<HTMLInputElement>(null);

  const handleFile = (file: File, target: (s: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => target(String(e.target?.result ?? ""));
    reader.readAsText(file);
  };

  const importAll = () => {
    try {
      let professionals: Professional[] = store.professionals;
      let shifts: Shift[] = store.shifts;
      const absences: Absence[] = store.absences;

      if (profsCsv.trim()) {
        const parsed = Papa.parse<Record<string, string>>(profsCsv.trim(), { header: true, skipEmptyLines: true });
        professionals = parsed.data.map((r, i) => ({
          id: r.id || `p-imp-${i}`,
          name: r.name ?? "Sense nom",
          role: (ROLES.includes(r.role as Role) ? r.role : "Auxiliar") as Role,
          availability: (r.availability ?? "").split(/[;|,]/).map((s) => s.trim()).filter((s) => SLOTS.includes(s as ShiftSlot)) as ShiftSlot[],
          hoursAccrued: Number(r.hoursAccrued) || 0,
          status: (["actiu", "baixa", "vacances"].includes(r.status) ? r.status : "actiu") as Professional["status"],
          center: r.center ?? "Centre principal",
        }));
      }

      if (shiftsCsv.trim()) {
        const parsed = Papa.parse<Record<string, string>>(shiftsCsv.trim(), { header: true, skipEmptyLines: true });
        shifts = parsed.data.map((r, i) => ({
          id: `s-imp-${i}`,
          date: r.date,
          slot: (SLOTS.includes(r.slot as ShiftSlot) ? r.slot : "Matí") as ShiftSlot,
          role: (ROLES.includes(r.role as Role) ? r.role : "Auxiliar") as Role,
          center: r.center ?? "Centre principal",
          professionalId: r.professionalId?.trim() ? r.professionalId.trim() : null,
        }));
      }

      store.setData({ professionals, shifts, absences });
      toast.success("Dades importades correctament", {
        description: `${professionals.length} professionals · ${shifts.length} torns`,
      });
    } catch (err) {
      toast.error("Error en importar", { description: String(err) });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Ingesta de dades històriques</h2>
        <p className="text-sm text-muted-foreground">Puja CSVs o introdueix dades manualment per inicialitzar el sistema.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => { store.loadSeed(); toast.success("Dades simulades carregades"); }}>
          <RefreshCw className="h-4 w-4 mr-1" /> Carregar dades simulades
        </Button>
        <Button variant="outline" onClick={() => { store.reset(); toast.message("Dades buidades"); }}>
          <Trash2 className="h-4 w-4 mr-1" /> Buidar tot
        </Button>
      </div>

      <Tabs defaultValue="csv">
        <TabsList>
          <TabsTrigger value="csv">CSV</TabsTrigger>
          <TabsTrigger value="manual">Edició manual</TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Professionals (CSV)</CardTitle>
                <CardDescription>Columnes: id, name, role, availability (separat per ;), hoursAccrued, status, center</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input ref={profFile} type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], setProfsCsv)} />
                <Textarea rows={8} placeholder={PROF_TEMPLATE} value={profsCsv} onChange={(e) => setProfsCsv(e.target.value)} className="font-mono text-xs" />
                <Button variant="ghost" size="sm" onClick={() => setProfsCsv(PROF_TEMPLATE)}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Carregar plantilla
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Torns (CSV)</CardTitle>
                <CardDescription>Columnes: date (YYYY-MM-DD), slot, role, center, professionalId (buit = descobert)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input ref={shiftFile} type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], setShiftsCsv)} />
                <Textarea rows={8} placeholder={SHIFT_TEMPLATE} value={shiftsCsv} onChange={(e) => setShiftsCsv(e.target.value)} className="font-mono text-xs" />
                <Button variant="ghost" size="sm" onClick={() => setShiftsCsv(SHIFT_TEMPLATE)}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Carregar plantilla
                </Button>
              </CardContent>
            </Card>
          </div>
          <Button onClick={importAll} size="lg">
            <Upload className="h-4 w-4 mr-1" /> Importar dades
          </Button>
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estat actual del datastore</CardTitle>
              <CardDescription>Per a edició detallada utilitza les pantalles "Professionals" i "Quadrant".</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recurs</TableHead>
                    <TableHead className="text-right">Quantitat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell>Professionals</TableCell><TableCell className="text-right">{store.professionals.length}</TableCell></TableRow>
                  <TableRow><TableCell>Torns</TableCell><TableCell className="text-right">{store.shifts.length}</TableCell></TableRow>
                  <TableRow><TableCell>Baixes</TableCell><TableCell className="text-right">{store.absences.length}</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
