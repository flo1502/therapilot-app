import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { PreSessionCard } from "@/components/PreSessionCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, FileText, Presentation, Plus, AlertTriangle } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function Dashboard() {
  const patients = useLiveQuery(() => db.patients.toArray(), []);
  const sessions = useLiveQuery(() => db.sessions.orderBy("date").reverse().limit(5).toArray(), []);
  const decks = useLiveQuery(() => db.decks.orderBy("updatedAt").reverse().limit(3).toArray(), []);

  const activePatients = patients?.filter(p => p.active).length ?? 0;
  const totalSessions = useLiveQuery(() => db.sessions.count(), []);

  return (
    <>
      <PageHeader
        title="Willkommen zurück"
        description="Ihre therapeutische Praxis – ruhig, strukturiert, datenschutzkonform."
        actions={
          <Button asChild>
            <Link to="/sessions/neu"><Plus className="size-4 mr-2" /> Neue Session</Link>
          </Button>
        }
      />

      <PreSessionCard />

      <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 mb-6 flex items-start gap-3">
        <AlertTriangle className="size-4 text-warning mt-0.5 shrink-0" />
        <div className="text-sm">
          <strong>Prototyp-Modus:</strong> KI-Anfragen laufen aktuell über das Lovable AI Gateway (pseudonymisiert).
          Für DSGVO-konformen Echteinsatz wechseln Sie in Phase 2 auf ein lokales LLM (Ollama) – dieselbe Oberfläche, keine Cloud-Calls.
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Stat icon={Users} label="Aktive Patient:innen" value={activePatients} to="/patienten" />
        <Stat icon={FileText} label="Sessions gesamt" value={totalSessions ?? 0} to="/sessions" />
        <Stat icon={Presentation} label="Slide-Decks" value={decks?.length ?? 0} to="/slides" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-lg mb-3">Letzte Sessions</h2>
          <Card><CardContent className="p-0 divide-y">
            {(!sessions || sessions.length === 0) && (
              <div className="p-6 text-sm text-muted-foreground">
                Noch keine Sessions dokumentiert.
              </div>
            )}
            {sessions?.map(s => (
              <Link key={s.id} to={`/sessions/${s.id}`} className="block p-4 hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="font-medium text-sm">{s.patientId}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{formatDateTime(s.date)} · {s.format}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">{s.durationMin} min</span>
                </div>
              </Link>
            ))}
          </CardContent></Card>
        </section>

        <section>
          <h2 className="text-lg mb-3">Schnellzugriff</h2>
          <div className="grid gap-3">
            <QuickLink to="/patienten/neu" title="Patient:in anlegen" desc="Pseudonym + Stammdaten" />
            <QuickLink to="/templates" title="Template-Bibliothek" desc="KVT, ACT, Schematherapie, Psychoedukation" />
            <QuickLink to="/slides/neu" title="Slide-Deck personalisieren" desc="AI-gestützt, patientenspezifisch" />
          </div>
        </section>
      </div>
    </>
  );
}

function Stat({ icon: Icon, label, value, to }: any) {
  return (
    <Link to={to}>
      <Card className="hover:border-primary/40 transition-colors">
        <CardContent className="p-5">
          <Icon className="size-5 text-primary mb-3" />
          <div className="text-2xl font-display font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{label}</div>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickLink({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link to={to} className="surface-card p-4 hover:border-primary/40 transition-colors block">
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
    </Link>
  );
}
