// Vorgefertigte Therapie-Templates (Slide-Sets) – mit visuellen Layouts.
import type { SlideLayout, SlideLayoutData } from "@/lib/db";
import type { IconKey } from "@/lib/slideIcons";
import emotionalesNetzwerkImg from "@/assets/emotionales-netzwerk.jpg";
import gehirnAmygdalaImg from "@/assets/gehirn-amygdala.jpg";

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
];

export function getTemplate(id: string) {
  return TEMPLATES.find(t => t.id === id);
}
