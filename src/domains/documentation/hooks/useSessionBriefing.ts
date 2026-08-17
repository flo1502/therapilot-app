import { useCallback, useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { callAi } from "@/lib/ai/provider";
import {
  BRIEFING_SESSION_COUNT,
  BriefingCacheEntry,
  SessionBriefing,
  briefingBasisKey,
  briefingSettingsKey,
} from "../types";

/**
 * Hält das "Aktueller Stand"-Briefing einer Patient:in aktuell.
 *
 * Grundlage sind die letzten bis zu drei Sitzungen, die eine KV-Verlaufs-
 * dokumentation besitzen. Ändert sich diese Grundlage (neue Sitzung
 * dokumentiert oder bestehende Doku überarbeitet), gilt das gespeicherte
 * Briefing als veraltet und wird einmalig neu erzeugt.
 */
export function useSessionBriefing(patientId: string | undefined) {
  const cacheKey = patientId ? briefingSettingsKey(patientId) : "";

  // `undefined` heißt "wird noch geladen", `null` heißt "kein Cache vorhanden".
  // Die Unterscheidung ist nötig, damit der Auto-Lauf unten nicht schon während
  // des Ladens feuert und dabei einen vorhandenen Cache übergeht.
  const cached = useLiveQuery(
    async () => {
      if (!cacheKey) return null;
      const row = await db.settings.get(cacheKey);
      return (row?.value as BriefingCacheEntry) ?? null;
    },
    [cacheKey],
  );

  /** Die letzten bis zu 3 dokumentierten Sitzungen, neueste zuerst. */
  const basisSessions = useLiveQuery(
    async () => {
      if (!patientId) return [];
      const all = await db.sessions.where("patientId").equals(patientId).toArray();
      return all
        .filter((s) => s.kvDocumentation)
        .sort((a, b) => b.date - a.date)
        .slice(0, BRIEFING_SESSION_COUNT);
    },
    [patientId],
    [],
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentBasis = basisSessions ? briefingBasisKey(basisSessions) : "";
  const stale = currentBasis !== "" && currentBasis !== (cached?.basis ?? "");

  const generate = useCallback(async () => {
    if (!patientId || !basisSessions?.length) return;
    setBusy(true);
    setError(null);
    try {
      // Sitzungen werden positionell benannt statt mit Datum: der
      // Pseudonymisierungs-Filter ersetzt Datumsangaben ohnehin durch
      // "[DATUM]", und echte Sitzungsdaten müssen das Gerät nicht verlassen.
      // Reihenfolge im Payload: älteste zuerst, damit die Chronologie stimmt.
      const chronological = [...basisSessions].reverse();
      const total = chronological.length;
      const label = (i: number) => {
        const pos = `Sitzung ${i + 1} von ${total}`;
        if (total === 1) return pos;
        if (i === total - 1) return `${pos} (jüngste)`;
        if (i === 0) return `${pos} (älteste)`;
        return `${pos} (mittlere)`;
      };

      const result = await callAi<Omit<SessionBriefing, "herangezogene_sitzungen">>({
        task: "briefing-generate",
        patientPseudonym: patientId,
        payload: {
          sessions: chronological.map((s, i) => ({
            sitzung: label(i),
            dokumentation: s.kvDocumentation,
          })),
        },
      });

      // Die tatsächlichen Sitzungsdaten setzt der Client ein, neueste zuerst.
      const briefing: SessionBriefing = {
        ...result,
        herangezogene_sitzungen: basisSessions.map((s) =>
          new Date(s.date).toLocaleDateString("de-DE"),
        ),
      };

      const entry: BriefingCacheEntry = {
        briefing,
        updatedAt: Date.now(),
        basis: briefingBasisKey(basisSessions),
      };
      await db.settings.put({ key: briefingSettingsKey(patientId), value: entry });
    } catch (e: any) {
      setError(e?.message ?? "Der aktuelle Stand konnte nicht erstellt werden.");
    } finally {
      setBusy(false);
    }
  }, [patientId, basisSessions]);

  // Einmaliger Auto-Lauf pro veralteter Grundlage. Der Schlüssel im Ref
  // verhindert, dass ein Fehlschlag bei jedem Rendern erneut abgefeuert wird.
  const attempted = useRef<string>("");
  useEffect(() => {
    if (!stale || busy || cached === undefined) return;
    if (attempted.current === currentBasis) return;
    attempted.current = currentBasis;
    void generate();
  }, [stale, busy, cached, currentBasis, generate]);

  return {
    briefing: cached?.briefing,
    updatedAt: cached?.updatedAt,
    sessionCount: basisSessions?.length ?? 0,
    busy,
    error,
    stale,
    regenerate: generate,
  };
}
