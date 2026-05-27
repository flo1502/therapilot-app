import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, nextPatientPseudonym, Patient, TherapyApproach } from "@/lib/db";
import { safeDecrypt } from "@/lib/crypto";
import { ensureAuthed } from "@/lib/authGuard";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Trash2 } from "lucide-react";
import { getAvailableDiagnoses } from "@/lib/curriculum-database";
import type { ICDCode } from "@/lib/curriculumTypes";

const APPROACHES: TherapyApproach[] = ["KVT", "ACT", "Schematherapie", "Tiefenpsych.", "Systemisch", "Andere"];
const LERNSTILE = ["visuell", "auditiv", "kinästhetisch", "lesen"] as const;

export default function PatientEdit() {
  const { id } = useParams();
  const isNew = !id || id === "neu";
  const nav = useNavigate();
  const [p, setP] = useState<Patient | null>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [diagInput, setDiagInput] = useState("");

  useEffect(() => {
    (async () => {
      if (isNew) {
        const pseudo = await nextPatientPseudonym();
        setP({
          id: pseudo, createdAt: Date.now(), updatedAt: Date.now(),
          approach: "KVT", diagnoses: [], goals: "", active: true,
        });
      } else {
        const ex = await db.patients.get(id!);
        if (!ex) { toast.error("Nicht gefunden."); nav("/patienten"); return; }
        setP(ex);
        // Plaintext bevorzugen; sonst legacy entschlüsseln (für alte lokale Records)
        setName(ex.name ?? await safeDecrypt(ex.encName));
        setNotes(ex.notes ?? await safeDecrypt(ex.encNotes));
      }
    })();
  }, [id, isNew, nav]);

  if (!p) return <div className="text-sm text-muted-foreground">Lade…</div>;

  const save = async () => {
    if (!(await ensureAuthed())) return;
    try {
      const updated: Patient = {
        ...p,
        updatedAt: Date.now(),
        name: name || undefined,
        notes: notes || undefined,
        // legacy enc-Felder leeren, falls vorhanden
        encName: undefined,
        encNotes: undefined,
      };
      await db.patients.put(updated);
      toast.success("Gespeichert.");
      nav(`/patienten/${updated.id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Fehler beim Speichern.");
    }
  };

  const del = async () => {
    if (!(await ensureAuthed())) return;
    if (!confirm("Patient:in und alle Sessions wirklich löschen?")) return;
    await db.sessions.where("patientId").equals(p.id).delete();
    await db.patients.delete(p.id);
    toast.success("Gelöscht.");
    nav("/patienten");
  };

  const addDiag = () => {
    const d = diagInput.trim();
    if (!d) return;
    setP({ ...p, diagnoses: Array.from(new Set([...p.diagnoses, d])) });
    setDiagInput("");
  };

  return (
    <>
      <PageHeader title={isNew ? "Neue:r Patient:in" : p.id} description={`Pseudonym: ${p.id}`}
        actions={
          <div className="flex gap-2">
            {!isNew && <Button variant="outline" onClick={del}><Trash2 className="size-4 mr-2" />Löschen</Button>}
            <Button onClick={save}><Save className="size-4 mr-2" />Speichern</Button>
          </div>
        } />

      <Card><CardContent className="p-6 grid md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <Label>Klarname (in Cloud sichtbar – nur Demo-Daten!)</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="optional" />
        </div>
        <div>
          <Label>Therapieansatz</Label>
          <Select value={p.approach} onValueChange={(v: any) => setP({ ...p, approach: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {APPROACHES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Altersgruppe</Label>
          <Input value={p.ageGroup ?? ""} onChange={e => setP({ ...p, ageGroup: e.target.value })} placeholder="z.B. 30–40" />
        </div>
        <div>
          <Label>Geschlecht</Label>
          <Input value={p.gender ?? ""} onChange={e => setP({ ...p, gender: e.target.value })} placeholder="optional" />
        </div>
        <div>
          <Label>Therapiebeginn</Label>
          <Input type="date" value={p.startDate ?? ""} onChange={e => setP({ ...p, startDate: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Label>Diagnosen / Tags (z.B. F32.1, F41.1)</Label>
          <div className="flex gap-2">
            <Input value={diagInput} onChange={e => setDiagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addDiag())} placeholder="ICD-Code oder Tag" />
            <Button type="button" variant="secondary" onClick={addDiag}>+</Button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {p.diagnoses.map(d => (
              <button key={d} onClick={() => setP({ ...p, diagnoses: p.diagnoses.filter(x => x !== d) })}
                className="text-xs px-2 py-1 rounded bg-secondary hover:bg-destructive hover:text-destructive-foreground transition-colors">
                {d} ✕
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <Label>Therapieziele</Label>
          <Textarea rows={3} value={p.goals} onChange={e => setP({ ...p, goals: e.target.value })} />
        </div>

        {/* Curriculum-Felder */}
        <div className="md:col-span-2 border-t pt-5 mt-1">
          <h3 className="font-display text-sm mb-3 text-primary">Curriculum & Personalisierung (für AI-Folien)</h3>
        </div>
        <div>
          <Label>Curriculum-Diagnose</Label>
          <Select
            value={p.curriculumDiagnose ?? "none"}
            onValueChange={(v) => setP({ ...p, curriculumDiagnose: v === "none" ? undefined : (v as ICDCode) })}
          >
            <SelectTrigger><SelectValue placeholder="Keine" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Keine —</SelectItem>
              {getAvailableDiagnoses().map(d => (
                <SelectItem key={d.code} value={d.code}>{d.code} · {d.name} ({d.stadien_count} Stadien)</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">Aktiviert leitliniengerechte Stadien-Folien.</p>
        </div>
        <div>
          <Label>Beruf</Label>
          <Input value={p.beruf ?? ""} onChange={e => setP({ ...p, beruf: e.target.value })} placeholder="z.B. Lehrer:in" />
        </div>
        <div>
          <Label>Lernstil</Label>
          <Select value={p.lernstil ?? "none"} onValueChange={(v) => setP({ ...p, lernstil: v === "none" ? undefined : (v as any) })}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Keiner —</SelectItem>
              {LERNSTILE.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Trigger-Situationen (komma-getrennt)</Label>
          <Input
            value={(p.triggers ?? []).join(", ")}
            onChange={e => setP({ ...p, triggers: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
            placeholder="z.B. Meetings, Präsentationen"
          />
        </div>
        <div className="md:col-span-2">
          <Label>Hauptsymptome (komma-getrennt)</Label>
          <Input
            value={(p.hauptsymptome ?? []).join(", ")}
            onChange={e => setP({ ...p, hauptsymptome: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
            placeholder="z.B. Herzrasen, Schwitzen, Atemnot"
          />
        </div>
        <div className="md:col-span-2">
          <Label>Hauptangst-Gedanken (komma-getrennt)</Label>
          <Input
            value={(p.hauptangstGedanken ?? []).join(", ")}
            onChange={e => setP({ ...p, hauptangstGedanken: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
            placeholder="z.B. Ich kriege einen Herzinfarkt"
          />
        </div>
        <div className="md:col-span-2">
          <Label>Vermeidungsverhalten (komma-getrennt)</Label>
          <Input
            value={(p.vermeidungsVerhalten ?? []).join(", ")}
            onChange={e => setP({ ...p, vermeidungsVerhalten: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
            placeholder="z.B. Meeting verlassen, große Räume meiden"
          />
        </div>

        <div className="md:col-span-2">
          <Label>Freie Notizen (in Cloud sichtbar)</Label>
          <Textarea rows={5} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Biografie, Hintergrund, individuelle Hinweise…" />
        </div>
        <div className="md:col-span-2 flex items-center gap-3">
          <Switch checked={p.active} onCheckedChange={v => setP({ ...p, active: v })} />
          <Label>In Behandlung</Label>
        </div>
      </CardContent></Card>
    </>
  );
}
