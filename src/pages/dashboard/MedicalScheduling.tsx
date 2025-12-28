import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/contexts/UserContext";

type Patient = { id: string; nom: string; prenom: string; date_naissance: string };
type Appt = { id: string; doctor_name: string; starts_at: string; ends_at: string; status: string; created_at: string };

export default function Medical() {
  const { supabaseUser } = useUser();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [pNom, setPNom] = useState("");
  const [pPrenom, setPPrenom] = useState("");
  const [pDob, setPDob] = useState("2000-01-01");

  const [patientId, setPatientId] = useState("");
  const [doctorName, setDoctorName] = useState("Docteur");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  async function loadPatients() {
    if (!supabaseUser?.id) return setPatients([]);
    const { data } = await supabase
      .from("pasion_patients")
      .select("id,nom,prenom,date_naissance")
      .eq("user_id", supabaseUser.id)
      .order("created_at", { ascending: false });
    const list = (data as Patient[]) ?? [];
    setPatients(list);
    if (!patientId && list[0]?.id) setPatientId(list[0].id);
  }

  async function loadAppts() {
    if (!supabaseUser?.id) return setAppts([]);
    const { data } = await supabase
      .from("medical_appointments")
      .select("id,doctor_name,starts_at,ends_at,status,created_at")
      .eq("user_id", supabaseUser.id)
      .order("starts_at", { ascending: true });
    setAppts((data as Appt[]) ?? []);
  }

  async function addPatient() {
    if (!supabaseUser?.id || !pNom.trim() || !pPrenom.trim()) return;
    await supabase.from("pasion_patients").insert({
      user_id: supabaseUser.id,
      nom: pNom, prenom: pPrenom, date_naissance: pDob
    });
    setPNom(""); setPPrenom("");
    await loadPatients();
  }

  async function addAppt() {
    if (!supabaseUser?.id || !patientId || !doctorName.trim() || !startsAt || !endsAt) return;
    await supabase.from("medical_appointments").insert({
      user_id: supabaseUser.id,
      patient_id: patientId,
      doctor_name: doctorName,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      status: "scheduled"
    });
    await loadAppts();
    // Notification auto générée par trigger SQL
  }

  useEffect(()=>{ loadPatients(); loadAppts(); /* eslint-disable-next-line */ }, [supabaseUser?.id]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Médical (pasion) — RDV & Notifications</h1>

        <Card>
          <CardHeader><CardTitle>Patients</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3 flex-wrap">
              <Input placeholder="Nom" value={pNom} onChange={(e)=>setPNom(e.target.value)} className="max-w-xs" />
              <Input placeholder="Prénom" value={pPrenom} onChange={(e)=>setPPrenom(e.target.value)} className="max-w-xs" />
              <Input type="date" value={pDob} onChange={(e)=>setPDob(e.target.value)} className="max-w-[180px]" />
              <Button onClick={addPatient}>Ajouter</Button>
            </div>
            <div className="space-y-2">
              {patients.map(p => (
                <div key={p.id} className={"rounded border p-3 " + (patientId===p.id ? "bg-primary/5" : "")}
                     onClick={()=>setPatientId(p.id)}>
                  <div className="font-semibold">{p.nom} {p.prenom}</div>
                  <div className="text-xs text-muted-foreground">Né(e): {p.date_naissance}</div>
                </div>
              ))}
              {patients.length===0 && <div className="text-sm text-muted-foreground">Aucun patient.</div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Créer un rendez-vous</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3 flex-wrap">
              <Input placeholder="Docteur" value={doctorName} onChange={(e)=>setDoctorName(e.target.value)} className="max-w-xs" />
              <Input type="datetime-local" value={startsAt} onChange={(e)=>setStartsAt(e.target.value)} />
              <Input type="datetime-local" value={endsAt} onChange={(e)=>setEndsAt(e.target.value)} />
              <Button onClick={addAppt} disabled={!patientId}>Planifier</Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Une notification est créée automatiquement lors de l'ajout (trigger SQL).
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Rendez-vous</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {appts.map(a => (
              <div key={a.id} className="rounded border p-3">
                <div className="font-semibold">{a.doctor_name} — {a.status}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(a.starts_at).toLocaleString()} → {new Date(a.ends_at).toLocaleString()}
                </div>
              </div>
            ))}
            {appts.length===0 && <div className="text-sm text-muted-foreground">Aucun RDV.</div>}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
