// PPTX Export für TheraPilot
// 100% clientseitig (pptxgenjs). Sage/Cream-Theme, mit Visuals für bekannte Templates.
import PptxGenJS from "pptxgenjs";
import type { SlideDeck } from "@/lib/db";

// Sage/Cream Palette
const COLOR = {
  cream: "F8F5EE",
  creamDeep: "EFEAD9",
  ink: "1F2A26",
  inkSoft: "4B5A53",
  sage: "4A6B5C",
  sageDeep: "2F4A3F",
  sageSoft: "DDE7E0",
  accent: "B9764A", // warm terracotta
  accentSoft: "F0DECE",
  line: "C9CFC8",
};

const FONT_TITLE = "Georgia";
const FONT_BODY = "Calibri";

type Slide = SlideDeck["slides"][number];

function addBackground(s: PptxGenJS.Slide) {
  s.background = { color: COLOR.cream };
  // Dezenter Akzent-Streifen links
  s.addShape("rect", { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: COLOR.sage }, line: { color: COLOR.sage } });
}

function addFooter(s: PptxGenJS.Slide, deckTitle: string, idx: number, total: number, pseudonym?: string) {
  s.addText(deckTitle, {
    x: 0.4, y: 5.25, w: 6, h: 0.3,
    fontFace: FONT_BODY, fontSize: 9, color: COLOR.inkSoft,
  });
  s.addText(`${idx} / ${total}${pseudonym ? "  ·  " + pseudonym : ""}`, {
    x: 7.0, y: 5.25, w: 2.8, h: 0.3, align: "right",
    fontFace: FONT_BODY, fontSize: 9, color: COLOR.inkSoft,
  });
}

function addTitleSlide(pptx: PptxGenJS, title: string, subtitle?: string, pseudonym?: string) {
  const s = pptx.addSlide();
  s.background = { color: COLOR.sage };
  // Großes Cream-Panel
  s.addShape("rect", { x: 0.8, y: 1.2, w: 8.4, h: 3.2, fill: { color: COLOR.cream }, line: { color: COLOR.cream } });
  s.addShape("rect", { x: 0.8, y: 1.2, w: 0.18, h: 3.2, fill: { color: COLOR.accent }, line: { color: COLOR.accent } });

  s.addText("Psychoedukation", {
    x: 1.2, y: 1.5, w: 7.6, h: 0.4,
    fontFace: FONT_BODY, fontSize: 12, color: COLOR.accent, bold: true, charSpacing: 4,
  });
  s.addText(title, {
    x: 1.2, y: 1.95, w: 7.6, h: 1.6,
    fontFace: FONT_TITLE, fontSize: 38, color: COLOR.sageDeep, bold: true, valign: "top",
  });
  if (subtitle) {
    s.addText(subtitle, {
      x: 1.2, y: 3.6, w: 7.6, h: 0.6,
      fontFace: FONT_BODY, fontSize: 14, color: COLOR.inkSoft, italic: true,
    });
  }
  s.addText(pseudonym ? `Für ${pseudonym}` : "Therapie-Material", {
    x: 0.8, y: 4.7, w: 8.4, h: 0.3,
    fontFace: FONT_BODY, fontSize: 10, color: COLOR.cream, charSpacing: 6,
  });
}

function addContentSlide(
  pptx: PptxGenJS,
  slide: Slide,
  meta: { deckTitle: string; idx: number; total: number; pseudonym?: string },
) {
  const s = pptx.addSlide();
  addBackground(s);

  // Marginalie / Slide-Nummer
  s.addText(String(meta.idx).padStart(2, "0"), {
    x: 0.4, y: 0.35, w: 0.6, h: 0.4,
    fontFace: FONT_BODY, fontSize: 11, color: COLOR.accent, bold: true, charSpacing: 2,
  });

  // Titel
  s.addText(slide.title, {
    x: 0.4, y: 0.7, w: 9.0, h: 0.9,
    fontFace: FONT_TITLE, fontSize: 30, color: COLOR.sageDeep, bold: true, valign: "top",
  });

  // Bullets als formatierte Liste
  const bulletText = slide.bullets.filter(Boolean).map(b => ({
    text: b,
    options: {
      bullet: { code: "25CF" }, // ●
      paraSpaceAfter: 10,
      fontFace: FONT_BODY,
      fontSize: 18,
      color: COLOR.ink,
    },
  }));

  s.addText(bulletText as any, {
    x: 0.7, y: 1.8, w: 8.6, h: 3.2,
    valign: "top",
    color: COLOR.ink,
    paraSpaceAfter: 10,
  });

  // Sprechernotizen für Therapeut:in
  if (slide.notes) s.addNotes(slide.notes);

  addFooter(s, meta.deckTitle, meta.idx, meta.total, meta.pseudonym);
}

