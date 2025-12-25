import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Loader2, Reply } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface CourseDiscussionsProps {
  courseId: string;
  lessonId?: string;
}

interface Discussion {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  replies?: Discussion[];
}

export function CourseDiscussions({ courseId, lessonId }: CourseDiscussionsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const { data: discussions = [], isLoading } = useQuery({
    queryKey: ["course-discussions", courseId, lessonId],
    queryFn: async () => {
      let query = supabase
        .from("course_discussions")
        .select("*")
        .eq("course_id", courseId)
        .is("parent_id", null)
        .order("created_at", { ascending: false });

      if (lessonId) {
        query = query.eq("lesson_id", lessonId);
      } else {
        query = query.is("lesson_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch all replies
      const parentIds = data.map(d => d.id);
      const { data: replies } = await supabase
        .from("course_discussions")
        .select("*")
        .in("parent_id", parentIds)
        .order("created_at", { ascending: true });

      // Fetch profiles
      const allUserIds = [...new Set([...data.map(d => d.user_id), ...(replies?.map(r => r.user_id) || [])])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", allUserIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Build discussion tree
      return data.map(d => ({
        ...d,
        profile: profileMap.get(d.user_id),
        replies: replies?.filter(r => r.parent_id === d.id).map(r => ({
          ...r,
          profile: profileMap.get(r.user_id)
        })) || []
      })) as Discussion[];
    }
  });

  const postDiscussion = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      if (!user?.id) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("course_discussions")
        .insert({
          course_id: courseId,
          lesson_id: lessonId || null,
          user_id: user.id,
          content: content.trim(),
          parent_id: parentId || null
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-discussions", courseId, lessonId] });
      setNewMessage("");
      setReplyTo(null);
      setReplyContent("");
      toast.success("Message publié");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const DiscussionItem = ({ discussion, isReply = false }: { discussion: Discussion; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? 'ml-12' : ''}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={discussion.profile?.avatar_url || ""} />
        <AvatarFallback className="text-xs">
          {discussion.profile?.full_name?.charAt(0) || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">
            {discussion.profile?.full_name || "Utilisateur"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true, locale: fr })}
          </span>
        </div>
        <p className="text-sm mt-1">{discussion.content}</p>
        {!isReply && user && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 mt-1"
            onClick={() => setReplyTo(replyTo === discussion.id ? null : discussion.id)}
          >
            <Reply className="h-3 w-3 mr-1" />
            Répondre
          </Button>
        )}
        
        {replyTo === discussion.id && (
          <div className="flex gap-2 mt-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Votre réponse..."
              rows={2}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={() => postDiscussion.mutate({ content: replyContent, parentId: discussion.id })}
              disabled={!replyContent.trim() || postDiscussion.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Discussion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {user && (
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Posez une question ou partagez une idée..."
                rows={2}
                className="flex-1"
              />
              <Button
                onClick={() => postDiscussion.mutate({ content: newMessage })}
                disabled={!newMessage.trim() || postDiscussion.isPending}
              >
                {postDiscussion.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : discussions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucune discussion pour le moment. Soyez le premier à poser une question !
          </p>
        ) : (
          <div className="space-y-6">
            {discussions.map((discussion) => (
              <div key={discussion.id} className="space-y-3">
                <DiscussionItem discussion={discussion} />
                {discussion.replies?.map((reply) => (
                  <DiscussionItem key={reply.id} discussion={reply} isReply />
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
