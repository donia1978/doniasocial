import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Message = Tables<"messages"> & {
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

export type Conversation = Tables<"conversations"> & {
  participants?: { user_id: string; profiles?: { full_name: string | null; avatar_url: string | null } | null }[];
  last_message?: Message | null;
  unread_count?: number;
};

// Conversations
export async function getConversations() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  // Get conversations where user is participant
  const { data: participations, error: partError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  if (partError) throw partError;
  
  const conversationIds = participations?.map(p => p.conversation_id) || [];
  if (conversationIds.length === 0) return [];

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .in("id", conversationIds)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  // Fetch participants for each conversation
  const conversations = await Promise.all((data || []).map(async (conv) => {
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select(`
        user_id,
        last_read_at
      `)
      .eq("conversation_id", conv.id);

    // Get last message
    const { data: lastMsg } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get unread count
    const userParticipant = participants?.find(p => p.user_id === user.id);
    let unreadCount = 0;
    if (userParticipant?.last_read_at) {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .gt("created_at", userParticipant.last_read_at)
        .neq("sender_id", user.id);
      unreadCount = count || 0;
    }

    // Get profiles for other participants
    const otherParticipants = participants?.filter(p => p.user_id !== user.id) || [];
    const profilesData = await Promise.all(otherParticipants.map(async (p) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", p.user_id)
        .maybeSingle();
      return { user_id: p.user_id, profiles: profile };
    }));

    return {
      ...conv,
      participants: profilesData,
      last_message: lastMsg,
      unread_count: unreadCount
    };
  }));

  return conversations;
}

export async function createConversation(participantIds: string[], title?: string, isGroup = false) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  // Create conversation
  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .insert({
      title: title || null,
      is_group: isGroup
    })
    .select()
    .single();

  if (convError) throw convError;

  // Add participants (including current user)
  const allParticipants = [...new Set([user.id, ...participantIds])];
  
  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert(
      allParticipants.map(userId => ({
        conversation_id: conv.id,
        user_id: userId
      }))
    );

  if (partError) throw partError;

  return conv;
}

export async function findOrCreateDirectConversation(otherUserId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  // Find existing 1:1 conversation
  const { data: myConvs } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  const { data: theirConvs } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", otherUserId);

  const myConvIds = myConvs?.map(c => c.conversation_id) || [];
  const theirConvIds = theirConvs?.map(c => c.conversation_id) || [];
  const commonConvIds = myConvIds.filter(id => theirConvIds.includes(id));

  // Check if any of these are 1:1 (not group)
  for (const convId of commonConvIds) {
    const { data: conv } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", convId)
      .eq("is_group", false)
      .maybeSingle();

    if (conv) {
      // Verify it's only 2 participants
      const { count } = await supabase
        .from("conversation_participants")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", convId);

      if (count === 2) return conv;
    }
  }

  // Create new 1:1 conversation
  return createConversation([otherUserId], null, false);
}

// Messages
export async function getMessages(conversationId: string, limit = 50, before?: string) {
  let query = supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Get sender profiles
  const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
  const profiles: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
  
  for (const senderId of senderIds) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", senderId)
      .maybeSingle();
    if (profile) profiles[senderId] = profile;
  }

  return (data || [])
    .map(m => ({ ...m, profiles: profiles[m.sender_id] || null }))
    .reverse();
}

export async function sendMessage(conversationId: string, content: string, messageType = "text") {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      message_type: messageType
    })
    .select()
    .single();

  if (error) throw error;

  // Update conversation updated_at
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return data;
}

export async function markAsRead(conversationId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);
}

// Real-time
export function subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`
      },
      async (payload) => {
        const message = payload.new as Message;
        // Fetch sender profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", message.sender_id)
          .maybeSingle();
        
        callback({ ...message, profiles: profile });
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export function subscribeToConversations(callback: (payload: any) => void) {
  const channel = supabase
    .channel("conversations-updates")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "conversations" },
      callback
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      callback
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// User presence
export function trackPresence(userId: string) {
  const channel = supabase.channel("online-users", {
    config: { presence: { key: userId } }
  });

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({
        user_id: userId,
        online_at: new Date().toISOString()
      });
    }
  });

  return {
    channel,
    unsubscribe: () => supabase.removeChannel(channel)
  };
}

export function subscribeToPresence(callback: (state: Record<string, any[]>) => void) {
  const channel = supabase.channel("online-users");
  
  channel.on("presence", { event: "sync" }, () => {
    callback(channel.presenceState());
  });

  channel.subscribe();

  return () => supabase.removeChannel(channel);
}