// ---------------- Visuelle Spezial-Slides ----------------

function addSORKC(pptx: PptxGenJS, meta: { deckTitle: string; idx: number; total: number; pseudonym?: string }) {
  const s = pptx.addSlide();
  addBackground(s);
  s.addText("SORKC – Verhaltensanalyse", {
    x: 0.4, y: 0.6, w: 9, h: 0.7,
    fontFace: FONT_TITLE, fontSize: 28, color: COLOR.sageDeep, bold: true,
  });
  s.addText("Wie ein Verhalten entsteht und sich aufrechterhält", {
    x: 0.4, y: 1.25, w: 9, h: 0.4,
    fontFace: FONT_BODY, fontSize: 13, color: COLOR.inkSoft, italic: true,
  });

  const labels = [
    { l: "S", t: "Stimulus", d: "Auslösende Situation" },
    { l: "O", t: "Organismus", d: "Vorgeschichte, Überzeugungen" },
    { l: "R", t: "Reaktion", d: "Gedanken, Gefühle, Verhalten" },
    { l: "K", t: "Kontingenz", d: "Wie regelmäßig folgt die Konsequenz?" },
    { l: "C", t: "Konsequenz", d: "Kurz- und langfristige Wirkung" },
  ];
  const startX = 0.4, y = 2.0, boxW = 1.8, boxH = 1.7, gap = 0.05;
  labels.forEach((it, i) => {
    const x = startX + i * (boxW + gap);
    s.addShape("roundRect", { x, y, w: boxW, h: boxH, fill: { color: COLOR.sageSoft }, line: { color: COLOR.sage, width: 1 }, rectRadius: 0.08 });
    s.addText(it.l, { x, y: y + 0.1, w: boxW, h: 0.6, fontFace: FONT_TITLE, fontSize: 36, bold: true, color: COLOR.accent, align: "center" });
    s.addText(it.t, { x, y: y + 0.75, w: boxW, h: 0.35, fontFace: FONT_BODY, fontSize: 13, bold: true, color: COLOR.sageDeep, align: "center" });
    s.addText(it.d, { x: x + 0.05, y: y + 1.1, w: boxW - 0.1, h: 0.55, fontFace: FONT_BODY, fontSize: 9, color: COLOR.inkSoft, align: "center", valign: "top" });
    if (i < labels.length - 1) {
      s.addShape("rightTriangle", { x: x + boxW + gap - 0.04, y: y + boxH / 2 - 0.06, w: 0.08, h: 0.12, fill: { color: COLOR.sage }, line: { color: COLOR.sage }, rotate: 90 });
    }
  });

  s.addText("Gemeinsam analysieren wir konkrete Situationen Schritt für Schritt.", {
    x: 0.4, y: 4.1, w: 9, h: 0.5, fontFace: FONT_BODY, fontSize: 13, italic: true, color: COLOR.inkSoft, align: "center",
  });

  addFooter(s, meta.deckTitle, meta.idx, meta.total, meta.pseudonym);
}

