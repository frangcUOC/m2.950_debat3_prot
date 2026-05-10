import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  INCIDENT_PRIORITIES, INCIDENT_STATUSES, INCIDENT_TYPES,
  type Incident, type IncidentPriority, type IncidentStatus, type IncidentType,
} from "@/lib/types";
import { Plus, Trash2, MessageSquarePlus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/incidencies")({
  head: () => ({ meta: [{ title: "Incidències — TornAI" }] }),
  component: IncidentsPage,
});

const priorityTone: Record<IncidentPriority, string> = {
  "Baixa": "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30",
  "Mitjana": "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  "Alta": "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  "Crítica": "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
};
const statusTone: Record<IncidentStatus, string> = {
  "Oberta": "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  "En curs": "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  "Resolta": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
};

function IncidentsPage() {
  const { incidents, professionals, shifts, upsertIncident, removeIncident, addIncidentComment } = useStore();
  const [open, setOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProf, setFilterProf] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");

  const [draft, setDraft] = useState<Incident>(() => emptyIncident());

  const filtered = useMemo(() => {
    return incidents.filter((i) => {
      if (filterStatus !== "all" && i.status !== filterStatus) return false;
      if (filterProf !== "all" && i.professionalId !== filterProf) return false;
      if (filterDate && !i.createdAt.startsWith(filterDate)) return false;
      return true;
    });
  }, [incidents, filterStatus, filterProf, filterDate]);

  const handleCreate = () => {
    if (!draft.description.trim()) {
      toast.error("La descripció és obligatòria");
      return;
    }
    upsertIncident({ ...draft, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    toast.success("Incidència creada");
    setDraft(emptyIncident());
    setOpen(false);
  };

  const setStatus = (i: Incident, status: IncidentStatus) => {
    upsertIncident({ ...i, status });
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Incidències</h2>
          <p className="text-sm text-muted-foreground">Registre i seguiment de problemes operatius</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Nova incidència</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Crear incidència</DialogTitle>
              <DialogDescription>Registra un problema operatiu per al seu seguiment</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tipus">
                <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v as IncidentType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INCIDENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Prioritat">
                <Select value={draft.priority} onValueChange={(v) => setDraft({ ...draft, priority: v as IncidentPriority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INCIDENT_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Professional afectat">
                <Select value={draft.professionalId ?? "none"} onValueChange={(v) => setDraft({ ...draft, professionalId: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Cap —</SelectItem>
                    {professionals.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Torn relacionat">
                <Select value={draft.shiftId ?? "none"} onValueChange={(v) => setDraft({ ...draft, shiftId: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Cap —</SelectItem>
                    {shifts.slice(0, 50).map((s) => <SelectItem key={s.id} value={s.id}>{s.date} · {s.slot} · {s.role}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Responsable">
                <Select value={draft.assigneeId ?? "none"} onValueChange={(v) => setDraft({ ...draft, assigneeId: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Sense assignar —</SelectItem>
                    {professionals.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Estat">
                <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as IncidentStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INCIDENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Descripció">
                  <Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={4} />
                </Field>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel·la</Button>
              <Button onClick={handleCreate}>Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3">
          <Field label="Estat">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tots</SelectItem>
                {INCIDENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Professional">
            <Select value={filterProf} onValueChange={setFilterProf}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tots</SelectItem>
                {professionals.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Data (YYYY-MM-DD)">
            <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Cap incidència registrada. Crea'n una amb el botó superior.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipus</TableHead>
                  <TableHead>Descripció</TableHead>
                  <TableHead>Professional</TableHead>
                  <TableHead>Prioritat</TableHead>
                  <TableHead>Estat</TableHead>
                  <TableHead className="text-right">Accions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((i) => {
                  const prof = professionals.find((p) => p.id === i.professionalId);
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="text-xs text-muted-foreground">{new Date(i.createdAt).toLocaleDateString("ca-ES")}</TableCell>
                      <TableCell>{i.type}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate">{i.description}</div>
                        {i.comments.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-0.5">{i.comments.length} comentari{i.comments.length > 1 ? "s" : ""}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{prof?.name ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline" className={priorityTone[i.priority]}>{i.priority}</Badge></TableCell>
                      <TableCell>
                        <Select value={i.status} onValueChange={(v) => setStatus(i, v as IncidentStatus)}>
                          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {INCIDENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <CommentButton incident={i} onAdd={(text) => addIncidentComment(i.id, { id: crypto.randomUUID(), author: "admin", text, createdAt: new Date().toISOString() })} />
                          {i.status !== "Resolta" && (
                            <Button size="icon" variant="ghost" onClick={() => { setStatus(i, "Resolta"); toast.success("Marcada com resolta"); }} title="Marcar com resolta">
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => removeIncident(i.id)} title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CommentButton({ incident, onAdd }: { incident: Incident; onAdd: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" title="Afegir comentari"><MessageSquarePlus className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Comentaris · {incident.type}</DialogTitle>
          <DialogDescription className="line-clamp-2">{incident.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-60 overflow-auto">
          {incident.comments.length === 0 && <p className="text-sm text-muted-foreground">Encara no hi ha comentaris.</p>}
          {incident.comments.map((c) => (
            <div key={c.id} className="rounded-md border bg-muted/40 p-2 text-sm">
              <div className="text-xs text-muted-foreground">{c.author} · {new Date(c.createdAt).toLocaleString("ca-ES")}</div>
              <div>{c.text}</div>
            </div>
          ))}
        </div>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Escriu un comentari..." rows={3} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Tancar</Button>
          <Button onClick={() => { if (text.trim()) { onAdd(text.trim()); setText(""); toast.success("Comentari afegit"); } }}>Afegir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function emptyIncident(): Incident {
  return {
    id: "",
    type: "Torn",
    description: "",
    professionalId: null,
    shiftId: null,
    priority: "Mitjana",
    status: "Oberta",
    assigneeId: null,
    createdAt: "",
    comments: [],
  };
}
