// PPTX Export für TheraPilot
// 100% clientseitig (pptxgenjs). Sage/Cream-Theme mit reichhaltigen Visualisierungen
// (Mindmaps, Flussdiagramme, Waage, Eisberg, Stress-Kurve, Bus-Metapher, ...).
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
  accent: "B9764A",
  accentSoft: "F0DECE",
  accentDeep: "8A4F2D",
  warn: "C2557A",
  warnSoft: "F2D6E0",
  calm: "6E8FA3",
  calmSoft: "D6E0E8",
  line: "C9CFC8",
};

const FONT_TITLE = "Georgia";
const FONT_BODY = "Calibri";

type Slide = SlideDeck["slides"][number];
type Meta = { deckTitle: string; idx: number; total: number; pseudonym?: string };

// ============ Basis-Layout ============

function addBackground(s: PptxGenJS.Slide) {
  s.background = { color: COLOR.cream };
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

function addSectionHeader(s: PptxGenJS.Slide, kicker: string, title: string, subtitle?: string) {
  s.addText(kicker.toUpperCase(), {
    x: 0.4, y: 0.4, w: 9, h: 0.3,
    fontFace: FONT_BODY, fontSize: 10, color: COLOR.accent, bold: true, charSpacing: 4,
  });
  s.addText(title, {
    x: 0.4, y: 0.7, w: 9.0, h: 0.7,
    fontFace: FONT_TITLE, fontSize: 28, color: COLOR.sageDeep, bold: true, valign: "top",
  });
  if (subtitle) {
    s.addText(subtitle, {
      x: 0.4, y: 1.35, w: 9.0, h: 0.4,
      fontFace: FONT_BODY, fontSize: 13, color: COLOR.inkSoft, italic: true,
    });
  }
}

// ============ Standard-Folien ============

function addTitleSlide(pptx: PptxGenJS, title: string, subtitle?: string, pseudonym?: string) {
  const s = pptx.addSlide();
  s.background = { color: COLOR.sageDeep };

  // dekorative Kreise
  s.addShape("ellipse", { x: 7.5, y: -1.0, w: 3.5, h: 3.5, fill: { color: COLOR.sage }, line: { color: COLOR.sage } });
  s.addShape("ellipse", { x: 8.4, y: 4.0, w: 2.0, h: 2.0, fill: { color: COLOR.accent }, line: { color: COLOR.accent } });

  s.addShape("rect", { x: 0.6, y: 1.1, w: 7.4, h: 3.4, fill: { color: COLOR.cream }, line: { color: COLOR.cream } });
  s.addShape("rect", { x: 0.6, y: 1.1, w: 0.18, h: 3.4, fill: { color: COLOR.accent }, line: { color: COLOR.accent } });

  s.addText("PSYCHOEDUKATION", {
    x: 1.0, y: 1.4, w: 6.8, h: 0.4,
    fontFace: FONT_BODY, fontSize: 11, color: COLOR.accent, bold: true, charSpacing: 6,
  });
  s.addText(title, {
    x: 1.0, y: 1.8, w: 6.8, h: 1.6,
    fontFace: FONT_TITLE, fontSize: 36, color: COLOR.sageDeep, bold: true, valign: "top",
  });
  if (subtitle) {
    s.addText(subtitle, {
      x: 1.0, y: 3.5, w: 6.8, h: 0.7,
      fontFace: FONT_BODY, fontSize: 14, color: COLOR.inkSoft, italic: true,
    });
  }
  s.addText(pseudonym ? `Für ${pseudonym}` : "Therapie-Material", {
    x: 0.6, y: 4.8, w: 8.4, h: 0.3,
    fontFace: FONT_BODY, fontSize: 10, color: COLOR.cream, charSpacing: 6,
  });
}

function addContentSlide(pptx: PptxGenJS, slide: Slide, meta: Meta) {
  const s = pptx.addSlide();
  addBackground(s);

  s.addText(String(meta.idx).padStart(2, "0"), {
    x: 0.4, y: 0.35, w: 0.6, h: 0.4,
    fontFace: FONT_BODY, fontSize: 11, color: COLOR.accent, bold: true, charSpacing: 2,
  });

  // Symbol-Glyph als Akzent (nutzt Unicode statt SVG)
  const glyphMap: Record<string, string> = {
    brain: "🧠", heart: "♥", compass: "✦", breath: "≋", scale: "⚖", lightbulb: "✦",
    target: "◎", leaf: "❀", sun: "☀", cycle: "↻", steps: "▤", question: "?", shield: "◈", hands: "✿",
  };
  const glyph = slide.iconKey ? (glyphMap[slide.iconKey] ?? "") : "";
  if (glyph) {
    s.addShape("ellipse", { x: 8.9, y: 0.4, w: 0.6, h: 0.6, fill: { color: COLOR.accentSoft }, line: { color: COLOR.accent, width: 1 } });
    s.addText(glyph, { x: 8.9, y: 0.4, w: 0.6, h: 0.6, fontFace: FONT_TITLE, fontSize: 22, color: COLOR.accentDeep, align: "center", valign: "middle" });
  }

  s.addText(slide.title, {
    x: 0.4, y: 0.7, w: 8.4, h: 0.9,
    fontFace: FONT_TITLE, fontSize: 28, color: COLOR.sageDeep, bold: true, valign: "top",
  });

  const layout = slide.layout ?? "bullets";
  const data = slide.layoutData ?? {};

  if (layout === "headline" && (data.headline || slide.bullets[0])) {
    s.addText(`„${data.headline ?? slide.bullets[0]}"`, {
      x: 0.6, y: 2.1, w: 8.8, h: 1.8,
      fontFace: FONT_TITLE, fontSize: 36, color: COLOR.sageDeep, bold: true, align: "center", valign: "middle",
    });
    if (data.subline) {
      s.addText(data.subline, {
        x: 0.6, y: 4.0, w: 8.8, h: 0.6,
        fontFace: FONT_BODY, fontSize: 16, italic: true, color: COLOR.inkSoft, align: "center",
      });
    }
  } else if (layout === "question") {
    s.addText("?", {
      x: 0.6, y: 1.7, w: 8.8, h: 1.0,
      fontFace: FONT_TITLE, fontSize: 64, color: COLOR.accent, bold: true, align: "center",
    });
    s.addText(data.headline ?? slide.bullets[0] ?? "", {
      x: 0.6, y: 2.7, w: 8.8, h: 1.4,
      fontFace: FONT_TITLE, fontSize: 28, color: COLOR.sageDeep, bold: true, align: "center", valign: "top",
    });
    if (data.subline) {
      s.addText(data.subline, {
        x: 0.6, y: 4.2, w: 8.8, h: 0.5,
        fontFace: FONT_BODY, fontSize: 14, italic: true, color: COLOR.inkSoft, align: "center",
      });
    }
  } else if (layout === "model" && data.nodes && data.nodes.length > 0) {
    const nodes = data.nodes.slice(0, 5);
    const totalW = 8.8;
    const arrowW = 0.25;
    const cardW = (totalW - (nodes.length - 1) * arrowW) / nodes.length;
    nodes.forEach((n, i) => {
      const x = 0.6 + i * (cardW + arrowW);
      const y = 2.0;
      s.addShape("roundRect", { x, y, w: cardW, h: 2.7, fill: { color: COLOR.cream }, line: { color: COLOR.sage, width: 1.5 }, rectRadius: 0.1 });
      s.addShape("ellipse", { x: x + cardW / 2 - 0.27, y: y + 0.2, w: 0.54, h: 0.54, fill: { color: COLOR.accent }, line: { color: COLOR.accent } });
      s.addText(String(i + 1), { x: x + cardW / 2 - 0.27, y: y + 0.2, w: 0.54, h: 0.54, fontFace: FONT_TITLE, fontSize: 18, bold: true, color: COLOR.cream, align: "center", valign: "middle" });
      s.addText(n.label, { x: x + 0.1, y: y + 0.85, w: cardW - 0.2, h: 0.5, fontFace: FONT_BODY, fontSize: 13, bold: true, color: COLOR.sageDeep, align: "center" });
      if (n.description) {
        s.addText(n.description, { x: x + 0.15, y: y + 1.4, w: cardW - 0.3, h: 1.2, fontFace: FONT_BODY, fontSize: 10, color: COLOR.inkSoft, align: "center", valign: "top" });
      }
      if (i < nodes.length - 1) {
        s.addShape("rightArrow", { x: x + cardW + 0.02, y: y + 1.25, w: arrowW - 0.04, h: 0.25, fill: { color: COLOR.accent }, line: { color: COLOR.accent } });
      }
    });
  } else if (layout === "vicious-cycle" && data.cycleNodes && data.cycleNodes.length === 4) {
    const cx = 5.0, cy = 3.4, r = 1.7;
    const positions = [
      { angle: -90, ax: 0, ay: -1 },
      { angle: 0, ax: 1, ay: 0 },
      { angle: 90, ax: 0, ay: 1 },
      { angle: 180, ax: -1, ay: 0 },
    ];
    data.cycleNodes.forEach((n, i) => {
      const p = positions[i];
      const nx = cx + p.ax * r, ny = cy + p.ay * r * 0.9;
      const w = 2.0, h = 0.85;
      const x = nx - w / 2, y = ny - h / 2;
      s.addShape("ellipse", { x, y, w, h, fill: { color: COLOR.cream }, line: { color: COLOR.accent, width: 2 } });
      s.addText(n.label, { x, y: y + 0.05, w, h: 0.4, fontFace: FONT_BODY, fontSize: 11, bold: true, color: COLOR.sageDeep, align: "center" });
      if (n.description) {
        s.addText(n.description, { x, y: y + 0.45, w, h: 0.4, fontFace: FONT_BODY, fontSize: 9, color: COLOR.inkSoft, align: "center" });
      }
    });
    // Pfeile zwischen Knoten (Bogen-Annäherung als Linien)
    for (let i = 0; i < 4; i++) {
      const p = positions[i], pn = positions[(i + 1) % 4];
      const x1 = cx + p.ax * (r - 0.3), y1 = cy + p.ay * (r * 0.9 - 0.3);
      const x2 = cx + pn.ax * (r - 0.3), y2 = cy + pn.ay * (r * 0.9 - 0.3);
      s.addShape("line", {
        x: Math.min(x1, x2), y: Math.min(y1, y2),
        w: Math.abs(x2 - x1) || 0.01, h: Math.abs(y2 - y1) || 0.01,
        flipH: x2 < x1, flipV: y2 < y1,
        line: { color: COLOR.warn, width: 1.5, endArrowType: "triangle" },
      });
    }
    s.addShape("ellipse", { x: cx - 0.7, y: cy - 0.35, w: 1.4, h: 0.7, fill: { color: COLOR.warn }, line: { color: COLOR.warn } });
    s.addText(data.centerLabel ?? "Kreislauf", { x: cx - 0.7, y: cy - 0.35, w: 1.4, h: 0.7, fontFace: FONT_TITLE, fontSize: 14, bold: true, color: COLOR.cream, align: "center", valign: "middle" });
  } else if (layout === "before-after" && (data.before || data.after)) {
    const cardH = 2.7;
    if (data.before) {
      s.addShape("roundRect", { x: 0.4, y: 2.0, w: 4.4, h: cardH, fill: { color: COLOR.warnSoft }, line: { color: COLOR.warn, width: 1.5 }, rectRadius: 0.1 });
      s.addText(data.before.title, { x: 0.6, y: 2.15, w: 4.0, h: 0.5, fontFace: FONT_BODY, fontSize: 16, bold: true, color: COLOR.warn });
      const items = data.before.items.map(it => ({ text: it, options: { bullet: { code: "2715" }, fontFace: FONT_BODY, fontSize: 13, color: COLOR.ink, paraSpaceAfter: 6 } }));
      s.addText(items as any, { x: 0.7, y: 2.7, w: 4.0, h: 1.9, valign: "top" });
    }
    if (data.after) {
      s.addShape("roundRect", { x: 5.2, y: 2.0, w: 4.4, h: cardH, fill: { color: COLOR.sageSoft }, line: { color: COLOR.sage, width: 1.5 }, rectRadius: 0.1 });
      s.addText(data.after.title, { x: 5.4, y: 2.15, w: 4.0, h: 0.5, fontFace: FONT_BODY, fontSize: 16, bold: true, color: COLOR.sageDeep });
      const items = data.after.items.map(it => ({ text: it, options: { bullet: { code: "2713" }, fontFace: FONT_BODY, fontSize: 13, color: COLOR.ink, paraSpaceAfter: 6 } }));
      s.addText(items as any, { x: 5.5, y: 2.7, w: 4.0, h: 1.9, valign: "top" });
    }
    s.addShape("rightArrow", { x: 4.85, y: 3.2, w: 0.3, h: 0.3, fill: { color: COLOR.accent }, line: { color: COLOR.accent } });
  } else if (layout === "steps" && data.steps && data.steps.length > 0) {
    const steps = data.steps.slice(0, 5);
    const stepH = Math.min(0.7, 2.8 / steps.length);
    const gap = 0.05;
    steps.forEach((st, i) => {
      const y = 1.9 + i * (stepH + gap);
      s.addShape("roundRect", { x: 0.6, y, w: 8.8, h: stepH, fill: { color: COLOR.cream }, line: { color: COLOR.sage, width: 0.75 }, rectRadius: 0.05 });
      s.addShape("ellipse", { x: 0.7, y: y + 0.05, w: stepH - 0.1, h: stepH - 0.1, fill: { color: COLOR.accent }, line: { color: COLOR.accent } });
      s.addText(String(i + 1), { x: 0.7, y: y + 0.05, w: stepH - 0.1, h: stepH - 0.1, fontFace: FONT_TITLE, fontSize: 14, bold: true, color: COLOR.cream, align: "center", valign: "middle" });
      s.addText(st.title, { x: 0.7 + stepH + 0.1, y: y + 0.05, w: 4.0, h: stepH - 0.1, fontFace: FONT_BODY, fontSize: 13, bold: true, color: COLOR.sageDeep, valign: "middle" });
      if (st.description) {
        s.addText(st.description, { x: 4.9, y: y + 0.05, w: 4.4, h: stepH - 0.1, fontFace: FONT_BODY, fontSize: 11, color: COLOR.inkSoft, valign: "middle" });
      }
    });
  } else {
    // Fallback: Bullet- oder Karten-Layout
    const bullets = slide.bullets.filter(Boolean);
    if (bullets.length >= 2 && bullets.length <= 4) {
      const cardW = (8.8 - (bullets.length - 1) * 0.2) / bullets.length;
      bullets.forEach((b, i) => {
        const x = 0.6 + i * (cardW + 0.2);
        s.addShape("roundRect", { x, y: 2.0, w: cardW, h: 2.6, fill: { color: COLOR.sageSoft }, line: { color: COLOR.sage, width: 0.75 }, rectRadius: 0.1 });
        s.addShape("ellipse", { x: x + cardW / 2 - 0.22, y: 2.2, w: 0.44, h: 0.44, fill: { color: COLOR.accent }, line: { color: COLOR.accent } });
        s.addText(String(i + 1), { x: x + cardW / 2 - 0.22, y: 2.2, w: 0.44, h: 0.44, fontFace: FONT_TITLE, fontSize: 16, bold: true, color: COLOR.cream, align: "center", valign: "middle" });
        s.addText(b, { x: x + 0.15, y: 2.8, w: cardW - 0.3, h: 1.7, fontFace: FONT_BODY, fontSize: 13, color: COLOR.ink, align: "center", valign: "top" });
      });
    } else {
      const bulletText = bullets.map(b => ({
        text: b,
        options: { bullet: { code: "25CF" }, paraSpaceAfter: 10, fontFace: FONT_BODY, fontSize: 17, color: COLOR.ink },
      }));
      s.addText(bulletText as any, { x: 0.7, y: 1.9, w: 8.6, h: 3.2, valign: "top", color: COLOR.ink, paraSpaceAfter: 10 });
    }
  }

  if (slide.notes) s.addNotes(slide.notes);
  addFooter(s, meta.deckTitle, meta.idx, meta.total, meta.pseudonym);
}

// ============ Mindmap (universell) ============

function addMindmap(pptx: PptxGenJS, deck: SlideDeck, meta: Meta) {
  const s = pptx.addSlide();
  addBackground(s);
  addSectionHeader(s, "Übersicht", deck.title, "Mindmap aller Themen dieser Sitzung");

  // Zentraler Knoten
  const cx = 5.0, cy = 3.4;
  s.addShape("ellipse", { x: cx - 1.1, y: cy - 0.5, w: 2.2, h: 1.0, fill: { color: COLOR.sageDeep }, line: { color: COLOR.sageDeep } });
  s.addText(deck.topic || deck.title, {
    x: cx - 1.05, y: cy - 0.5, w: 2.1, h: 1.0,
    fontFace: FONT_TITLE, fontSize: 13, bold: true, color: COLOR.cream, align: "center", valign: "middle",
  });

  const items = deck.slides.slice(0, 8);
  const n = items.length;
  const radius = 2.5;
  items.forEach((sl, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const nx = cx + Math.cos(angle) * radius;
    const ny = cy + Math.sin(angle) * radius * 0.7;
    const w = 1.7, h = 0.7;
    const x = nx - w / 2, y = ny - h / 2;

    // Linie vom Zentrum
    const colors = [COLOR.accent, COLOR.calm, COLOR.sage, COLOR.warn];
    const col = colors[i % colors.length];
    const x1 = cx, y1 = cy;
    const x2 = nx, y2 = ny;
    s.addShape("line", {
      x: Math.min(x1, x2), y: Math.min(y1, y2),
      w: Math.abs(x2 - x1) || 0.01, h: Math.abs(y2 - y1) || 0.01,
      flipH: x2 < x1, flipV: y2 < y1,
      line: { color: col, width: 1.5 },
    });

    s.addShape("roundRect", { x, y, w, h, fill: { color: COLOR.cream }, line: { color: col, width: 1.5 }, rectRadius: 0.08 });
    s.addShape("ellipse", { x: x - 0.12, y: y + h / 2 - 0.12, w: 0.24, h: 0.24, fill: { color: col }, line: { color: col } });
    s.addText(`${i + 1}. ${sl.title}`, {
      x: x + 0.05, y, w: w - 0.1, h,
      fontFace: FONT_BODY, fontSize: 9, bold: true, color: COLOR.ink, align: "center", valign: "middle",
    });
  });

  addFooter(s, meta.deckTitle, meta.idx, meta.total, meta.pseudonym);
}

// ============ Visuelle Spezial-Folien ============

function addSORKC(pptx: PptxGenJS, meta: Meta) {
  const s = pptx.addSlide();
  addBackground(s);
  addSectionHeader(s, "Modell", "SORKC – Verhaltensanalyse", "Wie ein Verhalten entsteht und sich aufrechterhält");

  const labels = [
    { l: "S", t: "Stimulus", d: "Auslösende Situation" },
    { l: "O", t: "Organismus", d: "Vorgeschichte, Überzeugungen" },
    { l: "R", t: "Reaktion", d: "Gedanken, Gefühle, Verhalten" },
    { l: "K", t: "Kontingenz", d: "Wie regelmäßig folgt Konsequenz?" },
    { l: "C", t: "Konsequenz", d: "Kurz- und langfristige Wirkung" },
  ];
  const startX = 0.4, y = 2.0, boxW = 1.85, boxH = 1.8, gap = 0.05;
  labels.forEach((it, i) => {
    const x = startX + i * (boxW + gap);
    s.addShape("roundRect", { x, y, w: boxW, h: boxH, fill: { color: COLOR.sageSoft }, line: { color: COLOR.sage, width: 1 }, rectRadius: 0.1 });
    s.addShape("ellipse", { x: x + boxW / 2 - 0.32, y: y + 0.15, w: 0.64, h: 0.64, fill: { color: COLOR.accent }, line: { color: COLOR.accent } });
    s.addText(it.l, { x: x + boxW / 2 - 0.32, y: y + 0.15, w: 0.64, h: 0.64, fontFace: FONT_TITLE, fontSize: 24, bold: true, color: COLOR.cream, align: "center", valign: "middle" });
    s.addText(it.t, { x, y: y + 0.85, w: boxW, h: 0.35, fontFace: FONT_BODY, fontSize: 13, bold: true, color: COLOR.sageDeep, align: "center" });
    s.addText(it.d, { x: x + 0.08, y: y + 1.2, w: boxW - 0.16, h: 0.55, fontFace: FONT_BODY, fontSize: 9, color: COLOR.inkSoft, align: "center", valign: "top" });
    if (i < labels.length - 1) {
      s.addShape("rightArrow", { x: x + boxW + gap - 0.06, y: y + boxH / 2 - 0.08, w: 0.14, h: 0.16, fill: { color: COLOR.sage }, line: { color: COLOR.sage } });
    }
  });

  s.addText("Gemeinsam analysieren wir konkrete Situationen Schritt für Schritt.", {
    x: 0.4, y: 4.1, w: 9, h: 0.5, fontFace: FONT_BODY, fontSize: 13, italic: true, color: COLOR.inkSoft, align: "center",
  });

  addFooter(s, meta.deckTitle, meta.idx, meta.total, meta.pseudonym);
}

function addAngstTeufelskreis(pptx: PptxGenJS, meta: Meta) {
  const s = pptx.addSlide();
  addBackground(s);
  addSectionHeader(s, "Modell", "Teufelskreis der Angst", "So verstärkt sich Angst – und so durchbrechen wir den Kreis");

  const cx = 5.0, cy = 3.5, r = 1.6;
  const nodes = [
    { angle: -90, t: "Auslöser", d: "Situation/Reiz", c: COLOR.sage },
    { angle: 0, t: "Bewertung", d: "'gefährlich'", c: COLOR.warn },
    { angle: 90, t: "Körperreaktion", d: "Herz, Atem, Anspannung", c: COLOR.accent },
    { angle: 180, t: "Vermeidung", d: "Rückzug, Flucht", c: COLOR.calm },
  ];
  nodes.forEach((n, i) => {
    const rad = (n.angle * Math.PI) / 180;
    const x = cx + r * Math.cos(rad) - 1.0;
    const y = cy + r * Math.sin(rad) - 0.4;
    s.addShape("ellipse", { x, y, w: 2.0, h: 0.9, fill: { color: COLOR.cream }, line: { color: n.c, width: 2 } });
    s.addText(n.t, { x, y: y + 0.05, w: 2.0, h: 0.4, fontFace: FONT_BODY, fontSize: 12, bold: true, color: n.c, align: "center", valign: "middle" });
    s.addText(n.d, { x, y: y + 0.45, w: 2.0, h: 0.4, fontFace: FONT_BODY, fontSize: 9, color: COLOR.inkSoft, align: "center" });

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
      line: { color: COLOR.warn, width: 1.5, endArrowType: "triangle" },
    });
  });

  s.addShape("ellipse", { x: cx - 0.7, y: cy - 0.35, w: 1.4, h: 0.7, fill: { color: COLOR.warn }, line: { color: COLOR.warn } });
  s.addText("ANGST", { x: cx - 0.7, y: cy - 0.35, w: 1.4, h: 0.7, fontFace: FONT_TITLE, fontSize: 16, bold: true, color: COLOR.cream, align: "center", valign: "middle" });

  addFooter(s, meta.deckTitle, meta.idx, meta.total, meta.pseudonym);
}

