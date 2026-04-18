import { useParams, Link } from "react-router-dom";
import { getTemplate } from "@/lib/templates";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function TemplateDetail() {
  const { id } = useParams();
  const t = getTemplate(id || "");
  if (!t) return <div>Template nicht gefunden.</div>;
  return (
    <>
      <PageHeader title={t.title} description={`${t.approach} · ${t.description}`}
        actions={<Button asChild><Link to={`/slides/neu?template=${t.id}`}><Sparkles className="size-4 mr-2" />Personalisieren</Link></Button>} />
      <div className="grid md:grid-cols-2 gap-4">
        {t.slides.map((s, i) => (
          <Card key={i}><CardContent className="p-5">
            <div className="text-xs text-muted-foreground mb-2">Slide {i + 1}</div>
            <h3 className="text-lg mb-3">{s.title}</h3>
            <ul className="space-y-1.5 text-sm">
              {s.bullets.map((b, j) => <li key={j} className="flex gap-2"><span className="text-primary">•</span><span>{b}</span></li>)}
            </ul>
          </CardContent></Card>
        ))}
      </div>
    </>
  );
}
