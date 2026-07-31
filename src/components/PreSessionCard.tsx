import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { db, SessionEntry } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CalendarClock, AlertCircle, ArrowRight } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;

function summaryBullets(s: SessionEntry): string[] {
  const doc = s.kvDocumentation;
  const raw = [doc?.verlauf_und_einschaetzung, doc?.inhalte_der_sitzung]
    .filter(Boolean)
    .join(" ")
    .trim() || (s.structured || s.rawNotes || "").trim();
  if (!raw) return [];
  return raw
    .split(/(?<=[.!?])\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 15)
    .slice(0, 5);
}

export function PreSessionCard() {
  const now = Date.now();
  const upcoming = useLiveQuery(
    async () => {
      const all = await db.sessions.toArray();
      return all
        .filter((s) => s.date > now && s.date <= now + DAY_MS)
        .sort((a, b) => a.date - b.date)[0];
    },
    [],
  );
  const previous = useLiveQuery(
    async () => {
      if (!upcoming) return undefined;
      const all = await db.sessions.where("patientId").equals(upcoming.patientId).toArray();
      return all
        .filter((s) => s.id !== upcoming.id && s.date <= now)
        .sort((a, b) => b.date - a.date)[0];
    },
    [upcoming?.id],
  );

  if (!upcoming) return null;

  const bullets = previous ? summaryBullets(previous) : [];
  const steps = previous?.kvDocumentation?.naechste_schritte?.filter((t) => t?.trim()) ?? [];
  const done = previous?.naechsteSchritteDone ?? [];
  const admin = previous?.kvDocumentation?.administrative_hinweise?.trim();

  const toggle = async (step: string, checked: boolean) => {
    if (!previous) return;
    const next = checked ? [...new Set([...done, step])] : done.filter((d) => d !== step);
    await db.sessions.update(previous.id, { naechsteSchritteDone: next });
  };

  return (
    <Card className="mb-8 border-primary/30">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <CalendarClock className="size-4 text-primary" />
              Vor der Sitzung
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {upcoming.patientId} · {formatDateTime(upcoming.date)}
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to={`/sessions/${upcoming.id}`}>
              Sitzung öffnen <ArrowRight className="size-4 ml-1.5" />
            </Link>
          </Button>
        </div>

        {!previous && (
          <p className="text-sm text-muted-foreground">Keine vorherige Sitzung dokumentiert.</p>
        )}

        {previous && (
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Letzte Sitzung ({formatDateTime(previous.date)})
              </h3>
              {bullets.length ? (
                <ul className="space-y-1.5 text-sm list-disc pl-4">
                  {bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Keine Zusammenfassung vorhanden.</p>
              )}
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Offene Aufgaben
              </h3>
              {steps.length ? (
                <ul className="space-y-2">
                  {steps.map((s, i) => {
                    const checked = done.includes(s);
                    return (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Checkbox
                          id={`step-${i}`}
                          checked={checked}
                          onCheckedChange={(v) => toggle(s, v === true)}
                          className="mt-0.5"
                        />
                        <label
                          htmlFor={`step-${i}`}
                          className={checked ? "line-through text-muted-foreground" : ""}
                        >
                          {s}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Keine offenen Aufgaben notiert.</p>
              )}
            </div>
          </div>
        )}

        {admin && (
          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm">
            <AlertCircle className="size-4 text-warning mt-0.5 shrink-0" />
            <span>{admin}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