function addABCModell(pptx: PptxGenJS, meta: Meta) {
  const s = pptx.addSlide();
  addBackground(s);
  addSectionHeader(s, "Kognitive Therapie", "Das ABC-Modell", "Nicht die Situation, sondern unsere Bewertung erzeugt das Gefühl");

  const items = [
    { l: "A", t: "Auslöser", d: "Was ist objektiv passiert?", color: COLOR.sageSoft, accent: COLOR.sage },
    { l: "B", t: "Bewertung", d: "Welcher Gedanke entstand?", color: COLOR.accentSoft, accent: COLOR.accent },
    { l: "C", t: "Konsequenz", d: "Welches Gefühl, Verhalten folgte?", color: COLOR.creamDeep, accent: COLOR.sageDeep },
  ];
  items.forEach((it, i) => {
    const x = 0.6 + i * 3.0;
    s.addShape("roundRect", { x, y: 2.0, w: 2.7, h: 2.4, fill: { color: it.color }, line: { color: it.accent, width: 1.5 }, rectRadius: 0.12 });
    s.addText(it.l, { x, y: 2.15, w: 2.7, h: 0.9, fontFace: FONT_TITLE, fontSize: 60, bold: true, color: it.accent, align: "center" });
    s.addText(it.t, { x, y: 3.05, w: 2.7, h: 0.4, fontFace: FONT_BODY, fontSize: 16, bold: true, color: COLOR.sageDeep, align: "center" });
    s.addText(it.d, { x: x + 0.15, y: 3.5, w: 2.4, h: 0.8, fontFace: FONT_BODY, fontSize: 12, color: COLOR.inkSoft, align: "center", valign: "top" });
    if (i < items.length - 1) {
      s.addShape("rightArrow", { x: x + 2.78, y: 3.05, w: 0.18, h: 0.3, fill: { color: COLOR.accent }, line: { color: COLOR.accent } });
    }
  });
  addFooter(s, meta.deckTitle, meta.idx, meta.total, meta.pseudonym);
}

