import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Slide } from "@/lib/db";
import { TEMPLATES } from "@/lib/templates";
import { TREATMENT_STEPS, getTreatmentStep } from "@/lib/treatmentSteps";
import { callAi, SuggestedSlides, SuggestedSlideRef } from "@/lib/ai/provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Presentation, ChevronLeft, ChevronRight, X, FileText, Layers, Search } from "lucide-react";
import { toast } from "sonner";

interface Props {
  patientId: string;
  approach?: string;
  goals?: string;
  notesExcerpt?: string;
}

interface ResolvedSlide {
  key: string;
  source: "template" | "deck";
  sourceLabel: string;
  slide: Slide;
  reason?: string;
}

export function SessionSlidesPanel({ patientId, approach, goals, notesExcerpt }: Props) {
  const [stepId, setStepId] = useState<string>(TREATMENT_STEPS[0].id);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiPicks, setAiPicks] = useState<SuggestedSlideRef[] | null>(null);
  const [presentIndex, setPresentIndex] = useState<number | null>(null);
  const [searchQ, setSearchQ] = useState("");

  const patientDecks = useLiveQuery(
    () => (patientId ? db.decks.where("patientId").equals(patientId).toArray() : Promise.resolve([])),
    [patientId],
  );

  const step = getTreatmentStep(stepId)!;

  // Reset AI suggestions when step changes
  useEffect(() => { setAiPicks(null); }, [stepId]);

  const defaultSlides = useMemo<ResolvedSlide[]>(() => {
    const out: ResolvedSlide[] = [];
    // Aus Patienten-Decks: erste Folie passender Decks (per Tag-Match)
    (patientDecks ?? []).forEach(d => {
      const matches = step.tags.some(t => d.title.toLowerCase().includes(t.toLowerCase()) || d.topic?.toLowerCase().includes(t.toLowerCase()));
      if (matches && d.slides[0]) {
        out.push({
          key: `d:${d.id}:0`,
          source: "deck",
          sourceLabel: `Patient · ${d.title}`,
          slide: d.slides[0],
        });
      }
    });
    // Aus Templates
    step.templateIds.forEach(tid => {
      const t = TEMPLATES.find(x => x.id === tid);
      if (!t) return;
      // erste 1-2 Slides je Template
      t.slides.slice(0, 2).forEach((s, idx) => {
        out.push({
          key: `t:${t.id}:${idx}`,
          source: "template",
          sourceLabel: `Template · ${t.title}`,
          slide: { id: `${t.id}-${idx}`, title: s.title, bullets: s.bullets, notes: s.notes },
        });
      });
    });
    return out.slice(0, 3);
  }, [step, patientDecks]);

  const aiResolved = useMemo<ResolvedSlide[]>(() => {
    if (!aiPicks) return [];
    const out: ResolvedSlide[] = [];
    aiPicks.forEach((p, i) => {
      if (p.source === "template") {
        const t = TEMPLATES.find(x => x.id === p.sourceId);
        const s = t?.slides[p.slideIndex];
        if (t && s) out.push({
          key: `ai-t:${i}`,
          source: "template",
          sourceLabel: `Template · ${t.title}`,
          slide: { id: `${t.id}-${p.slideIndex}`, title: s.title, bullets: s.bullets, notes: s.notes },
          reason: p.reason,
        });
      } else {
        const d = (patientDecks ?? []).find(x => x.id === p.sourceId);
        const s = d?.slides[p.slideIndex];
        if (d && s) out.push({
          key: `ai-d:${i}`,
          source: "deck",
          sourceLabel: `Patient · ${d.title}`,
          slide: s,
          reason: p.reason,
        });
      }
    });
    return out;
  }, [aiPicks, patientDecks]);

  const searchResults = useMemo<ResolvedSlide[]>(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return [];
    const out: ResolvedSlide[] = [];
    TEMPLATES.forEach(t => {
      const tplMatch = [t.title, t.description, t.approach, t.category, ...t.tags].join(" ").toLowerCase().includes(q);
      t.slides.forEach((s, idx) => {
        const slideMatch = [s.title, ...s.bullets].join(" ").toLowerCase().includes(q);
        if (tplMatch || slideMatch) {
          out.push({
            key: `s-t:${t.id}:${idx}`,
            source: "template",
            sourceLabel: `Template · ${t.title}`,
            slide: { id: `${t.id}-${idx}`, title: s.title, bullets: s.bullets, notes: s.notes },
          });
        }
      });
    });
    (patientDecks ?? []).forEach(d => {
      d.slides.forEach((s, idx) => {
        const m = [d.title, s.title, ...s.bullets].join(" ").toLowerCase().includes(q);
        if (m) {
          out.push({
            key: `s-d:${d.id}:${idx}`,
            source: "deck",
            sourceLabel: `Patient · ${d.title}`,
            slide: s,
          });
        }
      });
    });
    return out.slice(0, 20);
  }, [searchQ, patientDecks]);

  const visibleSlides = searchQ.trim()
    ? searchResults
    : aiResolved.length > 0 ? aiResolved : defaultSlides;

  const askAi = async () => {
    setAiBusy(true);
    try {
      // Kandidaten zusammenstellen (kompakt, ohne sensible Daten)
      const candidates: any[] = [];
      step.templateIds.forEach(tid => {
        const t = TEMPLATES.find(x => x.id === tid);
        if (!t) return;
        t.slides.forEach((s, idx) => {
          candidates.push({ source: "template", sourceId: t.id, slideIndex: idx, title: s.title, bullets: s.bullets.slice(0, 3) });
        });
      });
      (patientDecks ?? []).forEach(d => {
        d.slides.forEach((s, idx) => {
          candidates.push({ source: "deck", sourceId: d.id, slideIndex: idx, title: s.title, bullets: s.bullets.slice(0, 3) });
        });
      });

      const res = await callAi<SuggestedSlides>({
        task: "suggest-slides",
        patientPseudonym: patientId,
        payload: {
          stepLabel: step.label,
          stepDescription: step.description,
          approach,
          goals,
          notesExcerpt,
          candidates,
        },
      });
      if (!res.suggestions?.length) throw new Error("Keine Vorschläge erhalten.");
      setAiPicks(res.suggestions.slice(0, 3));
      toast.success("AI-Vorschläge bereit.");
    } catch (e: any) {
      toast.error(e?.message ?? "AI-Fehler");
    } finally {
      setAiBusy(false);
    }
  };

  const present = visibleSlides[presentIndex ?? 0];

  return (
    <>
      <Card><CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          <h3 className="font-display text-base">Folien zum Behandlungsschritt</h3>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Aktueller Schritt</Label>
          <Select value={stepId} onValueChange={setStepId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TREATMENT_STEPS.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1.5">{step.description}</p>
        </div>

        <Button onClick={askAi} disabled={aiBusy || !patientId} variant="outline" size="sm" className="w-full">
          <Sparkles className="size-4 mr-2" />
          {aiBusy ? "AI sucht passende Folien…" : "AI-Vorschlag (basierend auf Notiz)"}
        </Button>

        {visibleSlides.length === 0 ? (
          <div className="text-sm text-muted-foreground italic py-4 text-center">
            Keine passenden Folien gefunden.
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
                    {rs.source === "deck" ? "Patient" : "Template"}
                  </Badge>
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc pl-4">
                  {rs.slide.bullets.slice(0, 3).map((b, j) => <li key={j} className="line-clamp-1">{b}</li>)}
                </ul>
                {rs.reason && (
                  <p className="text-[11px] text-primary/80 mt-1.5 italic">→ {rs.reason}</p>
                )}
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
              onClick={() => setPresentIndex(p => Math.max((p ?? 0) - 1, 0))}
              disabled={presentIndex === 0}
            >
              <ChevronLeft className="size-4 mr-1" />Zurück
            </Button>
            <div className="text-xs text-muted-foreground hidden md:block">
              {step.label}
            </div>
            <Button
              onClick={() => setPresentIndex(p => Math.min((p ?? 0) + 1, visibleSlides.length - 1))}
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
