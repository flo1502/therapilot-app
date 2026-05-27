
CREATE TABLE public.patients (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at bigint NOT NULL DEFAULT 0
);
CREATE TABLE public.sessions (
  id text PRIMARY KEY,
  patient_id text,
  data jsonb NOT NULL,
  updated_at bigint NOT NULL DEFAULT 0
);
CREATE TABLE public.decks (
  id text PRIMARY KEY,
  patient_id text,
  data jsonb NOT NULL,
  updated_at bigint NOT NULL DEFAULT 0
);

CREATE INDEX idx_sessions_patient_id ON public.sessions(patient_id);
CREATE INDEX idx_decks_patient_id ON public.decks(patient_id);

GRANT SELECT ON public.patients TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;

GRANT SELECT ON public.sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;

GRANT SELECT ON public.decks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.decks TO authenticated;
GRANT ALL ON public.decks TO service_role;

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;

-- Public read (demo mode: anyone with the link sees the data)
CREATE POLICY "Anyone can view patients" ON public.patients FOR SELECT USING (true);
CREATE POLICY "Anyone can view sessions" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can view decks" ON public.decks FOR SELECT USING (true);

-- Only authenticated users can write
CREATE POLICY "Authenticated can insert patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update patients" ON public.patients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete patients" ON public.patients FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can insert sessions" ON public.sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update sessions" ON public.sessions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete sessions" ON public.sessions FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can insert decks" ON public.decks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update decks" ON public.decks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete decks" ON public.decks FOR DELETE TO authenticated USING (true);

-- Enable realtime so visitors see live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.decks;
