import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { SlideRenderer } from "@/components/SlideRenderer";

export default function SlidePresent() {
  const { id } = useParams();
  const nav = useNavigate();
  const deck = useLiveQuery(() => (id ? db.decks.get(id) : undefined), [id]);
  const [i, setI] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!deck) return;
      if (e.key === "ArrowRight" || e.key === " ") setI(p => Math.min(p + 1, deck.slides.length - 1));
      if (e.key === "ArrowLeft") setI(p => Math.max(p - 1, 0));
      if (e.key === "Escape") nav(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deck, nav]);

  if (!deck) return null;
  const s = deck.slides[i];

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="text-sm text-muted-foreground font-display">{deck.title}</div>
        <div className="text-xs text-muted-foreground">{i + 1} / {deck.slides.length}</div>
        <Button size="icon" variant="ghost" onClick={() => nav(-1)}><X className="size-5" /></Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 md:p-16 overflow-auto">
        <SlideRenderer slide={s} variant="present" />
      </div>

      <div className="flex justify-between items-center p-4 border-t">
        <Button variant="outline" onClick={() => setI(p => Math.max(p - 1, 0))} disabled={i === 0}>
          <ChevronLeft className="size-4 mr-1" />Zurück
        </Button>
        <div className="text-xs text-muted-foreground hidden md:block">← → · Esc zum Beenden</div>
        <Button onClick={() => setI(p => Math.min(p + 1, deck.slides.length - 1))} disabled={i === deck.slides.length - 1}>
          Weiter<ChevronRight className="size-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
