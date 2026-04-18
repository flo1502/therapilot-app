import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function SessionsList() {
  const sessions = useLiveQuery(() => db.sessions.orderBy("date").reverse().toArray(), []);

  return (
    <>
      <PageHeader title="Sessions" description="Alle dokumentierten Sitzungen."
        actions={<Button asChild><Link to="/sessions/neu"><Plus className="size-4 mr-2" />Neu</Link></Button>} />

      {sessions && sessions.length === 0 && (
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">
          Noch keine Sessions dokumentiert.
        </CardContent></Card>
      )}

      <div className="grid gap-3">
        {sessions?.map(s => (
          <Link key={s.id} to={`/sessions/${s.id}`}>
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium font-display">{s.patientId}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{formatDateTime(s.date)} · {s.durationMin} min</div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{s.format}</Badge>
                  {s.structured && <Badge>strukturiert</Badge>}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
