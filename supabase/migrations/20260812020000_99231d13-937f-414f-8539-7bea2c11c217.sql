-- Slide-Decks-Feature entfernt (nicht mehr benötigt: keine Psychoedukations-
-- Folien mehr). Dropt die decks-Tabelle inkl. Policies/Indizes/Realtime-
-- Mitgliedschaft (wird von Postgres beim DROP automatisch mitentfernt).
-- Diese Migration muss über Lovable/Supabase angewendet werden — sie kann
-- von hier aus nicht deployed werden (kein CLI-Zugriff auf das Projekt).

DROP TABLE IF EXISTS public.decks;
