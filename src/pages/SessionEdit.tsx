import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { db, SessionEntry, SessionFormat, uid } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { SessionSlidesPanel } from "@/components/SessionSlidesPanel";
import { KVDocumentationPanel } from "@/components/KVDocumentationPanel";
import { SchemaChatFeed } from "@/components/SchemaChatFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FORMATS: SessionFormat[] = ["VT-Verlauf", "Frei"];

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
    await db.sessions.put(s);
    toast.success("Gespeichert.");
    if (isNew) nav(`/sessions/${s.id}`);
  };

  return (
    <>
      <PageHeader title={isNew ? "Neue Session" : `Session · ${s.patientId}`}
        description="Roh-Notiz erfassen, dann AI-strukturiert dokumentieren."
        actions={<Button onClick={save}><Save className="size-4 mr-2" />Speichern</Button>}
      />

      <Card className="mb-4"><CardContent className="p-5 grid md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <Label>Patient:in</Label>
          <Select value={s.patientId} onValueChange={v => setS({ ...s, patientId: v })}>
            <SelectTrigger><SelectValue placeholder="Pseudonym wählen" /></SelectTrigger>
            <SelectContent>
              {allPatients?.map(p => <SelectItem key={p.id} value={p.id}>{p.id} · {p.approach}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Datum</Label>
          <Input type="datetime-local"
            value={new Date(s.date - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
            onChange={e => setS({ ...s, date: new Date(e.target.value).getTime() })} />
        </div>
        <div>
          <Label>Dauer (min)</Label>
          <Input type="number" value={s.durationMin} onChange={e => setS({ ...s, durationMin: parseInt(e.target.value) || 0 })} />
        </div>
        <div>
          <Label>Format</Label>
          <Select value={s.format} onValueChange={(v: any) => setS({ ...s, format: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      <Tabs defaultValue="soap" className="w-full">
        <TabsList>
          <TabsTrigger value="soap">SOAP / Strukturierung</TabsTrigger>
          <TabsTrigger value="kv">KV-Verlauf</TabsTrigger>
          <TabsTrigger value="schemas">CBT-Schemata</TabsTrigger>
          <TabsTrigger value="slides">Folien</TabsTrigger>
        </TabsList>

        <TabsContent value="soap" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card><CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Roh-Notiz</Label>
                <Button type="button" size="sm" variant={recording ? "destructive" : "outline"} onClick={toggleRec}>
                  {recording ? <><MicOff className="size-4 mr-1.5" />Stop</> : <><Mic className="size-4 mr-1.5" />Diktat</>}
                </Button>
              </div>
              <Textarea rows={18} value={s.rawNotes} onChange={e => setS({ ...s, rawNotes: e.target.value })}
                placeholder="Stichpunkte, Themen, Beobachtungen während der Sitzung…" />
              <Button className="mt-3 w-full" onClick={structure} disabled={busy}>
                <Sparkles className="size-4 mr-2" />
                {busy ? "Strukturiere…" : `Mit AI als ${s.format} strukturieren`}
              </Button>
            </CardContent></Card>

            <Card><CardContent className="p-5">
              <Label className="text-sm font-medium">Strukturierte Dokumentation</Label>
              {s.structured ? (
                <div className="mt-2 prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                  {s.structured}
                </div>
              ) : (
                <div className="mt-2 text-sm text-muted-foreground italic">
                  Noch keine Strukturierung. Klicken Sie links auf „Mit AI strukturieren".
                </div>
              )}
            </CardContent></Card>
          </div>
        </TabsContent>

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



        <TabsContent value="slides" className="mt-4">
          <SessionSlidesPanel
            patientId={s.patientId}
            approach={allPatients?.find(p => p.id === s.patientId)?.approach}
            goals={allPatients?.find(p => p.id === s.patientId)?.goals}
            notesExcerpt={s.rawNotes}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
