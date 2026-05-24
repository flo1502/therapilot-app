import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sparkles, RefreshCw, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { callAi } from "@/lib/ai/provider";
import type { SchemaAnalysisResult, SchemaGroup } from "@/lib/schemaTypes";

interface Props {
  sessionId: string;
  patientPseudonym?: string;
  transcript: string;
  analysis?: SchemaAnalysisResult;
  onAnalysisChange: (result: SchemaAnalysisResult) => void;
}

function severityClasses(count: number): { dot: string; chip: string } {
  if (count >= 3) return { dot: "bg-destructive", chip: "border-destructive/40 text-destructive" };
  if (count === 2) return { dot: "bg-amber-500", chip: "border-amber-500/40 text-amber-600 dark:text-amber-400" };
  return { dot: "bg-muted-foreground", chip: "border-muted-foreground/30 text-muted-foreground" };
}

function SchemaBubble({ group }: { group: SchemaGroup }) {
  const sev = severityClasses(group.count);
  const top = group.examples.slice(0, 2);

  return (
    <div className="flex gap-2 items-start">
      <div className={`mt-3 size-2.5 rounded-full ${sev.dot} shrink-0`} aria-hidden />
      <Card className="flex-1 rounded-2xl rounded-tl-sm bg-muted/40 border-muted shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="font-medium text-sm flex items-center gap-2">
              <span>{group.type}</span>
              <Badge variant="outline" className={sev.chip}>↑ {group.count}</Badge>
            </div>
          </div>

          {group.chat_preview && (
            <div className="text-sm text-muted-foreground mb-3 italic">{group.chat_preview}</div>
          )}

          {top.length > 0 && (
            <ul className="space-y-1.5 mb-2">
              {top.map((ex, i) => (
                <li key={i} className="text-sm leading-snug">
                  <span className="text-foreground">„{ex.trigger_sentence}"</span>
                  {ex.context && <span className="text-muted-foreground"> · {ex.context}</span>}
                </li>
              ))}
            </ul>
          )}

          {group.examples.length > 0 && (
            <Accordion type="single" collapsible>
              <AccordionItem value="details" className="border-b-0">
                <AccordionTrigger className="py-1.5 text-xs text-primary hover:no-underline">
                  Tap for details ({group.examples.length})
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <ul className="space-y-2">
                    {group.examples.map((ex, i) => (
                      <li key={i} className="text-sm border-l-2 border-muted pl-3">
                        <div className="text-foreground">„{ex.trigger_sentence}"</div>
                        {ex.context && (
                          <div className="text-xs text-muted-foreground mt-0.5">{ex.context}</div>
                        )}
                        {ex.timestamp && (
                          <div className="text-xs text-muted-foreground mt-0.5">⏱ {ex.timestamp}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function SchemaChatFeed({ sessionId, patientPseudonym, transcript, analysis, onAnalysisChange }: Props) {
  const [busy, setBusy] = useState(false);

  const analyze = async () => {
    if (!transcript.trim()) {
      toast.error("Bitte zuerst ein Transkript im KV-Verlauf-Tab erfassen.");
      return;
    }
    setBusy(true);
    try {
      const data = await callAi<{ schema_summary_chat: SchemaGroup[] }>({
        task: "cbt-schema-analysis",
        patientPseudonym,
        payload: { transcript, sessionId },
      });
      const result: SchemaAnalysisResult = {
        session_id: sessionId,
        schema_summary_chat: data.schema_summary_chat ?? [],
        generatedAt: Date.now(),
      };
      onAnalysisChange(result);
      toast.success(
        result.schema_summary_chat.length
          ? `${result.schema_summary_chat.length} Schema-Kategorien erkannt.`
          : "Keine schemarelevanten Aussagen erkannt.",
      );
    } catch (e: any) {
      toast.error(e?.message ?? "AI-Fehler");
    } finally {
      setBusy(false);
    }
  };

  const groups = analysis?.schema_summary_chat ?? [];
  const sorted = [...groups].sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="size-4 text-primary" />
            <div>
              <div className="font-medium text-sm">💬 CBT Schema Alert</div>
              <div className="text-xs text-muted-foreground">
                {analysis
                  ? `Stand: ${new Date(analysis.generatedAt).toLocaleString("de-DE")}`
                  : "Erkennt dysfunktionale Kernüberzeugungen im Transkript."}
              </div>
            </div>
          </div>
          <Button onClick={analyze} disabled={busy} size="sm">
            {analysis ? <RefreshCw className="size-4 mr-2" /> : <Sparkles className="size-4 mr-2" />}
            {busy ? "Analysiere…" : analysis ? "Erneut analysieren" : "Schemata analysieren"}
          </Button>
        </CardContent>
      </Card>

      {!transcript.trim() && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-sm text-muted-foreground text-center">
            Bitte zuerst ein Transkript im Tab <b>„KV-Verlauf"</b> einfügen.
          </CardContent>
        </Card>
      )}

      {analysis && sorted.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-sm text-muted-foreground text-center">
            Keine schemarelevanten Aussagen im Transkript erkannt.
          </CardContent>
        </Card>
      )}

      {sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((g, i) => <SchemaBubble key={i} group={g} />)}
          <div className="text-xs text-muted-foreground text-center pt-2">
            Read-only Analyse · Nur explizite Patient:innen-Aussagen werden berücksichtigt.
          </div>
        </div>
      )}
    </div>
  );
}
