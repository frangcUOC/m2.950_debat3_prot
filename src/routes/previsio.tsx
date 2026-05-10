import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Lock, Crown, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/previsio")({
  head: () => ({ meta: [{ title: "Previsió de baixes — TornAI Premium" }] }),
  component: PrevisioPage,
});

function PrevisioPage() {
  const isPremium = useStore((s) => s.isPremium);
  const setPremium = useStore((s) => s.setPremium);
  const professionals = useStore((s) => s.professionals);
  const absences = useStore((s) => s.absences);

  const data = useMemo(() => {
    // probabilitat per professional segons hores acumulades + històric
    const perProf = professionals.map((p) => {
      const hist = absences.filter((a) => a.professionalId === p.id).length;
      const overload = Math.max(0, p.hoursAccrued - 140) / 60; // 0..1
      const histFactor = Math.min(1, hist / 3);
      const prob = Math.min(95, Math.round(overload * 50 + histFactor * 35 + 8));
      return { name: p.name.split(" ")[0], prob };
    }).sort((a, b) => b.prob - a.prob).slice(0, 8);

    const perDay = ["Dl", "Dt", "Dc", "Dj", "Dv", "Ds", "Dg"].map((d, i) => ({
      dia: d,
      probabilitat: [12, 9, 11, 14, 18, 24, 27][i] + Math.round(Math.random() * 4),
    }));

    const perSlot = [
      { franja: "Matí", probabilitat: 11 },
      { franja: "Tarda", probabilitat: 17 },
      { franja: "Nit", probabilitat: 26 },
    ];

    return { perProf, perDay, perSlot };
  }, [professionals, absences]);

  return (
    <div className="space-y-6 max-w-7xl relative">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            Previsió de baixes
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
              <Crown className="h-3 w-3 mr-1" /> Premium
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground">
            Estimació de probabilitat de baixa basada en càrrega acumulada i històric
          </p>
        </div>
        {isPremium && (
          <Button variant="outline" size="sm" onClick={() => { setPremium(false); toast.message("Pla Premium desactivat (demo)"); }}>
            Desactivar Premium (demo)
          </Button>
        )}
      </div>

      <div className={isPremium ? "" : "relative"}>
        <div className={isPremium ? "" : "pointer-events-none blur-sm select-none opacity-60"}>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Top professionals amb major risc</CardTitle>
                <CardDescription>Probabilitat estimada de baixa propera (%)</CardDescription>
              </CardHeader>
              <CardContent style={{ height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={data.perProf} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="prob" fill="oklch(0.62 0.2 25)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Risc per dia de la setmana</CardTitle>
                <CardDescription>Distribució setmanal estimada</CardDescription>
              </CardHeader>
              <CardContent style={{ height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={data.perDay}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="probabilitat" stroke="oklch(0.55 0.18 220)" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Probabilitat per franja horària</CardTitle>
              </CardHeader>
              <CardContent style={{ height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={data.perSlot}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="franja" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="probabilitat" fill="oklch(0.78 0.16 75)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {!isPremium && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-amber-500/40 shadow-xl">
              <CardHeader className="text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-2">
                  <Lock className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Funcionalitat Premium</CardTitle>
                <CardDescription>
                  La previsió de baixes amb IA està disponible només per a subscriptors del pla <strong>TornAI Premium</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm space-y-2">
                  <li className="flex gap-2"><Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /> Predicció per professional, franja i dia</li>
                  <li className="flex gap-2"><Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /> Alertes anticipades de risc operatiu</li>
                  <li className="flex gap-2"><Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /> Simulacions de cobertura i recomanacions</li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0" onClick={() => toast.success("Hem rebut la teva sol·licitud", { description: "L'àrea comercial es posarà en contacte amb tu en breu." })}>
                  <Crown className="h-4 w-4" /> Contacta amb l'àrea comercial
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
