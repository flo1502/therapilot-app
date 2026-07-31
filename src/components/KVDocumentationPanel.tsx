import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sparkles, Upload, Copy, FileText, AlertTriangle, CheckCircle2, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { callAi } from "@/lib/ai/provider";
import {
  KVDocumentation,
  KVExtraction,
  KVDocumentationResult,
  KV_SECTION_LABELS,
  KV_SECTION_ORDER,
  kvDocumentationToMarkdown,
} from "@/lib/kvDocTypes";
import { validateKVDocumentation, formatKVValidation } from "@/lib/kvGuardrails";

interface Props {
  patientId: string;
  patientPseudonym?: string;
  diagnoses?: string[];
  approach?: string;
  goals?: string;
  durationMin?: number;
  transcript: string;
  onTranscriptChange: (v: string) => void;
  documentation?: KVDocumentation;
  extraction?: KVExtraction;
  validation?: { score: number; errors: string[]; warnings: string[]; generatedAt: number };
  onDocumentationChange: (
    doc: KVDocumentation | undefined,
    ext: KVExtraction | undefined,
    val: { score: number; errors: string[]; warnings: string[]; generatedAt: number } | undefined,
  ) => void;
}

function parseSubtitleFormat(text: string): string {
  // VTT/SRT: entferne Zeitcodes & Indizes
  return text
    .replace(/^WEBVTT.*$/gm, "")
    .replace(/^\d+\s*$/gm, "")
    .replace(/^\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}.*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function KVDocumentationPanel({
  patientId,
  patientPseudonym,
  diagnoses,
  approach,
  goals,
  durationMin,
  transcript,
  onTranscriptChange,
  documentation,
  extraction,
  validation,
  onDocumentationChange,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<"idle" | "extract" | "compose" | "validate" | "retry">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState(false);
  const recRef = useRef<any>(null);

  const toggleRec = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Diktat in diesem Browser nicht verfügbar."); return; }
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      return;
    }
    const rec = new SR();
    rec.lang = "de-DE";
    rec.interimResults = true;
    rec.continuous = true;
    let finalText = transcript;
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t + " ";
        else interim += t;
      }
      onTranscriptChange(finalText + interim);
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
    onTranscriptChange(cleaned);
    toast.success(`Transkript geladen (${cleaned.length} Zeichen).`);
  };

  const generate = async () => {
    if (!transcript.trim()) {
      toast.error("Bitte zuerst Transkript erfassen oder hochladen.");
      return;
    }
    setBusy(true);
    try {
      setStage("extract");
      let result = await callAi<KVDocumentationResult>({
        task: "kv-documentation",
        patientPseudonym: patientPseudonym ?? patientId,
        payload: {
          transcript,
          context: { diagnoses, approach, goals, durationMin },
        },
      });
      setStage("validate");
      let val = validateKVDocumentation(result.documentation, patientPseudonym);

      if (!val.valid) {
        setStage("retry");
        try {
          const retry = await callAi<KVDocumentationResult>({
            task: "kv-documentation",
            patientPseudonym: patientPseudonym ?? patientId,
            payload: {
              transcript,
              context: { diagnoses, approach, goals, durationMin },
              previousErrors: val.errors,
            },
          });
          const retryVal = validateKVDocumentation(retry.documentation, patientPseudonym);
          if (retryVal.score > val.score) {
            result = retry;
            val = retryVal;
          }
        } catch {
          // retry-Fehler ignorieren, Erstgenerierung beibehalten
        }
      }

      onDocumentationChange(result.documentation, result.extraction, {
        score: val.score,
        errors: val.errors,
        warnings: val.warnings,
        generatedAt: Date.now(),
      });

      if (val.valid) toast.success(`KV-Verlauf erstellt (Score ${val.score}/100).`);
      else toast.warning(`KV-Verlauf erstellt – ${val.errors.length} Validierungs-Fehler.`);
    } catch (e: any) {
      toast.error(e?.message ?? "AI-Fehler");
    } finally {
      setBusy(false);
      setStage("idle");
    }
  };

  const updateSection = (key: keyof KVDocumentation, value: string) => {
    if (!documentation) return;
    const next = { ...documentation, [key]: value };
    const val = validateKVDocumentation(next, patientPseudonym);
    onDocumentationChange(next, extraction, {
      score: val.score,
      errors: val.errors,
      warnings: val.warnings,
      generatedAt: Date.now(),
    });
  };

  const copyMarkdown = async () => {
    if (!documentation) return;
    await navigator.clipboard.writeText(kvDocumentationToMarkdown(documentation));
    toast.success("Markdown in Zwischenablage kopiert.");
  };

  const stageLabel: Record<typeof stage, string> = {
    idle: "",
    extract: "Pass 1: Extraktion …",
    compose: "Pass 2: Verfassen …",
    validate: "Validierung …",
    retry: "Re-Versuch mit Korrekturen …",
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <FileText className="size-4" />
              Sitzungs-Transkript
            </Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.vtt,.srt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.currentTarget.value = "";
                }}
              />
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-4 mr-1.5" /> Datei
              </Button>
              <Button size="sm" variant={recording ? "destructive" : "outline"} onClick={toggleRec}>
                {recording ? <><MicOff className="size-4 mr-1.5" />Stop</> : <><Mic className="size-4 mr-1.5" />Diktat</>}
              </Button>
            </div>
          </div>
          <Textarea
            rows={10}
            value={transcript}
            onChange={(e) => onTranscriptChange(e.target.value)}
            placeholder="Vollständiges Sitzungs-Transkript einfügen (Klartext, .txt/.vtt/.srt-Upload möglich). Wird vor dem KI-Aufruf pseudonymisiert."
            className="font-mono text-xs"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {transcript.length.toLocaleString("de-DE")} Zeichen
              {transcript.length > 48000 && " · sehr lang – ggf. kürzen"}
            </span>
            <Button onClick={generate} disabled={busy || !transcript.trim()}>
              <Sparkles className="size-4 mr-2" />
              {busy ? stageLabel[stage] || "Generiere …" : "KV-Verlauf generieren"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {documentation && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">KV-Verlaufsdokumentation (7 Sektionen)</Label>
              <div className="flex items-center gap-2">
                {validation && (
                  <Badge
                    variant={validation.score >= 80 ? "default" : validation.score >= 50 ? "secondary" : "destructive"}
                    title={formatKVValidation({
                      valid: validation.errors.length === 0,
                      score: validation.score,
                      errors: validation.errors,
                      warnings: validation.warnings,
                    })}
                    className="cursor-help"
                  >
                    {validation.errors.length === 0 ? (
                      <CheckCircle2 className="size-3 mr-1" />
                    ) : (
                      <AlertTriangle className="size-3 mr-1" />
                    )}
                    {validation.score}/100
                  </Badge>
                )}
                <Button size="sm" variant="outline" onClick={copyMarkdown}>
                  <Copy className="size-4 mr-1.5" /> Markdown
                </Button>
              </div>
            </div>

            {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
              <div className="rounded-md border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs space-y-1">
                {validation.errors.map((e, i) => (
                  <div key={`e${i}`} className="text-destructive">• {e}</div>
                ))}
                {validation.warnings.map((w, i) => (
                  <div key={`w${i}`} className="text-muted-foreground">• {w}</div>
                ))}
              </div>
            )}

            <Accordion type="multiple" defaultValue={KV_SECTION_ORDER as string[]} className="w-full">
              {KV_SECTION_ORDER.map((key) => (
                <AccordionItem key={key} value={key}>
                  <AccordionTrigger className="text-sm font-medium">
                    {KV_SECTION_LABELS[key]}
                  </AccordionTrigger>
                  <AccordionContent>
                    <Textarea
                      rows={4}
                      value={documentation[key] ?? ""}
                      onChange={(e) => updateSection(key, e.target.value)}
                      className="text-sm"
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="pt-3 space-y-2">
              <Label className="text-sm font-medium">Nächste Schritte (offene Aufgaben)</Label>
              <Textarea
                rows={4}
                value={(documentation.naechste_schritte ?? []).join("\n")}
                onChange={(e) =>
                  updateSection(
                    "naechste_schritte",
                    e.target.value.split("\n").map((l) => l.replace(/^[-•]\s*/, "")),
                  )
                }
                placeholder="Eine Aufgabe pro Zeile (max. 5)"
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
