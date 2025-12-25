import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CourseReviewsProps {
  courseId: string;
}

interface Review {
  id: string;
  rating: number;
  review: string | null;
  created_at: string;
  user_id: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function CourseReviews({ courseId }: CourseReviewsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["course-reviews", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_reviews")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;

      // Fetch profiles
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return data.map(r => ({
        ...r,
        profile: profileMap.get(r.user_id)
      })) as Review[];
    }
  });

  const myReview = reviews.find(r => r.user_id === user?.id);

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Non authentifié");
      if (rating === 0) throw new Error("Veuillez sélectionner une note");

      const { error } = await supabase
        .from("course_reviews")
        .upsert({
          course_id: courseId,
          user_id: user.id,
          rating,
          review: review || null
        }, { onConflict: "course_id,user_id" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-reviews", courseId] });
      toast.success("Avis enregistré !");
      setShowForm(false);
      setRating(0);
      setReview("");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const StarRating = ({ value, interactive = false }: { value: number; interactive?: boolean }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-5 w-5 transition-colors",
            interactive && "cursor-pointer",
            (interactive ? (hoverRating || rating) >= star : value >= star)
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          )}
          onClick={interactive ? () => setRating(star) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
        />
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Avis</CardTitle>
          <div className="flex items-center gap-2 mt-1">
            <StarRating value={parseFloat(averageRating)} />
            <span className="text-sm text-muted-foreground">
              {averageRating} ({reviews.length} avis)
            </span>
          </div>
        </div>
        {user && !myReview && !showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            Donner un avis
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <label className="text-sm font-medium mb-2 block">Votre note</label>
              <StarRating value={rating} interactive />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Votre avis (optionnel)</label>
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Partagez votre expérience..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => submitReview.mutate()}
                disabled={rating === 0 || submitReview.isPending}
              >
                {submitReview.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Publier
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Aucun avis pour le moment
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="flex gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={r.profile?.avatar_url || ""} />
                  <AvatarFallback>
                    {r.profile?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {r.profile?.full_name || "Utilisateur"}
                    </span>
                    <StarRating value={r.rating} />
                  </div>
                  {r.review && (
                    <p className="text-sm text-muted-foreground mt-1">{r.review}</p>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
