import { useParams, Link } from "react-router-dom";
import { getTemplate } from "@/lib/templates";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { SlideRenderer } from "@/components/SlideRenderer";
import { uid, type Slide } from "@/lib/db";

const LAYOUT_LABEL: Record<string, string> = {
  headline: "Hauptbotschaft",
  model: "Modell",
  "vicious-cycle": "Teufelskreis",
  "before-after": "Vorher / Nachher",
  steps: "Schritte",
  question: "Reflexionsfrage",
  bullets: "Stichpunkte",
};

export default function TemplateDetail() {
  const { id } = useParams();
  const t = getTemplate(id || "");
  if (!t) return <div>Template nicht gefunden.</div>;

  return (
    <>
      <PageHeader
        title={t.title}
        description={`${t.approach} · ${t.description}`}
        actions={
          <Button asChild>
            <Link to={`/slides/neu?template=${t.id}`}>
              <Sparkles className="size-4 mr-2" />
              Personalisieren
            </Link>
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-5">
        {t.slides.map((s, i) => {
          const slide: Slide = {
            id: uid("tpl_"),
            title: s.title,
            bullets: s.bullets,
            notes: s.notes,
            layout: s.layout,
            iconKey: s.iconKey,
            layoutData: s.layoutData,
          };
          const layoutKey = s.layout ?? "bullets";
          return (
            <Card key={i} className="overflow-hidden">
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-muted/30">
                <div className="text-xs text-muted-foreground">Slide {i + 1} / {t.slides.length}</div>
                <Badge variant="outline" className="text-xs">{LAYOUT_LABEL[layoutKey] ?? layoutKey}</Badge>
              </div>
              <CardContent className="p-6">
                <SlideRenderer slide={slide} variant="preview" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
