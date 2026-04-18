// Vorgefertigte Therapie-Templates (Slide-Sets)

export interface TemplateSlide {
  title: string;
  bullets: string[];
  notes?: string;
}

export interface Template {
  id: string;
  title: string;
  approach: string;
  description: string;
  category: "Psychoedukation" | "Intervention" | "Arbeitsblatt" | "Modell";
  tags: string[];
  slides: TemplateSlide[];
}

export const TEMPLATES: Template[] = [
  {
    id: "kvt-gedankenprotokoll",
    title: "KVT – Gedankenprotokoll",
    approach: "KVT",
    category: "Arbeitsblatt",
    tags: ["Kognitive Umstrukturierung", "ABC-Modell"],
    description: "Einführung in das ABC-Modell und Gedankenprotokoll für Patient:innen.",
    slides: [
      { title: "Wie wirken Gedanken?", bullets: ["Gedanken beeinflussen Gefühle und Verhalten", "Oft automatisch, nicht bewusst", "Wir können sie erkennen und prüfen"] },
      { title: "Das ABC-Modell", bullets: ["A – Auslöser (Situation)", "B – Bewertung (Gedanke)", "C – Konsequenz (Gefühl, Verhalten)"] },
      { title: "Beispiel", bullets: ["A: Kollegin grüßt nicht", "B: 'Sie mag mich nicht'", "C: Traurigkeit, Rückzug"] },
      { title: "Typische Denkfallen", bullets: ["Schwarz-Weiß-Denken", "Katastrophisieren", "Personalisieren", "Gedankenlesen"] },
      { title: "Hilfreiche Fragen", bullets: ["Welche Belege gibt es?", "Was würde ich einer Freund:in raten?", "Gibt es eine Alternative?"] },
      { title: "Ihr Gedankenprotokoll", bullets: ["Situation notieren", "Gedanken & Gefühle festhalten", "Alternativgedanken formulieren", "Wirkung beobachten"] },
    ],
  },
  {
    id: "kvt-sorkc",
    title: "KVT – SORKC Verhaltensanalyse",
    approach: "KVT",
    category: "Modell",
    tags: ["Verhaltensanalyse"],
    description: "Funktionale Verhaltensanalyse nach Kanfer.",
    slides: [
      { title: "SORKC – Was ist das?", bullets: ["Strukturierte Analyse von Verhalten", "Verstehen, warum etwas auftritt", "Gemeinsame Ausarbeitung"] },
      { title: "S – Stimulus", bullets: ["Auslösende Situation", "Innen oder außen"] },
      { title: "O – Organismus", bullets: ["Körper, Biografie, Lerngeschichte", "Überzeugungen"] },
      { title: "R – Reaktion", bullets: ["Gedanken, Gefühle, Verhalten, Körper"] },
      { title: "K – Kontingenz", bullets: ["Wie oft folgt die Konsequenz?"] },
      { title: "C – Konsequenzen", bullets: ["Kurzfristig vs. langfristig", "Positiv oder negativ"] },
    ],
  },
  {
    id: "act-werte",
    title: "ACT – Werte-Kompass",
    approach: "ACT",
    category: "Intervention",
    tags: ["Werte", "Achtsamkeit"],
    description: "Werteorientierung in zentralen Lebensbereichen.",
    slides: [
      { title: "Was sind Werte?", bullets: ["Richtungen, nicht Ziele", "Was zählt im Leben?", "Frei wählbar"] },
      { title: "Lebensbereiche", bullets: ["Beziehung & Familie", "Beruf & Bildung", "Gesundheit & Körper", "Freizeit & Spiritualität"] },
      { title: "Werte vs. Ziele", bullets: ["Wert: 'liebevoller Partner sein'", "Ziel: 'heute Abend zuhören'", "Werte sind nie 'erledigt'"] },
      { title: "Übung: Kompassrose", bullets: ["Pro Bereich 1–2 Werte notieren", "Wichtigkeit (1–10)", "Aktuelle Lebenszufriedenheit (1–10)", "Diskrepanz erkennen"] },
      { title: "Erste Schritte", bullets: ["Kleine Handlung pro Bereich", "Diese Woche umsetzen", "Beobachten, was geschieht"] },
    ],
  },
  {
    id: "act-defusion",
    title: "ACT – Defusion",
    approach: "ACT",
    category: "Intervention",
    tags: ["Defusion", "Distanzierung"],
    description: "Abstand zu belastenden Gedanken.",
    slides: [
      { title: "Gedanken sind Worte, keine Wahrheit", bullets: ["Wir sind nicht unsere Gedanken", "Beobachten statt glauben"] },
      { title: "Klassische Übungen", bullets: ["'Ich habe den Gedanken, dass …'", "Gedanken laut singen", "Gedanken-Bus-Metapher"] },
      { title: "Im Alltag", bullets: ["Gedanken benennen", "Distanz spüren", "Trotzdem werteorientiert handeln"] },
    ],
  },
  {
    id: "schema-modi",
    title: "Schematherapie – Modus-Modell",
    approach: "Schematherapie",
    category: "Modell",
    tags: ["Modi", "Inneres Kind"],
    description: "Einführung in die wichtigsten Modi.",
    slides: [
      { title: "Was sind Modi?", bullets: ["Aktuelle innere Zustände", "Wechseln je nach Situation", "Können erkannt werden"] },
      { title: "Kind-Modi", bullets: ["Verletzliches Kind", "Wütendes Kind", "Glückliches Kind"] },
      { title: "Eltern-Modi", bullets: ["Strafender Elternteil", "Fordernder Elternteil"] },
      { title: "Bewältigungs-Modi", bullets: ["Vermeider", "Überkompensierer", "Erdulder"] },
      { title: "Gesunder Erwachsener", bullets: ["Ziel der Therapie", "Stärken, schützen, klären"] },
    ],
  },
  {
    id: "achtsamkeit-basis",
    title: "Achtsamkeit – Grundlagen",
    approach: "Andere",
    category: "Psychoedukation",
    tags: ["MBSR", "Achtsamkeit"],
    description: "Einführung in Achtsamkeitspraxis.",
    slides: [
      { title: "Was ist Achtsamkeit?", bullets: ["Bewusste Aufmerksamkeit im Hier & Jetzt", "Ohne Bewertung", "Annehmend"] },
      { title: "Wirkung", bullets: ["Reduziert Grübeln", "Reguliert Emotionen", "Erhöht Selbstmitgefühl"] },
      { title: "Atemanker", bullets: ["3 Minuten täglich starten", "Atem in Bauch beobachten", "Sanft zurückkehren bei Ablenkung"] },
      { title: "Bodyscan", bullets: ["Kopf bis Fuß", "Empfindungen wahrnehmen", "Nichts verändern müssen"] },
      { title: "Im Alltag", bullets: ["Achtsam essen, gehen, zuhören", "Mini-Pausen einbauen"] },
    ],
  },
  {
    id: "psychoed-angst",
    title: "Psychoedukation – Angst",
    approach: "KVT",
    category: "Psychoedukation",
    tags: ["Angststörung", "Panik"],
    description: "Erklärungsmodell und Teufelskreis der Angst.",
    slides: [
      { title: "Angst ist ein Schutzmechanismus", bullets: ["Evolutionär sinnvoll", "Aktiviert Kampf/Flucht/Erstarrung"] },
      { title: "Körperliche Reaktionen", bullets: ["Herzrasen, Schwitzen, Atem", "Muskelspannung", "Tunnelblick"] },
      { title: "Teufelskreis der Angst", bullets: ["Auslöser → Körperreaktion", "Bewertung 'gefährlich'", "Verstärkte Reaktion", "Vermeidung hält aufrecht"] },
      { title: "Was hilft", bullets: ["Konfrontation in kleinen Schritten", "Atemtechniken", "Realitätscheck der Gedanken"] },
      { title: "Ihr nächster Schritt", bullets: ["Angsthierarchie aufstellen", "Mit kleinster Stufe beginnen", "Erfolg notieren"] },
    ],
  },
  {
    id: "psychoed-depression",
    title: "Psychoedukation – Depression",
    approach: "KVT",
    category: "Psychoedukation",
    tags: ["Depression", "Aktivierung"],
    description: "Erklärungsmodell und Verhaltensaktivierung.",
    slides: [
      { title: "Depression ist eine Erkrankung", bullets: ["Nicht 'schwach sein'", "Komplexe Ursachen", "Behandelbar"] },
      { title: "Symptome", bullets: ["Niedergeschlagenheit, Antriebslosigkeit", "Interessenverlust", "Schlaf, Konzentration, Appetit"] },
      { title: "Negativspirale", bullets: ["Weniger Aktivität → weniger Erfolg", "Mehr Grübeln → mehr Niedergeschlagenheit"] },
      { title: "Verhaltensaktivierung", bullets: ["Kleine angenehme Aktivitäten planen", "Pflicht & Genuss balancieren", "Stimmung beobachten"] },
      { title: "Wege heraus", bullets: ["Tagesstruktur", "Soziale Kontakte", "Bewegung", "Therapie & ggf. Medikation"] },
    ],
  },
];

export function getTemplate(id: string) {
  return TEMPLATES.find(t => t.id === id);
}
