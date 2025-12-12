import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  GraduationCap, 
  Stethoscope, 
  Users, 
  Bell, 
  Calendar, 
  BookOpen,
  TrendingUp,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { title: "Étudiants", value: "1,234", icon: GraduationCap, color: "text-blue-500" },
  { title: "Consultations", value: "89", icon: Stethoscope, color: "text-green-500" },
  { title: "Utilisateurs", value: "5,678", icon: Users, color: "text-purple-500" },
  { title: "Notifications", value: "12", icon: Bell, color: "text-orange-500" },
];

const quickActions = [
  { title: "Éducation", description: "Gérer les cours et examens", icon: GraduationCap, href: "/dashboard/education" },
  { title: "Médical", description: "Rendez-vous et dossiers", icon: Stethoscope, href: "/dashboard/medical" },
  { title: "Agenda", description: "Planifier les événements", icon: Calendar, href: "/dashboard/agenda" },
  { title: "Cours en ligne", description: "Accéder aux formations", icon: BookOpen, href: "/dashboard/courses" },
];

const recentActivities = [
  { title: "Nouveau cours ajouté", time: "Il y a 2 heures", icon: BookOpen },
  { title: "Consultation programmée", time: "Il y a 4 heures", icon: Stethoscope },
  { title: "Résultats publiés", time: "Il y a 6 heures", icon: TrendingUp },
  { title: "Réunion planifiée", time: "Il y a 8 heures", icon: Calendar },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">Bienvenue sur la plateforme DONIA</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Accès rapide</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link key={action.href} to={action.href}>
                <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <action.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{action.title}</CardTitle>
                        <CardDescription>{action.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>Les dernières actions sur la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="rounded-full bg-muted p-2">
                      <activity.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiques du jour</CardTitle>
              <CardDescription>Aperçu des performances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cours complétés</span>
                  <span className="font-medium">45%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 w-[45%] rounded-full bg-primary" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Présence</span>
                  <span className="font-medium">78%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 w-[78%] rounded-full bg-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Satisfaction</span>
                  <span className="font-medium">92%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 w-[92%] rounded-full bg-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
