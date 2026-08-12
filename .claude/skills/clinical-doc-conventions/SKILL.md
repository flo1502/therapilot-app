---
name: clinical-doc-conventions
description: Regeln für KI-generierte klinische Dokumentation in Therapilot (Stundenprotokoll, Anamnese, psychotherapeutischer Befund und weitere Berichtsarten) — Prompt-Datei-Struktur (prompts/*.v1.md), Diagnose-/Spekulationsverbot, Pflichtfeld Suizidalität, Stilregeln für klinischen Text, unterschiedliche Datenherkunft je Dokumenttyp, AMDP-Vollständigkeitsregel, Datenschutz-Vorgaben. IMMER anwenden bei der Arbeit an Dateien unter prompts/*.v1.md, src/domains/documentation/, src/domains/reports/, src/domains/patients/, den zugehörigen Supabase Edge Functions, oder wenn eine neue Berichtsart / ein neuer Dokumenttyp / ein neues Feld für Patient:innen-Dokumentation entworfen wird — auch wenn nur "neuen Bericht bauen", "Struktur für X" oder "Feld für Y hinzufügen" gesagt wird, ohne dass "Diagnose" oder "Befund" explizit erwähnt wird.
---

# Klinische Dokumentations-Konventionen (Therapilot)

## Warum das wichtig ist

Therapilot generiert Dokumente, die in echten Patient:innen-Akten landen
und teils direkt an Kassen/Gutachter gehen (siehe `prompts/befund.v1.md`,
`prompts/kv-verlauf.v1.md`). Ein falsch formuliertes Feld ist hier kein
Bug wie jeder andere — es kann eine rechtlich relevante Aussage über
eine reale Person werden. Die Regeln unten sind deshalb strenger als
sonst üblich, und die meisten sind aus konkreten Anforderungen
(KV-Dokumentationspflicht, Gutachterverfahren, Datenschutz) abgeleitet,
nicht willkürlich.

## 1. Jeder KI-Task bekommt einen eigenen versionierten Prompt

Neue Dokumenttypen/Berichtsarten bekommen eine Datei
`prompts/<name>.v1.md` — niemals Prompt-Text direkt im
TypeScript-/Edge-Function-Code (siehe `CLAUDE.md`). Grund: Prompts
ändern sich unabhängig vom Code, müssen versioniert und auch für
Nicht-Entwickler:innen (z. B. bei einer fachlichen Prüfung) lesbar sein.

Halte dich am Aufbau der bestehenden Referenzbeispiele:
- `prompts/kv-verlauf.v1.md` — einfacher Fall: 1 Transkript → 1 Sitzungsdokument
- `prompts/befund.v1.md` — komplexerer Fall: mehrere Quelldokumente → 1 zusammenfassendes Dokument

Jeder Prompt enthält in dieser Reihenfolge:
1. **Rolle** — wer die KI hier ist, inkl. was sie NICHT tut
2. **Aufgabe** — 1–2 Sätze
3. **Output-Format** — vollständiges JSON-Schema, keine Prosa-Beschreibung
4. **Sektionen im Detail** — jedes Feld einzeln erklärt
5. **Stilregeln**
6. **Mindestens 1 durchgerechnetes Beispiel** — realistisch, mit Input und vollständigem/repräsentativem Output
7. **Wichtige Einschränkung** — die eine Sache, die am ehesten schiefgehen könnte, nochmal explizit hervorgehoben

## 2. Diagnose- und Spekulationsverbot

Kein KI-Task in Therapilot darf eine Diagnose *stellen* oder andeuten,
die nicht bereits von der Therapeut:in irgendwo im Quellmaterial
dokumentiert wurde. Formulierungen wie "vermutlich depressiv" oder
"wirkt traumatisiert" sind auch dann verboten, wenn sie plausibel
klingen.

Der Grund ist nicht Stilistik, sondern Verantwortung: Eine KI, die
eigenständig aus einem Transkript diagnostiziert, überschreitet die
Rolle als Dokumentations-Assistenz und wird zum diagnostizierenden
System — das ist weder rechtlich noch klinisch das, was dieses Tool
sein soll (vgl. `docs/compliance/`).

Praktisch heißt das für jedes Feld, das nach Diagnose/Einschätzung
fragt: Liegt im Quellmaterial nichts Explizites vor → Feld leer lassen
oder "steht noch aus"/"nicht exploriert" vermerken, niemals eine
plausible Vermutung einsetzen.

## 3. Pflichtfeld: Suizidalität

Jeder Dokumenttyp, der Symptomatik oder psychischen Status behandelt,
braucht eine Aussage zu Suizidalität — auch wenn sie nur "nicht
exploriert" lautet. Der Grund: Eine leere/negative Aussage zeigt, dass
die Frage gestellt wurde und nichts vorlag; eine fehlende Aussage zeigt
gar nichts — und das ist im Nachhinein nicht mehr unterscheidbar.

**Eigenes JSON-Feld vs. Fließtext-Satz — beides ist zulässig, aber mit
einer Bedingung:** Bei mehrfeldrigen Dokumenttypen (z. B. Stundenprotokoll,
Befund) ist ein eigenes Pflichtfeld der Standard. Ist der Dokumenttyp
bewusst einfeldig/prosaisch (z. B. eine Ein-Absatz-Zusammenfassung), darf
die Aussage stattdessen ein Satz im Fließtext sein — aber nur, wenn
dieser Satz *immer* geschrieben wird, auch im unauffälligen Fall
("... wurde in den herangezogenen Sitzungen nicht exploriert."). Ein
Satz, der nur bei auffälligem Befund erscheint und bei "nicht
exploriert" schlicht wegfällt, verletzt die Regel: das entspricht dann
doch wieder einem fehlenden statt einem negativen Feld, nur unsichtbar
im Fließtext versteckt. Im Zweifel: eigenes Feld ist immer sicherer als
ein bedingter Satz, und bei einer Ein-Absatz-Vorgabe sticht diese Regel
den Umfangswunsch — lieber ein Satz länger als eine unsichtbare Lücke.

## 4. Stilregeln für klinischen Text

- Klinisch-neutral, knappe Fließtext-Sätze, keine Bullet-Wüsten.
- Indirekte Wiedergabe — keine direkte Rede/wörtlichen Zitate aus
  Sitzungen, außer in Feldern, die explizit für belegte Zitate mit
  Quellenangabe vorgesehen sind (z. B. `sources[].quote` in der Anamnese).
- Keine wertenden Adjektive ("tapfer", "leider", "beeindruckend",
  "uneinsichtig" etc.) — das sind Meinungen, keine Dokumentation.
- Patient:in nie mit Klarnamen, immer Pseudonym oder neutral ("die
  Patientin", "der Patient", "Pat.").

`src/lib/kvGuardrails.ts` prüft einen Teil dieser Regeln bereits
automatisiert (Wertungsbegriffe, Diagnose-Spekulation, direkte Rede per
Regex) — bei neuen Dokumenttypen lohnt sich ein Blick, ob sich der
gleiche Validator wiederverwenden lässt, statt einen neuen zu schreiben.

## 5. Datenherkunft unterscheidet sich pro Dokumenttyp — das bestimmt die Architektur

Nicht jeder Dokumenttyp bekommt dieselbe Eingabe. Das vor dem Bauen zu
klären entscheidet, ob eine neue Edge Function ein rohes Transkript
braucht oder bereits strukturierte Dokumente:

| Dokumenttyp | Input | Verhalten |
|---|---|---|
| Stundenprotokoll | 1 rohes Sitzungstranskript | Einmalig pro Sitzung, überschreibt nichts |
| Anamnese | alle bisherigen Transkripte, kumulativ | Additiv gemergt (neue Infos ergänzen, alte bleiben — siehe `mergeProfiles()` in `src/lib/anamneseTypes.ts`) |
| Psychotherapeutischer Befund | bereits strukturierte Dokumente (Anamnese-Profil + Stundenprotokolle) | Fasst zusammen, extrahiert nicht neu aus Rohtext |

Bei einer neuen Berichtsart zuerst fragen: "Woher kommen die Fakten —
aus dem Rohtranskript, kumulativ aus allen Transkripten, oder aus
bereits erstellten Dokumenten?" Das bestimmt, welche Daten die Function
überhaupt bekommen muss.

## 6. Psychopathologischer Befund: AMDP-Vollständigkeitsregel

Für Felder, die den psychopathologischen Befund abbilden (AMDP-System,
13 Kategorien — vollständige Liste in `src/domains/reports/types.ts`),
gilt eine Ausnahme von der sonstigen "leer lassen, wenn nichts
vorliegt"-Regel: Jede Kategorie wird explizit befüllt, z. B. mit
"unauffällig" oder "kein Hinweis in den Quelldokumenten" — nicht
weggelassen. Ein psychopathologischer Befund mit fehlenden Kategorien
liest sich fachlich wie eine unvollständige Untersuchung, nicht wie ein
unauffälliger Befund.

## 7. Datenschutz: Was darf wohin

Patientendaten (`data-class: patient` in `src/config/data-classes.ts`)
dürfen nicht ungeprüft an Cloud-Provider gehen. Bestehende Mechanismen:
`src/lib/pseudonymize.ts` (entfernt Namen/Kontaktdaten vor jedem
KI-Call) und `src/lib/guardrails.ts`. Ein neuer KI-Task, der mit
`data-class: patient`-Feldern arbeitet, muss durch diese Mechanismen
laufen — nicht direkt an einen Provider durchgereicht werden.

## 8. Vor einer neuen Berichtsart: erst recherchieren, dann strukturieren

Deutsche klinische Dokumentation folgt oft offiziellen oder
de-facto-Standards (z. B. PTV-3-Formular/Psychotherapie-Vereinbarung für
den Bericht an den Gutachter, AMDP-System für den psychopathologischen
Befund). Bevor eine neue Struktur frei entworfen wird: kurz
recherchieren, ob dafür bereits eine übliche Gliederung existiert —
z. B. über den `researcher`-Subagenten (`.claude/agents/researcher.md`),
der genau dafür gebaut ist (Regulatorik, Standards, aktuelle Vorgaben).
Frei an einer Struktur vorbeizuraten, die es in der Praxis schon gibt,
macht das Dokument für Therapeut:innen unbrauchbar oder sogar formal
falsch.

## Referenz

Bei Unsicherheit: `prompts/befund.v1.md` und `prompts/kv-verlauf.v1.md`
sind die zwei ausgearbeiteten Referenzbeispiele in diesem Repo — im
Zweifel eher deren Aufbau kopieren als neu erfinden.
