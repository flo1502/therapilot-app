import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, FileText, Plus, ShieldCheck, ArrowRight } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function Dashboard() {
  const patients = useLiveQuery(() => db.patients.toArray(), []);
  const sessions = useLiveQuery(() => db.sessions.orderBy("date").reverse().limit(5).toArray(), []);

  const activePatients = patients?.filter(p => p.active).length ?? 0;
  const totalSessions = useLiveQuery(() => db.sessions.count(), []);

  return (
    <div className="max-w-5xl mx-auto pb-16">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl leading-tight">Willkommen zurück</h1>
        <p className="text-base text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          Ihre therapeutische Praxis – ruhig, strukturiert, datenschutzkonform.
        </p>
      </div>

      <Link to="/sessions/neu" className="block group mb-8">
        <Card className="border-primary/40 bg-primary-soft/50 transition-all group-hover:border-primary group-hover:shadow-[var(--shadow-elevated)]">
          <CardContent className="p-7 md:p-9 flex items-center gap-6">
            <div className="size-16 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Plus className="size-8" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl md:text-3xl font-display leading-tight">Neue Sitzung dokumentieren</div>
              <div className="text-base text-muted-foreground mt-2 leading-relaxed">
                In drei ruhigen Schritten: Person bestätigen, Sitzung festhalten, Bericht erstellen.
              </div>
            </div>
            <ArrowRight className="size-6 text-primary ml-auto hidden md:block transition-transform group-hover:translate-x-1" />
          </CardContent>
        </Card>
      </Link>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <Stat icon={Users} label="Aktive Patient:innen" value={activePatients} to="/patienten" />
        <Stat icon={FileText} label="Sitzungen gesamt" value={totalSessions ?? 0} to="/sessions" />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-xl mb-4">Letzte Sitzungen</h2>
          <Card><CardContent className="p-0 divide-y">
            {(!sessions || sessions.length === 0) && (
              <div className="p-6 text-base text-muted-foreground leading-relaxed">
                Noch nichts dokumentiert – das ist völlig in Ordnung.
              </div>
            )}
            {sessions?.map(s => (
              <Link key={s.id} to={`/sessions/${s.id}`} className="block p-5 hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="font-medium">{s.patientId}</div>
                    <div className="text-sm text-muted-foreground mt-1">{formatDateTime(s.date)}</div>
                  </div>
                  <span className="text-sm text-muted-foreground shrink-0">{s.durationMin} Min.</span>
                </div>
              </Link>
            ))}
          </CardContent></Card>
        </section>

        <section>
          <h2 className="text-xl mb-4">Schnellzugriff</h2>
          <div className="grid gap-3">
            <QuickLink to="/patienten/neu" title="Patient:in anlegen" desc="Pseudonym und Stammdaten erfassen" />
          </div>
        </section>
      </div>

      <div className="mt-10 flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-5 py-4 text-sm text-muted-foreground leading-relaxed">
        <ShieldCheck className="size-4 mt-0.5 shrink-0 text-primary" />
        <p>
          <span className="text-foreground font-medium">Prototyp-Modus:</span> KI-Anfragen laufen aktuell
          pseudonymisiert direkt über die Anthropic API. Für den DSGVO-konformen Echteinsatz wechseln Sie in
          Phase 2 auf ein lokales Sprachmodell (Ollama) – dieselbe Oberfläche, keine Cloud-Anfragen.
        </p>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, to }: any) {
  return (
    <Link to={to}>
      <Card className="h-full hover:border-primary/40 transition-colors">
        <CardContent className="p-6">
          <Icon className="size-5 text-primary mb-3" />
          <div className="text-3xl font-display font-semibold">{value}</div>
          <div className="text-sm text-muted-foreground mt-1.5">{label}</div>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickLink({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link to={to} className="surface-card p-5 hover:border-primary/40 transition-colors block">
      <div className="font-medium">{title}</div>
      <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</div>
    </Link>
  );
}
