import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ShieldAlert, FileText, Clock, Users2, Scale } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dades")({
  head: () => ({ meta: [{ title: "Dades i consentiments — TornAI" }] }),
  component: DadesPage,
});

function DadesPage() {
  const consent = useStore((s) => s.consent);
  const acceptConsent = useStore((s) => s.acceptConsent);
  const revokeConsent = useStore((s) => s.revokeConsent);
  const [user, setUser] = useState("admin@tornai.cat");

  const handleAccept = () => {
    if (!user.trim()) {
      toast.error("Indica un usuari per registrar el consentiment");
      return;
    }
    acceptConsent(user.trim());
    toast.success("Consentiment registrat correctament");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Dades i consentiments</h2>
          <p className="text-sm text-muted-foreground">
            Informació sobre el tractament de dades personals i registre del consentiment
          </p>
        </div>
        {consent.accepted ? (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Consentiment atorgat
          </Badge>
        ) : (
          <Badge variant="destructive">
            <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Consentiment pendent
          </Badge>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <InfoCard icon={FileText} title="Finalitat del tractament">
          Gestió de torns, baixes, disponibilitats i substitucions del personal sanitari i sociosanitari del centre.
        </InfoCard>
        <InfoCard icon={Scale} title="Base legal">
          Execució del contracte laboral (art. 6.1.b RGPD) i compliment d'obligacions legals en matèria de prevenció de riscos i organització laboral.
        </InfoCard>
        <InfoCard icon={Users2} title="Drets de les persones treballadores">
          Accés, rectificació, supressió, limitació, portabilitat i oposició. Pots exercir-los enviant un correu al delegat de protecció de dades del centre.
        </InfoCard>
        <InfoCard icon={Clock} title="Període de conservació">
          Les dades es conserven mentre duri la relació laboral i fins a 5 anys després, segons obligacions fiscals i laborals aplicables.
        </InfoCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rols amb accés a la informació</CardTitle>
          <CardDescription>Perfils autoritzats segons principi de mínim privilegi</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>• <span className="text-foreground font-medium">Administrador/a</span> — accés complet, gestió d'usuaris i configuració</li>
            <li>• <span className="text-foreground font-medium">Coordinador/a de torns</span> — quadrants, baixes i substitucions</li>
            <li>• <span className="text-foreground font-medium">Recursos Humans</span> — dades de plantilla i hores acumulades</li>
            <li>• <span className="text-foreground font-medium">Professional</span> — només la pròpia disponibilitat i torns</li>
          </ul>
        </CardContent>
      </Card>

      <Card className={consent.accepted ? "" : "border-destructive/40"}>
        <CardHeader>
          <CardTitle className="text-base">Registre de consentiment</CardTitle>
          <CardDescription>
            L'acceptació queda registrada amb data, hora i usuari per garantir traçabilitat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {consent.accepted ? (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-1">
              <div><span className="text-muted-foreground">Usuari:</span> <span className="font-medium">{consent.user}</span></div>
              <div><span className="text-muted-foreground">Data i hora:</span> <span className="font-medium">{new Date(consent.acceptedAt!).toLocaleString("ca-ES")}</span></div>
              <div><span className="text-muted-foreground">Estat:</span> <span className="font-medium text-emerald-600 dark:text-emerald-400">Vigent</span></div>
            </div>
          ) : (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              ⚠ El sistema no s'hauria d'utilitzar fins que s'hagi atorgat el consentiment al tractament de dades.
            </div>
          )}

          <div className="grid sm:grid-cols-[1fr_auto] gap-2 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="consent-user">Usuari que atorga el consentiment</Label>
              <Input id="consent-user" value={user} onChange={(e) => setUser(e.target.value)} disabled={consent.accepted} />
            </div>
            {consent.accepted ? (
              <Button variant="outline" onClick={() => { revokeConsent(); toast.message("Consentiment revocat"); }}>
                Revocar consentiment
              </Button>
            ) : (
              <Button onClick={handleAccept}>
                <ShieldCheck className="h-4 w-4" /> Accepto el tractament
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{children}</CardContent>
    </Card>
  );
}
