import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { StatCard } from "@/components/StatCard";
import { CalendarCheck, CalendarX, UserMinus, UserCheck, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TornAI — Dashboard de torns" },
      { name: "description", content: "Visió general de torns coberts, baixes i alertes." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { professionals, shifts, absences } = useStore();

  const stats = useMemo(() => {
    const covered = shifts.filter((s) => s.professionalId).length;
    const uncovered = shifts.length - covered;
    const activeAbsences = absences.length;
    const available = professionals.filter((p) => p.status === "actiu").length;
    const overloaded = professionals.filter((p) => p.hoursAccrued > 160).length;
    const coverageRate = shifts.length ? Math.round((covered / shifts.length) * 100) : 0;
    return { covered, uncovered, activeAbsences, available, overloaded, coverageRate };
  }, [shifts, professionals, absences]);

  const overloadedList = professionals
    .filter((p) => p.hoursAccrued > 160)
    .sort((a, b) => b.hoursAccrued - a.hoursAccrued)
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Visió general de la setmana actual</p>
        </div>
        <Badge variant="secondary" className="text-sm">Cobertura {stats.coverageRate}%</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Torns coberts" value={stats.covered} icon={CalendarCheck} tone="success" />
        <StatCard title="Torns descoberts" value={stats.uncovered} icon={CalendarX} tone="destructive" />
        <StatCard title="Baixes actives" value={stats.activeAbsences} icon={UserMinus} tone="warning" />
        <StatCard title="Professionals disponibles" value={stats.available} icon={UserCheck} tone="info" />
        <StatCard title="Alertes sobrecàrrega" value={stats.overloaded} icon={AlertTriangle} tone="warning" />
      </div>

      {stats.overloaded > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Sobrecàrrega detectada</AlertTitle>
          <AlertDescription>
            Hi ha {stats.overloaded} professional(s) amb més de 160h acumulades.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top sobrecàrrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overloadedList.length === 0 && (
              <p className="text-sm text-muted-foreground">Cap professional sobrecarregat 🎉</p>
            )}
            {overloadedList.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground">{p.role} · <b>{p.hoursAccrued}h</b></span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accions ràpides</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild><Link to="/quadrant">Veure quadrant</Link></Button>
            <Button asChild variant="secondary"><Link to="/simulador">Simular baixa</Link></Button>
            <Button asChild variant="outline"><Link to="/ingesta">Ingesta de dades</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
