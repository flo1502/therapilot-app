import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { db, SessionEntry, uid } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ensureAuthed } from "@/lib/authGuard";
import { Save } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { KVDocumentationPanel } from "@/components/KVDocumentationPanel";
import { SchemaChatFeed } from "@/components/SchemaChatFeed";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function SessionEdit() {
  const { id } = useParams();
  const isNew = !id || id === "neu";
  const [search] = useSearchParams();
  const nav = useNavigate();

  const patients = useLiveQuery(() => db.patients.where("active").equals(1 as any).toArray().catch(() => db.patients.toArray()), []);
  const allPatients = useLiveQuery(() => db.patients.toArray(), []);

  const [s, setS] = useState<SessionEntry | null>(null);

  useEffect(() => {
    (async () => {
      if (isNew) {
        const pid = search.get("patient") ?? "";
        setS({
          id: uid("s_"), patientId: pid, date: Date.now(), durationMin: 50,
          rawNotes: "", format: "VT-Verlauf", createdAt: Date.now(),
        });
      } else {
        const ex = await db.sessions.get(id!);
        if (!ex) { toast.error("Nicht gefunden."); nav("/sessions"); return; }
        setS(ex);
      }
    })();
  }, [id, isNew, nav, search]);

  if (!s) return <div className="text-sm text-muted-foreground">Lade…</div>;

  const save = async () => {
    if (!s.patientId) { toast.error("Bitte Patient:in wählen."); return; }
    if (!(await ensureAuthed())) return;
    await db.sessions.put(s);
    toast.success("Gespeichert.");
    if (isNew) nav(`/sessions/${s.id}`);
  };

  return (
    <>
      <PageHeader title={isNew ? "Neue Sitzung" : `Sitzung · ${s.patientId}`}
        description="Gesprächsnotiz erfassen – die KI erstellt daraus einen strukturierten Bericht."
        actions={<Button className="h-12 text-base px-6" onClick={save}><Save className="size-5 mr-2" />Speichern</Button>}
      />

      <Card className="mb-6"><CardContent className="p-6 grid md:grid-cols-3 gap-6">
        <div>
          <Label className="text-base">Person (Pseudonym)</Label>
          <Select value={s.patientId} onValueChange={v => setS({ ...s, patientId: v })}>
            <SelectTrigger className="h-12 text-base mt-2"><SelectValue placeholder="Pseudonym wählen" /></SelectTrigger>
            <SelectContent>
              {allPatients?.map(p => <SelectItem key={p.id} value={p.id} className="text-base">{p.id} · {p.approach}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-base">Datum und Uhrzeit</Label>
          <Input className="h-12 text-base mt-2" type="datetime-local"
            value={new Date(s.date - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
            onChange={e => setS({ ...s, date: new Date(e.target.value).getTime() })} />
        </div>
        <div>
          <Label className="text-base">Dauer in Minuten</Label>
          <Input className="h-12 text-base mt-2" type="number" value={s.durationMin} onChange={e => setS({ ...s, durationMin: parseInt(e.target.value) || 0 })} />
        </div>
      </CardContent></Card>

      <Tabs defaultValue={search.get("tab") ?? "kv"} className="w-full">
        <TabsList className="h-auto flex-wrap gap-1 p-1.5">
          <TabsTrigger className="h-11 px-4 text-base" value="kv">Verhaltenstherapie-Verlauf</TabsTrigger>
          <TabsTrigger className="h-11 px-4 text-base" value="schemas">Denkmuster-Analyse</TabsTrigger>
        </TabsList>



        <TabsContent value="kv" className="mt-4">
          <KVDocumentationPanel
            patientId={s.patientId}
            patientPseudonym={s.patientId}
            diagnoses={allPatients?.find(p => p.id === s.patientId)?.diagnoses}
            approach={allPatients?.find(p => p.id === s.patientId)?.approach}
            goals={allPatients?.find(p => p.id === s.patientId)?.goals}
            durationMin={s.durationMin}
            transcript={s.transcript ?? ""}
            onTranscriptChange={(v) => setS({ ...s, transcript: v })}
            documentation={s.kvDocumentation}
            extraction={s.kvExtraction}
            validation={s.kvValidation}
            onDocumentationChange={(doc, ext, val) => {
              const updated = { ...s, kvDocumentation: doc, kvExtraction: ext, kvValidation: val };
              setS(updated);
              db.sessions.put(updated);
            }}
          />
        </TabsContent>

        <TabsContent value="schemas" className="mt-4">
          <SchemaChatFeed
            sessionId={s.id}
            patientPseudonym={s.patientId}
            transcript={s.transcript ?? s.rawNotes ?? ""}
            analysis={s.schemaAnalysis}
            onAnalysisChange={(result) => {
              const updated = { ...s, schemaAnalysis: result, schemaAnalyzedAt: result.generatedAt };
              setS(updated);
              db.sessions.put(updated);
            }}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
