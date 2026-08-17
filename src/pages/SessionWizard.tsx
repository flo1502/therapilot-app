import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db, SessionEntry, uid } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { callAi } from "@/lib/ai/provider";
import { KVDocumentationResult } from "@/lib/kvDocTypes";
import { validateKVDocumentation } from "@/lib/kvGuardrails";
import {
  ArrowLeft, ArrowRight, Mic, MicOff, PenLine, Upload, Sparkles, CheckCircle2,
  Info, CalendarClock, UserRound, FileText, Brain, Wand2,
} from "lucide-react";

type Method = "dictate" | "type" | "upload";
type DocType = "kv" | "schemas";

const DOC_TYPES: { key: DocType; title: string; desc: string; abbr: string; icon: any }[] = [
  { key: "kv", title: "Verhaltenstherapie-Verlauf", desc: "Für den klassischen Bericht an die Krankenkasse.", abbr: "Fachbegriff: VT-Verlauf / KV-Dokumentation", icon: FileText },
  { key: "schemas", title: "Denkmuster-Analyse", desc: "Erkennt wiederkehrende Grundüberzeugungen aus dem Gespräch.", abbr: "Fachbegriff: CBT-Schemata", icon: Brain },
];

function parseSubtitleFormat(text: string): string {
  return text
    .replace(/^WEBVTT.*$/gm, "")
    .replace(/^\d+\s*$/gm, "")
    .replace(/^\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}.*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function InfoHint({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center text-muted-foreground/70 align-middle ml-1.5">
            <Info className="size-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function StepHeader({ step, total, title, hint }: { step: number; total: number; title: string; hint?: string }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Schritt {step} von {total}</p>
      <h1 className="text-3xl md:text-4xl mt-1 leading-tight">{title}</h1>
      {hint && <p className="text-base text-muted-foreground mt-3 max-w-2xl leading-relaxed">{hint}</p>}
    </div>
  );
}

function BigTile({
  icon: Icon, title, desc, selected, onClick, hint,
}: { icon: any; title: string; desc: string; selected?: boolean; onClick: () => void; hint?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border p-6 transition-all min-h-[7rem] w-full
        ${selected ? "border-primary bg-primary-soft/60 shadow-[var(--shadow-elevated)]" : "border-border bg-card hover:border-primary/50 hover:shadow-[var(--shadow-soft)]"}`}
    >
      <Icon className={`size-7 mb-3 ${selected ? "text-primary" : "text-primary/80"}`} />
      <div className="text-lg font-medium leading-snug">
        {title}
        {hint && <InfoHint text={hint} />}
      </div>
      <div className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{desc}</div>
    </button>
  );
}

export default function SessionWizard() {
  const nav = useNavigate();
  const [search] = useSearchParams();
  const patients = useLiveQuery(() => db.patients.toArray(), []);
  const lastSession = useLiveQuery(
    async () => (await db.sessions.orderBy("date").reverse().limit(1).toArray())[0],
    [],
  );

  const [step, setStep] = useState(1);
  const [patientId, setPatientId] = useState(search.get("patient") ?? "");
  const [date, setDate] = useState(Date.now());
  const [durationMin, setDurationMin] = useState(50);
  const [method, setMethod] = useState<Method | null>(null);
  const [transcript, setTranscript] = useState("");
  const [docType, setDocType] = useState<DocType>("kv");
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const [recording, setRecording] = useState(false);
  const recRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const autoFilled = useMemo(() => {
    const notes: string[] = [];
    if (patients && patients.length === 1) notes.push("Es ist nur eine Person angelegt – sie wurde automatisch ausgewählt.");
    else if (lastSession && patientId === lastSession.patientId) notes.push("Zuletzt dokumentierte Person wurde vorgeschlagen.");
    if (lastSession) notes.push(`Dauer aus der letzten Sitzung übernommen (${lastSession.durationMin} Minuten).`);
    notes.push("Datum und Uhrzeit stehen auf jetzt.");
    return notes;
  }, [patients, lastSession, patientId]);

  useEffect(() => {
    if (patientId) return;
    if (patients && patients.length === 1) setPatientId(patients[0].id);
    else if (lastSession?.patientId) setPatientId(lastSession.patientId);
  }, [patients, lastSession, patientId]);

  useEffect(() => {
    if (lastSession?.durationMin) setDurationMin(lastSession.durationMin);
  }, [lastSession?.id]);

  const patient = patients?.find((p) => p.id === patientId);

  const toggleRec = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Diktat ist in diesem Browser leider nicht verfügbar."); return; }
    if (recording) { recRef.current?.stop(); setRecording(false); return; }
    const rec = new SR();
    rec.lang = "de-DE";
    rec.interimResults = true;
    rec.continuous = true;
    let finalText = transcript;
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t + " "; else interim += t;
      }
      setTranscript(finalText + interim);
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    rec.start();
    recRef.current = rec;
    setRecording(true);
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    const cleaned = file.name.match(/\.(vtt|srt)$/i) ? parseSubtitleFormat(text) : text;
    setTranscript(cleaned);
    toast.success("Datei geladen. Du kannst den Text noch anpassen.");
  };

  const buildSession = (): SessionEntry => ({
    id: savedId ?? uid("s_"),
    patientId,
    date,
    durationMin,
    rawNotes: transcript,
    transcript,
    format: "VT-Verlauf",
    createdAt: Date.now(),
  });

  const finish = async () => {
    setBusy(true);
    try {
      let session = buildSession();
      if (docType === "kv" && transcript.trim()) {
        const result = await callAi<KVDocumentationResult>({
          task: "kv-documentation",
          patientPseudonym: patientId,
          payload: {
            transcript,
            context: { diagnoses: patient?.diagnoses, approach: patient?.approach, goals: patient?.goals, durationMin },
          },
        });
        const val = validateKVDocumentation(result.documentation, patientId);
        session = {
          ...session,
          kvDocumentation: result.documentation,
          kvExtraction: result.extraction,
          kvValidation: { score: val.score, errors: val.errors, warnings: val.warnings, generatedAt: Date.now() },
        };
      }
      await db.sessions.put(session);
      setSavedId(session.id);
      setStep(4);
    } catch (e: any) {
      toast.error(e?.message ?? "Das hat leider nicht geklappt. Versuche es bitte noch einmal.");
    } finally {
      setBusy(false);
    }
  };

  const back = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="max-w-3xl mx-auto pb-16">
      {step < 4 && (
        <Button
          variant="ghost"
          className="h-12 px-3 mb-4 text-base"
          onClick={() => (step === 1 ? nav(-1) : back())}
        >
          <ArrowLeft className="size-5 mr-2" /> Zurück
        </Button>
      )}

      {step === 1 && (
        <>
          <StepHeader
            step={1}
            total={3}
            title="Für wen ist diese Sitzung?"
            hint="Alles ist schon vorausgefüllt – du musst es nur bestätigen oder anpassen."
          />
          <Card>
            <CardContent className="p-6 md:p-8 space-y-7">
              <div className="space-y-2.5">
                <Label className="text-base flex items-center gap-2">
                  <UserRound className="size-5 text-primary" /> Person (Pseudonym)
                </Label>
                <Select value={patientId} onValueChange={setPatientId}>
                  <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Bitte auswählen" /></SelectTrigger>
                  <SelectContent>
                    {patients?.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-base">
                        {p.id}{p.name ? ` · ${p.name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label className="text-base flex items-center gap-2">
                    <CalendarClock className="size-5 text-primary" /> Datum und Uhrzeit
                  </Label>
                  <Input
                    className="h-12 text-base"
                    type="datetime-local"
                    value={new Date(date - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                    onChange={(e) => setDate(new Date(e.target.value).getTime())}
                  />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-base">Dauer in Minuten</Label>
                  <Input
                    className="h-12 text-base"
                    type="number"
                    value={durationMin}
                    onChange={(e) => setDurationMin(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground space-y-1.5 leading-relaxed">
                <div className="font-medium text-foreground flex items-center gap-2">
                  <Wand2 className="size-4 text-primary" /> Automatisch für dich vorbereitet
                </div>
                {autoFilled.map((n, i) => <div key={i}>· {n}</div>)}
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full h-14 text-base mt-6"
            disabled={!patientId}
            onClick={() => setStep(2)}
          >
            Passt so – weiter <ArrowRight className="size-5 ml-2" />
          </Button>
          {!patientId && (
            <p className="text-sm text-muted-foreground mt-3 text-center">
              Bitte wähle zuerst eine Person aus.
            </p>
          )}
        </>
      )}

      {step === 2 && (
        <>
          <StepHeader
            step={2}
            total={3}
            title="Wie möchtest du die Sitzung festhalten?"
            hint="Wähle den Weg, der dir am angenehmsten ist. Du kannst später jederzeit wechseln."
          />
          <div className="grid md:grid-cols-3 gap-4">
            <BigTile icon={Mic} title="Diktieren" desc="Sprich einfach frei – wir schreiben mit." selected={method === "dictate"} onClick={() => setMethod("dictate")} />
            <BigTile icon={PenLine} title="Text eingeben" desc="Tippen oder etwas einfügen." selected={method === "type"} onClick={() => setMethod("type")} />
            <BigTile icon={Upload} title="Datei hochladen" desc="Vorhandenes Dokument nutzen." selected={method === "upload"} onClick={() => { setMethod("upload"); setTimeout(() => fileInputRef.current?.click(), 50); }} />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.vtt,.srt"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ""; }}
          />

          {method && (
            <Card className="mt-6">
              <CardContent className="p-6 md:p-8 space-y-5">
                {method === "dictate" && (
                  <Button
                    variant={recording ? "destructive" : "secondary"}
                    className="h-14 text-base w-full"
                    onClick={toggleRec}
                  >
                    {recording
                      ? <><MicOff className="size-5 mr-2" /> Aufnahme beenden</>
                      : <><Mic className="size-5 mr-2" /> Aufnahme starten</>}
                  </Button>
                )}
                {method === "upload" && (
                  <Button variant="secondary" className="h-14 text-base w-full" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="size-5 mr-2" /> Datei auswählen (.txt, .vtt, .srt)
                  </Button>
                )}
                <div className="space-y-2.5">
                  <Label className="text-base">Text der Sitzung</Label>
                  <Textarea
                    rows={12}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Hier entsteht der Text. Schreibe frei – wir kümmern uns um die Struktur."
                    className="text-base leading-relaxed"
                  />
                  <p className="text-sm text-muted-foreground">
                    {transcript.trim()
                      ? "Sieht gut aus – du kannst weitermachen, wann du möchtest."
                      : "Bereit, wenn du es bist."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Button className="w-full h-14 text-base mt-6" disabled={!transcript.trim()} onClick={() => setStep(3)}>
            Weiter <ArrowRight className="size-5 ml-2" />
          </Button>
        </>
      )}

      {step === 3 && (
        <>
          <StepHeader
            step={3}
            total={3}
            title="Was soll daraus entstehen?"
            hint="Wähle eine Auswertung. Die anderen kannst du später jederzeit ergänzen."
          />
          <div className="grid gap-4">
            {DOC_TYPES.map((d) => (
              <BigTile
                key={d.key}
                icon={d.icon}
                title={d.title}
                desc={d.desc}
                hint={d.abbr}
                selected={docType === d.key}
                onClick={() => setDocType(d.key)}
              />
            ))}
          </div>
          <Button className="w-full h-14 text-base mt-6" disabled={busy} onClick={finish}>
            <Sparkles className="size-5 mr-2" />
            {busy ? "Einen Moment – wird erstellt …" : "Jetzt erstellen"}
          </Button>
          <p className="text-sm text-muted-foreground mt-3 text-center leading-relaxed">
            Der Text wird vor der Auswertung pseudonymisiert. Du kannst danach alles in Ruhe prüfen und ändern.
          </p>
        </>
      )}

      {step === 4 && (
        <div className="text-center pt-10">
          <div className="mx-auto size-20 rounded-full bg-primary-soft flex items-center justify-center mb-6">
            <CheckCircle2 className="size-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl">Fertig! Dein strukturierter Bericht ist da.</h1>
          <p className="text-base text-muted-foreground mt-4 max-w-xl mx-auto leading-relaxed">
            Die Sitzung ist gespeichert. Schau in Ruhe darüber – jeder Abschnitt lässt sich frei bearbeiten.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Button className="h-14 text-base px-8" onClick={() => nav(`/sessions/${savedId}?tab=${docType}`)}>
              Bericht ansehen <ArrowRight className="size-5 ml-2" />
            </Button>
            <Button variant="outline" className="h-14 text-base px-8" onClick={() => nav("/")}>
              Zurück zur Übersicht
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
