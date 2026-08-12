import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { callAi } from "@/lib/ai/provider";
import {
  PsychotherapeutischerBefund,
  BEFUND_SECTION_LABELS,
  BEFUND_SECTION_ORDER,
  AMDP_FIELD_LABELS,
  PsychopathologischerBefund,
} from "@/domains/reports/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sparkles, RefreshCw, FileWarning } from "lucide-react";
import { toast } from "sonner";

interface Props {
  patientId: string;
  patientPseudonym?: string;
}

export function BefundPanel({ patientId, patientPseudonym }: Props) {
  const patient = useLiveQuery(() => db.patients.get(patientId), [patientId]);
  const sessions = useLiveQuery(
    () => db.sessions.where("patientId").equals(patientId).sortBy("date"),
    [patientId],
  );
  const [busy, setBusy] = useState(false);

  const befund = patient?.psychotherapeutischerBefund;
  const kvDocumentations = (sessions ?? []).map(s => s.kvDocumentation).filter(Boolean);
  const hasSource = Boolean(patient?.anamneseProfile) || kvDocumentations.length > 0;

  const generate = async () => {
    if (!patient) return;
    if (!hasSource) {
      toast.error("Weder Anamnese-Profil noch Stundenprotokolle vorhanden.");
      return;
    }
    setBusy(true);
    try {
      const result = await callAi<PsychotherapeutischerBefund>({
        task: "befund-generate",
        patientPseudonym: patientPseudonym ?? patientId,
        payload: {
          anamneseProfile: patient.anamneseProfile,
          kvDocumentations,
        },
      });
      await db.patients.update(patient.id, {
        psychotherapeutischerBefund: result,
        befundUpdatedAt: Date.now(),
        updatedAt: Date.now(),
      });
      toast.success("Befund erstellt.");
    } catch (e: any) {
      toast.error(e?.message ?? "Fehler bei Befund-Erstellung.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              <FileWarning className="size-4" />
              <span className="font-medium text-sm">Psychotherapeutischer Befund</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Quelle: {patient?.anamneseProfile ? "Anamnese-Profil" : "kein Anamnese-Profil"}
              {" · "}
              {kvDocumentations.length} Stundenprotokoll(e)
              {befund && patient?.befundUpdatedAt && (
                <> · Letztes Update: {new Date(patient.befundUpdatedAt).toLocaleString("de-DE")}</>
              )}
            </div>
          </div>
          <Button size="sm" onClick={generate} disabled={busy || !hasSource}>
            {befund ? (
              <RefreshCw className={`size-4 mr-2 ${busy ? "animate-spin" : ""}`} />
            ) : (
              <Sparkles className="size-4 mr-2" />
            )}
            {busy ? "Generiere…" : befund ? "Befund neu generieren" : "Befund generieren"}
          </Button>
        </CardContent>
      </Card>

      {!befund && !busy && (
        <div className="text-sm text-muted-foreground px-1">
          Noch kein Befund erstellt. Der Befund fasst das Anamnese-Profil und die vorhandenen
          Stundenprotokolle zusammen — keine Diagnose wird neu erfunden, nur formalisiert, was
          bereits dokumentiert ist.
        </div>
      )}

      {befund && (
        <Card>
          <CardContent className="p-5">
            <Accordion type="multiple" defaultValue={BEFUND_SECTION_ORDER as string[]} className="w-full">
              <AccordionItem value="anlass_der_behandlung">
                <AccordionTrigger className="text-sm font-medium">
                  {BEFUND_SECTION_LABELS.anlass_der_behandlung}
                </AccordionTrigger>
                <AccordionContent className="text-sm whitespace-pre-wrap">
                  {befund.anlass_der_behandlung || "—"}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="symptomatik">
                <AccordionTrigger className="text-sm font-medium">
                  {BEFUND_SECTION_LABELS.symptomatik}
                </AccordionTrigger>
                <AccordionContent className="text-sm whitespace-pre-wrap">
                  {befund.symptomatik || "—"}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="diagnose">
                <AccordionTrigger className="text-sm font-medium">
                  {BEFUND_SECTION_LABELS.diagnose}
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  {befund.diagnose.diagnosen.length === 0 && (
                    <div className="text-muted-foreground">Diagnostische Einschätzung steht noch aus.</div>
                  )}
                  {befund.diagnose.diagnosen.map((d, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      {d.icd10_code && <Badge variant="outline">{d.icd10_code}</Badge>}
                      <span>{d.bezeichnung}</span>
                      <Badge variant="secondary">{d.diagnosesicherheit}</Badge>
                      <Badge variant="secondary">{d.typ}</Badge>
                    </div>
                  ))}
                  {befund.diagnose.differentialdiagnosen.length > 0 && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                        Differentialdiagnosen
                      </div>
                      <ul className="list-disc list-inside">
                        {befund.diagnose.differentialdiagnosen.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    </div>
                  )}
                  {befund.diagnose.freitext_einordnung && (
                    <div className="text-muted-foreground whitespace-pre-wrap">
                      {befund.diagnose.freitext_einordnung}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="psychopathologischer_befund">
                <AccordionTrigger className="text-sm font-medium">
                  {BEFUND_SECTION_LABELS.psychopathologischer_befund}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-2">
                    {(Object.keys(AMDP_FIELD_LABELS) as (keyof PsychopathologischerBefund)[]).map((key) => (
                      <div key={key} className="grid grid-cols-[220px_1fr] gap-3 text-sm">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground pt-0.5">
                          {AMDP_FIELD_LABELS[key]}
                        </div>
                        <div>{befund.psychopathologischer_befund[key] || "—"}</div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="therapieempfehlung">
                <AccordionTrigger className="text-sm font-medium">
                  {BEFUND_SECTION_LABELS.therapieempfehlung}
                </AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <div><span className="text-muted-foreground">Verfahren:</span> {befund.therapieempfehlung.verfahren || "—"}</div>
                  <div><span className="text-muted-foreground">Setting:</span> {befund.therapieempfehlung.setting || "—"}</div>
                  <div><span className="text-muted-foreground">Frequenz:</span> {befund.therapieempfehlung.frequenz || "—"}</div>
                  <div><span className="text-muted-foreground">Stundenkontingent:</span> {befund.therapieempfehlung.stundenkontingent_empfehlung || "—"}</div>
                  <div><span className="text-muted-foreground">Prognose:</span> {befund.therapieempfehlung.prognose || "—"}</div>
                  {befund.therapieempfehlung.weitere_empfehlungen.length > 0 && (
                    <ul className="list-disc list-inside">
                      {befund.therapieempfehlung.weitere_empfehlungen.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