function addWerteKompass(pptx: PptxGenJS, meta: Meta) {
  const s = pptx.addSlide();
  addBackground(s);
  addSectionHeader(s, "ACT", "Werte-Kompass", "Vier Lebensbereiche – welche Richtung ist Ihnen wichtig?");

  const cx = 5.0, cy = 3.5, r = 1.7;
  s.addShape("ellipse", { x: cx - r, y: cy - r, w: r * 2, h: r * 2, fill: { color: COLOR.cream }, line: { color: COLOR.sage, width: 2 } });
  s.addShape("ellipse", { x: cx - r * 0.66, y: cy - r * 0.66, w: r * 1.33, h: r * 1.33, fill: { color: "FFFFFF" }, line: { color: COLOR.line, width: 0.75 } });
  s.addShape("ellipse", { x: cx - r * 0.33, y: cy - r * 0.33, w: r * 0.66, h: r * 0.66, fill: { color: COLOR.cream }, line: { color: COLOR.line, width: 0.75 } });
  s.addShape("line", { x: cx - r, y: cy, w: r * 2, h: 0, line: { color: COLOR.line, width: 0.75 } });
  s.addShape("line", { x: cx, y: cy - r, w: 0, h: r * 2, line: { color: COLOR.line, width: 0.75 } });

  const quads = [
    { dx: -0.95, dy: -0.85, t: "Beziehung\n& Familie", c: COLOR.accent },
    { dx: 0.05, dy: -0.85, t: "Beruf\n& Bildung", c: COLOR.sage },
    { dx: -0.95, dy: 0.25, t: "Gesundheit\n& Körper", c: COLOR.calm },
    { dx: 0.05, dy: 0.25, t: "Freizeit\n& Sinn", c: COLOR.warn },
  ];
  quads.forEach(q => {
    s.addText(q.t, {
      x: cx + q.dx, y: cy + q.dy, w: 0.9, h: 0.6,
      fontFace: FONT_BODY, fontSize: 11, bold: true, color: q.c, align: "center",
    });
  });
  // Norden / Kompassspitze
  s.addShape("triangle", { x: cx - 0.15, y: cy - r - 0.2, w: 0.3, h: 0.4, fill: { color: COLOR.accent }, line: { color: COLOR.accent } });
  s.addText("N", { x: cx - 0.2, y: cy - r - 0.6, w: 0.4, h: 0.3, fontFace: FONT_TITLE, fontSize: 12, bold: true, color: COLOR.sageDeep, align: "center" });

  s.addShape("ellipse", { x: cx - 0.18, y: cy - 0.18, w: 0.36, h: 0.36, fill: { color: COLOR.sageDeep }, line: { color: COLOR.sageDeep } });

  addFooter(s, meta.deckTitle, meta.idx, meta.total, meta.pseudonym);
}

