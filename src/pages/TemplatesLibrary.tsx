import { useState } from "react";
import { TEMPLATES } from "@/lib/templates";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";

export default function TemplatesLibrary() {
  const [q, setQ] = useState("");
  const filtered = TEMPLATES.filter(t =>
    [t.title, t.description, t.approach, ...t.tags].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Template-Bibliothek"
        description="Vorgefertigte Slidedecks und Arbeitsblätter. Personalisierbar pro Patient:in." />

      <div className="relative mb-6 max-w-md">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Suche nach Ansatz, Thema, Tag…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(t => (
          <Card key={t.id} className="hover:border-primary/40 transition-colors flex flex-col">
            <CardContent className="p-5 flex flex-col flex-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge variant="secondary">{t.approach}</Badge>
                <Badge variant="outline">{t.category}</Badge>
              </div>
              <h3 className="text-lg mb-1">{t.title}</h3>
              <p className="text-sm text-muted-foreground flex-1">{t.description}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {t.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
              </div>
              <div className="flex gap-2 mt-4">
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <Link to={`/templates/${t.id}`}>Vorschau</Link>
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <Link to={`/slides/neu?template=${t.id}`}>
                    <Sparkles className="size-3.5 mr-1.5" /> Personalisieren
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
