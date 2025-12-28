import { supabase } from "@/lib/supabaseClient";
import { computeRenewalFromItems, computeDates } from "@/modules/medical/cnam/rules";

// IMPORTANT: DRAFT only. Validation is human.
export async function createPrescriptionDraft(args: {
  user_id: string;
  patient_id: string;
  kind: "ordinary" | "chronic";
  prescriber_name?: string;
  prescriber_rpps?: string;
  notes?: string;
  items: Array<{
    medication_id?: string | null;
    dci: string;
    atc?: string | null;
    dosage?: string;
    frequency?: string;
    duration_days?: number;
    quantity?: number;
    instructions?: string;
  }>;
}) {
  const { data: rx, error: e1 } = await supabase
    .from("pasion_prescriptions")
    .insert({
      user_id: args.user_id,
      patient_id: args.patient_id,
      kind: args.kind,
      status: "draft",
      prescriber_name: args.prescriber_name ?? null,
      prescriber_rpps: args.prescriber_rpps ?? null,
      notes: args.notes ?? null,
      country_code: "TN",
      payer: "CNAM"
    })
    .select("*")
    .single();

  if (e1) throw e1;

  const itemsPayload = args.items.map((it) => ({
    user_id: args.user_id,
    prescription_id: rx.id,
    medication_id: it.medication_id ?? null,
    dci: it.dci,
    dosage: it.dosage ?? null,
    frequency: it.frequency ?? null,
    duration_days: it.duration_days ?? null,
    quantity: it.quantity ?? null,
    instructions: it.instructions ?? null
  }));

  const { error: e2 } = await supabase.from("pasion_prescription_items").insert(itemsPayload);
  if (e2) throw e2;

  // Compute renewal plan (configurable CNAM rules)
  const decision = computeRenewalFromItems({
    isChronic: args.kind === "chronic",
    atcList: args.items.map(i => i.atc ?? "").filter(Boolean),
    durationDaysList: args.items.map(i => i.duration_days ?? 0)
  });

  const now = new Date();
  const { renewalDue, nextAppt } = computeDates(now, decision);

  const { data: plan, error: e3 } = await supabase
    .from("pasion_renewal_plans")
    .insert({
      user_id: args.user_id,
      patient_id: args.patient_id,
      prescription_id: rx.id,
      renewal_due_at: renewalDue.toISOString(),
      next_appointment_at: nextAppt.toISOString(),
      lead_days: decision.leadDays,
      status: "active"
    })
    .select("*")
    .single();
  if (e3) throw e3;

  // Optional: create notification if your notifications table exists
  // We do "best effort" without failing the draft if notifications schema differs.
  try {
    await supabase.from("notifications").insert({
      user_id: args.user_id,
      type: "medical_renewal",
      title: "Renouvellement médicament",
      message: Prévoir RDV de renouvellement (CNAM): ,
      created_at: new Date().toISOString()
    });
  } catch (_) {}

  return { rx, plan, decision };
}

export async function listPrescriptions(user_id: string, patient_id?: string) {
  let q = supabase
    .from("pasion_prescriptions")
    .select("*, pasion_prescription_items(*)")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });
  if (patient_id) q = q.eq("patient_id", patient_id);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function listRenewalPlans(user_id: string, patient_id?: string) {
  let q = supabase
    .from("pasion_renewal_plans")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });
  if (patient_id) q = q.eq("patient_id", patient_id);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