function addACTBus(pptx: PptxGenJS, meta: Meta) {
  const s = pptx.addSlide();
  addBackground(s);
  addSectionHeader(s, "ACT – Defusion", "Die Bus-Metapher", "Sie steuern – die Gedanken sind nur Passagiere");

  // Bus-Karosserie
  const bx = 1.5, by = 2.4, bw = 7.0, bh = 1.8;
  s.addShape("roundRect", { x: bx, y: by, w: bw, h: bh, fill: { color: COLOR.accent }, line: { color: COLOR.accentDeep, width: 2 }, rectRadius: 0.2 });
  // Frontfenster (Fahrer)
  s.addShape("roundRect", { x: bx + bw - 1.4, y: by + 0.2, w: 1.2, h: 0.9, fill: { color: COLOR.calmSoft }, line: { color: COLOR.sageDeep, width: 1 }, rectRadius: 0.05 });
  // Passagier-Fenster
  for (let i = 0; i < 4; i++) {
    s.addShape("rect", { x: bx + 0.3 + i * 1.3, y: by + 0.2, w: 1.0, h: 0.9, fill: { color: COLOR.cream }, line: { color: COLOR.sageDeep, width: 0.75 } });
  }
  // Räder
  s.addShape("ellipse", { x: bx + 0.7, y: by + bh - 0.2, w: 0.6, h: 0.6, fill: { color: COLOR.ink }, line: { color: COLOR.ink } });
  s.addShape("ellipse", { x: bx + bw - 1.3, y: by + bh - 0.2, w: 0.6, h: 0.6, fill: { color: COLOR.ink }, line: { color: COLOR.ink } });

  // Fahrer-Label
  s.addText("SIE\n(Werte)", { x: bx + bw - 1.4, y: by + 0.25, w: 1.2, h: 0.8, fontFace: FONT_BODY, fontSize: 9, bold: true, color: COLOR.sageDeep, align: "center", valign: "middle" });

  // Passagiere = Gedanken
  const thoughts = ["'Ich kann das nicht'", "'Was, wenn...'", "'Zu schwer'", "'Lieber nicht'"];
  thoughts.forEach((t, i) => {
    s.addText(t, {
      x: bx + 0.3 + i * 1.3, y: by + 0.3, w: 1.0, h: 0.7,
      fontFace: FONT_BODY, fontSize: 8, italic: true, color: COLOR.inkSoft, align: "center", valign: "middle",
    });
  });

  // Straßenpfeil = Werterichtung
  s.addShape("rightArrow", { x: 8.8, y: 3.1, w: 0.6, h: 0.4, fill: { color: COLOR.sageDeep }, line: { color: COLOR.sageDeep } });
  s.addText("Ihre Werte", { x: 8.3, y: 3.55, w: 1.5, h: 0.3, fontFace: FONT_BODY, fontSize: 10, bold: true, color: COLOR.sageDeep });

  s.addText("Gedanken dürfen mitfahren – aber Sie bestimmen die Richtung.", {
    x: 0.4, y: 4.5, w: 9, h: 0.4, fontFace: FONT_BODY, fontSize: 13, italic: true, color: COLOR.inkSoft, align: "center",
  });

  addFooter(s, meta.deckTitle, meta.idx, meta.total, meta.pseudonym);
}

