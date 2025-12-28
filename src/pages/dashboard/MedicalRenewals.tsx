import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listRenewalPlans } from "@/modules/medical/services/prescriptions";

export default function MedicalRenewals() {
  const { supabaseUser } = useUser();
  const [patientId, setPatientId] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const uid = supabaseUser?.id;

  async function refresh() {
    if (!uid) return;
    const data = await listRenewalPlans(uid, patientId || undefined);
    setRows(data);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Renouvellement CNAM — Calcul RDV</CardTitle>
          <CardDescription>
            Plan de renouvellement calculé via règles configurables (pasion/cnam/tn_cnam_rules.json).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">Patient ID (optionnel)</div>
              <Input value={patientId} onChange={(e)=>setPatientId(e.target.value)} placeholder="UUID patient" />
            </div>
            <div className="flex items-end">
              <Button onClick={refresh}>Rafraîchir</Button>
            </div>
          </div>

          <div className="space-y-3">
            {rows.map((p)=>(
              <div key={p.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-sm">Plan: {p.status}</div>
                  <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Patient: {p.patient_id}</div>
                <div className="mt-2 text-sm">
                  <div>Renouvellement dû: <b>{p.renewal_due_at ? new Date(p.renewal_due_at).toLocaleString() : "-"}</b></div>
                  <div>Prochain RDV conseillé: <b>{p.next_appointment_at ? new Date(p.next_appointment_at).toLocaleString() : "-"}</b></div>
                  <div>Rappel (lead days): <b>{p.lead_days}</b></div>
                </div>
              </div>
            ))}
            {rows.length === 0 && <div className="text-sm text-muted-foreground">Aucun plan.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
