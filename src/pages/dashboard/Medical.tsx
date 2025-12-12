import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stethoscope, Calendar, FileText, Users, Plus, Clock } from "lucide-react";

const appointments = [
  { id: 1, patient: "Marie Dupont", time: "09:00", type: "Consultation", status: "confirmé" },
  { id: 2, patient: "Jean Martin", time: "10:30", type: "Suivi", status: "en attente" },
  { id: 3, patient: "Sophie Bernard", time: "14:00", type: "Examen", status: "confirmé" },
  { id: 4, patient: "Pierre Durand", time: "15:30", type: "Consultation", status: "confirmé" },
];

export default function Medical() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Médical</h1>
            <p className="text-muted-foreground">Gestion des rendez-vous et dossiers médicaux</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau rendez-vous
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">RDV aujourd'hui</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">847</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Dossiers</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,341</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Consultations/mois</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Rendez-vous du jour</CardTitle>
            <CardDescription>Liste des consultations programmées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-green-500/10 p-2">
                      <Stethoscope className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">{apt.patient}</p>
                      <p className="text-sm text-muted-foreground">{apt.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{apt.time}</span>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      apt.status === 'confirmé' 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      {apt.status}
                    </span>
                    <Button variant="outline" size="sm">Voir</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
