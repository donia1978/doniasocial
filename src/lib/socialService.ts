import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type SocialPost = Tables<"social_posts"> & {
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
  user_has_liked?: boolean;
};

export type SocialComment = Tables<"social_comments"> & {
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

// Posts
export async function getPosts(limit = 20, offset = 0) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("social_posts")
    .select(`
      *,
      profiles:public_profiles!social_posts_user_id_fkey(full_name, avatar_url)
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Get user's likes
  let userLikes: string[] = [];
  if (user) {
    const { data: likes } = await supabase
      .from("social_likes")
      .select("post_id")
      .eq("user_id", user.id);
    userLikes = likes?.map(l => l.post_id) || [];
  }

  return (data || []).map(post => ({
    ...post,
    user_has_liked: userLikes.includes(post.id)
  }));
}

export async function getPostById(postId: string) {
  const { data, error } = await supabase
    .from("social_posts")
    .select(`
      *,
      profiles:public_profiles!social_posts_user_id_fkey(full_name, avatar_url)
    `)
    .eq("id", postId)
    .single();

  if (error) throw error;
  return data;
}

export async function createPost(content: string, mediaUrls?: string[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data, error } = await supabase
    .from("social_posts")
    .insert({
      user_id: user.id,
      content,
      media_urls: mediaUrls || null,
      visibility: "public"
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePost(postId: string) {
  const { error } = await supabase
    .from("social_posts")
    .delete()
    .eq("id", postId);

  if (error) throw error;
}

export async function updatePost(postId: string, content: string) {
  const { error } = await supabase
    .from("social_posts")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", postId);

  if (error) throw error;
}

// Likes
export async function likePost(postId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error } = await supabase
    .from("social_likes")
    .insert({ post_id: postId, user_id: user.id });

  if (error && error.code !== "23505") throw error; // Ignore duplicate key error
}

export async function unlikePost(postId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error } = await supabase
    .from("social_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id);

  if (error) throw error;
}

// Comments
export async function getComments(postId: string) {
  const { data, error } = await supabase
    .from("social_comments")
    .select(`
      *,
      profiles:public_profiles!social_comments_user_id_fkey(full_name, avatar_url)
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addComment(postId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data, error } = await supabase
    .from("social_comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      content
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase
    .from("social_comments")
    .delete()
    .eq("id", commentId);

  if (error) throw error;
}

// Follows
export async function followUser(userId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error } = await supabase
    .from("user_follows")
    .insert({ follower_id: user.id, following_id: userId });

  if (error && error.code !== "23505") throw error;
}

export async function unfollowUser(userId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", userId);

  if (error) throw error;
}

export async function getFollowers(userId: string) {
  const { data, error } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("following_id", userId);

  if (error) throw error;
  return data?.map(f => f.follower_id) || [];
}

export async function getFollowing(userId: string) {
  const { data, error } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", userId);

  if (error) throw error;
  return data?.map(f => f.following_id) || [];
}

export async function isFollowing(userId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("user_follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", userId)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

// Bookmarks
export async function bookmarkPost(postId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error } = await supabase
    .from("post_bookmarks")
    .insert({ post_id: postId, user_id: user.id });

  if (error && error.code !== "23505") throw error;
}

export async function unbookmarkPost(postId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error } = await supabase
    .from("post_bookmarks")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function getBookmarkedPosts() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("post_bookmarks")
    .select(`
      post_id,
      social_posts(
        *,
        profiles:public_profiles!social_posts_user_id_fkey(full_name, avatar_url)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data?.map(b => b.social_posts).filter(Boolean) || [];
}

// Report
export async function reportPost(postId: string, reason: string, details?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error } = await supabase
    .from("post_reports")
    .insert({
      post_id: postId,
      user_id: user.id,
      reason,
      details
    });

  if (error) throw error;
}

// Real-time subscriptions
export function subscribeToFeed(callback: (payload: any) => void) {
  const channel = supabase
    .channel("social-feed")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "social_posts" },
      callback
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "social_likes" },
      callback
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "social_comments" },
      callback
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
