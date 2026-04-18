import { useLiveQuery } from "dexie-react-hooks";
import { db, Slide, uid } from "@/lib/db";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Plus, Trash2, Play, FileDown, ChevronUp, ChevronDown, Presentation } from "lucide-react";
import jsPDF from "jspdf";
import { exportDeckAsPPTX } from "@/lib/pptxExport";

export default function SlideEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const deck = useLiveQuery(() => (id ? db.decks.get(id) : undefined), [id]);
  const [draft, setDraft] = useState<typeof deck>(undefined);

  useEffect(() => { if (deck) setDraft(deck); }, [deck]);

  if (!draft) return <div className="text-sm text-muted-foreground">Lade…</div>;

  const update = (patch: Partial<NonNullable<typeof draft>>) => setDraft({ ...draft, ...patch } as any);
  const updSlide = (i: number, patch: Partial<Slide>) => {
    const slides = [...draft.slides];
    slides[i] = { ...slides[i], ...patch };
    update({ slides });
  };
  const addSlide = () => update({ slides: [...draft.slides, { id: uid("sl_"), title: "Neuer Slide", bullets: [""] }] });
  const delSlide = (i: number) => update({ slides: draft.slides.filter((_, j) => j !== i) });
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= draft.slides.length) return;
    const slides = [...draft.slides];
    [slides[i], slides[j]] = [slides[j], slides[i]];
    update({ slides });
  };

  const save = async () => {
    await db.decks.put({ ...draft, updatedAt: Date.now() });
    toast.success("Gespeichert.");
  };

  const exportPdf = () => {
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [960, 540] });
    draft.slides.forEach((s, i) => {
      if (i > 0) pdf.addPage([960, 540], "landscape");
      pdf.setFillColor(248, 245, 238);
      pdf.rect(0, 0, 960, 540, "F");
      pdf.setTextColor(40, 60, 50);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(28);
      pdf.text(s.title, 60, 90, { maxWidth: 840 });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(16);
      let y = 160;
      s.bullets.forEach(b => {
        const lines = pdf.splitTextToSize("• " + b, 820);
        pdf.text(lines, 80, y);
        y += lines.length * 22 + 8;
      });
      pdf.setFontSize(10);
      pdf.setTextColor(120, 120, 120);
      pdf.text(`${draft.title} · ${i + 1}/${draft.slides.length}`, 60, 510);
    });
    pdf.save(`${draft.title.replace(/[^a-z0-9]+/gi, "_")}.pdf`);
  };

  return (
    <>
      <PageHeader title={draft.title} description={draft.patientId ? `Personalisiert für ${draft.patientId}` : "Allgemeines Deck"}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={exportPdf}><FileDown className="size-4 mr-2" />PDF</Button>
            <Button variant="outline" onClick={async () => {
              try { await exportDeckAsPPTX(draft); toast.success("PowerPoint heruntergeladen."); }
              catch (e: any) { toast.error(e?.message ?? "Export fehlgeschlagen"); }
            }}><Presentation className="size-4 mr-2" />PowerPoint</Button>
            <Button variant="outline" asChild><Link to={`/slides/${draft.id}/praesentieren`}><Play className="size-4 mr-2" />Präsentieren</Link></Button>
            <Button onClick={save}><Save className="size-4 mr-2" />Speichern</Button>
          </div>
        } />

      <Card className="mb-4"><CardContent className="p-5">
        <Input value={draft.title} onChange={e => update({ title: e.target.value })} className="text-lg font-display" />
      </CardContent></Card>

      <div className="grid gap-4">
        {draft.slides.map((s, i) => (
          <Card key={s.id}><CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Slide {i + 1}</span>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}><ChevronUp className="size-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === draft.slides.length - 1}><ChevronDown className="size-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => delSlide(i)}><Trash2 className="size-4" /></Button>
              </div>
            </div>
            <Input value={s.title} onChange={e => updSlide(i, { title: e.target.value })} className="font-display mb-3" />
            <Textarea
              rows={Math.max(3, s.bullets.length)}
              value={s.bullets.join("\n")}
              onChange={e => updSlide(i, { bullets: e.target.value.split("\n").filter(b => b !== undefined) })}
              placeholder="Ein Bullet pro Zeile"
            />
            <Textarea
              rows={2}
              className="mt-2"
              placeholder="Sprechernotizen (für Sie, nicht angezeigt)"
              value={s.notes ?? ""}
              onChange={e => updSlide(i, { notes: e.target.value })}
            />
          </CardContent></Card>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" onClick={addSlide}><Plus className="size-4 mr-2" />Slide hinzufügen</Button>
        <Button variant="outline" onClick={async () => { if (confirm("Deck löschen?")) { await db.decks.delete(draft.id); nav("/slides"); } }}>
          <Trash2 className="size-4 mr-2" />Deck löschen
        </Button>
      </div>
    </>
  );
}
