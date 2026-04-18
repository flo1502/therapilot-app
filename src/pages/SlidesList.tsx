import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function SlidesList() {
  const decks = useLiveQuery(() => db.decks.orderBy("updatedAt").reverse().toArray(), []);
  return (
    <>
      <PageHeader title="Slide-Decks" description="Ihre erstellten und personalisierten Decks."
        actions={<Button asChild><Link to="/slides/neu"><Plus className="size-4 mr-2" />Neu</Link></Button>} />
      {decks && decks.length === 0 && (
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">
          Noch keine Decks. Starten Sie aus der <Link to="/templates" className="underline">Template-Bibliothek</Link>.
        </CardContent></Card>
      )}
      <div className="grid md:grid-cols-2 gap-3">
        {decks?.map(d => (
          <Link key={d.id} to={`/slides/${d.id}`}>
            <Card className="hover:border-primary/40">
              <CardContent className="p-4">
                <div className="font-display text-lg">{d.title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {d.slides.length} Slides · {d.patientId ?? "Allgemein"} · {formatDateTime(d.updatedAt)}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
