import { supabase } from "@/lib/supabaseClient";

export async function createNotification(args: {
  user_id: string;
  type: string;
  title: string;
  message: string;
  email_to?: string | null; // if set, worker will email
}) {
  const { error } = await supabase.from("notifications").insert({
    user_id: args.user_id,
    type: args.type,
    title: args.title,
    message: args.message,
    email_to: args.email_to ?? null,
    email_status: args.email_to ? "pending" : "skipped"
  });
  if (error) throw error;
}
