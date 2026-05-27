import { useParams, Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, FileText, Presentation, User, Activity } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { AnamneseProfilePanel } from "@/components/anamnese/AnamneseProfilePanel";
import { TherapieverlaufDashboard } from "@/components/TherapieverlaufDashboard";

export default function PatientDetail() {
  const { id } = useParams();
  const patient = useLiveQuery(() => (id ? db.patients.get(id) : undefined), [id]);
  const sessions = useLiveQuery(() => (id ? db.sessions.where("patientId").equals(id).reverse().sortBy("date") : Promise.resolve([])), [id]);
  const decks = useLiveQuery(() => (id ? db.decks.where("patientId").equals(id).toArray() : Promise.resolve([])), [id]);

  if (!patient) return <div className="text-sm text-muted-foreground">Lade…</div>;

  return (
    <>
      <PageHeader
        title={patient.id}
        description={`${patient.approach} · ${patient.diagnoses.join(", ") || "keine Diagnose-Tags"}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/patienten/${patient.id}/edit`}><Pencil className="size-4 mr-2" />Bearbeiten</Link>
            </Button>
            <Button asChild>
              <Link to={`/sessions/neu?patient=${patient.id}`}><Plus className="size-4 mr-2" />Session</Link>
            </Button>
          </div>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <Field label="Status" value={patient.active ? "In Behandlung" : "Archiviert"} />
          <Field label="Altersgruppe" value={patient.ageGroup || "—"} />
          <Field label="Geschlecht" value={patient.gender || "—"} />
          <Field label="Therapiebeginn" value={patient.startDate || "—"} />
          <Field label="Sessions" value={String(sessions?.length ?? 0)} />
        </CardContent>
      </Card>

      <Tabs defaultValue="anamnese" className="w-full">
        <TabsList>
          <TabsTrigger value="anamnese"><User className="size-4 mr-2" />Anamnese-Profil</TabsTrigger>
          <TabsTrigger value="verlauf"><Activity className="size-4 mr-2" />Therapieverlauf</TabsTrigger>
          <TabsTrigger value="sessions"><FileText className="size-4 mr-2" />Sessions</TabsTrigger>
          <TabsTrigger value="decks"><Presentation className="size-4 mr-2" />Slide-Decks</TabsTrigger>
        </TabsList>

        <TabsContent value="anamnese" className="mt-4">
          <AnamneseProfilePanel patientId={patient.id} patientPseudonym={patient.id} />
        </TabsContent>

        <TabsContent value="verlauf" className="mt-4">
          <TherapieverlaufDashboard patientId={patient.id} patientPseudonym={patient.id} />
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <Card>
            <CardContent className="p-0 divide-y">
              {(!sessions || sessions.length === 0) && (
                <div className="p-5 text-sm text-muted-foreground">Noch keine Sessions.</div>
              )}
              {sessions?.map((s, idx) => {
                const total = sessions.length;
                const nr = total - idx;
                return (
                  <Link key={s.id} to={`/sessions/${s.id}`} className="block p-4 hover:bg-muted/50">
                    <div className="flex justify-between items-center text-sm gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge variant="secondary" className="shrink-0">Session {nr}</Badge>
                        <div className="min-w-0">
                          <div className="font-medium">{formatDateTime(s.date)}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {s.structured || s.kvDocumentation ? "Strukturiert ✓" : "Roh-Notiz"} · {s.format}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">{s.durationMin} min</Badge>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
          <div className="mt-3">
            <Button size="sm" variant="outline" asChild>
              <Link to={`/sessions/neu?patient=${patient.id}`}>+ Neue Session</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="decks" className="mt-4">
          <Card>
            <CardContent className="p-0 divide-y">
              {(!decks || decks.length === 0) && (
                <div className="p-5 text-sm text-muted-foreground">Noch keine personalisierten Decks.</div>
              )}
              {decks?.map(d => (
                <Link key={d.id} to={`/slides/${d.id}`} className="block p-4 hover:bg-muted/50">
                  <div className="font-medium text-sm">{d.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{d.slides.length} Slides · {formatDateTime(d.updatedAt)}</div>
                </Link>
              ))}
            </CardContent>
          </Card>
          <div className="mt-3">
            <Button size="sm" variant="outline" asChild>
              <Link to={`/slides/neu?patient=${patient.id}`}>+ Neues Deck</Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}
