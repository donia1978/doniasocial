import { supabase } from "@/lib/supabaseClient";

export type CnamMedication = {
  id: string;
  dci: string;
  atc: string | null;
  form: string | null;
  strength: string | null;
  reimbursable: boolean | null;
};

export async function searchCnamMedications(q: string, limit = 12): Promise<CnamMedication[]> {
  const query = (q ?? "").trim();
  if (query.length < 2) return [];

  const { data, error } = await supabase
    .from("cnam_medications")
    .select("id,dci,atc,form,strength,reimbursable")
    .eq("country_code", "TN")
    .eq("payer", "CNAM")
    .ilike("dci", %%)
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as any;
}
