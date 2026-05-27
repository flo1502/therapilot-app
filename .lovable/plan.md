
# Anamnese-Automatisierung (Sessions 1–7 → Patient:innen-Profil)

Neuer KI-gestützter Anamnese-Baustein: Aus den Transkripten der ersten bis zu 7 Sessions wird ein strukturiertes **Anamnese-Profil** erstellt, das exakt der Papierstruktur (Bögen 1–3) folgt. Pro neuer Session werden neue Informationen ergänzt / vorhandene Felder verfeinert (Merge, kein Überschreiben).

## 1. Datenstruktur (`src/lib/anamneseTypes.ts`, neu)

TypeScript-Schema, das 1:1 die Bögen abbildet:

```text
AnamneseProfile {
  kindheit { selbstbeschreibung, gesundheitszustand, problemeStoerungen,
             verluste, traumatisierungen, besondereSituationen }
  eltern   { alter, beruf, persoenlichkeit, erziehungsstil,
             beziehungKommunikation, atmosphaere, geschwister }
  schule   { abschluesse, beziehungMitschuelerLehrer }
  beruf    { ausbildungen, beziehungVorgesetzteKollegen }
  sexualitaetPartnerschaften
  interessenHobbys
  ressourcen
  aktuelleLebenssituation { wohnen, arbeit, beziehungen, kinder, eltern, krankheiten }
  symptomanamnese { aktuelleSymptomatik, beginnAusloeser, traumatisierungen,
                    behandlungen, medikation, problemloeseversuche }
  psychischerBefund { interaktionsverhalten, auftreten, wirkung, denkmuster }
  persoenlichkeitsstruktur
  bewertungVorlaeufigeDiagnose
}
```

Jedes Feld: `{ text: string; confidence: 0–1; sources: { sessionId, nr, quote }[] }` — damit jede Aussage rückverfolgbar bleibt.

## 2. AI-Task (`supabase/functions/ai-assist/index.ts`)

Neuer Task **`anamnese-extract`**:
- Input: aktuelles `AnamneseProfile` + neues Session-Transkript (+ Sitzungs-Nr.)
- System-Prompt (DE, A1-A2, pseudonymisiert): siehe Abschnitt 5
- Tool-Calling-Schema = `AnamneseProfile` (structured output)
- Output: gemergtes Profil; pro Feld nur ergänzen wenn neue Evidenz, Quote + sessionId anhängen

## 3. Speicherung (Dexie, `src/lib/db.ts`)

- Neues Feld `Patient.anamneseProfile?: AnamneseProfile`
- Neues Feld `Patient.anamneseLastUpdatedAt?: number`
- Keine Migration nötig (Dexie additiv).

## 4. UI

**a) Neuer Tab im `SessionEdit`** („Anamnese") nach „Therapieverlauf":
- Button **„Anamnese aus dieser Session extrahieren"** → ruft `anamnese-extract` mit aktuellem Transcript, merged ins Patient-Profil
- Hinweis-Badge wenn Sitzungs-Nr. > 7 („Anamnese-Phase abgeschlossen — Updates optional")

**b) Neue Komponente `AnamneseProfilePanel.tsx`**:
- Rendert das vollständige Profil in den 5 Karten-Blöcken der Vorlage (Kindheit / Eltern / Schule / Beruf / Sexualität — dann Interessen / Ressourcen / Lebenssituation / Symptomanamnese / Psych. Befund / Persönlichkeit / Diagnose)
- Jedes Feld editierbar (Textarea) + Quellen-Popover (Session-Nr. + Zitat)
- Sammel-Button **„Aus allen Sessions 1–7 neu aufbauen"** (iteriert sequenziell)
- Export-Button **„PDF / Markdown exportieren"**

**c) Einbindung in `PatientDetail`**: neuer Tab/Card „Anamnese-Profil" mit `AnamneseProfilePanel`.

## 5. System-Prompt (Kern)

Wird in `ai-assist` als Konstante hinterlegt, gekürzt hier:

```
Du bist klinischer Anamnese-Assistent für ambulante Psychotherapie (DE).
Aufgabe: Extrahiere aus dem Sitzungs-Transkript NUR Fakten, die in die
folgende Anamnese-Struktur passen (Bögen 1–3 nach VT-Standard):

[vollständige Feldliste aus Abschnitt 1]

REGELN:
- Nichts erfinden. Keine Diagnosen stellen — nur was Patient:in/Therapeut sagt.
- Pro Feld: prägnante Zusammenfassung (max. 3 Sätze, A2-Sprache, sachlich).
- Jede Aussage MUSS mit wörtlichem Zitat + Session-Nr. belegt werden.
- Bestehendes Profil NICHT überschreiben — nur ergänzen / präzisieren.
- Bei Widerspruch: beide Versionen festhalten + Konflikt markieren.
- Pseudonymisiert bleiben (keine Klarnamen).
- Output: tool-call `update_anamnese` mit dem vollständigen, gemergten Profil.
```

## 6. Dateien

**Neu**
- `src/lib/anamneseTypes.ts`
- `src/components/anamnese/AnamneseProfilePanel.tsx`
- `src/components/anamnese/AnamneseFieldCard.tsx`

**Geändert**
- `supabase/functions/ai-assist/index.ts` (Task `anamnese-extract` + Tool-Schema + Prompt)
- `src/lib/ai/provider.ts` (`AiTask` Union erweitern)
- `src/lib/db.ts` (`Patient.anamneseProfile`)
- `src/pages/SessionEdit.tsx` (neuer Tab „Anamnese")
- `src/pages/PatientDetail.tsx` (Profil-Anzeige + „Neu aufbauen"-Button)

## 7. Keine Änderungen an

- Bestehende KV-/CBT-/Therapieverlauf-Logik
- Datenbank-Schema in Supabase (alles client-side via Dexie)
- Audio-/Transkriptions-Pipeline (Transcript ist bereits in `SessionEntry.transcript`)
