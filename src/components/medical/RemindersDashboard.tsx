import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Clock, CheckCircle, AlertCircle, Send, Calendar, TrendingUp, Users } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ReminderStats {
  total: number;
  pending: number;
  sent: number;
  byType: { name: string; value: number }[];
  byChannel: { name: string; value: number }[];
  last7Days: { date: string; sent: number; pending: number }[];
}

interface Reminder {
  id: string;
  reminder_type: string;
  status: string;
  channel: string;
  scheduled_at: string;
  sent_at: string | null;
  message: string | null;
  appointment: {
    appointment_date: string;
    type: string;
    patient: {
      first_name: string;
      last_name: string;
    };
  } | null;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

const reminderTypeLabels: Record<string, string> = {
  '24h': '24 heures avant',
  '2h': '2 heures avant',
  '15min': '15 minutes avant',
};

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  sent: 'Envoyé',
  failed: 'Échoué',
};

const channelLabels: Record<string, string> = {
  push: 'Notification Push',
  email: 'Email',
  sms: 'SMS',
};

export function RemindersDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReminderStats>({
    total: 0,
    pending: 0,
    sent: 0,
    byType: [],
    byChannel: [],
    last7Days: [],
  });
  const [recentReminders, setRecentReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRecentReminders();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      // Fetch all reminders for statistics
      const { data: reminders, error } = await supabase
        .from("appointment_reminders")
        .select("*");

      if (error) throw error;

      if (!reminders) {
        setStats({
          total: 0,
          pending: 0,
          sent: 0,
          byType: [],
          byChannel: [],
          last7Days: [],
        });
        return;
      }

      // Calculate stats
      const total = reminders.length;
      const pending = reminders.filter(r => r.status === 'pending').length;
      const sent = reminders.filter(r => r.status === 'sent').length;

      // By type
      const typeCount: Record<string, number> = {};
      reminders.forEach(r => {
        typeCount[r.reminder_type] = (typeCount[r.reminder_type] || 0) + 1;
      });
      const byType = Object.entries(typeCount).map(([name, value]) => ({
        name: reminderTypeLabels[name] || name,
        value,
      }));

      // By channel
      const channelCount: Record<string, number> = {};
      reminders.forEach(r => {
        channelCount[r.channel] = (channelCount[r.channel] || 0) + 1;
      });
      const byChannel = Object.entries(channelCount).map(([name, value]) => ({
        name: channelLabels[name] || name,
        value,
      }));

      // Last 7 days
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const dayReminders = reminders.filter(r => {
          const scheduledAt = new Date(r.scheduled_at);
          return scheduledAt >= dayStart && scheduledAt <= dayEnd;
        });

        last7Days.push({
          date: format(date, 'EEE', { locale: fr }),
          sent: dayReminders.filter(r => r.status === 'sent').length,
          pending: dayReminders.filter(r => r.status === 'pending').length,
        });
      }

      setStats({ total, pending, sent, byType, byChannel, last7Days });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRecentReminders = async () => {
    try {
      const { data, error } = await supabase
        .from("appointment_reminders")
        .select(`
          id,
          reminder_type,
          status,
          channel,
          scheduled_at,
          sent_at,
          message,
          appointments:appointment_id (
            appointment_date,
            type,
            patients:patient_id (
              first_name,
              last_name
            )
          )
        `)
        .order("scheduled_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedReminders: Reminder[] = (data || []).map((r: any) => ({
        id: r.id,
        reminder_type: r.reminder_type,
        status: r.status,
        channel: r.channel,
        scheduled_at: r.scheduled_at,
        sent_at: r.sent_at,
        message: r.message,
        appointment: r.appointments ? {
          appointment_date: r.appointments.appointment_date,
          type: r.appointments.type,
          patient: r.appointments.patients ? {
            first_name: r.appointments.patients.first_name,
            last_name: r.appointments.patients.last_name,
          } : { first_name: 'Inconnu', last_name: '' },
        } : null,
      }));

      setRecentReminders(formattedReminders);
    } catch (error) {
      console.error("Error fetching recent reminders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Envoyé</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> En attente</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" /> Échoué</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      '24h': 'bg-blue-100 text-blue-800',
      '2h': 'bg-purple-100 text-purple-800',
      '15min': 'bg-orange-100 text-orange-800',
    };
    return <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>{reminderTypeLabels[type] || type}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rappels</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Envoyés</p>
                <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Send className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux d'envoi</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Statistiques des 7 derniers jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="bar">
              <TabsList className="mb-4">
                <TabsTrigger value="bar">Historique</TabsTrigger>
                <TabsTrigger value="type">Par type</TabsTrigger>
                <TabsTrigger value="channel">Par canal</TabsTrigger>
              </TabsList>
              
              <TabsContent value="bar">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.last7Days}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sent" name="Envoyés" fill="#22c55e" />
                    <Bar dataKey="pending" name="En attente" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="type">
                {stats.byType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.byType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.byType.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    Aucune donnée disponible
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="channel">
                {stats.byChannel.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.byChannel}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.byChannel.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    Aucune donnée disponible
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Rappels récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px]">
              {recentReminders.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun rappel programmé</p>
                  <p className="text-sm">Les rappels apparaîtront ici lors de la création de rendez-vous</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(reminder.status)}
                            {getTypeBadge(reminder.reminder_type)}
                          </div>
                          <p className="mt-2 font-medium text-sm truncate">
                            {reminder.appointment?.patient
                              ? `${reminder.appointment.patient.first_name} ${reminder.appointment.patient.last_name}`
                              : 'Patient inconnu'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Prévu: {format(new Date(reminder.scheduled_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                          </p>
                          {reminder.sent_at && (
                            <p className="text-xs text-green-600">
                              Envoyé: {format(new Date(reminder.sent_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {channelLabels[reminder.channel] || reminder.channel}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
