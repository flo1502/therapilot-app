import { useEffect, useMemo, useState } from "react";
import { Slide } from "@/lib/db";
import { TEMPLATES } from "@/lib/templates";
import { TREATMENT_STEPS, getTreatmentStep } from "@/lib/treatmentSteps";
import { callAi, SuggestedSlides, SuggestedSlideRef, GeneratedStageSlides } from "@/lib/ai/provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Presentation, ChevronLeft, ChevronRight, X, FileText, Layers, Search, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { getCurriculum, getStageConfig } from "@/lib/curriculum-database";
import {
  filterTemplatesByGuardrails,
  validateAIOutput,
  personalizeSlides,
  formatValidationReport,
} from "@/lib/guardrails";
import type { CurriculumSlide, CurriculumTemplate, PatientInfo, ValidationResult } from "@/lib/curriculumTypes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  patientId: string;
  approach?: string;
  goals?: string;
  notesExcerpt?: string;
}

interface ResolvedSlide {
  key: string;
  source: "template" | "deck" | "ai-stage";
  sourceLabel: string;
  slide: Slide;
  reason?: string;
}

// Adapter: TEMPLATES (UI) → CurriculumTemplate (für Guardrail-Filter)
function toCurriculumTemplate(t: typeof TEMPLATES[number]): CurriculumTemplate {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    approach: t.approach,
    category: t.category,
    tags: t.tags,
    slides: t.slides.map((s) => ({
      title: s.title,
      bullets: s.bullets,
      speaker_notes: s.notes,
    })),
  };
}

// AI-generierte CurriculumSlides → ResolvedSlide für UI
function curriculumSlideToResolved(s: CurriculumSlide, idx: number): ResolvedSlide {
  const bullets = [...s.bullets];
  if (s.example) bullets.push(`Beispiel: ${s.example}`);
  return {
    key: `ai-stage:${idx}`,
    source: "ai-stage",
    sourceLabel: "AI · Curriculum-Folie",
    slide: {
      id: `ai-stage-${idx}`,
      title: s.title,
      bullets,
      notes: s.speaker_notes,
    },
  };
}

