import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { migrateLocalToCloud } from "@/lib/cloudSync";
import { useAuth } from "@/lib/authState";
import { seedDemoPatient, DEMO_PATIENT_ID, demoExists } from "@/lib/demoSeed";
import { toast } from "sonner";
import { Download, Upload, AlertTriangle, ShieldCheck, CloudUpload, LogIn, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function Settings() {
  const { isAuthed } = useAuth();
  const [busy, setBusy] = useState(false);

  const exportData = async () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      patients: await db.patients.toArray(),
      sessions: await db.sessions.toArray(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `therapilot-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast.success("Backup heruntergeladen.");
  };

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("Bestehende Daten werden ergänzt. Fortfahren?")) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.patients) await db.patients.bulkPut(data.patients);
      if (data.sessions) await db.sessions.bulkPut(data.sessions);
      toast.success("Import abgeschlossen.");
    } catch {
      toast.error("Datei konnte nicht gelesen werden.");
    }
  };

  const migrate = async () => {
    if (!isAuthed) { toast.error("Bitte zuerst einloggen."); return; }
    setBusy(true);
    try {
      const res = await migrateLocalToCloud();
      toast.success(`In Cloud übernommen: ${res.patients} Patient:innen, ${res.sessions} Sessions.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Migration fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  const wipeAll = async () => {
    if (!confirm("WIRKLICH alle lokalen Daten unwiderruflich löschen?")) return;
    if (!confirm("Letzte Warnung: alle Patient:innen, Sessions weg.")) return;
    await db.patients.clear();
    await db.sessions.clear();
    toast.success("Alle Daten gelöscht.");
  };

  const seedDemo = async () => {
    const exists = await demoExists();
    if (exists && !confirm("Demo-Patient existiert bereits. Sessions überschreiben?")) return;
    setBusy(true);
    try {
      const res = await seedDemoPatient(exists);
      toast.success(`Demo geladen: ${res.sessions} Sessions für ${DEMO_PATIENT_ID}.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Seeding fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Einstellungen" description="Backup, Cloud-Sync, Datenschutz." />

      <div className="space-y-5 max-w-2xl">
        <Card><CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <h3 className="text-lg">Demo-Modus: geteilte Cloud-Daten</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Patient:innen und Sessions werden in der Lovable Cloud gespeichert und sind für <strong>jeden mit Link</strong> sichtbar.
            Nur eingeloggte Nutzer:innen können bearbeiten. <strong>Bitte nur Demo-/Fake-Daten verwenden – keine echten Patientendaten.</strong>
          </p>
        </CardContent></Card>

        <Card className="border-primary/40"><CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h3 className="text-lg">Demo-Workflow seeden</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Erzeugt einen vollständigen Test-Patienten <code className="text-xs">{DEMO_PATIENT_ID}</code> (F32.1, mittelgradige Depression)
            mit 4 vollständigen Sitzungen inkl. Transkript, KV-Dokumentation, CBT-Schema-Extraktion und KPI-Verlauf.
            Ideal, um den kompletten Workflow ohne AI-Calls durchzuklicken. Wenn du eingeloggt bist, ist die Demo via Link auch für andere sichtbar.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={seedDemo} disabled={busy}>
              <Sparkles className="size-4 mr-2" />
              {busy ? "Lade…" : "Demo-Patient + 4 Sessions seeden"}
            </Button>
            <Button asChild variant="outline">
              <Link to={`/patienten/${DEMO_PATIENT_ID}`}>Zum Demo-Patient</Link>
            </Button>
          </div>
          {!isAuthed && (
            <p className="text-xs text-muted-foreground">
              Hinweis: Du bist nicht eingeloggt – die Demo wird nur lokal angelegt und nicht in die Cloud gepusht.
            </p>
          )}
        </CardContent></Card>


        <Card><CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CloudUpload className="size-5 text-primary" />
            <h3 className="text-lg">Lokale Daten in Cloud übernehmen</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Lädt alle Patient:innen/Sessions, die nur in deinem Browser liegen, einmalig in die geteilte Cloud-DB hoch.
            Verschlüsselte Klarnamen/Notizen werden entschlüsselt und als Klartext gespeichert.
          </p>
          {isAuthed ? (
            <Button onClick={migrate} disabled={busy}>
              <CloudUpload className="size-4 mr-2" />
              {busy ? "Lade hoch…" : "Jetzt in Cloud übernehmen"}
            </Button>
          ) : (
            <Button asChild variant="outline"><Link to="/auth"><LogIn className="size-4 mr-2" />Erst einloggen</Link></Button>
          )}
        </CardContent></Card>

        <Card><CardContent className="p-5 space-y-3">
          <h3 className="text-lg">Backup (lokal)</h3>
          <p className="text-sm text-muted-foreground">JSON-Export/Import des lokalen Dexie-Caches.</p>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={exportData} variant="outline"><Download className="size-4 mr-2" />Export</Button>
            <label>
              <input type="file" accept="application/json" hidden onChange={importData} />
              <Button asChild variant="outline"><span><Upload className="size-4 mr-2" />Import</span></Button>
            </label>
          </div>
        </CardContent></Card>

        <Card className="border-warning/40"><CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-warning" />
            <h3 className="text-lg">Phase 2: Lokales LLM (Ollama)</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Für 100 % lokale Verarbeitung ohne externen API-Call ist eine Electron-Variante mit Ollama-Integration vorgesehen.
          </p>
        </CardContent></Card>

        <Card className="border-destructive/40"><CardContent className="p-5 space-y-3">
          <h3 className="text-lg text-destructive">Gefahrenzone</h3>
          <Button variant="destructive" onClick={wipeAll}>Alle lokalen Daten löschen</Button>
        </CardContent></Card>
      </div>
    </>
  );
}