function addAngstTeufelskreis(pptx: PptxGenJS, meta: { deckTitle: string; idx: number; total: number; pseudonym?: string }) {
  const s = pptx.addSlide();
  addBackground(s);
  s.addText("Teufelskreis der Angst", {
    x: 0.4, y: 0.6, w: 9, h: 0.7, fontFace: FONT_TITLE, fontSize: 28, color: COLOR.sageDeep, bold: true,
  });
  s.addText("So verstärkt sich Angst – und so können wir den Kreis durchbrechen.", {
    x: 0.4, y: 1.25, w: 9, h: 0.4, fontFace: FONT_BODY, fontSize: 13, color: COLOR.inkSoft, italic: true,
  });

  // 4 Knoten im Kreis
  const cx = 5.0, cy = 3.5, r = 1.6;
  const nodes = [
    { angle: -90, t: "Auslöser", d: "Situation/Reiz" },
    { angle: 0, t: "Bewertung", d: "'gefährlich'" },
    { angle: 90, t: "Körperreaktion", d: "Herz, Atem, Anspannung" },
    { angle: 180, t: "Vermeidung", d: "Rückzug, Flucht" },
  ];
  nodes.forEach((n, i) => {
    const rad = (n.angle * Math.PI) / 180;
    const x = cx + r * Math.cos(rad) - 1.0;
    const y = cy + r * Math.sin(rad) - 0.4;
    s.addShape("ellipse", { x, y, w: 2.0, h: 0.8, fill: { color: COLOR.accentSoft }, line: { color: COLOR.accent, width: 1.5 } });
    s.addText(n.t, { x, y, w: 2.0, h: 0.45, fontFace: FONT_BODY, fontSize: 12, bold: true, color: COLOR.sageDeep, align: "center", valign: "middle" });
    s.addText(n.d, { x, y: y + 0.42, w: 2.0, h: 0.35, fontFace: FONT_BODY, fontSize: 9, color: COLOR.inkSoft, align: "center" });

    // Pfeil zum nächsten Knoten
    const next = nodes[(i + 1) % nodes.length];
    const radNext = (next.angle * Math.PI) / 180;
    const x1 = cx + (r - 0.1) * Math.cos(rad);
    const y1 = cy + (r - 0.1) * Math.sin(rad);
    const x2 = cx + (r - 0.1) * Math.cos(radNext);
    const y2 = cy + (r - 0.1) * Math.sin(radNext);
    s.addShape("line", {
      x: Math.min(x1, x2) - 0.3, y: Math.min(y1, y2) - 0.3,
      w: Math.abs(x2 - x1) + 0.6, h: Math.abs(y2 - y1) + 0.6,
      flipH: x2 < x1, flipV: y2 < y1,
      line: { color: COLOR.sage, width: 1.5, endArrowType: "triangle" },
    });
  });

  // Zentrum
  s.addShape("ellipse", { x: cx - 0.6, y: cy - 0.3, w: 1.2, h: 0.6, fill: { color: COLOR.sage }, line: { color: COLOR.sage } });
  s.addText("ANGST", { x: cx - 0.6, y: cy - 0.3, w: 1.2, h: 0.6, fontFace: FONT_TITLE, fontSize: 14, bold: true, color: COLOR.cream, align: "center", valign: "middle" });

  addFooter(s, meta.deckTitle, meta.idx, meta.total, meta.pseudonym);
}

function addABCModell(pptx: PptxGenJS, meta: { deckTitle: string; idx: number; total: number; pseudonym?: string }) {
  const s = pptx.addSlide();
  addBackground(s);
  s.addText("Das ABC-Modell", { x: 0.4, y: 0.6, w: 9, h: 0.7, fontFace: FONT_TITLE, fontSize: 28, color: COLOR.sageDeep, bold: true });
  s.addText("Nicht die Situation, sondern unsere Bewertung erzeugt das Gefühl.", {
    x: 0.4, y: 1.25, w: 9, h: 0.4, fontFace: FONT_BODY, fontSize: 13, color: COLOR.inkSoft, italic: true,
  });
  const items = [
    { l: "A", t: "Auslöser", d: "Was ist objektiv passiert?", color: COLOR.sageSoft },
    { l: "B", t: "Bewertung", d: "Welcher Gedanke entstand?", color: COLOR.accentSoft },
    { l: "C", t: "Konsequenz", d: "Welches Gefühl, Verhalten folgte?", color: COLOR.creamDeep },
  ];
  items.forEach((it, i) => {
    const x = 0.6 + i * 3.0;
    s.addShape("roundRect", { x, y: 2.0, w: 2.7, h: 2.4, fill: { color: it.color }, line: { color: COLOR.sage, width: 1 }, rectRadius: 0.12 });
    s.addText(it.l, { x, y: 2.15, w: 2.7, h: 0.9, fontFace: FONT_TITLE, fontSize: 60, bold: true, color: COLOR.sageDeep, align: "center" });
    s.addText(it.t, { x, y: 3.05, w: 2.7, h: 0.4, fontFace: FONT_BODY, fontSize: 16, bold: true, color: COLOR.sageDeep, align: "center" });
    s.addText(it.d, { x: x + 0.15, y: 3.5, w: 2.4, h: 0.8, fontFace: FONT_BODY, fontSize: 12, color: COLOR.inkSoft, align: "center", valign: "top" });
    if (i < items.length - 1) {
      s.addShape("rightTriangle", { x: x + 2.78, y: 3.05, w: 0.18, h: 0.3, fill: { color: COLOR.accent }, line: { color: COLOR.accent }, rotate: 90 });
    }
  });
  addFooter(s, meta.deckTitle, meta.idx, meta.total, meta.pseudonym);
}

