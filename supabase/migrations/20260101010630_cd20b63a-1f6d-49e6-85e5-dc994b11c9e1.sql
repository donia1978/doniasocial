-- Enable realtime for social tables
ALTER TABLE public.social_posts REPLICA IDENTITY FULL;
ALTER TABLE public.social_comments REPLICA IDENTITY FULL;
ALTER TABLE public.social_likes REPLICA IDENTITY FULL;
ALTER TABLE public.stories REPLICA IDENTITY FULL;
ALTER TABLE public.story_views REPLICA IDENTITY FULL;
ALTER TABLE public.user_follows REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

-- Add to realtime publication (skip messages as already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'social_posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.social_posts;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'social_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.social_comments;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'social_likes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.social_likes;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'stories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_follows'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_follows;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END
$$;

-- Create RLS policies for user_follows table if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_follows' AND policyname = 'Anyone can view follows'
  ) THEN
    CREATE POLICY "Anyone can view follows" ON public.user_follows FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_follows' AND policyname = 'Users can follow others'
  ) THEN
    CREATE POLICY "Users can follow others" ON public.user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_follows' AND policyname = 'Users can unfollow others'
  ) THEN
    CREATE POLICY "Users can unfollow others" ON public.user_follows FOR DELETE USING (auth.uid() = follower_id);
  END IF;
END
$$;

-- Enable RLS on user_follows if not already enabled
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for post_bookmarks if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'post_bookmarks' AND policyname = 'Users can view their bookmarks'
  ) THEN
    CREATE POLICY "Users can view their bookmarks" ON public.post_bookmarks FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'post_bookmarks' AND policyname = 'Users can create bookmarks'
  ) THEN
    CREATE POLICY "Users can create bookmarks" ON public.post_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'post_bookmarks' AND policyname = 'Users can delete their bookmarks'
  ) THEN
    CREATE POLICY "Users can delete their bookmarks" ON public.post_bookmarks FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;

-- Add trigger for updating comments/likes count on social_posts
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_like_added ON public.social_likes;
CREATE TRIGGER on_like_added
  AFTER INSERT OR DELETE ON public.social_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_added ON public.social_comments;
CREATE TRIGGER on_comment_added
  AFTER INSERT OR DELETE ON public.social_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();