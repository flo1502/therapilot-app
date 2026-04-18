// Kuratierte SVG-Icons für Slide-Layouts. Geliefert als React-Komponenten und
// als reine Pfad-Daten für den PPTX-Export (custGeom – einfacher: wir rendern
// im PPTX einen großen Stroke-Kreis + Buchstabe, und in-App das echte SVG).
import {
  Brain, Heart, Compass, Wind, Scale, Lightbulb, Target, Leaf, Sun,
  RefreshCw, ListOrdered, HelpCircle, Shield, HeartHandshake,
  type LucideIcon,
} from "lucide-react";

export type IconKey =
  | "brain" | "heart" | "compass" | "breath" | "scale" | "lightbulb"
  | "target" | "leaf" | "sun" | "cycle" | "steps" | "question" | "shield" | "hands";

export const SLIDE_ICONS: Record<IconKey, { Icon: LucideIcon; label: string; glyph: string }> = {
  brain:     { Icon: Brain,         label: "Gedanken",      glyph: "🧠" },
  heart:     { Icon: Heart,         label: "Gefühl",        glyph: "♥" },
  compass:   { Icon: Compass,       label: "Werte",         glyph: "✦" },
  breath:    { Icon: Wind,          label: "Atem",          glyph: "≋" },
  scale:     { Icon: Scale,         label: "Balance",       glyph: "⚖" },
  lightbulb: { Icon: Lightbulb,     label: "Einsicht",      glyph: "✦" },
  target:    { Icon: Target,        label: "Ziel",          glyph: "◎" },
  leaf:      { Icon: Leaf,          label: "Wachstum",      glyph: "❀" },
  sun:       { Icon: Sun,           label: "Hoffnung",      glyph: "☀" },
  cycle:     { Icon: RefreshCw,     label: "Kreislauf",     glyph: "↻" },
  steps:     { Icon: ListOrdered,   label: "Schritte",      glyph: "▤" },
  question:  { Icon: HelpCircle,    label: "Frage",         glyph: "?" },
  shield:    { Icon: Shield,        label: "Schutz",        glyph: "◈" },
  hands:     { Icon: HeartHandshake, label: "Verbindung",   glyph: "✿" },
};

export function getIcon(key?: string) {
  if (!key) return SLIDE_ICONS.lightbulb;
  return SLIDE_ICONS[key as IconKey] ?? SLIDE_ICONS.lightbulb;
}
