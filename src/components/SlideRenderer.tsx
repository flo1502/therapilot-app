// In-App-Renderer für didaktische Slide-Layouts.
// Wird sowohl im SlideEditor (Vorschau) als auch im SlidePresent (Vollbild)
// verwendet. Fällt bei fehlenden Layout-Daten auf "bullets" zurück.
import type { Slide } from "@/lib/db";
import { getIcon } from "@/lib/slideIcons";
import { ArrowRight, ArrowDown } from "lucide-react";

interface Props {
  slide: Slide;
  variant?: "preview" | "present";
}

export function SlideRenderer({ slide, variant = "preview" }: Props) {
  const isPresent = variant === "present";
  const layout = slide.layout ?? "bullets";
  const data = slide.layoutData ?? {};
  const { Icon } = getIcon(slide.iconKey);

  const titleClass = isPresent
    ? "font-display text-4xl md:text-6xl text-primary"
    : "font-display text-2xl text-primary";

  return (
    <div className={`w-full ${isPresent ? "max-w-5xl mx-auto" : ""}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`rounded-full bg-accent/15 text-accent flex items-center justify-center ${isPresent ? "size-14" : "size-10"}`}>
          <Icon className={isPresent ? "size-7" : "size-5"} />
        </div>
        <h2 className={titleClass}>{slide.title}</h2>
      </div>

      {layout === "headline" && (data.headline || slide.bullets[0]) && (
        <div className={`text-center py-${isPresent ? "12" : "6"} px-4`}>
          <p className={`font-display ${isPresent ? "text-5xl md:text-6xl" : "text-3xl"} text-primary leading-tight`}>
            „{data.headline ?? slide.bullets[0]}"
          </p>
          {data.subline && (
            <p className={`mt-6 italic text-muted-foreground ${isPresent ? "text-2xl" : "text-base"}`}>
              {data.subline}
            </p>
          )}
        </div>
      )}

      {layout === "question" && (
        <div className={`text-center py-${isPresent ? "10" : "6"} px-4`}>
          <div className={`font-display text-accent ${isPresent ? "text-7xl" : "text-5xl"} mb-4`}>?</div>
          <p className={`font-display ${isPresent ? "text-4xl md:text-5xl" : "text-2xl"} text-primary leading-tight`}>
            {data.headline ?? slide.bullets[0]}
          </p>
          {data.subline && (
            <p className={`mt-6 italic text-muted-foreground ${isPresent ? "text-xl" : "text-sm"}`}>
              {data.subline}
            </p>
          )}
        </div>
      )}

      {layout === "model" && data.nodes && data.nodes.length > 0 && (
        <div className="flex flex-wrap items-stretch gap-3 justify-center">
          {data.nodes.map((n, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`rounded-2xl border-2 border-primary/20 bg-card p-4 flex flex-col items-center text-center min-w-[140px] max-w-[200px] ${isPresent ? "min-h-[140px]" : "min-h-[100px]"}`}>
                <div className={`rounded-full bg-accent text-accent-foreground font-display flex items-center justify-center mb-2 ${isPresent ? "size-12 text-2xl" : "size-9 text-lg"}`}>
                  {i + 1}
                </div>
                <div className={`font-display text-primary ${isPresent ? "text-xl" : "text-base"} mb-1`}>{n.label}</div>
                {n.description && (
                  <div className={`text-muted-foreground ${isPresent ? "text-sm" : "text-xs"} leading-snug`}>{n.description}</div>
                )}
              </div>
              {i < data.nodes!.length - 1 && (
                <ArrowRight className={`text-accent shrink-0 ${isPresent ? "size-7" : "size-5"}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {layout === "vicious-cycle" && data.cycleNodes && data.cycleNodes.length === 4 && (
        <div className={`relative mx-auto ${isPresent ? "w-[560px] h-[420px]" : "w-full max-w-[380px] h-[300px]"}`}>
          {/* Zentrum */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center font-display"
               style={{ width: isPresent ? 130 : 100, height: isPresent ? 130 : 100, fontSize: isPresent ? 22 : 16 }}>
            {data.centerLabel ?? "Kreislauf"}
          </div>
          {/* 4 Knoten */}
          {data.cycleNodes.map((n, i) => {
            const positions = [
              { top: 0, left: "50%", translate: "-50%, 0" },          // oben
              { top: "50%", right: 0, translate: "0, -50%" },         // rechts
              { bottom: 0, left: "50%", translate: "-50%, 0" },       // unten
              { top: "50%", left: 0, translate: "0, -50%" },          // links
            ];
            const p = positions[i];
            return (
              <div key={i} className="absolute rounded-2xl border-2 border-accent bg-card p-3 text-center"
                   style={{ ...p, transform: `translate(${p.translate})`, width: isPresent ? 180 : 140 }}>
                <div className={`font-display text-primary ${isPresent ? "text-lg" : "text-sm"}`}>{n.label}</div>
                {n.description && (
                  <div className={`text-muted-foreground ${isPresent ? "text-xs" : "text-[10px]"} leading-snug mt-0.5`}>
                    {n.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {layout === "before-after" && (data.before || data.after) && (
        <div className="grid md:grid-cols-2 gap-4">
          {data.before && (
            <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-5">
              <div className={`font-display text-destructive mb-3 ${isPresent ? "text-2xl" : "text-lg"}`}>{data.before.title}</div>
              <ul className={`space-y-2 ${isPresent ? "text-lg" : "text-sm"}`}>
                {data.before.items.map((it, i) => (
                  <li key={i} className="flex gap-2"><span className="text-destructive">✕</span><span>{it}</span></li>
                ))}
              </ul>
            </div>
          )}
          {data.after && (
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5">
              <div className={`font-display text-primary mb-3 ${isPresent ? "text-2xl" : "text-lg"}`}>{data.after.title}</div>
              <ul className={`space-y-2 ${isPresent ? "text-lg" : "text-sm"}`}>
                {data.after.items.map((it, i) => (
                  <li key={i} className="flex gap-2"><span className="text-primary">✓</span><span>{it}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {layout === "steps" && data.steps && data.steps.length > 0 && (
        <div className="space-y-3">
          {data.steps.map((st, i) => (
            <div key={i} className="flex gap-4 items-start rounded-xl bg-card border border-border p-4">
              <div className={`shrink-0 rounded-full bg-accent text-accent-foreground font-display flex items-center justify-center ${isPresent ? "size-12 text-xl" : "size-10 text-base"}`}>
                {i + 1}
              </div>
              <div className="flex-1">
                <div className={`font-display text-primary ${isPresent ? "text-2xl" : "text-lg"}`}>{st.title}</div>
                {st.description && (
                  <div className={`text-muted-foreground ${isPresent ? "text-base" : "text-sm"} mt-1`}>{st.description}</div>
                )}
              </div>
              {i < data.steps!.length - 1 && <ArrowDown className="text-accent/60 size-5 mt-3" />}
            </div>
          ))}
        </div>
      )}

      {(layout === "bullets" || (!data.headline && !data.nodes && !data.cycleNodes && !data.before && !data.after && !data.steps && layout !== "headline" && layout !== "question")) && (
        <ul className={`space-y-3 ${isPresent ? "text-xl md:text-2xl" : "text-base"}`}>
          {slide.bullets.map((b, i) => (
            <li key={i} className="flex gap-3"><span className="text-accent shrink-0">•</span><span>{b}</span></li>
          ))}
        </ul>
      )}
    </div>
  );
}
