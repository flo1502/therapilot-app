import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db, uid } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { TEMPLATES, getTemplate } from "@/lib/templates";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { callAi, GeneratedDeck } from "@/lib/ai/provider";
import { Sparkles } from "lucide-react";

export default function SlideNew() {
  const [search] = useSearchParams();
  const nav = useNavigate();
  const patients = useLiveQuery(() => db.patients.toArray(), []);

  const [templateId, setTemplateId] = useState(search.get("template") ?? "");
  const [patientId, setPatientId] = useState(search.get("patient") ?? "");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = getTemplate(templateId);
    if (t && !topic) setTopic(t.title);
  }, [templateId]);

  const generate = async () => {
    if (!topic.trim()) { toast.error("Thema angeben."); return; }
    const patient = patients?.find(p => p.id === patientId);
    const tpl = getTemplate(templateId);
    setBusy(true);
    try {
      const deck = await callAi<GeneratedDeck>({
        task: "personalize-slides",
        patientPseudonym: patientId || undefined,
        payload: {
          topic,
          approach: patient?.approach ?? tpl?.approach,
          ageGroup: patient?.ageGroup,
          goals: patient?.goals,
          diagnoses: patient?.diagnoses,
          slideCount: tpl?.slides.length ?? 6,
          templateOutline: tpl?.slides.map(s => ({ title: s.title, bullets: s.bullets })),
        },
      });
      const id = uid("d_");
      await db.decks.put({
        id,
        patientId: patientId || undefined,
        templateId: templateId || undefined,
        title: deck.title || topic,
        topic,
        slides: deck.slides.map(s => ({
          id: uid("sl_"),
          title: s.title,
          bullets: s.bullets ?? [],
          notes: s.notes,
          layout: s.layout,
          iconKey: s.iconKey,
          layoutData: {
            headline: s.headline,
            subline: s.subline,
            nodes: s.nodes,
            centerLabel: s.centerLabel,
            cycleNodes: s.cycleNodes,
            before: s.before,
            after: s.after,
            steps: s.steps,
          },
        })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      toast.success("Slide-Deck erstellt.");
      nav(`/slides/${id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "AI-Fehler");
    } finally {
      setBusy(false);
    }
  };

  const createBlank = async () => {
    const tpl = getTemplate(templateId);
    const id = uid("d_");
    await db.decks.put({
      id,
      patientId: patientId || undefined,
      templateId: templateId || undefined,
      title: tpl?.title ?? topic ?? "Neues Deck",
      topic: topic || tpl?.title || "",
      slides: (tpl?.slides ?? [{ title: "Neuer Slide", bullets: [""] }]).map(s => ({
        id: uid("sl_"),
        title: s.title,
        bullets: [...s.bullets],
        notes: s.notes,
        layout: s.layout,
        iconKey: s.iconKey,
        layoutData: s.layoutData ? { ...s.layoutData } : undefined,
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    nav(`/slides/${id}`);
  };

  return (
    <>
      <PageHeader title="Neues Slide-Deck"
        description="Wählen Sie eine Template-Basis und personalisieren Sie automatisch oder leer." />

      <Card><CardContent className="p-6 space-y-5 max-w-2xl">
        <div>
          <Label>Template (optional)</Label>
          <Select value={templateId || "_none"} onValueChange={v => setTemplateId(v === "_none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Ohne Template" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">— Ohne Template —</SelectItem>
              {TEMPLATES.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Patient:in (optional, für Personalisierung)</Label>
          <Select value={patientId || "_none"} onValueChange={v => setPatientId(v === "_none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Allgemein" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">— Allgemein —</SelectItem>
              {patients?.map(p => <SelectItem key={p.id} value={p.id}>{p.id} · {p.approach}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Thema</Label>
          <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="z.B. Umgang mit Panikattacken" />
        </div>
        <div className="flex gap-3 pt-2">
          <Button onClick={generate} disabled={busy} className="flex-1">
            <Sparkles className="size-4 mr-2" />
            {busy ? "Generiere…" : "Mit AI personalisieren"}
          </Button>
          <Button onClick={createBlank} variant="outline" className="flex-1">Leer aus Template</Button>
        </div>
      </CardContent></Card>
    </>
  );
}