function addSchemaModi(pptx: PptxGenJS, meta: Meta) {
  const s = pptx.addSlide();
  addBackground(s);
  addSectionHeader(s, "Schematherapie", "Modus-Modell", "Innere Anteile, die im Alltag wechseln");

  const groups = [
    { t: "Kind-Modi", color: COLOR.warn, soft: COLOR.warnSoft, items: ["Verletzliches Kind", "Wütendes Kind", "Glückliches Kind"] },
    { t: "Eltern-Modi", color: COLOR.accent, soft: COLOR.accentSoft, items: ["Strafender Elternteil", "Fordernder Elternteil"] },
    { t: "Bewältigungs-Modi", color: COLOR.calm, soft: COLOR.calmSoft, items: ["Vermeider", "Überkompensierer", "Erdulder"] },
    { t: "Gesunder Erwachsener", color: COLOR.sage, soft: COLOR.sageSoft, items: ["Klärt", "Schützt", "Integriert"] },
  ];
  groups.forEach((g, i) => {
    const x = 0.4 + i * 2.35;
    s.addShape("roundRect", { x, y: 2.0, w: 2.2, h: 2.7, fill: { color: g.soft }, line: { color: g.color, width: 1.5 }, rectRadius: 0.1 });
    s.addShape("rect", { x, y: 2.0, w: 2.2, h: 0.5, fill: { color: g.color }, line: { color: g.color } });
    s.addText(g.t, { x, y: 2.0, w: 2.2, h: 0.5, fontFace: FONT_BODY, fontSize: 12, bold: true, color: COLOR.cream, align: "center", valign: "middle" });
    g.items.forEach((it, j) => {
      s.addShape("ellipse", { x: x + 0.2, y: 2.7 + j * 0.5 + 0.1, w: 0.12, h: 0.12, fill: { color: g.color }, line: { color: g.color } });
      s.addText(it, { x: x + 0.4, y: 2.65 + j * 0.5, w: 1.7, h: 0.4, fontFace: FONT_BODY, fontSize: 10, color: COLOR.ink, valign: "middle" });
    });
  });

  addFooter(s, meta.deckTitle, meta.idx, meta.total, meta.pseudonym);
}

