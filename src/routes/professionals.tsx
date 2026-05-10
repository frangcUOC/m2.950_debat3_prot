import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save } from "lucide-react";
import { useState } from "react";
import { ROLES, SLOTS, type Professional, type Role, type ShiftSlot } from "@/lib/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export const Route = createFileRoute("/professionals")({
  head: () => ({ meta: [{ title: "Professionals — TornAI" }] }),
  component: Professionals,
});

const STATUS_VARIANT: Record<Professional["status"], "default" | "secondary" | "destructive" | "outline"> = {
  actiu: "default",
  baixa: "destructive",
  vacances: "secondary",
};

function Professionals() {
  const { professionals, upsertProfessional, removeProfessional } = useStore();
  const [editing, setEditing] = useState<Professional | null>(null);
  const [open, setOpen] = useState(false);

  const newProf = (): Professional => ({
    id: `p-${Date.now()}`,
    name: "",
    role: "Infermer/a",
    availability: ["Matí"],
    hoursAccrued: 0,
    status: "actiu",
    center: "Centre Sant Pau",
  });

  const startCreate = () => { setEditing(newProf()); setOpen(true); };
  const startEdit = (p: Professional) => { setEditing({ ...p }); setOpen(true); };

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) { toast.error("El nom no pot estar buit"); return; }
    upsertProfessional(editing);
    setOpen(false);
    toast.success("Professional desat");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Professionals</h2>
          <p className="text-sm text-muted-foreground">{professionals.length} registres al sistema</p>
        </div>
        <Button onClick={startCreate}><Plus className="h-4 w-4 mr-1" /> Nou professional</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Disponibilitat</TableHead>
                <TableHead>Hores</TableHead>
                <TableHead>Estat</TableHead>
                <TableHead>Centre</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professionals.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => startEdit(p)}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.role}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {p.availability.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>{p.hoursAccrued}h</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.center}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); removeProfessional(p.id); toast.message("Eliminat"); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {professionals.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">Cap professional</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.name ? "Editar professional" : "Nou professional"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Nom</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Rol</Label>
                  <Select value={editing.role} onValueChange={(v) => setEditing({ ...editing, role: v as Role })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estat</Label>
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v as Professional["status"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actiu">actiu</SelectItem>
                      <SelectItem value="baixa">baixa</SelectItem>
                      <SelectItem value="vacances">vacances</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Centre</Label><Input value={editing.center} onChange={(e) => setEditing({ ...editing, center: e.target.value })} /></div>
              <div><Label>Hores acumulades</Label><Input type="number" value={editing.hoursAccrued} onChange={(e) => setEditing({ ...editing, hoursAccrued: Number(e.target.value) || 0 })} /></div>
              <div>
                <Label>Disponibilitat</Label>
                <div className="flex gap-4 mt-2">
                  {SLOTS.map((s) => (
                    <label key={s} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={editing.availability.includes(s)}
                        onCheckedChange={(c) => {
                          const set = new Set(editing.availability);
                          if (c) set.add(s); else set.delete(s);
                          setEditing({ ...editing, availability: Array.from(set) as ShiftSlot[] });
                        }}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel·la</Button>
            <Button onClick={save}><Save className="h-4 w-4 mr-1" /> Desa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
