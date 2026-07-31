ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS owner_id uuid DEFAULT auth.uid();
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS owner_id uuid DEFAULT auth.uid();
ALTER TABLE public.decks ADD COLUMN IF NOT EXISTS owner_id uuid DEFAULT auth.uid();

DROP POLICY IF EXISTS "Authenticated can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated can update patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated can delete patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated can insert sessions" ON public.sessions;
DROP POLICY IF EXISTS "Authenticated can update sessions" ON public.sessions;
DROP POLICY IF EXISTS "Authenticated can delete sessions" ON public.sessions;
DROP POLICY IF EXISTS "Authenticated can insert decks" ON public.decks;
DROP POLICY IF EXISTS "Authenticated can update decks" ON public.decks;
DROP POLICY IF EXISTS "Authenticated can delete decks" ON public.decks;

CREATE POLICY "Owners can insert patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update patients" ON public.patients FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can delete patients" ON public.patients FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Owners can insert sessions" ON public.sessions FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update sessions" ON public.sessions FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can delete sessions" ON public.sessions FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Owners can insert decks" ON public.decks FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update decks" ON public.decks FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can delete decks" ON public.decks FOR DELETE TO authenticated USING (owner_id = auth.uid());