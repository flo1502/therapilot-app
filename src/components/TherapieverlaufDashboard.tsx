import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Sparkles, TrendingUp, TrendingDown, Minus, Check, X, Circle, RefreshCw,
  AlertTriangle, ShieldAlert, Info, ThumbsUp, Quote,
} from "lucide-react";
import { toast } from "sonner";
import { db, SessionEntry } from "@/lib/db";
import { callAi } from "@/lib/ai/provider";
import {
  SessionKPIs, cognitiveShiftIndex, depressionRecoveryIndex, trendArrow,
  computeDSI, computeCDI, computeBAI, computeFunctioning,
  computePHQ9, computeBDI, computeHAMD,
  PHQ_THRESHOLDS, BDI_THRESHOLDS, HAMD_THRESHOLDS,
  generateAlerts, generateClinicalSummary, InsightAlert,
} from "@/lib/kpiTypes";
import { PatternEnginePanel } from "@/components/kpi/PatternEnginePanel";

interface Props {
  patientId: string;
  currentSessionId?: string;
  currentTranscript?: string;
  patientPseudonym?: string;
}

interface Row {
  session: SessionEntry;
  nr: number;
  kpis?: SessionKPIs;
}

const tooltipStyle = {
  background: "hsl(var(--background))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

export function TherapieverlaufDashboard({ patientId, currentSessionId, currentTranscript, patientPseudonym }: Props) {
  const sessions = useLiveQuery(
    () => patientId
      ? db.sessions.where("patientId").equals(patientId).toArray()
      : Promise.resolve([] as SessionEntry[]),
    [patientId],
  );
  const [busy, setBusy] = useState(false);
  const [drilldown, setDrilldown] = useState<Row | null>(null);

  const rows: Row[] = useMemo(() => {
    if (!sessions) return [];
    const sorted = [...sessions].sort((a, b) => a.date - b.date);
    return sorted.map((s, i) => ({ session: s, nr: i + 1, kpis: s.sessionKPIs }));
  }, [sessions]);

  const withKPIs = rows.filter(r => r.kpis);
  const chartData = withKPIs.map(r => {
    const k = r.kpis!;
    return {
      name: `S${r.nr}`,
      nr: r.nr,
      sessionId: r.session.id,
      ...k,
      csi: cognitiveShiftIndex(k),
      dri: depressionRecoveryIndex(k),
      dsi: computeDSI(k),
      cdi: computeCDI(k),
      bai: computeBAI(k),
      fn: computeFunctioning(k),
      phq9: computePHQ9(k),
      bdi: computeBDI(k),
      hamd: computeHAMD(k),
      risk: k.riskLevel ?? 0,
      // normalized 0-100 für Cross-Scale
      phq9Norm: Math.round((computePHQ9(k) / PHQ_THRESHOLDS.max) * 100),
      bdiNorm: Math.round((computeBDI(k) / BDI_THRESHOLDS.max) * 100),
      hamdNorm: Math.round((computeHAMD(k) / HAMD_THRESHOLDS.max) * 100),
    };
  });

  const currentRow = rows.find(r => r.session.id === currentSessionId);
  const hasCurrentKPIs = !!currentRow?.kpis;

  const alerts = useMemo(
    () => generateAlerts(withKPIs.map(r => ({ nr: r.nr, kpis: r.kpis! }))),
    [chartData.length],
  );
  const summary = useMemo(
    () => generateClinicalSummary(withKPIs.map(r => ({ nr: r.nr, kpis: r.kpis! }))),
    [chartData.length],
  );

  const maxRisk = Math.max(0, ...withKPIs.map(r => r.kpis!.riskLevel ?? 0));
  const latestKPIs = withKPIs.at(-1)?.kpis;

  const extractCurrent = async () => {
    if (!patientId) {
      toast.error("Bitte zuerst Patient:in wählen und Session speichern.");
      return;
    }
    if (!currentSessionId || !currentTranscript?.trim()) {
      toast.error("Bitte zuerst ein Transkript im KV-Verlauf-Tab erfassen.");
      return;
    }
    const persisted = await db.sessions.get(currentSessionId);
    if (!persisted) {
      toast.error("Bitte Session zuerst oben speichern, dann KPIs extrahieren.");
      return;
    }
    setBusy(true);
    try {
      const data = await callAi<Omit<SessionKPIs, "extractedAt">>({
        task: "depression-kpi-extract",
        patientPseudonym,
        payload: { transcript: currentTranscript, sessionId: currentSessionId },
      });
      const kpis: SessionKPIs = { ...data, extractedAt: Date.now() };
      await db.sessions.put({ ...persisted, sessionKPIs: kpis });
      toast.success("KPIs extrahiert.");
    } catch (e: any) {
      console.error("KPI extract error:", e);
      toast.error(e?.message ?? "AI-Fehler");
    } finally {
      setBusy(false);
    }
  };

  if (!sessions) return <div className="text-sm text-muted-foreground">Lade…</div>;

  const lastDRI = chartData.at(-1)?.dri ?? 0;
  const firstDRI = chartData[0]?.dri ?? 0;
  const driTrend = trendArrow(lastDRI, firstDRI);

  return (
    <div className="space-y-4">
      {/* Risk Banner */}
      {maxRisk >= 2 && (
        <Alert variant="destructive">
          <ShieldAlert className="size-4" />
          <AlertTitle>Risikomarker erhöht</AlertTitle>
          <AlertDescription>
            In mind. einer Sitzung wurde {maxRisk === 3 ? "konkrete Planung" : "aktive Suizidideation"} erkannt.
            Krisenplan prüfen.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-medium text-sm">Verlauf der Depression – Multi-Session Analyse</div>
            <div className="text-xs text-muted-foreground">
              {rows.length} Session{rows.length === 1 ? "" : "s"} · {withKPIs.length} mit KPIs · F32/F33
            </div>
          </div>
          {currentSessionId && (
            <Button onClick={extractCurrent} disabled={busy} size="sm">
              {hasCurrentKPIs ? <RefreshCw className="size-4 mr-2" /> : <Sparkles className="size-4 mr-2" />}
              {busy ? "Analysiere…" : hasCurrentKPIs ? "KPIs neu extrahieren" : "KPIs für diese Session extrahieren"}
            </Button>
          )}
        </CardContent>
      </Card>

      {withKPIs.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-sm text-muted-foreground text-center">
            Noch keine KPIs erfasst. Klicke oben auf <b>„KPIs extrahieren"</b>,
            um aus dem Transkript der aktuellen Sitzung quantitative Verlaufs-Indikatoren zu gewinnen.
          </CardContent>
        </Card>
      )}

      {withKPIs.length > 0 && (
        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="master">Master KPIs</TabsTrigger>
            <TabsTrigger value="diagnostik">Diagnostik</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="crossscale">Cross-Scale</TabsTrigger>
            <TabsTrigger value="alerts">
              Alerts {alerts.length > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1">{alerts.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="patterns">Pattern Engine</TabsTrigger>
          </TabsList>

          {/* ============ OVERVIEW ============ */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <DRIOverview lastDRI={lastDRI} firstDRI={firstDRI} trend={driTrend} data={chartData} />

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <KpiTile label="DSI" value={chartData.at(-1)?.dsi ?? 0} suffix="/100" data={chartData} dataKey="dsi" inverse color="hsl(0 70% 55%)" />
              <KpiTile label="CDI" value={chartData.at(-1)?.cdi ?? 0} suffix="/100" data={chartData} dataKey="cdi" inverse color="hsl(25 85% 55%)" />
              <KpiTile label="BAI" value={chartData.at(-1)?.bai ?? 0} suffix="/100" data={chartData} dataKey="bai" color="hsl(45 90% 50%)" />
              <KpiTile label="Functioning" value={chartData.at(-1)?.fn ?? 0} suffix="/100" data={chartData} dataKey="fn" color="hsl(140 60% 45%)" />
              <KpiTile label="Risk" value={chartData.at(-1)?.risk ?? 0} suffix="/3" data={chartData} dataKey="risk" inverse color="hsl(0 80% 50%)" />
            </div>

            {summary.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Clinical Summary</CardTitle></CardHeader>
                <CardContent className="space-y-1.5">
                  {summary.map((s, i) => (
                    <div key={i} className="text-sm flex gap-2">
                      <span className="text-muted-foreground">•</span>{s}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============ MASTER KPIs ============ */}
          <TabsContent value="master" className="mt-4 space-y-4">
            <ChartCard title="1. Depression Severity Index (DSI)" subtitle="Stimmung · Anhedonie · Antrieb · Kognition. Tiefer = besser.">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="dsi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(0 75% 55%)" stopOpacity={0.7} />
                      <stop offset="50%" stopColor="hsl(45 95% 55%)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(140 65% 45%)" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="dsi" name="DSI" stroke="hsl(0 65% 50%)" fill="url(#dsi)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="2. Cognitive Distortion Index (CDI)" subtitle="Negative vs. adaptive Beliefs, Hoffnungslosigkeit, Selbstabwertung.">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Line type="monotone" dataKey="negativeBeliefsCount" name="Negative" stroke="hsl(0 70% 55%)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="adaptiveBeliefsCount" name="Adaptiv" stroke="hsl(140 60% 45%)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="3. Behavioral Activation Index (BAI)" subtitle="Positive Aktivitäten (grün) vs. Vermeidung (rot).">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="positiveActivitiesCount" name="Positiv" stackId="a" fill="hsl(140 60% 45%)" />
                  <Bar dataKey="avoidanceCount" name="Vermeidung" stackId="a" fill="hsl(0 70% 55%)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="4. Functioning Index" subtitle="Arbeit · Sozial · Alltag (WHODAS-like). Höher = besser.">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="fn" name="Functioning" stroke="hsl(140 60% 45%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="5. Risk Index" subtitle="0 = none · 1 = passive · 2 = active ideation · 3 = planning">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <ReferenceLine y={2} stroke="hsl(0 80% 50%)" strokeDasharray="3 3" label={{ value: "kritisch", fontSize: 10, fill: "hsl(0 80% 50%)" }} />
                  <Line type="stepAfter" dataKey="risk" name="Risk" stroke="hsl(0 80% 50%)" strokeWidth={2}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      const r = payload.risk >= 2 ? 6 : 4;
                      const fill = payload.risk >= 2 ? "hsl(0 80% 50%)" : "hsl(0 0% 60%)";
                      return <circle cx={cx} cy={cy} r={r} fill={fill} />;
                    }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>

          {/* ============ DIAGNOSTIK ============ */}
          <TabsContent value="diagnostik" className="mt-4 space-y-4">
            <div className="text-xs text-muted-foreground italic px-1">
              AI-rekonstruierte Schätzungen aus dem Transkript. Kein validiertes Diagnoseinstrument.
            </div>

            <ScaleChart title="PHQ-9 AI" max={PHQ_THRESHOLDS.max} dataKey="phq9" data={chartData}
              refs={[
                { y: PHQ_THRESHOLDS.mild, label: "leicht" },
                { y: PHQ_THRESHOLDS.moderate, label: "moderat" },
                { y: PHQ_THRESHOLDS.severe, label: "schwer" },
              ]} />

            <ScaleChart title="BDI-II AI" max={BDI_THRESHOLDS.max} dataKey="bdi" data={chartData}
              refs={[
                { y: BDI_THRESHOLDS.mild, label: "leicht" },
                { y: BDI_THRESHOLDS.moderate, label: "moderat" },
                { y: BDI_THRESHOLDS.severe, label: "schwer" },
              ]} />

            <ScaleChart title="HAM-D AI" max={HAMD_THRESHOLDS.max} dataKey="hamd" data={chartData}
              refs={[
                { y: HAMD_THRESHOLDS.mild, label: "leicht" },
                { y: HAMD_THRESHOLDS.moderate, label: "moderat" },
                { y: HAMD_THRESHOLDS.severe, label: "schwer" },
              ]} />

            {latestKPIs?.scid && (
              <Card>
                <CardHeader className="pb-2 flex-row items-center justify-between">
                  <CardTitle className="text-base">SCID / CIDI Status</CardTitle>
                  <Badge variant={latestKPIs.scid.confidence === "high" ? "default" : "outline"}>
                    Confidence: {latestKPIs.scid.confidence}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ScidRow label="Kernsymptome (Stimmung/Anhedonie)" value={latestKPIs.scid.coreSymptoms} />
                  <ScidRow label="Dauer > 2 Wochen" value={latestKPIs.scid.durationOver2Weeks} />
                  <ScidRow label="Funktionsverlust" value={latestKPIs.scid.functionalImpairment} />
                  <ScidRow label="Andere Störung ausgeschlossen" value={latestKPIs.scid.exclusionOtherDisorder} />
                  {latestKPIs.scid.likelyDiagnosis && (
                    <div className="pt-2 mt-2 border-t text-sm">
                      <span className="text-muted-foreground">Likely: </span>
                      <span className="font-medium">{latestKPIs.scid.likelyDiagnosis}</span>
                      <span className="text-muted-foreground"> · {latestKPIs.scid.confidence.toUpperCase()} CONFIDENCE</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============ TIMELINE ============ */}
          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Session Timeline</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  {withKPIs.map((r) => {
                    const dsi = computeDSI(r.kpis!);
                    const color = dsi >= 60 ? "bg-destructive" : dsi >= 30 ? "bg-amber-500" : "bg-emerald-500";
                    return (
                      <button key={r.session.id}
                        onClick={() => setDrilldown(r)}
                        className="flex flex-col items-center gap-1 hover:opacity-80 transition">
                        <div className={`size-8 rounded-full ${color} flex items-center justify-center text-xs font-medium text-white shadow`}>
                          {r.nr}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(r.session.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs text-muted-foreground mt-4">
                  Klicke auf eine Session für Details (Scores, Beliefs, Quotes).
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ CROSS-SCALE ============ */}
          <TabsContent value="crossscale" className="mt-4 space-y-4">
            <ChartCard title="Cross-Scale Overlay" subtitle="PHQ-9 / BDI-II / HAM-D auf 0-100 normalisiert.">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Line type="monotone" dataKey="phq9Norm" name="PHQ-9" stroke="hsl(200 70% 50%)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="bdiNorm" name="BDI-II" stroke="hsl(280 60% 55%)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="hamdNorm" name="HAM-D" stroke="hsl(25 85% 55%)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
            <CrossScaleNote data={chartData} />
          </TabsContent>

          {/* ============ ALERTS ============ */}
          <TabsContent value="alerts" className="mt-4 space-y-2">
            {alerts.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-6 text-sm text-muted-foreground text-center">
                  Keine Auffälligkeiten – Verlauf unauffällig.
                </CardContent>
              </Card>
            )}
            {alerts.map(a => (
              <AlertItem key={a.id} alert={a}
                onClick={() => {
                  const r = withKPIs.find(x => x.nr === a.sessionNr);
                  if (r) setDrilldown(r);
                }} />
            ))}
          </TabsContent>

          {/* ============ PATTERN ENGINE ============ */}
          <TabsContent value="patterns" className="mt-4">
            <PatternEnginePanel points={withKPIs.map(r => ({ nr: r.nr, kpis: r.kpis! }))} />
          </TabsContent>
        </Tabs>
      )}

      {/* Drilldown Sheet */}
      <Sheet open={!!drilldown} onOpenChange={(v) => !v && setDrilldown(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          {drilldown && <DrilldownPanel row={drilldown} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ============== Subcomponents ==============

function DRIOverview({ lastDRI, firstDRI, trend, data }: { lastDRI: number; firstDRI: number; trend: "up" | "down" | "flat"; data: any[] }) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-600 dark:text-emerald-400"
    : trend === "down" ? "text-destructive" : "text-muted-foreground";
  const driColor = lastDRI >= 65 ? "text-emerald-600 dark:text-emerald-400"
    : lastDRI >= 40 ? "text-amber-600 dark:text-amber-400" : "text-destructive";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Depression Recovery Index (DRI)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-4 flex-wrap">
          <div className={`text-6xl font-bold ${driColor}`}>{lastDRI}</div>
          <div className="text-sm text-muted-foreground pb-2">
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="size-4" />
              {trend === "flat" ? "stabil" : `${lastDRI - firstDRI > 0 ? "+" : ""}${lastDRI - firstDRI} seit Session 1`}
            </div>
            <div className="text-xs">Composite aller 7 Sub-Indizes</div>
          </div>
          <div className="ml-auto w-full md:w-64 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <Area type="monotone" dataKey="dri" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KpiTile({ label, value, suffix, data, dataKey, color, inverse }: {
  label: string; value: number; suffix?: string; data: any[]; dataKey: string; color: string; inverse?: boolean;
}) {
  const first = data[0]?.[dataKey] ?? 0;
  const last = data.at(-1)?.[dataKey] ?? 0;
  const trend = trendArrow(last, first);
  const effective = inverse ? (trend === "up" ? "down" : trend === "down" ? "up" : "flat") : trend;
  const TrendIcon = effective === "up" ? TrendingUp : effective === "down" ? TrendingDown : Minus;
  const trendColor = effective === "up" ? "text-emerald-600 dark:text-emerald-400"
    : effective === "down" ? "text-destructive" : "text-muted-foreground";

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
          <TrendIcon className={`size-3.5 ${trendColor}`} />
        </div>
        <div className="text-xl font-semibold">{value}<span className="text-xs text-muted-foreground">{suffix}</span></div>
        <div className="h-8 mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ScaleChart({ title, max, dataKey, data, refs }: {
  title: string; max: number; dataKey: string; data: any[];
  refs: { y: number; label: string }[];
}) {
  return (
    <ChartCard title={title} subtitle={`0 – ${max} · Schwellen: ${refs.map(r => `${r.label} ≥ ${r.y}`).join(" · ")}`}>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, max]} />
          <Tooltip contentStyle={tooltipStyle} />
          {refs.map((r, i) => (
            <ReferenceLine key={i} y={r.y} stroke="hsl(var(--muted-foreground) / 0.5)" strokeDasharray="2 4"
              label={{ value: r.label, fontSize: 10, fill: "hsl(var(--muted-foreground))", position: "right" }} />
          ))}
          <Line type="monotone" dataKey={dataKey} stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function ScidRow({ label, value }: { label: string; value: boolean | null | undefined }) {
  const icon = value === true
    ? <Check className="size-5 text-emerald-600 dark:text-emerald-400" />
    : value === false
      ? <X className="size-5 text-destructive" />
      : <Circle className="size-5 text-muted-foreground/40" />;
  return (
    <div className="flex items-center gap-3 text-sm">
      {icon}
      <span>{label}</span>
      {value === null || value === undefined ? <Badge variant="outline" className="ml-auto text-xs">unklar</Badge> : null}
    </div>
  );
}

function CrossScaleNote({ data }: { data: any[] }) {
  if (data.length < 2) return null;
  const first = data[0], last = data.at(-1)!;
  const dirs = [
    Math.sign(last.phq9Norm - first.phq9Norm),
    Math.sign(last.bdiNorm - first.bdiNorm),
    Math.sign(last.hamdNorm - first.hamdNorm),
  ];
  const allDown = dirs.every(d => d < 0);
  const allUp = dirs.every(d => d > 0);
  if (allDown) {
    return (
      <Alert>
        <Info className="size-4" />
        <AlertTitle>Alle Skalen bestätigen Verlauf</AlertTitle>
        <AlertDescription>PHQ-9, BDI-II und HAM-D zeigen einen rückläufigen Trend.</AlertDescription>
      </Alert>
    );
  }
  if (allUp) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="size-4" />
        <AlertTitle>Alle Skalen tendieren aufwärts</AlertTitle>
        <AlertDescription>Reassessment empfohlen.</AlertDescription>
      </Alert>
    );
  }
  return null;
}

function AlertItem({ alert, onClick }: { alert: InsightAlert; onClick: () => void }) {
  const meta = {
    info: { Icon: Info, cls: "border-l-blue-500" },
    positive: { Icon: ThumbsUp, cls: "border-l-emerald-500" },
    warning: { Icon: AlertTriangle, cls: "border-l-amber-500" },
    critical: { Icon: ShieldAlert, cls: "border-l-destructive" },
  }[alert.severity];
  const { Icon, cls } = meta;
  return (
    <button onClick={onClick} className={`w-full text-left rounded-md border bg-card border-l-4 ${cls} p-3 hover:bg-muted/40 transition`}>
      <div className="flex items-start gap-3">
        <Icon className="size-4 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium">{alert.title}</div>
          <div className="text-xs text-muted-foreground">{alert.detail}</div>
        </div>
        {alert.sessionNr && <Badge variant="outline" className="text-xs">S{alert.sessionNr}</Badge>}
      </div>
    </button>
  );
}

function DrilldownPanel({ row }: { row: Row }) {
  const k = row.kpis!;
  return (
    <>
      <SheetHeader>
        <SheetTitle>Session {row.nr}</SheetTitle>
        <SheetDescription>{new Date(row.session.date).toLocaleString("de-DE")}</SheetDescription>
      </SheetHeader>
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <ScoreBox label="PHQ-9" value={computePHQ9(k)} max={PHQ_THRESHOLDS.max} />
          <ScoreBox label="BDI-II" value={computeBDI(k)} max={BDI_THRESHOLDS.max} />
          <ScoreBox label="HAM-D" value={computeHAMD(k)} max={HAMD_THRESHOLDS.max} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="Negative Beliefs" v={k.negativeBeliefsCount} />
          <Stat label="Adaptive Beliefs" v={k.adaptiveBeliefsCount} />
          <Stat label="Positive Aktivitäten" v={k.positiveActivitiesCount} />
          <Stat label="Vermeidung" v={k.avoidanceCount ?? 0} />
          <Stat label="Soziale Kontakte" v={k.socialContactsCount} />
          <Stat label="Risk Level" v={k.riskLevel ?? 0} />
        </div>

        {k.riskLevel !== undefined && k.riskLevel > 0 && k.riskNotes && (
          <Alert variant="destructive">
            <ShieldAlert className="size-4" />
            <AlertTitle>Risiko-Hinweis</AlertTitle>
            <AlertDescription>{k.riskNotes}</AlertDescription>
          </Alert>
        )}

        {k.keyQuotes && k.keyQuotes.length > 0 && (
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Key Quotes</div>
            <div className="space-y-2">
              {k.keyQuotes.map((q, i) => (
                <div key={i} className="rounded-md bg-muted/50 p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Quote className="size-3.5 mt-1 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <div>„{q.text}"</div>
                      <Badge variant="outline" className="mt-1 text-[10px]">{q.tag}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {k.notes && (
          <div className="text-xs text-muted-foreground italic border-t pt-3">{k.notes}</div>
        )}
      </div>
    </>
  );
}

function ScoreBox({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="rounded-md border bg-card p-2 text-center">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}<span className="text-xs text-muted-foreground">/{max}</span></div>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex items-center justify-between rounded border bg-card px-2.5 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
