import { useEffect, useState } from "react";
import { initializeEncryption, isEncryptionInitialized, isUnlocked, unlock } from "@/lib/crypto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";

interface Props { onUnlocked: () => void }

export function LockScreen({ onUnlocked }: Props) {
  const [hasInit, setHasInit] = useState(isEncryptionInitialized());
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isUnlocked()) onUnlocked();
  }, [onUnlocked]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!pwd || pwd.length < 8) { toast.error("Mindestens 8 Zeichen."); return; }
    setBusy(true);
    try {
      if (!hasInit) {
        if (pwd !== pwd2) { toast.error("Passwörter stimmen nicht überein."); setBusy(false); return; }
        await initializeEncryption(pwd);
        toast.success("Master-Passwort gesetzt.");
        onUnlocked();
      } else {
        const ok = await unlock(pwd);
        if (!ok) { toast.error("Falsches Passwort."); setBusy(false); return; }
        onUnlocked();
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Fehler");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md surface-elevated p-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-12 rounded-full bg-primary-soft flex items-center justify-center">
            <ShieldCheck className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl">TheraPilot</h1>
            <p className="text-sm text-muted-foreground">Lokal. Verschlüsselt. DSGVO-bewusst.</p>
          </div>
        </div>

        <form onSubmit={handle} className="space-y-4">
          <div>
            <Label htmlFor="pwd">{hasInit ? "Master-Passwort" : "Neues Master-Passwort festlegen"}</Label>
            <Input id="pwd" type="password" autoFocus value={pwd} onChange={e => setPwd(e.target.value)} />
          </div>
          {!hasInit && (
            <div>
              <Label htmlFor="pwd2">Passwort wiederholen</Label>
              <Input id="pwd2" type="password" value={pwd2} onChange={e => setPwd2(e.target.value)} />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            <Lock className="mr-2 size-4" />
            {hasInit ? "Entsperren" : "Konto erstellen"}
          </Button>
        </form>

        <p className="mt-6 text-xs text-muted-foreground leading-relaxed">
          Das Master-Passwort verschlüsselt sensible Felder (Klarnamen, freie Notizen) lokal in Ihrem Browser.
          Es wird nie übertragen. Bei Verlust können verschlüsselte Daten <strong>nicht</strong> wiederhergestellt werden.
        </p>
      </div>
    </div>
  );
}