function addAchtsamkeit(pptx: PptxGenJS, meta: Meta) {
  const s = pptx.addSlide();
  addBackground(s);
  addSectionHeader(s, "Achtsamkeit", "3-Minuten-Atemraum", "Drei einfache Schritte – jederzeit anwendbar");

  const steps = [
    { n: "1", t: "Wahrnehmen", d: "Was ist gerade da?\nGedanken · Gefühle · Körper", c: COLOR.sage },
    { n: "2", t: "Sammeln", d: "Aufmerksamkeit\nzum Atem führen", c: COLOR.accent },
    { n: "3", t: "Ausdehnen", d: "Wahrnehmung\nauf den ganzen Körper", c: COLOR.calm },
  ];
  steps.forEach((st, i) => {
    const cx = 2.0 + i * 3.0, cy = 3.3, r = 1.1;
    s.addShape("ellipse", { x: cx - r, y: cy - r, w: r * 2, h: r * 2, fill: { color: COLOR.cream }, line: { color: st.c, width: 2 } });
    s.addShape("ellipse", { x: cx - r * 0.7, y: cy - r * 0.7, w: r * 1.4, h: r * 1.4, fill: { color: "FFFFFF" }, line: { color: st.c, width: 0.5 } });
    s.addText(st.n, { x: cx - 0.5, y: cy - 0.7, w: 1.0, h: 0.6, fontFace: FONT_TITLE, fontSize: 36, bold: true, color: st.c, align: "center" });
    s.addText(st.t, { x: cx - 1.0, y: cy - 0.1, w: 2.0, h: 0.35, fontFace: FONT_BODY, fontSize: 13, bold: true, color: COLOR.sageDeep, align: "center" });
    s.addText(st.d, { x: cx - 1.0, y: cy + 0.25, w: 2.0, h: 0.7, fontFace: FONT_BODY, fontSize: 9, color: COLOR.inkSoft, align: "center" });
    if (i < steps.length - 1) {
      s.addShape("rightArrow", { x: cx + r + 0.1, y: cy - 0.1, w: 0.2, h: 0.25, fill: { color: COLOR.accent }, line: { color: COLOR.accent } });
    }
  });
  s.addText("Eine Insel der Ruhe – mitten im Alltag.", {
    x: 0.4, y: 4.7, w: 9, h: 0.3, fontFace: FONT_BODY, fontSize: 12, italic: true, color: COLOR.inkSoft, align: "center",
  });
  addFooter(s, meta.deckTitle, meta.idx, meta.total, meta.pseudonym);
}

