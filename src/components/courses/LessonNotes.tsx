import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Plus, Trash2, Loader2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface LessonNotesProps {
  lessonId: string;
}

interface Note {
  id: string;
  content: string;
  timestamp_seconds: number | null;
  created_at: string;
}

export function LessonNotes({ lessonId }: LessonNotesProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["lesson-notes", lessonId],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("lesson_notes")
        .select("*")
        .eq("lesson_id", lessonId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Note[];
    },
    enabled: !!user?.id
  });

  const addNote = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Non authentifié");
      if (!newNote.trim()) throw new Error("Note vide");

      const { error } = await supabase
        .from("lesson_notes")
        .insert({
          lesson_id: lessonId,
          user_id: user.id,
          content: newNote.trim()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-notes", lessonId] });
      setNewNote("");
      setShowForm(false);
      toast.success("Note ajoutée");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("lesson_notes")
        .delete()
        .eq("id", noteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-notes", lessonId] });
      toast.success("Note supprimée");
    }
  });

  const formatTimestamp = (seconds: number | null) => {
    if (seconds === null) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <StickyNote className="h-4 w-4" />
          Mes notes
        </CardTitle>
        {!showForm && (
          <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="space-y-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Prenez une note..."
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => addNote.mutate()}
                disabled={!newNote.trim() || addNote.isPending}
              >
                {addNote.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Sauvegarder
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            Aucune note pour cette leçon
          </p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {notes.map((note) => (
              <div 
                key={note.id} 
                className="p-3 bg-muted/50 rounded-lg group relative"
              >
                {note.timestamp_seconds && (
                  <div className="flex items-center gap-1 text-xs text-primary mb-1">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(note.timestamp_seconds)}
                  </div>
                )}
                <p className="text-sm pr-8">{note.content}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(note.created_at).toLocaleDateString("fr-FR")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteNote.mutate(note.id)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