function addWerteKompass(pptx: PptxGenJS, meta: { deckTitle: string; idx: number; total: number; pseudonym?: string }) {
  const s = pptx.addSlide();
  addBackground(s);
  s.addText("Werte-Kompass", { x: 0.4, y: 0.6, w: 9, h: 0.7, fontFace: FONT_TITLE, fontSize: 28, color: COLOR.sageDeep, bold: true });
  s.addText("Vier Lebensbereiche – Welche Richtung ist Ihnen wichtig?", {
    x: 0.4, y: 1.25, w: 9, h: 0.4, fontFace: FONT_BODY, fontSize: 13, color: COLOR.inkSoft, italic: true,
  });

  const cx = 5.0, cy = 3.4, r = 1.6;
  s.addShape("ellipse", { x: cx - r, y: cy - r, w: r * 2, h: r * 2, fill: { color: COLOR.cream }, line: { color: COLOR.sage, width: 1.5 } });
  s.addShape("line", { x: cx - r, y: cy, w: r * 2, h: 0, line: { color: COLOR.line, width: 0.75 } });
  s.addShape("line", { x: cx, y: cy - r, w: 0, h: r * 2, line: { color: COLOR.line, width: 0.75 } });

  const quads = [
    { dx: -0.95, dy: -0.6, t: "Beziehung\n& Familie" },
    { dx: 0.05, dy: -0.6, t: "Beruf\n& Bildung" },
    { dx: -0.95, dy: 0.1, t: "Gesundheit\n& Körper" },
    { dx: 0.05, dy: 0.1, t: "Freizeit\n& Spiritualität" },
  ];
  quads.forEach(q => {
    s.addText(q.t, {
      x: cx + q.dx, y: cy + q.dy, w: 0.9, h: 0.5,
      fontFace: FONT_BODY, fontSize: 10, bold: true, color: COLOR.sageDeep, align: "center",
    });
  });
  s.addShape("ellipse", { x: cx - 0.2, y: cy - 0.2, w: 0.4, h: 0.4, fill: { color: COLOR.accent }, line: { color: COLOR.accent } });

  addFooter(s, meta.deckTitle, meta.idx, meta.total, meta.pseudonym);
}

const VISUAL_INSERTS: Record<string, (pptx: PptxGenJS, meta: any) => void> = {
  "kvt-sorkc": addSORKC,
  "psychoed-angst": addAngstTeufelskreis,
  "kvt-gedankenprotokoll": addABCModell,
  "act-werte": addWerteKompass,
};

// ---------------- Public API ----------------

export async function exportDeckAsPPTX(deck: SlideDeck): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 ist Default für WIDE; 16:9 standard
  pptx.defineLayout({ name: "TP_LAYOUT", width: 10, height: 5.625 });
  pptx.layout = "TP_LAYOUT";
  pptx.title = deck.title;
  pptx.author = "TheraPilot";
  pptx.company = "TheraPilot";

  // Titelfolie
  addTitleSlide(pptx, deck.title, deck.topic, deck.patientId);

  // Optionales Visual nach Titel
  const visual = deck.templateId ? VISUAL_INSERTS[deck.templateId] : undefined;
  const total = deck.slides.length + (visual ? 1 : 0);
  let idx = 1;

  if (visual) {
    visual(pptx, { deckTitle: deck.title, idx, total, pseudonym: deck.patientId });
    idx++;
  }

  for (const slide of deck.slides) {
    addContentSlide(pptx, slide, { deckTitle: deck.title, idx, total, pseudonym: deck.patientId });
    idx++;
  }

  // Schluss-Folie
  const last = pptx.addSlide();
  last.background = { color: COLOR.sageDeep };
  last.addText("Vielen Dank.", {
    x: 0.8, y: 2.0, w: 8.4, h: 1.0,
    fontFace: FONT_TITLE, fontSize: 44, bold: true, color: COLOR.cream, align: "center",
  });
  last.addText("Fragen, Notizen und nächste Schritte besprechen wir gemeinsam.", {
    x: 0.8, y: 3.0, w: 8.4, h: 0.6,
    fontFace: FONT_BODY, fontSize: 14, italic: true, color: COLOR.accentSoft, align: "center",
  });

  const filename = `${deck.title.replace(/[^a-zA-Z0-9äöüÄÖÜß\-_ ]+/g, "").trim() || "TheraPilot-Deck"}.pptx`;
  await pptx.writeFile({ fileName: filename });
}
