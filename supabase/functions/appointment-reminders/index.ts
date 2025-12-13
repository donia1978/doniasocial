import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AppointmentReminder {
  id: string;
  appointment_id: string;
  reminder_type: string;
  scheduled_at: string;
  status: string;
  channel: string;
  appointment: {
    id: string;
    appointment_date: string;
    type: string;
    location: string | null;
    notes: string | null;
    patient: {
      id: string;
      first_name: string;
      last_name: string;
      email: string | null;
      phone: string | null;
    };
    doctor_id: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting appointment reminders check...");

    // Get current time
    const now = new Date();
    
    // Find all pending reminders that should be sent now (scheduled_at <= now)
    const { data: pendingReminders, error: fetchError } = await supabase
      .from("appointment_reminders")
      .select(`
        id,
        appointment_id,
        reminder_type,
        scheduled_at,
        status,
        channel,
        appointments:appointment_id (
          id,
          appointment_date,
          type,
          location,
          notes,
          doctor_id,
          patients:patient_id (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        )
      `)
      .eq("status", "pending")
      .lte("scheduled_at", now.toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error("Error fetching reminders:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${pendingReminders?.length || 0} pending reminders to process`);

    const results: { success: number; failed: number; details: string[] } = {
      success: 0,
      failed: 0,
      details: [],
    };

    if (!pendingReminders || pendingReminders.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending reminders to process", results }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process each reminder
    for (const reminder of pendingReminders) {
      try {
        const appointment = reminder.appointments as any;
        const patient = appointment?.patients;

        if (!appointment || !patient) {
          console.log(`Skipping reminder ${reminder.id}: missing appointment or patient data`);
          results.failed++;
          results.details.push(`Reminder ${reminder.id}: missing data`);
          continue;
        }

        const appointmentDate = new Date(appointment.appointment_date);
        const formattedDate = appointmentDate.toLocaleDateString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        // Create notification message based on reminder type
        let title = "";
        let message = "";

        switch (reminder.reminder_type) {
          case "24h":
            title = "Rappel: Rendez-vous demain";
            message = `Bonjour ${patient.first_name}, vous avez un rendez-vous ${appointment.type} demain le ${formattedDate}${appointment.location ? ` à ${appointment.location}` : ""}.`;
            break;
          case "2h":
            title = "Rappel: Rendez-vous dans 2 heures";
            message = `Bonjour ${patient.first_name}, votre rendez-vous ${appointment.type} est dans 2 heures (${formattedDate})${appointment.location ? ` à ${appointment.location}` : ""}.`;
            break;
          case "15min":
            title = "Rappel: Rendez-vous imminent";
            message = `Bonjour ${patient.first_name}, votre rendez-vous ${appointment.type} commence dans 15 minutes${appointment.location ? ` à ${appointment.location}` : ""}.`;
            break;
          default:
            title = "Rappel de rendez-vous";
            message = `Rappel pour votre rendez-vous ${appointment.type} le ${formattedDate}.`;
        }

        // Get doctor's user profile to find their user_id for notifications
        const { data: doctorProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", appointment.doctor_id)
          .single();

        // Create in-app notification for the doctor
        if (doctorProfile) {
          await supabase.from("notifications").insert({
            user_id: appointment.doctor_id,
            title: `Rappel: ${patient.first_name} ${patient.last_name}`,
            message: `Rendez-vous ${appointment.type} ${reminder.reminder_type === "24h" ? "demain" : reminder.reminder_type === "2h" ? "dans 2h" : "dans 15min"} - ${formattedDate}`,
            type: "appointment_reminder",
          });
        }

        // Update reminder status to sent
        const { error: updateError } = await supabase
          .from("appointment_reminders")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            message: message,
          })
          .eq("id", reminder.id);

        if (updateError) {
          console.error(`Error updating reminder ${reminder.id}:`, updateError);
          results.failed++;
          results.details.push(`Reminder ${reminder.id}: update failed`);
        } else {
          console.log(`Successfully processed reminder ${reminder.id} for ${patient.first_name} ${patient.last_name}`);
          results.success++;
          results.details.push(`Reminder ${reminder.id}: sent to ${patient.first_name} ${patient.last_name}`);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Error processing reminder ${reminder.id}:`, err);
        results.failed++;
        results.details.push(`Reminder ${reminder.id}: ${errorMessage}`);
      }
    }

    console.log(`Finished processing. Success: ${results.success}, Failed: ${results.failed}`);

    return new Response(
      JSON.stringify({ 
        message: "Reminders processed", 
        results,
        processedAt: now.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in appointment-reminders function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
