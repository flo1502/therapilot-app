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
import { Sparkles, TrendingUp, TrendingDown, Minus, Check, Circle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { db, SessionEntry } from "@/lib/db";
import { callAi } from "@/lib/ai/provider";
import {
  SessionKPIs, cognitiveShiftIndex, depressionRecoveryIndex, trendArrow,
} from "@/lib/kpiTypes";

interface Props {
  patientId: string;
  currentSessionId: string;
  currentTranscript: string;
  patientPseudonym?: string;
}

interface Row {
  session: SessionEntry;
  nr: number;
  kpis?: SessionKPIs;
}

export function TherapieverlaufDashboard({ patientId, currentSessionId, currentTranscript, patientPseudonym }: Props) {
  const sessions = useLiveQuery(
    () => patientId
      ? db.sessions.where("patientId").equals(patientId).toArray()
      : Promise.resolve([] as SessionEntry[]),
    [patientId],
  );
  const [busy, setBusy] = useState(false);

  const rows: Row[] = useMemo(() => {
    if (!sessions) return [];
    const sorted = [...sessions].sort((a, b) => a.date - b.date);
    return sorted.map((s, i) => ({ session: s, nr: i + 1, kpis: s.sessionKPIs }));
  }, [sessions]);

  const withKPIs = rows.filter(r => r.kpis);
  const chartData = withKPIs.map(r => ({
    name: `S${r.nr}`,
    nr: r.nr,
    ...r.kpis!,
    csi: cognitiveShiftIndex(r.kpis!),
    dri: depressionRecoveryIndex(r.kpis!),
  }));

  const currentRow = rows.find(r => r.session.id === currentSessionId);
  const hasCurrentKPIs = !!currentRow?.kpis;

  const extractCurrent = async () => {
    if (!patientId) {
      toast.error("Bitte zuerst Patient:in wählen und Session speichern.");
      return;
    }
    if (!currentTranscript.trim()) {
      toast.error("Bitte zuerst ein Transkript im KV-Verlauf-Tab erfassen.");
      return;
    }
    // Session muss in DB existieren (sonst /sessions/neu noch ungespeichert)
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
      {/* Header */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-medium text-sm">Verlauf der Depression – Multi-Session Analyse</div>
            <div className="text-xs text-muted-foreground">
              {rows.length} Session{rows.length === 1 ? "" : "s"} · {withKPIs.length} mit KPIs · F32/F33
            </div>
          </div>
          <Button onClick={extractCurrent} disabled={busy} size="sm">
            {hasCurrentKPIs ? <RefreshCw className="size-4 mr-2" /> : <Sparkles className="size-4 mr-2" />}
            {busy ? "Analysiere…" : hasCurrentKPIs ? "KPIs neu extrahieren" : "KPIs für diese Session extrahieren"}
          </Button>
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
            <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
            <TabsTrigger value="cognitive">Cognitive Shift</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="emotion">Emotion</TabsTrigger>
            <TabsTrigger value="selfworth">Self-Worth</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <DRIOverview lastDRI={lastDRI} firstDRI={firstDRI} trend={driTrend} data={chartData} />
            <div className="grid md:grid-cols-2 gap-4">
              <MiniCard title="Symptomverlauf (DSI)" value={chartData.at(-1)?.depressionSeverity ?? 0} suffix="/100" inverse data={chartData} dataKey="depressionSeverity" color="hsl(0 70% 55%)" />
              <MiniCard title="Cognitive Shift Index" value={chartData.at(-1)?.csi ?? 0} data={chartData} dataKey="csi" color="hsl(150 60% 45%)" />
              <MiniCard title="Positive Aktivitäten" value={chartData.at(-1)?.positiveActivitiesCount ?? 0} data={chartData} dataKey="positiveActivitiesCount" color="hsl(140 60% 45%)" />
              <MiniCard title="Soziale Kontakte" value={chartData.at(-1)?.socialContactsCount ?? 0} data={chartData} dataKey="socialContactsCount" color="hsl(35 90% 55%)" />
              <MiniCard title="Emotionsregulation" value={chartData.at(-1)?.emotionRegulation ?? 0} suffix="/5" data={chartData} dataKey="emotionRegulation" color="hsl(280 60% 55%)" />
              <MiniCard title="Positive Selbstgedanken" value={chartData.at(-1)?.positiveSelfStatements ?? 0} data={chartData} dataKey="positiveSelfStatements" color="hsl(200 70% 50%)" />
            </div>
          </TabsContent>

          <TabsContent value="symptoms" className="mt-4">
            <ChartCard title="Depression Severity Index (DSI)" subtitle="Leidenslast über Zeit. Tiefer = besser.">
              <ResponsiveContainer width="100%" height={300}>
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
                  <Area type="monotone" dataKey="depressionSeverity" stroke="hsl(0 65% 50%)" fill="url(#dsi)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>

          <TabsContent value="cognitive" className="mt-4 space-y-4">
            <ChartCard title="Cognitive Shift" subtitle="Negative vs. adaptive Grundannahmen pro Sitzung.">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Line type="monotone" dataKey="negativeBeliefsCount" name="Negative" stroke="hsl(0 70% 55%)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="adaptiveBeliefsCount" name="Adaptiv" stroke="hsl(140 60% 45%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Cognitive Shift Index" subtitle="adaptive − negative. Positiv = Fortschritt.">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                  <Bar dataKey="csi" name="CSI">
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.csi >= 0 ? "hsl(140 60% 45%)" : "hsl(0 70% 55%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>

          <TabsContent value="behavior" className="mt-4">
            <ChartCard title="Behavioral Activation" subtitle="Positive Aktivitäten, aufgeteilt nach aktiv vs. passiv.">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="activeActivities" name="Aktiv" stackId="a" fill="hsl(140 60% 45%)" />
                  <Bar dataKey="passiveActivities" name="Passiv" stackId="a" fill="hsl(0 0% 60%)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>

          <TabsContent value="social" className="mt-4">
            <ChartCard title="Soziale Aktivitäten" subtitle="Kontakte pro Sitzung. Hover für Initiierung.">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Line type="monotone" dataKey="socialContactsCount" name="Gesamt" stroke="hsl(35 90% 55%)" strokeWidth={2} dot={{ r: 5 }} />
                  <Line type="monotone" dataKey="socialInitiated" name="Selbst initiiert" stroke="hsl(200 70% 50%)" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>

          <TabsContent value="emotion" className="mt-4 space-y-4">
            <ChartCard title="Emotionsregulation Tracking" subtitle="Awareness (erkennen) vs. Regulation (steuern). 0–5.">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 5]} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Line type="stepAfter" dataKey="emotionAwareness" name="Awareness" stroke="hsl(280 60% 55%)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="stepAfter" dataKey="emotionRegulation" name="Regulation" stroke="hsl(200 70% 50%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
            <MilestoneCard data={chartData} />
          </TabsContent>

          <TabsContent value="selfworth" className="mt-4">
            <ChartCard title="Selbstwert" subtitle="Positive vs. negative Selbstaussagen pro Sitzung.">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Line type="monotone" dataKey="positiveSelfStatements" name="Positiv" stroke="hsl(140 60% 45%)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="negativeSelfStatements" name="Negativ" stroke="hsl(0 70% 55%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

const tooltipStyle = {
  background: "hsl(var(--background))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

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
            <div className="text-xs">Composite aus Symptom ↓, Cognition ↑, Behavior ↑, Social ↑, Emotion ↑, Self-worth ↑</div>
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

function MiniCard({ title, value, suffix, data, dataKey, color, inverse }: { title: string; value: number; suffix?: string; data: any[]; dataKey: string; color: string; inverse?: boolean }) {
  const first = data[0]?.[dataKey] ?? 0;
  const last = data.at(-1)?.[dataKey] ?? 0;
  const trend = trendArrow(last, first);
  const effective = inverse ? (trend === "up" ? "down" : trend === "down" ? "up" : "flat") : trend;
  const TrendIcon = effective === "up" ? TrendingUp : effective === "down" ? TrendingDown : Minus;
  const trendColor = effective === "up" ? "text-emerald-600 dark:text-emerald-400"
    : effective === "down" ? "text-destructive" : "text-muted-foreground";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs text-muted-foreground">{title}</div>
          <TrendIcon className={`size-4 ${trendColor}`} />
        </div>
        <div className="text-2xl font-semibold">{value}<span className="text-sm text-muted-foreground">{suffix}</span></div>
        <div className="h-10 mt-1">
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

function MilestoneCard({ data }: { data: any[] }) {
  const maxAware = Math.max(0, ...data.map(d => d.emotionAwareness));
  const maxReg = Math.max(0, ...data.map(d => d.emotionRegulation));
  const milestones = [
    { label: "Emotion benennen", reached: maxAware >= 1 },
    { label: "Emotion verstehen", reached: maxAware >= 3 },
    { label: "Regulation anwenden", reached: maxReg >= 2 },
    { label: "Selbstregulation stabil", reached: maxReg >= 4 },
  ];
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Regulations-Meilensteine</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {milestones.map((m, i) => (
          <div key={i} className="flex items-center gap-3">
            {m.reached
              ? <Check className="size-5 text-emerald-600 dark:text-emerald-400" />
              : <Circle className="size-5 text-muted-foreground/40" />}
            <span className={m.reached ? "text-foreground" : "text-muted-foreground"}>{m.label}</span>
            {m.reached && <Badge variant="outline" className="ml-auto text-xs">erreicht</Badge>}
          </div>
        ))}
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
