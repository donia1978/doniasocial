import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Trash2, Edit, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  type: string;
  color: string;
  is_all_day: boolean;
}

const eventTypes = [
  { value: "general", label: "Général", color: "#3b82f6" },
  { value: "medical", label: "Médical", color: "#10b981" },
  { value: "education", label: "Éducation", color: "#8b5cf6" },
  { value: "meeting", label: "Réunion", color: "#f59e0b" },
  { value: "personal", label: "Personnel", color: "#ec4899" },
];

export default function Agenda() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStartDate, setFormStartDate] = useState<Date>(new Date());
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("10:00");
  const [formLocation, setFormLocation] = useState("");
  const [formType, setFormType] = useState("general");
  const [formIsAllDay, setFormIsAllDay] = useState(false);

  const fetchEvents = async () => {
    if (!user) return;
    
    setLoading(true);
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .gte("start_date", start.toISOString())
      .lte("start_date", end.toISOString())
      .order("start_date", { ascending: true });
    
    if (error) {
      toast.error("Erreur lors du chargement des événements");
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [user, selectedDate]);

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormStartDate(selectedDate);
    setFormStartTime("09:00");
    setFormEndTime("10:00");
    setFormLocation("");
    setFormType("general");
    setFormIsAllDay(false);
    setEditingEvent(null);
  };

  const openNewEventDialog = () => {
    resetForm();
    setFormStartDate(selectedDate);
    setDialogOpen(true);
  };

  const openEditEventDialog = (event: Event) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description || "");
    setFormStartDate(new Date(event.start_date));
    setFormStartTime(format(new Date(event.start_date), "HH:mm"));
    setFormEndTime(event.end_date ? format(new Date(event.end_date), "HH:mm") : "10:00");
    setFormLocation(event.location || "");
    setFormType(event.type);
    setFormIsAllDay(event.is_all_day);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim() || !user) {
      toast.error("Le titre est requis");
      return;
    }

    setSubmitting(true);

    const startDateTime = formIsAllDay 
      ? new Date(formStartDate.setHours(0, 0, 0, 0))
      : new Date(`${format(formStartDate, "yyyy-MM-dd")}T${formStartTime}`);
    
    const endDateTime = formIsAllDay
      ? new Date(formStartDate.setHours(23, 59, 59, 999))
      : new Date(`${format(formStartDate, "yyyy-MM-dd")}T${formEndTime}`);

    const eventColor = eventTypes.find(t => t.value === formType)?.color || "#3b82f6";

    const eventData = {
      title: formTitle,
      description: formDescription || null,
      start_date: startDateTime.toISOString(),
      end_date: endDateTime.toISOString(),
      location: formLocation || null,
      type: formType,
      color: eventColor,
      is_all_day: formIsAllDay,
      user_id: user.id,
    };

    if (editingEvent) {
      const { error } = await supabase
        .from("events")
        .update(eventData)
        .eq("id", editingEvent.id);

      if (error) {
        toast.error("Erreur lors de la mise à jour");
      } else {
        toast.success("Événement mis à jour");
        setDialogOpen(false);
        fetchEvents();
      }
    } else {
      const { error } = await supabase
        .from("events")
        .insert(eventData);

      if (error) {
        toast.error("Erreur lors de la création");
      } else {
        toast.success("Événement créé");
        setDialogOpen(false);
        fetchEvents();
      }
    }

    setSubmitting(false);
  };

  const handleDelete = async (eventId: string) => {
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Événement supprimé");
      fetchEvents();
    }
  };

  const selectedDateEvents = events.filter(event => 
    isSameDay(new Date(event.start_date), selectedDate)
  );

  const datesWithEvents = events.map(e => new Date(e.start_date));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agenda</h1>
            <p className="text-muted-foreground">Gérez vos événements et rendez-vous</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={openNewEventDialog}>
                <Plus className="h-4 w-4" />
                Nouvel événement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingEvent ? "Modifier l'événement" : "Nouvel événement"}</DialogTitle>
                <DialogDescription>
                  {editingEvent ? "Modifiez les détails de l'événement" : "Créez un nouvel événement dans votre agenda"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Titre de l'événement"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: type.color }} />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formStartDate, "PPP", { locale: fr })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formStartDate}
                        onSelect={(date) => date && setFormStartDate(date)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="all-day">Toute la journée</Label>
                  <Switch
                    id="all-day"
                    checked={formIsAllDay}
                    onCheckedChange={setFormIsAllDay}
                  />
                </div>
                {!formIsAllDay && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="start-time">Début</Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="end-time">Fin</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="location">Lieu</Label>
                  <Input
                    id="location"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Lieu de l'événement"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Description de l'événement"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingEvent ? "Mettre à jour" : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Calendrier</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={fr}
                className="rounded-md border"
                modifiers={{
                  hasEvent: datesWithEvents,
                }}
                modifiersStyles={{
                  hasEvent: {
                    fontWeight: "bold",
                    textDecoration: "underline",
                    textDecorationColor: "hsl(var(--primary))",
                  },
                }}
              />
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Légende des types</p>
                <div className="grid grid-cols-2 gap-2">
                  {eventTypes.map((type) => (
                    <div key={type.value} className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: type.color }} />
                      <span className="text-muted-foreground">{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <Card>
            <CardHeader>
              <CardTitle>
                Événements du {format(selectedDate, "d MMMM yyyy", { locale: fr })}
              </CardTitle>
              <CardDescription>
                {selectedDateEvents.length} événement(s) prévu(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : selectedDateEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Aucun événement pour cette date</p>
                  <Button variant="outline" className="mt-4" onClick={openNewEventDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un événement
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-4 rounded-lg border p-4"
                      style={{ borderLeftColor: event.color, borderLeftWidth: 4 }}
                    >
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{event.title}</p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {event.is_all_day
                              ? "Toute la journée"
                              : `${format(new Date(event.start_date), "HH:mm")} - ${event.end_date ? format(new Date(event.end_date), "HH:mm") : ""}`}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditEventDialog(event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
