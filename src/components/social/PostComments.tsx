import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface PostCommentsProps {
  postId: string;
  onCommentAdded: () => void;
}

export function PostComments({ postId, onCommentAdded }: PostCommentsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const userIds = [...new Set(data?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      return data?.map(comment => ({
        ...comment,
        profile: profiles?.find(p => p.id === comment.user_id)
      })) as Comment[];
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("social_comments").insert({
        post_id: postId,
        user_id: user!.id,
        content
      });
      if (error) throw error;

      // Increment comments count
      const { data: currentPost } = await supabase
        .from("social_posts")
        .select("comments_count")
        .eq("id", postId)
        .single();
      
      if (currentPost) {
        await supabase
          .from("social_posts")
          .update({ comments_count: (currentPost.comments_count || 0) + 1 })
          .eq("id", postId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
      setNewComment("");
      onCommentAdded();
    },
    onError: () => toast.error("Erreur lors de l'ajout du commentaire")
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  return (
    <div className="space-y-3 pt-3 border-t">
      {isLoading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {comments?.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={comment.profile?.avatar_url || ""} />
                <AvatarFallback className="text-xs">
                  {comment.profile?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <p className="text-xs font-medium">{comment.profile?.full_name || "Utilisateur"}</p>
                  <p className="text-sm">{comment.content}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(comment.created_at), "d MMM 'à' HH:mm", { locale: fr })}
                </p>
              </div>
            </div>
          ))}
        </>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="text-xs">
            {user?.email?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Écrire un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="h-8 text-sm"
          />
          <Button 
            type="submit" 
            size="sm" 
            disabled={!newComment.trim() || addCommentMutation.isPending}
          >
            {addCommentMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
