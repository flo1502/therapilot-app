import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { Download, Upload, AlertTriangle, ShieldCheck } from "lucide-react";

export default function Settings() {
  const exportData = async () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      patients: await db.patients.toArray(),
      sessions: await db.sessions.toArray(),
      decks: await db.decks.toArray(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `therapilot-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast.success("Backup heruntergeladen. Verschlüsselte Felder bleiben verschlüsselt.");
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
      if (data.decks) await db.decks.bulkPut(data.decks);
      toast.success("Import abgeschlossen.");
    } catch {
      toast.error("Datei konnte nicht gelesen werden.");
    }
  };

  const wipeAll = async () => {
    if (!confirm("WIRKLICH alle lokalen Daten unwiderruflich löschen?")) return;
    if (!confirm("Letzte Warnung: alle Patient:innen, Sessions, Decks weg.")) return;
    await db.patients.clear();
    await db.sessions.clear();
    await db.decks.clear();
    toast.success("Alle Daten gelöscht.");
  };

  return (
    <>
      <PageHeader title="Einstellungen" description="Datenschutz, Backup, Phase-2-Vorschau." />

      <div className="space-y-5 max-w-2xl">
        <Card><CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <h3 className="text-lg">Datenschutz & Speicherung</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Alle Patientendaten liegen ausschließlich in der IndexedDB Ihres Browsers (kein Cloud-Sync, keine Telemetrie).
            Klarnamen und freie Notizen werden mit AES-256-GCM verschlüsselt; der Schlüssel wird per PBKDF2 (200.000 Iterationen)
            aus Ihrem Master-Passwort abgeleitet und nie gespeichert.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AI-Anfragen gehen pseudonymisiert (Namen, Telefonnummern, Adressen, Daten entfernt) an das Lovable AI Gateway.
            Für vollständige DSGVO-Konformität siehe Phase 2.
          </p>
        </CardContent></Card>

        <Card><CardContent className="p-5 space-y-3">
          <h3 className="text-lg">Backup</h3>
          <p className="text-sm text-muted-foreground">
            Exportiert als JSON-Datei. Verschlüsselte Felder bleiben verschlüsselt – bewahren Sie Ihr Master-Passwort sicher auf.
          </p>
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
            Für 100 % lokale Verarbeitung ohne externen API-Call ist eine Electron-Variante mit Ollama-Integration
            (z.B. Llama 3.1 oder Gemma) vorgesehen. Die AI-Provider-Schicht ist bereits austauschbar – ein Wechsel
            erfordert nur den Endpoint-Switch und keine UI-Änderungen.
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
