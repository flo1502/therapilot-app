// Vorgefertigte Therapie-Templates (Slide-Sets) – mit visuellen Layouts.
import type { SlideLayout, SlideLayoutData } from "@/lib/db";
import type { IconKey } from "@/lib/slideIcons";
import emotionalesNetzwerkImg from "@/assets/emotionales-netzwerk.jpg";
import gehirnAmygdalaImg from "@/assets/gehirn-amygdala.jpg";
import zirkadianeUhrImg from "@/assets/zirkadiane-uhr.jpg";
import gehirnSchlafImg from "@/assets/gehirn-schlaf.jpg";

export interface TemplateSlide {
  title: string;
  bullets: string[];
  notes?: string;
  layout?: SlideLayout;
  iconKey?: IconKey;
  layoutData?: SlideLayoutData;
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
      {
        title: "Wie wirken Gedanken?",
        bullets: ["Gedanken beeinflussen Gefühle und Verhalten", "Oft automatisch, nicht bewusst", "Wir können sie erkennen und prüfen"],
        layout: "headline", iconKey: "brain",
        layoutData: { headline: "Gedanken formen Gefühle.", subline: "Sie laufen oft automatisch – wir können lernen, sie zu erkennen." },
      },
      {
        title: "Das ABC-Modell",
        bullets: ["A – Auslöser (Situation)", "B – Bewertung (Gedanke)", "C – Konsequenz (Gefühl, Verhalten)"],
        layout: "model", iconKey: "lightbulb",
        layoutData: { nodes: [
          { label: "A – Auslöser", description: "Situation" },
          { label: "B – Bewertung", description: "Gedanke" },
          { label: "C – Konsequenz", description: "Gefühl & Verhalten" },
        ] },
      },
      {
        title: "Beispiel im Alltag",
        bullets: ["A: Kollegin grüßt nicht", "B: 'Sie mag mich nicht'", "C: Traurigkeit, Rückzug"],
        layout: "before-after", iconKey: "scale",
        layoutData: {
          before: { title: "Automatischer Gedanke", items: ["'Sie mag mich nicht'", "Traurigkeit", "Rückzug"] },
          after:  { title: "Hilfreicher Gedanke",    items: ["'Vielleicht hat sie mich übersehen'", "Neutral", "Nachfragen"] },
        },
      },
      {
        title: "Typische Denkfallen",
        bullets: ["Schwarz-Weiß-Denken", "Katastrophisieren", "Personalisieren", "Gedankenlesen"],
        layout: "bullets", iconKey: "brain",
      },
      {
        title: "Hilfreiche Fragen",
        bullets: ["Welche Belege gibt es?", "Was würde ich einer Freund:in raten?", "Gibt es eine Alternative?"],
        layout: "question", iconKey: "question",
        layoutData: { headline: "Stimmt dieser Gedanke wirklich?", subline: "Welche Belege sprechen dafür – welche dagegen?" },
      },
      {
        title: "Ihr Gedankenprotokoll",
        bullets: ["Situation notieren", "Gedanken & Gefühle festhalten", "Alternativgedanken formulieren", "Wirkung beobachten"],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "Situation notieren", description: "Was war los? Wo, wann, mit wem?" },
          { title: "Gedanken & Gefühle", description: "Was ging Ihnen durch den Kopf? Wie haben Sie sich gefühlt (0–100)?" },
          { title: "Alternative formulieren", description: "Welcher Gedanke wäre realistischer und hilfreicher?" },
          { title: "Wirkung beobachten", description: "Wie verändert sich Gefühl & Verhalten?" },
        ] },
      },
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
      {
        title: "SORKC – Was ist das?",
        bullets: ["Strukturierte Analyse von Verhalten", "Verstehen, warum etwas auftritt", "Gemeinsame Ausarbeitung"],
        layout: "headline", iconKey: "lightbulb",
        layoutData: { headline: "Verhalten verstehen, statt bewerten.", subline: "SORKC hilft, Muster sichtbar zu machen." },
      },
      {
        title: "Die fünf Bausteine",
        bullets: ["S – Stimulus", "O – Organismus", "R – Reaktion", "K – Kontingenz", "C – Konsequenzen"],
        layout: "model", iconKey: "steps",
        layoutData: { nodes: [
          { label: "S", description: "Stimulus" },
          { label: "O", description: "Organismus" },
          { label: "R", description: "Reaktion" },
          { label: "K", description: "Kontingenz" },
          { label: "C", description: "Konsequenz" },
        ] },
      },
      {
        title: "S – Stimulus",
        bullets: ["Auslösende Situation", "Innen oder außen", "Konkret beobachtbar"],
        layout: "bullets", iconKey: "target",
      },
      {
        title: "O – Organismus",
        bullets: ["Körper, Biografie, Lerngeschichte", "Überzeugungen & Schemata", "Aktueller Zustand"],
        layout: "bullets", iconKey: "heart",
      },
      {
        title: "R – Reaktion",
        bullets: ["Gedanken", "Gefühle", "Verhalten", "Körperliche Reaktion"],
        layout: "bullets", iconKey: "brain",
      },
      {
        title: "C – Konsequenzen",
        bullets: ["Kurzfristig vs. langfristig", "Positiv oder negativ"],
        layout: "before-after", iconKey: "scale",
        layoutData: {
          before: { title: "Kurzfristig", items: ["Erleichterung", "Sicherheit", "Vermeidung von Unangenehmem"] },
          after:  { title: "Langfristig",  items: ["Aufrechterhaltung des Problems", "Eingeschränkter Spielraum", "Verlust von Werten"] },
        },
      },
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
      {
        title: "Was sind Werte?",
        bullets: ["Richtungen, nicht Ziele", "Was zählt im Leben?", "Frei wählbar"],
        layout: "headline", iconKey: "compass",
        layoutData: { headline: "Werte sind Himmelsrichtungen.", subline: "Sie zeigen, wohin – nicht, wann man ankommt." },
      },
      {
        title: "Zentrale Lebensbereiche",
        bullets: ["Beziehung & Familie", "Beruf & Bildung", "Gesundheit & Körper", "Freizeit & Spiritualität"],
        layout: "model", iconKey: "compass",
        layoutData: { nodes: [
          { label: "Beziehung", description: "Familie, Freundschaft" },
          { label: "Beruf", description: "Arbeit, Bildung" },
          { label: "Gesundheit", description: "Körper, Selbstfürsorge" },
          { label: "Freizeit", description: "Sinn, Spiritualität" },
        ] },
      },
      {
        title: "Werte vs. Ziele",
        bullets: ["Wert: 'liebevoller Partner sein'", "Ziel: 'heute Abend zuhören'", "Werte sind nie 'erledigt'"],
        layout: "before-after", iconKey: "scale",
        layoutData: {
          before: { title: "Ziel", items: ["Konkret & messbar", "Hat ein Ende", "'Heute Abend zuhören'"] },
          after:  { title: "Wert", items: ["Richtung & Haltung", "Niemals 'fertig'", "'Liebevoller Partner sein'"] },
        },
      },
      {
        title: "Übung: Kompassrose",
        bullets: ["Pro Bereich 1–2 Werte notieren", "Wichtigkeit (1–10)", "Aktuelle Lebenszufriedenheit (1–10)", "Diskrepanz erkennen"],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "Werte benennen", description: "1–2 Werte pro Lebensbereich aufschreiben." },
          { title: "Wichtigkeit bewerten", description: "Wie wichtig ist mir dieser Bereich (1–10)?" },
          { title: "Zufriedenheit bewerten", description: "Wie sehr lebe ich dort meine Werte (1–10)?" },
          { title: "Diskrepanz erkennen", description: "Wo ist die Lücke am größten? Dort ansetzen." },
        ] },
      },
      {
        title: "Erste Schritte",
        bullets: ["Kleine Handlung pro Bereich", "Diese Woche umsetzen", "Beobachten, was geschieht"],
        layout: "question", iconKey: "question",
        layoutData: { headline: "Welcher kleine Schritt passt zu meinem Wert?", subline: "Diese Woche – konkret, machbar, sichtbar." },
      },
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
      {
        title: "Gedanken sind Worte, keine Wahrheit",
        bullets: ["Wir sind nicht unsere Gedanken", "Beobachten statt glauben"],
        layout: "headline", iconKey: "brain",
        layoutData: { headline: "Ich habe Gedanken – ich bin sie nicht.", subline: "Beobachten, ohne sich zu identifizieren." },
      },
      {
        title: "Klassische Übungen",
        bullets: ["'Ich habe den Gedanken, dass …'", "Gedanken laut singen", "Gedanken-Bus-Metapher"],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "'Ich habe den Gedanken, dass …'", description: "Den Satz vor jeden belastenden Gedanken setzen." },
          { title: "Singen oder verfremden", description: "Gedanken in einer Cartoon-Stimme aussprechen – nimmt Schärfe." },
          { title: "Bus-Metapher", description: "Gedanken sind Fahrgäste – Sie sitzen am Steuer." },
        ] },
      },
      {
        title: "Im Alltag",
        bullets: ["Gedanken benennen", "Distanz spüren", "Trotzdem werteorientiert handeln"],
        layout: "question", iconKey: "question",
        layoutData: { headline: "Was würde ich tun, wenn dieser Gedanke nicht im Weg stünde?", subline: "Defusion bedeutet handeln können – auch mit dem Gedanken." },
      },
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
      {
        title: "Was sind Modi?",
        bullets: ["Aktuelle innere Zustände", "Wechseln je nach Situation", "Können erkannt werden"],
        layout: "headline", iconKey: "hands",
        layoutData: { headline: "In uns leben viele Anteile.", subline: "Modi sind Zustände – keine Persönlichkeit." },
      },
      {
        title: "Kind-Modi",
        bullets: ["Verletzliches Kind", "Wütendes Kind", "Glückliches Kind"],
        layout: "model", iconKey: "heart",
        layoutData: { nodes: [
          { label: "Verletzlich", description: "traurig, ängstlich" },
          { label: "Wütend", description: "Bedürfnisse unerfüllt" },
          { label: "Glücklich", description: "geborgen, frei" },
        ] },
      },
      {
        title: "Eltern-Modi",
        bullets: ["Strafender Elternteil", "Fordernder Elternteil"],
        layout: "before-after", iconKey: "scale",
        layoutData: {
          before: { title: "Strafender Elternteil", items: ["'Du bist falsch'", "Scham, Schuld", "Selbstabwertung"] },
          after:  { title: "Fordernder Elternteil", items: ["'Du musst mehr leisten'", "Druck, Erschöpfung", "Perfektionismus"] },
        },
      },
      {
        title: "Bewältigungs-Modi",
        bullets: ["Vermeider", "Überkompensierer", "Erdulder"],
        layout: "model", iconKey: "shield",
        layoutData: { nodes: [
          { label: "Vermeider", description: "weicht aus" },
          { label: "Überkompensierer", description: "kämpft, kontrolliert" },
          { label: "Erdulder", description: "fügt sich" },
        ] },
      },
      {
        title: "Gesunder Erwachsener",
        bullets: ["Ziel der Therapie", "Stärken, schützen, klären"],
        layout: "question", iconKey: "sun",
        layoutData: { headline: "Was würde mein gesunder Erwachsener jetzt tun?", subline: "Stärken, schützen, klären – mit Mitgefühl." },
      },
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
      {
        title: "Was ist Achtsamkeit?",
        bullets: ["Bewusste Aufmerksamkeit im Hier & Jetzt", "Ohne Bewertung", "Annehmend"],
        layout: "headline", iconKey: "leaf",
        layoutData: { headline: "Hier sein. Jetzt. Ohne Urteil.", subline: "Aufmerksamkeit bewusst lenken – immer wieder." },
      },
      {
        title: "Wirkung",
        bullets: ["Reduziert Grübeln", "Reguliert Emotionen", "Erhöht Selbstmitgefühl"],
        layout: "model", iconKey: "heart",
        layoutData: { nodes: [
          { label: "Weniger Grübeln", description: "Gedankenkarussell stoppt" },
          { label: "Bessere Regulation", description: "Emotionen ebben ab" },
          { label: "Mehr Mitgefühl", description: "freundlich mit sich selbst" },
        ] },
      },
      {
        title: "Atemanker",
        bullets: ["3 Minuten täglich starten", "Atem in Bauch beobachten", "Sanft zurückkehren bei Ablenkung"],
        layout: "steps", iconKey: "breath",
        layoutData: { steps: [
          { title: "Bequem sitzen", description: "Aufrecht, entspannt, Augen weich oder geschlossen." },
          { title: "Atem beobachten", description: "Spüren, wie der Bauch sich hebt und senkt." },
          { title: "Ablenkung bemerken", description: "Gedanken kommen – freundlich zurück zum Atem." },
          { title: "3 Minuten täglich", description: "Lieber kurz und regelmäßig als selten und lang." },
        ] },
      },
      {
        title: "Bodyscan",
        bullets: ["Kopf bis Fuß", "Empfindungen wahrnehmen", "Nichts verändern müssen"],
        layout: "bullets", iconKey: "leaf",
      },
      {
        title: "Im Alltag",
        bullets: ["Achtsam essen, gehen, zuhören", "Mini-Pausen einbauen"],
        layout: "question", iconKey: "question",
        layoutData: { headline: "Wo kann ich heute eine Mini-Pause einbauen?", subline: "Drei bewusste Atemzüge genügen." },
      },
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
      {
        title: "Angst ist ein Schutzmechanismus",
        bullets: ["Evolutionär sinnvoll", "Aktiviert Kampf/Flucht/Erstarrung"],
        layout: "headline", iconKey: "shield",
        layoutData: { headline: "Angst will uns schützen.", subline: "Sie ist ein Alarm – nicht der Feind." },
      },
      {
        title: "Körperliche Reaktionen",
        bullets: ["Herzrasen, Schwitzen, Atem", "Muskelspannung", "Tunnelblick"],
        layout: "bullets", iconKey: "heart",
      },
      {
        title: "Teufelskreis der Angst",
        bullets: ["Auslöser → Körperreaktion", "Bewertung 'gefährlich'", "Verstärkte Reaktion", "Vermeidung hält aufrecht"],
        layout: "vicious-cycle", iconKey: "cycle",
        layoutData: {
          centerLabel: "Angst",
          cycleNodes: [
            { label: "Auslöser", description: "Situation oder Körpergefühl" },
            { label: "Bewertung", description: "'Gefährlich!'" },
            { label: "Körper", description: "Herzrasen, Atemnot" },
            { label: "Vermeidung", description: "kurzfristige Erleichterung" },
          ],
        },
      },
      {
        title: "Was hilft",
        bullets: ["Konfrontation in kleinen Schritten", "Atemtechniken", "Realitätscheck der Gedanken"],
        layout: "model", iconKey: "lightbulb",
        layoutData: { nodes: [
          { label: "Konfrontation", description: "Schritt für Schritt" },
          { label: "Atem", description: "verlangsamt das System" },
          { label: "Gedanken prüfen", description: "Realitätscheck" },
        ] },
      },
      {
        title: "Ihr nächster Schritt",
        bullets: ["Angsthierarchie aufstellen", "Mit kleinster Stufe beginnen", "Erfolg notieren"],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "Angsthierarchie", description: "Situationen nach Belastung (0–100) ordnen." },
          { title: "Kleinste Stufe wählen", description: "Etwas, das machbar, aber spürbar ist." },
          { title: "Üben & bleiben", description: "Bis die Angst von selbst nachlässt." },
          { title: "Erfolg festhalten", description: "Notieren – was war anders als erwartet?" },
        ] },
      },
    ],
  },
  {
    id: "emotionswahrnehmung",
    title: "Emotionswahrnehmung – Gefühle erkennen & verstehen",
    approach: "Andere",
    category: "Psychoedukation",
    tags: ["Emotionen", "Achtsamkeit", "Selbstwahrnehmung"],
    description: "Grundlagen der Emotionswahrnehmung: Was sind Emotionen, wie zeigen sie sich und wie kann ich sie erkennen?",
    slides: [
      {
        title: "Was sind Emotionen?",
        bullets: ["Kurze, intensive innere Reaktionen", "Immer mit Körper, Gedanken & Verhalten verbunden", "Sie haben eine Botschaft – nie ohne Grund"],
        layout: "headline", iconKey: "heart",
        layoutData: { headline: "Emotionen sind Boten – keine Feinde.", subline: "Sie zeigen, was uns wichtig ist und was wir brauchen." },
      },
      {
        title: "Die vier Bausteine jeder Emotion",
        bullets: ["Körper – Empfindung", "Gedanken – Bewertung", "Handlungsimpuls – Tendenz", "Ausdruck – Mimik, Stimme"],
        layout: "model", iconKey: "brain",
        layoutData: { nodes: [
          { label: "Körper", description: "Herzklopfen, Enge, Wärme, Druck" },
          { label: "Gedanken", description: "'Das ist unfair', 'Ich schaffe das nicht'" },
          { label: "Impuls", description: "fliehen, kämpfen, erstarren, annähern" },
          { label: "Ausdruck", description: "Stirn runzeln, Lächeln, Schultern hängen" },
        ] },
      },
      {
        title: "Grundemotionen",
        bullets: ["Freude – etwas Wertvolles geschieht", "Trauer – etwas geht verloren", "Wut – eine Grenze wird überschritten", "Angst – etwas wird bedrohlich", "Ekel – etwas ist abstoßend", "Scham – ich fühle mich falsch"],
        layout: "bullets", iconKey: "heart",
      },
      {
        title: "Was Emotionen uns sagen – Beispiele",
        bullets: ["Wut: 'Hier ist eine Grenze'", "Angst: 'Pass auf'", "Trauer: 'Etwas Wichtiges fehlt'", "Scham: 'Ich gehöre vielleicht nicht dazu'", "Freude: 'Mehr davon!'"],
        layout: "before-after", iconKey: "lightbulb",
        layoutData: {
          before: { title: "Emotion bekämpfen", items: ["'Ich darf nicht traurig sein'", "Unterdrücken", "Ablenkung, Substanzen", "Spannung wächst"] },
          after:  { title: "Emotion hören",      items: ["'Was will mir das sagen?'", "Spüren & benennen", "Bedürfnis erkennen", "Spannung sinkt"] },
        },
      },
      {
        title: "Körperlandkarte der Gefühle",
        bullets: ["Angst: Brust eng, Hände kalt", "Wut: Kiefer, Fäuste, Hitze", "Trauer: schwere Brust, Tränen, Müdigkeit", "Freude: weit, leicht, warm", "Scham: heißes Gesicht, Blick gesenkt"],
        layout: "model", iconKey: "heart",
        layoutData: { nodes: [
          { label: "Angst", description: "Brust eng, Atem flach, Hände kalt" },
          { label: "Wut", description: "Kiefer fest, Hitze, Druck im Kopf" },
          { label: "Trauer", description: "Schwere, Tränen, Müdigkeit" },
          { label: "Scham", description: "heißes Gesicht, Blick nach unten" },
        ] },
      },
      {
        title: "Warum wir Emotionen oft nicht spüren",
        bullets: ["Frühe Botschaft: 'Sei nicht so empfindlich'", "Schutz vor Schmerz", "Dauerstress betäubt", "Kopf statt Körper – wir denken statt fühlen"],
        layout: "vicious-cycle", iconKey: "cycle",
        layoutData: {
          centerLabel: "Gefühl unklar",
          cycleNodes: [
            { label: "Gefühl entsteht", description: "leise im Körper" },
            { label: "Wegdrücken", description: "ablenken, rationalisieren" },
            { label: "Spannung staut", description: "Körper wird laut" },
            { label: "Überflutung", description: "plötzlich 'zu viel'" },
          ],
        },
      },
      {
        title: "Übung: Emotions-Check-in (3 Minuten)",
        bullets: ["Innehalten", "Körper scannen", "Benennen: 'Ich fühle gerade …'", "Bedürfnis erkennen"],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "Innehalten", description: "Stoppen, was Sie tun. 3 bewusste Atemzüge." },
          { title: "Körper scannen", description: "Wo spüre ich etwas? Eng, warm, schwer, kribbelnd?" },
          { title: "Benennen", description: "'Ich fühle gerade Anspannung / Trauer / Ärger / …'. Bewerten Sie nichts." },
          { title: "Bedürfnis erkennen", description: "Was bräuchte ich gerade? Ruhe, Nähe, Klarheit, Pause?" },
        ] },
      },
      {
        title: "Beispiele für Gefühlsworte",
        bullets: ["Statt 'gut': zufrieden, geborgen, stolz, neugierig", "Statt 'schlecht': enttäuscht, einsam, gekränkt, hilflos", "Statt 'gestresst': überfordert, gereizt, ängstlich, müde"],
        layout: "before-after", iconKey: "scale",
        layoutData: {
          before: { title: "Vage", items: ["'Mir geht's gut'", "'Mir geht's schlecht'", "'Ich bin gestresst'", "'Komisches Gefühl'"] },
          after:  { title: "Präzise", items: ["'Ich fühle mich erleichtert und stolz'", "'Ich bin enttäuscht und einsam'", "'Ich bin überfordert und gereizt'", "'Ich fühle Unsicherheit und leise Angst'"] },
        },
      },
      {
        title: "Primär- vs. Sekundäremotion",
        bullets: ["Primär: erste, echte Reaktion (z. B. Verletzung)", "Sekundär: Gefühl über das Gefühl (z. B. Wut über die Verletzung)", "Heilung beginnt bei der Primäremotion"],
        layout: "before-after", iconKey: "lightbulb",
        layoutData: {
          before: { title: "Sichtbar – Sekundär", items: ["Wut", "Zynismus", "Rückzug", "Reizbarkeit"] },
          after:  { title: "Darunter – Primär",   items: ["Verletzung", "Angst", "Trauer", "Sehnsucht"] },
        },
      },
      {
        title: "Reflexion",
        bullets: ["Welche Emotion fällt mir leicht?", "Welche meide ich?", "Welche Botschaft habe ich heute übersehen?"],
        layout: "question", iconKey: "question",
        layoutData: { headline: "Was fühle ich gerade – wirklich?", subline: "Nicht bewerten. Nur bemerken. Das ist schon der erste Schritt." },
      },
    ],
  },
  {
    id: "emotionsregulation",
    title: "Emotionsregulation – Mit Gefühlen umgehen",
    approach: "Andere",
    category: "Intervention",
    tags: ["Emotionen", "Skills", "DBT", "Selbstregulation"],
    description: "Praktische Strategien zur Regulation starker Emotionen – von Skills über Akzeptanz bis Werteorientierung.",
    slides: [
      {
        title: "Was heißt Emotionsregulation?",
        bullets: ["Nicht: Gefühle wegmachen", "Sondern: bewusst damit umgehen", "Intensität & Dauer beeinflussen"],
        layout: "headline", iconKey: "scale",
        layoutData: { headline: "Regulieren heißt nicht unterdrücken.", subline: "Es heißt: fühlen können, ohne überflutet zu werden." },
      },
      {
        title: "Das emotionale Netzwerk",
        bullets: [
          "Emotionen entstehen im ganzen Körper – nicht nur im Kopf",
          "Kopf, Herz und Bauch sind ständig verbunden",
          "Jede Emotion hat einen Ort, an dem du sie spürst",
          "Wahrnehmen ist der erste Schritt zur Regulation",
        ],
        notes: "Bild zeigen und Patient:in fragen: 'Wo spürst du gerade was?' – körperliche Verortung üben.",
        layout: "image", iconKey: "heart",
        layoutData: {
          imageSrc: emotionalesNetzwerkImg,
          imageAlt: "Stilisierte Figur mit den drei Zentren Kopf, Herz, Bauch und vier umgebenden Emotionen",
          imageCaption: "Kopf, Herz, Bauch – verbunden durch Nervensystem und Atem.",
        },
      },
      {
        title: "Das Gehirn unter Stress",
        bullets: [
          "Amygdala = Alarmzentrale – schaltet bei Gefahr blitzschnell an",
          "Präfrontaler Kortex = Vernunft – wird unter Stress 'offline'",
          "Hippocampus = Gedächtnis – ordnet Erfahrungen ein",
          "Skills holen den Kortex zurück online",
        ],
        notes: "Erklären: 'Wenn die Amygdala feuert, schaltet das Denken ab. Skills sind Werkzeuge, die das Denken wieder anschalten.'",
        layout: "image", iconKey: "brain",
        layoutData: {
          imageSrc: gehirnAmygdalaImg,
          imageAlt: "Querschnitt eines Gehirns mit hervorgehobener Amygdala, Hippocampus und präfrontalem Kortex",
          imageCaption: "Bei Stress übernimmt die Amygdala – mit Skills aktivieren wir den präfrontalen Kortex zurück.",
        },
      },
      {
        title: "Das Toleranzfenster",
        bullets: ["Innerhalb: handlungsfähig, klar", "Übererregung: Panik, Wut, Flucht", "Untererregung: Leere, Erstarrung, Taubheit", "Ziel: zurück ins Fenster"],
        layout: "model", iconKey: "scale",
        layoutData: { nodes: [
          { label: "Übererregung", description: "Herzrasen, Panik, Wut, Hyperaktivität" },
          { label: "Toleranzfenster", description: "ruhig, klar, präsent, handlungsfähig" },
          { label: "Untererregung", description: "Leere, Taubheit, Dissoziation, Erschöpfung" },
        ] },
      },
      {
        title: "Vier Wege der Regulation",
        bullets: ["Situation verändern", "Aufmerksamkeit lenken", "Bewertung verändern", "Reaktion modulieren"],
        layout: "model", iconKey: "compass",
        layoutData: { nodes: [
          { label: "Situation", description: "raus, Pause, Grenze setzen" },
          { label: "Aufmerksamkeit", description: "ablenken, fokussieren" },
          { label: "Bewertung", description: "Gedanken prüfen, umdeuten" },
          { label: "Reaktion", description: "Atem, Skills, Bewegung" },
        ] },
      },
      {
        title: "Skills bei Hochanspannung (über 70 %)",
        bullets: ["Eiswasser ins Gesicht – Tauchreflex", "Crushed Ice in der Hand", "Treppen rauf-runter, Sprints", "Scharfes lutschen (Chili, Ingwer)", "Igelball, Gummiband"],
        layout: "bullets", iconKey: "shield",
      },
      {
        title: "Skills bei mittlerer Anspannung",
        bullets: ["4-7-8-Atmung", "5-4-3-2-1 Sinne (sehen, hören, fühlen, riechen, schmecken)", "Kalt duschen, Hände in kaltes Wasser", "Bewegung an der frischen Luft", "Musik – aktivierend oder beruhigend"],
        layout: "steps", iconKey: "breath",
        layoutData: { steps: [
          { title: "4-7-8-Atmung", description: "4 Sek einatmen, 7 Sek halten, 8 Sek ausatmen. 4 Runden." },
          { title: "5-4-3-2-1", description: "5 Dinge sehen, 4 hören, 3 fühlen, 2 riechen, 1 schmecken." },
          { title: "Kälte", description: "Hände/Gesicht in kaltes Wasser – aktiviert den Vagus." },
          { title: "Bewegung", description: "10 Min Spaziergang reduziert Cortisol messbar." },
        ] },
      },
      {
        title: "Skills bei Untererregung / Leere",
        bullets: ["Aktivierende Musik", "Kaltes Gesicht waschen", "Riechen: Pfefferminz, Zitrone", "Mit jemandem sprechen", "Kleine Bewegung – aufstehen, dehnen"],
        layout: "bullets", iconKey: "sun",
      },
      {
        title: "STOP – die Notbremse",
        bullets: ["S – Stopp", "T – Tief atmen", "O – Observieren (was ist gerade?)", "P – Plan, dann handeln"],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "S – Stopp", description: "Bewegung anhalten. Innerlich 'STOP' sagen." },
          { title: "T – Tief atmen", description: "3 langsame Atemzüge, Ausatmen länger als Einatmen." },
          { title: "O – Observieren", description: "Was spüre ich im Körper? Was denke ich? Was ist die Situation?" },
          { title: "P – Plan", description: "Was wäre jetzt klug? Was passt zu meinen Werten?" },
        ] },
      },
      {
        title: "Gedanken regulieren – Beispiele",
        bullets: ["'Ich halte das nicht aus' → 'Es ist gerade unangenehm – und es geht vorbei'", "'Ich bin allein' → 'Gerade fühle ich mich allein – wer ist erreichbar?'", "'Alles ist sinnlos' → 'Im Moment fehlt mir der Sinn – das ist ein Symptom'"],
        layout: "before-after", iconKey: "brain",
        layoutData: {
          before: { title: "Verstärkender Gedanke", items: ["'Ich halte das nicht aus'", "'Das hört nie auf'", "'Ich bin schwach'", "'Niemand versteht mich'"] },
          after:  { title: "Regulierender Gedanke", items: ["'Es ist gerade schwer – und es ist eine Welle'", "'Auch dieses Gefühl wird sich verändern'", "'Ich darf gerade Hilfe brauchen'", "'Ich kann jemandem schreiben'"] },
        },
      },
      {
        title: "Akzeptanz statt Kampf",
        bullets: ["Widerstand verstärkt das Gefühl", "Akzeptieren ≠ gutheißen", "'Es ist gerade so – und das darf sein'", "Welle reiten statt dagegen schwimmen"],
        layout: "vicious-cycle", iconKey: "cycle",
        layoutData: {
          centerLabel: "Leiden",
          cycleNodes: [
            { label: "Schmerz", description: "unvermeidlich" },
            { label: "Widerstand", description: "'darf nicht sein'" },
            { label: "Anspannung wächst", description: "Körper kämpft" },
            { label: "Mehr Schmerz", description: "Schmerz × Widerstand" },
          ],
        },
      },
      {
        title: "Werteorientiert handeln – auch im Sturm",
        bullets: ["Frage: 'Was ist mir wichtig – auch wenn ich so fühle?'", "Kleinste werteorientierte Handlung wählen", "Gefühl darf mitfahren – aber nicht steuern"],
        layout: "question", iconKey: "compass",
        layoutData: { headline: "Was würde ich tun, wenn dieses Gefühl mich nicht steuert?", subline: "Werte zeigen die Richtung – Skills tragen durch den Sturm." },
      },
      {
        title: "Langfristig: Resilienz aufbauen",
        bullets: ["Schlaf, Bewegung, Ernährung, Substanzen", "Soziale Verbindung pflegen", "Tägliche Achtsamkeit", "Angenehme Aktivitäten einplanen", "Selbstmitgefühl üben"],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "Körper pflegen", description: "Schlaf 7–9h, Bewegung, regelmäßig essen, Substanzen reduzieren." },
          { title: "Verbinden", description: "1× pro Tag echten Kontakt – Anruf, Treffen, Nachricht." },
          { title: "Achtsamkeit", description: "5–10 Min täglich – Atem, Bodyscan, Spaziergang ohne Handy." },
          { title: "Genuss & Sinn", description: "1 angenehme + 1 sinnvolle Aktivität pro Tag eintragen." },
          { title: "Selbstmitgefühl", description: "'Wie würde ich mit einer Freund:in sprechen?'" },
        ] },
      },
      {
        title: "Mein Notfallplan",
        bullets: ["Frühwarnzeichen erkennen", "3 Skills für Hochanspannung", "3 Personen, die ich anrufen kann", "Professionelle Hilfe griffbereit"],
        layout: "question", iconKey: "shield",
        layoutData: { headline: "Was ist mein Plan, bevor die Welle kommt?", subline: "Vorher denken – damit ich im Sturm nicht denken muss." },
      },
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
      {
        title: "Depression ist eine Erkrankung",
        bullets: ["Nicht 'schwach sein'", "Komplexe Ursachen", "Behandelbar"],
        layout: "headline", iconKey: "sun",
        layoutData: { headline: "Depression ist keine Schwäche.", subline: "Sie ist eine Erkrankung – und sie ist behandelbar." },
      },
      {
        title: "Symptome",
        bullets: ["Niedergeschlagenheit, Antriebslosigkeit", "Interessenverlust", "Schlaf, Konzentration, Appetit"],
        layout: "bullets", iconKey: "heart",
      },
      {
        title: "Negativspirale",
        bullets: ["Weniger Aktivität → weniger Erfolg", "Mehr Grübeln → mehr Niedergeschlagenheit"],
        layout: "vicious-cycle", iconKey: "cycle",
        layoutData: {
          centerLabel: "Depression",
          cycleNodes: [
            { label: "Niedrige Stimmung", description: "Antrieb sinkt" },
            { label: "Rückzug", description: "weniger Aktivität" },
            { label: "Weniger Erfolg", description: "weniger positive Erlebnisse" },
            { label: "Grübeln", description: "Selbstkritik wächst" },
          ],
        },
      },
      {
        title: "Verhaltensaktivierung",
        bullets: ["Kleine angenehme Aktivitäten planen", "Pflicht & Genuss balancieren", "Stimmung beobachten"],
        layout: "before-after", iconKey: "scale",
        layoutData: {
          before: { title: "Warten auf Motivation", items: ["'Wenn ich Lust habe, mache ich es'", "Aktivität sinkt weiter", "Stimmung sinkt"] },
          after:  { title: "Handeln vor Gefühl",   items: ["Kleinen Schritt planen", "Tun – auch ohne Lust", "Stimmung folgt"] },
        },
      },
      {
        title: "Wege heraus",
        bullets: ["Tagesstruktur", "Soziale Kontakte", "Bewegung", "Therapie & ggf. Medikation"],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "Tagesstruktur", description: "Feste Aufsteh- und Essenszeiten geben Halt." },
          { title: "Kleine Aktivitäten", description: "Pro Tag 1 angenehme + 1 sinnvolle Aktivität." },
          { title: "Bewegung", description: "Spaziergang, frische Luft – wirkt nachweislich." },
          { title: "Hilfe annehmen", description: "Therapie, Gespräche, ggf. Medikation." },
        ] },
      },
    ],
  },
  {
    id: "schlaf-depression",
    title: "Schlaf & Zirkadiane Rhythmik bei Depression",
    approach: "KVT-I & Chronotherapie",
    category: "Psychoedukation",
    tags: ["Schlaf", "Zirkadianer Rhythmus", "Depression", "KVT-I", "Lichttherapie", "Schlafhygiene"],
    description: "Visualisiert den Zusammenhang von innerer Uhr, Schlaf und Depression – mit Schaubildern, Modellen und konkreten Interventionen.",
    slides: [
      {
        title: "Schlaf, innere Uhr & Depression",
        bullets: ["Schlaf ist mehr als Erholung", "Die innere Uhr steuert Stimmung mit", "Verstehen ist der erste Schritt"],
        layout: "headline", iconKey: "sun",
        layoutData: { headline: "Wenn die innere Uhr aus dem Takt gerät, leidet auch die Stimmung.", subline: "Schlaf und Depression beeinflussen sich gegenseitig – in beide Richtungen." },
      },
      {
        title: "Was ist die zirkadiane Uhr?",
        bullets: ["≈ 24-Stunden-Rhythmus", "Cortisol weckt uns morgens", "Melatonin macht uns abends müde", "Körpertemperatur sinkt zur Nacht"],
        layout: "image", iconKey: "cycle",
        layoutData: {
          imageSrc: zirkadianeUhrImg,
          imageAlt: "24-Stunden-Uhr mit Cortisol-, Melatonin- und Körpertemperatur-Kurve",
          imageCaption: "Die innere Uhr koordiniert Hormone, Temperatur und Schlafdruck über 24 Stunden.",
        },
      },
      {
        title: "Die zwei Steuerungssysteme",
        bullets: ["Prozess S: Schlafdruck baut sich tagsüber auf", "Prozess C: Innere Uhr taktet Wach- und Schlafphasen", "Beide zusammen ergeben gesunden Schlaf"],
        layout: "model", iconKey: "scale",
        layoutData: { nodes: [
          { label: "Prozess S", description: "Schlafdruck – steigt je länger wir wach sind" },
          { label: "Prozess C", description: "Innere Uhr – gibt den 24h-Takt vor" },
          { label: "Schlaf-Wach-Rhythmus", description: "Stabiler Schlaf entsteht aus dem Zusammenspiel" },
        ] },
      },
      {
        title: "Wie Depression den Schlaf stört",
        bullets: ["Grübeln hält wach", "Frühes Erwachen ist typisch", "Tagesmüdigkeit verstärkt Antriebslosigkeit", "Ein Teufelskreis entsteht"],
        layout: "vicious-cycle", iconKey: "cycle",
        layoutData: {
          centerLabel: "Depression & Schlaf",
          cycleNodes: [
            { label: "Grübeln abends", description: "Gedankenkreisen verzögert das Einschlafen" },
            { label: "Frühes Erwachen", description: "Wach um 3–5 Uhr, kein Wiedereinschlafen" },
            { label: "Tagesmüdigkeit", description: "Energieloch, Konzentrationsprobleme" },
            { label: "Antriebslosigkeit", description: "Weniger Aktivität, weniger Tageslicht" },
          ],
        },
      },
      {
        title: "Gehirn & Schlaf bei Depression",
        bullets: ["SCN: Hauptuhr im Hypothalamus", "Zirbeldrüse: schüttet Melatonin aus", "Präfrontaler Cortex: bei Depression weniger reguliert"],
        layout: "image", iconKey: "brain",
        layoutData: {
          imageSrc: gehirnSchlafImg,
          imageAlt: "Gehirn mit suprachiasmatischem Kern (SCN), Zirbeldrüse und präfrontalem Cortex",
          imageCaption: "Licht aus dem Auge erreicht den SCN – die Hauptuhr taktet Melatonin und Stimmung.",
        },
      },
      {
        title: "Typische Schlafmuster",
        bullets: ["Gesund vs. depressiv", "REM-Schlaf verschiebt sich nach vorne", "Tiefschlaf nimmt ab"],
        layout: "before-after", iconKey: "scale",
        layoutData: {
          before: { title: "Gesunder Schlaf", items: ["Einschlafen < 20 Min", "Stabile Tiefschlafphasen", "REM in der zweiten Nachthälfte", "Erholt aufwachen"] },
          after:  { title: "Schlaf bei Depression", items: ["Langes Einschlafen, Grübeln", "Wenig Tiefschlaf", "REM früher & länger", "Frühes Erwachen, nicht erholt"] },
        },
      },
      {
        title: "Licht als Taktgeber",
        bullets: ["Tageslicht: 10.000–100.000 Lux", "Wohnraum: nur 100–500 Lux", "Morgenlicht stabilisiert die Uhr"],
        layout: "headline", iconKey: "sun",
        layoutData: {
          headline: "Licht ist das stärkste Signal für Ihre innere Uhr.",
          subline: "Schon 20–30 Minuten Morgenlicht im Freien wirken stärker als jede Innenraumbeleuchtung.",
        },
      },
      {
        title: "Schlafhygiene – die 7 Säulen",
        bullets: ["Konkrete, alltagstaugliche Schritte"],
        layout: "steps", iconKey: "shield",
        layoutData: { steps: [
          { title: "Feste Aufstehzeit", description: "Jeden Tag zur gleichen Zeit aufstehen – auch am Wochenende." },
          { title: "Morgenlicht tanken", description: "20–30 Min draußen innerhalb der ersten Stunde nach dem Aufwachen." },
          { title: "Bewegung am Tag", description: "Mindestens 30 Min Aktivität – nicht in den letzten 3 h vor dem Schlaf." },
          { title: "Koffein-Stop ab Mittag", description: "Halbwertszeit ca. 5–6 h – nach 14 Uhr meiden." },
          { title: "Bildschirme dimmen", description: "Letzte Stunde: warmes Licht, Nachtmodus, kein Doomscrolling." },
          { title: "Kühles Schlafzimmer", description: "16–18 °C, dunkel, ruhig – Schlafen statt Arbeiten." },
          { title: "Wind-Down-Routine", description: "30 Min Ritual: Lesen, Atmen, Tee – Signal an Körper & Geist." },
        ] },
      },
      {
        title: "Bett-Restriktion & Stimuluskontrolle (KVT-I)",
        bullets: ["Bett nur für Schlaf", "Schlafzeiten kontrolliert verkürzen"],
        layout: "steps", iconKey: "target",
        layoutData: { steps: [
          { title: "Bett = Schlaf", description: "Nicht lesen, essen, grübeln im Bett – stärkt die Verknüpfung Bett ↔ Schlaf." },
          { title: "Schlaffenster festlegen", description: "Bettzeit auf tatsächlich geschlafene Zeit begrenzen (mind. 5 h)." },
          { title: "20-Minuten-Regel", description: "Wach im Bett? Aufstehen, ruhige Tätigkeit, erst bei Müdigkeit zurück." },
          { title: "Aufstehzeit fix halten", description: "Aufstehzeit ist Anker – Bettzeit erst nach besserem Schlaf erweitern." },
          { title: "Schlaftagebuch führen", description: "Wöchentlich auswerten, Schlaffenster anpassen." },
        ] },
      },
      {
        title: "Chronotherapie-Optionen",
        bullets: ["Gezielte Verschiebung der inneren Uhr", "Wirksam zusätzlich zu KVT & Medikation"],
        layout: "model", iconKey: "lightbulb",
        layoutData: { nodes: [
          { label: "Lichttherapie", description: "10.000 Lux, 30 Min morgens" },
          { label: "Wachtherapie", description: "Partieller Schlafentzug 2. Nachthälfte" },
          { label: "Schlafphasen-Vorverlagerung", description: "Bettzeit schrittweise nach vorne" },
        ] },
      },
      {
        title: "Reflexion",
        bullets: ["Wo steht Ihr Schlaf gerade?"],
        layout: "question", iconKey: "question",
        layoutData: {
          headline: "Welcher Ihrer Schlaf-Bausteine ist gerade am instabilsten?",
          subline: "Aufstehzeit · Morgenlicht · Bewegung · Bildschirme · Wind-Down · Bett-Stimulus",
        },
      },
      {
        title: "Mein Schlaf-Wochenplan",
        bullets: ["Konkrete Umsetzung für die nächste Woche"],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "Aufstehzeit festlegen", description: "Eine feste Uhrzeit für alle 7 Tage – schreiben Sie sie auf." },
          { title: "Morgenlicht-Termin", description: "Täglich 20 Min draußen direkt nach dem Aufstehen einplanen." },
          { title: "Koffein-Cut-off", description: "Letzter Kaffee/Schwarztee spätestens 14:00 Uhr." },
          { title: "Bildschirm-Stopp", description: "60 Min vor Bettzeit Geräte weglegen – Alternative bereitlegen." },
          { title: "Wind-Down ab 21:30", description: "Fester 30-Min-Block: Dusche, Lesen, ruhige Musik." },
          { title: "Schlaftagebuch", description: "Jeden Morgen 1 Min: Bettzeit, Aufstehzeit, Qualität (1–10)." },
        ] },
      },
    ],
  },
  {
    id: "fallkonzept-depression-vt",
    title: "Fallkonzept Depression (VT) – Vollstruktur",
    approach: "KVT",
    category: "Modell",
    tags: ["Fallkonzeption", "Depression", "SORKC", "Becks Triade", "Schemata"],
    description: "Strukturiertes VT-Fallkonzept Depression in 15 didaktischen Slides – als Gerüst für Diagnostik, gemeinsame Erarbeitung mit Patient:innen oder Supervision.",
    slides: [
      {
        title: "Fallkonzept Depression",
        bullets: ["Strukturiertes Verstehen als Grundlage der Behandlung"],
        layout: "headline", iconKey: "compass",
        layoutData: {
          headline: "Vom Symptom zum Verständnis.",
          subline: "Ein VT-Fallkonzept macht sichtbar, was Depression ausgelöst hat – und was sie aufrechterhält.",
        },
      },
      {
        title: "1. Diagnostik & Störungsbild",
        bullets: ["ICD-Diagnose", "Schweregrad", "Episodenverlauf", "Leit- & Zusatzsymptome"],
        layout: "steps", iconKey: "lightbulb",
        layoutData: { steps: [
          { title: "Diagnose nach ICD-10/11", description: "z. B. F32.1 mittelgradige depressive Episode." },
          { title: "Schweregrad", description: "leicht / mittel / schwer – nach Symptomanzahl & Funktionsniveau." },
          { title: "Episodenverlauf", description: "Erstepisode oder rezidivierend? Bisherige Dauer, Remissionen." },
          { title: "Leitsymptome", description: "Gedrückte Stimmung, Antriebsmangel, Interessenverlust." },
          { title: "Zusatzsymptome", description: "Schlaf, Appetit, Konzentration, Schuld, Suizidgedanken (immer erfragen!)." },
        ] },
      },
      {
        title: "2. Aktuelle Problemlage",
        bullets: [
          "Hauptbeschwerden aus Patient:innen-Sicht",
          "Alltagseinschränkungen: Arbeit, soziale Kontakte, Haushalt",
          "Emotionale Lage: Leere, Hoffnungslosigkeit, Überforderung",
          "Körperliche Symptome: Müdigkeit, Schlaf-Wach-Störung, Spannung",
          "Akute Auslöser (falls vorhanden)",
        ],
        layout: "bullets", iconKey: "heart",
      },
      {
        title: "3. Biografische Vulnerabilität",
        bullets: ["Bindung", "Lerngeschichte", "Persönlichkeit", "Frühere Episoden", "Ressourcen"],
        layout: "steps", iconKey: "leaf",
        layoutData: { steps: [
          { title: "Kindheit & Bindung", description: "Emotionale Verfügbarkeit der Bezugspersonen, Sicherheit, Brüche." },
          { title: "Lerngeschichte", description: "Verstärkungsmuster: Wofür gab es Anerkennung – wofür Strafe?" },
          { title: "Persönlichkeitszüge", description: "Perfektionismus, Selbstkritik, Harmoniebedürfnis." },
          { title: "Frühere Episoden", description: "Vorbehandlungen, Auslöser, was hat damals geholfen?" },
          { title: "Biografische Ressourcen", description: "Stabile Beziehungen, Erfolge, Bewältigungserfahrungen." },
        ] },
      },
      {
        title: "4. Auslösende Faktoren (Trigger)",
        bullets: ["Lebensereignisse", "Chronischer Stress", "Überforderung", "Körperliche Faktoren", "Kognitive Trigger"],
        layout: "model", iconKey: "target",
        layoutData: { nodes: [
          { label: "Lebensereignis", description: "Verlust, Trennung, Job" },
          { label: "Chron. Stress", description: "Dauerbelastung, Konflikte" },
          { label: "Überforderung", description: "Anforderung > Ressourcen" },
          { label: "Körperlich", description: "Schlafmangel, Krankheit" },
          { label: "Kognitiv", description: "Misserfolg, Kritik" },
        ] },
      },
      {
        title: "5. Aufrechterhaltender Teufelskreis",
        bullets: ["Negative Gedanken", "Rückzug & Inaktivität", "Verlust positiver Verstärkung", "Niedergeschlagenheit"],
        layout: "vicious-cycle", iconKey: "cycle",
        layoutData: {
          centerLabel: "Depression",
          cycleNodes: [
            { label: "Negative Gedanken", description: "'Ich schaffe nichts'" },
            { label: "Rückzug", description: "Vermeidung, Inaktivität" },
            { label: "Verstärker-Verlust", description: "weniger positive Erfahrungen" },
            { label: "Stimmung sinkt", description: "Antrieb & Energie ↓" },
          ],
        },
      },
      {
        title: "6. Fünf-Ebenen-Modell der Aufrechterhaltung",
        bullets: ["Kognition", "Emotion", "Verhalten", "Körper", "Soziales"],
        layout: "model", iconKey: "brain",
        layoutData: { nodes: [
          { label: "Kognition", description: "neg. autom. Gedanken, Verzerrungen" },
          { label: "Emotion", description: "Niedergeschlagenheit, Taubheit" },
          { label: "Verhalten", description: "Rückzug, Vermeidung" },
          { label: "Körper", description: "Müdigkeit, Schlafstörung" },
          { label: "Sozial", description: "Isolation, weniger Verstärkung" },
        ] },
      },
      {
        title: "7. Becks kognitive Triade",
        bullets: ["Negative Sicht auf das Selbst", "Negative Sicht auf die Welt", "Negative Sicht auf die Zukunft"],
        layout: "model", iconKey: "brain",
        layoutData: { nodes: [
          { label: "Selbst", description: "'Ich bin wertlos'" },
          { label: "Welt", description: "'Niemand mag mich'" },
          { label: "Zukunft", description: "'Es wird nie besser'" },
        ] },
      },
      {
        title: "8. Kognitive Schema-Ebenen",
        bullets: ["Grundannahmen", "Zwischenannahmen", "Automatische Gedanken"],
        layout: "steps", iconKey: "lightbulb",
        layoutData: { steps: [
          { title: "Grundannahmen (Schema)", description: "tief, früh erworben – z. B. 'Ich bin nicht gut genug', 'Ich bin wertlos'." },
          { title: "Zwischenannahmen", description: "Regeln & Bedingungen – z. B. 'Wenn ich versage, werde ich abgelehnt'." },
          { title: "Automatische Gedanken", description: "situationsspezifisch – z. B. 'Das schaffe ich eh nicht'." },
        ] },
      },
      {
        title: "9. SORKC – Verhaltensanalyse",
        bullets: ["S Stimulus", "O Organismus", "R Reaktion", "K Kontingenz", "C Konsequenz"],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "S – Stimulus", description: "z. B. E-Mail vom Chef, soziale Einladung." },
          { title: "O – Organismus", description: "Stimmung, Schema 'wertlos', Schlafmangel, Vorerfahrungen." },
          { title: "R – Reaktion", description: "Gedanke 'Ich versage' · Angst/Leere · Anspannung · Rückzug." },
          { title: "K – Kontingenz", description: "Kurzfristig: Erleichterung durch Vermeidung." },
          { title: "C – Konsequenz", description: "Langfristig: Verstärker fehlen, Selbstwert sinkt, Depression bleibt." },
        ] },
      },
      {
        title: "10. Ressourcen-Landkarte",
        bullets: ["Persönlich", "Sozial", "Extern", "Frühere Bewältigung"],
        layout: "model", iconKey: "hands",
        layoutData: { nodes: [
          { label: "Persönlich", description: "Intelligenz, Humor, Motivation" },
          { label: "Sozial", description: "Familie, Freunde, Therapeut:in" },
          { label: "Extern", description: "Arbeit, Struktur, Wohnen" },
          { label: "Bewältigung", description: "was hat früher geholfen?" },
        ] },
      },
      {
        title: "11. Therapieziele – drei Horizonte",
        bullets: ["Kurzfristig", "Mittelfristig", "Langfristig"],
        layout: "steps", iconKey: "target",
        layoutData: { steps: [
          { title: "Kurzfristig", description: "Aktivierung, Stabilisierung, Suizidalität sichern, Tagesstruktur." },
          { title: "Mittelfristig", description: "Kognitive Umstrukturierung, Aufbau Verstärker, soziale Reintegration." },
          { title: "Langfristig", description: "Schema-Arbeit, Selbstwirksamkeit, Rückfallprophylaxe." },
        ] },
      },
      {
        title: "12. Interventionsbausteine",
        bullets: ["Psychoedukation", "Verhaltensaktivierung", "Kognitive Umstrukturierung", "Problemlösen", "Exposition", "Soziales Training", "Achtsamkeit", "Rückfallprophylaxe"],
        layout: "steps", iconKey: "shield",
        layoutData: { steps: [
          { title: "Psychoedukation", description: "Modell der Depression gemeinsam erarbeiten." },
          { title: "Verhaltensaktivierung", description: "Angenehme + Pflichtaktivitäten planen, Wochenplan." },
          { title: "Kognitive Umstrukturierung", description: "ABC-Modell, Gedankenprotokoll, Realitätsprüfung." },
          { title: "Problemlösetraining", description: "5-Schritte: Definieren → Lösungen → Bewerten → Umsetzen → Prüfen." },
          { title: "Exposition", description: "Bei Vermeidung sozialer/leistungsbezogener Situationen." },
          { title: "Soziales Kompetenztraining", description: "Nein-Sagen, Bedürfnisse äußern, Konflikte." },
          { title: "Achtsamkeit & Akzeptanz", description: "MBCT-Elemente, Selbstmitgefühl." },
          { title: "Rückfallprophylaxe", description: "Frühwarnzeichen, Notfallplan, Booster-Sitzungen." },
        ] },
      },
      {
        title: "13. Verlauf & Rückfallmodell",
        bullets: ["Frühwarnzeichen", "Rückfallgedanken", "Schutzfaktoren", "Notfallplan"],
        layout: "model", iconKey: "shield",
        layoutData: { nodes: [
          { label: "Frühwarnzeichen", description: "Schlaf ↓, Rückzug, Grübeln" },
          { label: "Rückfallgedanken", description: "'Es kommt wieder', 'Ich schaffe es nie'" },
          { label: "Schutzfaktoren", description: "Struktur, Kontakte, Skills" },
          { label: "Notfallplan", description: "Wen anrufen, was tun – schriftlich" },
        ] },
      },
      {
        title: "Reflexion zum Abschluss",
        bullets: ["Welcher aufrechterhaltende Faktor ist aktuell der stärkste Hebel?"],
        layout: "question", iconKey: "question",
        layoutData: {
          headline: "Wo setzen wir zuerst an?",
          subline: "Welcher aufrechterhaltende Faktor wirkt aktuell am stärksten – und ist gleichzeitig veränderbar?",
        },
      },
    ],
  },
  {
    id: "fallkonzept-depression-diagnostik",
    title: "Fallkonzept Depression – 1. Diagnostik / Störungsbild",
    approach: "KVT",
    category: "Psychoedukation",
    tags: ["Diagnostik", "ICD-10", "ICD-11", "Depression", "Symptomatik"],
    description: "Vertiefung zu Punkt 1 des Fallkonzept-Baums: Diagnose, Schweregrad, Episodenverlauf, Leit- und Zusatzsymptome – klinisch ausgearbeitet für die Patientenkommunikation.",
    slides: [
      {
        title: "1. Diagnostik & Störungsbild",
        bullets: ["Diagnose", "Schweregrad", "Episodenverlauf", "Leitsymptome", "Zusatzsymptome"],
        layout: "headline", iconKey: "compass",
        layoutData: {
          headline: "Was genau verstehen wir unter Depression?",
          subline: "Diagnose · Schweregrad · Verlauf · Leit- und Zusatzsymptome",
        },
      },
      {
        title: "Inhalt – die 5 diagnostischen Bausteine",
        bullets: [
          "1.1 Diagnose nach ICD-10 / ICD-11",
          "1.2 Schweregrad",
          "1.3 Episodenverlauf",
          "1.4 Leitsymptome",
          "1.5 Zusatzsymptome",
        ],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "1.1 Diagnose", description: "Klassifikation nach ICD-10 bzw. ICD-11." },
          { title: "1.2 Schweregrad", description: "Leicht – mittel – schwer (mit/ohne psychotische Symptome)." },
          { title: "1.3 Episodenverlauf", description: "Erstepisode oder rezidivierend." },
          { title: "1.4 Leitsymptome", description: "Die diagnostische Haupttrias." },
          { title: "1.5 Zusatzsymptome", description: "Schlaf, Appetit, Konzentration, Schuld, Suizidalität." },
        ] },
      },
      {
        title: "1.1 Diagnose – ICD-10 vs. ICD-11",
        bullets: [
          "ICD-10: F32 (Episode), F33 (rezidivierend)",
          "ICD-11: 6A70 (Episode), 6A71 (rezidivierend)",
        ],
        layout: "before-after", iconKey: "compass",
        layoutData: {
          before: {
            title: "ICD-10 (bisher)",
            items: [
              "F32 – Depressive Episode",
              "F33 – Rezidivierende depressive Störung",
              "Schwere über Symptomanzahl definiert",
              "Trennung Haupt-/Zusatzsymptome",
            ],
          },
          after: {
            title: "ICD-11 (neu)",
            items: [
              "6A70 – Einzelne Episode",
              "6A71 – Rezidivierende Störung",
              "Cluster: affektiv · kognitiv · neurovegetativ",
              "Stärker dimensionale Beurteilung",
            ],
          },
        },
      },
      {
        title: "1.2 Schweregrad – das Spektrum",
        bullets: ["Leicht", "Mittelgradig", "Schwer"],
        layout: "model", iconKey: "scale",
        layoutData: { nodes: [
          { label: "Leicht", description: "2 Leit- + 2 Zusatzsymptome · Alltag mit Mühe bewältigbar" },
          { label: "Mittel", description: "2 Leit- + 3–4 Zusatzsymptome · deutliche Einschränkung" },
          { label: "Schwer", description: "3 Leit- + ≥4 Zusatzsymptome · Alltag kaum möglich, ggf. psychotisch" },
        ] },
      },
      {
        title: "1.3 Episodenverlauf",
        bullets: ["Erstepisode", "Rezidivierend"],
        layout: "before-after", iconKey: "cycle",
        layoutData: {
          before: {
            title: "Erstepisode",
            items: [
              "Erstmaliges Auftreten",
              "Häufig durch klaren Auslöser",
              "Gute Prognose bei früher Behandlung",
              "Psychoedukation besonders wichtig",
            ],
          },
          after: {
            title: "Rezidivierend",
            items: [
              "≥2 Episoden mit Remission dazwischen",
              "Erhöhtes Wiedererkrankungsrisiko",
              "Fokus auf Rückfallprophylaxe",
              "Ggf. Erhaltungstherapie / Medikation",
            ],
          },
        },
      },
      {
        title: "1.4 Leitsymptome – die Haupttrias",
        bullets: ["Gedrückte Stimmung", "Antriebsmangel", "Interessen-/Freudverlust"],
        layout: "model", iconKey: "target",
        layoutData: { nodes: [
          { label: "Stimmung", description: "Gedrückt, traurig, leer – fast täglich, ≥2 Wochen" },
          { label: "Antrieb", description: "Energielosigkeit, schnelle Erschöpfung" },
          { label: "Interesse", description: "Freudverlust an früher wichtigen Aktivitäten (Anhedonie)" },
        ] },
      },
      {
        title: "1.5 Zusatzsymptome – Überblick",
        bullets: [
          "Schlafstörung – Ein-/Durchschlafen, Früherwachen",
          "Appetitveränderung – meist vermindert, Gewichtsverlust",
          "Konzentration – verlangsamtes Denken, Entscheidungsschwäche",
          "Schuldgefühle – unangemessen, oft mit Wertlosigkeitsgefühl",
          "Suizidgedanken – aktiv erfragen, immer ernst nehmen",
        ],
        layout: "bullets", iconKey: "lightbulb",
      },
      {
        title: "1.5 Zusatzsymptome – im Detail",
        bullets: ["Schlaf", "Appetit", "Konzentration", "Schuld", "Suizidalität"],
        layout: "steps", iconKey: "brain",
        layoutData: { steps: [
          { title: "Schlafstörung", description: "Typisch: Früherwachen mit Morgentief. Auch Hypersomnie möglich (atypische Depression)." },
          { title: "Appetitveränderung", description: "Meist Appetitverlust + Gewichtsabnahme. Atypisch: Heißhunger + Zunahme." },
          { title: "Konzentration & Denken", description: "Subjektive 'Vernebelung', Entscheidungsschwierigkeiten, psychomotorische Verlangsamung." },
          { title: "Schuld- & Wertlosigkeitsgefühle", description: "Oft unangemessen, ggf. wahnhaft. Differenzieren von realer Schuld." },
          { title: "Suizidgedanken", description: "Immer aktiv erfragen: Gedanken · Pläne · Vorbereitungen. Notfallplan vereinbaren." },
        ] },
      },
      {
        title: "Diagnostik-Zusammenfassung",
        bullets: ["Symptomdauer ≥2 Wochen", "Funktionseinschränkung", "Subjektiver Leidensdruck", "Differentialdiagnose"],
        layout: "vicious-cycle", iconKey: "shield",
        layoutData: {
          centerLabel: "Diagnose Depression",
          cycleNodes: [
            { label: "Dauer ≥ 2 Wochen", description: "Symptome fast täglich" },
            { label: "Funktionseinschränkung", description: "Beruf, Familie, Alltag" },
            { label: "Leidensdruck", description: "Subjektiv & beobachtbar" },
            { label: "Differentialdiagnose", description: "Bipolar, Trauer, somatisch, Substanz" },
          ],
        },
      },
    ],
  },
  {
    id: "fallkonzept-depression-problemlage",
    title: "Fallkonzept Depression – 2. Aktuelle Problemlage",
    approach: "KVT",
    category: "Psychoedukation",
    tags: ["Problemanalyse", "Beschwerdebild", "Depression", "Alltag"],
    description: "Vertiefung zu Punkt 2 des Fallkonzept-Baums: Hauptprobleme, Alltag, Beziehungen, Beruf, Selbstwert und Emotionsregulation – aus Patientensicht strukturiert.",
    slides: [
      {
        title: "2. Aktuelle Problemlage",
        bullets: ["Hauptprobleme", "Alltag", "Beziehungen", "Beruf", "Selbstwert", "Emotionen"],
        layout: "headline", iconKey: "compass",
        layoutData: {
          headline: "Wo drückt es im Moment am meisten?",
          subline: "Das Beschwerdebild aus Sicht der Patient:in – konkret und alltagsnah.",
        },
      },
      {
        title: "Inhalt – die 6 Problembereiche",
        bullets: [
          "2.1 Hauptprobleme aus Patientensicht",
          "2.2 Alltagsbeeinträchtigung",
          "2.3 Beziehungen & soziales Umfeld",
          "2.4 Beruf & Leistung",
          "2.5 Selbstbild & Selbstwert",
          "2.6 Emotionsregulation",
        ],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "2.1 Hauptprobleme", description: "Was belastet aktuell am stärksten – in eigenen Worten?" },
          { title: "2.2 Alltag", description: "Wie sieht ein typischer Tag aus? Was klappt nicht mehr?" },
          { title: "2.3 Beziehungen", description: "Familie, Partnerschaft, Freundschaften, Rückzug." },
          { title: "2.4 Beruf", description: "Leistungsfähigkeit, Krankschreibung, Arbeitsbelastung." },
          { title: "2.5 Selbstwert", description: "Wie sehe ich mich selbst zurzeit?" },
          { title: "2.6 Emotionen", description: "Welche Gefühle dominieren? Wie gehe ich mit ihnen um?" },
        ] },
      },
      {
        title: "2.1 Hauptprobleme aus Patientensicht",
        bullets: [
          "Was belastet Sie aktuell am stärksten?",
          "Seit wann besteht das Problem?",
          "Was hat sich verändert gegenüber früher?",
          "Was wäre anders, wenn das Problem gelöst wäre?",
        ],
        layout: "question", iconKey: "question",
        layoutData: {
          headline: "Was belastet Sie aktuell am stärksten?",
          subline: "Patient:innen-eigene Worte sind diagnostisch wertvoller als Fachbegriffe.",
        },
      },
      {
        title: "2.2 Alltagsbeeinträchtigung",
        bullets: ["Vorher: funktionierender Alltag", "Jetzt: Reduktion auf das Nötigste"],
        layout: "before-after", iconKey: "scale",
        layoutData: {
          before: {
            title: "Vor der Episode",
            items: [
              "Strukturierter Tagesablauf",
              "Hobbys & Freizeitaktivitäten",
              "Selbstständige Hausarbeit",
              "Körperhygiene routiniert",
            ],
          },
          after: {
            title: "Aktuell",
            items: [
              "Tag zerfällt, kein Rhythmus",
              "Hobbys aufgegeben",
              "Aufschub einfacher Aufgaben",
              "Körperpflege wird Anstrengung",
            ],
          },
        },
      },
      {
        title: "2.3 Beziehungen & soziales Umfeld",
        bullets: ["Familie", "Partnerschaft", "Freundschaften", "Rückzug"],
        layout: "model", iconKey: "hands",
        layoutData: { nodes: [
          { label: "Familie", description: "Konflikte, Schuldgefühle, gefühlte Überforderung der Angehörigen" },
          { label: "Partnerschaft", description: "Distanz, sexuelles Desinteresse, Reizbarkeit" },
          { label: "Freunde", description: "Kontakte werden vermieden, Einladungen abgesagt" },
          { label: "Rückzug", description: "Verstärkt Einsamkeit – aufrechterhaltender Faktor" },
        ] },
      },
      {
        title: "2.4 Beruf & Leistung",
        bullets: [
          "Konzentrations- & Merkschwierigkeiten",
          "Verlangsamtes Arbeiten, häufige Fehler",
          "Erhöhte Krankheitstage / Krankschreibung",
          "Angst vor Arbeitsplatzverlust",
          "Präsentismus: anwesend, aber nicht leistungsfähig",
        ],
        layout: "bullets", iconKey: "target",
      },
      {
        title: "2.5 Selbstbild & Selbstwert",
        bullets: ["Negativ verzerrte Selbstwahrnehmung"],
        layout: "model", iconKey: "heart",
        layoutData: { nodes: [
          { label: "Selbstbild", description: "'Ich bin schwach / ein Versager'" },
          { label: "Weltsicht", description: "'Andere schaffen das, ich nicht'" },
          { label: "Zukunft", description: "'Es wird nie besser'" },
        ] },
      },
      {
        title: "2.6 Emotionsregulation",
        bullets: ["Emotionserkennung", "Ausdruck", "Modulation", "Bewältigung"],
        layout: "steps", iconKey: "breath",
        layoutData: { steps: [
          { title: "Erkennen", description: "Gefühle werden diffus wahrgenommen ('alles grau, leer')." },
          { title: "Ausdrücken", description: "Wenig Sprache für Emotionen, oft Somatisierung." },
          { title: "Modulieren", description: "Grübeln statt Beruhigung, kaum Selbstregulationsstrategien." },
          { title: "Bewältigen", description: "Vermeidung, Rückzug, ggf. Substanzkonsum als Notfallregulation." },
        ] },
      },
      {
        title: "Problemlage – Zusammenfassung",
        bullets: ["Wo Hebel ansetzen?"],
        layout: "vicious-cycle", iconKey: "shield",
        layoutData: {
          centerLabel: "Aktuelle Belastung",
          cycleNodes: [
            { label: "Funktionsverlust", description: "Alltag · Beruf · Hygiene" },
            { label: "Sozialer Rückzug", description: "Einsamkeit verstärkt Symptome" },
            { label: "Selbstabwertung", description: "Negative Selbstsicht" },
            { label: "Emotionsdysregulation", description: "Grübeln statt Bewältigung" },
          ],
        },
      },
      {
        title: "Reflexion",
        bullets: ["Welcher Bereich ist aktuell am stärksten betroffen – und gleichzeitig veränderbar?"],
        layout: "question", iconKey: "question",
        layoutData: {
          headline: "Wo setzen wir zuerst an?",
          subline: "Den Bereich wählen, der hohen Leidensdruck mit guter Veränderbarkeit verbindet.",
        },
      },
    ],
  },
  {
    id: "fallkonzept-depression-diagnostik-indikation",
    title: "Fallkonzept Depression – 3. Diagnostik & Indikation",
    approach: "KVT",
    category: "Psychoedukation",
    tags: ["Diagnostik", "Indikation", "Testverfahren", "Komorbidität", "Setting"],
    description: "Vertiefung zu Punkt 3 des Fallkonzept-Baums: Anamnese, Testdiagnostik, Differentialdiagnose, Komorbidität, Therapieindikation und Setting.",
    slides: [
      {
        title: "3. Diagnostik & Indikation",
        bullets: ["Anamnese", "Tests", "Differentialdiagnose", "Komorbidität", "Indikation", "Setting"],
        layout: "headline", iconKey: "compass",
        layoutData: {
          headline: "Vom Symptom zur Therapieentscheidung.",
          subline: "Wie sichern wir die Diagnose – und wofür entscheiden wir uns dann?",
        },
      },
      {
        title: "Inhalt – 6 Bausteine",
        bullets: [
          "3.1 Anamneseerhebung",
          "3.2 Testdiagnostik",
          "3.3 Differentialdiagnose",
          "3.4 Komorbidität",
          "3.5 Therapieindikation",
          "3.6 Setting & Frequenz",
        ],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "3.1 Anamnese", description: "Eigen-, Fremd-, Familien-, biografische Anamnese." },
          { title: "3.2 Tests", description: "Standardisierte Verfahren zur Schwere- & Verlaufsmessung." },
          { title: "3.3 Differentialdiagnose", description: "Was es sein könnte – und was es nicht ist." },
          { title: "3.4 Komorbidität", description: "Zusatzdiagnosen, die Behandlung beeinflussen." },
          { title: "3.5 Indikation", description: "Psychotherapie · Medikation · kombiniert · stationär?" },
          { title: "3.6 Setting", description: "Einzel/Gruppe, Frequenz, Dauer, Notfallregelungen." },
        ] },
      },
      {
        title: "3.1 Anamneseerhebung",
        bullets: ["Eigenanamnese", "Fremdanamnese", "Familienanamnese", "Biographische Anamnese"],
        layout: "model", iconKey: "compass",
        layoutData: { nodes: [
          { label: "Eigen", description: "Subjektive Sicht: Beschwerden, Verlauf, Auslöser" },
          { label: "Fremd", description: "Angehörige, Hausarzt – Verhaltensbeobachtung" },
          { label: "Familie", description: "Psychische Erkrankungen in der Familie" },
          { label: "Biografisch", description: "Lebenslinie, kritische Ereignisse, Ressourcen" },
        ] },
      },
      {
        title: "3.2 Testdiagnostik",
        bullets: [
          "BDI-II – Beck-Depressions-Inventar (Selbstbeurteilung)",
          "PHQ-9 – Patient Health Questionnaire (Screening & Verlauf)",
          "HAMD/HDRS – Hamilton-Depressions-Skala (Fremdbeurteilung)",
          "SCL-90-R – allgemeine Symptombelastung",
          "Zusätzlich: Suizidalität (z. B. C-SSRS), Komorbidität",
        ],
        layout: "bullets", iconKey: "lightbulb",
      },
      {
        title: "3.3 Differentialdiagnose",
        bullets: ["Was es nicht ist – sorgfältig abgrenzen"],
        layout: "model", iconKey: "scale",
        layoutData: { nodes: [
          { label: "Bipolar", description: "Hypomane/manische Phasen in der Vorgeschichte?" },
          { label: "Anpassungsstörung", description: "Klarer Auslöser, kürzere Dauer, geringere Schwere" },
          { label: "Trauerreaktion", description: "Normaler Trauerverlauf vs. Komplizierte Trauer" },
          { label: "Somatisch / Substanz", description: "Schilddrüse, Anämie, Medikamente, Alkohol" },
        ] },
      },
      {
        title: "3.4 Komorbidität – häufig kombiniert",
        bullets: [
          "Angststörungen (ca. 50 % – häufigste Komorbidität)",
          "Substanzgebrauchsstörungen (Alkohol, Sedativa)",
          "Persönlichkeitsstörungen (v. a. Cluster B/C)",
          "Somatische Erkrankungen (Schmerz, kardiovaskulär, Diabetes)",
          "Schlafstörungen als eigenständige Diagnose",
        ],
        layout: "bullets", iconKey: "shield",
      },
      {
        title: "3.5 Therapieindikation",
        bullets: ["Leichte vs. schwere Depression"],
        layout: "before-after", iconKey: "target",
        layoutData: {
          before: {
            title: "Leicht – mittelgradig",
            items: [
              "Psychotherapie als 1. Wahl (KVT, IPT)",
              "Watchful Waiting bei sehr leichter Form",
              "Aktivierung & Psychoedukation",
              "Medikation optional",
            ],
          },
          after: {
            title: "Schwer / chronisch",
            items: [
              "Kombinationstherapie (Psychotherapie + Antidepressivum)",
              "Stationär bei Suizidalität / fehlender Tagesstruktur",
              "Ggf. EKT bei Therapieresistenz",
              "Eng getaktetes Monitoring",
            ],
          },
        },
      },
      {
        title: "3.6 Setting & Frequenz",
        bullets: ["Setting", "Frequenz", "Dauer", "Notfall"],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "Setting", description: "Einzel · Gruppe · ambulant / teilstationär / stationär." },
          { title: "Frequenz", description: "Akut: 1–2× pro Woche · Erhaltung: 14-tägig · Booster: monatlich." },
          { title: "Dauer", description: "KVT: ca. 25–45 Sitzungen · ggf. Verlängerung bei Komorbidität." },
          { title: "Notfall", description: "Erreichbarkeit, Krisennummern, Notfallplan schriftlich vereinbaren." },
        ] },
      },
      {
        title: "Indikations-Zusammenfassung",
        bullets: ["Vier Säulen der Entscheidung"],
        layout: "vicious-cycle", iconKey: "shield",
        layoutData: {
          centerLabel: "Indikation",
          cycleNodes: [
            { label: "Diagnose gesichert", description: "Kriterien · Tests · DD" },
            { label: "Schweregrad", description: "Leicht · mittel · schwer" },
            { label: "Komorbidität", description: "Beeinflusst Setting & Methode" },
            { label: "Ressourcen", description: "Motivation, Umfeld, Adhärenz" },
          ],
        },
      },
      {
        title: "Reflexion",
        bullets: ["Welches Setting & welche Methode passt zu dieser Person?"],
        layout: "question", iconKey: "question",
        layoutData: {
          headline: "Welche Indikation begründen wir – und warum?",
          subline: "Diagnose · Schwere · Komorbidität · Ressourcen müssen zusammenpassen.",
        },
      },
    ],
  },
  // ============================================================
  // 4. BEHANDLUNG – 6 Vertiefungs-Templates (S3-Leitlinie)
  // ============================================================
  {
    id: "behandlung-psychoedukation",
    title: "Behandlung Depression – 4.1 Psychoedukation",
    approach: "KVT",
    category: "Psychoedukation",
    tags: ["Psychoedukation", "Depression", "Erklärungsmodell"],
    description: "Vertiefungs-Template zur Psychoedukation bei Depression: Krankheitsverständnis, Modelle, Mythen, Verlauf und Wirkfaktoren der Therapie.",
    slides: [
      {
        title: "4.1 Psychoedukation",
        bullets: ["Verstehen, was Depression ist", "Modelle als Landkarte", "Aktive Rolle in der Therapie"],
        layout: "headline", iconKey: "lightbulb",
        layoutData: {
          headline: "Verstehen ist der erste Schritt zur Veränderung.",
          subline: "Psychoedukation = Wissen, das entlastet und handlungsfähig macht.",
        },
      },
      {
        title: "Inhalt der Psychoedukation",
        bullets: ["Was ist Depression?", "Wie entsteht sie?", "Wie verläuft sie?", "Was wirkt?", "Was kann ich tun?"],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "Definition", description: "Symptome, ICD-Kriterien, Abgrenzung zur Trauer." },
          { title: "Entstehung", description: "Vulnerabilitäts-Stress-Modell, Biologie & Lerngeschichte." },
          { title: "Verlauf", description: "Episoden, Rezidive, Chronifizierung – Realistisch & hoffnungsvoll." },
          { title: "Wirkfaktoren", description: "Was hilft: Therapie, Aktivität, Beziehungen, ggf. Medikation." },
          { title: "Selbsthilfe", description: "Eigenanteil – Hausaufgaben, Tagesstruktur, Übungen." },
        ] },
      },
      {
        title: "Vulnerabilitäts-Stress-Modell",
        bullets: ["Anlage + Lerngeschichte + aktueller Stress = Symptomausbruch"],
        layout: "model", iconKey: "scale",
        layoutData: { nodes: [
          { label: "Vulnerabilität", description: "Genetik, Temperament, frühe Prägungen" },
          { label: "Stressoren", description: "Verluste, Konflikte, Überforderung" },
          { label: "Symptome", description: "Episode wird ausgelöst" },
        ] },
      },
      {
        title: "Mythen vs. Fakten",
        bullets: ["Häufige Missverständnisse aufklären"],
        layout: "before-after", iconKey: "brain",
        layoutData: {
          before: { title: "Mythos", items: [
            "'Reiß dich zusammen'",
            "'Depression ist Schwäche'",
            "'Geht von alleine weg'",
            "'Tabletten machen abhängig'",
          ] },
          after: { title: "Fakt", items: [
            "Willenskraft allein reicht nicht",
            "Es ist eine ernste Erkrankung",
            "Unbehandelt oft chronisch",
            "Antidepressiva machen nicht abhängig",
          ] },
        },
      },
      {
        title: "Symptom-Trias",
        bullets: ["Stimmung – Antrieb – Interesse"],
        layout: "model", iconKey: "heart",
        layoutData: { nodes: [
          { label: "Gedrückte Stimmung", description: "Traurigkeit, Leere, Hoffnungslosigkeit" },
          { label: "Antriebsmangel", description: "Erschöpfung, Energielosigkeit" },
          { label: "Interessenverlust", description: "Anhedonie – Freude verschwindet" },
        ] },
      },
      {
        title: "Körperliche Symptome",
        bullets: [
          "Schlafstörungen (Ein-/Durchschlaf, frühes Erwachen)",
          "Appetitveränderungen, Gewichtsverlust",
          "Schmerzen ohne organischen Befund",
          "Libidoverlust",
          "Tagesschwankungen (Morgentief)",
        ],
        layout: "bullets", iconKey: "heart",
      },
      {
        title: "Wie entsteht Depression neurobiologisch?",
        bullets: ["Botenstoffe & Stresssystem im Ungleichgewicht"],
        layout: "model", iconKey: "brain",
        layoutData: { nodes: [
          { label: "Serotonin/Noradrenalin", description: "Stimmung & Antrieb dysreguliert" },
          { label: "HPA-Achse", description: "Chronisch erhöhtes Cortisol" },
          { label: "Hippocampus", description: "Schrumpft bei chronischem Stress" },
          { label: "Neuroplastizität", description: "Therapie & Aktivität bauen wieder auf" },
        ] },
      },
      {
        title: "Verlaufsformen",
        bullets: ["Episodisch · Rezidivierend · Chronisch (Dysthymie)"],
        layout: "steps", iconKey: "cycle",
        layoutData: { steps: [
          { title: "Einzelne Episode", description: "Erstmanifestation, in 50% bleibt es dabei." },
          { title: "Rezidivierend", description: "Mehrere Episoden – Rückfallprophylaxe wichtig." },
          { title: "Chronisch", description: "Symptome >2 Jahre – intensivere Behandlung nötig." },
          { title: "Remission", description: "Symptomfreiheit – Ziel der Akuttherapie." },
        ] },
      },
      {
        title: "Was wirkt? – Säulen der Therapie",
        bullets: [
          "Psychotherapie (KVT, IPT, Schema, ACT)",
          "Pharmakotherapie bei mittel/schwer",
          "Aktivität & Tagesstruktur",
          "Soziale Unterstützung",
          "Bei schwer: ggf. EKT, Lichttherapie, Sport",
        ],
        layout: "bullets", iconKey: "shield",
      },
      {
        title: "Hausaufgabe – Eigenes Modell",
        bullets: [
          "Eigene Vulnerabilitäten notieren",
          "Aktuelle Stressoren auflisten",
          "Frühe Warnzeichen identifizieren",
          "Erste hilfreiche Schritte planen",
        ],
        layout: "bullets", iconKey: "leaf",
      },
      {
        title: "Häufige Hindernisse",
        bullets: ["Was Psychoedukation erschweren kann"],
        layout: "before-after", iconKey: "shield",
        layoutData: {
          before: { title: "Hindernis", items: [
            "'Bei mir ist es anders'",
            "Scham, sich krank zu fühlen",
            "Hoffnungslosigkeit blockiert Aufnahme",
            "Angehörige verstehen nicht",
          ] },
          after: { title: "Lösung", items: [
            "Individuelle Anpassung des Modells",
            "Normalisieren – Krankheit, nicht Charakter",
            "Kleine Erfolge sichtbar machen",
            "Angehörige einbeziehen, Material mitgeben",
          ] },
        },
      },
      {
        title: "Zusammenfassung – Wirkkreis Wissen",
        bullets: ["Verstehen → Entlastung → Mitarbeit → Wirkung"],
        layout: "vicious-cycle", iconKey: "cycle",
        layoutData: {
          centerLabel: "Wissen wirkt",
          cycleNodes: [
            { label: "Verstehen", description: "Was passiert in mir?" },
            { label: "Entlastung", description: "Schuld & Scham nehmen ab" },
            { label: "Mitarbeit", description: "Aktive Therapierolle" },
            { label: "Selbstwirksamkeit", description: "Ich kann etwas tun" },
          ],
        },
      },
      {
        title: "Reflexion",
        bullets: ["Was war heute neu? Was nehmen Sie mit?"],
        layout: "question", iconKey: "question",
        layoutData: {
          headline: "Welches Bild der Depression hatten Sie – welches haben Sie jetzt?",
          subline: "Verstehen ist nicht alles – aber ohne es geht nichts.",
        },
      },
    ],
  },
  {
    id: "behandlung-verhaltensaktivierung",
    title: "Behandlung Depression – 4.2 Verhaltensaktivierung",
    approach: "KVT",
    category: "Intervention",
    tags: ["Verhaltensaktivierung", "Aktivitätsaufbau", "Tagesstruktur"],
    description: "Vertiefungs-Template Verhaltensaktivierung: Aktivitätsanalyse, Aufbau positiver Verstärker, Tagesstruktur, Stufenpläne.",
    slides: [
      {
        title: "4.2 Verhaltensaktivierung",
        bullets: ["Handeln verändert Fühlen", "Kleine Schritte, große Wirkung"],
        layout: "headline", iconKey: "sun",
        layoutData: {
          headline: "Tun, bevor man Lust dazu hat.",
          subline: "Aktivität ist der schnellste Weg aus dem depressiven Sog.",
        },
      },
      {
        title: "Inhalt – Aufbau",
        bullets: ["Modell verstehen", "Aktivitäten erfassen", "Tagesstruktur", "Stufenpläne", "Hindernisse meistern"],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "Modell", description: "Warum Aktivität wirkt – Verstärker-Verlust." },
          { title: "Erfassen", description: "Wochenprotokoll: Was tue ich, wie fühle ich mich?" },
          { title: "Struktur", description: "Tages- und Wochenplan." },
          { title: "Stufen", description: "Vom Leichten zum Anspruchsvollen." },
          { title: "Dranbleiben", description: "Belohnung, Beobachten, Anpassen." },
        ] },
      },
      {
        title: "Modell: Depressionsspirale",
        bullets: ["Weniger Aktivität → weniger Verstärker → mehr Stimmungstief"],
        layout: "vicious-cycle", iconKey: "cycle",
        layoutData: {
          centerLabel: "Depressionsspirale",
          cycleNodes: [
            { label: "Stimmungstief", description: "Antriebslos, freudlos" },
            { label: "Rückzug", description: "Weniger Aktivität & Kontakte" },
            { label: "Verstärker-Verlust", description: "Keine Erfolge, keine Freude" },
            { label: "Negative Gedanken", description: "'Es bringt nichts'" },
          ],
        },
      },
      {
        title: "Vorher – Nachher",
        bullets: ["Was Verhaltensaktivierung verändert"],
        layout: "before-after", iconKey: "scale",
        layoutData: {
          before: { title: "Vorher: Passiv-Modus", items: [
            "Im Bett bleiben",
            "Vermeidung von Pflichten",
            "Sozialer Rückzug",
            "Grübeln dominiert",
          ] },
          after: { title: "Nachher: Aktiv-Modus", items: [
            "Geregelter Tagesablauf",
            "Pflichten in kleinen Schritten",
            "Kontakt halten",
            "Erfolgserlebnisse häufen sich",
          ] },
        },
      },
      {
        title: "Drei Aktivitätstypen",
        bullets: ["Pflicht · Freude · Bewegung"],
        layout: "model", iconKey: "target",
        layoutData: { nodes: [
          { label: "Pflichten (P)", description: "Notwendig – schaffen Selbstwirksamkeit" },
          { label: "Genuss (G)", description: "Angenehm – schaffen Freude" },
          { label: "Bewegung (B)", description: "Körperlich – wirkt direkt antidepressiv" },
        ] },
      },
      {
        title: "Aktivitätsprotokoll",
        bullets: [
          "Stündlich notieren: Was tue ich?",
          "Stimmung 0–10 bewerten",
          "Markieren: P / G / B",
          "Über 1 Woche führen",
        ],
        layout: "bullets", iconKey: "steps",
      },
      {
        title: "Stufenplan – schrittweiser Aufbau",
        bullets: ["Vom Machbaren zum Anspruchsvollen"],
        layout: "steps", iconKey: "target",
        layoutData: { steps: [
          { title: "Stufe 1 – Mikro", description: "Aufstehen, anziehen, Zähne putzen." },
          { title: "Stufe 2 – Basis", description: "Frühstück, kurzer Spaziergang, Anruf." },
          { title: "Stufe 3 – Routine", description: "Haushalt, Sport 20 Min, Treffen." },
          { title: "Stufe 4 – Anspruch", description: "Beruf, Hobby, längere soziale Kontakte." },
        ] },
      },
      {
        title: "Tagesstruktur aufbauen",
        bullets: [
          "Feste Aufsteh- und Schlafenszeit",
          "Mahlzeiten zu festen Zeiten",
          "Eine Pflicht-, eine Genuss-, eine Bewegungs-Aktivität pro Tag",
          "Mini-Pausen bewusst planen",
          "Abendritual zur Beruhigung",
        ],
        layout: "bullets", iconKey: "sun",
      },
      {
        title: "Genussaktivitäten – Liste",
        bullets: [
          "Was hat Ihnen früher Freude gemacht?",
          "Was wäre jetzt machbar – auch in kleiner Form?",
          "5–10 konkrete Aktivitäten sammeln",
          "Kleine, kostenfreie, alltägliche bevorzugen",
        ],
        layout: "bullets", iconKey: "leaf",
      },
      {
        title: "Hausaufgabe – Wochenplan",
        bullets: [
          "3 Aktivitäten pro Tag (P/G/B)",
          "Realistisch & klein wählen",
          "Vorher Stimmung notieren – nachher auch",
          "Erfolge sichtbar machen",
          "Nicht-Erreichtes neutral festhalten",
        ],
        layout: "bullets", iconKey: "steps",
      },
      {
        title: "Häufige Hindernisse",
        bullets: ["Was Verhaltensaktivierung sabotiert"],
        layout: "before-after", iconKey: "shield",
        layoutData: {
          before: { title: "Hindernis", items: [
            "'Erst Lust, dann tun'",
            "Zu große Schritte",
            "Alles-oder-Nichts",
            "Bewertung statt Beobachtung",
          ] },
          after: { title: "Lösung", items: [
            "Tun ohne Lust – Lust folgt nach",
            "In Mini-Schritte zerlegen",
            "Teilerfolge zählen",
            "Stimmung messen, nicht moralisieren",
          ] },
        },
      },
      {
        title: "Zusammenfassung",
        bullets: ["Aktivität als Hebel gegen Depression"],
        layout: "vicious-cycle", iconKey: "cycle",
        layoutData: {
          centerLabel: "Aufwärtsspirale",
          cycleNodes: [
            { label: "Aktivität", description: "Tun – auch ohne Lust" },
            { label: "Verstärker", description: "Erfolg, Freude, Bewegung" },
            { label: "Stimmung steigt", description: "Energie kehrt zurück" },
            { label: "Mehr Aktivität", description: "Selbstverstärkender Kreislauf" },
          ],
        },
      },
      {
        title: "Reflexion",
        bullets: ["Welche eine Aktivität nehmen Sie sich für morgen vor?"],
        layout: "question", iconKey: "question",
        layoutData: {
          headline: "Welcher kleinste Schritt ist heute noch machbar?",
          subline: "Klein genug, dass es nicht scheitern kann.",
        },
      },
    ],
  },
  {
    id: "behandlung-kognitive-therapie",
    title: "Behandlung Depression – 4.3 Kognitive Therapie",
    approach: "KVT",
    category: "Intervention",
    tags: ["Kognitive Umstrukturierung", "Denkfallen", "Beck"],
    description: "Vertiefungs-Template Kognitive Therapie nach Beck: automatische Gedanken, Denkfehler, Schemata, sokratischer Dialog, Gedankenprotokolle.",
    slides: [
      {
        title: "4.3 Kognitive Therapie",
        bullets: ["Gedanken prüfen statt glauben", "Realistischer denken – freier handeln"],
        layout: "headline", iconKey: "brain",
        layoutData: {
          headline: "Nicht die Dinge selbst beunruhigen uns – sondern unsere Sicht auf sie.",
          subline: "Kognitive Therapie nach Aaron T. Beck.",
        },
      },
      {
        title: "Inhalt – Aufbau",
        bullets: ["Modell", "Gedanken erkennen", "Denkfallen", "Sokratischer Dialog", "Umstrukturierung"],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "Kognitives Modell", description: "Situation → Gedanke → Gefühl → Verhalten." },
          { title: "Erkennen", description: "Automatische Gedanken sichtbar machen." },
          { title: "Denkfallen", description: "Typische kognitive Verzerrungen." },
          { title: "Prüfen", description: "Sokratischer Dialog – was stimmt wirklich?" },
          { title: "Umstrukturieren", description: "Hilfreichere Gedanken entwickeln." },
        ] },
      },
      {
        title: "Becks Kognitives Modell",
        bullets: ["Ebenen der Kognition"],
        layout: "model", iconKey: "lightbulb",
        layoutData: { nodes: [
          { label: "Automatische Gedanken", description: "Schnell, situativ, oft unbewusst" },
          { label: "Grundannahmen", description: "Wenn-dann-Regeln" },
          { label: "Schemata", description: "Tiefe Überzeugungen über Selbst/Welt" },
        ] },
      },
      {
        title: "Kognitive Triade der Depression",
        bullets: ["Negative Sicht auf Selbst, Welt, Zukunft"],
        layout: "model", iconKey: "scale",
        layoutData: { nodes: [
          { label: "Selbst", description: "'Ich bin wertlos'" },
          { label: "Welt", description: "'Niemand mag mich'" },
          { label: "Zukunft", description: "'Es wird nie besser'" },
        ] },
      },
      {
        title: "Vorher – Nachher",
        bullets: ["Wie kognitive Arbeit Stimmung verändert"],
        layout: "before-after", iconKey: "scale",
        layoutData: {
          before: { title: "Vor Umstrukturierung", items: [
            "'Ich versage immer'",
            "Hoffnungslosigkeit, Scham",
            "Rückzug, Vermeidung",
          ] },
          after: { title: "Nach Umstrukturierung", items: [
            "'Ich habe heute etwas nicht geschafft – nicht alles'",
            "Enttäuschung, aber handlungsfähig",
            "Nächster Schritt möglich",
          ] },
        },
      },
      {
        title: "Typische Denkfehler",
        bullets: [
          "Schwarz-Weiß-Denken",
          "Übergeneralisierung ('immer', 'nie')",
          "Katastrophisieren",
          "Personalisieren",
          "Gedankenlesen",
          "Gefühl als Beweis ('Ich fühle mich schuldig, also bin ich schuld')",
          "Sollte-Sätze",
        ],
        layout: "bullets", iconKey: "brain",
      },
      {
        title: "Automatische Gedanken erkennen",
        bullets: ["Wann tauchen sie auf? Was hilft beim Erkennen?"],
        layout: "steps", iconKey: "target",
        layoutData: { steps: [
          { title: "Stimmungswechsel bemerken", description: "'Was ging mir gerade durch den Kopf?'" },
          { title: "Wörtlich notieren", description: "Genau so, wie der Gedanke kam." },
          { title: "Glaubwürdigkeit (0–100)", description: "Wie sehr glaube ich das gerade?" },
          { title: "Gefühl & Stärke (0–100)", description: "Was fühle ich – wie stark?" },
        ] },
      },
      {
        title: "Sokratischer Dialog",
        bullets: ["Sieben prüfende Fragen"],
        layout: "bullets", iconKey: "question",
      },
      {
        title: "Sokratische Fragen im Detail",
        bullets: ["Mit dem Gedanken arbeiten"],
        layout: "steps", iconKey: "question",
        layoutData: { steps: [
          { title: "Belege?", description: "Was spricht für, was gegen den Gedanken?" },
          { title: "Alternative?", description: "Wie könnte man es noch sehen?" },
          { title: "Worst/Best/Realistisch?", description: "Was ist das Schlimmste, Beste, Wahrscheinlichste?" },
          { title: "Freund:in?", description: "Was würde ich einer Freundin sagen?" },
          { title: "In 5 Jahren?", description: "Wie wichtig ist das dann noch?" },
        ] },
      },
      {
        title: "5-Spalten-Protokoll",
        bullets: ["Klassisches ABC-Protokoll erweitert"],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "Situation", description: "Was, wo, mit wem?" },
          { title: "Gefühl (0–100)", description: "Welches – wie stark?" },
          { title: "Automatischer Gedanke", description: "Wörtlich – Glaubwürdigkeit (0–100)" },
          { title: "Alternativer Gedanke", description: "Realistischer, hilfreich" },
          { title: "Neue Bewertung", description: "Gefühl jetzt? Glaubwürdigkeit jetzt?" },
        ] },
      },
      {
        title: "Hausaufgabe",
        bullets: [
          "Täglich 1 Gedankenprotokoll",
          "Mindestens 1 Denkfalle identifizieren",
          "Alternativen formulieren",
          "Wirkung auf Stimmung notieren",
        ],
        layout: "bullets", iconKey: "leaf",
      },
      {
        title: "Häufige Hindernisse",
        bullets: ["Was kognitive Arbeit erschwert"],
        layout: "before-after", iconKey: "shield",
        layoutData: {
          before: { title: "Hindernis", items: [
            "'Positives Denken' – wirkt aufgesetzt",
            "Gedanken erscheinen 'wahr'",
            "Emotionen blockieren das Prüfen",
            "Schemata kehren zurück",
          ] },
          after: { title: "Lösung", items: [
            "Realistisch, nicht positiv",
            "Glaubwürdigkeit messen, nicht erzwingen",
            "Zuerst regulieren, dann denken",
            "Wiederholung – Schemaarbeit nötig",
          ] },
        },
      },
      {
        title: "Reflexion",
        bullets: ["Welcher Gedanke begleitet Sie am häufigsten?"],
        layout: "question", iconKey: "question",
        layoutData: {
          headline: "Welcher Gedanke darf ab heute geprüft werden?",
          subline: "Nicht weglassen – nur prüfen.",
        },
      },
    ],
  },
  {
    id: "behandlung-interpersonell",
    title: "Behandlung Depression – 4.4 Interpersonelle Arbeit",
    approach: "IPT",
    category: "Intervention",
    tags: ["IPT", "Beziehungen", "Konflikte", "Rollenwechsel"],
    description: "Vertiefungs-Template Interpersonelle Therapie (IPT): vier Problembereiche, Beziehungsanalyse, Kommunikationstraining.",
    slides: [
      {
        title: "4.4 Interpersonelle Arbeit",
        bullets: ["Depression entsteht & wirkt im Beziehungsraum", "Beziehungen heilen mit"],
        layout: "headline", iconKey: "hands",
        layoutData: {
          headline: "Wir leiden in Beziehungen – und heilen in ihnen.",
          subline: "IPT (Klerman/Weissman): Beziehungen als Hebel der Veränderung.",
        },
      },
      {
        title: "Inhalt – Aufbau",
        bullets: ["IPT-Modell", "Beziehungsanalyse", "Vier Problembereiche", "Kommunikation", "Soziales Netz"],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "Modell", description: "Depression im interpersonellen Kontext." },
          { title: "Inventar", description: "Bezugspersonen kartieren." },
          { title: "Fokus wählen", description: "1 von 4 IPT-Problembereichen." },
          { title: "Bearbeiten", description: "Konkrete Schritte & Kommunikation." },
          { title: "Stabilisieren", description: "Soziales Netz pflegen." },
        ] },
      },
      {
        title: "IPT-Modell",
        bullets: ["Symptome – Beziehungen – Persönlichkeit"],
        layout: "model", iconKey: "scale",
        layoutData: { nodes: [
          { label: "Symptome", description: "Akute depressive Episode" },
          { label: "Beziehungen", description: "Aktuelle interpersonelle Probleme" },
          { label: "Persönlichkeit", description: "Hintergrund, nicht Therapieziel" },
        ] },
      },
      {
        title: "Vorher – Nachher",
        bullets: ["Was IPT verändert"],
        layout: "before-after", iconKey: "heart",
        layoutData: {
          before: { title: "Vorher", items: [
            "Konflikt schwelt unausgesprochen",
            "Rückzug, Isolation",
            "'Niemand versteht mich'",
            "Bedürfnisse unerfüllt",
          ] },
          after: { title: "Nachher", items: [
            "Konflikt klar benannt",
            "Aktive Kontaktpflege",
            "Konkrete Bitten formuliert",
            "Beziehungen tragen wieder",
          ] },
        },
      },
      {
        title: "Vier IPT-Problembereiche",
        bullets: ["Einer wird als Fokus gewählt"],
        layout: "model", iconKey: "compass",
        layoutData: { nodes: [
          { label: "Trauer", description: "Verlust durch Tod" },
          { label: "Konflikt", description: "Interpersoneller Streit, Disput" },
          { label: "Rollenwechsel", description: "Pension, Trennung, Geburt, Krankheit" },
          { label: "Defizit", description: "Mangel an tragenden Beziehungen" },
        ] },
      },
      {
        title: "Beziehungsinventar",
        bullets: ["Wichtige Personen kartieren"],
        layout: "steps", iconKey: "hands",
        layoutData: { steps: [
          { title: "Auflisten", description: "Alle wichtigen Bezugspersonen sammeln." },
          { title: "Qualität bewerten", description: "Nähe, Konflikt, Unterstützung (1–10)." },
          { title: "Veränderung markieren", description: "Was hat sich vor/während Episode geändert?" },
          { title: "Fokuspersonen wählen", description: "1–3 Personen für die Therapiearbeit." },
        ] },
      },
      {
        title: "Bereich 1 – Trauer",
        bullets: [
          "Verlust würdigen – auch ambivalente Anteile",
          "Erinnerungen erlauben",
          "Rituale & Abschied",
          "Neue Rollen & Beziehungen aufbauen",
        ],
        layout: "bullets", iconKey: "leaf",
      },
      {
        title: "Bereich 2 – Konflikt",
        bullets: ["Drei Phasen analysieren"],
        layout: "steps", iconKey: "scale",
        layoutData: { steps: [
          { title: "Renegotiation", description: "Verhandlungsphase – noch Bewegung möglich." },
          { title: "Impasse", description: "Verfahren – Kommunikation eingefroren." },
          { title: "Auflösung", description: "Entweder neu vereinbaren oder Beziehung beenden." },
        ] },
      },
      {
        title: "Bereich 3 – Rollenwechsel",
        bullets: [
          "Alte Rolle würdigen (was war gut, was schwer?)",
          "Verlust der alten Rolle betrauern",
          "Neue Rolle aktiv gestalten",
          "Neue Fertigkeiten & Kontakte aufbauen",
        ],
        layout: "bullets", iconKey: "cycle",
      },
      {
        title: "Kommunikationsanalyse",
        bullets: ["Konkrete Situation Schritt für Schritt durchgehen"],
        layout: "steps", iconKey: "hands",
        layoutData: { steps: [
          { title: "Situation schildern", description: "Wer sagte was – wörtlich?" },
          { title: "Gefühl & Bedürfnis", description: "Was hat das mit mir gemacht?" },
          { title: "Eigene Reaktion", description: "Was habe ich gesagt/getan?" },
          { title: "Alternative", description: "Wie hätte ich es klarer/freundlicher sagen können?" },
        ] },
      },
      {
        title: "Hausaufgabe",
        bullets: [
          "Beziehungsinventar fortführen",
          "Eine Kommunikationssituation pro Woche analysieren",
          "Eine konkrete Bitte aussprechen",
          "Rückmeldung beobachten",
        ],
        layout: "bullets", iconKey: "leaf",
      },
      {
        title: "Zusammenfassung",
        bullets: ["Beziehungen als Heilraum"],
        layout: "vicious-cycle", iconKey: "cycle",
        layoutData: {
          centerLabel: "Beziehungs-Hebel",
          cycleNodes: [
            { label: "Klären", description: "Was belastet mich – mit wem?" },
            { label: "Sprechen", description: "Bedürfnis & Bitte formulieren" },
            { label: "Erleben", description: "Beziehung verändert sich" },
            { label: "Stimmung steigt", description: "Halt im Außen → Halt im Innen" },
          ],
        },
      },
    ],
  },
  {
    id: "behandlung-achtsamkeit-akzeptanz",
    title: "Behandlung Depression – 4.5 Achtsamkeit & Akzeptanz",
    approach: "Andere",
    category: "Intervention",
    tags: ["MBCT", "ACT", "Achtsamkeit", "Akzeptanz"],
    description: "Vertiefungs-Template MBCT/ACT-Elemente: Achtsamkeit, Defusion, Akzeptanz, Werteorientierung als Schutz vor Rückfall.",
    slides: [
      {
        title: "4.5 Achtsamkeit & Akzeptanz",
        bullets: ["Da sein, ohne zu kämpfen", "Werteorientiert handeln"],
        layout: "headline", iconKey: "leaf",
        layoutData: {
          headline: "Was wir annehmen, hört auf, uns zu beherrschen.",
          subline: "MBCT & ACT: Beobachten, akzeptieren, werteorientiert handeln.",
        },
      },
      {
        title: "Inhalt – Aufbau",
        bullets: ["Achtsamkeit", "Defusion", "Akzeptanz", "Selbst als Kontext", "Werte & Handeln"],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "Achtsamkeit", description: "Aufmerksamkeit bewusst lenken." },
          { title: "Defusion", description: "Gedanken als Gedanken sehen." },
          { title: "Akzeptanz", description: "Inneres Erleben zulassen." },
          { title: "Selbst-Beobachter", description: "Ich bin nicht meine Symptome." },
          { title: "Werte & Handeln", description: "Wohin will ich gehen – trotz allem?" },
        ] },
      },
      {
        title: "Modell: Hexaflex (ACT)",
        bullets: ["Sechs Prozesse psychologischer Flexibilität"],
        layout: "model", iconKey: "compass",
        layoutData: { nodes: [
          { label: "Akzeptanz", description: "Erleben zulassen" },
          { label: "Defusion", description: "Distanz zu Gedanken" },
          { label: "Hier & Jetzt", description: "Achtsame Gegenwart" },
          { label: "Werte", description: "Lebensrichtungen" },
          { label: "Engagiertes Handeln", description: "Schritte in Richtung Werte" },
          { label: "Selbst als Kontext", description: "Beobachterperspektive" },
        ] },
      },
      {
        title: "Vorher – Nachher",
        bullets: ["Was Akzeptanz verändert"],
        layout: "before-after", iconKey: "scale",
        layoutData: {
          before: { title: "Vorher: Kampf", items: [
            "'Diese Traurigkeit darf nicht sein'",
            "Grübeln, Vermeidung",
            "Energie geht in Widerstand",
            "Werte aus dem Blick",
          ] },
          after: { title: "Nachher: Akzeptanz", items: [
            "'Da ist Traurigkeit – sie darf da sein'",
            "Beobachten, atmen",
            "Energie für Wichtiges frei",
            "Schritte Richtung Werte trotz Schmerz",
          ] },
        },
      },
      {
        title: "Achtsamkeitsübungen – Basis",
        bullets: ["Drei Säulen für den Anfang"],
        layout: "steps", iconKey: "breath",
        layoutData: { steps: [
          { title: "Atemanker", description: "3 Min Atem im Bauch beobachten." },
          { title: "Bodyscan", description: "Kopf bis Fuß – Empfindungen wahrnehmen." },
          { title: "3-Min-Atemraum", description: "Wahrnehmen → Atem → Weiten (MBCT-Klassiker)." },
        ] },
      },
      {
        title: "Defusion – Abstand zu Gedanken",
        bullets: [
          "'Ich habe den Gedanken, dass …'",
          "Gedanken laut singen oder verfremden",
          "Bus-Metapher: Gedanken sind Fahrgäste",
          "Blätter im Bach: Gedanken treiben vorbei",
        ],
        layout: "bullets", iconKey: "brain",
      },
      {
        title: "Akzeptanz – Bereit-sein",
        bullets: ["Akzeptanz heißt nicht 'gutfinden', sondern 'zulassen'"],
        layout: "model", iconKey: "heart",
        layoutData: { nodes: [
          { label: "Wahrnehmen", description: "Was ist gerade da?" },
          { label: "Benennen", description: "'Da ist Angst', 'da ist Trauer'" },
          { label: "Raum geben", description: "Atem in die Empfindung" },
          { label: "Bereit sein", description: "Es darf da sein, ohne zu vergehen" },
        ] },
      },
      {
        title: "Werte-Kompass",
        bullets: ["Werte sind Richtungen, keine Ziele"],
        layout: "model", iconKey: "compass",
        layoutData: { nodes: [
          { label: "Beziehung", description: "Familie, Freundschaft" },
          { label: "Beruf", description: "Arbeit, Bildung" },
          { label: "Gesundheit", description: "Körper, Selbstfürsorge" },
          { label: "Freizeit/Sinn", description: "Hobby, Spiritualität" },
        ] },
      },
      {
        title: "Engagiertes Handeln",
        bullets: ["Werte in Mikro-Handlungen übersetzen"],
        layout: "steps", iconKey: "target",
        layoutData: { steps: [
          { title: "Wert wählen", description: "Welcher Bereich ist heute wichtig?" },
          { title: "Mikro-Handlung", description: "Was kann ich heute konkret tun?" },
          { title: "Hindernisse benennen", description: "Welche Gedanken/Gefühle stehen im Weg?" },
          { title: "Trotzdem tun", description: "Bereit sein – und gehen." },
        ] },
      },
      {
        title: "Hausaufgabe",
        bullets: [
          "Tägliche Atem-Übung 5–10 Min",
          "1× pro Tag 3-Min-Atemraum",
          "Eine werteorientierte Mikro-Handlung",
          "Defusion bei einem belastenden Gedanken üben",
        ],
        layout: "bullets", iconKey: "leaf",
      },
      {
        title: "Häufige Hindernisse",
        bullets: ["Was Achtsamkeit/Akzeptanz erschwert"],
        layout: "before-after", iconKey: "shield",
        layoutData: {
          before: { title: "Hindernis", items: [
            "'Ich kann nicht abschalten'",
            "Akzeptanz = Resignation?",
            "Übungen langweilig",
            "Werte unklar",
          ] },
          after: { title: "Lösung", items: [
            "Nicht abschalten – wahrnehmen",
            "Akzeptanz ≠ Aufgeben, sondern Raum schaffen",
            "Kurz, regelmäßig, alltagsnah",
            "Werte über Lebensbereiche erkunden",
          ] },
        },
      },
      {
        title: "Reflexion",
        bullets: ["Was würden Sie tun, wenn nichts im Weg stünde?"],
        layout: "question", iconKey: "question",
        layoutData: {
          headline: "Wofür möchte ich Raum machen – auch wenn es weh tut?",
          subline: "Werte zeigen die Richtung – Akzeptanz macht den Weg frei.",
        },
      },
    ],
  },
  {
    id: "behandlung-rueckfallprophylaxe",
    title: "Behandlung Depression – 4.6 Rückfallprophylaxe",
    approach: "KVT",
    category: "Modell",
    tags: ["Rückfallprophylaxe", "Frühwarnzeichen", "Notfallplan"],
    description: "Vertiefungs-Template Rückfallprophylaxe: Frühwarnzeichen, persönliche Auslöser, Notfallplan, langfristige Stabilisierung.",
    slides: [
      {
        title: "4.6 Rückfallprophylaxe",
        bullets: ["Stabil bleiben – auch nach Therapie", "Vorbereitet sein, wenn es wackelt"],
        layout: "headline", iconKey: "shield",
        layoutData: {
          headline: "Vorbeugen ist leichter als wieder herauskommen.",
          subline: "Rückfälle sind häufig – und vermeidbar, wenn man vorbereitet ist.",
        },
      },
      {
        title: "Inhalt – Aufbau",
        bullets: ["Risiko verstehen", "Frühwarnzeichen", "Auslöser", "Notfallplan", "Langfrist-Strategie"],
        layout: "steps", iconKey: "steps",
        layoutData: { steps: [
          { title: "Risiko", description: "Wie hoch ist mein Rückfallrisiko?" },
          { title: "Frühwarnzeichen", description: "Persönliche Signale identifizieren." },
          { title: "Auslöser", description: "Was kippt mein System?" },
          { title: "Notfallplan", description: "Konkrete Schritte bei Warnzeichen." },
          { title: "Stabilisierung", description: "Was hält mich langfristig gesund?" },
        ] },
      },
      {
        title: "Rückfallrisiko – Realismus",
        bullets: ["Ehrliche Zahlen schaffen Aufmerksamkeit"],
        layout: "model", iconKey: "scale",
        layoutData: { nodes: [
          { label: "1 Episode", description: "ca. 50% Rückfallrisiko" },
          { label: "2 Episoden", description: "ca. 70%" },
          { label: "3+ Episoden", description: "ca. 90% – Erhaltungstherapie!" },
        ] },
      },
      {
        title: "Vorher – Nachher",
        bullets: ["Was Rückfallprophylaxe verändert"],
        layout: "before-after", iconKey: "shield",
        layoutData: {
          before: { title: "Ohne Plan", items: [
            "Warnzeichen werden übersehen",
            "Rückfall überrascht",
            "Hilflosigkeit, Scham",
            "Späte Hilfe – schwerer Verlauf",
          ] },
          after: { title: "Mit Plan", items: [
            "Warnzeichen früh erkannt",
            "Klare nächste Schritte",
            "Selbstwirksamkeit",
            "Frühe Hilfe – kürzerer Verlauf",
          ] },
        },
      },
      {
        title: "Persönliche Frühwarnzeichen",
        bullets: ["Was kündigt sich oft als Erstes an?"],
        layout: "model", iconKey: "lightbulb",
        layoutData: { nodes: [
          { label: "Schlaf", description: "Einschlafprobleme, frühes Erwachen" },
          { label: "Antrieb", description: "Müdigkeit, Aufschieben" },
          { label: "Gedanken", description: "Grübeln nimmt zu" },
          { label: "Sozial", description: "Rückzug, Absagen" },
        ] },
      },
      {
        title: "Auslöser kennen",
        bullets: [
          "Beziehungs-Konflikte",
          "Berufliche Über-/Unterforderung",
          "Verluste & Übergänge",
          "Schlafmangel, Krankheit",
          "Jahreszeiten (Herbst/Winter)",
          "Alkohol & Substanzen",
        ],
        layout: "bullets", iconKey: "target",
      },
      {
        title: "Notfallplan – Stufen",
        bullets: ["Was tue ich – wann?"],
        layout: "steps", iconKey: "shield",
        layoutData: { steps: [
          { title: "Stufe 1 – Frühwarnung", description: "Tagesstruktur stärken, Aktivität, Schlaf priorisieren." },
          { title: "Stufe 2 – Verstärkung", description: "Bewältigungstechniken aktiv, Bezugspersonen informieren." },
          { title: "Stufe 3 – Therapie-Booster", description: "Therapeut:in kontaktieren, Auffrischsitzung." },
          { title: "Stufe 4 – Akut", description: "Hausarzt/Psychiater, Medikation prüfen, Krisendienst." },
        ] },
      },
      {
        title: "Notfallkarte – Inhalte",
        bullets: [
          "Meine 3 wichtigsten Frühwarnzeichen",
          "Meine 3 wichtigsten Auslöser",
          "Meine 3 hilfreichsten Strategien",
          "3 Personen zum Anrufen",
          "Therapeut:in & Notfallnummern",
          "Erinnerung: 'Es war schon einmal vorbei'",
        ],
        layout: "bullets", iconKey: "heart",
      },
      {
        title: "Langfrist-Stabilisierung",
        bullets: ["Was hält gesund?"],
        layout: "model", iconKey: "sun",
        layoutData: { nodes: [
          { label: "Schlaf & Rhythmus", description: "Feste Zeiten, Schlafhygiene" },
          { label: "Bewegung", description: "3× 30 Min/Woche" },
          { label: "Beziehungen", description: "Aktive Kontaktpflege" },
          { label: "Sinn & Werte", description: "Werteorientiert leben" },
          { label: "Achtsamkeit", description: "Tägliche Mini-Praxis" },
          { label: "Booster-Sitzungen", description: "Auffrischung 2–4×/Jahr" },
        ] },
      },
      {
        title: "Hausaufgabe – Persönlicher Notfallplan",
        bullets: [
          "Notfallkarte schriftlich erstellen",
          "Mit Bezugsperson teilen",
          "An sichtbarem Ort aufbewahren",
          "1× pro Monat überprüfen & anpassen",
        ],
        layout: "bullets", iconKey: "leaf",
      },
      {
        title: "Häufige Hindernisse",
        bullets: ["Was Rückfallprophylaxe sabotiert"],
        layout: "before-after", iconKey: "shield",
        layoutData: {
          before: { title: "Hindernis", items: [
            "'Jetzt geht's mir gut – brauch ich nicht'",
            "Warnzeichen werden bagatellisiert",
            "Scham, wieder Hilfe zu holen",
            "Therapieende = alles vorbei",
          ] },
          after: { title: "Lösung", items: [
            "Plan in guten Zeiten erstellen",
            "Frühwarnzeichen ernst nehmen",
            "Frühe Hilfe = Stärke, nicht Schwäche",
            "Booster-Sitzungen einplanen",
          ] },
        },
      },
      {
        title: "Zusammenfassung – Stabilitätskreis",
        bullets: ["Was mich stabil hält"],
        layout: "vicious-cycle", iconKey: "cycle",
        layoutData: {
          centerLabel: "Stabilität",
          cycleNodes: [
            { label: "Selbstbeobachtung", description: "Frühzeichen erkennen" },
            { label: "Routinen", description: "Schlaf, Bewegung, Struktur" },
            { label: "Beziehungen", description: "Tragfähiges Netz" },
            { label: "Plan parat", description: "Notfallkarte griffbereit" },
          ],
        },
      },
    ],
  },
];

export function getTemplate(id: string) {
  return TEMPLATES.find(t => t.id === id);
}