function addDepressionSpirale(pptx: PptxGenJS, meta: Meta) {
  const s = pptx.addSlide();
  addBackground(s);
  addSectionHeader(s, "Psychoedukation", "Negativspirale & Aktivierung", "Wie sich Antriebslosigkeit aufrechterhält – und was hilft");

  // Linke Spalte: Negativspirale (absteigend)
  s.addText("Abwärtsspirale", { x: 0.4, y: 1.9, w: 4.5, h: 0.3, fontFace: FONT_BODY, fontSize: 12, bold: true, color: COLOR.warn });
  const down = ["Niedergeschlagene Stimmung", "Weniger Aktivität", "Weniger Erfolg & Freude", "Mehr Grübeln", "Tiefere Niedergeschlagenheit"];
  down.forEach((t, i) => {
    const y = 2.25 + i * 0.55;
    s.addShape("roundRect", { x: 0.4 + i * 0.15, y, w: 4.5 - i * 0.3, h: 0.4, fill: { color: COLOR.warnSoft }, line: { color: COLOR.warn, width: 0.75 }, rectRadius: 0.05 });
    s.addText(t, { x: 0.4 + i * 0.15, y, w: 4.5 - i * 0.3, h: 0.4, fontFace: FONT_BODY, fontSize: 10, color: COLOR.ink, align: "center", valign: "middle" });
  });

  // Rechte Spalte: Aktivierung (aufsteigend)
  s.addText("Aufwärtsspirale", { x: 5.1, y: 1.9, w: 4.5, h: 0.3, fontFace: FONT_BODY, fontSize: 12, bold: true, color: COLOR.sageDeep });
  const up = ["Kleine angenehme Aktivität", "Erstes Erfolgserlebnis", "Etwas mehr Energie", "Sozialer Kontakt", "Bessere Stimmung"];
  up.forEach((t, i) => {
    const y = 4.55 - i * 0.55;
    s.addShape("roundRect", { x: 5.1 + i * 0.15, y, w: 4.5 - i * 0.3, h: 0.4, fill: { color: COLOR.sageSoft }, line: { color: COLOR.sage, width: 0.75 }, rectRadius: 0.05 });
    s.addText(t, { x: 5.1 + i * 0.15, y, w: 4.5 - i * 0.3, h: 0.4, fontFace: FONT_BODY, fontSize: 10, color: COLOR.ink, align: "center", valign: "middle" });
  });

  addFooter(s, meta.deckTitle, meta.idx, meta.total, meta.pseudonym);
}

