import { useParams, Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, FileText, Presentation } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function PatientDetail() {
  const { id } = useParams();
  const patient = useLiveQuery(() => (id ? db.patients.get(id) : undefined), [id]);
  const sessions = useLiveQuery(() => (id ? db.sessions.where("patientId").equals(id).reverse().sortBy("date") : Promise.resolve([])), [id]);
  const decks = useLiveQuery(() => (id ? db.decks.where("patientId").equals(id).toArray() : Promise.resolve([])), [id]);

  if (!patient) return <div className="text-sm text-muted-foreground">Lade…</div>;

  return (
    <>
      <PageHeader title={patient.id}
        description={`${patient.approach} · ${patient.diagnoses.join(", ") || "keine Diagnose-Tags"}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to={`/patienten/${patient.id}/edit`}><Pencil className="size-4 mr-2" />Bearbeiten</Link></Button>
            <Button asChild><Link to={`/sessions/neu?patient=${patient.id}`}><Plus className="size-4 mr-2" />Session</Link></Button>
          </div>
        } />

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1"><CardContent className="p-5 space-y-3 text-sm">
          <Field label="Status" value={patient.active ? "In Behandlung" : "Archiviert"} />
          <Field label="Altersgruppe" value={patient.ageGroup || "—"} />
          <Field label="Geschlecht" value={patient.gender || "—"} />
          <Field label="Therapiebeginn" value={patient.startDate || "—"} />
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Therapieziele</div>
            <div className="mt-1">{patient.goals || <span className="text-muted-foreground">—</span>}</div>
          </div>
        </CardContent></Card>

        <div className="md:col-span-2 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg flex items-center gap-2"><FileText className="size-4" /> Sessions</h2>
              <Button size="sm" variant="outline" asChild><Link to={`/sessions/neu?patient=${patient.id}`}>+ Neu</Link></Button>
            </div>
            <Card><CardContent className="p-0 divide-y">
              {(!sessions || sessions.length === 0) && (
                <div className="p-5 text-sm text-muted-foreground">Noch keine Sessions.</div>
              )}
              {sessions?.map((s, idx) => {
                const total = sessions.length;
                const nr = total - idx; // reverse-sorted: newest first
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
            </CardContent></Card>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg flex items-center gap-2"><Presentation className="size-4" /> Slide-Decks</h2>
              <Button size="sm" variant="outline" asChild><Link to={`/slides/neu?patient=${patient.id}`}>+ Neu</Link></Button>
            </div>
            <Card><CardContent className="p-0 divide-y">
              {(!decks || decks.length === 0) && (
                <div className="p-5 text-sm text-muted-foreground">Noch keine personalisierten Decks.</div>
              )}
              {decks?.map(d => (
                <Link key={d.id} to={`/slides/${d.id}`} className="block p-4 hover:bg-muted/50">
                  <div className="font-medium text-sm">{d.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{d.slides.length} Slides · {formatDateTime(d.updatedAt)}</div>
                </Link>
              ))}
            </CardContent></Card>
          </section>
        </div>
      </div>
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
