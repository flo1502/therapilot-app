import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Prüft, ob ein Nutzer eingeloggt ist. Toastet sonst und gibt false zurück. */
export async function ensureAuthed(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) {
    toast.error("Bitte zuerst einloggen, um Änderungen zu speichern.");
    return false;
  }
  return true;
}
