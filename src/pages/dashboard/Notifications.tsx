import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle } from "lucide-react";

const notifications = [
  { id: 1, title: "Nouveau cours disponible", message: "Le cours de mathématiques avancées est maintenant accessible.", type: "info", time: "Il y a 5 min", read: false },
  { id: 2, title: "Rendez-vous confirmé", message: "Votre rendez-vous du 15 janvier a été confirmé.", type: "success", time: "Il y a 1 heure", read: false },
  { id: 3, title: "Attention requise", message: "Veuillez compléter votre profil médical.", type: "warning", time: "Il y a 3 heures", read: true },
  { id: 4, title: "Résultats publiés", message: "Les résultats de l'examen de physique sont disponibles.", type: "info", time: "Hier", read: true },
];

const getIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

export default function Notifications() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">Restez informé de toutes les activités</p>
          </div>
          <Button variant="outline" className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Non lues</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cette semaine</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>Toutes les notifications</CardTitle>
            <CardDescription>Vos dernières notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`flex items-start gap-4 rounded-lg border p-4 ${!notif.read ? 'bg-primary/5 border-primary/20' : ''}`}
                >
                  <div className="mt-1">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{notif.title}</p>
                      <span className="text-xs text-muted-foreground">{notif.time}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{notif.message}</p>
                  </div>
                  {!notif.read && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