export function SessionSlidesPanel({ patientId, approach, goals, notesExcerpt }: Props) {
  const patient = useLiveQuery(() => patientId ? db.patients.get(patientId) : Promise.resolve(undefined), [patientId]);

  const curriculum = useMemo(
    () => patient?.curriculumDiagnose ? getCurriculum(patient.curriculumDiagnose) : undefined,
    [patient?.curriculumDiagnose]
  );

  // Stadium-State: bei Curriculum → Stadium-Nummer; sonst → alter TREATMENT_STEPS-Modus
  const [stadiumNum, setStadiumNum] = useState<number>(1);
  const [stepId, setStepId] = useState<string>(TREATMENT_STEPS[0].id);

  const stageConfig = useMemo(
    () => curriculum ? getStageConfig(curriculum.diagnose, stadiumNum) : undefined,
    [curriculum, stadiumNum]
  );

  const fallbackStep = useMemo(() => getTreatmentStep(stepId)!, [stepId]);

  const [aiBusy, setAiBusy] = useState(false);
  const [aiPicks, setAiPicks] = useState<SuggestedSlideRef[] | null>(null);
  const [aiStageSlides, setAiStageSlides] = useState<CurriculumSlide[] | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [presentIndex, setPresentIndex] = useState<number | null>(null);
  const [searchQ, setSearchQ] = useState("");

  // Patient-Info für Guardrails/AI
  const patientInfo: PatientInfo = useMemo(() => ({
    name: patient?.id ?? patientId,
    alter: patient?.ageGroup ? parseInt(patient.ageGroup) || undefined : undefined,
    beruf: patient?.beruf,
    triggers: patient?.triggers,
    hauptsymptome: patient?.hauptsymptome,
    hauptangst_gedanken: patient?.hauptangstGedanken,
    vermeidungs_verhalten: patient?.vermeidungsVerhalten,
    ressourcen: patient?.ressourcen,
    ziele: patient?.goals ? [patient.goals] : undefined,
    lernstil: patient?.lernstil,
  }), [patient, patientId]);

  const libraryTemplates = useMemo(
    () => TEMPLATES.filter((template) => !template.id.startsWith("behandlung-")),
    []
  );

  // Mit Guardrails gefilterte Templates (nur wenn Curriculum aktiv)
  const filteredTemplates = useMemo(() => {
    if (!stageConfig) return libraryTemplates;
    const curriculumTemplates = libraryTemplates.map(toCurriculumTemplate);
    const passed = filterTemplatesByGuardrails(curriculumTemplates, stageConfig, patientInfo);
    const passedIds = new Set(passed.map((t) => t.id));
    return libraryTemplates.filter((t) => passedIds.has(t.id));
  }, [libraryTemplates, stageConfig, patientInfo]);

  // Schritt-spezifische Templates: nach Stadium-Themen oder TREATMENT_STEPS
  const stepTemplates = useMemo(() => {
    const keywords = (
      stageConfig
        ? [stageConfig.name, ...stageConfig.folienthemen, ...(stageConfig.lernziele ?? [])]
        : [fallbackStep.label, fallbackStep.description, approach, ...fallbackStep.tags]
    )
      .filter(Boolean)
      .flatMap((value) => String(value).toLowerCase().split(/[^\p{L}\p{N}]+/u))
      .filter((value) => value.length >= 4);

    return filteredTemplates
      .map((template) => {
        const haystack = [
          template.title,
          template.description,
          template.approach,
          template.category,
          ...template.tags,
          ...template.slides.flatMap((slide) => [slide.title, ...slide.bullets]),
        ].join(" ").toLowerCase();

        const score = keywords.reduce((sum, keyword) => {
          if (!haystack.includes(keyword)) return sum;
          const strongMatch =
            template.title.toLowerCase().includes(keyword) ||
            template.tags.some((tag) => tag.toLowerCase().includes(keyword));
          return sum + (strongMatch ? 3 : 1);
        }, 0) + (approach && template.approach.toLowerCase() === approach.toLowerCase() ? 4 : 0);

        return { template, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || b.template.slides.length - a.template.slides.length)
      .map(({ template }) => template);
  }, [approach, filteredTemplates, fallbackStep, stageConfig]);

  // Reset AI bei Stadium-Wechsel
  useEffect(() => { setAiPicks(null); setAiStageSlides(null); setValidation(null); }, [stadiumNum, stepId, patientId]);

  const defaultSlides = useMemo<ResolvedSlide[]>(() => {
    const out: ResolvedSlide[] = [];
    stepTemplates.slice(0, 3).forEach((t) => {
      t.slides.slice(0, Math.min(t.slides.length, 4)).forEach((s, idx) => {
        out.push({
          key: `t:${t.id}:${idx}`,
          source: "template",
          sourceLabel: `Template · ${t.title}`,
          slide: { id: `${t.id}-${idx}`, title: s.title, bullets: s.bullets, notes: s.notes },
        });
      });
    });
    return out.slice(0, 8);
  }, [stepTemplates]);

  const aiResolved = useMemo<ResolvedSlide[]>(() => {
    if (!aiPicks) return [];
    const out: ResolvedSlide[] = [];
    aiPicks.forEach((p, i) => {
      if (p.source !== "template") return;
      const t = TEMPLATES.find((x) => x.id === p.sourceId);
      const s = t?.slides[p.slideIndex];
      if (t && s) out.push({
        key: `ai-t:${i}`,
        source: "template",
        sourceLabel: `Template · ${t.title}`,
        slide: { id: `${t.id}-${p.slideIndex}`, title: s.title, bullets: s.bullets, notes: s.notes },
        reason: p.reason,
      });
    });
    return out;
  }, [aiPicks]);

  const aiStageResolved = useMemo<ResolvedSlide[]>(() => {
    if (!aiStageSlides) return [];
    return aiStageSlides.map(curriculumSlideToResolved);
  }, [aiStageSlides]);

  const searchResults = useMemo<ResolvedSlide[]>(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return [];
    const ranked: Array<{ slide: ResolvedSlide; score: number }> = [];
    libraryTemplates.forEach((t) => {
      const tplMatch = [t.title, t.description, t.approach, t.category, ...t.tags].join(" ").toLowerCase().includes(q);
      t.slides.forEach((s, idx) => {
        const slideTitle = s.title.toLowerCase();
        const slideBody = s.bullets.join(" ").toLowerCase();
        const slideMatch = [slideTitle, slideBody].join(" ").includes(q);
        if (tplMatch || slideMatch) {
          const score =
            (t.title.toLowerCase() === q ? 20 : 0) +
            (t.title.toLowerCase().includes(q) ? 12 : 0) +
            (slideTitle.includes(q) ? 10 : 0) +
            (tplMatch ? 6 : 0) +
            (slideBody.includes(q) ? 4 : 0) +
            Math.min(t.slides.length, 10) / 10;

          ranked.push({
            score,
            slide: {
              key: `s-t:${t.id}:${idx}`,
              source: "template",
              sourceLabel: `Template · ${t.title}`,
              slide: { id: `${t.id}-${idx}`, title: s.title, bullets: s.bullets, notes: s.notes },
            },
          });
        }
      });
    });
    return ranked.sort((a, b) => b.score - a.score).map(({ slide }) => slide).slice(0, 20);
  }, [libraryTemplates, searchQ]);

  const visibleSlides = searchQ.trim()
    ? searchResults
    : aiStageResolved.length > 0
      ? aiStageResolved
      : aiResolved.length > 0
        ? aiResolved
        : defaultSlides;

  const askAi = async () => {
    setAiBusy(true);
    try {
      // Curriculum-Modus: generate-stage-slides
      if (curriculum && stageConfig) {
        let attempts = 0;
        let result: GeneratedStageSlides | null = null;
        let lastValidation: ValidationResult | null = null;

        while (attempts < 2) {
          attempts++;
          result = await callAi<GeneratedStageSlides>({
            task: "generate-stage-slides",
            patientPseudonym: patientId,
            payload: {
              curriculum,
              stageConfig,
              patientInfo,
              sessionNotes: notesExcerpt,
              previousErrors: lastValidation?.errors.map((e) => e.message),
            },
          });

          if (!result?.slides?.length) throw new Error("Keine Folien erhalten.");

          // Personalisierungs-Fallback
          const personalized = personalizeSlides(result.slides, patientInfo);
          // Validieren
          lastValidation = validateAIOutput(personalized, stageConfig, patientInfo);

          if (lastValidation.valid || attempts >= 2) {
            setAiStageSlides(personalized);
            setValidation(lastValidation);
            if (lastValidation.valid) {
              toast.success(`Curriculum-Folien generiert (Score: ${lastValidation.score}/100)`);
            } else {
              toast.warning(`Folien generiert mit ${lastValidation.errors.length} Hinweisen (Score: ${lastValidation.score}/100)`);
            }
            return;
          }
        }
      } else {
        // Klassischer Modus: suggest-slides aus Library
        const candidates: any[] = [];
        libraryTemplates.forEach((t) => {
          t.slides.forEach((s, idx) => {
            candidates.push({ source: "template", sourceId: t.id, slideIndex: idx, title: s.title, bullets: s.bullets.slice(0, 3) });
          });
        });

        const res = await callAi<SuggestedSlides>({
          task: "suggest-slides",
          patientPseudonym: patientId,
          payload: {
            stepLabel: fallbackStep.label,
            stepDescription: fallbackStep.description,
            approach,
            goals,
            notesExcerpt,
            candidates,
          },
        });
        if (!res.suggestions?.length) throw new Error("Keine Vorschläge erhalten.");
        setAiPicks(res.suggestions.slice(0, 3));
        toast.success("AI-Vorschläge bereit.");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "AI-Fehler");
    } finally {
      setAiBusy(false);
    }
  };

  const present = visibleSlides[presentIndex ?? 0];

  const scoreColor = validation
    ? validation.score >= 80 ? "bg-primary text-primary-foreground"
      : validation.score >= 50 ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
      : "bg-destructive/20 text-destructive"
    : "";

  return (
    <>
      <Card><CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          <h3 className="font-display text-base">
            {curriculum ? `Curriculum: ${curriculum.diagnose}` : "Folien zum Behandlungsschritt"}
          </h3>
        </div>

        {curriculum && stageConfig ? (
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Stadium ({curriculum.stadien.length} verfügbar)
            </Label>
            <Select value={String(stadiumNum)} onValueChange={(v) => setStadiumNum(parseInt(v, 10))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {curriculum.stadien.map((s) => (
                  <SelectItem key={s.stadium} value={String(s.stadium)}>
                    Stadium {s.stadium} · {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1.5">
              Sitzungen {stageConfig.sitzungen} · {stageConfig.tone}
            </p>
          </div>
        ) : (
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Aktueller Schritt</Label>
            <Select value={stepId} onValueChange={setStepId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TREATMENT_STEPS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1.5">{fallbackStep.description}</p>
            {!patient?.curriculumDiagnose && patientId && (
              <p className="text-[11px] text-muted-foreground mt-1 italic">
                Tipp: Setze eine Curriculum-Diagnose im Patient-Profil für leitliniengerechte Folien.
              </p>
            )}
          </div>
        )}

        <div className="relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 pr-8"
            placeholder="Alle Templates & Folien durchsuchen…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          {searchQ && (
            <button
              onClick={() => setSearchQ("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Suche leeren"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <Button onClick={askAi} disabled={aiBusy || !patientId || !!searchQ.trim()} variant="outline" size="sm" className="w-full">
          <Sparkles className="size-4 mr-2" />
          {aiBusy
            ? "AI generiert…"
            : curriculum
              ? `AI: Stadium-${stadiumNum}-Folien generieren`
              : "AI-Vorschlag (basierend auf Notiz)"}
        </Button>

        {validation && aiStageSlides && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs cursor-help ${scoreColor}`}>
                  {validation.valid ? <ShieldCheck className="size-4" /> : <AlertTriangle className="size-4" />}
                  <span className="font-medium">Quality Score: {validation.score}/100</span>
                  <span className="ml-auto opacity-70">
                    {validation.errors.length} Fehler · {validation.warnings.length} Warnungen
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-md whitespace-pre-wrap text-xs">
                {formatValidationReport(validation)}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {visibleSlides.length === 0 ? (
          <div className="text-sm text-muted-foreground italic py-4 text-center">
            {searchQ.trim() ? "Keine Treffer für deine Suche." : "Keine passenden Folien gefunden."}
          </div>
        ) : (
          <div className="space-y-2">
            {visibleSlides.map((rs, i) => (
              <button
                key={rs.key}
                onClick={() => setPresentIndex(i)}
                className="w-full text-left p-3 rounded-md border border-border hover:border-primary hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-display text-sm text-foreground">{rs.slide.title}</span>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {rs.source === "deck" ? "Patient" : rs.source === "ai-stage" ? "AI" : "Template"}
                  </Badge>
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc pl-4">
                  {rs.slide.bullets.slice(0, 3).map((b, j) => <li key={j} className="line-clamp-1">{b}</li>)}
                </ul>
                {rs.reason && <p className="text-[11px] text-primary/80 mt-1.5 italic">→ {rs.reason}</p>}
                <div className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <FileText className="size-3" />{rs.sourceLabel}
                </div>
              </button>
            ))}
          </div>
        )}

        {visibleSlides.length > 0 && (
          <Button onClick={() => setPresentIndex(0)} className="w-full" size="sm">
            <Presentation className="size-4 mr-2" />Für Patient:in präsentieren
          </Button>
        )}
      </CardContent></Card>

      {present && presentIndex !== null && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
          <div className="flex justify-between items-center p-4 border-b">
            <div className="text-sm text-muted-foreground font-display">{present.sourceLabel}</div>
            <div className="text-xs text-muted-foreground">{presentIndex + 1} / {visibleSlides.length}</div>
            <Button size="icon" variant="ghost" onClick={() => setPresentIndex(null)}><X className="size-5" /></Button>
          </div>

          <div className="flex-1 flex items-center justify-center p-8 md:p-16 overflow-auto">
            <div className="max-w-4xl w-full">
              <h1 className="text-4xl md:text-6xl font-display mb-10 text-primary">{present.slide.title}</h1>
              <ul className="space-y-5 text-xl md:text-2xl leading-relaxed">
                {present.slide.bullets.map((b, j) => (
                  <li key={j} className="flex gap-4">
                    <span className="text-accent shrink-0">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex justify-between items-center p-4 border-t">
            <Button
              variant="outline"
              onClick={() => setPresentIndex((p) => Math.max((p ?? 0) - 1, 0))}
              disabled={presentIndex === 0}
            >
              <ChevronLeft className="size-4 mr-1" />Zurück
            </Button>
            <div className="text-xs text-muted-foreground hidden md:block">
              {curriculum && stageConfig ? `${curriculum.diagnose} · Stadium ${stadiumNum}` : fallbackStep.label}
            </div>
            <Button
              onClick={() => setPresentIndex((p) => Math.min((p ?? 0) + 1, visibleSlides.length - 1))}
              disabled={presentIndex === visibleSlides.length - 1}
            >
              Weiter<ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
