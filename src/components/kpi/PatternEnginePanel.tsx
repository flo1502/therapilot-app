import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingDown, TrendingUp, Minus, Sparkles, AlertTriangle, ShieldAlert, Info } from "lucide-react";
import {
  SessionKPIs,
  computePHQ9, computeCDI, computeBAI, computeFunctioning,
  computeSocialEngagement, computeBeliefLoad, computeEmotionRegScore,
  cognitiveShiftIndex, detectPatterns, DetectedPattern,
} from "@/lib/kpiTypes";

interface Point { nr: number; kpis: SessionKPIs }
interface Props { points: Point[] }

const tooltipStyle = {
  background: "hsl(var(--background))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

export function PatternEnginePanel({ points }: Props) {
  const data = useMemo(() => points.map(p => ({
    name: `S${p.nr}`,
    severity: computePHQ9(p.kpis),
    cdi: computeCDI(p.kpis),
    bai: computeBAI(p.kpis),
    social: computeSocialEngagement(p.kpis),
    func: computeFunctioning(p.kpis),
  })), [points]);

  const patterns = useMemo(() => detectPatterns(points), [points]);

  if (points.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-sm text-muted-foreground text-center">
          Noch keine KPI-Daten für Pattern-Analyse.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 5 Curves */}
      <div className="grid md:grid-cols-2 gap-3">
        <CurveCard title="Severity (PHQ-like)" data={data} dataKey="severity" color="hsl(0 70% 55%)" max={27} inverse />
        <CurveCard title="Cognitive Distortion" data={data} dataKey="cdi" color="hsl(25 85% 55%)" max={100} inverse />
        <CurveCard title="Behavioral Activation" data={data} dataKey="bai" color="hsl(140 60% 45%)" max={100} />
        <CurveCard title="Social Engagement" data={data} dataKey="social" color="hsl(200 70% 50%)" max={100} />
        <CurveCard title="Functioning" data={data} dataKey="func" color="hsl(260 60% 55%)" max={100} />
      </div>

      {/* Detected Patterns */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="size-4" /> Detected Patterns
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {patterns.length === 0 && (
            <div className="text-xs text-muted-foreground">
              Keine auffälligen Muster erkannt. Mit mehr Sessions wird die Erkennung sensitiver.
            </div>
          )}
          {patterns.map(p => <PatternCard key={p.id} pattern={p} />)}
        </CardContent>
      </Card>

      {/* KPI Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Per-Session KPI Übersicht</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead className="text-right">Severity</TableHead>
                <TableHead className="text-right">CDI</TableHead>
                <TableHead className="text-right">Belief Load</TableHead>
                <TableHead className="text-right">Cog. Shift</TableHead>
                <TableHead className="text-right">BAI</TableHead>
                <TableHead className="text-right">Social</TableHead>
                <TableHead className="text-right">Emo. Reg</TableHead>
                <TableHead className="text-right">Func.</TableHead>
                <TableHead className="text-right">Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {points.map(p => (
                <TableRow key={p.nr}>
                  <TableCell className="font-medium">S{p.nr}</TableCell>
                  <TableCell className="text-right">{computePHQ9(p.kpis)}</TableCell>
                  <TableCell className="text-right">{computeCDI(p.kpis)}</TableCell>
                  <TableCell className="text-right">{computeBeliefLoad(p.kpis)}</TableCell>
                  <TableCell className="text-right">{cognitiveShiftIndex(p.kpis)}</TableCell>
                  <TableCell className="text-right">{computeBAI(p.kpis)}</TableCell>
                  <TableCell className="text-right">{computeSocialEngagement(p.kpis)}</TableCell>
                  <TableCell className="text-right">{computeEmotionRegScore(p.kpis)}</TableCell>
                  <TableCell className="text-right">{computeFunctioning(p.kpis)}</TableCell>
                  <TableCell className="text-right">
                    <RiskBadge level={p.kpis.riskLevel ?? 0} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CurveCard({
  title, data, dataKey, color, max, inverse = false,
}: {
  title: string;
  data: any[];
  dataKey: string;
  color: string;
  max: number;
  inverse?: boolean;
}) {
  const first = data[0]?.[dataKey] ?? 0;
  const last = data.at(-1)?.[dataKey] ?? 0;
  const delta = last - first;
  // For inverse metrics (severity/cdi), lower = better
  const isImproving = inverse ? delta < 0 : delta > 0;
  const isFlat = Math.abs(delta) < 2;
  const Icon = isFlat ? Minus : isImproving ? TrendingUp : TrendingDown;
  const trendColor = isFlat
    ? "text-muted-foreground"
    : isImproving ? "text-emerald-600" : "text-destructive";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium">{title}</CardTitle>
          <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
            <Icon className="size-3" />
            <span>{delta > 0 ? "+" : ""}{delta}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, max]} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          Start {first} → Aktuell {last}
        </div>
      </CardContent>
    </Card>
  );
}

function PatternCard({ pattern }: { pattern: DetectedPattern }) {
  const map = {
    positive: { Icon: Sparkles, color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/30" },
    info: { Icon: Info, color: "text-blue-600", bg: "bg-blue-500/10 border-blue-500/30" },
    warning: { Icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-500/10 border-amber-500/30" },
    critical: { Icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
  }[pattern.severity];
  const { Icon } = map;
  return (
    <div className={`flex gap-3 p-3 rounded-md border ${map.bg}`}>
      <Icon className={`size-4 mt-0.5 shrink-0 ${map.color}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-medium">{pattern.title}</div>
          {pattern.sessionRange && (
            <Badge variant="outline" className="text-[10px] h-5">{pattern.sessionRange}</Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{pattern.detail}</div>
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: number }) {
  if (level === 0) return <Badge variant="outline" className="h-5">0</Badge>;
  if (level === 1) return <Badge className="h-5 bg-amber-500/20 text-amber-700 border-amber-500/40" variant="outline">1</Badge>;
  return <Badge variant="destructive" className="h-5">{level}</Badge>;
}
