import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, ShieldAlert, Clock } from "lucide-react";
import { useSessionBriefing } from "../hooks/useSessionBriefing";
import { BRIEFING_SESSION_COUNT } from "../types";

/**
 * "Aktueller Stand" – Kurzfassung der letzten bis zu 3 dokumentierten Sitzungen,
 * gedacht zum Lesen in ein bis zwei Minuten unmittelbar vor der Sitzung.
 * Steht ganz oben im Patient:innen-Profil und hält sich selbst aktuell.
 */
export function AktuellerStandCard({ patientId }: { patientId: string }) {
  const { briefing, updatedAt, sessionCount, busy, error, stale, regenerate } =
    useSessionBriefing(patientId);

  if (sessionCount === 0) {
    return (
      <Card className="mb-6 border-dashed">
        <CardContent className="p-5 text-sm text-muted-foreground leading-relaxed">
          Sobald eine Sitzung mit Verlaufsdokumentation vorliegt, entsteht hier automatisch
          der aktuelle Stand.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-primary/30">
      <CardContent className="p-5 md:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-medium leading-tight">Aktueller Stand</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Letzte {Math.min(sessionCount, BRIEFING_SESSION_COUNT)}{" "}
              {sessionCount === 1 ? "dokumentierte Sitzung" : "dokumentierte Sitzungen"}
              {briefing?.herangezogene_sitzungen?.length
                ? ` · ${briefing.herangezogene_sitzungen.join(", ")}`
                : ""}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={regenerate}
            disabled={busy}
            aria-label="Aktuellen Stand neu erstellen"
          >
            <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {busy && !briefing && (
          <p className="text-sm text-muted-foreground">Aktueller Stand wird erstellt …</p>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
            <AlertCircle className="size-4 text-destructive mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {briefing && (
          <div className="space-y-4">
            {stale && !busy && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm">
                <Clock className="size-4 text-warning mt-0.5 shrink-0" />
                <span>
                  Seit der letzten Erstellung wurde weiter dokumentiert. Der Stand wird
                  gerade nachgezogen.
                </span>
              </div>
            )}

            <p className="text-sm leading-relaxed">{briefing.stand}</p>

            {briefing.veraenderung && (
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
                  Veränderung
                </h3>
                <p className="text-sm leading-relaxed">{briefing.veraenderung}</p>
              </div>
            )}

            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5">
              <ShieldAlert className="size-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Risiko
                </div>
                <p className="text-sm leading-relaxed">{briefing.risiko_status}</p>
              </div>
            </div>

            {(briefing.offene_vereinbarungen?.length > 0 ||
              briefing.offene_themen?.length > 0) && (
              <div className="grid sm:grid-cols-2 gap-4">
                {briefing.offene_vereinbarungen?.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
                      Offene Vereinbarungen
                    </h3>
                    <ul className="space-y-1 text-sm list-disc pl-4 leading-relaxed">
                      {briefing.offene_vereinbarungen.map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                  </div>
                )}
                {briefing.offene_themen?.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
                      Offene Themen
                    </h3>
                    <ul className="space-y-1 text-sm list-disc pl-4 leading-relaxed">
                      {briefing.offene_themen.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {briefing.administratives && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {briefing.administratives}
              </p>
            )}

            {briefing.hinweis_datenlage && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {briefing.hinweis_datenlage}
              </p>
            )}

            {updatedAt && (
              <p className="text-xs text-muted-foreground pt-1">
                Erstellt am {new Date(updatedAt).toLocaleString("de-DE")}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
