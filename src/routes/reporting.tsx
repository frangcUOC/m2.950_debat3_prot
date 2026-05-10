import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMemo } from "react";
import { ROLES, SLOT_HOURS } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from "recharts";
import { StatCard } from "@/components/StatCard";
import { Clock, TrendingUp, Activity, Percent } from "lucide-react";

export const Route = createFileRoute("/reporting")({
  head: () => ({ meta: [{ title: "Reporting — TornAI" }] }),
  component: Reporting,
});

const COLORS = ["oklch(0.55 0.18 220)", "oklch(0.65 0.16 155)", "oklch(0.78 0.16 75)", "oklch(0.62 0.2 25)"];

function Reporting() {
  const { shifts, professionals, absences } = useStore();

  const data = useMemo(() => {
    const covered = shifts.filter((s) => s.professionalId).length;
    const uncovered = shifts.length - covered;
    const total = shifts.length || 1;
    const coverageRate = (covered / total) * 100;

    // hores extres = hores acumulades > 150
    const extraHours = professionals.reduce((acc, p) => acc + Math.max(0, p.hoursAccrued - 150), 0);

    // distribució per perfil
    const byRole = ROLES.map((role) => ({
      role,
      hores: shifts
        .filter((s) => s.role === role && s.professionalId)
        .reduce((acc, s) => acc + SLOT_HOURS[s.slot], 0),
    }));

    // temps mitjà de cobertura
    const avgCover = absences.length
      ? absences.reduce((a, x) => a + (x.resolvedHours ?? 0), 0) / absences.length
      : 0;

    // probabilitat baixes simulada per franja
    const probSlot = [
      { franja: "Matí", probabilitat: 12 + Math.round(Math.random() * 5) },
      { franja: "Tarda", probabilitat: 18 + Math.round(Math.random() * 5) },
      { franja: "Nit", probabilitat: 24 + Math.round(Math.random() * 6) },
    ];

    // probabilitat per època (simulat)
    const probEpoca = [
      { mes: "Gen", risc: 15 }, { mes: "Feb", risc: 22 }, { mes: "Mar", risc: 14 },
      { mes: "Abr", risc: 11 }, { mes: "Mai", risc: 9 }, { mes: "Jun", risc: 12 },
      { mes: "Jul", risc: 25 }, { mes: "Ago", risc: 28 }, { mes: "Set", risc: 13 },
      { mes: "Oct", risc: 12 }, { mes: "Nov", risc: 18 }, { mes: "Des", risc: 23 },
    ];

    return {
      covered, uncovered, coverageRate, extraHours, byRole, avgCover, probSlot, probEpoca,
      coverPie: [
        { name: "Coberts", value: covered },
        { name: "Descoberts", value: uncovered },
      ],
    };
  }, [shifts, professionals, absences]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Reporting</h2>
        <p className="text-sm text-muted-foreground">Mètriques de cobertura, càrrega i risc</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Cobertura" value={`${data.coverageRate.toFixed(1)}%`} icon={Percent} tone="success" />
        <StatCard title="Hores extres" value={`${data.extraHours}h`} icon={Clock} tone="warning" />
        <StatCard title="Temps mitjà de cobertura" value={`${data.avgCover.toFixed(1)}h`} icon={Activity} tone="info" />
        <StatCard title="Baixes registrades" value={absences.length} icon={TrendingUp} tone="default" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">% Torns coberts vs descoberts</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.coverPie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {data.coverPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribució de càrrega per perfil</CardTitle>
            <CardDescription>Hores totals assignades</CardDescription>
          </CardHeader>
          <CardContent style={{ height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={data.byRole}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="role" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="hores" fill={COLORS[0]} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Probabilitat de baixa per franja (%)</CardTitle>
            <CardDescription>Estimació basada en històric simulat</CardDescription>
          </CardHeader>
          <CardContent style={{ height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={data.probSlot}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="franja" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="probabilitat" fill={COLORS[2]} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risc de baixa per època (%)</CardTitle>
            <CardDescription>Tendència anual simulada</CardDescription>
          </CardHeader>
          <CardContent style={{ height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={data.probEpoca}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="risc" stroke={COLORS[3]} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
