import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  AnamneseProfile,
  ANAMNESE_FIELD_SPECS,
  emptyAnamneseProfile,
  getField,
  setField,
  mergeProfiles,
  AnamneseField,
} from "@/lib/anamneseTypes";
import { callAi } from "@/lib/ai/provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Quote, RefreshCw, Sparkles, Download, FileText } from "lucide-react";
import { toast } from "sonner";

interface Props {
  patientId: string;
  /** Optional: zusätzlich auf eine konkrete Session beziehen (extrahiert nur diese). */
  currentSessionId?: string;
  currentTranscript?: string;
  currentSessionNr?: number;
  patientPseudonym?: string;
}

export function AnamneseProfilePanel({
  patientId,
  currentSessionId,
  currentTranscript,
  currentSessionNr,
  patientPseudonym,
}: Props) {
  const patient = useLiveQuery(() => db.patients.get(patientId), [patientId]);
  const sessions = useLiveQuery(
    () => db.sessions.where("patientId").equals(patientId).sortBy("date"),
    [patientId],
  );

  const [busy, setBusy] = useState(false);
  const [busyStep, setBusyStep] = useState<string>("");

  const profile: AnamneseProfile = patient?.anamneseProfile ?? emptyAnamneseProfile();

  const sections = useMemo(() => {
    const map = new Map<string, typeof ANAMNESE_FIELD_SPECS>();
    for (const spec of ANAMNESE_FIELD_SPECS) {
      const list = map.get(spec.section) ?? [];
      list.push(spec);
      map.set(spec.section, list);
    }
    return Array.from(map.entries());
  }, []);

  const saveProfile = async (next: AnamneseProfile) => {
    if (!patient) return;
    await db.patients.update(patient.id, {
      anamneseProfile: next,
      anamneseUpdatedAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  const extractFromCurrent = async () => {
    if (!currentTranscript?.trim()) {
      toast.error("Kein Transkript für diese Session.");
      return;
    }
    if (!currentSessionId) return;
    setBusy(true);
    setBusyStep("Extrahiere aus aktueller Session…");
    try {
      const incoming = await callAi<Partial<AnamneseProfile>>({
        task: "anamnese-extract",
        patientPseudonym,
        payload: {
          transcript: currentTranscript,
          sessionId: currentSessionId,
          sessionNr: currentSessionNr,
          currentProfile: profile,
        },
      });
      const merged = mergeProfiles(profile, incoming, currentSessionId);
      await saveProfile(merged);
      toast.success("Anamnese aktualisiert.");
    } catch (e: any) {
      toast.error(e?.message ?? "Fehler bei Extraktion.");
    } finally {
      setBusy(false);
      setBusyStep("");
    }
  };

  const rebuildAll = async () => {
    if (!sessions || sessions.length === 0) {
      toast.error("Keine Sessions vorhanden.");
      return;
    }
    const relevant = sessions
      .filter(s => (s.transcript ?? s.rawNotes ?? "").trim().length > 50)
      .slice(0, 7);
    if (relevant.length === 0) {
      toast.error("Keine Transkripte vorhanden (Sessions 1–7).");
      return;
    }
    setBusy(true);
    let acc: AnamneseProfile = emptyAnamneseProfile();
    try {
      for (let i = 0; i < relevant.length; i++) {
        const s = relevant[i];
        setBusyStep(`Session ${i + 1}/${relevant.length} – ${patient?.id ?? ""}`);
        const incoming = await callAi<Partial<AnamneseProfile>>({
          task: "anamnese-extract",
          patientPseudonym,
          payload: {
            transcript: s.transcript ?? s.rawNotes ?? "",
            sessionId: s.id,
            sessionNr: i + 1,
            currentProfile: acc,
          },
        });
        acc = mergeProfiles(acc, incoming, s.id);
      }
      await saveProfile(acc);
      toast.success(`Anamnese aus ${relevant.length} Sessions neu aufgebaut.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Fehler bei Re-Build.");
    } finally {
      setBusy(false);
      setBusyStep("");
    }
  };

  const editField = async (path: string, text: string) => {
    const old = getField(profile, path);
    const next = setField(profile, path, { ...old, text });
    next.updatedAt = Date.now();
    await saveProfile(next);
  };

  const exportMarkdown = () => {
    const lines: string[] = [];
    lines.push(`# Anamnese – ${patient?.id ?? ""}`);
    lines.push(`_Stand: ${new Date(profile.updatedAt ?? Date.now()).toLocaleString("de-DE")}_`);
    lines.push("");
    for (const [section, specs] of sections) {
      lines.push(`## ${section}`);
      for (const spec of specs) {
        const f = getField(profile, spec.path);
        lines.push(`**${spec.label}:** ${f.text?.trim() ? f.text : "—"}`);
      }
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Anamnese_${patient?.id ?? "patient"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sessionCount = sessions?.length ?? 0;
  const phaseDone = sessionCount > 7;
  const filledCount = ANAMNESE_FIELD_SPECS.filter(s => getField(profile, s.path).text?.trim()).length;
  const completeness = Math.round((filledCount / ANAMNESE_FIELD_SPECS.length) * 100);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="size-4" />
              <span className="font-medium text-sm">Anamnese-Profil</span>
              <Badge variant="secondary">{completeness}% befüllt</Badge>
              {phaseDone && <Badge variant="outline">Phase abgeschlossen (Sitzung &gt; 7)</Badge>}
            </div>
            <div className="text-xs text-muted-foreground">
              {profile.sessionsCovered?.length ?? 0} Session(s) eingeflossen.
              {profile.updatedAt && ` Letztes Update: ${new Date(profile.updatedAt).toLocaleString("de-DE")}.`}
              {busyStep && <span className="ml-2 text-primary">· {busyStep}</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {currentSessionId && currentTranscript?.trim() && (
              <Button size="sm" onClick={extractFromCurrent} disabled={busy}>
                <Sparkles className="size-4 mr-2" />
                Aus dieser Session extrahieren
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={rebuildAll} disabled={busy}>
              <RefreshCw className={`size-4 mr-2 ${busy ? "animate-spin" : ""}`} />
              Aus allen Sessions 1–7 neu aufbauen
            </Button>
            <Button size="sm" variant="ghost" onClick={exportMarkdown}>
              <Download className="size-4 mr-2" />
              Markdown
            </Button>
          </div>
        </CardContent>
      </Card>

      {sections.map(([section, specs]) => (
        <Card key={section}>
          <CardContent className="p-4 space-y-3">
            <div className="text-sm font-semibold tracking-tight border-l-2 border-primary pl-2">
              {section}
            </div>
            <div className="grid gap-3">
              {specs.map(spec => (
                <AnamneseFieldRow
                  key={spec.path}
                  label={spec.label}
                  field={getField(profile, spec.path)}
                  onChange={(text) => editField(spec.path, text)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AnamneseFieldRow({
  label,
  field,
  onChange,
}: {
  label: string;
  field: AnamneseField;
  onChange: (text: string) => void;
}) {
  const [val, setVal] = useState(field.text ?? "");
  const [dirty, setDirty] = useState(false);
  // Sync external updates
  useMemoSync(field.text ?? "", v => { setVal(v); setDirty(false); });

  const sources = field.sources ?? [];

  return (
    <div className="grid grid-cols-[160px_1fr_auto] gap-3 items-start">
      <div className="text-xs uppercase tracking-wider text-muted-foreground pt-2">{label}</div>
      <Textarea
        value={val}
        onChange={e => { setVal(e.target.value); setDirty(true); }}
        onBlur={() => { if (dirty) { onChange(val); setDirty(false); } }}
        placeholder="—"
        rows={Math.max(1, Math.min(4, Math.ceil((val.length || 1) / 80)))}
        className="text-sm resize-none"
      />
      <div className="pt-1.5">
        {sources.length > 0 ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 px-2">
                <Quote className="size-3.5 mr-1" />
                {sources.length}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 text-xs space-y-2">
              <div className="font-medium">Quellen</div>
              {sources.map((s, i) => (
                <div key={i} className="border-l-2 border-primary/50 pl-2">
                  <div className="text-muted-foreground">
                    Session {s.sessionNr ?? "?"} · {s.sessionId.slice(0, 12)}…
                  </div>
                  <div className="italic">„{s.quote}"</div>
                </div>
              ))}
            </PopoverContent>
          </Popover>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}

// Mini-Hook: synchronisiert externen Wert in lokalen State, wenn er sich ändert.
import { useEffect } from "react";
function useMemoSync(value: string, cb: (v: string) => void) {
  useEffect(() => { cb(value); /* eslint-disable-next-line */ }, [value]);
}