function addDenkfallenGrid(pptx: PptxGenJS, meta: Meta) {
  const s = pptx.addSlide();
  addBackground(s);
  addSectionHeader(s, "Kognitive Therapie", "Typische Denkfallen", "Welche erkennen Sie bei sich wieder?");

  const traps = [
    { t: "Schwarz-Weiß-Denken", d: "Alles oder nichts", c: COLOR.warn },
    { t: "Katastrophisieren", d: "Vom Schlimmsten ausgehen", c: COLOR.accent },
    { t: "Personalisieren", d: "Alles auf sich beziehen", c: COLOR.calm },
    { t: "Gedankenlesen", d: "Wissen, was andere denken", c: COLOR.sage },
    { t: "Filtern", d: "Nur Negatives sehen", c: COLOR.warn },
    { t: "Sollte-Denken", d: "Strenge innere Regeln", c: COLOR.accent },
  ];
  traps.forEach((tr, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.4 + col * 3.05, y = 2.0 + row * 1.3;
    s.addShape("roundRect", { x, y, w: 2.9, h: 1.15, fill: { color: COLOR.cream }, line: { color: tr.c, width: 1.5 }, rectRadius: 0.1 });
    s.addShape("rect", { x, y, w: 0.12, h: 1.15, fill: { color: tr.c }, line: { color: tr.c } });
    s.addText(tr.t, { x: x + 0.25, y: y + 0.1, w: 2.6, h: 0.4, fontFace: FONT_BODY, fontSize: 13, bold: true, color: COLOR.sageDeep });
    s.addText(tr.d, { x: x + 0.25, y: y + 0.55, w: 2.6, h: 0.5, fontFace: FONT_BODY, fontSize: 10, color: COLOR.inkSoft, italic: true });
  });

  addFooter(s, meta.deckTitle, meta.idx, meta.total, meta.pseudonym);
}

// Mappt template-IDs auf 1-2 visuelle Spezial-Folien
const VISUAL_INSERTS: Record<string, Array<(pptx: PptxGenJS, meta: Meta) => void>> = {
  "kvt-sorkc": [addSORKC],
  "psychoed-angst": [addAngstTeufelskreis],
  "kvt-gedankenprotokoll": [addABCModell, addDenkfallenGrid],
  "act-werte": [addWerteKompass],
  "act-defusion": [addACTBus],
  "schema-modi": [addSchemaModi],
  "achtsamkeit-basis": [addAchtsamkeit],
  "psychoed-depression": [addDepressionSpirale],
};

// ============ Public API ============

export async function exportDeckAsPPTX(deck: SlideDeck): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "TP_LAYOUT", width: 10, height: 5.625 });
  pptx.layout = "TP_LAYOUT";
  pptx.title = deck.title;
  pptx.author = "TheraPilot";
  pptx.company = "TheraPilot";

  addTitleSlide(pptx, deck.title, deck.topic, deck.patientId);

  const visuals = (deck.templateId ? VISUAL_INSERTS[deck.templateId] : undefined) ?? [];
  // +1 Mindmap-Übersicht für jedes Deck mit ≥3 Slides
  const includeMindmap = deck.slides.length >= 3;
  const total = deck.slides.length + visuals.length + (includeMindmap ? 1 : 0);
  let idx = 1;

  if (includeMindmap) {
    addMindmap(pptx, deck, { deckTitle: deck.title, idx, total, pseudonym: deck.patientId });
    idx++;
  }

  for (const v of visuals) {
    v(pptx, { deckTitle: deck.title, idx, total, pseudonym: deck.patientId });
    idx++;
  }

  for (const slide of deck.slides) {
    addContentSlide(pptx, slide, { deckTitle: deck.title, idx, total, pseudonym: deck.patientId });
    idx++;
  }

  // Schluss-Folie
  const last = pptx.addSlide();
  last.background = { color: COLOR.sageDeep };
  last.addShape("ellipse", { x: -1, y: 4, w: 3, h: 3, fill: { color: COLOR.sage }, line: { color: COLOR.sage } });
  last.addShape("ellipse", { x: 8, y: -1, w: 3, h: 3, fill: { color: COLOR.accent }, line: { color: COLOR.accent } });
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
