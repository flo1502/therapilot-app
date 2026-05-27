import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogIn, UserPlus } from "lucide-react";

export default function AuthPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Eingeloggt.");
    nav("/");
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Konto erstellt. Prüfe ggf. dein E-Mail-Postfach.");
  };

  const google = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) { toast.error("Google-Login fehlgeschlagen."); return; }
      if (result.redirected) return;
      nav("/");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Login" description="Eingeloggte Nutzer:innen können Patient:innen und Sessions bearbeiten. Lesezugriff ist öffentlich." />
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6">
          <Button variant="outline" className="w-full mb-4" onClick={google} disabled={busy}>
            Mit Google fortfahren
          </Button>
          <div className="text-center text-xs text-muted-foreground mb-4">oder mit E-Mail</div>
          <Tabs defaultValue="signin">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="signin">Einloggen</TabsTrigger>
              <TabsTrigger value="signup">Registrieren</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-3 pt-4">
                <div><Label>E-Mail</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div><Label>Passwort</Label><Input type="password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={busy}><LogIn className="size-4 mr-2" />Einloggen</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-3 pt-4">
                <div><Label>E-Mail</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div><Label>Passwort (min. 8 Zeichen)</Label><Input type="password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={busy}><UserPlus className="size-4 mr-2" />Registrieren</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
