import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Story = Tables<"stories"> & {
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
  has_viewed?: boolean;
  reactions_count?: number;
};

export type StoryGroup = {
  user_id: string;
  user_name: string | null;
  avatar_url: string | null;
  stories: Story[];
  has_unviewed: boolean;
};

// Get all active stories grouped by user
export async function getStoryGroups(): Promise<StoryGroup[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Get unique user IDs
  const userIds = [...new Set(data?.map(s => s.user_id) || [])];
  
  // Fetch profiles
  const profiles: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
  for (const userId of userIds) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();
    if (profile) profiles[userId] = profile;
  }

  // Get user's viewed stories
  let viewedStoryIds: string[] = [];
  if (user) {
    const { data: views } = await supabase
      .from("story_views")
      .select("story_id")
      .eq("viewer_id", user.id);
    viewedStoryIds = views?.map(v => v.story_id) || [];
  }

  // Group stories by user
  const groups: Record<string, StoryGroup> = {};
  
  for (const story of data || []) {
    if (!groups[story.user_id]) {
      groups[story.user_id] = {
        user_id: story.user_id,
        user_name: profiles[story.user_id]?.full_name || null,
        avatar_url: profiles[story.user_id]?.avatar_url || null,
        stories: [],
        has_unviewed: false
      };
    }
    
    const hasViewed = viewedStoryIds.includes(story.id);
    groups[story.user_id].stories.push({
      ...story,
      profiles: profiles[story.user_id],
      has_viewed: hasViewed
    });
    
    if (!hasViewed) {
      groups[story.user_id].has_unviewed = true;
    }
  }

  // Sort: current user first, then by most recent story
  const sortedGroups = Object.values(groups).sort((a, b) => {
    if (user && a.user_id === user.id) return -1;
    if (user && b.user_id === user.id) return 1;
    const aLatest = Math.max(...a.stories.map(s => new Date(s.created_at).getTime()));
    const bLatest = Math.max(...b.stories.map(s => new Date(s.created_at).getTime()));
    return bLatest - aLatest;
  });

  return sortedGroups;
}

export async function createStory(mediaUrl: string, mediaType: "image" | "video" = "image", caption?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data, error } = await supabase
    .from("stories")
    .insert({
      user_id: user.id,
      media_url: mediaUrl,
      media_type: mediaType,
      caption: caption || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteStory(storyId: string) {
  const { error } = await supabase
    .from("stories")
    .delete()
    .eq("id", storyId);

  if (error) throw error;
}

export async function viewStory(storyId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Check if already viewed
  const { data: existing } = await supabase
    .from("story_views")
    .select("id")
    .eq("story_id", storyId)
    .eq("viewer_id", user.id)
    .maybeSingle();

  if (existing) return;

  await supabase
    .from("story_views")
    .insert({
      story_id: storyId,
      viewer_id: user.id
    });

  // Increment views count manually
  const { data: story } = await supabase
    .from("stories")
    .select("views_count")
    .eq("id", storyId)
    .single();

  if (story) {
    await supabase
      .from("stories")
      .update({ views_count: (story.views_count || 0) + 1 })
      .eq("id", storyId);
  }
}

export async function getStoryViews(storyId: string) {
  const { data, error } = await supabase
    .from("story_views")
    .select(`
      viewer_id,
      viewed_at
    `)
    .eq("story_id", storyId)
    .order("viewed_at", { ascending: false });

  if (error) throw error;

  // Get viewer profiles
  const viewerIds = data?.map(v => v.viewer_id) || [];
  const profiles: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
  
  for (const viewerId of viewerIds) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", viewerId)
      .maybeSingle();
    if (profile) profiles[viewerId] = profile;
  }

  return (data || []).map(v => ({
    ...v,
    profiles: profiles[v.viewer_id] || null
  }));
}

// Reactions
export async function addStoryReaction(storyId: string, reaction: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  // Remove existing reaction first
  await supabase
    .from("story_reactions")
    .delete()
    .eq("story_id", storyId)
    .eq("user_id", user.id);

  const { error } = await supabase
    .from("story_reactions")
    .insert({
      story_id: storyId,
      user_id: user.id,
      reaction
    });

  if (error) throw error;
}

export async function getStoryReactions(storyId: string) {
  const { data, error } = await supabase
    .from("story_reactions")
    .select("*")
    .eq("story_id", storyId);

  if (error) throw error;
  return data || [];
}

// Replies
export async function replyToStory(storyId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data, error } = await supabase
    .from("story_replies")
    .insert({
      story_id: storyId,
      user_id: user.id,
      content
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getStoryReplies(storyId: string) {
  const { data, error } = await supabase
    .from("story_replies")
    .select("*")
    .eq("story_id", storyId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Get user profiles
  const userIds = [...new Set(data?.map(r => r.user_id) || [])];
  const profiles: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
  
  for (const userId of userIds) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();
    if (profile) profiles[userId] = profile;
  }

  return (data || []).map(r => ({
    ...r,
    profiles: profiles[r.user_id] || null
  }));
}

// Upload story media
export async function uploadStoryMedia(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("stories")
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("stories").getPublicUrl(fileName);
  return data.publicUrl;
}

// Real-time
export function subscribeToStories(callback: (payload: any) => void) {
  const channel = supabase
    .channel("stories-updates")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "stories" },
      callback
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
