import { useLiveQuery } from "dexie-react-hooks";
import { db, Patient } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { formatDate } from "@/lib/utils";

export default function PatientsList() {
  const [q, setQ] = useState("");
  const patients = useLiveQuery(() => db.patients.orderBy("updatedAt").reverse().toArray(), []);

  const filtered = patients?.filter(p =>
    p.id.toLowerCase().includes(q.toLowerCase()) ||
    p.diagnoses.some(d => d.toLowerCase().includes(q.toLowerCase())) ||
    p.approach.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Patient:innen"
        description="Alle Patient:innen werden mit Pseudonym geführt. Klarnamen sind verschlüsselt."
        actions={<Button asChild><Link to="/patienten/neu"><Plus className="size-4 mr-2" /> Neu</Link></Button>}
      />

      <div className="relative mb-4 max-w-md">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Pseudonym, Diagnose, Ansatz…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {filtered && filtered.length === 0 && (
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">
          Noch keine Patient:innen angelegt.
        </CardContent></Card>
      )}

      <div className="grid gap-3">
        {filtered?.map(p => <PatientRow key={p.id} p={p} />)}
      </div>
    </>
  );
}

function PatientRow({ p }: { p: Patient }) {
  return (
    <Link to={`/patienten/${p.id}`}>
      <Card className="hover:border-primary/40 transition-colors">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium font-display">{p.id}</span>
              {!p.active && <Badge variant="outline" className="text-xs">archiviert</Badge>}
              <Badge variant="secondary" className="text-xs">{p.approach}</Badge>
              {p.diagnoses.slice(0, 3).map(d => (
                <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
              ))}
            </div>
            {p.goals && <div className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{p.goals}</div>}
          </div>
          <div className="text-xs text-muted-foreground shrink-0">
            {formatDate(p.updatedAt)}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
